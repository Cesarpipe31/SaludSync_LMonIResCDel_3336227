<?php
// config/usuarios.php
// Reglas y consultas compartidas por los controladores de usuarios, roles y recuperación (M2-B).

require_once __DIR__ . '/respuesta.php';
require_once __DIR__ . '/sesion.php';
require_once __DIR__ . '/validacion.php';
require_once __DIR__ . '/auditoria.php';

const TIPOS_DOCUMENTO_USUARIO = ['CC', 'TI', 'RC', 'CE', 'Pasaporte', 'PEP', 'PPT']; // ENUM de usuario.tipo_documento
const ESTADOS_USUARIO         = ['Activo', 'Inactivo', 'Bloqueado'];                   // ENUM de usuario.estado
const ROLES_CON_PANEL_USUARIO = [1, 2, 3, 4, 5];  // los roles 6-12 existen en la BD pero no tienen panel (D-12)
const ROLES_QUE_GESTIONA_ADMIN_IPS = [3, 4, 5];   // un Admin IPS no crea ni toca a otros administradores
const NIVELES_ACCESO          = ['Sin acceso', 'Lectura', 'Lectura/Escritura'];       // ENUM de rol_permiso.nivel_acceso
const LIMITE_LISTADO_USUARIOS = 500;
const INTENTOS_AL_BLOQUEAR    = 3;                // mismo umbral que login.php

/** Cancela la transacción abierta (si la hay) y responde con el error indicado. */
function cancelar(PDO $conexion, string $mensaje, int $codigo, ?array $datos = null): never
{
    if ($conexion->inTransaction()) {
        $conexion->rollBack();
    }
    responderError($mensaje, $codigo, $datos);
}

/**
 * Contraseña con los mismos 5 requisitos que muestra la vista: 8 caracteres, mayúscula,
 * minúscula, número y símbolo. El máximo es de 72 bytes (límite de bcrypt).
 */
function claveFuerte(array $entrada, string $campo, string $etiqueta = 'Contraseña'): string
{
    $clave = claveObligatoria($entrada, $campo, $etiqueta);
    if (!preg_match('/[A-Z]/', $clave) || !preg_match('/[a-z]/', $clave)
        || !preg_match('/\d/', $clave) || !preg_match('/[^A-Za-z0-9]/', $clave)) {
        throw new ErrorValidacion("«{$etiqueta}» debe incluir mayúscula, minúscula, número y símbolo.");
    }
    return $clave;
}

/** La BD guarda un solo nombre_completo: para el formulario se separa (primer nombre / resto). */
function dividirNombre(string $completo): array
{
    $partes = preg_split('/\s+/u', trim($completo)) ?: [];
    $corte  = count($partes) >= 4 ? 2 : 1; // "María Fernanda | Ruiz Salazar", "Laura | Pineda Gómez"
    return [implode(' ', array_slice($partes, 0, $corte)), implode(' ', array_slice($partes, $corte))];
}

/** Un usuario no se gestiona a sí mismo; el SuperAdmin gestiona a todos y el Admin IPS solo a los roles 3-5 de su institución. */
function puedeGestionar(array $actor, array $fila): bool
{
    if ((int)$fila['id_usuario'] === $actor['id_usuario']) {
        return false;
    }
    if ($actor['id_rol'] === ROL_SUPERADMIN) {
        return true;
    }
    return $actor['id_rol'] === ROL_ADMIN_IPS
        && $fila['id_institucion'] !== null
        && (int)$fila['id_institucion'] === $actor['id_institucion']
        && in_array((int)$fila['id_rol'], ROLES_QUE_GESTIONA_ADMIN_IPS, true);
}

/** Fila de usuario -> formato que consume seguridad.js (sin hash ni token). */
function formatoUsuario(array $f, ?array $actor = null): array
{
    [$nombres, $apellidos] = dividirNombre($f['nombre_completo']);
    return [
        'id' => (int)$f['id_usuario'], 'inst' => $f['id_institucion'] === null ? null : (int)$f['id_institucion'],
        'rol' => (int)$f['id_rol'], 'tipo' => $f['tipo_documento'], 'doc' => $f['numero_documento'],
        'n' => $nombres, 'a' => $apellidos, 'correo' => $f['correo_electronico'], 'tel' => $f['telefono'] ?? '',
        'estado' => $f['estado'], 'intentos' => (int)$f['intentos_fallidos'],
        'acceso' => $f['fecha_ultimo_acceso'] === null ? null : substr($f['fecha_ultimo_acceso'], 0, 16),
        'creado' => substr($f['fecha_creacion'], 0, 10),
        'gestionable' => $actor !== null && puedeGestionar($actor, $f),
    ];
}

function usuarioPorId(PDO $conexion, int $id, bool $bloquear = false): ?array
{
    $consulta = $conexion->prepare('SELECT * FROM usuario WHERE id_usuario = ?' . ($bloquear ? ' FOR UPDATE' : ''));
    $consulta->execute([$id]);
    return $consulta->fetch() ?: null;
}

