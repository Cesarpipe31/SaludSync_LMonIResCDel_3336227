<?php
// controls/seguridad/logout.php
// Cierre de sesión. Método: POST con token CSRF (cabecera X-CSRF-Token que agrega SS.api).
// Es idempotente: si ya no hay sesión, responde 200 igualmente.
// Respuesta: JSON uniforme { ok, mensaje, datos }.

require_once __DIR__ . '/../../config/sesion.php';

exigirMetodo('POST');

if (usuarioActual() === null) {
    responderExito('No había una sesión activa.');
}

// Con sesión activa se exige el token: evita que otra página cierre la sesión del usuario sin su intención.
exigirCsrf();
cerrarSesion();
responderExito('Sesión cerrada correctamente.');