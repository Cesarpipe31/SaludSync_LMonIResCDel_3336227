<?php
// controls/seguridad/matriz_roles.php
// Matriz de permisos por rol y módulo (RF-SEG-02). Atiende la vista matriz_roles.html. Rol: SuperAdmin.
// La matriz es global (aplica a todas las instituciones), por eso solo el SuperAdmin la modifica.
// Respuesta: JSON uniforme { ok, mensaje, datos }.
//
//   GET  ?accion=cargar                              -> { matriz, conteos }
//   POST { accion: 'guardar', matriz: { "1": { "MOD-01": "Lectura/Escritura", ... }, ... } }   (75 celdas: 5 roles x 15 módulos)
// Los POST exigen el token CSRF (cabecera X-CSRF-Token).
//
// Nota: la matriz se guarda y se audita; los controladores todavía comprueban el rol con listas fijas (decisión D-9).

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/usuarios.php';

function cargarMatriz(PDO $conexion): never
{
    $conteos = [];
    foreach ($conexion->query('SELECT id_rol, COUNT(*) AS total FROM usuario GROUP BY id_rol') as $fila) {
        $conteos[(int)$fila['id_rol']] = (int)$fila['total'];
    }
    responderExito('Matriz de permisos.', ['matriz' => leerMatrizRoles($conexion), 'conteos' => $conteos]);
}

/** La matriz enviada debe traer los 5 roles con panel y los 15 módulos, con niveles del ENUM. */
function validarMatriz(mixed $recibida): array
{
    if (!is_array($recibida)) {
        throw new ErrorValidacion('La matriz no tiene un formato válido.');
    }
    $matriz = [];
    foreach (ROLES_CON_PANEL_USUARIO as $rol) {
        $fila = $recibida[(string)$rol] ?? null;
        if (!is_array($fila)) {
            throw new ErrorValidacion('La matriz está incompleta.');
        }
        for ($n = 1; $n <= 15; $n++) {
            $codigo = sprintf('MOD-%02d', $n);
            $nivel  = $fila[$codigo] ?? null;
            if (!is_string($nivel) || !in_array($nivel, NIVELES_ACCESO, true)) {
                throw new ErrorValidacion('La matriz contiene un nivel de acceso no válido.');
            }
            $matriz[$rol][$codigo] = $nivel;
        }
    }
    return $matriz;
}

function guardarMatriz(PDO $conexion, array $actor, array $entrada): never
{
    $nueva = validarMatriz($entrada['matriz'] ?? null);

    $conexion->beginTransaction();
    try {
        $conexion->query('SELECT id_rol FROM rol_permiso WHERE id_rol BETWEEN 1 AND 5 FOR UPDATE')->fetchAll(); // bloquea mientras se compara
        $actual = leerMatrizRoles($conexion);

        $guardar = $conexion->prepare(
            'INSERT INTO rol_permiso (id_rol, id_permiso, nivel_acceso) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE nivel_acceso = VALUES(nivel_acceso)'
        );
        $rolesCambiados = 0;
        foreach (ROLES_CON_PANEL_USUARIO as $rol) {
            $antes = $despues = [];
            foreach ($nueva[$rol] as $codigo => $nivel) {
                if ($actual[$rol][$codigo] !== $nivel) {
                    $antes[$codigo]   = $actual[$rol][$codigo];
                    $despues[$codigo] = $nivel;
                    $guardar->execute([$rol, (int)substr($codigo, 4), $nivel]);
                }
            }
            if ($despues) { // una fila de auditoría por rol modificado (la tabla rol_permiso tiene llave compuesta: se usa el id del rol)
                auditar($conexion, $actor['id_usuario'], 'rol_permiso', $rol, 'Modificación', $antes, $despues);
                $rolesCambiados++;
            }
        }
        $conexion->commit();
    } catch (Throwable $t) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        throw $t;
    }
    responderExito($rolesCambiados ? 'Matriz de permisos guardada correctamente.' : 'No había cambios que guardar.', ['roles_modificados' => $rolesCambiados]);
}

/* ---------------- Punto de entrada ---------------- */

exigirMetodo('GET', 'POST');
$actor = requerirRol([ROL_SUPERADMIN]);

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (($_GET['accion'] ?? '') !== 'cargar') {
            responderError('Acción no válida.', 400);
        }
        cargarMatriz($conexion);
    }

    exigirCsrf();
    $entrada = leerEntradaJson();
    match ($entrada['accion'] ?? '') {
        'guardar' => guardarMatriz($conexion, $actor, $entrada),
        default   => responderError('Acción no válida.', 400),
    };
} catch (ErrorValidacion $e) {
    responderError($e->getMessage(), 400);
} catch (Throwable $e) {
    responderErrorInterno('matriz_roles.php', $e);
}