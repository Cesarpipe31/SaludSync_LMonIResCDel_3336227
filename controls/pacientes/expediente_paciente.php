<?php
// controls/pacientes/expediente_paciente.php
// Ficha integral del paciente y su historial de citas y atenciones, de solo lectura (RF-PAC-01 y RF-PAC-02).
// Atiende la vista expediente_paciente.html. Ven la ficha: Admin IPS, Médico y Recepción de la institución del paciente.
// El detalle clínico (enfermedad actual y examen físico) lo ve únicamente el Médico: es dato sensible (Ley 1581).
// El historial se pide por páginas con LIMIT/OFFSET (RNF-REN-02). Respuesta: JSON uniforme { ok, mensaje, datos }.
//
//   GET ?accion=expediente&id=N                               -> { paciente, institucion, resumen, citas, atenciones, ve_detalle_clinico }
//   GET ?accion=citas&id=N&pagina=1&limite=10&estado=...       -> { filas, total, pagina, limite }
//   GET ?accion=atenciones&id=N&pagina=1&limite=10             -> { filas, total, pagina, limite, ve_detalle_clinico }

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/pacientes.php';

const ESTADOS_CITA_FILTRO = ['Programada', 'En Sala de Espera', 'En Consulta', 'Atendida', 'Cancelada', 'Inasistencia'];

// Médico y primera especialidad de cada profesional (un profesional puede tener varias; se muestra la primera por nombre).
const SQL_PROFESIONAL =
    'INNER JOIN profesional_salud ps ON ps.id_profesional = %s.id_profesional
     INNER JOIN usuario up ON up.id_usuario = ps.id_usuario
     LEFT JOIN (SELECT pe.id_profesional, MIN(e.nombre_especialidad) AS especialidad
                  FROM profesional_especialidad pe INNER JOIN especialidad e ON e.id_especialidad = pe.id_especialidad
                 GROUP BY pe.id_profesional) esp ON esp.id_profesional = ps.id_profesional';

/** El paciente debe ser de la institución de quien consulta; si no, responde 404. */
function pacienteVisible(PDO $conexion, array $actor): array
{
    $id = enteroObligatorio($_GET, 'id', 'Paciente', 1, 4294967295);
    $paciente = pacienteDeInstitucion($conexion, $id, $actor['id_institucion']);
    if ($paciente === null) {
        responderError('El paciente no existe.', 404);
    }
    return $paciente;
}

function paginaDeCitas(PDO $conexion, array $paciente, int $limite, int $desplazamiento, string $estado): array
{
    $donde      = 'c.id_paciente = ? AND c.id_institucion = ?' . ($estado !== '' ? ' AND c.estado = ?' : '');
    $parametros = [$paciente['id_paciente'], $paciente['id_institucion'], ...($estado !== '' ? [$estado] : [])];

    $total = $conexion->prepare("SELECT COUNT(*) FROM cita_medica c WHERE {$donde}");
    $total->execute($parametros);

    $consulta = $conexion->prepare(
        'SELECT c.id_cita, c.fecha_cita, c.hora_cita, c.tipo_consulta, c.estado, c.motivo_cancelacion,
                up.nombre_completo AS medico, esp.especialidad, co.nombre_consultorio
           FROM cita_medica c ' . sprintf(SQL_PROFESIONAL, 'c') . '
           INNER JOIN consultorio co ON co.id_consultorio = c.id_consultorio
          WHERE ' . $donde . ' ORDER BY c.fecha_cita DESC, c.hora_cita DESC, c.id_cita DESC LIMIT ? OFFSET ?'
    );
    foreach ($parametros as $i => $valor) {
        $consulta->bindValue($i + 1, $valor);
    }
    $consulta->bindValue(count($parametros) + 1, $limite, PDO::PARAM_INT);
    $consulta->bindValue(count($parametros) + 2, $desplazamiento, PDO::PARAM_INT);
    $consulta->execute();

    return ['filas' => array_map(static fn(array $c): array => [
        'id' => (int)$c['id_cita'], 'fecha' => $c['fecha_cita'], 'hora' => substr($c['hora_cita'], 0, 5),
        'medico' => $c['medico'], 'esp' => $c['especialidad'] ?? '—', 'consultorio' => $c['nombre_consultorio'],
        'tipo' => $c['tipo_consulta'], 'estado' => $c['estado'], 'motivoCanc' => $c['motivo_cancelacion'] ?? '',
    ], $consulta->fetchAll()), 'total' => (int)$total->fetchColumn()];
}

