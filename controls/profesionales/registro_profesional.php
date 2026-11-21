<?php
// controls/profesionales/registro_profesional.php
// Alta y edición de profesionales de salud (RF-PRO-01) con sus especialidades (RF-PRO-02).
// Atiende la vista registro_profesional.html. Rol: Admin IPS (la institución sale de la sesión).
// Respuesta: JSON uniforme { ok, mensaje, datos }.
//
//   GET  ?accion=contexto                  -> { institucion, especialidades }  (especialidades activas)
//   GET  ?accion=obtener&id=N              -> { profesional, institucion, especialidades }
//   POST { accion: 'crear',  ...campos }      -> 201 { id, credenciales: { correo, clave } }
//   POST { accion: 'editar', id, ...campos }  -> 200
// Crear un profesional crea también su cuenta de usuario con rol Médico, todo en una transacción.
// La clave temporal solo viaja en la respuesta de 'crear' (XAMPP no envía correos).
// Los POST exigen el token CSRF (cabecera X-CSRF-Token).
//
// Los campos "sede" y "dirección" de la vista no tienen columna en el esquema y no se guardan.

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/profesionales.php';

/** La tarjeta profesional es única en TODA la plataforma (RF-PRO-01). */
function exigirTarjetaLibre(PDO $conexion, string $tarjeta, int $excluirIdProfesional): void
{
    $consulta = $conexion->prepare('SELECT 1 FROM profesional_salud WHERE tarjeta_profesional = ? AND id_profesional <> ? LIMIT 1 FOR UPDATE');
    $consulta->execute([$tarjeta, $excluirIdProfesional]);
    if ($consulta->fetchColumn()) {
        revertir($conexion, 'Esta tarjeta profesional ya está registrada en la plataforma.', 409, ['campo' => 'tarjeta']);
    }
}

/** El correo es único en todo el sistema (el login solo pide correo y contraseña). */
function exigirCorreoProfesionalLibre(PDO $conexion, string $correo, int $excluirIdUsuario): void
{
    $consulta = $conexion->prepare('SELECT 1 FROM usuario WHERE correo_electronico = ? AND id_usuario <> ? LIMIT 1 FOR UPDATE');
    $consulta->execute([$correo, $excluirIdUsuario]);
    if ($consulta->fetchColumn()) {
        revertir($conexion, 'Este correo ya está registrado.', 409, ['campo' => 'correo']);
    }
}

/** Un mismo documento no puede ser dos profesionales de la institución. */
function exigirDocumentoProfesionalLibre(PDO $conexion, int $idInstitucion, string $numeroDocumento, int $excluirIdUsuario): void
{
    $consulta = $conexion->prepare(
        'SELECT 1 FROM profesional_salud ps INNER JOIN usuario u ON u.id_usuario = ps.id_usuario
          WHERE u.id_institucion = ? AND u.numero_documento = ? AND u.id_usuario <> ? LIMIT 1 FOR UPDATE'
    );
    $consulta->execute([$idInstitucion, $numeroDocumento, $excluirIdUsuario]);
    if ($consulta->fetchColumn()) {
        revertir($conexion, 'Ya existe un profesional con este documento.', 409, ['campo' => 'doc']);
    }
}

/**
 * Las especialidades deben ser de la institución y estar Activas; al editar se admiten además las
 * inactivas que el profesional ya tenía asignadas.
 */
function exigirEspecialidadesValidas(PDO $conexion, int $idInstitucion, array $ids, array $yaAsignadas): void
{
    $consulta = $conexion->prepare('SELECT estado FROM especialidad WHERE id_especialidad = ? AND id_institucion = ?');
    foreach ($ids as $id) {
        $consulta->execute([$id, $idInstitucion]);
        $estado = $consulta->fetchColumn();
        if ($estado === false || ($estado !== 'Activo' && !in_array($id, $yaAsignadas, true))) {
            revertir($conexion, 'Una de las especialidades seleccionadas no es válida.', 400);
        }
    }
}

function guardarEspecialidadesDelProfesional(PDO $conexion, int $idProfesional, array $ids): void
{
    $conexion->prepare('DELETE FROM profesional_especialidad WHERE id_profesional = ?')->execute([$idProfesional]); // tabla puente
    $insertar = $conexion->prepare('INSERT INTO profesional_especialidad (id_profesional, id_especialidad) VALUES (?, ?)');
    foreach ($ids as $id) {
        $insertar->execute([$idProfesional, $id]);
    }
}

