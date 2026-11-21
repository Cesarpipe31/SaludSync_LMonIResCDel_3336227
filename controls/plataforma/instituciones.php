<?php
// controls/plataforma/instituciones.php
// RF-PLA-01: alta, edición, consulta y activación/desactivación de instituciones.
// Atiende las vistas instituciones.html y registro_institucion.html.
// Rol permitido: SuperAdmin. Respuesta: JSON uniforme { ok, mensaje, datos }.
//
//   GET  ?accion=listar                      -> { instituciones, suscripciones, planes }
//   POST { accion: 'crear',  ...campos }      -> 201 { id, credenciales: { correo, clave } }
//   POST { accion: 'editar', id, ...campos }  -> 200
//   POST { accion: 'estado', id, estado }     -> 200 (estado: Activa | Inactiva; no se borra nada)
// Los POST exigen el token CSRF (cabecera X-CSRF-Token).

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/sesion.php';
require_once __DIR__ . '/../../config/validacion.php';
require_once __DIR__ . '/../../config/auditoria.php';
require_once __DIR__ . '/../../config/plataforma.php';

// Lista cerrada de la vista. El esquema no tiene dónde guardarlos: se validan pero no se almacenan.
const SERVICIOS_PERMITIDOS = ['Consulta Externa', 'Medicina General', 'Especialidades', 'Laboratorio', 'Odontología'];

/* ---------------- Validación ---------------- */

/** Texto formado solo por dígitos, con longitud mínima y máxima. */
function digitosObligatorios(array $entrada, string $campo, string $etiqueta, int $min, int $max): string
{
    $valor = limpiarTexto($entrada[$campo] ?? '');
    if (!preg_match('/^\d{' . $min . ',' . $max . '}$/', $valor)) {
        throw new ErrorValidacion("«{$etiqueta}» debe tener solo números ({$min} a {$max} dígitos).");
    }
    return $valor;
}

/** Valida los datos comunes de alta y edición. Devuelve solo los campos que se van a guardar. */
function validarInstitucion(array $e): array
{
    $reps = limpiarTexto($e['codigo_reps'] ?? '');
    if (!preg_match('/^[0-9A-Za-z\-]{6,30}$/', $reps)) {
        throw new ErrorValidacion('Ingrese un código REPS válido (6 a 30 caracteres).');
    }

    $servicios = $e['servicios'] ?? [];
    if (!is_array($servicios)) {
        throw new ErrorValidacion('Los servicios no tienen un formato válido.');
    }
    foreach ($servicios as $servicio) {
        if (!is_string($servicio) || !in_array($servicio, SERVICIOS_PERMITIDOS, true)) {
            throw new ErrorValidacion('Uno de los servicios seleccionados no es válido.');
        }
    }

    return [
        'razon_social'   => textoObligatorio($e, 'razon_social', 'Razón social', 2, 150),
        'nit'            => digitosObligatorios($e, 'nit', 'NIT', 8, 10),
        'codigo_reps'    => $reps,
        'rep_nombre'     => textoObligatorio($e, 'rep_nombre', 'Representante legal', 2, 100),
        'rep_documento'  => digitosObligatorios($e, 'rep_documento', 'Documento del representante', 5, 20),
        'departamento'   => textoObligatorio($e, 'departamento', 'Departamento', 2, 60),
        'ciudad'         => textoObligatorio($e, 'ciudad', 'Ciudad', 2, 60),
        'direccion'      => textoObligatorio($e, 'direccion', 'Dirección', 3, 150),
        'telefono'       => telefono($e, 'telefono', 'Teléfono', false),
        'correo_contacto' => correoObligatorio($e, 'correo_contacto', 'Correo de contacto'),
    ];
}

/** Valida los datos del administrador inicial (solo en el alta). */
function validarAdministrador(array $e): array
{
    return [
        'nombre'    => textoObligatorio($e, 'adm_nombre', 'Nombre del administrador', 2, 100),
        'documento' => digitosObligatorios($e, 'adm_documento', 'Documento del administrador', 5, 20),
        'correo'    => correoObligatorio($e, 'adm_correo', 'Correo del administrador'),
    ];
}

/* ---------------- Utilidades ---------------- */

function elegirCaracter(string $conjunto): string
{
    return $conjunto[random_int(0, strlen($conjunto) - 1)];
}

/** Clave temporal de 12 caracteres con mayúscula, minúscula, número y símbolo (se muestra una sola vez). */
function generarClaveTemporal(): string
{
    $mayus = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    $minus = 'abcdefghijkmnpqrstuvwxyz';
    $nums  = '23456789';
    $simb  = '!@#$%&*';
    $c = [elegirCaracter($mayus), elegirCaracter($minus), elegirCaracter($nums), elegirCaracter($simb)];
    while (count($c) < 12) {
        $c[] = elegirCaracter($mayus . $minus . $nums . $simb);
    }
    for ($i = count($c) - 1; $i > 0; $i--) { // mezcla Fisher-Yates con aleatoriedad criptográfica
        $j = random_int(0, $i);
        [$c[$i], $c[$j]] = [$c[$j], $c[$i]];
    }
    return implode('', $c);
}

