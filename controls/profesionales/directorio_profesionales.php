<?php
// controls/profesionales/directorio_profesionales.php
// Directorio de profesionales de salud: búsqueda, filtros, paginación SQL (RNF-REN-02) y activación (RF-PRO-01 y RF-PRO-02).
// Atiende la vista directorio_profesionales.html. Respuesta: JSON uniforme { ok, mensaje, datos }.
// Ven el directorio: Admin IPS, Médico y Recepción, de SU institución (la de la sesión). Solo el Admin IPS activa o inactiva.
//
//   GET  ?accion=listar&pagina=1&q=texto&esp=ID&estado=Activo|Inactivo&todos=1
//          -> { profesionales, total, pagina, limite, especialidades, kpis, institucion, puede_escribir }
//          (todos=1 trae todos los que coinciden, hasta un tope, para la vista agrupada por especialidad)
//   POST { accion: 'estado', id, estado }   (estado: Activo | Inactivo)   -> 200
// Los POST exigen el token CSRF (cabecera X-CSRF-Token).

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/profesionales.php';
require_once __DIR__ . '/../../config/pacientes.php'; // escaparLike()

function listarProfesionales(PDO $conexion, array $actor): never
{
    $idInstitucion = $actor['id_institucion'];
    $todos  = ($_GET['todos'] ?? '') === '1';
    $pag    = $todos ? ['pagina' => 1, 'limite' => TOPE_VISTA_AGRUPADA, 'desplazamiento' => 0] : paginacion($_GET, TAM_PAGINA_PROFESIONALES, 50);
    $texto  = mb_substr(limpiarTexto($_GET['q'] ?? ''), 0, 60);
    $estado = limpiarTexto($_GET['estado'] ?? '');
    $idEsp  = limpiarTexto($_GET['esp'] ?? '');
    if (($estado !== '' && !in_array($estado, ['Activo', 'Inactivo'], true))
        || ($idEsp !== '' && filter_var($idEsp, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) === false)) {
        responderError('Filtro no válido.', 400);
    }

    $condiciones = ['u.id_institucion = ?'];
    $parametros  = [$idInstitucion];
    if ($texto !== '') {
        $like = '%' . escaparLike($texto) . '%';
        $condiciones[] = '(u.nombre_completo LIKE ? OR u.numero_documento LIKE ? OR ps.tarjeta_profesional LIKE ?)';
        array_push($parametros, $like, $like, $like);
    }
    if ($idEsp !== '') {
        $condiciones[] = 'EXISTS (SELECT 1 FROM profesional_especialidad pe WHERE pe.id_profesional = ps.id_profesional AND pe.id_especialidad = ?)';
        $parametros[]  = (int)$idEsp;
    }
    // "Inactivo" en la vista incluye las cuentas Bloqueadas: ninguna de las dos puede recibir citas.
    if ($estado === 'Activo') {
        $condiciones[] = "u.estado = 'Activo'";
    } elseif ($estado === 'Inactivo') {
        $condiciones[] = "u.estado <> 'Activo'";
    }
    $desde = ' FROM profesional_salud ps INNER JOIN usuario u ON u.id_usuario = ps.id_usuario WHERE ' . implode(' AND ', $condiciones);

    $total = $conexion->prepare('SELECT COUNT(*)' . $desde);
    $total->execute($parametros);

    $consulta = $conexion->prepare('SELECT ps.id_profesional, ps.tarjeta_profesional, u.*' . $desde . ' ORDER BY u.nombre_completo, ps.id_profesional LIMIT ? OFFSET ?');
    foreach ($parametros as $i => $valor) {
        $consulta->bindValue($i + 1, $valor);
    }
    $consulta->bindValue(count($parametros) + 1, $pag['limite'], PDO::PARAM_INT);
    $consulta->bindValue(count($parametros) + 2, $pag['desplazamiento'], PDO::PARAM_INT);
    $consulta->execute();
    $filas = $consulta->fetchAll();

    $ids  = array_map(static fn(array $f): int => (int)$f['id_profesional'], $filas);
    $esps = especialidadesDeProfesionales($conexion, $ids, $idInstitucion);
    $sedes = sedesDeProfesionales($conexion, $ids, $idInstitucion);

    $kpis = $conexion->prepare(
        "SELECT COUNT(*) AS total, SUM(u.estado = 'Activo') AS activos
           FROM profesional_salud ps INNER JOIN usuario u ON u.id_usuario = ps.id_usuario WHERE u.id_institucion = ?"
    );
    $kpis->execute([$idInstitucion]);
    $k = $kpis->fetch();
    $especialidades = leerEspecialidades($conexion, $idInstitucion);

    responderExito('Directorio de profesionales.', [
        'profesionales' => array_map(static fn(array $f): array => formatoProfesional(
            $f, $esps[(int)$f['id_profesional']] ?? [], $sedes[(int)$f['id_profesional']] ?? ''), $filas),
        'total' => (int)$total->fetchColumn(), 'pagina' => $pag['pagina'], 'limite' => $pag['limite'],
        'especialidades' => $especialidades,
        'kpis' => ['total' => (int)$k['total'], 'activos' => (int)$k['activos'], 'inactivos' => (int)$k['total'] - (int)$k['activos'],
                   'esp_activas' => count(array_filter($especialidades, static fn(array $e): bool => $e['estado'] === 'Activo'))],
        'institucion' => nombreInstitucionProfesional($conexion, $idInstitucion),
        'puede_escribir' => in_array($actor['id_rol'], ROLES_ESCRIBE_PROFESIONALES, true),
    ]);
}