function crearProfesional(PDO $conexion, array $actor, array $entrada): never
{
    $d = validarProfesional($entrada, true);
    $idInstitucion = $actor['id_institucion'];
    $clave = claveTemporalAleatoria();
    $idProfesional = 0;

    $conexion->beginTransaction();
    try {
        $conexion->prepare('SELECT id_institucion FROM institucion WHERE id_institucion = ? FOR UPDATE')->execute([$idInstitucion]);
        exigirTarjetaLibre($conexion, $d['tarjeta'], 0);
        exigirCorreoProfesionalLibre($conexion, $d['correo'], 0);
        exigirDocumentoProfesionalLibre($conexion, $idInstitucion, $d['numero_documento'], 0);
        exigirEspecialidadesValidas($conexion, $idInstitucion, $d['especialidades'], []);
        if ($d['estado'] === 'Activo') {
            exigirCupoDeMedicos($conexion, $idInstitucion);
        }

        $conexion->prepare(
            "INSERT INTO usuario (id_institucion, id_rol, tipo_documento, numero_documento, nombre_completo,
                    correo_electronico, telefono, contrasena_hash, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )->execute([$idInstitucion, ROL_MEDICO, $d['tipo_documento'], $d['numero_documento'], $d['nombre_completo'],
                    $d['correo'], $d['telefono'], password_hash($clave, PASSWORD_BCRYPT), $d['estado']]);
        $idUsuario = (int)$conexion->lastInsertId();

        $conexion->prepare('INSERT INTO profesional_salud (id_usuario, tarjeta_profesional) VALUES (?, ?)')->execute([$idUsuario, $d['tarjeta']]);
        $idProfesional = (int)$conexion->lastInsertId();
        guardarEspecialidadesDelProfesional($conexion, $idProfesional, $d['especialidades']);

        auditar($conexion, $actor['id_usuario'], 'usuario', $idUsuario, 'Creación', null,
                ['id_institucion' => $idInstitucion, 'id_rol' => ROL_MEDICO, 'correo_electronico' => $d['correo'], 'estado' => $d['estado']]);
        auditar($conexion, $actor['id_usuario'], 'profesional_salud', $idProfesional, 'Creación', null,
                ['tarjeta' => $d['tarjeta'], 'especialidades' => count($d['especialidades'])]);
        $conexion->commit();
    } catch (Throwable $t) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        throw $t;
    }
    responderExito('Profesional registrado correctamente.', [
        'id' => $idProfesional, 'credenciales' => ['correo' => $d['correo'], 'clave' => $clave],
    ], 201);
}

