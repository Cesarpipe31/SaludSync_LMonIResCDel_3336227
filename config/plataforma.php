<?php
// config/plataforma.php
// Reglas y consultas compartidas del módulo Plataforma SaaS (M1): estado de las suscripciones,
// lectura de catálogos y facturación automática (RF-PLA-03 y RF-PLA-04).
// Lo usan los controladores de controls/plataforma/ y, más adelante, los de pagos.

require_once __DIR__ . '/respuesta.php';

const IVA_PORCENTAJE           = 19;  // la semilla de factura_saas usa 19 % (100000 -> 19000)
const PLAZO_PAGO_DIAS          = 15;  // en la semilla, fecha_vencimiento = fecha_emision + 15 días
const DIAS_POR_VENCER          = 30;  // umbral de "Por Vencer" que ya usa la vista planes_suscripciones
const MESES_FACTURADOS_ANUAL   = 10;  // la vista muestra el plan anual como 10 mensualidades
const PERIODOS_SUSCRIPCION     = ['mensual', 'anual'];
const LIMITE_LISTADO_INSTITUCIONES = 500;
const LIMITE_LISTADO_FACTURAS  = 200;

/** Cancela la transacción abierta (si la hay) y responde con el error indicado. */
function abortar(PDO $conexion, string $mensaje, int $codigo, ?array $datos = null): never
{
    if ($conexion->inTransaction()) {
        $conexion->rollBack();
    }
    responderError($mensaje, $codigo, $datos);
}

/** Catálogo de los 15 módulos funcionales con el código que usa la vista (MOD-01 ... MOD-15). */
function catalogoModulos(): array
{
    return array_map(static fn(int $n): string => sprintf('MOD-%02d', $n), range(1, 15));
}

/**
 * La semilla mezcla 'M01' y 'MOD-02' (H-10). Aquí todo se lleva al formato MOD-NN;
 * devuelve null si el código no corresponde a uno de los 15 módulos.
 */
function normalizarCodigoModulo(string $codigo): ?string
{
    if (preg_match('/^(?:M|MOD-?)(\d{1,2})$/i', trim($codigo), $m)) {
        $n = (int)$m[1];
        if ($n >= 1 && $n <= 15) {
            return sprintf('MOD-%02d', $n);
        }
    }
    return null;
}

/** Dígito de verificación del NIT (algoritmo DIAN), el mismo que calcula la vista. */
function calcularDvNit(string $nit): string
{
    $pesos  = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
    $suma   = 0;
    foreach (array_reverse(str_split($nit)) as $i => $digito) {
        $suma += (int)$digito * $pesos[$i];
    }
    $resto = $suma % 11;
    return (string)($resto > 1 ? 11 - $resto : $resto);
}

/** RF-PLA-03: estado de una suscripción a partir de su fecha de corte. */
function estadoPorFechaCorte(string $fechaCorte, ?DateTimeImmutable $hoy = null): string
{
    $hoy  ??= new DateTimeImmutable('today');
    $dias   = (int)$hoy->diff(new DateTimeImmutable($fechaCorte))->format('%r%a');
    if ($dias < 0) {
        return 'Vencida';
    }
    return $dias <= DIAS_POR_VENCER ? 'Por Vencer' : 'Vigente';
}

/**
 * Mantiene en la BD los estados que dependen del calendario:
 *  - suscripcion.estado según fecha_corte (Vigente / Por Vencer / Vencida);
 *  - factura_saas: una factura Pendiente cuya fecha de vencimiento ya pasó queda en Mora.
 * Es idempotente: solo toca las filas cuyo estado cambió.
 */
