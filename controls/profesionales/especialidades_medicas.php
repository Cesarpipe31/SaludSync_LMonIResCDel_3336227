<?php
// controls/profesionales/especialidades_medicas.php
// Catálogo de especialidades de la institución (RF-PRO-02). Atiende la vista especialidades_medicas.html.
// Rol: Admin IPS (la institución sale de la sesión). Respuesta: JSON uniforme { ok, mensaje, datos }.
//
//   GET  ?accion=listar                                    -> { especialidades, kpis, institucion }
//   POST { accion: 'guardar', id?, codigo, nombre, desc, estado }   -> 201 al crear, 200 al editar
// Las especialidades no se borran: se inactivan. (La tabla puente profesional_especialidad se borra en cascada
// con la especialidad, por eso un DELETE destruiría los vínculos de los médicos.)
// Los POST exigen el token CSRF (cabecera X-CSRF-Token).

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/profesionales.php';

function listarCatalogo(PDO $conexion, array $actor): never
{
    $idInstitucion  = $actor['id_institucion'];
    $especialidades = leerEspecialidades($conexion, $idInstitucion);

    // Médicos ACTIVOS vinculados a cada especialidad (solo cuentan vínculos de la propia institución).
    $consulta = $conexion->prepare(
        "SELECT pe.id_especialidad, ps.id_profesional, ps.tarjeta_profesional, u.nombre_completo
           FROM profesional_especialidad pe
           INNER JOIN especialidad e ON e.id_especialidad = pe.id_especialidad
           INNER JOIN profesional_salud ps ON ps.id_profesional = pe.id_profesional
           INNER JOIN usuario u ON u.id_usuario = ps.id_usuario
          WHERE e.id_institucion = ? AND u.id_institucion = ? AND u.estado = 'Activo' ORDER BY u.nombre_completo"
    );
    $consulta->execute([$idInstitucion, $idInstitucion]);
    $medicos = [];
    foreach ($consulta as $f) {
        $medicos[(int)$f['id_especialidad']][] = ['id' => (int)$f['id_profesional'], 'nombre' => $f['nombre_completo'], 'tarjeta' => $f['tarjeta_profesional']];
    }
    foreach ($especialidades as &$e) {
        $e['medicos'] = $medicos[$e['id']] ?? [];
    }
    unset($e);

    $activos = $conexion->prepare(
        "SELECT COUNT(*) FROM profesional_salud ps INNER JOIN usuario u ON u.id_usuario = ps.id_usuario WHERE u.id_institucion = ? AND u.estado = 'Activo'"
    );
    $activos->execute([$idInstitucion]);

    responderExito('Catálogo de especialidades.', [
        'especialidades' => $especialidades,
        'kpis' => [
            'total' => count($especialidades),
            'activas' => count(array_filter($especialidades, static fn(array $e): bool => $e['estado'] === 'Activo')),
            'medicos' => (int)$activos->fetchColumn(),
            'sin_medico' => count(array_filter($especialidades, static fn(array $e): bool => $e['estado'] === 'Activo' && !$e['medicos'])),
        ],
        'institucion' => nombreInstitucionProfesional($conexion, $idInstitucion),
    ]);
}

function validarEspecialidad(array $e): array
{
    $codigo = strtoupper(limpiarTexto($e['codigo'] ?? ''));
    if (!preg_match('/^[A-Z0-9\-]{3,15}$/', $codigo)) {
        throw new ErrorValidacion('El código debe tener entre 3 y 15 caracteres (letras, números o guion).');
    }
    return [
        'id'     => ($e['id'] ?? null) === null || $e['id'] === '' ? null : enteroObligatorio($e, 'id', 'Especialidad', 1, 4294967295),
        'codigo' => $codigo,
        'nombre' => textoObligatorio($e, 'nombre', 'Nombre', 1, 60),
        'desc'   => textoOpcional($e, 'desc', 'Descripción', 255),
        'estado' => enumObligatorio($e, 'estado', 'Estado', ['Activo', 'Inactivo']),
    ];
}