function editarProfesional(PDO $conexion, array $actor, array $entrada): never
{
    $id = enteroObligatorio($entrada, 'id', 'Profesional', 1, 4294967295);
    $d  = validarProfesional($entrada, false);
    $idInstitucion = $actor['id_institucion'];

    $conexion->beginTransaction();
    try {
        $conexion->prepare('SELECT id_institucion FROM institucion WHERE id_institucion = ? FOR UPDATE')->execute([$idInstitucion]);
        $antes = profesionalDeInstitucion($conexion, $id, $idInstitucion, true);
        if ($antes === null) {
            revertir($conexion, 'El profesional no existe.', 404);
        }
        $espAntes = especialidadesDeProfesionales($conexion, [$id], $idInstitucion)[$id] ?? [];

        exigirTarjetaLibre($conexion, $d['tarjeta'], $id);
        exigirCorreoProfesionalLibre($conexion, $d['correo'], (int)$antes['id_usuario']);
        exigirDocumentoProfesionalLibre($conexion, $idInstitucion, $d['numero_documento'], (int)$antes['id_usuario']);
        exigirEspecialidadesValidas($conexion, $idInstitucion, $d['especialidades'], $espAntes);
        if ($antes['estado'] !== 'Activo' && $d['estado'] === 'Activo') {
            exigirCupoDeMedicos($conexion, $idInstitucion);
        }

        $conexion->prepare(
            'UPDATE usuario SET tipo_documento = ?, numero_documento = ?, nombre_completo = ?, correo_electronico = ?, telefono = ? WHERE id_usuario = ?'
        )->execute([$d['tipo_documento'], $d['numero_documento'], $d['nombre_completo'], $d['correo'], $d['telefono'], $antes['id_usuario']]);
        aplicarEstadoUsuario($conexion, $actor['id_usuario'], $antes, $d['estado'], false);
        $conexion->prepare('UPDATE profesional_salud SET tarjeta_profesional = ? WHERE id_profesional = ?')->execute([$d['tarjeta'], $id]);
        guardarEspecialidadesDelProfesional($conexion, $id, $d['especialidades']);

        // Auditoría: solo lo que cambió.
        $anterior = $nuevo = [];
        $comparar = [
            'nombre_completo' => [$antes['nombre_completo'], $d['nombre_completo']], 'tipo_documento' => [$antes['tipo_documento'], $d['tipo_documento']],
            'numero_documento' => [$antes['numero_documento'], $d['numero_documento']], 'correo_electronico' => [$antes['correo_electronico'], $d['correo']],
            'telefono' => [$antes['telefono'], $d['telefono']], 'tarjeta' => [$antes['tarjeta_profesional'], $d['tarjeta']], 'estado' => [$antes['estado'], $d['estado']],
        ];
        foreach ($comparar as $campo => [$valorAntes, $valorNuevo]) {
            if ((string)$valorAntes !== (string)$valorNuevo) {
                $anterior[$campo] = $valorAntes;
                $nuevo[$campo]    = $valorNuevo;
            }
        }
        sort($espAntes);
        $espNuevas = $d['especialidades'];
        sort($espNuevas);
        if ($espAntes !== $espNuevas) {
            $anterior['especialidades'] = $espAntes;
            $nuevo['especialidades']    = $espNuevas;
        }
        if ($nuevo) {
            auditar($conexion, $actor['id_usuario'], 'profesional_salud', $id, 'Modificación', $anterior, $nuevo);
        }
        $conexion->commit();
    } catch (Throwable $t) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        throw $t;
    }
    responderExito('Profesional actualizado correctamente.');
}

/* ---------------- Punto de entrada ---------------- */

exigirMetodo('GET', 'POST');
$actor = actorDeProfesionales(ROLES_ESCRIBE_PROFESIONALES, 'Solo el administrador de la institución puede registrar o modificar profesionales.');

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        match ($_GET['accion'] ?? '') {
            'contexto' => responderExito('Contexto.', [
                'institucion'    => nombreInstitucionProfesional($conexion, $actor['id_institucion']),
                'especialidades' => leerEspecialidades($conexion, $actor['id_institucion'], true),
            ]),
            'obtener' => (function () use ($conexion, $actor): never {
                $id   = enteroObligatorio($_GET, 'id', 'Profesional', 1, 4294967295);
                $fila = profesionalDeInstitucion($conexion, $id, $actor['id_institucion']);
                if ($fila === null) {
                    responderError('El profesional no existe.', 404);
                }
                $esp   = especialidadesDeProfesionales($conexion, [$id], $actor['id_institucion'])[$id] ?? [];
                $sedes = sedesDeProfesionales($conexion, [$id], $actor['id_institucion']);
                // Se ofrecen las activas más las inactivas que el profesional ya tiene (para no perderlas al guardar).
                $catalogo = array_values(array_filter(leerEspecialidades($conexion, $actor['id_institucion']),
                    static fn(array $e): bool => $e['estado'] === 'Activo' || in_array($e['id'], $esp, true)));
                responderExito('Profesional.', [
                    'profesional' => formatoProfesional($fila, $esp, $sedes[$id] ?? ''),
                    'institucion' => nombreInstitucionProfesional($conexion, $actor['id_institucion']), 'especialidades' => $catalogo,
                ]);
            })(),
            default => responderError('Acción no válida.', 400),
        };
    }

    exigirCsrf();
    $entrada = leerEntradaJson();
    match ($entrada['accion'] ?? '') {
        'crear'  => crearProfesional($conexion, $actor, $entrada),
        'editar' => editarProfesional($conexion, $actor, $entrada),
        default  => responderError('Acción no válida.', 400),
    };
} catch (ErrorValidacion $e) {
    responderError($e->getMessage(), 400);
} catch (PDOException $e) {
    if (($e->errorInfo[1] ?? 0) === 1062) { // última defensa: índices únicos de la BD (tarjeta o cuenta)
        responderError('Ya existe un profesional con esos datos (tarjeta o correo).', 409);
    }
    responderErrorInterno('registro_profesional.php', $e);
} catch (Throwable $e) {
    responderErrorInterno('registro_profesional.php', $e);
}