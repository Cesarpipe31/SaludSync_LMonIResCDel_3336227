<?php
// controls/seguridad/recuperar_contrasena.php
// Recuperación de contraseña por enlace con token de un solo uso. Atiende la vista recuperar_contrasena.html.
// Público (el usuario no tiene sesión). Respuesta: JSON uniforme { ok, mensaje, datos }.
//
//   POST { accion: 'solicitar',   correo }            -> 200 SIEMPRE con el mismo mensaje (no revela si el correo existe)
//   POST { accion: 'restablecer', token, nueva }      -> 200 | 400 si el enlace no es válido o expiró
//
// XAMPP no envía correos: el enlace se escribe en el registro de errores del servidor (php_error_log) SOLO para
// poder demostrar el flujo. El navegador nunca recibe el token en la respuesta; en producción se enviaría por correo.
// En la BD se guarda el hash SHA-256 del token, no el token.

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/usuarios.php';

const VIGENCIA_TOKEN_MINUTOS = 30;
const MENSAJE_SOLICITUD = 'Si el correo está registrado, recibirá un enlace para restablecer su contraseña.';

/** Enlace de la vista de recuperación, derivado de la ruta de este script (no depende del nombre de la carpeta). */
function enlaceRecuperacion(string $token): string
{
    $base = dirname($_SERVER['SCRIPT_NAME'], 3);
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    return "http://{$host}" . rtrim($base, '/') . '/views/seguridad/recuperar_contrasena.html?token=' . $token;
}

function solicitarRecuperacion(PDO $conexion, array $entrada): never
{
    $correo = correoObligatorio($entrada, 'correo');

    $consulta = $conexion->prepare('SELECT id_usuario, estado, token_expiracion FROM usuario WHERE correo_electronico = ? LIMIT 2');
    $consulta->execute([$correo]);
    $filas = $consulta->fetchAll();

    // Solo se genera token si el correo identifica a UNA cuenta Activa o Bloqueada (recuperar la clave desbloquea la cuenta).
    if (count($filas) === 1 && in_array($filas[0]['estado'], ['Activo', 'Bloqueado'], true)) {
        $idUsuario = (int)$filas[0]['id_usuario'];
        // Freno anti-correo masivo: si ya se pidió un enlace hace menos de 1 minuto, no se genera otro.
        $reciente = $conexion->prepare('SELECT 1 FROM usuario WHERE id_usuario = ? AND token_expiracion > DATE_ADD(NOW(), INTERVAL ? MINUTE)');
        $reciente->execute([$idUsuario, VIGENCIA_TOKEN_MINUTOS - 1]);
        if (!$reciente->fetchColumn()) {
            $token = bin2hex(random_bytes(32));
            $conexion->prepare(
                'UPDATE usuario SET token_recuperacion = ?, token_expiracion = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id_usuario = ?'
            )->execute([hash('sha256', $token), VIGENCIA_TOKEN_MINUTOS, $idUsuario]);
            error_log("RECUPERACION (solo desarrollo) usuario #{$idUsuario}: " . enlaceRecuperacion($token));
        }
    }
    responderExito(MENSAJE_SOLICITUD);
}

function restablecerClave(PDO $conexion, array $entrada): never
{
    $token = limpiarTexto($entrada['token'] ?? '');
    if (!preg_match('/^[0-9a-f]{64}$/', $token)) {
        responderError('El enlace no es válido o ya expiró. Solicite uno nuevo.', 400);
    }
    $nueva = claveFuerte($entrada, 'nueva', 'Nueva contraseña');

    $conexion->beginTransaction();
    try {
        $consulta = $conexion->prepare(
            "SELECT id_usuario, estado, intentos_fallidos FROM usuario
              WHERE token_recuperacion = ? AND token_expiracion > NOW() AND estado IN ('Activo', 'Bloqueado') FOR UPDATE"
        );
        $consulta->execute([hash('sha256', $token)]);
        $usuario = $consulta->fetch();
        if (!$usuario) {
            cancelar($conexion, 'El enlace no es válido o ya expiró. Solicite uno nuevo.', 400);
        }

        // Token de un solo uso: se borra al usarlo. Recuperar la clave también desbloquea la cuenta.
        $conexion->prepare(
            "UPDATE usuario SET contrasena_hash = ?, token_recuperacion = NULL, token_expiracion = NULL,
                    intentos_fallidos = 0, estado = 'Activo' WHERE id_usuario = ?"
        )->execute([password_hash($nueva, PASSWORD_BCRYPT), $usuario['id_usuario']]);

        auditar($conexion, (int)$usuario['id_usuario'], 'usuario', (int)$usuario['id_usuario'], 'Modificación',
                ['contrasena_hash' => '***', 'estado' => $usuario['estado']],
                ['contrasena_hash' => '***', 'estado' => 'Activo', 'origen' => 'recuperacion']);
        $conexion->commit();
    } catch (Throwable $t) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        throw $t;
    }
    responderExito('Contraseña actualizada correctamente.');
}

/* ---------------- Punto de entrada ---------------- */

exigirMetodo('POST');

try {
    $entrada = leerEntradaJson();
    match ($entrada['accion'] ?? '') {
        'solicitar'   => solicitarRecuperacion($conexion, $entrada),
        'restablecer' => restablecerClave($conexion, $entrada),
        default       => responderError('Acción no válida.', 400),
    };
} catch (ErrorValidacion $e) {
    responderError($e->getMessage(), 400);
} catch (Throwable $e) {
    responderErrorInterno('recuperar_contrasena.php', $e);
}