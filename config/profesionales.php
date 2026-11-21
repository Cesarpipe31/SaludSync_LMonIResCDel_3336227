<?php
// config/profesionales.php
// Reglas y consultas compartidas por los controladores de controls/profesionales/ (M4).
// Un profesional de salud es un usuario con rol Médico (tabla usuario) más su ficha en profesional_salud.
// No tiene columna de estado propia: su estado es el de su cuenta (usuario.estado). La institución sale de la sesión.

require_once __DIR__ . '/usuarios.php';
require_once __DIR__ . '/transaccion.php';

// Quién ve y quién modifica. El SuperAdmin no gestiona el personal de las instituciones.
const ROLES_LEE_PROFESIONALES     = [ROL_ADMIN_IPS, ROL_MEDICO, ROL_RECEPCION];
const ROLES_ESCRIBE_PROFESIONALES = [ROL_ADMIN_IPS];

const TIPOS_DOCUMENTO_PROFESIONAL = ['CC', 'CE', 'Pasaporte', 'PEP', 'PPT']; // los que ofrece la vista
const TAM_PAGINA_PROFESIONALES    = 6;
const TOPE_VISTA_AGRUPADA         = 200; // la vista "por especialidad" trae todos los que coinciden, con este tope

/** Exige sesión y un rol de la lista; devuelve al actor. */
function actorDeProfesionales(array $rolesPermitidos, string $mensajeSinPermiso = 'No tiene permisos para realizar esta operación.'): array
{
    $actor = requerirSesion();
    if (!in_array($actor['id_rol'], $rolesPermitidos, true) || $actor['id_institucion'] === null) {
        responderError($mensajeSinPermiso, 403);
    }
    return $actor;
}

function elegirCaracterAleatorio(string $conjunto): string
{
    return $conjunto[random_int(0, strlen($conjunto) - 1)];
}

/** Clave temporal de 12 caracteres con mayúscula, minúscula, número y símbolo (se muestra una sola vez). */
function claveTemporalAleatoria(): string
{
    $mayus = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    $minus = 'abcdefghijkmnpqrstuvwxyz';
    $nums  = '23456789';
    $simb  = '!@#$%&*';
    $c = [elegirCaracterAleatorio($mayus), elegirCaracterAleatorio($minus), elegirCaracterAleatorio($nums), elegirCaracterAleatorio($simb)];
    while (count($c) < 12) {
        $c[] = elegirCaracterAleatorio($mayus . $minus . $nums . $simb);
    }
    for ($i = count($c) - 1; $i > 0; $i--) {
        $j = random_int(0, $i);
        [$c[$i], $c[$j]] = [$c[$j], $c[$i]];
    }
    return implode('', $c);
}

