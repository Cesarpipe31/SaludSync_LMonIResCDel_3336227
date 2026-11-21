<?php
// controls/seguridad/login.php
// RF-SEG-01: autenticación de usuarios.
// Método: POST (formulario de views/seguridad/login.html). Campos aceptados: correo, contrasena.
// Respuesta: redirección RELATIVA a login.html con un parámetro de estado que la vista traduce en mensaje:
//   ?acceso=ok  -> credenciales correctas, la sesión ya está abierta
//   ?error=datos|credenciales|bloqueada|inactiva|institucion|rol|sistema

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/sesion.php';
require_once __DIR__ . '/../../config/validacion.php';
require_once __DIR__ . '/../../config/auditoria.php';

const VISTA_LOGIN = '../../views/seguridad/login.html';

// Tras 3 intentos fallidos la cuenta se bloquea (umbral que anuncia la vista de login).
const MAX_INTENTOS_FALLIDOS = 3;

// Roles que ya tienen panel en el front (los otros 7 roles del SQL quedan fuera de alcance).
const ROLES_CON_PANEL = [ROL_SUPERADMIN, ROL_ADMIN_IPS, ROL_MEDICO, ROL_RECEPCION, ROL_PACIENTE];

// Hash bcrypt de una clave aleatoria que nadie conoce. Se verifica contra él cuando el correo no existe,
// para que la respuesta tarde lo mismo y no se pueda deducir qué correos están registrados.
const HASH_SIN_USUARIO = '$2y$10$wnyhBBVSKxTjngIjKRQmNuXrtzzWV9pE1e/I7IJKcHMMEykXfNXVe';

/** Vuelve a la pantalla de login con un único parámetro de estado. */
function volverAlLogin(string $parametro, string $valor): never
{
    redirigir(VISTA_LOGIN, [$parametro => $valor]);
}

/**
 * Suma un intento fallido a una cuenta Activa y la bloquea al llegar al máximo.
 * Corre en transacción con SELECT ... FOR UPDATE para que dos intentos simultáneos no se pisen.
 * Devuelve true si este intento provocó el bloqueo.
 */
function registrarIntentoFallido(PDO $conexion, int $idUsuario): bool
{
    $conexion->beginTransaction();
    try {
        $consulta = $conexion->prepare('SELECT intentos_fallidos, estado FROM usuario WHERE id_usuario = ? FOR UPDATE');
        $consulta->execute([$idUsuario]);
        $fila = $consulta->fetch();

        // Las cuentas Inactivas o ya Bloqueadas no acumulan intentos.
        if (!$fila || $fila['estado'] !== 'Activo') {
            $conexion->commit();
            return false;
        }

        $intentos = (int)$fila['intentos_fallidos'] + 1;
        $bloquear = $intentos >= MAX_INTENTOS_FALLIDOS;

        $actualizar = $conexion->prepare('UPDATE usuario SET intentos_fallidos = ?, estado = ? WHERE id_usuario = ?');
        $actualizar->execute([$intentos, $bloquear ? 'Bloqueado' : 'Activo', $idUsuario]);

        if ($bloquear) {
            // El bloqueo es un cambio de estado de la cuenta: queda en auditoría (RF-SEG-03).
            auditar(
                $conexion, $idUsuario, 'usuario', $idUsuario, 'Modificación',
                ['estado' => 'Activo', 'intentos_fallidos' => $intentos - 1],
                ['estado' => 'Bloqueado', 'intentos_fallidos' => $intentos]
            );
        }

        $conexion->commit();
        return $bloquear;
    } catch (Throwable $e) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        throw $e;
    }
}

// Solo POST: abrir esta URL en el navegador (GET) devuelve 405 en JSON.
exigirMetodo('POST');

// 1) Validación en servidor (lista blanca de campos).
try {
    $entrada = soloCampos($_POST, ['correo', 'contrasena']);
    $correo  = correoObligatorio($entrada, 'correo', 'Correo electrónico');
    $clave   = $entrada['contrasena'] ?? '';
    // 128 es un tope defensivo: evita enviar textos enormes a password_verify().
    if (!is_string($clave) || $clave === '' || strlen($clave) > 128) {
        throw new ErrorValidacion('Contraseña no válida.');
    }
} catch (ErrorValidacion $e) {
    volverAlLogin('error', 'datos');
}

try {
    // 2) Búsqueda del usuario con consulta preparada. LIMIT 2 basta para detectar correos repetidos.
    $consulta = $conexion->prepare(
        'SELECT u.id_usuario, u.id_institucion, u.id_rol, u.nombre_completo, u.contrasena_hash,
                u.estado, i.estado AS estado_institucion
           FROM usuario u
           LEFT JOIN institucion i ON i.id_institucion = u.id_institucion
          WHERE u.correo_electronico = ?
          LIMIT 2'
    );
    $consulta->execute([$correo]);
    $filas = $consulta->fetchAll();

    // El esquema solo exige correo único por institución. Si el mismo correo existe en dos
    // instituciones no se puede saber a qué cuenta entrar: se rechaza (falla cerrada).
    if (count($filas) > 1) {
        error_log('login.php: correo repetido en varias instituciones.');
        password_verify($clave, HASH_SIN_USUARIO);
        volverAlLogin('error', 'credenciales');
    }

    $usuario = $filas[0] ?? null;

    // 3) Verificación de la contraseña. Siempre se ejecuta password_verify (con el hash ficticio si no hay usuario).
    $claveCorrecta = password_verify($clave, $usuario['contrasena_hash'] ?? HASH_SIN_USUARIO) && $usuario !== null;

    if (!$claveCorrecta) {
        $seBloqueo = $usuario !== null && registrarIntentoFallido($conexion, (int)$usuario['id_usuario']);
        volverAlLogin('error', $seBloqueo ? 'bloqueada' : 'credenciales');
    }

    // 4) Con la contraseña correcta ya se puede informar el estado real de la cuenta.
    if ($usuario['estado'] === 'Bloqueado') {
        volverAlLogin('error', 'bloqueada');
    }
    if ($usuario['estado'] === 'Inactivo') {
        volverAlLogin('error', 'inactiva');
    }
    if ($usuario['id_institucion'] !== null && $usuario['estado_institucion'] !== 'Activa') {
        volverAlLogin('error', 'institucion');
    }
    if (!in_array((int)$usuario['id_rol'], ROLES_CON_PANEL, true)) {
        volverAlLogin('error', 'rol');
    }

    // 5) Acceso concedido: se reinicia el contador y se registra el último acceso.
    $conexion->prepare('UPDATE usuario SET intentos_fallidos = 0, fecha_ultimo_acceso = NOW() WHERE id_usuario = ?')
        ->execute([(int)$usuario['id_usuario']]);

    // 6) Sesión nueva (con id regenerado). El rol y la institución los define el servidor, no el navegador.
    abrirSesionUsuario($usuario);
    volverAlLogin('acceso', 'ok');
} catch (Throwable $e) {
    error_log('login.php: ' . $e->getMessage());
    volverAlLogin('error', 'sistema');
}