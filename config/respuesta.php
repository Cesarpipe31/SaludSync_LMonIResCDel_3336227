<?php
// config/respuesta.php
// Respuestas uniformes para todos los controladores.
// Contrato JSON del proyecto: { "ok": true|false, "mensaje": "...", "datos": ... }

/** Envía el JSON uniforme con el código HTTP indicado y termina la ejecución. */
function responderJson(bool $ok, string $mensaje, mixed $datos = null, int $codigo = 200): never
{
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store'); // datos clínicos: que el navegador no los guarde
    echo json_encode(
        ['ok' => $ok, 'mensaje' => $mensaje, 'datos' => $datos],
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

/** Atajo para respuestas correctas (200 por defecto, 201 al crear). */
function responderExito(string $mensaje, mixed $datos = null, int $codigo = 200): never
{
    responderJson(true, $mensaje, $datos, $codigo);
}

/** Atajo para errores controlados: 400, 401, 403, 404, 409... */
function responderError(string $mensaje, int $codigo = 400, mixed $datos = null): never
{
    responderJson(false, $mensaje, $datos, $codigo);
}

/** Responde 405 si el método HTTP de la petición no está en la lista permitida. */
function exigirMetodo(string ...$permitidos): void
{
    $metodo = $_SERVER['REQUEST_METHOD'] ?? '';
    if (!in_array($metodo, $permitidos, true)) {
        header('Allow: ' . implode(', ', $permitidos));
        responderError('Método no permitido.', 405);
    }
}

/** Lee el cuerpo JSON de un fetch. Devuelve [] si el cuerpo viene vacío. */
function leerEntradaJson(): array
{
    $crudo = file_get_contents('php://input');
    if ($crudo === false || trim($crudo) === '') {
        return [];
    }
    $datos = json_decode($crudo, true);
    if (!is_array($datos)) {
        responderError('El cuerpo de la petición no es un JSON válido.', 400);
    }
    return $datos;
}

/** Error técnico inesperado: el detalle va al log y el usuario recibe un mensaje genérico. */
function responderErrorInterno(string $contexto, Throwable $e): never
{
    error_log($contexto . ': ' . $e->getMessage());
    responderError('No fue posible completar la operación. Intente de nuevo más tarde.', 500);
}

/**
 * Redirección RELATIVA a la URL del controlador (nunca lleva el nombre de la carpeta del proyecto).
 * Ejemplo desde controls/seguridad/login.php: redirigir('../../views/seguridad/login.html', ['error' => 'credenciales']).
 */
function redirigir(string $destino, array $parametros = []): never
{
    $url = $destino . ($parametros ? '?' . http_build_query($parametros) : '');
    header('Location: ' . $url);
    exit;
}