/**
 * Cambia el estado de una cuenta dentro de la transacción del llamador y lo audita (RF-SEG-03).
 * Activar reinicia los intentos fallidos; bloquear los deja en el máximo, igual que el login.
 * Con $auditarCambio = false solo actualiza (la auditoría la hace el llamador).
 */
function aplicarEstadoUsuario(PDO $conexion, int $idActor, array $fila, string $nuevo, bool $auditarCambio = true): void
{
    if ($fila['estado'] === $nuevo) {
        return;
    }
    $intentos = match ($nuevo) {
        'Activo'    => 0,
        'Bloqueado' => INTENTOS_AL_BLOQUEAR,
        default     => (int)$fila['intentos_fallidos'],
    };
    $conexion->prepare('UPDATE usuario SET estado = ?, intentos_fallidos = ? WHERE id_usuario = ?')
        ->execute([$nuevo, $intentos, $fila['id_usuario']]);
    if ($auditarCambio) { // al editar el usuario completo, la auditoría la registra quien edita (una sola fila)
        auditar($conexion, $idActor, 'usuario', (int)$fila['id_usuario'], 'Modificación',
                ['estado' => $fila['estado'], 'intentos_fallidos' => (int)$fila['intentos_fallidos']],
                ['estado' => $nuevo, 'intentos_fallidos' => $intentos]);
    }
}

/** Instituciones activas (id y nombre) para los selectores de las vistas. */
function leerInstitucionesActivas(PDO $conexion): array
{
    $filas = $conexion->query("SELECT id_institucion, razon_social FROM institucion WHERE estado = 'Activa' ORDER BY razon_social")->fetchAll();
    return array_map(static fn(array $f): array => ['id' => (int)$f['id_institucion'], 'nombre' => $f['razon_social']], $filas);
}

/**
 * Matriz rol x módulo para los roles con panel. La BD guarda 15 filas por rol (rol_permiso.id_permiso 1-15);
 * la vista las llama MOD-01 ... MOD-15 en el mismo orden (la semilla coincide con la matriz por defecto de la vista, H-10).
 */
function leerMatrizRoles(PDO $conexion): array
{
    $matriz = [];
    foreach (ROLES_CON_PANEL_USUARIO as $rol) {
        for ($n = 1; $n <= 15; $n++) {
            $matriz[$rol][sprintf('MOD-%02d', $n)] = 'Sin acceso';
        }
    }
    $consulta = $conexion->query('SELECT id_rol, id_permiso, nivel_acceso FROM rol_permiso WHERE id_rol BETWEEN 1 AND 5 AND id_permiso BETWEEN 1 AND 15');
    foreach ($consulta as $fila) {
        $matriz[(int)$fila['id_rol']][sprintf('MOD-%02d', (int)$fila['id_permiso'])] = $fila['nivel_acceso'];
    }
    return $matriz;
}

/** Bitácora de auditoría con paginación SQL (RNF-REN-02). $idInstitucion limita a los actores de esa institución. */
function leerAuditoria(PDO $conexion, ?int $idInstitucion, int $limite, int $desplazamiento): array
{
    $union = ' FROM auditoria_clinica a INNER JOIN usuario u ON u.id_usuario = a.id_usuario INNER JOIN rol r ON r.id_rol = u.id_rol'
           . ($idInstitucion !== null ? ' WHERE u.id_institucion = ?' : '');
    $total = $conexion->prepare('SELECT COUNT(*)' . $union);
    $total->execute($idInstitucion !== null ? [$idInstitucion] : []);

    $consulta = $conexion->prepare('SELECT a.*, u.nombre_completo, r.nombre_rol' . $union . ' ORDER BY a.id_auditoria DESC LIMIT ? OFFSET ?');
    $posicion = 1;
    if ($idInstitucion !== null) {
        $consulta->bindValue($posicion++, $idInstitucion, PDO::PARAM_INT);
    }
    $consulta->bindValue($posicion++, $limite, PDO::PARAM_INT);
    $consulta->bindValue($posicion, $desplazamiento, PDO::PARAM_INT);
    $consulta->execute();

    $filas = array_map(static fn(array $a): array => [
        'id' => (int)$a['id_auditoria'], 'usuario' => $a['nombre_completo'] . ' (' . $a['nombre_rol'] . ')',
        'tabla' => $a['tabla_afectada'], 'registro' => (int)$a['id_registro_afectado'], 'accion' => $a['accion'],
        'ant' => $a['estado_anterior'] === null ? null : json_decode($a['estado_anterior'], true),
        'nuevo' => $a['estado_nuevo'] === null ? null : json_decode($a['estado_nuevo'], true),
        'ip' => $a['direccion_ip'] ?? '', 'fecha' => substr($a['fecha_hora'], 0, 16),
    ], $consulta->fetchAll());
    return ['auditoria' => $filas, 'total' => (int)$total->fetchColumn()];
}