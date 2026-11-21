/* ===== SaludSync · Módulo 5: Consultorios y Sedes Físicas (mockup interactivo, sin backend) ===== */
(function () {
  'use strict';

  /* ---------- Utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const pad = n => String(n).padStart(2, '0');
  const ahora = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const modal = id => bootstrap.Modal.getOrCreateInstance(document.getElementById(id));
  const hl = (t, q) => { if (!q) return esc(t); const i = norm(t).indexOf(q); return i < 0 ? esc(t) : esc(t.slice(0, i)) + '<mark class="hl">' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length)); };
  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const hh = h => pad(h) + ':00';
  const BADGE_EST = { 'Habilitado': 'success', 'En Mantenimiento': 'warning text-dark', 'Inactivo': 'secondary' };
  const TIPO_ICO = { 'Consulta Externa': '🩺', 'Procedimientos': '💉', 'Odontología': '🦷' };

  /* ---------- Institución, sesión y auditoría (integración con otros módulos) ---------- */
  function instActiva() {
    let id = 1;
    try {
      const s = JSON.parse(sessionStorage.getItem('saludsync_sesion')), m2 = JSON.parse(sessionStorage.getItem('saludsync_modulo2_v1'));
      const u = m2 && s && m2.usuarios.find(x => x.id === s.id); if (u && u.inst) id = u.inst;
    } catch (e) { }
    const nombres = { 1: 'Clínica Santa Lucía S.A.S.', 2: 'IPS Vida Plena Ltda.', 3: 'Centro Médico Los Andes', 5: 'Salud Integral del Caribe IPS' };
    return { id, nombre: nombres[id] || 'Institución #' + id };
  }
  const INST = instActiva();
  function auditar(tabla, registro, accion, ant, nuevo) {
    try {
      const m2 = JSON.parse(sessionStorage.getItem('saludsync_modulo2_v1')); if (!m2 || !m2.auditoria) return;
      const s = JSON.parse(sessionStorage.getItem('saludsync_sesion'));
      m2.auditoria.unshift({ id: Math.max(0, ...m2.auditoria.map(a => a.id)) + 1, usuario: s ? `${s.nombre} (${s.rol})` : 'Usuario del sistema', tabla, registro, accion, ant, nuevo, ip: '192.168.1.10', fecha: ahora() });
      sessionStorage.setItem('saludsync_modulo2_v1', JSON.stringify(m2));
    } catch (e) { }
  }

  // Profesionales activos: se leen del Módulo 4 si existe en la sesión
  const corto = (n, a) => `${n.split(' ')[0]} ${a.split(' ')[0]}`;
  const PROF_SEED = [[1, 'Andrés', 'Navarro'], [2, 'Paula', 'Rueda'], [3, 'Mauricio', 'Ariza'], [4, 'Liliana', 'Cortés'], [5, 'Iván', 'Suárez'],
    [6, 'Marcela', 'Quintero'], [7, 'Camilo', 'Ortega'], [9, 'Sofía', 'Bermúdez'], [10, 'Diana', 'Cifuentes']].map(([id, n, a]) => ({ id, nombre: `${n} ${a}` }));
  function profesionales() {
    try { const m4 = JSON.parse(sessionStorage.getItem('saludsync_modulo4_v1')); if (m4 && m4.profesionales) return m4.profesionales.filter(p => p.estado === 'Activo').map(p => ({ id: p.id, nombre: corto(p.nombres, p.apellidos) })); } catch (e) { }
    return PROF_SEED;
  }
  const nombreProf = id => (PROF_SEED.find(p => p.id === id) || profesionales().find(p => p.id === id) || { nombre: 'Profesional #' + id }).nombre;

  /* ---------- Datos de ejemplo (sede, consultorio, disponibilidad_consultorio, turnos de agenda_medica) ---------- */
  const SEDES = [
    { id: 1, nombre: 'Sede Principal', ciudad: 'Bucaramanga', direccion: 'Calle 45 # 27-10', telefono: '607 645 1000', estado: 'Activa' },
    { id: 2, nombre: 'Sede Cabecera', ciudad: 'Bucaramanga', direccion: 'Carrera 35 # 52-18', telefono: '607 645 2000', estado: 'Activa' },
    { id: 3, nombre: 'Sede Floridablanca', ciudad: 'Floridablanca', direccion: 'Calle 5 # 8-40', telefono: '607 619 3000', estado: 'Activa' }
  ];
  const C = (id, sede, codigo, nombre, tipo, piso, estado) => ({ id, sede, codigo, nombre, tipo, piso, estado });
  const SEED_CONS = [
    C(1, 1, 'C-101', 'Consulta Externa 1', 'Consulta Externa', 'Piso 1 · Bloque A', 'Habilitado'),
    C(2, 1, 'C-102', 'Consulta Externa 2', 'Consulta Externa', 'Piso 1 · Bloque A', 'Habilitado'),
    C(3, 1, 'C-103', 'Odontología 1', 'Odontología', 'Piso 1 · Bloque B', 'Habilitado'),
    C(4, 1, 'C-201', 'Sala de Procedimientos', 'Procedimientos', 'Piso 2 · Bloque A', 'Habilitado'),
    C(5, 1, 'C-202', 'Consulta Especializada', 'Consulta Externa', 'Piso 2 · Bloque A', 'Habilitado'),
    C(6, 2, 'C-101', 'Consulta Externa 1', 'Consulta Externa', 'Piso 1', 'Habilitado'),
    C(7, 2, 'C-102', 'Odontología 1', 'Odontología', 'Piso 1', 'Habilitado'),
    C(8, 2, 'C-103', 'Sala de Curaciones', 'Procedimientos', 'Piso 1', 'En Mantenimiento'),
    C(9, 3, 'C-101', 'Consulta Externa 1', 'Consulta Externa', 'Piso 1', 'Habilitado'),
    C(10, 3, 'C-102', 'Consulta Pediátrica', 'Consulta Externa', 'Piso 1', 'Habilitado'),
    C(11, 3, 'C-103', 'Consulta Externa 3', 'Consulta Externa', 'Piso 2', 'Inactivo')
  ];
  function seedDisp() {
    const out = []; let id = 1;
    SEED_CONS.filter(c => c.estado !== 'Inactivo').forEach(c => {
      DIAS.slice(0, 5).forEach(d => out.push({ id: id++, c: c.id, dia: d, apertura: '07:00', cierre: '18:00' }));
      if ([1, 3, 6, 9].includes(c.id)) out.push({ id: id++, c: c.id, dia: 'Sábado', apertura: '08:00', cierre: '13:00' });
    });
    return out;
  }
  function seedTurnos() {
    const out = []; let id = 1;
    const T = (c, dias, ini, fin, prof) => dias.forEach(d => out.push({ id: id++, c, dia: d, inicio: ini, fin, prof, profNombre: nombreProf(prof) }));
    const LV = DIAS.slice(0, 5);
    T(1, LV, '07:00', '12:00', 1); T(1, ['Lunes', 'Miércoles', 'Viernes'], '14:00', '18:00', 6); T(1, ['Sábado'], '08:00', '13:00', 1);
    T(2, ['Martes', 'Jueves'], '08:00', '17:00', 2); T(2, ['Lunes'], '14:00', '18:00', 9);
    T(3, LV, '08:00', '16:00', 5); T(3, ['Sábado'], '08:00', '12:00', 5);
    T(4, ['Miércoles'], '09:00', '13:00', 3); T(4, ['Jueves'], '14:00', '18:00', 3);
    T(5, ['Lunes', 'Martes', 'Jueves'], '14:00', '18:00', 4); T(5, ['Miércoles'], '14:00', '18:00', 10);
    T(6, LV, '08:00', '12:00', 7);
    T(9, ['Lunes', 'Miércoles', 'Viernes'], '08:00', '13:00', 9);
    T(10, ['Martes', 'Jueves'], '14:00', '18:00', 6);
    return out;
  }
  const KEY = 'saludsync_modulo5_v1';
  const DB = (() => { try { const s = JSON.parse(sessionStorage.getItem(KEY)); if (s && s.consultorios) return s; } catch (e) { } return { consultorios: JSON.parse(JSON.stringify(SEED_CONS)), disponibilidad: seedDisp(), turnos: seedTurnos() }; })();
  const guardar = () => { try { sessionStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } };
  const consDe = id => DB.consultorios.find(c => c.id === id);
  const sedeDe = id => SEDES.find(s => s.id === id);
  const dispDe = (c, d) => DB.disponibilidad.find(x => x.c === c && x.dia === d);
  const turnosDe = (c, d) => DB.turnos.filter(t => t.c === c && (!d || t.dia === d));
  const horasAbiertas = c => DB.disponibilidad.filter(x => x.c === c).reduce((a, x) => a + (toMin(x.cierre) - toMin(x.apertura)) / 60, 0);
  const horasAsignadas = c => DB.turnos.filter(t => t.c === c).reduce((a, t) => a + (toMin(t.fin) - toMin(t.inicio)) / 60, 0);
  const setInst = () => $$('[data-inst-nombre]').forEach(e => e.textContent = INST.nombre);

  /* =====================================================
     PANTALLA 5.1 · Directorio de consultorios
     ===================================================== */
  function initDirectorio() {
    const tbody = $('#tablaCons'); if (!tbody) return;
    const f = $('#formCons'), btn = $('#btnGuardarCons'), TAM = 6; let editId = null, pagina = 1, pendiente = null;
    const opcSedes = SEDES.map(s => `<option value="${s.id}">${esc(s.nombre)}</option>`).join('');
    $('#c_sede').innerHTML += opcSedes; $('#filtroSede').innerHTML += opcSedes;

    function validarUnico() {
      const cod = $('#c_codigo').value.trim().toUpperCase(), sede = +$('#c_sede').value, el = $('#c_codigo'), fb = $('[data-fb="codigo"]');
      const dup = !!cod && !!sede && DB.consultorios.some(c => c.id !== editId && c.sede === sede && c.codigo.toUpperCase() === cod);
      el.setCustomValidity(dup ? 'dup' : ''); fb.textContent = dup ? 'Este código ya existe en la sede seleccionada.' : fb.dataset.default;
    }
    $('#c_codigo').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, ''); validarUnico(); });
    $('#c_sede').addEventListener('change', validarUnico);

    function salirEdicion() {
      editId = null; f.reset(); f.classList.remove('was-validated');
      $('#tituloCons').textContent = '➕ Nuevo consultorio'; $('#btnCancelarCons').classList.add('d-none'); validarUnico(); render();
    }
    $('#btnCancelarCons').addEventListener('click', salirEdicion);

    function filtrar() {
      const q = norm($('#buscaCons').value.trim()), fs = $('#filtroSede').value, ft = $('#filtroTipo').value, fe = $('#filtroEstadoC').value;
      return DB.consultorios.filter(c => (!q || norm(c.codigo).includes(q) || norm(c.nombre).includes(q)) && (!fs || c.sede === +fs) && (!ft || c.tipo === ft) && (!fe || c.estado === fe));
    }

    function render() {
      const q = norm($('#buscaCons').value.trim()), lista = filtrar(), total = lista.length, paginas = Math.max(1, Math.ceil(total / TAM));
      if (pagina > paginas) pagina = paginas;
      const ini = (pagina - 1) * TAM, vista = lista.slice(ini, ini + TAM);
      tbody.innerHTML = vista.length ? vista.map(c => {
        const h = horasAbiertas(c.id), n = turnosDe(c.id).length;
        return `<tr class="${c.id === editId ? 'row-editando' : ''}">
          <td><span class="codigo-cons">${hl(c.codigo, q)}</span></td>
          <td><strong>${hl(c.nombre, q)}</strong><span class="cell-sub">${esc(c.piso || '—')}</span></td>
          <td>${esc(sedeDe(c.sede).nombre)}<span class="cell-sub">${esc(sedeDe(c.sede).ciudad)}</span></td>
          <td><span class="tipo-chip">${TIPO_ICO[c.tipo]} ${esc(c.tipo)}</span></td>
          <td>${h ? `${h} h abiertas` : '<span class="text-muted">Sin horario</span>'}<span class="cell-sub">${n} turno${n === 1 ? '' : 's'} asignado${n === 1 ? '' : 's'}</span></td>
          <td><span class="badge bg-${BADGE_EST[c.estado]}">${c.estado}</span></td>
          <td class="text-end text-nowrap">
            <a class="btn btn-sm btn-outline-primary" href="matriz_ocupacion.html?c=${c.id}" title="Ver disponibilidad">🗓️</a>
            <button class="btn btn-sm btn-outline-primary" data-act="editar" data-id="${c.id}" title="Editar consultorio">✏️</button>
            <button class="btn btn-sm btn-outline-secondary" data-act="estado" data-id="${c.id}" title="Cambiar estado">🔁</button>
          </td></tr>`;
      }).join('') : '<tr><td colspan="7" class="text-center text-muted py-4">No se encontraron consultorios con los filtros aplicados.</td></tr>';
      $('#contador').textContent = total ? `Mostrando ${ini + 1}–${ini + vista.length} de ${total} consultorios` : 'Sin resultados';
      let pg = `<li class="page-item ${pagina === 1 ? 'disabled' : ''}"><button class="page-link" data-p="${pagina - 1}">«</button></li>`;
      for (let n = 1; n <= paginas; n++) pg += `<li class="page-item ${n === pagina ? 'active' : ''}"><button class="page-link" data-p="${n}">${n}</button></li>`;
      pg += `<li class="page-item ${pagina === paginas ? 'disabled' : ''}"><button class="page-link" data-p="${pagina + 1}">»</button></li>`;
      $('#paginacion').innerHTML = pg;
      $('#kpiTotal').textContent = DB.consultorios.length;
      $('#kpiHab').textContent = DB.consultorios.filter(c => c.estado === 'Habilitado').length;
      $('#kpiMant').textContent = DB.consultorios.filter(c => c.estado === 'En Mantenimiento').length;
      $('#kpiInact').textContent = DB.consultorios.filter(c => c.estado === 'Inactivo').length;
    }
    ['input', 'change'].forEach(ev => ['buscaCons', 'filtroSede', 'filtroTipo', 'filtroEstadoC'].forEach(id => $('#' + id).addEventListener(ev, () => { pagina = 1; render(); })));
    $('#paginacion').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b && !b.parentElement.classList.contains('disabled')) { pagina = +b.dataset.p; render(); } });

    tbody.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const c = consDe(+b.dataset.id);
      if (b.dataset.act === 'editar') {
        editId = c.id; f.classList.remove('was-validated');
        $('#c_sede').value = c.sede; $('#c_codigo').value = c.codigo; $('#c_nombre').value = c.nombre; $('#c_tipo').value = c.tipo; $('#c_piso').value = c.piso || ''; $('#c_estado').value = c.estado;
        $('#tituloCons').textContent = '✏️ Editar consultorio'; $('#btnCancelarCons').classList.remove('d-none');
        validarUnico(); render(); $('#c_nombre').focus();
      } else {
        pendiente = c.id; const n = turnosDe(c.id).length;
        $('#estadoConsInfo').innerHTML = `<strong>${esc(c.codigo)} · ${esc(c.nombre)}</strong> (${esc(sedeDe(c.sede).nombre)}) · Estado actual: <span class="badge bg-${BADGE_EST[c.estado]}">${c.estado}</span>`;
        $$('input[name=nuevoEstado]').forEach(r => r.checked = r.value === c.estado);
        const av = $('#avisoTurnos'); av.classList.toggle('d-none', !n);
        av.textContent = `Este consultorio tiene ${n} turno(s) asignado(s). Si no está Habilitado, los turnos quedan bloqueados y no se podrán agendar citas en él.`;
        modal('modalEstado').show();
      }
    });

    $('#btnConfirmarEstado').addEventListener('click', e => {
      const nuevo = ($('input[name=nuevoEstado]:checked') || {}).value, c = consDe(pendiente); if (!nuevo) return;
      if (nuevo === c.estado) { modal('modalEstado').hide(); return SS.toast('El estado no cambió.', 'secondary'); }
      const unlock = SS.lock(e.currentTarget, 'Aplicando…');
      setTimeout(() => {
        const ant = c.estado; c.estado = nuevo;
        auditar('consultorio', c.id, 'Modificación', { estado: ant }, { estado: nuevo });
        guardar(); render(); modal('modalEstado').hide(); unlock();
        SS.toast(`${c.codigo} ahora está ${nuevo.toLowerCase()}.`, nuevo === 'Habilitado' ? 'success' : 'secondary');
      }, 700);
    });

    f.addEventListener('submit', e => {
      e.preventDefault(); if (btn.disabled) return;
      validarUnico(); f.classList.add('was-validated'); if (!f.checkValidity()) return;
      const unlock = SS.lock(btn, 'Guardando…');
      setTimeout(() => {
        const d = { sede: +$('#c_sede').value, codigo: $('#c_codigo').value.trim().toUpperCase(), nombre: $('#c_nombre').value.trim(), tipo: $('#c_tipo').value, piso: $('#c_piso').value.trim(), estado: $('#c_estado').value };
        const edit = !!editId;
        if (edit) { const c = consDe(editId); auditar('consultorio', editId, 'Modificación', { codigo: c.codigo, estado: c.estado }, { codigo: d.codigo, estado: d.estado }); Object.assign(c, d); }
        else { const id = Math.max(0, ...DB.consultorios.map(c => c.id)) + 1; DB.consultorios.push({ id, ...d }); auditar('consultorio', id, 'Creación', null, { codigo: d.codigo, sede: d.sede }); }
        guardar(); salirEdicion(); unlock();
        SS.toast(edit ? 'Consultorio actualizado correctamente.' : 'Consultorio registrado. Configure su disponibilidad en la matriz de ocupación.');
      }, 800);
    });
    render();
  }

  /* =====================================================
     PANTALLA 5.2 · Matriz de disponibilidad y ocupación
     ===================================================== */
  function initMatriz() {
    if (document.body.dataset.page !== 'matriz_ocupacion') return;
    let sede = 1, sel = null, turnoSel = null;
    const opcHoras = (a, b, sufijo) => { let o = ''; for (let h = a; h <= b; h++) o += `<option value="${hh(h)}">${hh(h)}</option>`; return o; };

    // Selección inicial (parámetro ?c=)
    const pc = +new URLSearchParams(location.search).get('c');
    if (pc && consDe(pc)) { sel = pc; sede = consDe(pc).sede; }
    $('#selSede').innerHTML = SEDES.map(s => `<option value="${s.id}">${esc(s.nombre)}</option>`).join('');

    function llenarConsultorios() {
      const lista = DB.consultorios.filter(c => c.sede === sede);
      if (!lista.some(c => c.id === sel)) sel = (lista.find(c => c.estado === 'Habilitado') || lista[0] || {}).id || null;
      $('#selCons').innerHTML = lista.map(c => `<option value="${c.id}">${esc(c.codigo)} · ${esc(c.nombre)} (${c.estado})</option>`).join('');
      if (sel) $('#selCons').value = sel;
    }

    /* ---- Resumen ---- */
    const pctDia = (c, d) => {
      const dp = dispDe(c, d); if (!dp) return null;
      const ab = toMin(dp.cierre) - toMin(dp.apertura);
      const oc = turnosDe(c, d).reduce((a, t) => a + Math.max(0, Math.min(toMin(t.fin), toMin(dp.cierre)) - Math.max(toMin(t.inicio), toMin(dp.apertura))), 0);
      return Math.round(oc / ab * 100);
    };
    function renderResumen() {
      $('#occHead').innerHTML = '<tr><th class="text-start">Consultorio</th>' + DIAS.map(d => `<th>${d.slice(0, 3)}</th>`).join('') + '</tr>';
      $('#occBody').innerHTML = DB.consultorios.filter(c => c.sede === sede).map(c => `<tr class="${c.id === sel ? 'sel-row' : ''}">
        <td class="text-start"><strong>${esc(c.codigo)}</strong> <span class="text-muted">${esc(c.nombre)}</span></td>` + DIAS.map(d => {
        if (c.estado === 'Inactivo') return `<td class="occ occ-off" data-c="${c.id}" data-dia="${d}">Inactivo</td>`;
        if (c.estado === 'En Mantenimiento') return `<td class="occ occ-mant" data-c="${c.id}" data-dia="${d}">Mant.</td>`;
        const p = pctDia(c.id, d);
        if (p === null) return `<td class="occ occ-off" data-c="${c.id}" data-dia="${d}">Cerrado</td>`;
        const cls = p === 0 ? 'occ-0' : p < 50 ? 'occ-lo' : p < 90 ? 'occ-mid' : 'occ-hi';
        return `<td class="occ ${cls}" data-c="${c.id}" data-dia="${d}" title="${p}% ocupado">${p}%</td>`;
      }).join('') + '</tr>').join('');
    }

    /* ---- Grilla semanal ---- */
    function celda(c, d, h) {
      const min = h * 60, base = `data-dia="${d}" data-hora="${h}"`;
      if (c.estado === 'Inactivo') return `<td class="cel cel-inactivo" ${base}></td>`;
      if (c.estado === 'En Mantenimiento') return `<td class="cel cel-mant" ${base}></td>`;
      const dp = dispDe(c.id, d);
      if (!dp || min < toMin(dp.apertura) || min >= toMin(dp.cierre)) return `<td class="cel cel-cerrado" title="Fuera del horario de apertura" ${base}></td>`;
      const t = turnosDe(c.id, d).find(x => toMin(x.inicio) < min + 60 && toMin(x.fin) > min);
      if (t) {
        const primera = Math.floor(toMin(t.inicio) / 60) * 60 === min;
        return `<td class="cel cel-turno p${t.prof % 8}" data-turno="${t.id}" ${base} title="${esc(t.profNombre)} ${t.inicio}–${t.fin}">${primera ? `<strong>${esc(t.profNombre)}</strong><small>${t.inicio}–${t.fin}</small>` : ''}</td>`;
      }
      return `<td class="cel cel-libre" ${base} title="Libre · clic para asignar">＋</td>`;
    }
    function renderGrid() {
      const c = consDe(sel); if (!c) { $('#gridBody').innerHTML = ''; return; }
      $('#gridHead').innerHTML = '<tr><th class="hora-col">Hora</th>' + DIAS.map(d => { const dp = dispDe(c.id, d); return `<th>${d}<small>${dp ? dp.apertura + '–' + dp.cierre : 'Cerrado'}</small></th>`; }).join('') + '</tr>';
      let body = ''; for (let h = 6; h < 20; h++) body += `<tr><th class="hora-col">${hh(h)}</th>${DIAS.map(d => celda(c, d, h)).join('')}</tr>`;
      $('#gridBody').innerHTML = body;

      const ha = horasAbiertas(c.id), hs = horasAsignadas(c.id);
      $('#kpisCons').innerHTML = [['Horas abiertas / semana', ha + ' h'], ['Horas asignadas', hs + ' h'], ['Ocupación', ha ? Math.round(hs / ha * 100) + ' %' : '—'], ['Turnos asignados', turnosDe(c.id).length]]
        .map(([l, v]) => `<div class="col-6 col-lg-3"><div class="kpi"><div class="kpi-num">${v}</div><div class="kpi-lbl">${l}</div></div></div>`).join('');
      const bloq = c.estado !== 'Habilitado';
      $('#alertaEstado').innerHTML = bloq ? `<div class="alert alert-warning">${c.estado === 'En Mantenimiento' ? '🔧' : '⛔'} <strong>${esc(c.codigo)}</strong> está <strong>${c.estado.toLowerCase()}</strong>: la grilla está bloqueada y no admite nuevas asignaciones.</div>` : '';
      $('#btnAsignar').disabled = bloq;
    }
    function renderTodo() { renderResumen(); renderGrid(); }

    $('#selSede').addEventListener('change', e => { sede = +e.target.value; llenarConsultorios(); renderTodo(); });
    $('#selCons').addEventListener('change', e => { sel = +e.target.value; renderTodo(); });
    $('#occBody').addEventListener('click', e => { const td = e.target.closest('td.occ'); if (!td) return; sel = +td.dataset.c; $('#selCons').value = sel; renderTodo(); $('#kpisCons').scrollIntoView({ behavior: 'smooth', block: 'start' }); });

    /* ---- Validación de turnos (RF-CON-05: evitar duplicidad de uso físico) ---- */
    const solapa = (a, b) => toMin(a.inicio) < toMin(b.fin) && toMin(b.inicio) < toMin(a.fin);
    function validarTurno(t) {
      const errs = [], c = consDe(t.c);
      if (c.estado !== 'Habilitado') errs.push(`El consultorio está ${c.estado.toLowerCase()}.`);
      if (toMin(t.fin) <= toMin(t.inicio)) { errs.push('La hora de fin debe ser posterior a la de inicio.'); return errs; }
      const dp = dispDe(t.c, t.dia);
      if (!dp || toMin(t.inicio) < toMin(dp.apertura) || toMin(t.fin) > toMin(dp.cierre)) errs.push(`El turno debe estar dentro del horario de apertura (${dp ? dp.apertura + '–' + dp.cierre : 'consultorio cerrado ese día'}).`);
      DB.turnos.filter(x => x.dia === t.dia && solapa(x, t)).forEach(x => {
        if (x.c === t.c) errs.push(`Ya hay un turno en este consultorio: ${x.profNombre} de ${x.inicio} a ${x.fin}.`);
        else if (x.prof === t.prof) { const cx = consDe(x.c); errs.push(`${x.profNombre} ya está asignado a ${cx.codigo} (${sedeDe(cx.sede).nombre}) de ${x.inicio} a ${x.fin}.`); }
      });
      return errs;
    }

    /* ---- Asignar profesional ---- */
    $('#as_dia').innerHTML = DIAS.map(d => `<option>${d}</option>`).join('');
    $('#as_ini').innerHTML = opcHoras(6, 19); $('#as_fin').innerHTML = opcHoras(7, 20);
    function abrirAsignar(dia, hora) {
      const c = consDe(sel); if (!c || c.estado !== 'Habilitado') return;
      $('#formAsignar').classList.remove('was-validated'); $('#asErrores').classList.add('d-none');
      $('#asCons').textContent = `${c.codigo} · ${c.nombre} (${sedeDe(c.sede).nombre})`;
      $('#as_prof').innerHTML = '<option value="">Seleccione…</option>' + profesionales().map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('');
      $('#as_dia').value = dia || 'Lunes'; const h = hora || 8; $('#as_ini').value = hh(h); $('#as_fin').value = hh(Math.min(h + 1, 20));
      modal('modalAsignar').show();
    }
    $('#btnAsignar').addEventListener('click', () => abrirAsignar());
    $('#formAsignar').addEventListener('submit', e => {
      e.preventDefault(); const btn = $('#btnGuardarTurno'); if (btn.disabled) return;
      e.currentTarget.classList.add('was-validated'); if (!e.currentTarget.checkValidity()) return;
      const t = { c: sel, dia: $('#as_dia').value, inicio: $('#as_ini').value, fin: $('#as_fin').value, prof: +$('#as_prof').value };
      const errs = validarTurno(t), box = $('#asErrores');
      if (errs.length) { box.innerHTML = '⛔ ' + errs.map(esc).join('<br>⛔ '); box.classList.remove('d-none'); return; }
      box.classList.add('d-none');
      const unlock = SS.lock(btn, 'Asignando…');
      setTimeout(() => {
        const id = Math.max(0, ...DB.turnos.map(x => x.id)) + 1, nombre = ($('#as_prof').selectedOptions[0] || {}).textContent || nombreProf(t.prof);
        DB.turnos.push({ id, ...t, profNombre: nombre });
        auditar('agenda_medica', id, 'Creación', null, { consultorio: consDe(sel).codigo, dia: t.dia, horario: `${t.inicio}-${t.fin}` });
        guardar(); renderTodo(); modal('modalAsignar').hide(); unlock(); SS.toast('Turno asignado correctamente.');
      }, 700);
    });

    /* ---- Clic en la grilla ---- */
    $('#gridBody').addEventListener('click', e => {
      const td = e.target.closest('td.cel'); if (!td) return;
      if (td.classList.contains('cel-libre')) abrirAsignar(td.dataset.dia, +td.dataset.hora);
      else if (td.classList.contains('cel-turno')) {
        const t = DB.turnos.find(x => x.id === +td.dataset.turno); turnoSel = t.id; const c = consDe(t.c);
        $('#turnoCuerpo').innerHTML = `<dl class="row mb-0 small"><dt class="col-4">Profesional</dt><dd class="col-8">${esc(t.profNombre)}</dd>
          <dt class="col-4">Consultorio</dt><dd class="col-8">${esc(c.codigo)} · ${esc(c.nombre)}</dd><dt class="col-4">Sede</dt><dd class="col-8">${esc(sedeDe(c.sede).nombre)}</dd>
          <dt class="col-4">Día</dt><dd class="col-8">${t.dia}</dd><dt class="col-4">Horario</dt><dd class="col-8">${t.inicio} – ${t.fin}</dd></dl>`;
        modal('modalTurno').show();
      }
    });
    $('#btnLiberar').addEventListener('click', e => {
      const unlock = SS.lock(e.currentTarget, 'Liberando…');
      setTimeout(() => {
        const t = DB.turnos.find(x => x.id === turnoSel);
        DB.turnos = DB.turnos.filter(x => x.id !== turnoSel);
        auditar('agenda_medica', turnoSel, 'Modificación', { estado: 'Asignado', horario: `${t.inicio}-${t.fin}` }, { estado: 'Liberado' });
        guardar(); renderTodo(); modal('modalTurno').hide(); unlock(); SS.toast('Turno liberado.', 'secondary');
      }, 600);
    });

    /* ---- Configurar franja (disponibilidad_consultorio) ---- */
    $('#fr_ap').innerHTML = opcHoras(6, 19); $('#fr_ci').innerHTML = opcHoras(7, 20);
    $('#frDias').innerHTML = DIAS.map((d, i) => `<div class="form-check form-check-inline dia-check"><input class="form-check-input fr-dia" type="checkbox" value="${d}" id="frd${i}"><label class="form-check-label" for="frd${i}">${d.slice(0, 3)}</label></div>`).join('');
    $('#fr_cerrado').addEventListener('change', e => { $('#fr_ap').disabled = $('#fr_ci').disabled = e.target.checked; });
    $('#btnFranja').addEventListener('click', () => {
      $('#frErrores').classList.add('d-none'); $('#fr_cerrado').checked = false; $('#fr_ap').disabled = $('#fr_ci').disabled = false;
      $('#fr_cons').innerHTML = DB.consultorios.filter(c => c.sede === sede).map(c => `<option value="${c.id}">${esc(c.codigo)} · ${esc(c.nombre)}</option>`).join('');
      $('#fr_cons').value = sel; $('#fr_ap').value = '07:00'; $('#fr_ci').value = '18:00';
      $$('.fr-dia').forEach(c => c.checked = DIAS.slice(0, 5).includes(c.value));
      modal('modalFranja').show();
    });
    $('#formFranja').addEventListener('submit', e => {
      e.preventDefault(); const btn = $('#btnGuardarFranja'); if (btn.disabled) return;
      const c = +$('#fr_cons').value, dias = $$('.fr-dia:checked').map(x => x.value), cerrar = $('#fr_cerrado').checked, ap = $('#fr_ap').value, ci = $('#fr_ci').value, errs = [];
      if (!dias.length) errs.push('Seleccione al menos un día.');
      if (!cerrar && toMin(ci) <= toMin(ap)) errs.push('La hora de cierre debe ser posterior a la de apertura.');
      if (!errs.length) dias.forEach(d => turnosDe(c, d).forEach(t => {
        if (cerrar || toMin(t.inicio) < toMin(ap) || toMin(t.fin) > toMin(ci)) errs.push(`${d}: el turno de ${t.profNombre} (${t.inicio}–${t.fin}) quedaría fuera del horario. Libérelo primero.`);
      }));
      const box = $('#frErrores');
      if (errs.length) { box.innerHTML = '⛔ ' + errs.map(esc).join('<br>⛔ '); box.classList.remove('d-none'); return; }
      box.classList.add('d-none');
      const unlock = SS.lock(btn, 'Guardando…');
      setTimeout(() => {
        dias.forEach(d => {
          DB.disponibilidad = DB.disponibilidad.filter(x => !(x.c === c && x.dia === d));
          if (!cerrar) DB.disponibilidad.push({ id: Math.max(0, ...DB.disponibilidad.map(x => x.id)) + 1, c, dia: d, apertura: ap, cierre: ci });
        });
        auditar('disponibilidad_consultorio', c, 'Modificación', null, { dias: dias.join(', '), horario: cerrar ? 'Cerrado' : `${ap}-${ci}` });
        guardar(); renderTodo(); modal('modalFranja').hide(); unlock(); SS.toast('Franja de disponibilidad actualizada.');
      }, 800);
    });

    $('#selSede').value = sede; llenarConsultorios(); renderTodo();
  }

  document.addEventListener('DOMContentLoaded', () => { setInst(); initDirectorio(); initMatriz(); });
})();