/**
 * Busca otra institución con el mismo NIT o REPS (bloqueando las filas encontradas).
 * El NIT se compara sin dígito de verificación: en la BD se guarda como "900111221-1".
 * Devuelve 'nit', 'reps' o null.
 */
function buscarDuplicado(PDO $conexion, string $nit, string $reps, int $excluirId): ?string
{
    $consulta = $conexion->prepare(
        'SELECT nit, codigo_reps FROM institucion
          WHERE (nit = ? OR nit LIKE ? OR codigo_reps = ?) AND id_institucion <> ? FOR UPDATE'
    );
    $consulta->execute([$nit, $nit . '-%', $reps, $excluirId]);
    $duplicado = null;
    foreach ($consulta as $fila) {
        if (explode('-', $fila['nit'])[0] === $nit) {
            return 'nit';
        }
        if (strcasecmp($fila['codigo_reps'], $reps) === 0) {
            $duplicado = 'reps';
        }
    }
    return $duplicado;
}

const MENSAJES_DUPLICADO = [
    'nit'  => 'Este NIT ya está registrado en la plataforma.',
    'reps' => 'Este código REPS ya está registrado.',
];

/** Estado de una institución tal como se guarda en auditoría (sin datos de más). */
function resumenInstitucion(array $fila): array
{
    return ['razon_social' => $fila['razon_social'], 'nit' => $fila['nit'], 'codigo_reps' => $fila['codigo_reps'],
            'estado' => $fila['estado']];
}

/* ---------------- Acciones ---------------- */

function listarInstituciones(PDO $conexion): never
{
    sincronizarEstados($conexion);
    responderExito('Listado de instituciones.', [
        'instituciones' => leerInstituciones($conexion),
        'suscripciones' => leerSuscripcionesActuales($conexion),
        'planes'        => leerPlanes($conexion),
    ]);
}

function crearInstitucion(PDO $conexion, array $actor, array $entrada): never
{
    $d   = validarInstitucion($entrada);
    $adm = validarAdministrador($entrada);
    $nitConDv = $d['nit'] . '-' . calcularDvNit($d['nit']); // el dígito lo calcula el servidor, no el navegador

    $conexion->beginTransaction();
    try {
        $duplicado = buscarDuplicado($conexion, $d['nit'], $d['codigo_reps'], 0);
        if ($duplicado !== null) {
            abortar($conexion, MENSAJES_DUPLICADO[$duplicado], 409, ['campo' => $duplicado]);
        }
        $correoUsado = $conexion->prepare('SELECT 1 FROM usuario WHERE correo_electronico = ? LIMIT 1 FOR UPDATE');
        $correoUsado->execute([$adm['correo']]);
        if ($correoUsado->fetchColumn()) {
            abortar($conexion, 'Ya existe un usuario con el correo del administrador.', 409, ['campo' => 'adm_correo']);
        }

        $conexion->prepare(
            'INSERT INTO institucion (razon_social, nit, codigo_reps, representante_legal_nombre,
                    representante_legal_documento, departamento, ciudad, direccion, telefono, correo_contacto)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([$d['razon_social'], $nitConDv, $d['codigo_reps'], $d['rep_nombre'], $d['rep_documento'],
                    $d['departamento'], $d['ciudad'], $d['direccion'], $d['telefono'], $d['correo_contacto']]);
        $idInstitucion = (int)$conexion->lastInsertId();

        // Administrador principal (rol Admin IPS). El formulario no pide tipo de documento: se asume CC [SUPUESTO].
        $clave = generarClaveTemporal();
        $conexion->prepare(
            "INSERT INTO usuario (id_institucion, id_rol, tipo_documento, numero_documento, nombre_completo,
                    correo_electronico, contrasena_hash, estado)
             VALUES (?, ?, 'CC', ?, ?, ?, ?, 'Activo')"
        )->execute([$idInstitucion, ROL_ADMIN_IPS, $adm['documento'], $adm['nombre'], $adm['correo'],
                    password_hash($clave, PASSWORD_BCRYPT)]);
        $idAdmin = (int)$conexion->lastInsertId();

        auditar($conexion, $actor['id_usuario'], 'institucion', $idInstitucion, 'Creación', null,
                ['razon_social' => $d['razon_social'], 'nit' => $nitConDv, 'codigo_reps' => $d['codigo_reps'], 'estado' => 'Activa']);
        auditar($conexion, $actor['id_usuario'], 'usuario', $idAdmin, 'Creación', null,
                ['id_institucion' => $idInstitucion, 'id_rol' => ROL_ADMIN_IPS, 'correo_electronico' => $adm['correo']]);
        $conexion->commit();
    } catch (Throwable $t) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        throw $t;
    }

    // La clave temporal solo viaja en esta respuesta: no se guarda en claro ni se escribe en ningún log.
    responderExito('Institución registrada correctamente.', [
        'id' => $idInstitucion,
        'credenciales' => ['correo' => $adm['correo'], 'clave' => $clave],
    ], 201);
}

