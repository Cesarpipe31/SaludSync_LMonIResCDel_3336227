<?php
// config/sesion.php
// Sesión segura, guardas por rol y protección CSRF.
// En la sesión solo se guardan: id_usuario, nombre, id_rol, id_institucion y el token CSRF.

require_once __DIR__ . '/respuesta.php';

// Misma zona horaria que la conexión a MySQL (ver database.php).
date_default_timezone_set('America/Bogota');

// Identificadores de rol tomados de la tabla rol del script SQL.
const ROL_SUPERADMIN = 1;
const ROL_ADMIN_IPS  = 2;
const ROL_MEDICO     = 3;
const ROL_RECEPCION  = 4;
const ROL_PACIENTE   = 5;

// RNF-SEG-03: la sesión se destruye tras 15 minutos sin actividad.
const SESION_INACTIVIDAD_SEG = 900;

/** Inicia la sesión con parámetros seguros. Es idempotente: se puede llamar varias veces. */
function iniciarSesionSegura(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    ini_set('session.use_strict_mode', '1'); // el servidor rechaza identificadores de sesión que no creó
    ini_set('session.use_only_cookies', '1'); // nunca el identificador en la URL
    session_name('SALUDSYNCSESSID');
    session_set_cookie_params([
        'lifetime' => 0,                       // la cookie muere al cerrar el navegador
        'path'     => '/',
        'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', // en XAMPP http no lo exige
        'httponly' => true,                    // JavaScript no puede leer la cookie
        'samesite' => 'Lax',                   // primera defensa contra CSRF
    ]);
    session_start();
    aplicarExpiracion();
}

/** Descarta la sesión si superó el tiempo de inactividad; si no, renueva el reloj. */
function aplicarExpiracion(): void
{
    $ahora = time();
    if (isset($_SESSION['ultima_actividad'])
        && ($ahora - (int)$_SESSION['ultima_actividad']) > SESION_INACTIVIDAD_SEG) {
        $_SESSION = [];
        session_regenerate_id(true);
    }
    $_SESSION['ultima_actividad'] = $ahora;
}

/**
 * Abre la sesión de un usuario ya autenticado.
 * Recibe una fila de la tabla usuario; NUNCA se guarda la contraseña ni su hash.
 */
function abrirSesionUsuario(array $usuario): void
{
    iniciarSesionSegura();
    session_regenerate_id(true); // evita la fijación de sesión
    $_SESSION = [
        'id_usuario'       => (int)$usuario['id_usuario'],
        'nombre'           => (string)$usuario['nombre_completo'],
        'id_rol'           => (int)$usuario['id_rol'],
        'id_institucion'   => $usuario['id_institucion'] === null ? null : (int)$usuario['id_institucion'],
        'ultima_actividad' => time(),
        'csrf'             => bin2hex(random_bytes(32)),
    ];
}

/** Cierra la sesión por completo (datos y cookie). */
function cerrarSesion(): void
{
    iniciarSesionSegura();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires'  => time() - 42000,
            'path'     => $p['path'],
            'domain'   => $p['domain'],
            'secure'   => $p['secure'],
            'httponly' => $p['httponly'],
            'samesite' => $p['samesite'] ?? 'Lax',
        ]);
    }
    session_destroy();
}

/** Devuelve los datos del usuario en sesión o null si no hay sesión. */
function usuarioActual(): ?array
{
    iniciarSesionSegura();
    if (empty($_SESSION['id_usuario'])) {
        return null;
    }
    return [
        'id_usuario'     => (int)$_SESSION['id_usuario'],
        'nombre'         => (string)$_SESSION['nombre'],
        'id_rol'         => (int)$_SESSION['id_rol'],
        'id_institucion' => $_SESSION['id_institucion'] === null ? null : (int)$_SESSION['id_institucion'],
    ];
}

/** Guarda de sesión: responde 401 si no hay usuario autenticado. */
function requerirSesion(): array
{
    return usuarioActual() ?? responderError('Sesión no iniciada o expirada.', 401);
}

/** Guarda de rol: 401 sin sesión, 403 si el rol no está en la lista. El rol sale de la sesión del servidor. */
function requerirRol(array $rolesPermitidos): array
{
    $usuario = requerirSesion();
    if (!in_array($usuario['id_rol'], $rolesPermitidos, true)) {
        responderError('No tiene permisos para realizar esta operación.', 403);
    }
    return $usuario;
}

/** Token CSRF de la sesión actual (lo entrega controls/seguridad/sesion.php). */
function tokenCsrf(): string
{
    iniciarSesionSegura();
    return (string)($_SESSION['csrf'] ?? '');
}

/**
 * Exige el token CSRF en peticiones que modifican datos.
 * Lo busca en la cabecera X-CSRF-Token (fetch) o en el campo oculto "csrf" (formulario POST).
 */
function exigirCsrf(): void
{
    $esperado = tokenCsrf();
    $recibido = (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['csrf'] ?? ''));
    if ($esperado === '' || !hash_equals($esperado, $recibido)) {
        responderError('Solicitud no autorizada. Recargue la página e intente de nuevo.', 403);
    }
}

/** Institución del usuario en sesión (null para el SuperAdmin, que es global). */
function institucionDeSesion(): ?int
{
    $usuario = requerirSesion();
    return $usuario['id_institucion'];
}