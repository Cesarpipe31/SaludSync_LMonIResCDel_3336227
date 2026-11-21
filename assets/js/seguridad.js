/* ===== SaludSync · Módulo 2: Seguridad y Control de Acceso (datos desde controls/seguridad/*.php) ===== */
(function () {
  'use strict';

  /* ---------- Utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const modal = id => bootstrap.Modal.getOrCreateInstance(document.getElementById(id));
  const pad = n => String(n).padStart(2, '0');
  const ahora = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const BADGE_ESTADO = { 'Activo': 'success', 'Inactivo': 'secondary', 'Bloqueado': 'danger' };

  /* ---------- Catálogos (tablas rol, permiso, rol_permiso) ---------- */
  const ROLES = [
    { id: 1, nombre: 'SuperAdmin', desc: 'Administra la plataforma SaaS completa' },
    { id: 2, nombre: 'Admin IPS', desc: 'Administra una institución de salud' },
    { id: 3, nombre: 'Médico', desc: 'Profesional asistencial' },
    { id: 4, nombre: 'Recepción', desc: 'Gestión de citas y recepción' },
    { id: 5, nombre: 'Paciente', desc: 'Autogestión de citas y consulta propia' }
  ];
  const ROL_BADGE = { 1: 'dark', 2: 'primary', 3: 'success', 4: 'info text-dark', 5: 'secondary' };
  const MODULOS = ['Plataforma SaaS', 'Seguridad y Acceso', 'Gestión de Pacientes', 'Profesionales y Especialidades', 'Consultorios y Sedes',
    'Agenda Médica', 'Citas y Recepción', 'Atención Médica', 'Historia Clínica', 'Diagnósticos', 'Tratamientos y Prescripción',
    'Seguimiento y Controles', 'Notificaciones', 'Reportes y Estadísticas', 'Dashboard'].map((n, i) => ({ codigo: 'MOD-' + pad(i + 1), nombre: n }));
  const N = { S: 'Sin acceso', L: 'Lectura', E: 'Lectura/Escritura' };
  const build = (rw, l) => { const o = {}; MODULOS.forEach((m, i) => { const n = i + 1; o[m.codigo] = rw.includes(n) ? N.E : l.includes(n) ? N.L : N.S; }); return o; };
  const MATRIZ_DEFECTO = {
    1: build([1, 2, 13], [14, 15]),
    2: build([2, 3, 4, 5, 6, 7, 13, 14], [8, 12, 15]),
    3: build([8, 9, 10, 11, 12], [3, 4, 5, 6, 7, 13, 14, 15]),
    4: build([3, 7], [4, 5, 6, 13, 15]),
    5: build([7], [3, 9, 11, 13])
  };

  /* ---------- Datos: llegan del servidor (controls/seguridad/*.php); ya no hay datos de ejemplo ---------- */
  const RUTA_DIR = 'controls/seguridad/directorio_usuarios.php', RUTA_REG = 'controls/seguridad/registro_usuario.php';
  const RUTA_MAT = 'controls/seguridad/matriz_roles.php', RUTA_REC = 'controls/seguridad/recuperar_contrasena.php';
  const DB = { usuarios: [], matriz: {}, auditoria: [], instituciones: [], conteos: {} };
  const userDe = id => DB.usuarios.find(u => u.id === id);
  const nombreDe = u => `${u.n} ${u.a}`.trim();
  const rolDe = id => ROLES.find(r => r.id === id);
  const instNombre = id => id ? (DB.instituciones.find(i => i.id === id)?.nombre || '—') : 'Plataforma (global)';

  /* ---------- Contraseñas: hash simulado y requisitos ---------- */
  function seudoHash(txt) {
    if (!txt) return '—';
    let h = 5381; for (const c of txt) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0;
    const b = './ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; let out = '', s = h;
    for (let i = 0; i < 53; i++) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; out += b[s % 64]; }
    return '$2y$10$' + out;
  }
  const evaluarReq = pw => ({ len: pw.length >= 8, may: /[A-Z]/.test(pw), min: /[a-z]/.test(pw), num: /\d/.test(pw), sim: /[^A-Za-z0-9]/.test(pw) });
  function vincularReq(input, lista, alCambiar) {
    const run = () => {
      const r = evaluarReq(input.value);
      $$('[data-req]', lista).forEach(li => li.classList.toggle('ok', r[li.dataset.req]));
      const ok = Object.values(r).every(Boolean);
      input.setCustomValidity(ok || (!input.required && !input.value) ? '' : 'Requisitos');
      if (alCambiar) alCambiar(ok);
    };
    input.addEventListener('input', run); run();
  }
  // Contraseña temporal sugerida: usa el generador criptográfico del navegador, no Math.random
  function generarClave() {
    const azar = n => crypto.getRandomValues(new Uint32Array(1))[0] % n;
    const pick = s => s[azar(s.length)];
    const base = [pick('ABCDEFGHJKLMNPQRSTUVWXYZ'), pick('abcdefghijkmnpqrstuvwxyz'), pick('23456789'), pick('!@#$%&*')];
    const todos = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    while (base.length < 12) base.push(pick(todos));
    for (let i = base.length - 1; i > 0; i--) { const j = azar(i + 1); [base[i], base[j]] = [base[j], base[i]]; }
    return base.join('');
  }

  // Mostrar/ocultar contraseña (global)
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-toggle-pass]'); if (!t) return;
    const i = $(t.dataset.togglePass), ver = i.type === 'password';
    i.type = ver ? 'text' : 'password'; t.textContent = ver ? '🙈' : '👁'; t.setAttribute('aria-pressed', ver);
  });

  /* =====================================================
     LOGIN (RF-SEG-01 / RF-SEG-03)
     ===================================================== */
  function initLogin() {
    const f = $('#formLogin'); if (!f) return;
    const alerta = $('#loginAlert'), btn = $('#btnLogin');
    const msg = (txt, tipo) => { alerta.className = 'alert alert-' + tipo; alerta.textContent = txt; };

    // login.php redirige aquí con ?error=, ?acceso=, ?salida= o ?sesion=; la vista lo traduce en un mensaje
    const MENSAJES_ERROR = {
      datos: ['Ingrese un correo válido y su contraseña.', 'danger'],
      credenciales: ['Credenciales incorrectas. Verifique su correo y contraseña.', 'danger'],
      bloqueada: ['Cuenta bloqueada por intentos fallidos. Recupere su contraseña o contacte al administrador.', 'danger'],
      inactiva: ['Su cuenta está inactiva. Contacte al administrador de su institución.', 'warning'],
      institucion: ['La institución a la que pertenece está inactiva; el acceso está bloqueado.', 'warning'],
      rol: ['Su rol no tiene un panel habilitado en esta versión.', 'warning'],
      sistema: ['No fue posible iniciar sesión en este momento. Intente de nuevo más tarde.', 'danger']
    };
    const params = new URLSearchParams(location.search);
    const codigoError = params.get('error');
    if (params.get('registro') === 'ok') msg('Cuenta creada correctamente. Ya puede iniciar sesión.', 'success');
    if (codigoError && Object.prototype.hasOwnProperty.call(MENSAJES_ERROR, codigoError)) msg(...MENSAJES_ERROR[codigoError]);
    if (params.get('sesion') === 'expirada') msg('Su sesión expiró por inactividad. Inicie sesión nuevamente.', 'warning');
    if (params.get('sesion') === 'requerida') msg('Inicie sesión para acceder a esa página.', 'info');
    if (params.get('salida') === 'ok') msg('Sesión cerrada correctamente.', 'success');

    // Con ?acceso=ok la sesión ya existe en el servidor: se espera a que main.js la sincronice y se entra al panel del rol
    async function completarAcceso() {
      msg('Verificando su sesión…', 'info');
      await SS.sesionLista;
      const s = SS.sesion;
      if (!s || !s.autenticado) { msg(...MENSAJES_ERROR.sistema); return; }
      const destinos = { 1: '../dashboard/dashboard_superadmin.html', 2: '../dashboard/dashboard_admin.html', 3: '../dashboard/dashboard_medico.html', 4: '../citas/mesa_recepcion.html', 5: '../citas/mesa_recepcion.html' };
      msg(`✅ Bienvenido(a), ${s.nombre}. Redirigiendo a su panel de ${s.rol}…`, 'success');
      setTimeout(() => { location.href = destinos[s.rolId] || '../../index.html'; }, 1300);
    }
    if (params.get('acceso') === 'ok') completarAcceso();

    $('#contrasena').addEventListener('input', e => { $('#hashPreview').textContent = seudoHash(e.target.value); });

    let desbloquear = () => {};
    f.addEventListener('submit', e => {
      alerta.className = 'd-none'; f.classList.add('was-validated');
      if (!f.checkValidity()) { e.preventDefault(); return; } // las validaciones visuales se conservan
      desbloquear = SS.lock(btn, 'Verificando…');             // evita doble envío; el formulario viaja a login.php
    });
    // Al volver con el botón "Atrás" el navegador puede restaurar la página con el botón bloqueado
    window.addEventListener('pageshow', e => { if (e.persisted) desbloquear(); });
  }

  /* =====================================================
     RECUPERAR CONTRASEÑA (RF-SEG-02)
     ===================================================== */
  function initRecuperar() {
    const f1 = $('#formSolicitar'); if (!f1) return;
    let timer = null;
    const ver = n => ['paso1', 'paso2', 'paso3', 'paso4'].forEach((p, i) => $('#' + p).classList.toggle('d-none', i + 1 !== n));
    const token = new URLSearchParams(location.search).get('token') || '';
    if (token) ver(3); // se llegó desde el enlace de recuperación

    f1.addEventListener('submit', async e => {
      e.preventDefault(); const btn = $('#btnSolicitar'); if (btn.disabled) return;
      f1.classList.add('was-validated'); if (!f1.checkValidity()) return;
      const unlock = SS.lock(btn, 'Enviando…');
      const correo = $('#correoRec').value.trim();
      const r = await SS.api(RUTA_REC, { method: 'POST', body: { accion: 'solicitar', correo } });
      unlock();
      if (!r.ok) { SS.toast(r.mensaje, 'danger'); return; }
      $('#correoEnviado').textContent = correo.toLowerCase();
      let seg = 30 * 60; clearInterval(timer);
      timer = setInterval(() => { seg--; $('#cuentaRegresiva').textContent = `${pad(Math.floor(seg / 60))}:${pad(seg % 60)}`; if (seg <= 0) clearInterval(timer); }, 1000);
      ver(2);
    });

    // Sin servidor de correo, el enlace queda escrito en el registro de errores de PHP (solo para demostración)
    $('#btnAbrirEnlace').addEventListener('click', () => SS.toast('Abra el enlace recibido. En este entorno de desarrollo el enlace queda escrito en el registro de errores del servidor (php_error_log).', 'info'));

    const nueva = $('#nueva'), conf = $('#confirmar'), f3 = $('#formNueva');
    const validarConf = () => {
      const ok = conf.value === nueva.value && conf.value !== '';
      conf.setCustomValidity(ok ? '' : 'No coincide');
      $('#fbConfirmar').textContent = conf.value === '' ? 'Confirme la contraseña.' : 'La contraseña no coincide.';
    };
    vincularReq(nueva, $('#reqList'), validarConf);
    conf.addEventListener('input', validarConf); validarConf();

    f3.addEventListener('submit', async e => {
      e.preventDefault(); const btn = $('#btnCambiar'); if (btn.disabled) return;
      validarConf(); f3.classList.add('was-validated'); if (!f3.checkValidity()) return;
      const unlock = SS.lock(btn, 'Actualizando…');
      const r = await SS.api(RUTA_REC, { method: 'POST', body: { accion: 'restablecer', token, nueva: nueva.value } });
      unlock();
      if (!r.ok) { SS.toast(r.mensaje, 'danger'); return; }
      clearInterval(timer); ver(4);
    });
  }

  /* =====================================================
     DIRECTORIO DE USUARIOS (RF-SEG-04)
     ===================================================== */
  async function initDirectorio() {
    const tbody = $('#tablaUsuarios'); if (!tbody) return;
    const TAM = 5; let pagina = 1, seleccionado = null;
    $('#filtroRol').innerHTML += ROLES.map(r => `<option value="${r.id}">${esc(r.nombre)}</option>`).join('');

    async function cargar() {
      const r = await SS.api(RUTA_DIR + '?accion=listar');
      if (!r.ok) { SS.toast(r.mensaje || 'No fue posible cargar los usuarios.', 'danger'); return; }
      Object.assign(DB, { usuarios: r.datos.usuarios, instituciones: r.datos.instituciones, matriz: r.datos.matriz, auditoria: r.datos.auditoria });
    }

    function filtrar() {
      const q = norm($('#buscador').value.trim()), fr = $('#filtroRol').value, fe = $('#filtroEstado').value;
      return DB.usuarios.filter(u => (!q || u.doc.includes(q) || norm(nombreDe(u)).includes(q) || norm(u.correo).includes(q)) && (!fr || u.rol === +fr) && (!fe || u.estado === fe));
    }

    function renderAuditoria() {
      $('#tablaAuditoria').innerHTML = DB.auditoria.slice(0, 6).map(a => `<tr class="audit-row">
        <td>${esc(a.fecha)}</td><td>${esc(a.usuario)}</td><td><code>${esc(a.tabla)}</code> #${a.registro}</td>
        <td><span class="badge bg-${a.accion === 'Creación' ? 'success' : 'primary'}">${esc(a.accion)}</span></td>
        <td class="audit-json">${esc(JSON.stringify(a.ant || {}))} → ${esc(JSON.stringify(a.nuevo || {}))}</td><td>${esc(a.ip)}</td></tr>`).join('');
    }

    function render() {
      const lista = filtrar(), total = lista.length, paginas = Math.max(1, Math.ceil(total / TAM));
      if (pagina > paginas) pagina = paginas;
      const ini = (pagina - 1) * TAM, vista = lista.slice(ini, ini + TAM);
      tbody.innerHTML = vista.length ? vista.map(u => {
        const r = rolDe(u.rol);
        return `<tr>
          <td>${esc(u.tipo)} ${esc(u.doc)}</td>
          <td><strong>${esc(nombreDe(u))}</strong><span class="cell-sub">${esc(u.correo)}</span></td>
          <td><span class="badge rol-badge bg-${ROL_BADGE[u.rol]}">${esc(r.nombre)}</span></td>
          <td>${esc(instNombre(u.inst))}</td><td>${esc(u.acceso || '—')}</td>
          <td><span class="badge bg-${BADGE_ESTADO[u.estado]}">${u.estado}</span>${u.intentos ? `<span class="cell-sub">Intentos fallidos: ${u.intentos}</span>` : ''}</td>
          <td class="text-end text-nowrap">
            <button class="btn btn-sm btn-outline-primary" data-act="ver" data-id="${u.id}" title="Ver detalle">👁</button>
            ${u.gestionable ? `<a class="btn btn-sm btn-outline-primary" href="registro_usuario.html?id=${u.id}" title="Editar usuario">✏️</a>
            <button class="btn btn-sm btn-outline-secondary" data-act="estado" data-id="${u.id}" title="Cambiar estado">🔁 Estado</button>` : ''}
          </td></tr>`;
      }).join('') : '<tr><td colspan="7" class="text-center text-muted py-4">No se encontraron usuarios con los filtros aplicados.</td></tr>';

      $('#contador').textContent = total ? `Mostrando ${ini + 1}–${ini + vista.length} de ${total} usuarios` : 'Sin resultados';
      let pg = `<li class="page-item ${pagina === 1 ? 'disabled' : ''}"><button class="page-link" data-p="${pagina - 1}">«</button></li>`;
      for (let n = 1; n <= paginas; n++) pg += `<li class="page-item ${n === pagina ? 'active' : ''}"><button class="page-link" data-p="${n}">${n}</button></li>`;
      pg += `<li class="page-item ${pagina === paginas ? 'disabled' : ''}"><button class="page-link" data-p="${pagina + 1}">»</button></li>`;
      $('#paginacion').innerHTML = pg;
      $('#kpiTotal').textContent = DB.usuarios.length;
      ['Activo', 'Inactivo', 'Bloqueado'].forEach(s => $('#kpi' + s + 's').textContent = DB.usuarios.filter(u => u.estado === s).length);
      renderAuditoria();
    }

    $('#buscador').addEventListener('input', () => { pagina = 1; render(); });
    $('#filtroRol').addEventListener('change', () => { pagina = 1; render(); });
    $('#filtroEstado').addEventListener('change', () => { pagina = 1; render(); });
    $('#btnLimpiar').addEventListener('click', () => { $('#buscador').value = ''; $('#filtroRol').value = ''; $('#filtroEstado').value = ''; pagina = 1; render(); });
    $('#paginacion').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b && !b.parentElement.classList.contains('disabled')) { pagina = +b.dataset.p; render(); } });

    tbody.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const u = userDe(+b.dataset.id);
      if (b.dataset.act === 'estado') {
        seleccionado = u.id;
        $('#estadoUsuario').innerHTML = `Usuario: <strong>${esc(nombreDe(u))}</strong> · Estado actual: <span class="badge bg-${BADGE_ESTADO[u.estado]}">${u.estado}</span>`;
        $$('input[name=nuevoEstado]').forEach(r => r.checked = r.value === u.estado);
        modal('modalEstado').show();
      } else {
        const p = DB.matriz[u.rol] || {}, rw = Object.values(p).filter(v => v === N.E).length, l = Object.values(p).filter(v => v === N.L).length;
        $('#detalleTitulo').textContent = nombreDe(u);
        $('#detalleCuerpo').innerHTML = `<div class="row g-3 small">
          <div class="col-md-6"><strong>Documento:</strong> ${esc(u.tipo)} ${esc(u.doc)}</div>
          <div class="col-md-6"><strong>Rol:</strong> ${esc(rolDe(u.rol).nombre)}</div>
          <div class="col-md-6"><strong>Correo:</strong> ${esc(u.correo)}</div>
          <div class="col-md-6"><strong>Teléfono:</strong> ${esc(u.tel || '—')}</div>
          <div class="col-md-6"><strong>Institución:</strong> ${esc(instNombre(u.inst))}</div>
          <div class="col-md-6"><strong>Estado:</strong> ${u.estado} (intentos fallidos: ${u.intentos})</div>
          <div class="col-md-6"><strong>Último acceso:</strong> ${esc(u.acceso || '—')}</div>
          <div class="col-md-6"><strong>Creado:</strong> ${esc(u.creado)}</div>
          <div class="col-12"><strong>Permisos:</strong> ${rw} módulo(s) con escritura · ${l} módulo(s) en lectura <span class="badge bg-success">Heredado del rol</span></div></div>`;
        modal('modalDetalle').show();
      }
    });

    $('#btnConfirmarEstado').addEventListener('click', async e => {
      const nuevo = ($('input[name=nuevoEstado]:checked') || {}).value, u = userDe(seleccionado);
      if (!nuevo) return;
      if (nuevo === u.estado) { modal('modalEstado').hide(); return SS.toast('El estado no cambió.', 'secondary'); }
      const unlock = SS.lock(e.currentTarget, 'Aplicando…');
      const r = await SS.api(RUTA_DIR, { method: 'POST', body: { accion: 'estado', id: u.id, estado: nuevo } });
      unlock(); modal('modalEstado').hide();
      if (!r.ok) { SS.toast(r.mensaje, 'danger'); return; }
      await cargar(); render();
      SS.toast(`Cuenta de ${u.n} ahora está ${nuevo.toLowerCase()}.`, nuevo === 'Activo' ? 'success' : 'secondary');
    });

    // Mensaje que deja la pantalla de alta/edición al volver aquí
    const ok = new URLSearchParams(location.search).get('ok');
    if (ok === 'creado') SS.toast('Usuario creado correctamente.');
    if (ok === 'actualizado') SS.toast('Cambios guardados correctamente.');

    await cargar();
    render();
  }

  /* =====================================================
     ALTA / EDICIÓN DE USUARIO (RF-SEG-05)
     ===================================================== */
  async function initRegistroUsuario() {
    const f = $('#formUsuario'); if (!f) return;
    f.addEventListener('submit', e => e.preventDefault()); // sin envío nativo: los datos viajan como JSON a registro_usuario.php
    await SS.sesionLista;
    // Sin sesión = autorregistro de Paciente. Con sesión de SuperAdmin o Admin IPS = alta administrativa (el servidor decide qué roles y qué institución)
    const sesion = SS.sesion, esAdmin = !!sesion && (sesion.rolId === 1 || sesion.rolId === 2);
    const editId = esAdmin ? (+new URLSearchParams(location.search).get('id') || null) : null;
    const rolSel = $('#rol'), instSel = $('#institucion'), btn = $('#btnGuardar'), estadoSel = $('#estado');
    let custom = false;

    const rolesVisibles = !esAdmin ? [5] : sesion.rolId === 1 ? ROLES.map(r => r.id) : [3, 4, 5];
    rolSel.innerHTML += ROLES.filter(r => rolesVisibles.includes(r.id)).map(r => `<option value="${r.id}">${esc(r.nombre)}</option>`).join('');
    if (esAdmin) { rolSel.disabled = false; rolSel.required = true; rolSel.options[0].textContent = 'Seleccione…'; }
    else { rolSel.value = '5'; estadoSel.value = 'Activo'; estadoSel.disabled = true; $('#permBody').closest('section').classList.add('d-none'); }
    if (esAdmin && !editId) [...estadoSel.options].find(o => o.text === 'Bloqueado')?.remove(); // una cuenta nueva no nace bloqueada

    // Instituciones activas desde la BD
    const ri = await SS.api(RUTA_REG + '?accion=instituciones');
    if (ri.ok) instSel.innerHTML += ri.datos.instituciones.map(i => `<option value="${i.id}">${esc(i.nombre)}</option>`).join('');
    // Matriz de permisos (solo lectura): los permisos se heredan del rol y se administran en "Matriz de roles"
    if (esAdmin) { const rm = await SS.api(RUTA_REG + '?accion=matriz'); if (rm.ok) DB.matriz = rm.datos.matriz; }

    $('#permBody').innerHTML = MODULOS.map(m => `<tr><td><span class="chip">${m.codigo}</span> ${esc(m.nombre)}</td>` +
      [N.S, N.L, N.E].map(v => `<td class="text-center"><input class="form-check-input" type="radio" name="perm_${m.codigo}" value="${v}" disabled aria-label="${esc(m.nombre)}: ${v}"></td>`).join('') + '</tr>').join('');
    ['#btnPermRol', '#btnPermLectura', '#btnPermNinguno'].forEach(s => $(s).classList.add('d-none'));

    const setPerms = p => MODULOS.forEach(m => { const r = $(`input[name="perm_${m.codigo}"][value="${p[m.codigo] || N.S}"]`); if (r) r.checked = true; });
    function actualizarBadge() {
      const b = $('#badgePerm'), rol = +rolSel.value;
      if (!rol) { b.className = 'badge bg-secondary'; b.textContent = 'Seleccione un rol'; return; }
      b.className = 'badge bg-success'; b.textContent = 'Heredado del rol ' + rolDe(rol).nombre;
    }

    function alCambiarRol(aplicar) {
      const rol = +rolSel.value, global = rol === 1;
      instSel.required = !global; instSel.disabled = global || !!editId || sesion?.rolId === 2; if (global) instSel.value = '';
      $('#ayudaInst').textContent = global ? 'El SuperAdmin pertenece a la plataforma (sin institución).' : 'Cada usuario queda aislado a su institución.';
      if (aplicar && rol && DB.matriz[rol]) setPerms(DB.matriz[rol]);
      actualizarBadge();
    }
    rolSel.addEventListener('change', () => alCambiarRol(true));
    if (sesion?.rolId === 2) instSel.value = sesion.instId; // el Admin IPS solo crea en su institución (el servidor lo impone)

    // Unicidad del correo: la valida el servidor contra la BD y su respuesta se marca aquí
    function marcar(el, dup, msg, clave) { el.setCustomValidity(dup ? msg : ''); const fb = $(`[data-fb="${clave}"]`); fb.textContent = dup ? msg : fb.dataset.default; }
    function validarUnicos() { marcar($('#numero_documento'), false, '', 'doc'); marcar($('#correo'), false, '', 'correo'); }
    ['tipo_documento', 'numero_documento', 'correo'].forEach(id => $('#' + id).addEventListener('input', validarUnicos));
    $('#tipo_documento').addEventListener('change', validarUnicos);

    // Contraseña temporal
    const clave = $('#clave');
    vincularReq(clave, $('#reqList'), () => { $('#hashPreview').textContent = seudoHash(clave.value); });
    $('#btnGenerar').addEventListener('click', () => { clave.value = generarClave(); clave.type = 'text'; clave.dispatchEvent(new Event('input')); });

    // Modo edición
    if (editId) {
      const ru = await SS.api(RUTA_REG + '?accion=obtener&id=' + editId);
      if (!ru.ok) { SS.toast(ru.mensaje, 'danger'); btn.disabled = true; return; }
      const u = ru.datos.usuario;
      $('#tituloForm').textContent = 'Modificar usuario'; $('#crumbForm').textContent = 'Modificar';
      $('#subtituloForm').textContent = `Editando: ${nombreDe(u)}`; btn.innerHTML = '💾 Guardar cambios';
      $('#tipo_documento').value = u.tipo; $('#numero_documento').value = u.doc; $('#nombres').value = u.n; $('#apellidos').value = u.a;
      $('#correo').value = u.correo; $('#telefono').value = u.tel || ''; rolSel.value = u.rol; instSel.value = u.inst || ''; estadoSel.value = u.estado;
      $('#bloqueCredenciales').classList.add('d-none'); clave.required = false; clave.setCustomValidity('');
      alCambiarRol(false); setPerms(DB.matriz[u.rol] || {}); actualizarBadge();
    } else { alCambiarRol(false); }

    f.addEventListener('reset', () => { f.classList.remove('was-validated'); setTimeout(() => { setPerms({}); alCambiarRol(false); validarUnicos(); $$('[data-req]').forEach(li => li.classList.remove('ok')); $('#hashPreview').textContent = '—'; }, 0); });

    f.addEventListener('submit', async e => {
      e.preventDefault();
      if (btn.disabled) return;
      validarUnicos();
      f.classList.add('was-validated');
      if (!f.checkValidity()) { (f.querySelector(':invalid') || f).scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      const unlock = SS.lock(btn, 'Guardando…');   // RNF-USA-03
      const datos = {
        accion: editId ? 'editar' : 'crear', id: editId,
        tipo_documento: $('#tipo_documento').value, numero_documento: $('#numero_documento').value.trim(),
        nombres: $('#nombres').value.trim(), apellidos: $('#apellidos').value.trim(),
        correo: $('#correo').value.trim(), telefono: $('#telefono').value.trim(),
        id_institucion: instSel.value ? +instSel.value : null, estado: estadoSel.value
      };
      if (esAdmin) datos.id_rol = +rolSel.value;
      if (!editId) datos.clave = clave.value;
      const r = await SS.api(RUTA_REG, { method: 'POST', body: datos });
      if (!r.ok) {
        unlock();
        if (r.datos && r.datos.campo === 'correo') marcar($('#correo'), true, r.mensaje, 'correo');
        SS.toast(r.mensaje, 'danger');
        return;
      }
      if (!esAdmin) { location.href = 'login.html?registro=ok'; return; }
      location.href = 'directorio_usuarios.html?ok=' + (editId ? 'actualizado' : 'creado');
    });
  }

  /* =====================================================
     MATRIZ DE ROLES (rol_permiso)
     ===================================================== */
  async function initMatriz() {
    const body = $('#matrizBody'); if (!body) return;
    const btnG = $('#btnGuardarMatriz');
    const r0 = await SS.api(RUTA_MAT + '?accion=cargar');
    if (!r0.ok) { SS.toast(r0.mensaje || 'No fue posible cargar la matriz.', 'danger'); return; }
    DB.matriz = r0.datos.matriz; DB.conteos = r0.datos.conteos;
    let trabajo = JSON.parse(JSON.stringify(DB.matriz));

    $('#matrizHead').innerHTML = '<tr><th>Módulo</th>' + ROLES.map(r => {
      const n = DB.conteos[r.id] || 0;
      return `<th class="text-center"><span class="badge rol-badge bg-${ROL_BADGE[r.id]}">${esc(r.nombre)}</span><span class="cell-sub text-center text-lowercase">${n} usuario(s)</span></th>`;
    }).join('') + '</tr>';

    function render() {
      body.innerHTML = MODULOS.map(m => `<tr><td><span class="chip">${m.codigo}</span> ${esc(m.nombre)}</td>` + ROLES.map(r => {
        const v = trabajo[r.id][m.codigo];
        return `<td class="text-center"><select class="form-select form-select-sm nivel-select" data-rol="${r.id}" data-mod="${m.codigo}" data-v="${v}" aria-label="${esc(r.nombre)} en ${esc(m.nombre)}">` +
          [N.S, N.L, N.E].map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('') + '</select></td>';
      }).join('') + '</tr>').join('');
    }
    body.addEventListener('change', e => {
      const s = e.target.closest('.nivel-select'); if (!s) return;
      trabajo[s.dataset.rol][s.dataset.mod] = s.value; s.dataset.v = s.value;
      btnG.disabled = JSON.stringify(trabajo) === JSON.stringify(DB.matriz);
    });
    btnG.addEventListener('click', async () => {
      if (btnG.disabled) return;
      const unlock = SS.lock(btnG, 'Guardando…');
      const r = await SS.api(RUTA_MAT, { method: 'POST', body: { accion: 'guardar', matriz: trabajo } });
      unlock();
      if (!r.ok) { SS.toast(r.mensaje, 'danger'); return; }
      DB.matriz = JSON.parse(JSON.stringify(trabajo));
      btnG.disabled = true; SS.toast(r.mensaje);
    });
    $('#btnRestablecer').addEventListener('click', () => {
      trabajo = JSON.parse(JSON.stringify(MATRIZ_DEFECTO)); render();
      btnG.disabled = JSON.stringify(trabajo) === JSON.stringify(DB.matriz);
      SS.toast('Se cargaron los valores por defecto. Presione "Guardar cambios" para aplicarlos.', 'secondary');
    });
    render();
  }

  document.addEventListener('DOMContentLoaded', () => { initLogin(); initRecuperar(); initDirectorio(); initRegistroUsuario(); initMatriz(); });
})();