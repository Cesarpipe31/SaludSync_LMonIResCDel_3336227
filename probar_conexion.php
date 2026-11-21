<?php
// probar_conexion.php
// Va en la raíz del proyecto, junto a index.html.
// Prueba temporal: se elimina antes de entregar el proyecto.

require_once __DIR__ . '/config/database.php'; // si la conexión falla, database.php responde y termina aquí

header('Content-Type: text/plain; charset=utf-8');

try {
    $nombreBd = $conexion->query('SELECT DATABASE()')->fetchColumn();

    // Se cuentan tablas y vistas por separado, usando el catálogo del propio servidor.
    $conteo = $conexion->query(
        "SELECT
             SUM(TABLE_TYPE = 'BASE TABLE') AS tablas,
             SUM(TABLE_TYPE = 'VIEW')       AS vistas
           FROM information_schema.TABLES
          WHERE TABLE_SCHEMA = DATABASE()"
    )->fetch();

    echo "Conexión exitosa a la base de datos: {$nombreBd}\n";
    echo "Tablas: {$conteo['tablas']} (esperadas: 38)\n";
    echo "Vistas: {$conteo['vistas']} (esperadas: 1)\n";
} catch (PDOException $e) {
    error_log('probar_conexion: ' . $e->getMessage());
    http_response_code(500);
    echo 'La conexión se abrió, pero la verificación del esquema falló.';
}
