<!-- Los {{ROOT}} los reemplaza main.js según la profundidad de la página -->
<div class="ss-topbar d-none d-md-block">
  <div class="container d-flex justify-content-between">
    <span>📞 +57 607 000 0000 &nbsp;·&nbsp; ✉️ soporte@saludsync.co</span>
    <span>SaludSync S.A.S. · NIT 900.000.000-0</span>
  </div>
</div>

<nav class="navbar navbar-expand-lg ss-navbar sticky-top">
  <div class="container">
    <a class="navbar-brand d-flex align-items-center gap-2" href="{{ROOT}}index.html">
      <img src="{{ROOT}}assets/images/logo.png" alt="Logo de SaludSync" class="ss-logo"
           onerror="this.style.display='none';this.nextElementSibling.style.display='inline-flex'">
      <span class="ss-logo-fallback" style="display:none">➕</span>
      <span class="d-flex flex-column lh-1">
        <span class="ss-brand">SaludSync</span>
        <small class="ss-tagline">Gestión integral en salud</small>
      </span>
    </a>

    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menuPrincipal"
            aria-controls="menuPrincipal" aria-expanded="false" aria-label="Abrir menú">
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" id="menuPrincipal">
      <ul class="navbar-nav mx-lg-auto mb-2 mb-lg-0">
        <li class="nav-item"><a class="nav-link" data-nav="inicio" href="{{ROOT}}index.html" title="Página principal">🏠 Inicio</a></li>

        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false" title="Plataforma SaaS">🏥 Plataforma</a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" data-nav="instituciones" href="{{ROOT}}views/plataforma/instituciones.html">Instituciones</a></li>
            <li><a class="dropdown-item" data-nav="registro_institucion" href="{{ROOT}}views/plataforma/registro_institucion.html">Registro de institución</a></li>
            <li><a class="dropdown-item" data-nav="planes_suscripciones" href="{{ROOT}}views/plataforma/planes_suscripciones.html">Planes y suscripciones</a></li>
          </ul>
        </li>

        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false" title="Seguridad y control de acceso">🔐 Seguridad</a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" data-nav="directorio_usuarios" href="{{ROOT}}views/seguridad/directorio_usuarios.html">👥 Directorio de usuarios</a></li>
            <li><a class="dropdown-item" data-nav="registro_usuario" href="{{ROOT}}views/seguridad/registro_usuario.html">➕ Nuevo usuario</a></li>
            <li><a class="dropdown-item" data-nav="matriz_roles" href="{{ROOT}}views/seguridad/matriz_roles.html">🛡️ Matriz de roles</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" data-nav="recuperar_contrasena" href="{{ROOT}}views/seguridad/recuperar_contrasena.html">🔑 Recuperar contraseña</a></li>
          </ul>
        </li>

        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false" title="Gestión de pacientes">🩺 Pacientes</a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" data-nav="directorio_pacientes" href="{{ROOT}}views/pacientes/directorio_pacientes.html">📋 Directorio de pacientes</a></li>
            <li><a class="dropdown-item" data-nav="registro_paciente" href="{{ROOT}}views/pacientes/registro_paciente.html">➕ Nuevo paciente</a></li>
          </ul>
        </li>

        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false" title="Profesionales de la salud">👨‍⚕️ Profesionales</a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" data-nav="directorio_profesionales" href="{{ROOT}}views/profesionales/directorio_profesionales.html">📋 Directorio de profesionales</a></li>
            <li><a class="dropdown-item" data-nav="registro_profesional" href="{{ROOT}}views/profesionales/registro_profesional.html">➕ Nuevo profesional</a></li>
            <li><a class="dropdown-item" data-nav="especialidades_medicas" href="{{ROOT}}views/profesionales/especialidades_medicas.html">🧬 Especialidades médicas</a></li>
          </ul>
        </li>

        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false" title="Consultorios y sedes">🚪 Consultorios</a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" data-nav="directorio_consultorios" href="{{ROOT}}views/consultorios/directorio_consultorios.html">📋 Directorio de consultorios</a></li>
            <li><a class="dropdown-item" data-nav="matriz_ocupacion" href="{{ROOT}}views/consultorios/matriz_ocupacion.html">🗓️ Matriz de ocupación</a></li>
          </ul>
        </li>

        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false" title="Agenda médica y horarios">📅 Agenda</a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" data-nav="calendario_agenda" href="{{ROOT}}views/agenda/calendario_agenda.html">📆 Calendario maestro</a></li>
            <li><a class="dropdown-item" data-nav="configurar_horario" href="{{ROOT}}views/agenda/configurar_horario.html">⏰ Configurar horarios</a></li>
            <li><a class="dropdown-item" data-nav="bloqueo_agenda" href="{{ROOT}}views/agenda/bloqueo_agenda.html">⛔ Novedades y bloqueos</a></li>
          </ul>
        </li>

        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false" title="Citas médicas y recepción">🗓️ Citas</a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" data-nav="mesa_recepcion" href="{{ROOT}}views/citas/mesa_recepcion.html">🛎️ Mesa de recepción</a></li>
            <li><a class="dropdown-item" data-nav="agendamiento_cita" href="{{ROOT}}views/citas/agendamiento_cita.html">➕ Agendar cita</a></li>
            <li><a class="dropdown-item" data-nav="historial_reprogramacion" href="{{ROOT}}views/citas/historial_reprogramacion.html">🔄 Historial de reprogramación</a></li>
          </ul>
        </li>
      </ul>
      <div class="d-flex align-items-center gap-2">
        <span class="badge ss-role d-none d-xl-inline">SuperAdmin</span>
        <a href="{{ROOT}}views/seguridad/login.html" class="btn btn-outline-primary btn-sm" title="Ir al inicio de sesión">👤 Iniciar sesión</a>
      </div>
    </div>
  </div>
</nav>