function paginaDeAtenciones(PDO $conexion, array $paciente, int $limite, int $desplazamiento, bool $veDetalle): array
{
    $total = $conexion->prepare('SELECT COUNT(*) FROM atencion_medica WHERE id_paciente = ?');
    $total->execute([$paciente['id_paciente']]);

    $consulta = $conexion->prepare(
        'SELECT a.id_atencion, a.motivo_consulta, a.enfermedad_actual, a.examen_fisico, a.estado,
                a.fecha_hora_inicio, a.fecha_hora_fin, up.nombre_completo AS medico, esp.especialidad
           FROM atencion_medica a ' . sprintf(SQL_PROFESIONAL, 'a') . '
          WHERE a.id_paciente = ? ORDER BY a.fecha_hora_inicio DESC, a.id_atencion DESC LIMIT ? OFFSET ?'
    );
    $consulta->bindValue(1, $paciente['id_paciente'], PDO::PARAM_INT);
    $consulta->bindValue(2, $limite, PDO::PARAM_INT);
    $consulta->bindValue(3, $desplazamiento, PDO::PARAM_INT);
    $consulta->execute();

    return ['filas' => array_map(static fn(array $a): array => [
        'id' => (int)$a['id_atencion'], 'fecha' => substr($a['fecha_hora_inicio'], 0, 10),
        'inicio' => substr($a['fecha_hora_inicio'], 11, 5), 'fin' => substr((string)$a['fecha_hora_fin'], 11, 5) ?: '—',
        'medico' => $a['medico'], 'esp' => $a['especialidad'] ?? '—', 'motivo' => $a['motivo_consulta'], 'estado' => $a['estado'],
        // Quien no es Médico recibe null: el servidor no envía el texto clínico, no solo lo oculta la vista.
        'ea' => $veDetalle ? ($a['enfermedad_actual'] ?? '') : null, 'ef' => $veDetalle ? ($a['examen_fisico'] ?? '') : null,
    ], $consulta->fetchAll()), 'total' => (int)$total->fetchColumn()];
}

function resumenDeCitas(PDO $conexion, array $paciente): array
{
    $consulta = $conexion->prepare('SELECT estado, COUNT(*) AS total FROM cita_medica WHERE id_paciente = ? AND id_institucion = ? GROUP BY estado');
    $consulta->execute([$paciente['id_paciente'], $paciente['id_institucion']]);
    $porEstado = $consulta->fetchAll(PDO::FETCH_KEY_PAIR);

    $proxima = $conexion->prepare("SELECT MIN(fecha_cita) FROM cita_medica WHERE id_paciente = ? AND id_institucion = ? AND estado = 'Programada' AND fecha_cita >= CURDATE()");
    $proxima->execute([$paciente['id_paciente'], $paciente['id_institucion']]);

    return [
        'total' => array_sum(array_map('intval', $porEstado)), 'atendidas' => (int)($porEstado['Atendida'] ?? 0),
        'inasistencias' => (int)($porEstado['Inasistencia'] ?? 0), 'canceladas' => (int)($porEstado['Cancelada'] ?? 0),
        'proxima' => $proxima->fetchColumn() ?: null,
    ];
}

/* ---------------- Punto de entrada ---------------- */

exigirMetodo('GET');
$actor = actorDePacientes(ROLES_LEE_PACIENTES);
$veDetalleClinico = $actor['id_rol'] === ROL_MEDICO;

try {
    $paciente = pacienteVisible($conexion, $actor);
    $pag = paginacion($_GET, TAM_PAGINA_HISTORIAL, 50);

    match ($_GET['accion'] ?? '') {
        'expediente' => responderExito('Expediente del paciente.', [
            'paciente' => formatoPaciente($paciente), 'institucion' => nombreInstitucion($conexion, $actor['id_institucion']),
            'resumen'  => resumenDeCitas($conexion, $paciente),
            'citas'    => paginaDeCitas($conexion, $paciente, TAM_PAGINA_HISTORIAL, 0, ''),
            'atenciones' => paginaDeAtenciones($conexion, $paciente, TAM_PAGINA_HISTORIAL, 0, $veDetalleClinico),
            've_detalle_clinico' => $veDetalleClinico,
        ]),
        'citas' => (function () use ($conexion, $paciente, $pag): never {
            $estado = limpiarTexto($_GET['estado'] ?? '');
            if ($estado !== '' && !in_array($estado, ESTADOS_CITA_FILTRO, true)) {
                responderError('Filtro no válido.', 400);
            }
            responderExito('Citas del paciente.', paginaDeCitas($conexion, $paciente, $pag['limite'], $pag['desplazamiento'], $estado)
                + ['pagina' => $pag['pagina'], 'limite' => $pag['limite']]);
        })(),
        'atenciones' => responderExito('Atenciones del paciente.',
            paginaDeAtenciones($conexion, $paciente, $pag['limite'], $pag['desplazamiento'], $veDetalleClinico)
            + ['pagina' => $pag['pagina'], 'limite' => $pag['limite'], 've_detalle_clinico' => $veDetalleClinico]),
        default => responderError('Acción no válida.', 400),
    };
} catch (ErrorValidacion $e) {
    responderError($e->getMessage(), 400);
} catch (Throwable $e) {
    responderErrorInterno('expediente_paciente.php', $e);
}