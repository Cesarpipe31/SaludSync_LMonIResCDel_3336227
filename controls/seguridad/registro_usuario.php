<?php
// controls/seguridad/registro_usuario.php
// Alta y edición de usuarios (RF-SEG-02). Atiende la vista registro_usuario.html.
// Respuesta: JSON uniforme { ok, mensaje, datos }. Dos modos según la sesión:
//   - SIN sesión  -> autorregistro público: el servidor fija rol Paciente, estado Activo y sin permisos extra.
//   - SuperAdmin / Admin IPS -> alta administrativa y edición. El rol permitido y la institución los decide el servidor:
//       Admin IPS solo crea roles 3-5 y siempre en SU institución (la de la sesión, nunca la del navegador).
//
//   GET  ?accion=instituciones         -> { instituciones }   (público: solo las activas)
//   GET  ?accion=matriz                -> { matriz }          (SuperAdmin o Admin IPS)
//   GET  ?accion=obtener&id=N          -> { usuario }         (SuperAdmin o Admin IPS)
//   POST { accion: 'crear',  ...campos }    -> 201 { id }
//   POST { accion: 'editar', id, ...campos } -> 200           (solo administrativo)
// Con sesión, los POST exigen el token CSRF (X-CSRF-Token). El autorregistro público no tiene sesión que proteger.

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/usuarios.php';

/* ---------------- Validación ---------------- */

/** Datos personales comunes a todos los modos. */
function validarDatosPersonales(array $e): array
{
    $nombres   = textoObligatorio($e, 'nombres', 'Nombres', 1, 60);
    $apellidos = textoObligatorio($e, 'apellidos', 'Apellidos', 1, 60);
    $completo  = $nombres . ' ' . $apellidos;
    if (mb_strlen($completo) > 120) { // usuario.nombre_completo es varchar(120)
        throw new ErrorValidacion('Nombres y apellidos superan los 120 caracteres.');
    }
    return [
        'tipo_documento'  => enumObligatorio($e, 'tipo_documento', 'Tipo de documento', TIPOS_DOCUMENTO_USUARIO),
        'numero_documento' => documentoObligatorio($e, 'numero_documento'),
        'nombre_completo' => $completo,
        'correo'          => correoObligatorio($e, 'correo'),
        'telefono'        => telefono($e, 'telefono', 'Teléfono', false),
    ];
}

/** La institución debe existir y estar Activa; devuelve su id o responde 400. */
function exigirInstitucionActiva(PDO $conexion, int $idInstitucion): void
{
    $consulta = $conexion->prepare("SELECT 1 FROM institucion WHERE id_institucion = ? AND estado = 'Activa' FOR UPDATE");
    $consulta->execute([$idInstitucion]);
    if (!$consulta->fetchColumn()) {
        cancelar($conexion, 'La institución seleccionada no es válida.', 400);
    }
}

/** El correo es único en TODO el sistema (el login solo pide correo y contraseña). */
function exigirCorreoLibre(PDO $conexion, string $correo, int $excluirId): void
{
    $consulta = $conexion->prepare('SELECT 1 FROM usuario WHERE correo_electronico = ? AND id_usuario <> ? LIMIT 1 FOR UPDATE');
    $consulta->execute([$correo, $excluirId]);
    if ($consulta->fetchColumn()) {
        cancelar($conexion, 'Este correo ya está registrado.', 409, ['campo' => 'correo']);
    }
}

/** Roles que el actor puede asignar. */
function rolesAsignables(array $actor): array
{
    return $actor['id_rol'] === ROL_SUPERADMIN ? ROLES_CON_PANEL_USUARIO : ROLES_QUE_GESTIONA_ADMIN_IPS;
}

/* ---------------- Acciones ---------------- */

