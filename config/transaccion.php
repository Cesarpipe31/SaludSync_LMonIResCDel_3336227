<?php
// config/transaccion.php
// Utilidad común para los controladores que escriben dentro de una transacción.

require_once __DIR__ . '/respuesta.php';

/** Revierte la transacción abierta (si la hay) y responde con el error indicado. */
function revertir(PDO $conexion, string $mensaje, int $codigo, ?array $datos = null): never
{
    if ($conexion->inTransaction()) {
        $conexion->rollBack();
    }
    responderError($mensaje, $codigo, $datos);
}