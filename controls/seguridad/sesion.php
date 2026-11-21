<?php
// controls/seguridad/sesion.php
// Consulta el estado de la sesión. Lo llama main.js en cada página para saber quién está autenticado.
// Método: GET. Respuesta: JSON uniforme, SIEMPRE 200 cuando el servidor funciona:
//   datos = { autenticado: false }   -> sin sesión (no es un error: las páginas públicas también la consultan)
//   datos = { autenticado: true, id, nombre, rol, rolId, instId, csrf }

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/sesion.php';

exigirMetodo('GET');

try {
    $actual = usuarioActual();
    if ($actual === null) {
        responderExito('Sin sesión activa.', ['autenticado' => false]);
    }

    // Se vuelve a comprobar en la BD: si el usuario o su institución fueron desactivados,
    // la sesión deja de valer en la siguiente carga de página.
    $consulta = $conexion->prepare(
        'SELECT u.estado, r.nombre_rol, i.estado AS estado_institucion
           FROM usuario u
           INNER JOIN rol r ON r.id_rol = u.id_rol
           LEFT JOIN institucion i ON i.id_institucion = u.id_institucion
          WHERE u.id_usuario = ?'
    );
    $consulta->execute([$actual['id_usuario']]);
    $fila = $consulta->fetch();

    $institucionInvalida = $actual['id_institucion'] !== null
        && ($fila['estado_institucion'] ?? null) !== 'Activa';
    if (!$fila || $fila['estado'] !== 'Activo' || $institucionInvalida) {
        cerrarSesion();
        responderExito('La sesión ya no es válida.', ['autenticado' => false]);
    }

    responderExito('Sesión activa.', [
        'autenticado' => true,
        'id'          => $actual['id_usuario'],
        'nombre'      => $actual['nombre'],
        'rol'         => $fila['nombre_rol'],
        'rolId'       => $actual['id_rol'],
        'instId'      => $actual['id_institucion'],
        'csrf'        => tokenCsrf(),
    ]);
} catch (Throwable $e) {
    responderErrorInterno('sesion.php', $e);
}