function insertarUsuario(PDO $conexion, ?int $idInstitucion, int $rol, array $d, string $clave, string $estado): int
{
    $conexion->prepare(
        'INSERT INTO usuario (id_institucion, id_rol, tipo_documento, numero_documento, nombre_completo,
                correo_electronico, telefono, contrasena_hash, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([$idInstitucion, $rol, $d['tipo_documento'], $d['numero_documento'], $d['nombre_completo'],
                $d['correo'], $d['telefono'], password_hash($clave, PASSWORD_BCRYPT), $estado]);
    return (int)$conexion->lastInsertId();
}

/** Autorregistro público: rol Paciente y estado Activo fijados por el servidor. */
function autorregistro(PDO $conexion, array $entrada): never
{
    $d     = validarDatosPersonales($entrada);
    $clave = claveFuerte($entrada, 'clave');
    $idInstitucion = enteroObligatorio($entrada, 'id_institucion', 'Institución', 1, 4294967295);

    $conexion->beginTransaction();
    try {
        exigirInstitucionActiva($conexion, $idInstitucion);
        exigirCorreoLibre($conexion, $d['correo'], 0);
        $id = insertarUsuario($conexion, $idInstitucion, ROL_PACIENTE, $d, $clave, 'Activo');
        // No hay otro usuario que actúe: el propio paciente queda como autor del registro.
        auditar($conexion, $id, 'usuario', $id, 'Creación', null,
                ['id_institucion' => $idInstitucion, 'id_rol' => ROL_PACIENTE, 'correo_electronico' => $d['correo'], 'origen' => 'autorregistro']);
        $conexion->commit();
    } catch (Throwable $t) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        throw $t;
    }
    responderExito('Cuenta creada correctamente.', ['id' => $id], 201);
}

function crearUsuarioAdministrativo(PDO $conexion, array $actor, array $entrada): never
{
    $d     = validarDatosPersonales($entrada);
    $clave = claveFuerte($entrada, 'clave');
    $rol   = enteroObligatorio($entrada, 'id_rol', 'Rol', 1, 255);
    if (!in_array($rol, rolesAsignables($actor), true)) {
        responderError('No tiene permiso para asignar ese rol.', 403);
    }
    $estado = enumObligatorio($entrada, 'estado', 'Estado', ['Activo', 'Inactivo']);

    // El SuperAdmin es global (sin institución); los demás roles pertenecen a una institución.
    if ($rol === ROL_SUPERADMIN) {
        $idInstitucion = null;
    } elseif ($actor['id_rol'] === ROL_ADMIN_IPS) {
        $idInstitucion = $actor['id_institucion']; // la de la sesión: lo que envíe el navegador se ignora
    } else {
        $idInstitucion = enteroObligatorio($entrada, 'id_institucion', 'Institución', 1, 4294967295);
    }

    $conexion->beginTransaction();
    try {
        if ($idInstitucion !== null) {
            exigirInstitucionActiva($conexion, $idInstitucion);
        }
        exigirCorreoLibre($conexion, $d['correo'], 0);
        $id = insertarUsuario($conexion, $idInstitucion, $rol, $d, $clave, $estado);
        auditar($conexion, $actor['id_usuario'], 'usuario', $id, 'Creación', null,
                ['id_institucion' => $idInstitucion, 'id_rol' => $rol, 'correo_electronico' => $d['correo'], 'estado' => $estado]);
        $conexion->commit();
    } catch (Throwable $t) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        throw $t;
    }
    responderExito('Usuario creado correctamente.', ['id' => $id], 201);
}

