<?php
// controls/plataforma/planes_suscripciones.php
// RF-PLA-02 (planes), RF-PLA-03 (suscripciones) y RF-PLA-04 (facturación automática).
// Atiende la vista planes_suscripciones.html. Rol permitido: SuperAdmin.
// Respuesta: JSON uniforme { ok, mensaje, datos }.
//
//   GET  ?accion=cargar                         -> { planes, instituciones, suscripciones, facturas }
//   POST { accion: 'guardar_plan', id?, nombre, tarifa, medicos, pacientes, estado, modulos[] }
//   POST { accion: 'asociar', inst, plan, inicio, periodo }  -> 201 { suscripcion, factura }
// Los POST exigen el token CSRF (cabecera X-CSRF-Token).

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/sesion.php';
require_once __DIR__ . '/../../config/validacion.php';
require_once __DIR__ . '/../../config/auditoria.php';
require_once __DIR__ . '/../../config/plataforma.php';

/* ---------------- Validación ---------------- */

function validarPlan(array $e): array
{
    $id = ($e['id'] ?? null) === null || $e['id'] === ''
        ? null
        : enteroObligatorio($e, 'id', 'Plan', 1, 4294967295);

    $modulosRecibidos = $e['modulos'] ?? [];
    if (!is_array($modulosRecibidos)) {
        throw new ErrorValidacion('Los módulos no tienen un formato válido.');
    }
    $modulos = [];
    foreach ($modulosRecibidos as $codigo) {
        $normalizado = is_string($codigo) ? normalizarCodigoModulo($codigo) : null;
        if ($normalizado === null) {
            throw new ErrorValidacion('Uno de los módulos seleccionados no es válido.');
        }
        $modulos[$normalizado] = true;
    }

    return [
        'id'        => $id,
        'nombre'    => textoObligatorio($e, 'nombre', 'Nombre del plan', 2, 50),
        'tarifa'    => sprintf('%.2f', decimalObligatorio($e, 'tarifa', 'Tarifa mensual', 1, 99999999)),
        'medicos'   => enteroObligatorio($e, 'medicos', 'Límite de médicos', 1, 100000),
        'pacientes' => enteroObligatorio($e, 'pacientes', 'Límite de pacientes', 1, 10000000),
        'estado'    => enumObligatorio($e, 'estado', 'Estado', ['Activo', 'Inactivo']),
        'modulos'   => array_keys($modulos),
    ];
}

/** Módulos habilitados de un plan, ya normalizados (para auditoría). */
function modulosHabilitados(PDO $conexion, int $idPlan): array
{
    $consulta = $conexion->prepare('SELECT codigo_modulo FROM plan_modulo_funcional WHERE id_plan = ? AND habilitado = 1');
    $consulta->execute([$idPlan]);
    $codigos = [];
    foreach ($consulta->fetchAll(PDO::FETCH_COLUMN) as $codigo) {
        $n = normalizarCodigoModulo($codigo);
        if ($n !== null) {
            $codigos[$n] = true;
        }
    }
    $lista = array_keys($codigos);
    sort($lista);
    return $lista;
}

/* ---------------- Acciones ---------------- */

function cargarTodo(PDO $conexion): never
{
    sincronizarEstados($conexion);
    responderExito('Planes, suscripciones y facturas.', [
        'planes'        => leerPlanes($conexion),
        'instituciones' => leerInstituciones($conexion),
        'suscripciones' => leerSuscripcionesActuales($conexion),
        'facturas'      => leerFacturas($conexion),
    ]);
}