function editarInstitucion(PDO $conexion, array $actor, array $entrada): never
{
    $id = enteroObligatorio($entrada, 'id', 'Institución', 1, 4294967295);
    $d  = validarInstitucion($entrada);
    $nitConDv = $d['nit'] . '-' . calcularDvNit($d['nit']);

    $conexion->beginTransaction();
    try {
        $actual = $conexion->prepare('SELECT * FROM institucion WHERE id_institucion = ? FOR UPDATE');
        $actual->execute([$id]);
        $antes = $actual->fetch();
        if (!$antes) {
            abortar($conexion, 'La institución no existe.', 404);
        }
        $duplicado = buscarDuplicado($conexion, $d['nit'], $d['codigo_reps'], $id);
        if ($duplicado !== null) {
            abortar($conexion, MENSAJES_DUPLICADO[$duplicado], 409, ['campo' => $duplicado]);
        }

        $conexion->prepare(
            'UPDATE institucion SET razon_social = ?, nit = ?, codigo_reps = ?, representante_legal_nombre = ?,
                    representante_legal_documento = ?, departamento = ?, ciudad = ?, direccion = ?,
                    telefono = ?, correo_contacto = ? WHERE id_institucion = ?'
        )->execute([$d['razon_social'], $nitConDv, $d['codigo_reps'], $d['rep_nombre'], $d['rep_documento'],
                    $d['departamento'], $d['ciudad'], $d['direccion'], $d['telefono'], $d['correo_contacto'], $id]);

        auditar($conexion, $actor['id_usuario'], 'institucion', $id, 'Modificación', resumenInstitucion($antes),
                ['razon_social' => $d['razon_social'], 'nit' => $nitConDv, 'codigo_reps' => $d['codigo_reps'],
                 'estado' => $antes['estado']]);
        $conexion->commit();
    } catch (Throwable $t) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        throw $t;
    }
    responderExito('Cambios guardados correctamente.');
}

/** Eliminación lógica (D-7): la institución nunca se borra; una Inactiva bloquea el acceso de sus usuarios. */
function cambiarEstadoInstitucion(PDO $conexion, array $actor, array $entrada): never
{
    $id     = enteroObligatorio($entrada, 'id', 'Institución', 1, 4294967295);
    $estado = enumObligatorio($entrada, 'estado', 'Estado', ['Activa', 'Inactiva']);

    $conexion->beginTransaction();
    try {
        $actual = $conexion->prepare('SELECT * FROM institucion WHERE id_institucion = ? FOR UPDATE');
        $actual->execute([$id]);
        $antes = $actual->fetch();
        if (!$antes) {
            abortar($conexion, 'La institución no existe.', 404);
        }
        if ($antes['estado'] !== $estado) {
            $conexion->prepare('UPDATE institucion SET estado = ? WHERE id_institucion = ?')->execute([$estado, $id]);
            auditar($conexion, $actor['id_usuario'], 'institucion', $id, 'Modificación',
                    ['estado' => $antes['estado']], ['estado' => $estado]);
        }
        $conexion->commit();
    } catch (Throwable $t) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        throw $t;
    }
    responderExito($estado === 'Activa' ? 'Institución activada.' : 'Institución desactivada.');
}

/* ---------------- Punto de entrada ---------------- */

exigirMetodo('GET', 'POST');
$actor = requerirRol([ROL_SUPERADMIN]);

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (($_GET['accion'] ?? '') !== 'listar') {
            responderError('Acción no válida.', 400);
        }
        listarInstituciones($conexion);
    }

    exigirCsrf();
    $entrada = leerEntradaJson();
    match ($entrada['accion'] ?? '') {
        'crear'  => crearInstitucion($conexion, $actor, $entrada),
        'editar' => editarInstitucion($conexion, $actor, $entrada),
        'estado' => cambiarEstadoInstitucion($conexion, $actor, $entrada),
        default  => responderError('Acción no válida.', 400),
    };
} catch (ErrorValidacion $e) {
    responderError($e->getMessage(), 400);
} catch (PDOException $e) {
    if (($e->errorInfo[1] ?? 0) === 1062) { // última defensa: índice único de la BD
        responderError('Ya existe un registro con esos datos (NIT, REPS o correo).', 409);
    }
    responderErrorInterno('instituciones.php', $e);
} catch (Throwable $e) {
    responderErrorInterno('instituciones.php', $e);
}