/** Valida los datos del formulario de profesional (RF-PRO-01 y RF-PRO-02). */
function validarProfesional(array $e, bool $esAlta): array
{
    $tarjeta = strtoupper(limpiarTexto($e['tarjeta'] ?? ''));
    if (!preg_match('/^[A-Z0-9\-]{5,30}$/', $tarjeta)) {
        throw new ErrorValidacion('La tarjeta profesional debe tener entre 5 y 30 caracteres (letras, números o guion).');
    }

    $recibidas = $e['especialidades'] ?? [];
    if (!is_array($recibidas) || count($recibidas) === 0) {
        throw new ErrorValidacion('Seleccione al menos una especialidad.');
    }
    $especialidades = [];
    foreach ($recibidas as $id) {
        $valor = filter_var($id, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($valor === false) {
            throw new ErrorValidacion('Una de las especialidades no es válida.');
        }
        $especialidades[$valor] = true;
    }

    $nombres   = textoObligatorio($e, 'nombres', 'Nombres', 1, 60);
    $apellidos = textoObligatorio($e, 'apellidos', 'Apellidos', 1, 60);
    if (mb_strlen($nombres . ' ' . $apellidos) > 120) {
        throw new ErrorValidacion('Nombres y apellidos superan los 120 caracteres.');
    }

    return [
        'nombre_completo'  => $nombres . ' ' . $apellidos,
        'tipo_documento'   => enumObligatorio($e, 'tipo_documento', 'Tipo de documento', TIPOS_DOCUMENTO_PROFESIONAL),
        'numero_documento' => documentoObligatorio($e, 'numero_documento'),
        'correo'           => correoObligatorio($e, 'correo'),
        'telefono'         => telefono($e, 'telefono', 'Teléfono', true),
        'tarjeta'          => $tarjeta,
        // Una cuenta nueva no nace bloqueada; al editar sí se conserva ese estado.
        'estado'           => enumObligatorio($e, 'estado', 'Estado', $esAlta ? ['Activo', 'Inactivo'] : ESTADOS_USUARIO),
        'especialidades'   => array_keys($especialidades),
    ];
}

/** Límite de médicos del plan vigente (suscripción de inicio más reciente). null = sin suscripción, sin límite. */
function limiteMedicosDelPlan(PDO $conexion, int $idInstitucion): ?int
{
    $consulta = $conexion->prepare(
        'SELECT p.limite_medicos FROM suscripcion s INNER JOIN plan_comercial p ON p.id_plan = s.id_plan
          WHERE s.id_institucion = ? ORDER BY s.fecha_inicio DESC, s.id_suscripcion DESC LIMIT 1'
    );
    $consulta->execute([$idInstitucion]);
    $limite = $consulta->fetchColumn();
    return $limite === false ? null : (int)$limite;
}

/**
 * Verifica que se pueda tener un médico Activo más según el plan (RF-PLA-02). Bloquea la fila de la
 * institución para que dos altas simultáneas no superen el límite. Debe llamarse dentro de una transacción.
 */
function exigirCupoDeMedicos(PDO $conexion, int $idInstitucion): void
{
    $conexion->prepare('SELECT id_institucion FROM institucion WHERE id_institucion = ? FOR UPDATE')->execute([$idInstitucion]);
    $limite = limiteMedicosDelPlan($conexion, $idInstitucion);
    if ($limite === null) {
        return;
    }
    $activos = $conexion->prepare(
        "SELECT COUNT(*) FROM profesional_salud ps INNER JOIN usuario u ON u.id_usuario = ps.id_usuario
          WHERE u.id_institucion = ? AND u.estado = 'Activo'"
    );
    $activos->execute([$idInstitucion]);
    if ((int)$activos->fetchColumn() >= $limite) {
        revertir($conexion, "La institución alcanzó el límite de {$limite} médicos activos de su plan.", 409, ['campo' => 'limite']);
    }
}

/** Un profesional de la institución (con los datos de su cuenta), o null si no existe o es de otra institución. */
function profesionalDeInstitucion(PDO $conexion, int $idProfesional, int $idInstitucion, bool $bloquear = false): ?array
{
    $consulta = $conexion->prepare(
        'SELECT ps.id_profesional, ps.tarjeta_profesional, u.*
           FROM profesional_salud ps INNER JOIN usuario u ON u.id_usuario = ps.id_usuario
          WHERE ps.id_profesional = ? AND u.id_institucion = ?' . ($bloquear ? ' FOR UPDATE' : '')
    );
    $consulta->execute([$idProfesional, $idInstitucion]);
    return $consulta->fetch() ?: null;
}

/**
 * Especialidades de varios profesionales: [id_profesional => [id_especialidad, ...]].
 * Solo cuentan las de la propia institución (la semilla trae un vínculo cruzado entre instituciones que no debe mostrarse).
 */
function especialidadesDeProfesionales(PDO $conexion, array $idsProfesionales, int $idInstitucion): array
{
    if (!$idsProfesionales) {
        return [];
    }
    $marcas   = implode(', ', array_fill(0, count($idsProfesionales), '?'));
    $consulta = $conexion->prepare(
        "SELECT pe.id_profesional, pe.id_especialidad FROM profesional_especialidad pe
          INNER JOIN especialidad e ON e.id_especialidad = pe.id_especialidad
          WHERE pe.id_profesional IN ({$marcas}) AND e.id_institucion = ? ORDER BY pe.id_especialidad"
    );
    $consulta->execute([...$idsProfesionales, $idInstitucion]);
    $resultado = [];
    foreach ($consulta as $fila) {
        $resultado[(int)$fila['id_profesional']][] = (int)$fila['id_especialidad'];
    }
    return $resultado;
}

/** Sedes donde cada profesional tiene agenda: [id_profesional => "Sede A, Sede B"]. Vacío hasta que se configure la agenda (M6). */
function sedesDeProfesionales(PDO $conexion, array $idsProfesionales, int $idInstitucion): array
{
    if (!$idsProfesionales) {
        return [];
    }
    $marcas   = implode(', ', array_fill(0, count($idsProfesionales), '?'));
    $consulta = $conexion->prepare(
        "SELECT DISTINCT a.id_profesional, s.nombre_sede FROM agenda_medica a
          INNER JOIN consultorio c ON c.id_consultorio = a.id_consultorio
          INNER JOIN sede s ON s.id_sede = c.id_sede
          WHERE a.id_profesional IN ({$marcas}) AND s.id_institucion = ? ORDER BY s.nombre_sede"
    );
    $consulta->execute([...$idsProfesionales, $idInstitucion]);
    $resultado = [];
    foreach ($consulta as $fila) {
        $resultado[(int)$fila['id_profesional']][] = $fila['nombre_sede'];
    }
    return array_map(static fn(array $n): string => implode(', ', $n), $resultado);
}

/** Fila de profesional -> formato que consume profesionales.js. */
function formatoProfesional(array $f, array $especialidades, string $sede): array
{
    [$nombres, $apellidos] = dividirNombre($f['nombre_completo']);
    return [
        'id' => (int)$f['id_profesional'], 'uid' => (int)$f['id_usuario'], 'nombres' => $nombres, 'apellidos' => $apellidos,
        'tipo' => $f['tipo_documento'], 'doc' => $f['numero_documento'], 'correo' => $f['correo_electronico'],
        'tel' => $f['telefono'] ?? '', 'tarjeta' => $f['tarjeta_profesional'], 'sede' => $sede,
        'esp' => $especialidades, 'estado' => $f['estado'], 'registro' => substr($f['fecha_creacion'], 0, 10),
    ];
}

function nombreInstitucionProfesional(PDO $conexion, int $idInstitucion): string
{
    $consulta = $conexion->prepare('SELECT razon_social FROM institucion WHERE id_institucion = ?');
    $consulta->execute([$idInstitucion]);
    return (string)$consulta->fetchColumn();
}

/** Especialidades de la institución (todas, o solo las activas) en el formato de la vista. */
function leerEspecialidades(PDO $conexion, int $idInstitucion, bool $soloActivas = false): array
{
    $consulta = $conexion->prepare(
        'SELECT id_especialidad, codigo_especialidad, nombre_especialidad, descripcion_servicio, estado FROM especialidad
          WHERE id_institucion = ?' . ($soloActivas ? " AND estado = 'Activo'" : '') . ' ORDER BY codigo_especialidad'
    );
    $consulta->execute([$idInstitucion]);
    return array_map(static fn(array $e): array => [
        'id' => (int)$e['id_especialidad'], 'codigo' => $e['codigo_especialidad'], 'nombre' => $e['nombre_especialidad'],
        'desc' => $e['descripcion_servicio'] ?? '', 'estado' => $e['estado'],
    ], $consulta->fetchAll());
}