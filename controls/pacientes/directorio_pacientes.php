<?php
// controls/pacientes/directorio_pacientes.php
// Directorio de pacientes: búsqueda, filtros, paginación SQL (RNF-REN-02) e inactivación (RF-PAC-01).
// Atiende la vista directorio_pacientes.html. Respuesta: JSON uniforme { ok, mensaje, datos }.
// Ven el directorio: Admin IPS, Médico y Recepción, siempre de SU institución (la de la sesión).
// Solo Admin IPS y Recepción pueden inactivar o activar.
//
//   GET  ?accion=listar&pagina=1&limite=6&q=texto&tipo=CC&estado=Activo
//          -> { pacientes, total, pagina, limite, kpis, institucion, puede_escribir }
//   POST { accion: 'estado', id, estado }   (estado: Activo | Inactivo)   -> 200
// Los POST exigen el token CSRF (cabecera X-CSRF-Token).

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/pacientes.php';

function listarPacientes(PDO $conexion, array $actor): never
{
    $idInstitucion = $actor['id_institucion'];
    $pag    = paginacion($_GET, TAM_PAGINA_PACIENTES, 50);
    $texto  = mb_substr(limpiarTexto($_GET['q'] ?? ''), 0, 60);
    $tipo   = limpiarTexto($_GET['tipo'] ?? '');
    $estado = limpiarTexto($_GET['estado'] ?? '');
    if (($tipo !== '' && !in_array($tipo, TIPOS_DOCUMENTO_PACIENTE, true)) || ($estado !== '' && !in_array($estado, ESTADOS_PACIENTE, true))) {
        responderError('Filtro no válido.', 400);
    }

    // Todos los filtros son parámetros preparados; el texto se escapa para que % y _ no actúen como comodines.
    $condiciones = ['id_institucion = ?'];
    $parametros  = [$idInstitucion];
    if ($texto !== '') {
        $like = '%' . escaparLike($texto) . '%';
        $condiciones[] = "(numero_documento LIKE ? OR CONCAT(nombres, ' ', apellidos) LIKE ? OR CONCAT(tipo_documento, ' ', numero_documento) LIKE ?)";
        array_push($parametros, $like, $like, $like);
    }
    if ($tipo !== '') {
        $condiciones[] = 'tipo_documento = ?';
        $parametros[]  = $tipo;
    }
    if ($estado !== '') {
        $condiciones[] = 'estado = ?';
        $parametros[]  = $estado;
    }
    $donde = ' WHERE ' . implode(' AND ', $condiciones);

    $total = $conexion->prepare('SELECT COUNT(*) FROM paciente' . $donde);
    $total->execute($parametros);

    $consulta = $conexion->prepare('SELECT * FROM paciente' . $donde . ' ORDER BY apellidos, nombres, id_paciente LIMIT ? OFFSET ?');
    foreach ($parametros as $i => $valor) {
        $consulta->bindValue($i + 1, $valor);
    }
    $consulta->bindValue(count($parametros) + 1, $pag['limite'], PDO::PARAM_INT);
    $consulta->bindValue(count($parametros) + 2, $pag['desplazamiento'], PDO::PARAM_INT);
    $consulta->execute();

    // Los indicadores cuentan a TODOS los pacientes de la institución, no solo los de la página o el filtro.
    $kpis = $conexion->prepare(
        "SELECT COUNT(*) AS total, SUM(estado = 'Activo') AS activos, SUM(estado = 'Inactivo') AS inactivos,
                SUM(TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE()) < 18) AS menores
           FROM paciente WHERE id_institucion = ?"
    );
    $kpis->execute([$idInstitucion]);
    $k = $kpis->fetch();

    responderExito('Directorio de pacientes.', [
        'pacientes' => array_map('formatoPaciente', $consulta->fetchAll()),
        'total' => (int)$total->fetchColumn(), 'pagina' => $pag['pagina'], 'limite' => $pag['limite'],
        'kpis' => ['total' => (int)$k['total'], 'activos' => (int)$k['activos'], 'inactivos' => (int)$k['inactivos'], 'menores' => (int)$k['menores']],
        'institucion' => nombreInstitucion($conexion, $idInstitucion),
        'puede_escribir' => in_array($actor['id_rol'], ROLES_ESCRIBE_PACIENTES, true),
    ]);
}

/** Inactivar conserva todo el historial (eliminación lógica); activar vuelve a ocupar un cupo del plan. */
function cambiarEstadoPaciente(PDO $conexion, array $actor, array $entrada): never
{
    $id     = enteroObligatorio($entrada, 'id', 'Paciente', 1, 4294967295);
    $estado = enumObligatorio($entrada, 'estado', 'Estado', ESTADOS_PACIENTE);

    $conexion->beginTransaction();
    try {
        $paciente = pacienteDeInstitucion($conexion, $id, $actor['id_institucion'], true);
        if ($paciente === null) {
            revertir($conexion, 'El paciente no existe.', 404);
        }
        if ($paciente['estado'] !== $estado) {
            if ($estado === 'Activo') {
                exigirCupoDePacientes($conexion, $actor['id_institucion']);
            }
            $conexion->prepare('UPDATE paciente SET estado = ? WHERE id_paciente = ?')->execute([$estado, $id]);
            auditar($conexion, $actor['id_usuario'], 'paciente', $id, 'Modificación', ['estado' => $paciente['estado']], ['estado' => $estado]);
        }
        $conexion->commit();
    } catch (Throwable $t) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        throw $t;
    }
    responderExito($estado === 'Activo' ? 'Paciente activado.' : 'Paciente inactivado.');
}

/* ---------------- Punto de entrada ---------------- */

exigirMetodo('GET', 'POST');
$actor = actorDePacientes(ROLES_LEE_PACIENTES);

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (($_GET['accion'] ?? '') !== 'listar') {
            responderError('Acción no válida.', 400);
        }
        listarPacientes($conexion, $actor);
    }

    actorDePacientes(ROLES_ESCRIBE_PACIENTES, 'Su rol solo puede consultar pacientes.');
    exigirCsrf();
    $entrada = leerEntradaJson();
    match ($entrada['accion'] ?? '') {
        'estado' => cambiarEstadoPaciente($conexion, $actor, $entrada),
        default  => responderError('Acción no válida.', 400),
    };
} catch (ErrorValidacion $e) {
    responderError($e->getMessage(), 400);
} catch (Throwable $e) {
    responderErrorInterno('directorio_pacientes.php', $e);
}