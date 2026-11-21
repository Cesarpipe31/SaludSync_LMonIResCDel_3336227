<?php
// config/pagos.php
// Reglas y consultas compartidas por los controladores de controls/pagos/ (M1-B).
// Aquí "pago" significa registrar el pago de una factura de suscripción SaaS (tabla factura_saas).
// No hay pasarela real: el servidor registra el pago, pero no cobra dinero ni recibe datos de tarjeta.

require_once __DIR__ . '/respuesta.php';

const CONCEPTO_FACTURA_SAAS = 'Suscripción SaaS';
const LIMITE_HISTORIAL_PAGOS = 200;

// Medios que ofrece la vista -> valor de factura_saas.metodo_pago (ENUM: Transferencia, Tarjeta de Crédito, PSE, Otro).
// El ENUM no distingue billeteras: Nequi, Daviplata y Efecty se guardan como "Otro" (el medio exacto queda en auditoría).
const METODOS_PAGO_FACTURA = [
    'tarjeta'   => 'Tarjeta de Crédito',
    'pse'       => 'PSE',
    'nequi'     => 'Otro',
    'daviplata' => 'Otro',
    'efecty'    => 'Otro',
];

/** Convierte una fila de factura_saas (con institución) al formato que consume pagos.js. */
function formatoFactura(array $f): array
{
    return [
        'id' => (int)$f['id_factura'], 'numero' => $f['numero_factura'], 'referencia' => $f['numero_factura'],
        'concepto' => CONCEPTO_FACTURA_SAAS, 'inst' => (int)$f['id_institucion'], 'institucion' => $f['razon_social'],
        'actor_origen' => 'IPS', 'actor_id' => (int)$f['id_institucion'],
        'fecha' => $f['fecha_pago'] ?? $f['fecha_emision'], 'emision' => $f['fecha_emision'],
        'vence' => $f['fecha_vencimiento'], 'fecha_pago' => $f['fecha_pago'],
        'subtotal' => (float)$f['subtotal'], 'impuestos' => (float)$f['impuestos'], 'monto' => (float)$f['total'],
        'moneda' => 'COP', 'estado' => $f['estado_pago'], 'metodo' => $f['metodo_pago'] ?? '—',
    ];
}

const SQL_FACTURA_CON_INSTITUCION =
    'SELECT f.*, s.id_institucion, i.razon_social
       FROM factura_saas f
       INNER JOIN suscripcion s ON s.id_suscripcion = f.id_suscripcion
       INNER JOIN institucion i ON i.id_institucion = s.id_institucion';

/** Una factura por su número, restringida a una institución (null = cualquiera). Con $bloquear usa FOR UPDATE. */
function buscarFacturaPorNumero(PDO $conexion, string $numero, ?int $idInstitucion, bool $bloquear = false): ?array
{
    $sql = SQL_FACTURA_CON_INSTITUCION . ' WHERE f.numero_factura = ?' . ($idInstitucion !== null ? ' AND s.id_institucion = ?' : '')
         . ($bloquear ? ' FOR UPDATE' : '');
    $consulta = $conexion->prepare($sql);
    $consulta->execute($idInstitucion !== null ? [$numero, $idInstitucion] : [$numero]);
    return $consulta->fetch() ?: null;
}

/** Una factura se puede pagar solo si está Pendiente o en Mora. */
function facturaPagable(array $factura): bool
{
    return in_array($factura['estado_pago'], ['Pendiente', 'Mora'], true);
}