/** RF-PLA-02: crea o actualiza un plan con su tarifa, límites y módulos habilitados. */
function guardarPlan(PDO $conexion, array $actor, array $entrada): never
{
    $p = validarPlan($entrada);

    $conexion->beginTransaction();
    try {
        $antes = null;
        if ($p['id'] !== null) {
            $actual = $conexion->prepare('SELECT * FROM plan_comercial WHERE id_plan = ? FOR UPDATE');
            $actual->execute([$p['id']]);
            $antes = $actual->fetch();
            if (!$antes) {
                abortar($conexion, 'El plan no existe.', 404);
            }
            $antes['modulos'] = modulosHabilitados($conexion, $p['id']);
        }

        $repetido = $conexion->prepare('SELECT 1 FROM plan_comercial WHERE nombre_plan = ? AND id_plan <> ? LIMIT 1 FOR UPDATE');
        $repetido->execute([$p['nombre'], $p['id'] ?? 0]);
        if ($repetido->fetchColumn()) {
            abortar($conexion, 'Ya existe un plan con ese nombre.', 409);
        }

        if ($p['id'] === null) {
            $conexion->prepare(
                'INSERT INTO plan_comercial (nombre_plan, tarifa_mensual, limite_medicos, limite_pacientes, estado)
                 VALUES (?, ?, ?, ?, ?)'
            )->execute([$p['nombre'], $p['tarifa'], $p['medicos'], $p['pacientes'], $p['estado']]);
            $idPlan = (int)$conexion->lastInsertId();
        } else {
            $idPlan = $p['id'];
            $conexion->prepare(
                'UPDATE plan_comercial SET nombre_plan = ?, tarifa_mensual = ?, limite_medicos = ?,
                        limite_pacientes = ?, estado = ? WHERE id_plan = ?'
            )->execute([$p['nombre'], $p['tarifa'], $p['medicos'], $p['pacientes'], $p['estado'], $idPlan]);
        }

        // Se reescriben los 15 módulos con su bandera (esto también normaliza los códigos 'M01' de la semilla).
        $conexion->prepare('DELETE FROM plan_modulo_funcional WHERE id_plan = ?')->execute([$idPlan]);
        $insertar = $conexion->prepare('INSERT INTO plan_modulo_funcional (id_plan, codigo_modulo, habilitado) VALUES (?, ?, ?)');
        foreach (catalogoModulos() as $codigo) {
            $insertar->execute([$idPlan, $codigo, in_array($codigo, $p['modulos'], true) ? 1 : 0]);
        }

        $nuevo = ['nombre_plan' => $p['nombre'], 'tarifa_mensual' => $p['tarifa'], 'limite_medicos' => $p['medicos'],
                  'limite_pacientes' => $p['pacientes'], 'estado' => $p['estado'], 'modulos' => $p['modulos']];
        $anterior = $antes === null ? null : [
            'nombre_plan' => $antes['nombre_plan'], 'tarifa_mensual' => $antes['tarifa_mensual'],
            'limite_medicos' => $antes['limite_medicos'], 'limite_pacientes' => $antes['limite_pacientes'],
            'estado' => $antes['estado'], 'modulos' => $antes['modulos'],
        ];
        sort($nuevo['modulos']);
        auditar($conexion, $actor['id_usuario'], 'plan_comercial', $idPlan, $antes === null ? 'Creación' : 'Modificación', $anterior, $nuevo);
        $conexion->commit();
    } catch (Throwable $t) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        throw $t;
    }
    responderExito('Plan guardado correctamente.', ['id' => $idPlan], $p['id'] === null ? 201 : 200);
}

/**
 * RF-PLA-03 + RF-PLA-04: vincula una institución a un plan, calcula la fecha de corte
 * y genera la factura en la misma transacción. Cada renovación o cambio crea una suscripción
 * nueva (el historial se conserva); la actual es la de fecha de inicio más reciente.
 */
