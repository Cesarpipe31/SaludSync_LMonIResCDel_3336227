<?php
// config/auditoria.php
// RF-SEG-03: auditoría transaccional.
// auditar() debe llamarse DENTRO de la misma transacción que modifica los datos
// (después del INSERT/UPDATE y antes de commit()). Si la auditoría falla, lanza una
// excepción y el controlador hace rollBack(): no queda una acción sin su huella.
//
// Limitaciones del esquema:
//  - accion solo admite: Apertura, Creación, Modificación, Cierre. La eliminación lógica
//    se registra como "Modificación" con el nuevo estado en estado_nuevo.
//  - id_registro_afectado es un solo entero: en tablas de llave compuesta se usa el id del registro padre.
//  - id_usuario es obligatorio: un intento de login con un correo que no existe no se puede auditar.

const ACCIONES_AUDITORIA = ['Apertura', 'Creación', 'Modificación', 'Cierre'];

// Campos que nunca deben quedar escritos en el JSON de auditoría.
const CAMPOS_SENSIBLES_AUDITORIA = ['contrasena_hash', 'clave', 'contrasena', 'token_recuperacion', 'token_expiracion'];

/** Reemplaza por '***' los campos sensibles del primer nivel del arreglo. */
function ocultarSensibles(?array $estado): ?array
{
    if ($estado === null) {
        return null;
    }
    foreach (CAMPOS_SENSIBLES_AUDITORIA as $campo) {
        if (array_key_exists($campo, $estado)) {
            $estado[$campo] = '***';
        }
    }
    return $estado;
}

/**
 * Inserta una fila en auditoria_clinica.
 *
 * @param PDO        $conexion   Conexión con la transacción ya abierta.
 * @param int        $idUsuario  Usuario responsable (sale de la sesión, nunca del cliente).
 * @param string     $tabla      Tabla afectada, por ejemplo 'cita_medica'.
 * @param int        $idRegistro Clave primaria del registro afectado.
 * @param string     $accion     Apertura | Creación | Modificación | Cierre.
 * @param array|null $anterior   Estado previo (null al crear).
 * @param array|null $nuevo      Estado nuevo (null si no aplica).
 */
function auditar(
    PDO $conexion,
    int $idUsuario,
    string $tabla,
    int $idRegistro,
    string $accion,
    ?array $anterior = null,
    ?array $nuevo = null
): void {
    if (!in_array($accion, ACCIONES_AUDITORIA, true)) {
        throw new InvalidArgumentException('Acción de auditoría no válida.');
    }

    $aJson = static fn(?array $estado): ?string => $estado === null
        ? null
        : json_encode(ocultarSensibles($estado), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);

    // Solo REMOTE_ADDR: las cabeceras tipo X-Forwarded-For las puede falsificar el cliente.
    $ip = substr((string)($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);

    $consulta = $conexion->prepare(
        'INSERT INTO auditoria_clinica
            (id_usuario, tabla_afectada, id_registro_afectado, accion,
             estado_anterior, estado_nuevo, direccion_ip)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $consulta->execute([
        $idUsuario,
        $tabla,
        $idRegistro,
        $accion,
        $aJson($anterior),
        $aJson($nuevo),
        $ip === '' ? null : $ip,
    ]);
}