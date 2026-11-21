# SaludSync — Plataforma Clínica SaaS Multi-Institución

Sistema de información web clínico-administrativo desarrollado en **PHP 8 nativo (PDO)**, **MySQL/MariaDB**, **JavaScript ES6+ (`fetch`)**, **HTML5**, **CSS3** y **Bootstrap 5**.

## Despliegue Local en XAMPP
1. Clonar o descargar este repositorio en `C:\xampp\htdocs\SaludSync`.
2. Iniciar los servicios **Apache** y **MySQL** en el Panel de Control de XAMPP.
3. Abrir `http://localhost/phpmyadmin/`, crear/importar el script ubicado en `database/00_saludsync_empresarial_11202026.sql`.
4. Verificar la conexión a base de datos en `http://localhost/SaludSync/probar_conexion.php`.
5. Acceder al sistema en `http://localhost/SaludSync/index.html`.

## Credenciales de Prueba (Clave general: `Demo2026*`)
- **SuperAdmin:** `superadmin@saludsync.co`
- **Admin IPS (`Clinica_1`):** `admin@santalucia.co`
- **Médico (`Clinica_1`):** `u1@mail.com`
- **Recepción (`Clinica_1`):** `recepcion@santalucia.co`