function asociarSuscripcion(PDO $conexion, array $actor, array $entrada): never
{
    $idInstitucion = enteroObligatorio($entrada, 'inst', 'Institución', 1, 4294967295);
    $idPlan        = enteroObligatorio($entrada, 'plan', 'Plan', 1, 4294967295);
    $inicio        = fechaObligatoria($entrada, 'inicio', 'Fecha de inicio');
    $periodo       = enumObligatorio($entrada, 'periodo', 'Periodo', PERIODOS_SUSCRIPCION);

    $hoy = new DateTimeImmutable('today');
    if ($inicio < $hoy->modify('-365 days')->format('Y-m-d') || $inicio > $hoy->modify('+365 days')->format('Y-m-d')) {
        throw new ErrorValidacion('La fecha de inicio debe estar dentro de un año hacia atrás o adelante.');
    }
    $corte = sumarPeriodo($inicio, $periodo); // la calcula el servidor: el navegador no envía la fecha de corte

    $conexion->beginTransaction();
    try {
        $institucion = $conexion->prepare('SELECT estado FROM institucion WHERE id_institucion = ? FOR UPDATE');
        $institucion->execute([$idInstitucion]);
        $estadoInstitucion = $institucion->fetchColumn();
        if ($estadoInstitucion === false) {
            abortar($conexion, 'La institución no existe.', 404);
        }
        if ($estadoInstitucion !== 'Activa') {
            abortar($conexion, 'La institución está inactiva: actívela antes de asociarle un plan.', 409);
        }

        $plan = $conexion->prepare('SELECT tarifa_mensual, estado FROM plan_comercial WHERE id_plan = ? FOR UPDATE');
        $plan->execute([$idPlan]);
        $filaPlan = $plan->fetch();
        if (!$filaPlan) {
            abortar($conexion, 'El plan no existe.', 404);
        }
        if ($filaPlan['estado'] !== 'Activo') {
            abortar($conexion, 'El plan está inactivo y no admite nuevas suscripciones.', 409);
        }

        $ultima = $conexion->prepare(
            'SELECT id_plan, fecha_inicio FROM suscripcion WHERE id_institucion = ?
              ORDER BY fecha_inicio DESC, id_suscripcion DESC LIMIT 1 FOR UPDATE'
        );
        $ultima->execute([$idInstitucion]);
        $actual = $ultima->fetch();
        if ($actual && $actual['fecha_inicio'] === $inicio && (int)$actual['id_plan'] === $idPlan) {
            abortar($conexion, 'La institución ya tiene una suscripción a ese plan con esa fecha de inicio.', 409);
        }
        if ($actual && $inicio < $actual['fecha_inicio']) {
            abortar($conexion, 'La fecha de inicio no puede ser anterior a la de la suscripción actual (' . $actual['fecha_inicio'] . ').', 409);
        }

        $estado = estadoPorFechaCorte($corte, $hoy);
        $conexion->prepare(
            'INSERT INTO suscripcion (id_institucion, id_plan, fecha_inicio, fecha_corte, estado) VALUES (?, ?, ?, ?, ?)'
        )->execute([$idInstitucion, $idPlan, $inicio, $corte, $estado]);
        $idSuscripcion = (int)$conexion->lastInsertId();

        $factura = generarFactura($conexion, $idSuscripcion, $filaPlan['tarifa_mensual'], $periodo);

        auditar($conexion, $actor['id_usuario'], 'suscripcion', $idSuscripcion, 'Creación', null,
                ['id_institucion' => $idInstitucion, 'id_plan' => $idPlan, 'fecha_inicio' => $inicio,
                 'fecha_corte' => $corte, 'estado' => $estado]);
        auditar($conexion, $actor['id_usuario'], 'factura_saas', $factura['id'], 'Creación', null,
                ['numero_factura' => $factura['numero'], 'subtotal' => $factura['subtotal'],
                 'impuestos' => $factura['impuestos'], 'total' => $factura['total'], 'estado_pago' => 'Pendiente']);
        $conexion->commit();
    } catch (Throwable $t) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        throw $t;
    }

    responderExito('Suscripción registrada y factura generada.', [
        'suscripcion' => ['id' => $idSuscripcion, 'inst' => $idInstitucion, 'plan' => $idPlan,
                          'inicio' => $inicio, 'corte' => $corte, 'estado' => $estado],
        'factura'     => ['numero' => $factura['numero'], 'total' => (float)$factura['total'], 'vence' => $factura['vence']],
    ], 201);
}

/* ---------------- Punto de entrada ---------------- */

exigirMetodo('GET', 'POST');
$actor = requerirRol([ROL_SUPERADMIN]);

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (($_GET['accion'] ?? '') !== 'cargar') {
            responderError('Acción no válida.', 400);
        }
        cargarTodo($conexion);
    }

    exigirCsrf();
    $entrada = leerEntradaJson();
    match ($entrada['accion'] ?? '') {
        'guardar_plan' => guardarPlan($conexion, $actor, $entrada),
        'asociar'      => asociarSuscripcion($conexion, $actor, $entrada),
        default        => responderError('Acción no válida.', 400),
    };
} catch (ErrorValidacion $e) {
    responderError($e->getMessage(), 400);
} catch (PDOException $e) {
    if (($e->errorInfo[1] ?? 0) === 1062) { // última defensa: índice único de la BD
        responderError('Ya existe un registro con esos datos.', 409);
    }
    responderErrorInterno('planes_suscripciones.php', $e);
} catch (Throwable $e) {
    responderErrorInterno('planes_suscripciones.php', $e);
}