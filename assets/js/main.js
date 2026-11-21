/* ===== SaludSync · JS global: carga de componentes y utilidades compartidas ===== */
(function () {
  'use strict';

  // Raíz del proyecto calculada desde la ubicación de este script (assets/js/main.js)
  const ROOT = new URL('../../', document.currentScript.src).href;

    /* ---- Sesión: el servidor (PHP) es la fuente de verdad; sessionStorage es solo una caché visual ---- */
  const SESION_KEY = 'saludsync_sesion';
  // Páginas que se pueden abrir sin sesión (nombre de archivo sin .html)
  const PAGINAS_PUBLICAS = ['index', 'login', 'recuperar_contrasena', 'registro_usuario'];
  let tokenCsrf = '';

  function esPaginaPublica() {
    const archivo = (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';
    return PAGINAS_PUBLICAS.includes(archivo);
  }

  // Consulta controls/seguridad/sesion.php y alinea la caché del navegador con la sesión real del servidor
  async function sincronizarSesion() {
    let datos;
    try {
      const resp = await fetch(ROOT + 'controls/seguridad/sesion.php', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
      if (!resp.ok) return;                         // servidor con problemas: se conserva la caché tal cual
      const json = await resp.json();
      datos = json && json.ok ? json.datos : null;
    } catch (e) { return; }                         // sin conexión: se conserva la caché tal cual

    const anterior = sessionStorage.getItem(SESION_KEY);
    if (datos && datos.autenticado) {
      const nueva = JSON.stringify({ id: datos.id, nombre: datos.nombre, rol: datos.rol, rolId: datos.rolId, instId: datos.instId });
      tokenCsrf = datos.csrf || '';
      SS.sesion = datos;
      sessionStorage.setItem(SESION_KEY, nueva);
      // Los scripts de cada módulo ya leyeron la caché anterior: si cambió, se recarga una sola vez
      if (anterior !== nueva && !esPaginaPublica()) location.reload();
      return;
    }
    SS.sesion = null; tokenCsrf = '';
    sessionStorage.removeItem(SESION_KEY);
    if (!esPaginaPublica()) {
      location.replace(ROOT + 'views/seguridad/login.html?sesion=' + (anterior ? 'expirada' : 'requerida'));
    }
  }

  // Cliente único para los controladores PHP. Devuelve siempre { ok, mensaje, datos, estado }.
  // Ejemplo: const r = await SS.api('controls/seguridad/sesion.php');
  async function api(ruta, opciones = {}) {
    const metodo = (opciones.method || 'GET').toUpperCase();
    const cabeceras = { Accept: 'application/json' };
    let cuerpo = opciones.body;
    if (metodo !== 'GET' && metodo !== 'HEAD') {
      await SS.sesionLista;                         // garantiza que ya se conoce el token CSRF
      cabeceras['X-CSRF-Token'] = tokenCsrf;
      if (cuerpo !== undefined && typeof cuerpo === 'object' && !(cuerpo instanceof FormData) && !(cuerpo instanceof URLSearchParams)) {
        cabeceras['Content-Type'] = 'application/json';
        cuerpo = JSON.stringify(cuerpo);
      }
    }
    let resp;
    try {
      resp = await fetch(ROOT + ruta, { method: metodo, headers: cabeceras, body: cuerpo, credentials: 'same-origin' });
    } catch (e) {
      return { ok: false, mensaje: 'No hay conexión con el servidor.', datos: null, estado: 0 };
    }
    let json;
    try { json = await resp.json(); }
    catch (e) { json = { ok: false, mensaje: 'Respuesta no válida del servidor.', datos: null }; }
    json.estado = resp.status;
    if (resp.status === 401 && !esPaginaPublica()) {
      sessionStorage.removeItem(SESION_KEY);
      location.replace(ROOT + 'views/seguridad/login.html?sesion=expirada');
    }
    return json;
  }

  async function cargarComponente(selector, archivo) {
    const host = document.querySelector(selector);
    if (!host) return;
    try {
      const resp = await fetch(ROOT + 'components/' + archivo);
      if (!resp.ok) throw new Error(resp.status);
      const html = await resp.text();
      host.innerHTML = html.replaceAll('{{ROOT}}', ROOT);
    } catch (err) {
      host.innerHTML = '<div class="alert alert-warning rounded-0 mb-0">No se pudo cargar ' + archivo +
        '. Abra el proyecto desde http://localhost/ (Apache de XAMPP), no con Live Server.</div>';
    }
  }

    // Campana de notificaciones: cuenta las "No Leída" del usuario activo (datos del Módulo 13)
  function actualizarCampana() {
    const b = document.getElementById('campanaBadge'); if (!b) return;
    try {
      const d = JSON.parse(sessionStorage.getItem('saludsync_modulo13_v1')); if (!d || !d.notificaciones) return;
      const s = JSON.parse(sessionStorage.getItem('saludsync_sesion')), uid = (s && s.id) || d.usuarioVista || 2;
      const n = d.notificaciones.filter(x => x.usuario === uid && x.estado === 'No Leída').length;
      b.textContent = n > 99 ? '99+' : n; b.classList.toggle('d-none', n === 0);
    } catch (e) { }
  }

  function marcarMenuActivo() {
    const archivo = (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';
    const clave = (archivo === 'index') ? 'inicio' : archivo;
    document.querySelectorAll('[data-nav]').forEach(a => {
      if (a.dataset.nav === clave) { a.classList.add('active'); a.setAttribute('aria-current', 'page'); }
    });
  }

  /* ---- Generación de menú dinámico según rol ---- */
  const ITEMS_MENU = {
    // SuperAdmin - Módulos 1, 2, 13, 14, 15, 16 (historial todas las transacciones)
    1: [
      { icon: '📊', label: 'Dashboard', items: [
        { nav: 'dashboard_superadmin', label: '🌐 SuperAdmin (plataforma)', href: 'views/dashboard/dashboard_superadmin.html' }
      ]},
      { icon: '🏥', label: 'Plataforma', items: [
        { nav: 'instituciones', label: 'Instituciones', href: 'views/plataforma/instituciones.html' },
        { nav: 'registro_institucion', label: 'Registro de institución', href: 'views/plataforma/registro_institucion.html' },
        { nav: 'planes_suscripciones', label: 'Planes y suscripciones', href: 'views/plataforma/planes_suscripciones.html' }
      ]},
      { icon: '🔐', label: 'Seguridad', items: [
        { nav: 'directorio_usuarios', label: '👥 Directorio de usuarios', href: 'views/seguridad/directorio_usuarios.html' },
        { nav: 'registro_usuario', label: '➕ Nuevo usuario', href: 'views/seguridad/registro_usuario.html' },
        { nav: 'matriz_roles', label: '🛡️ Matriz de roles', href: 'views/seguridad/matriz_roles.html' }
      ]},
      { icon: '🔔', label: 'Notificaciones', items: [
        { nav: 'centro_notificaciones', label: '📥 Centro de notificaciones', href: 'views/notificaciones/centro_notificaciones.html' },
        { nav: 'configuracion_alertas', label: '⚙️ Configuración de alertas', href: 'views/notificaciones/configuracion_alertas.html' }
      ]},
      { icon: '📑', label: 'Reportes', items: [
        { nav: 'reportes_administrativos', label: '🏢 Reportes administrativos', href: 'views/reportes/reportes_administrativos.html' }
      ]},
      { icon: '💳', label: 'Pagos', items: [
        { nav: 'historial_transacciones', label: '📋 Historial de transacciones (plataforma)', href: 'views/pagos/historial_transacciones.html' }
      ]}
    ],
    // Admin IPS - Módulos 2, 3, 4, 5, 6, 7, 8, 12, 13, 14, 15, 16 (historial institución + pagar suscripción)
    2: [
      { icon: '📊', label: 'Dashboard', items: [
        { nav: 'dashboard_admin', label: '🏢 Admin IPS', href: 'views/dashboard/dashboard_admin.html' }
      ]},
      { icon: '🔐', label: 'Seguridad', items: [
        { nav: 'directorio_usuarios', label: '👥 Directorio', href: 'views/seguridad/directorio_usuarios.html' },
        { nav: 'registro_usuario', label: '➕ Nuevo usuario', href: 'views/seguridad/registro_usuario.html' }
      ]},
      { icon: '🩺', label: 'Pacientes', items: [
        { nav: 'directorio_pacientes', label: '📋 Directorio', href: 'views/pacientes/directorio_pacientes.html' },
        { nav: 'registro_paciente', label: '➕ Nuevo paciente', href: 'views/pacientes/registro_paciente.html' }
      ]},
      { icon: '👨‍⚕️', label: 'Profesionales', items: [
        { nav: 'directorio_profesionales', label: '📋 Directorio', href: 'views/profesionales/directorio_profesionales.html' },
        { nav: 'registro_profesional', label: '➕ Nuevo profesional', href: 'views/profesionales/registro_profesional.html' },
        { nav: 'especialidades_medicas', label: '🧬 Especialidades', href: 'views/profesionales/especialidades_medicas.html' }
      ]},
      { icon: '🚪', label: 'Consultorios', items: [
        { nav: 'directorio_consultorios', label: '📋 Directorio', href: 'views/consultorios/directorio_consultorios.html' },
        { nav: 'matriz_ocupacion', label: '🗓️ Matriz ocupación', href: 'views/consultorios/matriz_ocupacion.html' }
      ]},
      { icon: '📅', label: 'Agenda', items: [
        { nav: 'calendario_agenda', label: '📆 Calendario', href: 'views/agenda/calendario_agenda.html' },
        { nav: 'configurar_horario', label: '⏰ Configurar horarios', href: 'views/agenda/configurar_horario.html' },
        { nav: 'bloqueo_agenda', label: '⛔ Bloqueos', href: 'views/agenda/bloqueo_agenda.html' }
      ]},
      { icon: '🗓️', label: 'Citas', items: [
        { nav: 'mesa_recepcion', label: '🛎️ Mesa recepción', href: 'views/citas/mesa_recepcion.html' },
        { nav: 'agendamiento_cita', label: '➕ Agendar cita', href: 'views/citas/agendamiento_cita.html' },
        { nav: 'historial_reprogramacion', label: '🔄 Reprogramación', href: 'views/citas/historial_reprogramacion.html' }
      ]},
      { icon: '📈', label: 'Seguimiento', items: [
        { nav: 'panel_seguimiento', label: '📊 Panel', href: 'views/seguimiento/panel_seguimiento.html' },
        { nav: 'programar_control', label: '➕ Programar control', href: 'views/seguimiento/programar_control.html' }
      ]},
      { icon: '🔔', label: 'Notificaciones', items: [
        { nav: 'centro_notificaciones', label: '📥 Centro', href: 'views/notificaciones/centro_notificaciones.html' },
        { nav: 'configuracion_alertas', label: '⚙️ Configuración', href: 'views/notificaciones/configuracion_alertas.html' }
      ]},
      { icon: '📑', label: 'Reportes', items: [
        { nav: 'reportes_asistenciales', label: '🩺 Asistenciales', href: 'views/reportes/reportes_asistenciales.html' },
        { nav: 'reportes_administrativos', label: '🏢 Administrativos', href: 'views/reportes/reportes_administrativos.html' }
      ]},
      { icon: '💳', label: 'Pagos', items: [
        { nav: 'historial_transacciones', label: '📋 Historial IPS', href: 'views/pagos/historial_transacciones.html' },
        { nav: 'checkout_pago', label: '💳 Pagar suscripción', href: 'views/pagos/checkout_pago.html' }
      ]}
    ],
    // Médico - Módulos 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
    3: [
      { icon: '📊', label: 'Dashboard', items: [
        { nav: 'dashboard_medico', label: '🧑‍⚕️ Médico', href: 'views/dashboard/dashboard_medico.html' }
      ]},
      { icon: '🩺', label: 'Pacientes', items: [
        { nav: 'directorio_pacientes', label: '📋 Directorio', href: 'views/pacientes/directorio_pacientes.html' }
      ]},
      { icon: '👨‍⚕️', label: 'Profesionales', items: [
        { nav: 'directorio_profesionales', label: '📋 Directorio', href: 'views/profesionales/directorio_profesionales.html' }
      ]},
      { icon: '🚪', label: 'Consultorios', items: [
        { nav: 'directorio_consultorios', label: '📋 Directorio', href: 'views/consultorios/directorio_consultorios.html' }
      ]},
      { icon: '📅', label: 'Agenda', items: [
        { nav: 'calendario_agenda', label: '📆 Calendario', href: 'views/agenda/calendario_agenda.html' }
      ]},
      { icon: '🗓️', label: 'Citas', items: [
        { nav: 'mesa_recepcion', label: '🛎️ Mesa recepción', href: 'views/citas/mesa_recepcion.html' }
      ]},
      { icon: '🩻', label: 'Atención', items: [
        { nav: 'panel_asistencial', label: '🧑‍⚕️ Panel asistencial', href: 'views/atencion/panel_asistencial.html' }
      ]},
      { icon: '📚', label: 'Historia clínica', items: [
        { nav: 'visor_historia', label: '📖 Visor historia', href: 'views/historia_clinica/visor_historia.html' },
        { nav: 'evolucion_clinica', label: '✍️ Nueva nota', href: 'views/historia_clinica/evolucion_clinica.html' }
      ]},
      { icon: '🧬', label: 'Diagnósticos', items: [
        { nav: 'registro_diagnostico', label: '➕ Registrar', href: 'views/diagnosticos/registro_diagnostico.html' },
        { nav: 'historial_diagnostico', label: '🗂️ Historial', href: 'views/diagnosticos/historial_diagnostico.html' }
      ]},
      { icon: '💊', label: 'Tratamientos', items: [
        { nav: 'formulario_prescripcion', label: '📝 Prescripción', href: 'views/tratamientos/formulario_prescripcion.html' },
        { nav: 'tratamientos_activos', label: '📋 Activos', href: 'views/tratamientos/tratamientos_activos.html' }
      ]},
      { icon: '📈', label: 'Seguimiento', items: [
        { nav: 'panel_seguimiento', label: '📊 Panel', href: 'views/seguimiento/panel_seguimiento.html' },
        { nav: 'programar_control', label: '➕ Programar', href: 'views/seguimiento/programar_control.html' }
      ]},
      { icon: '🔔', label: 'Notificaciones', items: [
        { nav: 'centro_notificaciones', label: '📥 Centro', href: 'views/notificaciones/centro_notificaciones.html' }
      ]}
    ],
    // Recepción - Módulos 3, 4, 5, 6, 7, 13, 15, 16 (punto de venta + historial del día)
    4: [
      { icon: '🩺', label: 'Pacientes', items: [
        { nav: 'directorio_pacientes', label: '📋 Directorio', href: 'views/pacientes/directorio_pacientes.html' },
        { nav: 'registro_paciente', label: '➕ Nuevo paciente', href: 'views/pacientes/registro_paciente.html' }
      ]},
      { icon: '👨‍⚕️', label: 'Profesionales', items: [
        { nav: 'directorio_profesionales', label: '📋 Directorio', href: 'views/profesionales/directorio_profesionales.html' }
      ]},
      { icon: '🚪', label: 'Consultorios', items: [
        { nav: 'directorio_consultorios', label: '📋 Directorio', href: 'views/consultorios/directorio_consultorios.html' },
        { nav: 'matriz_ocupacion', label: '🗓️ Matriz ocupación', href: 'views/consultorios/matriz_ocupacion.html' }
      ]},
      { icon: '🗓️', label: 'Citas', items: [
        { nav: 'mesa_recepcion', label: '🛎️ Mesa recepción', href: 'views/citas/mesa_recepcion.html' },
        { nav: 'agendamiento_cita', label: '➕ Agendar cita', href: 'views/citas/agendamiento_cita.html' },
        { nav: 'historial_reprogramacion', label: '🔄 Reprogramación', href: 'views/citas/historial_reprogramacion.html' }
      ]},
      { icon: '💳', label: 'Pagos', items: [
        { nav: 'checkout_pago', label: '💳 Cobrar en recepción', href: 'views/pagos/checkout_pago.html' },
        { nav: 'historial_transacciones', label: '📋 Historial del día', href: 'views/pagos/historial_transacciones.html' }
      ]},
      { icon: '🔔', label: 'Notificaciones', items: [
        { nav: 'centro_notificaciones', label: '📥 Centro', href: 'views/notificaciones/centro_notificaciones.html' }
      ]}
    ],
    // Paciente - Módulos 7, 9, 11, 13, 16 (pagar copagos/consultas + ver sus pagos)
    5: [
      { icon: '🗓️', label: 'Citas', items: [
        { nav: 'mesa_recepcion', label: '🛎️ Mis citas', href: 'views/citas/mesa_recepcion.html' }
      ]},
      { icon: '📚', label: 'Historia clínica', items: [
        { nav: 'visor_historia', label: '📖 Mi historia', href: 'views/historia_clinica/visor_historia.html' }
      ]},
      { icon: '💊', label: 'Tratamientos', items: [
        { nav: 'tratamientos_activos', label: '📋 Mis tratamientos', href: 'views/tratamientos/tratamientos_activos.html' }
      ]},
      { icon: '📈', label: 'Seguimiento', items: [
        { nav: 'panel_seguimiento', label: '📊 Mis controles', href: 'views/seguimiento/panel_seguimiento.html' }
      ]},
      { icon: '💳', label: 'Pagos', items: [
        { nav: 'checkout_pago', label: '💳 Realizar pago', href: 'views/pagos/checkout_pago.html' },
        { nav: 'historial_transacciones', label: '📋 Mis pagos', href: 'views/pagos/historial_transacciones.html' }
      ]},
      { icon: '🔔', label: 'Notificaciones', items: [
        { nav: 'centro_notificaciones', label: '📥 Mis notificaciones', href: 'views/notificaciones/centro_notificaciones.html' }
      ]}
    ]
  };

  const NOMBRES_ROL = {
    1: 'SuperAdmin',
    2: 'Admin IPS',
    3: 'Médico',
    4: 'Recepción',
    5: 'Paciente'
  };

  function generarMenuSegunRol() {
    const menuContainer = document.getElementById('menuDinamico');
    const rolBadge = document.getElementById('rolBadge');
    const btnAuth = document.getElementById('btnAuth');
    
    if (!menuContainer) return;

    try {
      const sesion = JSON.parse(sessionStorage.getItem('saludsync_sesion'));
      const rolId = sesion ? sesion.rolId : null;

      if (!rolId) {
        // No autenticado - menú mínimo
        menuContainer.innerHTML = '<li class="nav-item"><a class="nav-link" data-nav="inicio" href="' + ROOT + 'index.html">🏠 Inicio</a></li>';
        rolBadge.textContent = 'No autenticado';
        btnAuth.textContent = '👤 Iniciar sesión';
        btnAuth.href = ROOT + 'views/seguridad/login.html';
        return;
      }

      // Generar menú según rol
      const items = ITEMS_MENU[rolId] || [];
      let menuHTML = '<li class="nav-item"><a class="nav-link" data-nav="inicio" href="' + ROOT + 'index.html">🏠 Inicio</a></li>';

      items.forEach(item => {
        menuHTML += '<li class="nav-item dropdown">';
        menuHTML += '<a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">' + item.icon + ' ' + item.label + '</a>';
        menuHTML += '<ul class="dropdown-menu">';
        item.items.forEach(sub => {
          menuHTML += '<li><a class="dropdown-item" data-nav="' + sub.nav + '" href="' + ROOT + sub.href + '">' + sub.label + '</a></li>';
        });
        menuHTML += '</ul></li>';
      });

      menuContainer.innerHTML = menuHTML;
      rolBadge.textContent = NOMBRES_ROL[rolId] || 'Rol desconocido';
      btnAuth.textContent = '🚪 Cerrar sesión';
      btnAuth.href = '#';
      btnAuth.onclick = async function(e) {
        e.preventDefault();
        await SS.api('controls/seguridad/logout.php', { method: 'POST' }); // cierra la sesión en el servidor
        sessionStorage.removeItem(SESION_KEY);
        sessionStorage.removeItem('saludsync_modulo2_v1');
        window.location.href = ROOT + 'views/seguridad/login.html?salida=ok';
      };

    } catch (e) {
      console.error('Error al generar menú:', e);
      menuContainer.innerHTML = '<li class="nav-item"><a class="nav-link" data-nav="inicio" href="' + ROOT + 'index.html">🏠 Inicio</a></li>';
    }
  }

  /* ---- Utilidades globales (RNF-USA-03: evitar envíos duplicados) ---- */
  const SS = {
    ROOT,
    sesion: null,        // datos de la sesión real (los llena sincronizarSesion)
    sesionLista: null,   // promesa que se resuelve cuando ya se conoce el estado de la sesión
    api,
    // Deshabilita el botón y muestra spinner; devuelve función para restaurarlo
    lock(btn, texto) {
      if (!btn || btn.disabled) return () => {};
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>' + (texto || 'Procesando…');
      return () => { btn.disabled = false; btn.innerHTML = original; };
    },
    toast(mensaje, tipo) {
      let cont = document.getElementById('ss-toasts');
      if (!cont) { cont = document.createElement('div'); cont.id = 'ss-toasts'; document.body.appendChild(cont); }
      const el = document.createElement('div');
      el.className = 'toast align-items-center text-bg-' + (tipo || 'success') + ' border-0 mb-2';
      el.setAttribute('role', 'alert');
      el.innerHTML = '<div class="d-flex"><div class="toast-body"></div>' +
        '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button></div>';
      el.querySelector('.toast-body').textContent = mensaje;
      cont.appendChild(el);
      const t = new bootstrap.Toast(el, { delay: 3500 });
      el.addEventListener('hidden.bs.toast', () => el.remove());
      t.show();
    }
  };
  window.SS = SS;
  SS.sesionLista = sincronizarSesion();

  // Cualquier botón con data-lock se deshabilita 1,5 s al hacer clic (acciones críticas sin formulario)
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-lock]');
    if (b && !b.disabled) { const unlock = SS.lock(b, b.dataset.lock || 'Procesando…'); setTimeout(unlock, 1500); }
  });

  document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([cargarComponente('#app-header', 'header.html'), cargarComponente('#app-footer', 'footer.html'), SS.sesionLista]);
    generarMenuSegunRol();
    marcarMenuActivo();
    actualizarCampana();
    document.addEventListener('ss:notif', actualizarCampana);
    document.addEventListener('ss:sesion', generarMenuSegunRol); // Regenerar menú cuando cambia la sesión
    document.querySelectorAll('[data-anio]').forEach(s => s.textContent = new Date().getFullYear());
  });
})();