function editarUsuario(PDO $conexion, array $actor, array $entrada): never
{
    $id     = enteroObligatorio($entrada, 'id', 'Usuario', 1, 4294967295);
    $d      = validarDatosPersonales($entrada);
    $rol    = enteroObligatorio($entrada, 'id_rol', 'Rol', 1, 255);
    $estado = enumObligatorio($entrada, 'estado', 'Estado', ESTADOS_USUARIO);
    if ($id === $actor['id_usuario']) {
        responderError('No puede modificar su propia cuenta desde este formulario.', 409);
    }

    $conexion->beginTransaction();
    try {
        $antes = usuarioPorId($conexion, $id, true);
        if ($antes === null || !puedeGestionar($actor, $antes)) {
            cancelar($conexion, 'El usuario no existe.', 404);
        }
        if ($rol !== (int)$antes['id_rol']) {
            if ((int)$antes['id_rol'] === ROL_SUPERADMIN || $rol === ROL_SUPERADMIN) {
                cancelar($conexion, 'El rol SuperAdmin no se puede asignar ni quitar.', 409);
            }
            if (!in_array($rol, rolesAsignables($actor), true)) {
                cancelar($conexion, 'No tiene permiso para asignar ese rol.', 403);
            }
            $profesional = $conexion->prepare('SELECT 1 FROM profesional_salud WHERE id_usuario = ? LIMIT 1');
            $profesional->execute([$id]);
            if ($profesional->fetchColumn() && $rol !== ROL_MEDICO) {
                cancelar($conexion, 'El usuario es un profesional de salud registrado: su rol no se puede cambiar.', 409);
            }
        }
        exigirCorreoLibre($conexion, $d['correo'], $id);

        // La institución no se puede cambiar: el historial del usuario pertenece a la institución donde se creó.
        $conexion->prepare(
            'UPDATE usuario SET id_rol = ?, tipo_documento = ?, numero_documento = ?, nombre_completo = ?,
                    correo_electronico = ?, telefono = ? WHERE id_usuario = ?'
        )->execute([$rol, $d['tipo_documento'], $d['numero_documento'], $d['nombre_completo'], $d['correo'], $d['telefono'], $id]);
        aplicarEstadoUsuario($conexion, $actor['id_usuario'], $antes, $estado, false);

        auditar($conexion, $actor['id_usuario'], 'usuario', $id, 'Modificación',
            ['id_rol' => (int)$antes['id_rol'], 'tipo_documento' => $antes['tipo_documento'], 'numero_documento' => $antes['numero_documento'],
             'nombre_completo' => $antes['nombre_completo'], 'correo_electronico' => $antes['correo_electronico'],
             'telefono' => $antes['telefono'], 'estado' => $antes['estado']],
            ['id_rol' => $rol, 'tipo_documento' => $d['tipo_documento'], 'numero_documento' => $d['numero_documento'],
             'nombre_completo' => $d['nombre_completo'], 'correo_electronico' => $d['correo'],
             'telefono' => $d['telefono'], 'estado' => $estado]);
        $conexion->commit();
    } catch (Throwable $t) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        throw $t;
    }
    responderExito('Cambios guardados correctamente.');
}

/* ---------------- Punto de entrada ---------------- */

exigirMetodo('GET', 'POST');
$actor = usuarioActual(); // null = visitante sin sesión

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $accion = $_GET['accion'] ?? '';
        if ($accion === 'instituciones') {
            responderExito('Instituciones activas.', ['instituciones' => leerInstitucionesActivas($conexion)]);
        }
        $actor = requerirRol([ROL_SUPERADMIN, ROL_ADMIN_IPS]);
        if ($accion === 'matriz') {
            responderExito('Matriz de permisos.', ['matriz' => leerMatrizRoles($conexion)]);
        }
        if ($accion === 'obtener') {
            $fila = usuarioPorId($conexion, enteroObligatorio($_GET, 'id', 'Usuario', 1, 4294967295));
            if ($fila === null || !puedeGestionar($actor, $fila)) {
                responderError('El usuario no existe.', 404);
            }
            responderExito('Usuario.', ['usuario' => formatoUsuario($fila, $actor)]);
        }
        responderError('Acción no válida.', 400);
    }

    $entrada = leerEntradaJson();
    $accion  = $entrada['accion'] ?? '';
    if ($actor === null) {
        if ($accion !== 'crear') {
            responderError('Acción no válida.', 400);
        }
        autorregistro($conexion, $entrada);
    }
    if (!in_array($actor['id_rol'], [ROL_SUPERADMIN, ROL_ADMIN_IPS], true)) {
        responderError('No tiene permisos para realizar esta operación.', 403);
    }
    exigirCsrf();
    match ($accion) {
        'crear'  => crearUsuarioAdministrativo($conexion, $actor, $entrada),
        'editar' => editarUsuario($conexion, $actor, $entrada),
        default  => responderError('Acción no válida.', 400),
    };
} catch (ErrorValidacion $e) {
    responderError($e->getMessage(), 400);
} catch (PDOException $e) {
    if (($e->errorInfo[1] ?? 0) === 1062) { // última defensa: índice único de la BD
        responderError('Este correo ya está registrado.', 409, ['campo' => 'correo']);
    }
    responderErrorInterno('registro_usuario.php', $e);
} catch (Throwable $e) {
    responderErrorInterno('registro_usuario.php', $e);
}