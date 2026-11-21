<?php
// controls/seguridad/directorio_usuarios.php
// Directorio de usuarios, cambio de estado y bitácora de auditoría (RF-SEG-02 y RF-SEG-03).
// Atiende la vista directorio_usuarios.html. Roles: SuperAdmin (todos los usuarios) y Admin IPS (solo su institución).
// Respuesta: JSON uniforme { ok, mensaje, datos }.
//
//   GET  ?accion=listar                           -> { usuarios, instituciones, matriz, auditoria }
//   GET  ?accion=auditoria&pagina=1&limite=20     -> { auditoria, total, pagina, limite }   (paginación SQL)
//   POST { accion: 'estado', id, estado }          -> 200   (estado: Activo | Inactivo | Bloqueado)
// Los POST exigen el token CSRF (cabecera X-CSRF-Token).

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/usuarios.php';

/** Institución a la que se limita la consulta: el Admin IPS solo ve la suya; el SuperAdmin ve todo (null). */
function alcanceInstitucion(array $actor): ?int
{
    return $actor['id_rol'] === ROL_ADMIN_IPS ? $actor['id_institucion'] : null;
}

function listarDirectorio(PDO $conexion, array $actor): never
{
    $alcance  = alcanceInstitucion($actor);
    $consulta = $conexion->prepare(
        'SELECT * FROM usuario' . ($alcance !== null ? ' WHERE id_institucion = ?' : '') . ' ORDER BY id_usuario LIMIT ?'
    );
    $posicion = 1;
    if ($alcance !== null) {
        $consulta->bindValue($posicion++, $alcance, PDO::PARAM_INT);
    }
    $consulta->bindValue($posicion, LIMITE_LISTADO_USUARIOS, PDO::PARAM_INT);
    $consulta->execute();

    $instituciones = $conexion->prepare(
        'SELECT id_institucion, razon_social, estado FROM institucion' . ($alcance !== null ? ' WHERE id_institucion = ?' : '') . ' ORDER BY id_institucion'
    );
    $instituciones->execute($alcance !== null ? [$alcance] : []);

    responderExito('Directorio de usuarios.', [
        'usuarios'      => array_map(static fn(array $f): array => formatoUsuario($f, $actor), $consulta->fetchAll()),
        'instituciones' => array_map(static fn(array $i): array => ['id' => (int)$i['id_institucion'], 'nombre' => $i['razon_social'], 'estado' => $i['estado']], $instituciones->fetchAll()),
        'matriz'        => leerMatrizRoles($conexion),
        'auditoria'     => leerAuditoria($conexion, $alcance, 6, 0)['auditoria'],
    ]);
}

function consultarAuditoria(PDO $conexion, array $actor): never
{
    $pag = paginacion($_GET, 20, 100);
    $res = leerAuditoria($conexion, alcanceInstitucion($actor), $pag['limite'], $pag['desplazamiento']);
    responderExito('Bitácora de auditoría.', $res + ['pagina' => $pag['pagina'], 'limite' => $pag['limite']]);
}

/** Cambia el estado de una cuenta (eliminación lógica: nunca se borra un usuario). */
function cambiarEstado(PDO $conexion, array $actor, array $entrada): never
{
    $id     = enteroObligatorio($entrada, 'id', 'Usuario', 1, 4294967295);
    $estado = enumObligatorio($entrada, 'estado', 'Estado', ESTADOS_USUARIO);
    if ($id === $actor['id_usuario']) {
        responderError('No puede cambiar el estado de su propia cuenta.', 409);
    }

    $conexion->beginTransaction();
    try {
        $fila = usuarioPorId($conexion, $id, true);
        // Si no existe o no es gestionable por este actor se responde igual ("no existe") para no revelar cuentas ajenas.
        if ($fila === null || !puedeGestionar($actor, $fila)) {
            cancelar($conexion, 'El usuario no existe.', 404);
        }
        aplicarEstadoUsuario($conexion, $actor['id_usuario'], $fila, $estado);
        $conexion->commit();
    } catch (Throwable $t) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        throw $t;
    }
    responderExito('Estado actualizado.', ['estado' => $estado]);
}

/* ---------------- Punto de entrada ---------------- */

exigirMetodo('GET', 'POST');
$actor = requerirRol([ROL_SUPERADMIN, ROL_ADMIN_IPS]);

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        match ($_GET['accion'] ?? '') {
            'listar'    => listarDirectorio($conexion, $actor),
            'auditoria' => consultarAuditoria($conexion, $actor),
            default     => responderError('Acción no válida.', 400),
        };
    }

    exigirCsrf();
    $entrada = leerEntradaJson();
    match ($entrada['accion'] ?? '') {
        'estado' => cambiarEstado($conexion, $actor, $entrada),
        default  => responderError('Acción no válida.', 400),
    };
} catch (ErrorValidacion $e) {
    responderError($e->getMessage(), 400);
} catch (Throwable $e) {
    responderErrorInterno('directorio_usuarios.php', $e);
}