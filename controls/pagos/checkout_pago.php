<?php
// controls/pagos/checkout_pago.php
// Pago de la factura de suscripción SaaS por parte de la institución (RF-PLA-04). Rol: Admin IPS.
// Respuesta: JSON uniforme { ok, mensaje, datos }.
//
//   GET  ?accion=orden[&factura=FAC-14]      -> { factura } | { factura: null } si no hay nada pendiente
//   POST { accion: 'pagar', numero_factura, metodo }   (metodo: tarjeta | pse | nequi | daviplata | efecty)
//
// IMPORTANTE: no hay pasarela real. El servidor registra el pago (estado Pagada, fecha y medio) pero
// NO cobra dinero y NUNCA recibe número de tarjeta, CVV ni celular: esos campos de la vista no se envían.
// El monto sale de factura_saas.total, no del navegador.

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/sesion.php';
require_once __DIR__ . '/../../config/validacion.php';
require_once __DIR__ . '/../../config/auditoria.php';
require_once __DIR__ . '/../../config/plataforma.php';
require_once __DIR__ . '/../../config/pagos.php';

/** Número de factura con el formato FAC-<id>. */
function numeroFacturaValido(array $entrada, string $campo): string
{
    $numero = limpiarTexto($entrada[$campo] ?? '');
    if (!preg_match('/^FAC-\d{1,10}$/', $numero)) {
        throw new ErrorValidacion('El número de factura no es válido.');
    }
    return $numero;
}

/** Texto de error cuando una factura ya no se puede pagar. */
function mensajeNoPagable(array $factura): string
{
    return $factura['estado_pago'] === 'Pagada'
        ? "La factura {$factura['numero_factura']} ya fue pagada."
        : "La factura {$factura['numero_factura']} está anulada y no se puede pagar.";
}

function consultarOrden(PDO $conexion, array $actor): never
{
    sincronizarEstados($conexion);
    $idInstitucion = (int)$actor['id_institucion'];

    if (isset($_GET['factura'])) {
        $numero  = numeroFacturaValido($_GET, 'factura');
        // Una factura de otra institución se responde como "no existe" para no revelar que existe.
        $factura = buscarFacturaPorNumero($conexion, $numero, $idInstitucion);
        if ($factura === null) {
            responderError('La factura no existe.', 404);
        }
        if (!facturaPagable($factura)) {
            responderError(mensajeNoPagable($factura), 409);
        }
        responderExito('Orden de pago.', ['factura' => formatoFactura($factura)]);
    }

    // Sin número: la factura pendiente más antigua de la institución.
    $consulta = $conexion->prepare(
        SQL_FACTURA_CON_INSTITUCION . " WHERE s.id_institucion = ? AND f.estado_pago IN ('Pendiente', 'Mora')
         ORDER BY f.fecha_vencimiento ASC, f.id_factura ASC LIMIT 1"
    );
    $consulta->execute([$idInstitucion]);
    $factura = $consulta->fetch();
    responderExito(
        $factura ? 'Orden de pago.' : 'No hay facturas pendientes de pago.',
        ['factura' => $factura ? formatoFactura($factura) : null]
    );
}

function pagarFactura(PDO $conexion, array $actor, array $entrada): never
{
    $numero = numeroFacturaValido($entrada, 'numero_factura');
    $medio  = enumObligatorio($entrada, 'metodo', 'Método de pago', [...array_keys(METODOS_PAGO_FACTURA), 'copago']);
    if ($medio === 'copago') {
        responderError('El copago institucional no está disponible en esta versión.', 400);
    }
    $metodoBd = METODOS_PAGO_FACTURA[$medio];
    $hoy      = (new DateTimeImmutable('today'))->format('Y-m-d');

    $conexion->beginTransaction();
    try {
        // FOR UPDATE: dos pagos simultáneos de la misma factura no pasan los dos.
        $factura = buscarFacturaPorNumero($conexion, $numero, (int)$actor['id_institucion'], true);
        if ($factura === null) {
            abortar($conexion, 'La factura no existe.', 404);
        }
        if (!facturaPagable($factura)) {
            abortar($conexion, mensajeNoPagable($factura), 409);
        }

        $conexion->prepare(
            "UPDATE factura_saas SET estado_pago = 'Pagada', fecha_pago = ?, metodo_pago = ? WHERE id_factura = ?"
        )->execute([$hoy, $metodoBd, $factura['id_factura']]);

        auditar($conexion, $actor['id_usuario'], 'factura_saas', (int)$factura['id_factura'], 'Modificación',
                ['estado_pago' => $factura['estado_pago'], 'fecha_pago' => null, 'metodo_pago' => $factura['metodo_pago']],
                ['estado_pago' => 'Pagada', 'fecha_pago' => $hoy, 'metodo_pago' => $metodoBd, 'medio_elegido' => $medio]);
        $conexion->commit();
    } catch (Throwable $t) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        throw $t;
    }

    responderExito('Pago registrado correctamente.', [
        'numero' => $factura['numero_factura'], 'total' => (float)$factura['total'],
        'metodo' => $metodoBd, 'medio' => $medio, 'fecha_pago' => $hoy,
    ]);
}

/* ---------------- Punto de entrada ---------------- */

exigirMetodo('GET', 'POST');
$actor = requerirSesion();
if ($actor['id_rol'] !== ROL_ADMIN_IPS) {
    responderError('Solo el administrador de la institución puede pagar su suscripción. Los pagos de pacientes no están disponibles en esta versión.', 403);
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (($_GET['accion'] ?? '') !== 'orden') {
            responderError('Acción no válida.', 400);
        }
        consultarOrden($conexion, $actor);
    }

    exigirCsrf();
    $entrada = leerEntradaJson();
    match ($entrada['accion'] ?? '') {
        'pagar'  => pagarFactura($conexion, $actor, $entrada),
        default  => responderError('Acción no válida.', 400),
    };
} catch (ErrorValidacion $e) {
    responderError($e->getMessage(), 400);
} catch (Throwable $e) {
    responderErrorInterno('checkout_pago.php', $e);
}