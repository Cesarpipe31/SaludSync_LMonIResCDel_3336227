<?php
// controls/pagos/historial_transacciones.php
// Historial de facturas de suscripción SaaS y su estado de pago (RF-PLA-04).
// Método: GET ?accion=listar -> { transacciones: [...] }. Respuesta: JSON uniforme { ok, mensaje, datos }.
//  - SuperAdmin: ve las facturas de todas las instituciones.
//  - Admin IPS: ve solo las de su institución (sale de la sesión, nunca del navegador).
//  - Recepción y Paciente: sus pagos (copagos y consultas) no están en esta versión -> 403.

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/sesion.php';
require_once __DIR__ . '/../../config/plataforma.php';
require_once __DIR__ . '/../../config/pagos.php';

exigirMetodo('GET');
$actor = requerirSesion();
if (!in_array($actor['id_rol'], [ROL_SUPERADMIN, ROL_ADMIN_IPS], true)) {
    responderError('Los pagos de pacientes (copagos y consultas) no están disponibles en esta versión.', 403);
}
if (($_GET['accion'] ?? '') !== 'listar') {
    responderError('Acción no válida.', 400);
}

try {
    sincronizarEstados($conexion); // una factura Pendiente vencida pasa a Mora

    $soloMiInstitucion = $actor['id_rol'] === ROL_ADMIN_IPS;
    $consulta = $conexion->prepare(
        SQL_FACTURA_CON_INSTITUCION . ($soloMiInstitucion ? ' WHERE s.id_institucion = ?' : '')
        . ' ORDER BY COALESCE(f.fecha_pago, f.fecha_emision) DESC, f.id_factura DESC LIMIT ?'
    );
    $posicion = 1;
    if ($soloMiInstitucion) {
        $consulta->bindValue($posicion++, $actor['id_institucion'], PDO::PARAM_INT);
    }
    $consulta->bindValue($posicion, LIMITE_HISTORIAL_PAGOS, PDO::PARAM_INT);
    $consulta->execute();

    responderExito('Historial de transacciones.', [
        'transacciones' => array_map('formatoFactura', $consulta->fetchAll()),
    ]);
} catch (Throwable $e) {
    responderErrorInterno('historial_transacciones.php', $e);
}