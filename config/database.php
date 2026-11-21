<?php
// config/database.php
// Única conexión PDO del proyecto. Cada controlador la reutiliza con
// require_once y usa la variable $conexion.
// Este archivo no imprime nada cuando todo sale bien.

/**
 * Crea la conexión a MySQL/MariaDB.
 * Se hace dentro de una función para que usuario y contraseña no queden
 * como variables globales visibles desde los controladores.
 */
function crearConexion(): PDO
{
    $host   = 'localhost';
    $bd     = 'saludsync_empresarial';
    $user   = 'root';   // usuario por defecto de XAMPP
    $clave  = '';       // XAMPP no trae contraseña para root

    return new PDO(
        "mysql:host=$host;dbname=$bd;charset=utf8mb4",
        $user,
        $clave,
        [
            // Los errores de SQL se lanzan como excepciones y se capturan en cada controlador.
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            // Todas las filas llegan como arreglo asociativo.
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            // false = consultas preparadas reales en el servidor (anti inyección SQL).
            PDO::ATTR_EMULATE_PREPARES   => false,
            // Misma zona horaria que PHP (America/Bogota, UTC-5, sin horario de verano),
            // para que NOW() y las fechas generadas en PHP sean coherentes.
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET time_zone = '-05:00'",
        ]
    );
}

try {
    $conexion = crearConexion();
} catch (PDOException $e) {
    // El detalle técnico solo va al log del servidor; al usuario, un mensaje genérico.
    error_log('database.php: ' . $e->getMessage());
    http_response_code(500);

    // Si la petición vino de fetch (pide JSON), se responde con el JSON uniforme del proyecto.
    $esperaJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');
    if ($esperaJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(
            ['ok' => false, 'mensaje' => 'No fue posible conectar con la base de datos.', 'datos' => null],
            JSON_UNESCAPED_UNICODE
        );
    } else {
        header('Content-Type: text/plain; charset=utf-8');
        echo 'No fue posible conectar con la base de datos.';
    }
    exit;
}