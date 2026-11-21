<?php
// config/validacion.php
// Validación en servidor. La validación del navegador no cuenta (regla 5.2).
// Uso típico en un controlador:
//   try { $nombre = textoObligatorio($entrada, 'nombre', 'Nombre', 2, 60); }
//   catch (ErrorValidacion $e) { responderError($e->getMessage(), 400); }

/** Error de validación con un mensaje apto para mostrar al usuario. */
class ErrorValidacion extends InvalidArgumentException
{
}

/** Quita espacios en los extremos y caracteres de control. Solo acepta valores escalares. */
function limpiarTexto(mixed $valor): string
{
    if (!is_scalar($valor)) {
        return '';
    }
    $texto = trim((string)$valor);
    // Se conservan tabulación y saltos de línea (útiles en campos de texto largo).
    return preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $texto) ?? '';
}

/** Lista blanca: devuelve solo los campos permitidos y descarta cualquier otro que envíe el cliente. */
function soloCampos(array $entrada, array $permitidos): array
{
    return array_intersect_key($entrada, array_flip($permitidos));
}

/** Verifica longitud en caracteres (soporta tildes y ñ). */
function validarLongitud(string $valor, string $etiqueta, int $min, int $max): string
{
    $largo = mb_strlen($valor);
    if ($largo < $min || $largo > $max) {
        throw new ErrorValidacion("«{$etiqueta}» debe tener entre {$min} y {$max} caracteres.");
    }
    return $valor;
}

function textoObligatorio(array $entrada, string $campo, string $etiqueta, int $min, int $max): string
{
    $valor = limpiarTexto($entrada[$campo] ?? '');
    if ($valor === '') {
        throw new ErrorValidacion("«{$etiqueta}» es obligatorio.");
    }
    return validarLongitud($valor, $etiqueta, $min, $max);
}

/** Texto opcional: devuelve null si viene vacío (para columnas que admiten NULL). */
function textoOpcional(array $entrada, string $campo, string $etiqueta, int $max): ?string
{
    $valor = limpiarTexto($entrada[$campo] ?? '');
    return $valor === '' ? null : validarLongitud($valor, $etiqueta, 1, $max);
}

function correoObligatorio(array $entrada, string $campo, string $etiqueta = 'Correo electrónico', int $max = 100): string
{
    $valor = limpiarTexto($entrada[$campo] ?? '');
    if ($valor === '') {
        throw new ErrorValidacion("«{$etiqueta}» es obligatorio.");
    }
    if (mb_strlen($valor) > $max || !filter_var($valor, FILTER_VALIDATE_EMAIL)) {
        throw new ErrorValidacion("«{$etiqueta}» no tiene un formato válido.");
    }
    return $valor;
}

/** Valor que debe ser exactamente uno de los permitidos (por ejemplo, los ENUM del SQL). */
function enumObligatorio(array $entrada, string $campo, string $etiqueta, array $permitidos): string
{
    $valor = limpiarTexto($entrada[$campo] ?? '');
    if (!in_array($valor, $permitidos, true)) {
        throw new ErrorValidacion("«{$etiqueta}» tiene un valor no permitido.");
    }
    return $valor;
}

function enteroObligatorio(array $entrada, string $campo, string $etiqueta, int $min, int $max): int
{
    $valor = filter_var(
        limpiarTexto($entrada[$campo] ?? ''),
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => $min, 'max_range' => $max]]
    );
    if ($valor === false) {
        throw new ErrorValidacion("«{$etiqueta}» debe ser un número entero entre {$min} y {$max}.");
    }
    return $valor;
}

/** Decimal con punto (ej. 36.5). Rechaza coma, notación científica y texto. */
function decimalObligatorio(array $entrada, string $campo, string $etiqueta, float $min, float $max): float
{
    $texto = limpiarTexto($entrada[$campo] ?? '');
    if (!preg_match('/^-?\d+(\.\d+)?$/', $texto)) {
        throw new ErrorValidacion("«{$etiqueta}» debe ser un número (use punto decimal).");
    }
    $valor = (float)$texto;
    if ($valor < $min || $valor > $max) {
        throw new ErrorValidacion("«{$etiqueta}» debe estar entre {$min} y {$max}.");
    }
    return $valor;
}

