/* ===== SaludSync · Módulo 1: Plataforma SaaS (mockup interactivo, sin backend) ===== */
(function () {
  'use strict';

  /* ---------- Utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const COP = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
  const parse = s => new Date(s + 'T00:00:00');
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fmt = s => parse(s).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  const HOY = new Date(); HOY.setHours(0, 0, 0, 0);
  const diasPara = s => Math.ceil((parse(s) - HOY) / 864e5);
  const estadoSusc = s => { const d = diasPara(s); return d < 0 ? 'Vencida' : d <= 30 ? 'Por Vencer' : 'Vigente'; };
  const BADGE_SUSC = { 'Vigente': 'success', 'Por Vencer': 'warning text-dark', 'Vencida': 'danger', 'Sin plan': 'secondary' };
  const BADGE_PAGO = { 'Pagada': 'success', 'Pendiente': 'secondary', 'Mora': 'danger', 'Anulada': 'dark' };
  const modal = id => bootstrap.Modal.getOrCreateInstance(document.getElementById(id));

  // Dígito de verificación del NIT (algoritmo DIAN)
  function calcularDV(nit) {
    const pr = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
    const d = String(nit).split('').reverse();
    const suma = d.reduce((a, n, i) => a + (+n) * pr[i], 0);
    const r = suma % 11;
    return String(r > 1 ? 11 - r : r);
  }
  const DV_DE = {}; // dígito de verificación tal como está guardado en la BD (por NIT sin DV)
  const nitFmt = n => `${n}-${DV_DE[n] ?? calcularDV(n)}`;

  /* ---------- Catálogo de módulos funcionales (códigos MOD-01 a MOD-15) ---------- */
  const MODULOS = ['Plataforma SaaS', 'Seguridad y Acceso', 'Gestión de Pacientes', 'Profesionales y Especialidades', 'Consultorios y Sedes',
    'Agenda Médica', 'Citas y Recepción', 'Atención Médica', 'Historia Clínica', 'Diagnósticos', 'Tratamientos y Prescripción',
    'Seguimiento y Controles', 'Notificaciones', 'Reportes y Estadísticas', 'Dashboard'].map((n, i) => ({ codigo: 'MOD-' + String(i + 1).padStart(2, '0'), nombre: n }));

  const UBICACIONES = {
    'Santander': ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'San Gil'],
    'Antioquia': ['Medellín', 'Envigado', 'Bello', 'Rionegro'],
    'Bogotá D.C.': ['Bogotá'],
    'Cundinamarca': ['Soacha', 'Chía', 'Zipaquirá'],
    'Valle del Cauca': ['Cali', 'Palmira', 'Tuluá'],
    'Atlántico': ['Barranquilla', 'Soledad'],
    'Bolívar': ['Cartagena', 'Magangué'],
    'Norte de Santander': ['Cúcuta', 'Pamplona']
  };

  /* ---------- Datos: llegan del servidor (controls/plataforma/*.php); ya no hay datos de ejemplo ---------- */
  const DB = { planes: [], instituciones: [], suscripciones: [], facturas: [] };
  const suscDe = idInst => DB.suscripciones.find(s => s.inst === idInst);
  const planDe = idPlan => DB.planes.find(p => p.id === idPlan);
  const instDe = id => DB.instituciones.find(i => i.id === id);
  const RUTA_INST = 'controls/plataforma/instituciones.php', RUTA_PLAN = 'controls/plataforma/planes_suscripciones.php';

  // Pide los datos al servidor y llena DB; si falla avisa y devuelve false
  async function cargarDatos(ruta) {
    const r = await SS.api(ruta);
    if (!r.ok) { SS.toast(r.mensaje || 'No fue posible cargar los datos.', 'danger'); return false; }
    DB.planes = r.datos.planes || []; DB.instituciones = r.datos.instituciones || [];
    DB.suscripciones = r.datos.suscripciones || []; DB.facturas = r.datos.facturas || [];
    DB.instituciones.forEach(i => { DV_DE[i.nit] = i.dv; });
    return true;
  }
  // Envía una acción de escritura (JSON + token CSRF, lo agrega SS.api) al controlador indicado
  const enviar = (ruta, cuerpo) => SS.api(ruta, { method: 'POST', body: cuerpo });

  /* =====================================================
     PANTALLA 1.1 · Directorio de instituciones
     ===================================================== */
  async function initInstituciones() {
    const tbody = $('#tablaInstituciones'); if (!tbody) return;
    const TAM = 5; let pagina = 1, pendiente = null;

    function filtrar() {
      const q = norm($('#buscador').value.trim()), qd = q.replace(/\D/g, '');
      const fe = $('#filtroEstado').value, fs = $('#filtroSusc').value;
      return DB.instituciones.filter(i => {
        const s = suscDe(i.id), es = s ? estadoSusc(s.corte) : 'Sin plan';
        const okQ = !q || norm(i.razon).includes(q) || (qd && (i.nit.includes(qd) || nitFmt(i.nit).replace(/\D/g, '').includes(qd)));
        return okQ && (!fe || i.estado === fe) && (!fs || es === fs);
      });
    }

    function kpis() {
      $('#kpiTotal').textContent = DB.instituciones.length;
      $('#kpiActivas').textContent = DB.instituciones.filter(i => i.estado === 'Activa').length;
      $('#kpiInactivas').textContent = DB.instituciones.filter(i => i.estado === 'Inactiva').length;
      $('#kpiAlertas').textContent = DB.instituciones.filter(i => { const s = suscDe(i.id); return s && estadoSusc(s.corte) !== 'Vigente'; }).length;
    }

    function render() {
      const lista = filtrar(), total = lista.length, paginas = Math.max(1, Math.ceil(total / TAM));
      if (pagina > paginas) pagina = paginas;
      const ini = (pagina - 1) * TAM, vista = lista.slice(ini, ini + TAM);

      tbody.innerHTML = vista.length ? vista.map(i => {
        const s = suscDe(i.id), p = s && planDe(s.plan), es = s ? estadoSusc(s.corte) : 'Sin plan';
        const activa = i.estado === 'Activa';
        return `<tr>
          <td><strong>${esc(i.razon)}</strong><span class="cell-sub">${esc(i.depto)}</span></td>
          <td>${esc(nitFmt(i.nit))}</td><td>${esc(i.reps)}</td><td>${esc(i.ciudad)}</td>
          <td>${p ? `<span class="badge bg-primary">${esc(p.nombre)}</span>` : '<span class="text-muted">—</span>'}</td>
          <td><span class="badge bg-${BADGE_SUSC[es]}">${es}</span>${s ? `<span class="cell-sub">Corte: ${fmt(s.corte)}</span>` : ''}</td>
          <td><span class="badge bg-${activa ? 'success' : 'secondary'}">${i.estado}</span></td>
          <td class="text-end text-nowrap">
            <button class="btn btn-sm btn-outline-primary" data-act="ver" data-id="${i.id}" title="Ver detalle">👁</button>
            <a class="btn btn-sm btn-outline-primary" href="registro_institucion.html?id=${i.id}" title="Editar institución">✏️</a>
            <button class="btn btn-sm ${activa ? 'btn-outline-danger' : 'btn-outline-success'}" data-act="estado" data-id="${i.id}" title="${activa ? 'Desactivar' : 'Activar'} institución">${activa ? '⏸' : '▶'}</button>
          </td></tr>`;
      }).join('') : '<tr><td colspan="8" class="text-center text-muted py-4">No se encontraron instituciones con los filtros aplicados.</td></tr>';

      $('#contador').textContent = total ? `Mostrando ${ini + 1}–${ini + vista.length} de ${total} instituciones` : 'Sin resultados';
      let pg = `<li class="page-item ${pagina === 1 ? 'disabled' : ''}"><button class="page-link" data-p="${pagina - 1}">«</button></li>`;
      for (let n = 1; n <= paginas; n++) pg += `<li class="page-item ${n === pagina ? 'active' : ''}"><button class="page-link" data-p="${n}">${n}</button></li>`;
      pg += `<li class="page-item ${pagina === paginas ? 'disabled' : ''}"><button class="page-link" data-p="${pagina + 1}">»</button></li>`;
      $('#paginacion').innerHTML = pg;
      kpis();
    }

    ['input', 'change'].forEach(ev => { $('#buscador').addEventListener(ev, () => { pagina = 1; render(); }); });
    $('#filtroEstado').addEventListener('change', () => { pagina = 1; render(); });
    $('#filtroSusc').addEventListener('change', () => { pagina = 1; render(); });
    $('#btnLimpiar').addEventListener('click', () => { $('#buscador').value = ''; $('#filtroEstado').value = ''; $('#filtroSusc').value = ''; pagina = 1; render(); });
    $('#paginacion').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b && !b.parentElement.classList.contains('disabled')) { pagina = +b.dataset.p; render(); } });

    tbody.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const inst = instDe(+b.dataset.id);
      if (b.dataset.act === 'estado') {
        pendiente = inst.id;
        const activar = inst.estado === 'Inactiva';
        $('#modalEstadoTitulo').textContent = activar ? 'Activar institución' : 'Desactivar institución';
        $('#modalEstadoCuerpo').innerHTML = activar
          ? `¿Desea activar <strong>${esc(inst.razon)}</strong>? Sus usuarios podrán ingresar nuevamente.`
          : `¿Desea desactivar <strong>${esc(inst.razon)}</strong>? <span class="text-danger">Se bloqueará de inmediato el acceso de todos sus usuarios</span>; los registros históricos se conservan.`;
        const bc = $('#btnConfirmarEstado'); bc.className = 'btn ' + (activar ? 'btn-success' : 'btn-danger');
        modal('modalEstado').show();
      } else {
        const s = suscDe(inst.id), p = s && planDe(s.plan);
        $('#detalleTitulo').textContent = inst.razon;
        $('#detalleCuerpo').innerHTML = `<div class="row g-3 small">
          <div class="col-md-6"><strong>NIT:</strong> ${esc(nitFmt(inst.nit))}</div>
          <div class="col-md-6"><strong>REPS:</strong> ${esc(inst.reps)}</div>
          <div class="col-md-6"><strong>Representante legal:</strong> ${esc(inst.rep_nombre)} (${esc(inst.rep_doc)})</div>
          <div class="col-md-6"><strong>Estado:</strong> ${esc(inst.estado)}</div>
          <div class="col-md-6"><strong>Ubicación:</strong> ${esc(inst.ciudad)}, ${esc(inst.depto)}</div>
          <div class="col-md-6"><strong>Dirección:</strong> ${esc(inst.direccion)}</div>
          <div class="col-md-6"><strong>Teléfono:</strong> ${esc(inst.tel || '—')}</div>
          <div class="col-md-6"><strong>Correo legal:</strong> ${esc(inst.correo)}</div>
          <div class="col-12"><strong>Plan:</strong> ${p ? esc(p.nombre) : 'Sin plan'} ${s ? `· Vigencia ${fmt(s.inicio)} → ${fmt(s.corte)}` : ''}</div>
          <div class="col-12"><strong>Servicios habilitados:</strong><br>${(inst.servicios || []).map(x => `<span class="chip">${esc(x)}</span>`).join('') || '—'}</div></div>`;
        modal('modalDetalle').show();
      }
    });

    $('#btnConfirmarEstado').addEventListener('click', async e => {
      const btn = e.currentTarget, unlock = SS.lock(btn, 'Aplicando…');
      const inst = instDe(pendiente), nuevo = inst.estado === 'Activa' ? 'Inactiva' : 'Activa';
      const r = await enviar(RUTA_INST, { accion: 'estado', id: inst.id, estado: nuevo });
      unlock(); modal('modalEstado').hide();
      if (!r.ok) { SS.toast(r.mensaje, 'danger'); return; }
      await cargarDatos(RUTA_INST + '?accion=listar'); render();
      SS.toast(`Institución ${nuevo === 'Activa' ? 'activada' : 'desactivada'} correctamente.`, nuevo === 'Activa' ? 'success' : 'secondary');
    });

    await cargarDatos(RUTA_INST + '?accion=listar');
    render();
  }

  /* =====================================================
     PANTALLA 1.2 · Registro / edición de institución
     ===================================================== */
  async function initRegistro() {
    const f = $('#formInstitucion'); if (!f) return;
    f.addEventListener('submit', e => e.preventDefault()); // evita el envío nativo mientras llegan los datos del servidor
    const editId = +new URLSearchParams(location.search).get('id') || null;
    const dep = $('#departamento'), ciu = $('#ciudad'), nitI = $('#nit'), repsI = $('#codigo_reps'), btn = $('#btnGuardar');

    dep.innerHTML = '<option value="">Seleccione…</option>' + Object.keys(UBICACIONES).map(d => `<option>${esc(d)}</option>`).join('');
    const llenarCiudades = sel => {
      ciu.innerHTML = '<option value="">Seleccione…</option>' + (UBICACIONES[dep.value] || []).map(c => `<option>${esc(c)}</option>`).join('');
      if (sel) ciu.value = sel;
    };
    dep.addEventListener('change', () => llenarCiudades());

    nitI.addEventListener('input', () => {
      nitI.value = nitI.value.replace(/\D/g, '');
      $('#dv').value = /^\d{8,10}$/.test(nitI.value) ? calcularDV(nitI.value) : '';
      validarUnicos();
    });
    repsI.addEventListener('input', validarUnicos);
    $('#rep_documento').addEventListener('input', e => e.target.value = e.target.value.replace(/\D/g, ''));
    $('#adm_documento').addEventListener('input', e => e.target.value = e.target.value.replace(/\D/g, ''));
    $$('input[name=servicios]').forEach(c => c.addEventListener('change', () => $('#errServicios').classList.toggle('d-none', $$('input[name=servicios]:checked').length > 0)));

    // Regla: NIT y REPS únicos en la base global
    function marcarDup(el, dup, msg, clave) {
      el.setCustomValidity(dup ? msg : '');
      const fb = $(`[data-fb="${clave}"]`); fb.textContent = dup ? msg : fb.dataset.default;
    }
    function validarUnicos() {
      const nit = nitI.value.trim(), reps = repsI.value.trim().toLowerCase();
      marcarDup(nitI, DB.instituciones.some(i => i.id !== editId && i.nit === nit), 'Este NIT ya está registrado en la plataforma.', 'nit');
      marcarDup(repsI, DB.instituciones.some(i => i.id !== editId && i.reps.toLowerCase() === reps), 'Este código REPS ya está registrado.', 'reps');
    }

    await cargarDatos(RUTA_INST + '?accion=listar'); // necesario para validar NIT/REPS únicos y para el modo edición

    // Modo edición (RF-PLA-01)
    if (editId && instDe(editId)) {
      const i = instDe(editId);
      $('#tituloForm').textContent = 'Modificar información de la institución';
      $('#crumbForm').textContent = 'Modificar';
      $('#subtituloForm').textContent = `Editando: ${i.razon}`;
      btn.innerHTML = '💾 Guardar cambios';
      $('#razon_social').value = i.razon; nitI.value = i.nit; $('#dv').value = DV_DE[i.nit] ?? calcularDV(i.nit); repsI.value = i.reps;
      $('#rep_nombre').value = i.rep_nombre; $('#rep_documento').value = i.rep_doc;
      dep.value = i.depto; llenarCiudades(i.ciudad);
      $('#direccion').value = i.direccion; $('#telefono').value = i.tel || ''; $('#correo_contacto').value = i.correo;
      $$('input[name=servicios]').forEach(c => c.checked = (i.servicios || []).includes(c.value));
      $$('[data-solo-alta]').forEach(c => { c.required = false; });
      $('#adm_nombre').closest('section').querySelector('.alert').textContent = 'El administrador principal se gestiona desde el módulo de Seguridad.';
    }

    f.addEventListener('reset', () => { f.classList.remove('was-validated'); $('#dv').value = ''; setTimeout(() => { llenarCiudades(); validarUnicos(); }, 0); });

    f.addEventListener('submit', async e => {
      e.preventDefault();
      if (btn.disabled) return;
      validarUnicos();
      // Los servicios no se guardan en la BD (no hay columna): al editar no se puede exigir volver a marcarlos
      const svcOk = editId ? true : $$('input[name=servicios]:checked').length > 0;
      $('#errServicios').classList.toggle('d-none', svcOk);
      f.classList.add('was-validated');
      if (!f.checkValidity() || !svcOk) {
        (f.querySelector(':invalid') || $('#errServicios')).scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      const unlock = SS.lock(btn, 'Guardando…');
      const datos = {
        accion: editId ? 'editar' : 'crear', id: editId,
        razon_social: $('#razon_social').value.trim(), nit: nitI.value.trim(), codigo_reps: repsI.value.trim(),
        rep_nombre: $('#rep_nombre').value.trim(), rep_documento: $('#rep_documento').value.trim(),
        departamento: dep.value, ciudad: ciu.value, direccion: $('#direccion').value.trim(),
        telefono: $('#telefono').value.trim(), correo_contacto: $('#correo_contacto').value.trim(),
        servicios: $$('input[name=servicios]:checked').map(c => c.value)
      };
      if (!editId) Object.assign(datos, { adm_nombre: $('#adm_nombre').value.trim(), adm_documento: $('#adm_documento').value.trim(), adm_correo: $('#adm_correo').value.trim() });
      const r = await enviar(RUTA_INST, datos);
      if (!r.ok) {
        unlock();
        const campo = r.datos && r.datos.campo;
        if (campo === 'nit') marcarDup(nitI, true, r.mensaje, 'nit');
        if (campo === 'reps') marcarDup(repsI, true, r.mensaje, 'reps');
        SS.toast(r.mensaje, 'danger');
        return;
      }
      if (editId) {
        SS.toast('Cambios guardados correctamente.');
        setTimeout(() => { location.href = 'instituciones.html'; }, 1400); // el botón permanece deshabilitado
        return;
      }
      unlock();                // quita el giro y devuelve el texto original del botón
      btn.disabled = true;     // pero sigue bloqueado: la institución ya se registró (evita un doble envío)
      f.addEventListener('input', () => { btn.disabled = false; }, { once: true }); // se libera si el usuario empieza otro registro
      // Alta: la clave temporal del administrador solo se muestra ahora (no se guarda en claro ni se envía por correo)
      const cred = r.datos.credenciales, caja = $('#credencialesAdmin');
      caja.textContent = '';
      const titulo = document.createElement('strong'); titulo.textContent = 'Institución registrada.';
      const linea = document.createElement('div');
      linea.textContent = `Administrador: ${cred.correo} · Clave temporal: ${cred.clave}`;
      const aviso = document.createElement('div'); aviso.className = 'small';
      aviso.textContent = 'Anótela ahora: no se vuelve a mostrar. Entréguela al administrador por un canal seguro.';
      const volver = document.createElement('a'); volver.href = 'instituciones.html'; volver.className = 'btn btn-sm btn-success mt-2'; volver.textContent = 'Ir al directorio';
      caja.append(titulo, linea, aviso, volver); caja.classList.remove('d-none');
      caja.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* =====================================================
     PANTALLA 1.3 · Planes y suscripciones
     ===================================================== */
  async function initPlanes() {
    const grid = $('#planesGrid'); if (!grid) return;
    let periodo = 'mensual', planEditando = null;

    function renderPlanes() {
      grid.innerHTML = DB.planes.map(p => {
        const destacado = p.nombre === 'Profesional', precio = periodo === 'mensual' ? p.tarifa : p.tarifa * 10;
        const n = DB.suscripciones.filter(s => s.plan === p.id).length;
        const mods = p.modulos.map(c => MODULOS.find(m => m.codigo === c)?.nombre).filter(Boolean);
        return `<div class="col-md-6 col-xl-4"><div class="plan-card ${destacado ? 'destacado' : ''} ${p.estado === 'Inactivo' ? 'inactivo' : ''}">
          ${destacado ? '<span class="plan-ribbon">Más popular</span>' : ''}
          <div class="d-flex justify-content-between align-items-start">
            <h2 class="h4 plan-nombre mb-0">${esc(p.nombre)}</h2>
            <span class="badge bg-${p.estado === 'Activo' ? 'success' : 'secondary'}">${p.estado}</span>
          </div>
          <div class="plan-precio mt-2">${COP(precio)} <small>/ ${periodo === 'mensual' ? 'mes' : 'año'}</small></div>
          <ul class="plan-list">
            <li>Hasta <strong>${p.medicos.toLocaleString('es-CO')}</strong> médicos</li>
            <li>Hasta <strong>${p.pacientes.toLocaleString('es-CO')}</strong> pacientes</li>
            <li><strong>${p.modulos.length}</strong> módulos funcionales</li>
            <li>${n} institución(es) suscrita(s)</li>
          </ul>
          <div class="mb-3">${mods.slice(0, 4).map(m => `<span class="chip">${esc(m)}</span>`).join('')}${mods.length > 4 ? `<span class="chip">+${mods.length - 4} más</span>` : ''}</div>
          <button class="btn btn-outline-primary w-100" data-plan="${p.id}">✏️ Editar plan</button>
        </div></div>`;
      }).join('');
    }

    function renderSusc() {
      const q = norm($('#buscaSusc').value.trim()), fe = $('#estadoSusc').value;
      const filas = DB.suscripciones.map(s => ({ s, i: instDe(s.inst), p: planDe(s.plan), es: estadoSusc(s.corte), d: diasPara(s.corte) }))
        .filter(x => x.i && (!q || norm(x.i.razon).includes(q)) && (!fe || x.es === fe))
        .sort((a, b) => a.d - b.d);
      $('#tablaSusc').innerHTML = filas.length ? filas.map(x => `<tr>
        <td><strong>${esc(x.i.razon)}</strong><span class="cell-sub">${esc(nitFmt(x.i.nit))}</span></td>
        <td><span class="badge bg-primary">${esc(x.p?.nombre || '—')}</span></td>
        <td>${fmt(x.s.inicio)}</td><td>${fmt(x.s.corte)}</td>
        <td>${x.d < 0 ? `<span class="text-danger">${Math.abs(x.d)} d vencida</span>` : x.d + ' d'}</td>
        <td><span class="badge bg-${BADGE_SUSC[x.es]}">${x.es}</span></td>
        <td class="text-end"><button class="btn btn-sm btn-outline-success" data-renovar="${x.s.inst}">🔄 Renovar / Cambiar</button></td></tr>`).join('')
        : '<tr><td colspan="7" class="text-center text-muted py-4">Sin suscripciones para mostrar.</td></tr>';

      const venc = DB.suscripciones.filter(s => estadoSusc(s.corte) === 'Por Vencer').length;
      const vencidas = DB.suscripciones.filter(s => estadoSusc(s.corte) === 'Vencida').length;
      $('#alertaVigencias').innerHTML = (venc || vencidas)
        ? `<div class="alert alert-warning d-flex align-items-center gap-2" role="alert">⚠️ <div><strong>Alertas de facturación y cobro:</strong> ${venc} suscripción(es) por vencer en los próximos 30 días y ${vencidas} vencida(s).</div></div>` : '';
    }

    function renderFact() {
      $('#tablaFact').innerHTML = DB.facturas.map(f => {
        const i = instDe(f.inst);
        return `<tr><td>${esc(f.numero)}</td><td>${esc(i?.razon || '—')}</td><td>${fmt(f.emision)}</td><td>${fmt(f.vence)}</td>
          <td class="text-end">${COP(f.total)}</td><td><span class="badge bg-${BADGE_PAGO[f.estado]}">${f.estado}</span></td></tr>`;
      }).join('');
    }

    $$('input[name=periodo]').forEach(r => r.addEventListener('change', () => { periodo = r.value; renderPlanes(); }));
    $('#buscaSusc').addEventListener('input', renderSusc);
    $('#estadoSusc').addEventListener('change', renderSusc);

    /* ---- Modal plan (RF-PLA-07 / 08) ---- */
    $('#planModulos').innerHTML = MODULOS.map(m => `<div class="col-sm-6"><div class="form-check">
      <input class="form-check-input" type="checkbox" value="${m.codigo}" id="chk_${m.codigo}"><label class="form-check-label small" for="chk_${m.codigo}">${m.codigo} · ${esc(m.nombre)}</label></div></div>`).join('');

    function abrirPlan(id) {
      planEditando = id; const p = id ? planDe(id) : { nombre: '', tarifa: '', medicos: '', pacientes: '', estado: 'Activo', modulos: [] };
      $('#formPlan').classList.remove('was-validated');
      $('#tituloPlan').textContent = id ? `Editar plan ${p.nombre}` : 'Nuevo plan comercial';
      $('#p_nombre').value = p.nombre; $('#p_tarifa').value = p.tarifa; $('#p_medicos').value = p.medicos; $('#p_pacientes').value = p.pacientes; $('#p_estado').value = p.estado;
      $$('#planModulos input').forEach(c => c.checked = p.modulos.includes(c.value));
      modal('modalPlan').show();
    }
    grid.addEventListener('click', e => { const b = e.target.closest('[data-plan]'); if (b) abrirPlan(+b.dataset.plan); });
    $('#btnNuevoPlan').addEventListener('click', () => abrirPlan(null));

    $('#formPlan').addEventListener('submit', async e => {
      e.preventDefault();
      const f = e.currentTarget, btn = $('#btnGuardarPlan'); if (btn.disabled) return;
      f.classList.add('was-validated'); if (!f.checkValidity()) return;
      const unlock = SS.lock(btn, 'Guardando…');
      const r = await enviar(RUTA_PLAN, {
        accion: 'guardar_plan', id: planEditando, nombre: $('#p_nombre').value.trim(), tarifa: +$('#p_tarifa').value,
        medicos: +$('#p_medicos').value, pacientes: +$('#p_pacientes').value, estado: $('#p_estado').value,
        modulos: $$('#planModulos input:checked').map(c => c.value)
      });
      unlock();
      if (!r.ok) { SS.toast(r.mensaje, 'danger'); return; }
      await cargarDatos(RUTA_PLAN + '?accion=cargar'); renderPlanes(); renderSusc(); renderFact(); modal('modalPlan').hide();
      SS.toast('Plan guardado correctamente.');
    });

    /* ---- Modal asociar institución a plan (RF-PLA-09 / 10) ---- */
    // Igual que el servidor: sin desbordar el mes (31 de enero + 1 mes = 28/29 de febrero)
    const sumarPeriodo = (inicio, per) => { const d = parse(inicio), dia = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + (per === 'anual' ? 12 : 1)); d.setDate(Math.min(dia, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); return iso(d); };
    function preview() {
      const ini = $('#a_inicio').value; if (!ini) { $('#a_preview').textContent = 'Seleccione la fecha de inicio para calcular el corte.'; return; }
      const corte = sumarPeriodo(ini, $('#a_period').value), d = parse(corte); d.setDate(d.getDate() - 5);
      $('#a_preview').innerHTML = `📅 <strong>Fecha de corte:</strong> ${fmt(corte)}<br>🔔 <strong>Alerta de cobro:</strong> ${fmt(iso(d))} (5 días antes)`;
    }
    function abrirAsociar(idInst) {
      $('#formAsociar').classList.remove('was-validated');
      $('#a_inst').innerHTML = '<option value="">Seleccione…</option>' + DB.instituciones.map(i => `<option value="${i.id}">${esc(i.razon)}</option>`).join('');
      $('#a_plan').innerHTML = '<option value="">Seleccione…</option>' + DB.planes.filter(p => p.estado === 'Activo').map(p => `<option value="${p.id}">${esc(p.nombre)} · ${COP(p.tarifa)}/mes</option>`).join('');
      $('#a_inicio').value = iso(HOY); $('#a_period').value = 'mensual';
      if (idInst) { $('#a_inst').value = idInst; const s = suscDe(idInst); if (s) $('#a_plan').value = s.plan; }
      preview(); modal('modalAsociar').show();
    }
    $('#btnAsociar').addEventListener('click', () => abrirAsociar());
    $('#tablaSusc').addEventListener('click', e => { const b = e.target.closest('[data-renovar]'); if (b) abrirAsociar(+b.dataset.renovar); });
    $('#a_inicio').addEventListener('input', preview); $('#a_period').addEventListener('change', preview);

    $('#formAsociar').addEventListener('submit', async e => {
      e.preventDefault();
      const f = e.currentTarget, btn = $('#btnGuardarAsoc'); if (btn.disabled) return;
      f.classList.add('was-validated'); if (!f.checkValidity()) return;
      const unlock = SS.lock(btn, 'Registrando…');
      const r = await enviar(RUTA_PLAN, { accion: 'asociar', inst: +$('#a_inst').value, plan: +$('#a_plan').value, inicio: $('#a_inicio').value, periodo: $('#a_period').value });
      unlock();
      if (!r.ok) { SS.toast(r.mensaje, 'danger'); return; }
      await cargarDatos(RUTA_PLAN + '?accion=cargar'); renderPlanes(); renderSusc(); renderFact(); modal('modalAsociar').hide();
      SS.toast(`Suscripción registrada. Fecha de corte: ${fmt(r.datos.suscripcion.corte)}. Factura ${r.datos.factura.numero} generada por ${COP(r.datos.factura.total)}.`);
    });

    await cargarDatos(RUTA_PLAN + '?accion=cargar');
    renderPlanes(); renderSusc(); renderFact();
  }

  document.addEventListener('DOMContentLoaded', () => { initInstituciones(); initRegistro(); initPlanes(); });
})();