/** Activar o inactivar la cuenta del profesional. El historial asistencial se conserva (eliminación lógica). */
function cambiarEstadoProfesional(PDO $conexion, array $actor, array $entrada): never
{
    $id     = enteroObligatorio($entrada, 'id', 'Profesional', 1, 4294967295);
    $estado = enumObligatorio($entrada, 'estado', 'Estado', ['Activo', 'Inactivo']);

    $conexion->beginTransaction();
    try {
        $profesional = profesionalDeInstitucion($conexion, $id, $actor['id_institucion'], true);
        if ($profesional === null) {
            revertir($conexion, 'El profesional no existe.', 404);
        }
        if ($profesional['estado'] !== $estado) {
            if ($estado === 'Activo') {
                exigirCupoDeMedicos($conexion, $actor['id_institucion']);
            }
            aplicarEstadoUsuario($conexion, $actor['id_usuario'], $profesional, $estado, false);
            auditar($conexion, $actor['id_usuario'], 'profesional_salud', $id, 'Modificación',
                    ['estado' => $profesional['estado']], ['estado' => $estado]);
        }
        $conexion->commit();
    } catch (Throwable $t) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        throw $t;
    }
    responderExito($estado === 'Activo' ? 'Profesional activado.' : 'Profesional inactivado.');
}

/* ---------------- Punto de entrada ---------------- */

exigirMetodo('GET', 'POST');
$actor = actorDeProfesionales(ROLES_LEE_PROFESIONALES);

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (($_GET['accion'] ?? '') !== 'listar') {
            responderError('Acción no válida.', 400);
        }
        listarProfesionales($conexion, $actor);
    }

    actorDeProfesionales(ROLES_ESCRIBE_PROFESIONALES, 'Solo el administrador de la institución puede modificar profesionales.');
    exigirCsrf();
    $entrada = leerEntradaJson();
    match ($entrada['accion'] ?? '') {
        'estado' => cambiarEstadoProfesional($conexion, $actor, $entrada),
        default  => responderError('Acción no válida.', 400),
    };
} catch (ErrorValidacion $e) {
    responderError($e->getMessage(), 400);
} catch (Throwable $e) {
    responderErrorInterno('directorio_profesionales.php', $e);
}