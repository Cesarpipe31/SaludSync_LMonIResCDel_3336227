<?php
// config/pacientes.php
// Reglas y consultas compartidas por los controladores de controls/pacientes/ (M3).
// Los pacientes pertenecen a UNA institución: la institución sale siempre de la sesión, nunca del navegador.

require_once __DIR__ . '/sesion.php';
require_once __DIR__ . '/validacion.php';
require_once __DIR__ . '/auditoria.php';
require_once __DIR__ . '/transaccion.php';

// Quién puede ver y quién puede modificar pacientes (decisión D-9: listas fijas por rol).
// El SuperAdmin no ve datos de pacientes: administra la plataforma, no las historias de las instituciones.
const ROLES_LEE_PACIENTES    = [ROL_ADMIN_IPS, ROL_MEDICO, ROL_RECEPCION];
const ROLES_ESCRIBE_PACIENTES = [ROL_ADMIN_IPS, ROL_RECEPCION];

const TIPOS_DOCUMENTO_PACIENTE = ['CC', 'TI', 'RC', 'CE', 'Pasaporte', 'PEP', 'PPT']; // ENUM de paciente.tipo_documento
const SEXOS_PACIENTE           = ['Masculino', 'Femenino'];                           // ENUM de paciente.sexo_biologico
const ESTADOS_PACIENTE         = ['Activo', 'Inactivo'];                              // ENUM de paciente.estado
const TAM_PAGINA_PACIENTES     = 6;   // el directorio muestra 6 filas por página
const TAM_PAGINA_HISTORIAL     = 10;  // citas y atenciones del expediente se cargan de 10 en 10

/** Exige sesión y un rol de la lista; devuelve al actor. Un Admin IPS, Médico o Recepción siempre tiene institución. */
function actorDePacientes(array $rolesPermitidos, string $mensajeSinPermiso = 'No tiene permisos para realizar esta operación.'): array
{
    $actor = requerirSesion();
    if (!in_array($actor['id_rol'], $rolesPermitidos, true) || $actor['id_institucion'] === null) {
        responderError($mensajeSinPermiso, 403);
    }
    return $actor;
}

function nombreInstitucion(PDO $conexion, int $idInstitucion): string
{
    $consulta = $conexion->prepare('SELECT razon_social FROM institucion WHERE id_institucion = ?');
    $consulta->execute([$idInstitucion]);
    return (string)$consulta->fetchColumn();
}

/** Años cumplidos a una fecha. */
function edadEn(string $fechaNacimiento, DateTimeImmutable $hoy): int
{
    return (int)(new DateTimeImmutable($fechaNacimiento))->diff($hoy)->y;
}

/** Valida los datos del formulario de paciente (RF-PAC-01 y RF-PAC-02). Devuelve solo los campos que se guardan. */
function validarPaciente(array $e): array
{
    $hoy = new DateTimeImmutable('today');
    $nacimiento = fechaObligatoria($e, 'fecha_nacimiento', 'Fecha de nacimiento');
    if ($nacimiento < '1900-01-01' || $nacimiento > $hoy->format('Y-m-d')) {
        throw new ErrorValidacion('La fecha de nacimiento no puede ser anterior a 1900 ni futura.');
    }

    $correo = limpiarTexto($e['correo'] ?? '');
    if ($correo !== '') {
        $correo = correoObligatorio($e, 'correo');
    }

    $d = [
        'tipo_documento'   => enumObligatorio($e, 'tipo_documento', 'Tipo de documento', TIPOS_DOCUMENTO_PACIENTE),
        'numero_documento' => documentoObligatorio($e, 'numero_documento'),
        'nombres'          => textoObligatorio($e, 'nombres', 'Nombres', 1, 60),
        'apellidos'        => textoObligatorio($e, 'apellidos', 'Apellidos', 1, 60),
        'fecha_nacimiento' => $nacimiento,
        'sexo_biologico'   => enumObligatorio($e, 'sexo', 'Sexo biológico', SEXOS_PACIENTE),
        'eps'              => textoOpcional($e, 'eps', 'EPS', 60),
        'telefono'         => telefono($e, 'telefono', 'Teléfono', true),
        'correo_electronico' => $correo === '' ? null : $correo,
        'direccion_residencial' => textoOpcional($e, 'direccion', 'Dirección', 150),
        'contacto_emergencia_nombre'     => textoOpcional($e, 'ce_nombre', 'Nombre del contacto de emergencia', 100),
        'contacto_emergencia_parentesco' => textoOpcional($e, 'ce_parentesco', 'Parentesco', 40),
        'contacto_emergencia_telefono'   => telefono($e, 'ce_telefono', 'Teléfono del contacto de emergencia', false),
        'estado'           => enumObligatorio($e, 'estado', 'Estado', ESTADOS_PACIENTE),
    ];

    // RF-PAC-02: de un menor de edad hay que registrar quién responde por él.
    if (edadEn($nacimiento, $hoy) < 18
        && ($d['contacto_emergencia_nombre'] === null || $d['contacto_emergencia_parentesco'] === null || $d['contacto_emergencia_telefono'] === null)) {
        throw new ErrorValidacion('Para un menor de edad el contacto de emergencia (nombre, parentesco y teléfono) es obligatorio.');
    }
    return $d;
}