function guardarEspecialidad(PDO $conexion, array $actor, array $entrada): never
{
    $d = validarEspecialidad($entrada);
    $idInstitucion = $actor['id_institucion'];
    $idEspecialidad = $d['id'] ?? 0;

    $conexion->beginTransaction();
    try {
        $conexion->prepare('SELECT id_institucion FROM institucion WHERE id_institucion = ? FOR UPDATE')->execute([$idInstitucion]);

        $antes = null;
        if ($d['id'] !== null) {
            $actual = $conexion->prepare('SELECT * FROM especialidad WHERE id_especialidad = ? AND id_institucion = ? FOR UPDATE');
            $actual->execute([$d['id'], $idInstitucion]);
            $antes = $actual->fetch();
            if (!$antes) {
                revertir($conexion, 'La especialidad no existe.', 404);
            }
        }

        // Código único por institución (lo exige el índice) y nombre único sin distinguir mayúsculas ni tildes (lo exige el servidor).
        $codigoRepetido = $conexion->prepare('SELECT 1 FROM especialidad WHERE id_institucion = ? AND codigo_especialidad = ? AND id_especialidad <> ? LIMIT 1 FOR UPDATE');
        $codigoRepetido->execute([$idInstitucion, $d['codigo'], $idEspecialidad]);
        if ($codigoRepetido->fetchColumn()) {
            revertir($conexion, 'Este código ya existe en la institución.', 409, ['campo' => 'codigo']);
        }
        $nombreRepetido = $conexion->prepare('SELECT 1 FROM especialidad WHERE id_institucion = ? AND nombre_especialidad = ? AND id_especialidad <> ? LIMIT 1 FOR UPDATE');
        $nombreRepetido->execute([$idInstitucion, $d['nombre'], $idEspecialidad]);
        if ($nombreRepetido->fetchColumn()) {
            revertir($conexion, 'Ya existe una especialidad con este nombre.', 409, ['campo' => 'nombre']);
        }

        if ($antes === null) {
            $conexion->prepare(
                'INSERT INTO especialidad (id_institucion, codigo_especialidad, nombre_especialidad, descripcion_servicio, estado) VALUES (?, ?, ?, ?, ?)'
            )->execute([$idInstitucion, $d['codigo'], $d['nombre'], $d['desc'], $d['estado']]);
            $idEspecialidad = (int)$conexion->lastInsertId();
            auditar($conexion, $actor['id_usuario'], 'especialidad', $idEspecialidad, 'Creación', null, ['codigo' => $d['codigo'], 'nombre' => $d['nombre']]);
        } else {
            $conexion->prepare(
                'UPDATE especialidad SET codigo_especialidad = ?, nombre_especialidad = ?, descripcion_servicio = ?, estado = ? WHERE id_especialidad = ?'
            )->execute([$d['codigo'], $d['nombre'], $d['desc'], $d['estado'], $idEspecialidad]);
            $anterior = $nuevo = [];
            foreach (['codigo_especialidad' => $d['codigo'], 'nombre_especialidad' => $d['nombre'], 'descripcion_servicio' => $d['desc'], 'estado' => $d['estado']] as $campo => $valor) {
                if ((string)$antes[$campo] !== (string)($valor ?? '')) {
                    $anterior[$campo] = $antes[$campo];
                    $nuevo[$campo]    = $valor;
                }
            }
            if ($nuevo) {
                auditar($conexion, $actor['id_usuario'], 'especialidad', $idEspecialidad, 'Modificación', $anterior, $nuevo);
            }
        }
        $conexion->commit();
    } catch (Throwable $t) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        throw $t;
    }
    responderExito($antes === null ? 'Especialidad creada correctamente.' : 'Especialidad actualizada correctamente.', ['id' => $idEspecialidad], $antes === null ? 201 : 200);
}

/* ---------------- Punto de entrada ---------------- */

exigirMetodo('GET', 'POST');
$actor = actorDeProfesionales(ROLES_ESCRIBE_PROFESIONALES, 'Solo el administrador de la institución gestiona las especialidades.');

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (($_GET['accion'] ?? '') !== 'listar') {
            responderError('Acción no válida.', 400);
        }
        listarCatalogo($conexion, $actor);
    }

    exigirCsrf();
    $entrada = leerEntradaJson();
    match ($entrada['accion'] ?? '') {
        'guardar' => guardarEspecialidad($conexion, $actor, $entrada),
        default   => responderError('Acción no válida.', 400),
    };
} catch (ErrorValidacion $e) {
    responderError($e->getMessage(), 400);
} catch (PDOException $e) {
    if (($e->errorInfo[1] ?? 0) === 1062) { // última defensa: índice único (institución + código)
        responderError('Este código ya existe en la institución.', 409, ['campo' => 'codigo']);
    }
    responderErrorInterno('especialidades_medicas.php', $e);
} catch (Throwable $e) {
    responderErrorInterno('especialidades_medicas.php', $e);
}