/** Fecha en formato AAAA-MM-DD que exista en el calendario (rechaza 2026-02-30). */
function fechaObligatoria(array $entrada, string $campo, string $etiqueta): string
{
    $texto = limpiarTexto($entrada[$campo] ?? '');
    $fecha = DateTime::createFromFormat('!Y-m-d', $texto);
    $errores = DateTime::getLastErrors();
    if (!$fecha || ($errores && ($errores['warning_count'] > 0 || $errores['error_count'] > 0))
        || $fecha->format('Y-m-d') !== $texto) {
        throw new ErrorValidacion("«{$etiqueta}» no es una fecha válida (AAAA-MM-DD).");
    }
    return $texto;
}

/** Hora HH:MM o HH:MM:SS; se normaliza a HH:MM:SS (formato TIME de MySQL). */
function horaObligatoria(array $entrada, string $campo, string $etiqueta): string
{
    $texto = limpiarTexto($entrada[$campo] ?? '');
    if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/', $texto)) {
        throw new ErrorValidacion("«{$etiqueta}» no es una hora válida (HH:MM).");
    }
    return strlen($texto) === 5 ? $texto . ':00' : $texto;
}

/** Teléfono: 7 a 20 caracteres entre dígitos, +, espacios y guiones (mismo patrón que las vistas). */
function telefono(array $entrada, string $campo, string $etiqueta, bool $obligatorio): ?string
{
    $valor = limpiarTexto($entrada[$campo] ?? '');
    if ($valor === '') {
        if ($obligatorio) {
            throw new ErrorValidacion("«{$etiqueta}» es obligatorio.");
        }
        return null;
    }
    if (!preg_match('/^[0-9+\s\-]{7,20}$/', $valor)) {
        throw new ErrorValidacion("«{$etiqueta}» no tiene un formato válido.");
    }
    return $valor;
}

/** Número de documento: 5 a 20 caracteres alfanuméricos (mismo patrón que las vistas). */
function documentoObligatorio(array $entrada, string $campo, string $etiqueta = 'Número de documento'): string
{
    $valor = limpiarTexto($entrada[$campo] ?? '');
    if (!preg_match('/^[0-9A-Za-z]{5,20}$/', $valor)) {
        throw new ErrorValidacion("«{$etiqueta}» debe tener entre 5 y 20 letras o números.");
    }
    return $valor;
}

/**
 * Contraseña: mínimo 8 caracteres (RNF-SEG-01) y máximo 72 BYTES,
 * porque bcrypt ignora en silencio todo lo que pase de 72 bytes.
 * No se aplica trim(): los espacios forman parte de la clave.
 */
function claveObligatoria(array $entrada, string $campo, string $etiqueta = 'Contraseña'): string
{
    $valor = $entrada[$campo] ?? '';
    if (!is_string($valor) || $valor === '') {
        throw new ErrorValidacion("«{$etiqueta}» es obligatoria.");
    }
    if (mb_strlen($valor) < 8 || strlen($valor) > 72) {
        throw new ErrorValidacion("«{$etiqueta}» debe tener al menos 8 caracteres y no más de 72 bytes.");
    }
    return $valor;
}

/** Casilla de verificación → 1 o 0 (para columnas tinyint(1)). */
function casilla(array $entrada, string $campo): int
{
    $valor = $entrada[$campo] ?? 0;
    return in_array($valor, [1, '1', true, 'true', 'on'], true) ? 1 : 0;
}

/**
 * Paginación SQL (RNF-REN-02). Lee ?pagina=&limite= y devuelve valores enteros seguros.
 * En la consulta se usan con bindValue(..., PDO::PARAM_INT) en LIMIT y OFFSET.
 */
function paginacion(array $parametros, int $limitePorDefecto = 20, int $limiteMaximo = 100): array
{
    $pagina = filter_var($parametros['pagina'] ?? 1, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ?: 1;
    $limite = filter_var($parametros['limite'] ?? $limitePorDefecto, FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1, 'max_range' => $limiteMaximo]]) ?: $limitePorDefecto;
    return ['pagina' => $pagina, 'limite' => $limite, 'desplazamiento' => ($pagina - 1) * $limite];
}