/** Fila de paciente -> formato que consume pacientes.js. */
function formatoPaciente(array $f): array
{
    return [
        'id' => (int)$f['id_paciente'], 'tipo' => $f['tipo_documento'], 'doc' => $f['numero_documento'],
        'nombres' => $f['nombres'], 'apellidos' => $f['apellidos'], 'nac' => $f['fecha_nacimiento'],
        'sexo' => $f['sexo_biologico'], 'tel' => $f['telefono'], 'correo' => $f['correo_electronico'] ?? '',
        'dir' => $f['direccion_residencial'] ?? '', 'ce_nombre' => $f['contacto_emergencia_nombre'] ?? '',
        'ce_parentesco' => $f['contacto_emergencia_parentesco'] ?? '', 'ce_tel' => $f['contacto_emergencia_telefono'] ?? '',
        'eps' => $f['eps'] ?? '', 'estado' => $f['estado'], 'registro' => substr($f['fecha_registro'], 0, 10),
    ];
}

/** Un paciente por id y por institución (otra institución = "no existe"). */
function pacienteDeInstitucion(PDO $conexion, int $idPaciente, int $idInstitucion, bool $bloquear = false): ?array
{
    $consulta = $conexion->prepare('SELECT * FROM paciente WHERE id_paciente = ? AND id_institucion = ?' . ($bloquear ? ' FOR UPDATE' : ''));
    $consulta->execute([$idPaciente, $idInstitucion]);
    return $consulta->fetch() ?: null;
}

/** Escapa % _ y \ para usar un texto del usuario dentro de un LIKE. */
function escaparLike(string $texto): string
{
    return addcslashes($texto, '%_\\');
}

/**
 * Límite de pacientes del plan vigente de la institución (la suscripción de fecha de inicio más reciente).
 * Devuelve null si la institución no tiene suscripción (entonces no se aplica límite).
 */
function limitePacientesDelPlan(PDO $conexion, int $idInstitucion): ?int
{
    $consulta = $conexion->prepare(
        'SELECT p.limite_pacientes FROM suscripcion s INNER JOIN plan_comercial p ON p.id_plan = s.id_plan
          WHERE s.id_institucion = ? ORDER BY s.fecha_inicio DESC, s.id_suscripcion DESC LIMIT 1'
    );
    $consulta->execute([$idInstitucion]);
    $limite = $consulta->fetchColumn();
    return $limite === false ? null : (int)$limite;
}

/**
 * Verifica que se pueda tener un paciente Activo más según el plan (RF-PLA-02: límites del plan).
 * Bloquea la fila de la institución para que dos altas simultáneas no superen el límite.
 * Debe llamarse dentro de una transacción.
 */
function exigirCupoDePacientes(PDO $conexion, int $idInstitucion): void
{
    $conexion->prepare('SELECT id_institucion FROM institucion WHERE id_institucion = ? FOR UPDATE')->execute([$idInstitucion]);
    $limite = limitePacientesDelPlan($conexion, $idInstitucion);
    if ($limite === null) {
        return;
    }
    $activos = $conexion->prepare("SELECT COUNT(*) FROM paciente WHERE id_institucion = ? AND estado = 'Activo'");
    $activos->execute([$idInstitucion]);
    if ((int)$activos->fetchColumn() >= $limite) {
        revertir($conexion, "La institución alcanzó el límite de {$limite} pacientes activos de su plan.", 409, ['campo' => 'limite']);
    }
}