function sincronizarEstados(PDO $conexion): void
{
    $calculado = "CASE WHEN fecha_corte < CURDATE() THEN 'Vencida'
                       WHEN fecha_corte <= DATE_ADD(CURDATE(), INTERVAL ? DAY) THEN 'Por Vencer'
                       ELSE 'Vigente' END";
    $conexion->prepare("UPDATE suscripcion SET estado = $calculado WHERE estado <> $calculado")
        ->execute([DIAS_POR_VENCER, DIAS_POR_VENCER]);

    $conexion->exec("UPDATE factura_saas SET estado_pago = 'Mora'
                      WHERE estado_pago = 'Pendiente' AND fecha_vencimiento < CURDATE()");
}

/** Suma un mes o un año sin desbordar el mes (31 de enero + 1 mes = 28/29 de febrero). */
function sumarPeriodo(string $inicio, string $periodo): string
{
    $fecha   = new DateTimeImmutable($inicio);
    $meses   = $periodo === 'anual' ? 12 : 1;
    $primero = $fecha->modify('first day of this month')->modify("+{$meses} months");
    $dia     = min((int)$fecha->format('j'), (int)$primero->format('t'));
    return $primero->setDate((int)$primero->format('Y'), (int)$primero->format('n'), $dia)->format('Y-m-d');
}

/** Convierte centavos enteros a texto decimal ('119000.00') sin usar números flotantes. */
function centavosADecimal(int $centavos): string
{
    return sprintf('%d.%02d', intdiv($centavos, 100), $centavos % 100);
}

/** RF-PLA-04: subtotal, impuestos y total de una factura, calculados en el servidor con enteros. */
function calcularMontosFactura(string $tarifaMensual, string $periodo): array
{
    $centavos = (int)round(((float)$tarifaMensual) * 100);
    $meses    = $periodo === 'anual' ? MESES_FACTURADOS_ANUAL : 1;
    $subtotal = $centavos * $meses;
    $impuesto = intdiv($subtotal * IVA_PORCENTAJE + 50, 100); // redondeo al centavo más cercano
    return [
        'subtotal'  => centavosADecimal($subtotal),
        'impuestos' => centavosADecimal($impuesto),
        'total'     => centavosADecimal($subtotal + $impuesto),
    ];
}

/**
 * RF-PLA-04: genera y guarda la factura de una suscripción. Debe llamarse dentro de la
 * transacción que crea la suscripción. El número definitivo es FAC-<id>, como en la semilla.
 */
function generarFactura(PDO $conexion, int $idSuscripcion, string $tarifaMensual, string $periodo): array
{
    $montos = calcularMontosFactura($tarifaMensual, $periodo);
    $hoy    = new DateTimeImmutable('today');
    $vence  = $hoy->modify('+' . PLAZO_PAGO_DIAS . ' days');

    // Se inserta con un número provisional único y se corrige al conocer el id autogenerado.
    $conexion->prepare(
        "INSERT INTO factura_saas
            (id_suscripcion, numero_factura, fecha_emision, fecha_vencimiento, subtotal, impuestos, total, estado_pago)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Pendiente')"
    )->execute([
        $idSuscripcion, 'TMP-' . bin2hex(random_bytes(8)), $hoy->format('Y-m-d'), $vence->format('Y-m-d'),
        $montos['subtotal'], $montos['impuestos'], $montos['total'],
    ]);
    $idFactura = (int)$conexion->lastInsertId();
    $numero    = 'FAC-' . $idFactura;
    $conexion->prepare('UPDATE factura_saas SET numero_factura = ? WHERE id_factura = ?')->execute([$numero, $idFactura]);

    return ['id' => $idFactura, 'numero' => $numero, 'emision' => $hoy->format('Y-m-d'),
            'vence' => $vence->format('Y-m-d')] + $montos;
}

/* ---------------- Lecturas (el formato coincide con el que ya consume plataforma.js) ---------------- */

function leerPlanes(PDO $conexion): array
{
    $modulos = [];
    foreach ($conexion->query('SELECT id_plan, codigo_modulo FROM plan_modulo_funcional WHERE habilitado = 1') as $fila) {
        $codigo = normalizarCodigoModulo($fila['codigo_modulo']);
        if ($codigo !== null) {
            $modulos[(int)$fila['id_plan']][$codigo] = true;
        }
    }
    $planes = [];
    foreach ($conexion->query('SELECT * FROM plan_comercial ORDER BY id_plan') as $p) {
        $codigos = array_keys($modulos[(int)$p['id_plan']] ?? []);
        sort($codigos);
        $planes[] = [
            'id' => (int)$p['id_plan'], 'nombre' => $p['nombre_plan'], 'tarifa' => (float)$p['tarifa_mensual'],
            'medicos' => (int)$p['limite_medicos'], 'pacientes' => (int)$p['limite_pacientes'],
            'estado' => $p['estado'], 'modulos' => $codigos,
        ];
    }
    return $planes;
}

function leerInstituciones(PDO $conexion): array
{
    $consulta = $conexion->prepare('SELECT * FROM institucion ORDER BY id_institucion LIMIT ?');
    $consulta->bindValue(1, LIMITE_LISTADO_INSTITUCIONES, PDO::PARAM_INT);
    $consulta->execute();
    $lista = [];
    foreach ($consulta as $i) {
        // En la BD el NIT se guarda con su dígito de verificación: "900111221-1".
        [$digitos, $dv] = array_pad(explode('-', $i['nit'], 2), 2, '');
        $lista[] = [
            'id' => (int)$i['id_institucion'], 'razon' => $i['razon_social'], 'nit' => $digitos,
            'dv' => $dv !== '' ? $dv : calcularDvNit($digitos), 'reps' => $i['codigo_reps'],
            'rep_nombre' => $i['representante_legal_nombre'] ?? '', 'rep_doc' => $i['representante_legal_documento'] ?? '',
            'depto' => $i['departamento'], 'ciudad' => $i['ciudad'], 'direccion' => $i['direccion'],
            'tel' => $i['telefono'] ?? '', 'correo' => $i['correo_contacto'], 'estado' => $i['estado'],
            'servicios' => [], // el esquema no tiene dónde guardarlos
        ];
    }
    return $lista;
}

/** Suscripción actual de cada institución: la de fecha de inicio más reciente. */
function leerSuscripcionesActuales(PDO $conexion): array
{
    $filas = $conexion->query(
        'SELECT s.id_suscripcion, s.id_institucion, s.id_plan, s.fecha_inicio, s.fecha_corte, s.estado
           FROM suscripcion s
          WHERE s.id_suscripcion = (SELECT s2.id_suscripcion FROM suscripcion s2
                                     WHERE s2.id_institucion = s.id_institucion
                                     ORDER BY s2.fecha_inicio DESC, s2.id_suscripcion DESC LIMIT 1)
          ORDER BY s.id_institucion'
    )->fetchAll();
    return array_map(static fn(array $s): array => [
        'id' => (int)$s['id_suscripcion'], 'inst' => (int)$s['id_institucion'], 'plan' => (int)$s['id_plan'],
        'inicio' => $s['fecha_inicio'], 'corte' => $s['fecha_corte'], 'estado' => $s['estado'],
    ], $filas);
}

function leerFacturas(PDO $conexion): array
{
    $consulta = $conexion->prepare(
        'SELECT f.*, s.id_institucion
           FROM factura_saas f INNER JOIN suscripcion s ON s.id_suscripcion = f.id_suscripcion
          ORDER BY f.fecha_emision DESC, f.id_factura DESC LIMIT ?'
    );
    $consulta->bindValue(1, LIMITE_LISTADO_FACTURAS, PDO::PARAM_INT);
    $consulta->execute();
    return array_map(static fn(array $f): array => [
        'id' => (int)$f['id_factura'], 'numero' => $f['numero_factura'], 'susc' => (int)$f['id_suscripcion'],
        'inst' => (int)$f['id_institucion'], 'emision' => $f['fecha_emision'], 'vence' => $f['fecha_vencimiento'],
        'subtotal' => (float)$f['subtotal'], 'impuestos' => (float)$f['impuestos'], 'total' => (float)$f['total'],
        'estado' => $f['estado_pago'], 'fecha_pago' => $f['fecha_pago'], 'metodo' => $f['metodo_pago'],
    ], $consulta->fetchAll());
}