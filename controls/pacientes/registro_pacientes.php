<?php
// controls/pacientes/registro_paciente.php
// Alta y edición de pacientes: datos demográficos y contacto de emergencia (RF-PAC-01 y RF-PAC-02).
// Atiende la vista registro_paciente.html. Roles: Admin IPS y Recepción (la institución sale de la sesión).
// Respuesta: JSON uniforme { ok, mensaje, datos }.
//
//   GET  ?accion=contexto                  -> { institucion }
//   GET  ?accion=obtener&id=N              -> { paciente }
//   POST { accion: 'crear',  ...campos }      -> 201 { id }
//   POST { accion: 'editar', id, ...campos }  -> 200
// Los POST exigen el token CSRF (cabecera X-CSRF-Token).

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/pacientes.php';

/** El documento es único por institución (el índice de la BD no distingue el tipo: 1234567 es uno solo). */
function exigirDocumentoLibre(PDO $conexion, int $idInstitucion, string $numeroDocumento, int $excluirId): void
{
    $consulta = $conexion->prepare('SELECT 1 FROM paciente WHERE id_institucion = ? AND numero_documento = ? AND id_paciente <> ? LIMIT 1 FOR UPDATE');
    $consulta->execute([$idInstitucion, $numeroDocumento, $excluirId]);
    if ($consulta->fetchColumn()) {
        revertir($conexion, 'Ya existe un paciente con este documento en la institución.', 409, ['campo' => 'doc']);
    }
}

function crearPaciente(PDO $conexion, array $actor, array $entrada): never
{
    $d  = validarPaciente($entrada);
    $id = 0;

    $conexion->beginTransaction();
    try {
        $idInstitucion = $actor['id_institucion'];
        // Se bloquea la institución antes de comprobar documento y cupo: dos altas simultáneas no se pisan.
        $conexion->prepare('SELECT id_institucion FROM institucion WHERE id_institucion = ? FOR UPDATE')->execute([$idInstitucion]);
        exigirDocumentoLibre($conexion, $idInstitucion, $d['numero_documento'], 0);
        if ($d['estado'] === 'Activo') {
            exigirCupoDePacientes($conexion, $idInstitucion);
        }

        $campos = array_keys($d);
        $conexion->prepare(
            'INSERT INTO paciente (id_institucion, ' . implode(', ', $campos) . ') VALUES (?' . str_repeat(', ?', count($campos)) . ')'
        )->execute([$idInstitucion, ...array_values($d)]);
        $id = (int)$conexion->lastInsertId();

        // En auditoría solo va lo mínimo para identificar el registro: sin teléfonos, direcciones ni datos de salud.
        auditar($conexion, $actor['id_usuario'], 'paciente', $id, 'Creación', null,
                ['documento' => $d['tipo_documento'] . ' ' . $d['numero_documento'], 'estado' => $d['estado']]);
        $conexion->commit();
    } catch (Throwable $t) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        throw $t;
    }
    responderExito('Paciente registrado correctamente.', ['id' => $id], 201);
}

function editarPaciente(PDO $conexion, array $actor, array $entrada): never
{
    $id = enteroObligatorio($entrada, 'id', 'Paciente', 1, 4294967295);
    $d  = validarPaciente($entrada);

    $conexion->beginTransaction();
    try {
        $idInstitucion = $actor['id_institucion'];
        $conexion->prepare('SELECT id_institucion FROM institucion WHERE id_institucion = ? FOR UPDATE')->execute([$idInstitucion]);
        $antes = pacienteDeInstitucion($conexion, $id, $idInstitucion, true);
        if ($antes === null) {
            revertir($conexion, 'El paciente no existe.', 404);
        }
        exigirDocumentoLibre($conexion, $idInstitucion, $d['numero_documento'], $id);
        if ($antes['estado'] === 'Inactivo' && $d['estado'] === 'Activo') {
            exigirCupoDePacientes($conexion, $idInstitucion);
        }

        $asignaciones = implode(', ', array_map(static fn(string $c): string => "{$c} = ?", array_keys($d)));
        $conexion->prepare("UPDATE paciente SET {$asignaciones} WHERE id_paciente = ?")->execute([...array_values($d), $id]);

        // Auditoría: solo los campos que cambiaron, con su valor anterior y el nuevo.
        $anterior = $nuevo = [];
        foreach ($d as $campo => $valor) {
            if ((string)($antes[$campo] ?? '') !== (string)($valor ?? '')) {
                $anterior[$campo] = $antes[$campo];
                $nuevo[$campo]    = $valor;
            }
        }
        if ($nuevo) {
            auditar($conexion, $actor['id_usuario'], 'paciente', $id, 'Modificación', $anterior, $nuevo);
        }
        $conexion->commit();
    } catch (Throwable $t) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        throw $t;
    }
    responderExito('Datos del paciente actualizados.');
}

/* ---------------- Punto de entrada ---------------- */

exigirMetodo('GET', 'POST');
$actor = actorDePacientes(ROLES_ESCRIBE_PACIENTES, 'Su rol solo puede consultar pacientes.');

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        match ($_GET['accion'] ?? '') {
            'contexto' => responderExito('Contexto.', ['institucion' => nombreInstitucion($conexion, $actor['id_institucion'])]),
            'obtener'  => (function () use ($conexion, $actor): never {
                $fila = pacienteDeInstitucion($conexion, enteroObligatorio($_GET, 'id', 'Paciente', 1, 4294967295), $actor['id_institucion']);
                if ($fila === null) {
                    responderError('El paciente no existe.', 404);
                }
                responderExito('Paciente.', ['paciente' => formatoPaciente($fila), 'institucion' => nombreInstitucion($conexion, $actor['id_institucion'])]);
            })(),
            default    => responderError('Acción no válida.', 400),
        };
    }

    exigirCsrf();
    $entrada = leerEntradaJson();
    match ($entrada['accion'] ?? '') {
        'crear'  => crearPaciente($conexion, $actor, $entrada),
        'editar' => editarPaciente($conexion, $actor, $entrada),
        default  => responderError('Acción no válida.', 400),
    };
} catch (ErrorValidacion $e) {
    responderError($e->getMessage(), 400);
} catch (PDOException $e) {
    if (($e->errorInfo[1] ?? 0) === 1062) { // última defensa: índice único (institución + documento)
        responderError('Ya existe un paciente con este documento en la institución.', 409, ['campo' => 'doc']);
    }
    responderErrorInterno('registro_paciente.php', $e);
} catch (Throwable $e) {
    responderErrorInterno('registro_paciente.php', $e);
}