/* ===== SaludSync · Módulo 7: Citas Médicas y Recepción (mockup interactivo, sin backend) ===== */
(function () {
  'use strict';

  /* ---------- Utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const pad = n => String(n).padStart(2, '0');
  const modal = id => bootstrap.Modal.getOrCreateInstance(document.getElementById(id));
  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const hm = m => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  const isoD = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const isoDT = d => `${isoD(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const parseD = s => new Date(s + 'T00:00:00');
  const HOY = new Date(); HOY.setHours(0, 0, 0, 0);
  const AHORA = new Date();
  const diaDe = f => DIAS[(parseD(f).getDay() + 6) % 7];
  const fmtF = s => parseD(s).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' });
  const fmtFL = s => parseD(s).toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const fmtDT = s => { const d = new Date(s); return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const hl = (t, q) => { if (!q) return esc(t); const i = norm(t).indexOf(q); return i < 0 ? esc(t) : esc(t.slice(0, i)) + '<mark class="hl">' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length)); };
  const BADGE = { 'Programada': 'primary', 'En Sala de Espera': 'info text-dark', 'En Consulta': 'warning text-dark', 'Atendida': 'success', 'Cancelada': 'secondary', 'Inasistencia': 'danger' };
  const ESTADOS = ['Programada', 'En Sala de Espera', 'En Consulta', 'Atendida', 'Cancelada', 'Inasistencia'];
  const ECLS = { 'Programada': 'e-prog', 'En Sala de Espera': 'e-sala', 'En Consulta': 'e-cons', 'Atendida': 'e-aten', 'Cancelada': 'e-canc', 'Inasistencia': 'e-inas' };
  const leer = k => { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } };

  /* ---------- Institución, sesión y auditoría ---------- */
  function instActiva() {
    let id = 1;
    try { const s = leer('saludsync_sesion'), m2 = leer('saludsync_modulo2_v1'); const u = m2 && s && m2.usuarios.find(x => x.id === s.id); if (u && u.inst) id = u.inst; } catch (e) { }
    const nombres = { 1: 'Clínica Santa Lucía S.A.S.', 2: 'IPS Vida Plena Ltda.', 3: 'Centro Médico Los Andes', 5: 'Salud Integral del Caribe IPS' };
    return { id, nombre: nombres[id] || 'Institución #' + id };
  }
  const INST = instActiva();
  const setInst = () => $$('[data-inst-nombre]').forEach(e => e.textContent = INST.nombre);
  const responsable = () => { const s = leer('saludsync_sesion'); return s ? `${s.nombre} (${s.rol})` : 'Camila Ortiz (Recepción)'; };
  function auditar(tabla, registro, accion, ant, nuevo) {
    const m2 = leer('saludsync_modulo2_v1'); if (!m2 || !m2.auditoria) return;
    m2.auditoria.unshift({ id: Math.max(0, ...m2.auditoria.map(a => a.id)) + 1, usuario: responsable(), tabla, registro, accion, ant, nuevo, ip: '192.168.1.10', fecha: `${isoD(new Date())} ${pad(new Date().getHours())}:${pad(new Date().getMinutes())}` });
    try { sessionStorage.setItem('saludsync_modulo2_v1', JSON.stringify(m2)); } catch (e) { }
  }

  /* ---------- Catálogos de otros módulos (sesión o semillas) ---------- */
  const SEDES = [{ id: 1, nombre: 'Sede Principal' }, { id: 2, nombre: 'Sede Cabecera' }, { id: 3, nombre: 'Sede Floridablanca' }];
  const PAC_SEED = [[1, 'CC', '1100234567', 'Ana Lucía', 'Torres Gil', 'Activo'], [2, 'CC', '91234501', 'Carlos Eduardo', 'Mendoza Ruiz', 'Activo'], [3, 'TI', '1034567890', 'Valentina', 'Rojas Mejía', 'Activo'],
    [4, 'RC', '1098123456', 'Samuel', 'Ortega Plata', 'Activo'], [5, 'CC', '37890456', 'Rosa Elena', 'Barrios Núñez', 'Activo'], [6, 'CE', '5601234', 'Juan José', 'Martínez Pérez', 'Activo'],
    [7, 'PPT', '5870023', 'Daniela', 'Gómez Castro', 'Activo'], [8, 'CC', '13789012', 'Héctor Fabio', 'Lozano Vega', 'Inactivo'], [9, 'CC', '63890123', 'Natalia', 'Cárdenas Rueda', 'Activo'],
    [10, 'TI', '1102345678', 'Santiago', 'Arias Calderón', 'Activo'], [11, 'PEP', '4567890', 'Luisa Fernanda', 'Herrera Díaz', 'Activo'], [12, 'Pasaporte', 'AB123456', 'Michael', 'Anderson', 'Inactivo']]
    .map(([id, tipo, doc, nombres, apellidos, estado]) => ({ id, tipo, doc, nombres, apellidos, estado }));
  const PROF_SEED = [[1, 'Andrés Felipe', 'Navarro Díaz', [1], 'Activo'], [2, 'Paula Andrea', 'Rueda Mantilla', [2], 'Activo'], [3, 'Mauricio', 'Ariza Gómez', [3, 6], 'Activo'], [4, 'Liliana', 'Cortés Vargas', [4], 'Activo'],
    [5, 'Iván Darío', 'Suárez Pinto', [5], 'Activo'], [6, 'Marcela', 'Quintero Ardila', [6, 1], 'Activo'], [7, 'Camilo Andrés', 'Ortega Rey', [8], 'Activo'], [8, 'Sergio', 'Medina Restrepo', [1], 'Inactivo'],
    [9, 'Sofía', 'Bermúdez Luna', [2, 1], 'Activo'], [10, 'Diana Patricia', 'Cifuentes Mora', [4, 7], 'Activo']].map(([id, nombres, apellidos, esp, estado]) => ({ id, nombres, apellidos, esp, estado }));
  const ESP_SEED = [[1, 'Medicina General'], [2, 'Pediatría'], [3, 'Cardiología'], [4, 'Ginecología y Obstetricia'], [5, 'Odontología'], [6, 'Medicina Interna'], [7, 'Dermatología'], [8, 'Ortopedia y Traumatología']].map(([id, nombre]) => ({ id, nombre, estado: id === 7 ? 'Inactivo' : 'Activo' }));
  const CONS_SEED = [[1, 1, 'C-101', 'Consulta Externa 1', 'Habilitado'], [2, 1, 'C-102', 'Consulta Externa 2', 'Habilitado'], [3, 1, 'C-103', 'Odontología 1', 'Habilitado'], [4, 1, 'C-201', 'Sala de Procedimientos', 'Habilitado'],
    [5, 1, 'C-202', 'Consulta Especializada', 'Habilitado'], [6, 2, 'C-101', 'Consulta Externa 1', 'Habilitado'], [7, 2, 'C-102', 'Odontología 1', 'Habilitado'], [8, 2, 'C-103', 'Sala de Curaciones', 'En Mantenimiento'],
    [9, 3, 'C-101', 'Consulta Externa 1', 'Habilitado'], [10, 3, 'C-102', 'Consulta Pediátrica', 'Habilitado'], [11, 3, 'C-103', 'Consulta Externa 3', 'Inactivo']].map(([id, sede, codigo, nombre, estado]) => ({ id, sede, codigo, nombre, estado }));
  const M3 = leer('saludsync_modulo3_v1'), M4 = leer('saludsync_modulo4_v1'), M5 = leer('saludsync_modulo5_v1'), M6 = leer('saludsync_modulo6_v1');
  const PACS = ((M3 && M3.pacientes) ? M3.pacientes : PAC_SEED).map(p => ({ id: p.id, tipo: p.tipo, doc: p.doc, nombre: `${p.nombres} ${p.apellidos}`, estado: p.estado }));
  const PROFS = ((M4 && M4.profesionales) ? M4.profesionales : PROF_SEED).map(p => ({ id: p.id, nombre: `${p.nombres} ${p.apellidos}`, corto: `${p.nombres.split(' ')[0]} ${p.apellidos.split(' ')[0]}`, esp: p.esp, estado: p.estado }));
  const ESPS = ((M4 && M4.especialidades) ? M4.especialidades : ESP_SEED).map(e => ({ id: e.id, nombre: e.nombre, estado: e.estado }));
  const CONS = ((M5 && M5.consultorios) ? M5.consultorios : CONS_SEED).map(c => ({ id: c.id, sede: c.sede, codigo: c.codigo, nombre: c.nombre, estado: c.estado }));
  const pacDe = id => PACS.find(p => p.id === id), profDe = id => PROFS.find(p => p.id === id), consDe = id => CONS.find(c => c.id === id), sedeDe = id => SEDES.find(s => s.id === id);
  const espNombres = p => p.esp.map(id => (ESPS.find(e => e.id === id) || {}).nombre).filter(Boolean).join(', ');

  // Agendas y bloqueos del Módulo 6
  const dt = (off, h) => { const d = new Date(HOY); d.setDate(d.getDate() + off); return `${isoD(d)}T${h}`; };
  function seedAgendas() {
    let base;
    if (M5 && M5.turnos) base = M5.turnos.map(t => ({ id: t.id, prof: t.prof, c: t.c, dia: t.dia, ini: t.inicio, fin: t.fin }));
    else {
      base = []; let id = 1; const LV = DIAS.slice(0, 5), T = (c, dias, ini, fin, prof) => dias.forEach(d => base.push({ id: id++, prof, c, dia: d, ini, fin }));
      T(1, LV, '07:00', '12:00', 1); T(1, ['Lunes', 'Miércoles', 'Viernes'], '14:00', '18:00', 6); T(1, ['Sábado'], '08:00', '13:00', 1); T(2, ['Martes', 'Jueves'], '08:00', '17:00', 2); T(2, ['Lunes'], '14:00', '18:00', 9);
      T(3, LV, '08:00', '16:00', 5); T(3, ['Sábado'], '08:00', '12:00', 5); T(4, ['Miércoles'], '09:00', '13:00', 3); T(4, ['Jueves'], '14:00', '18:00', 3); T(5, ['Lunes', 'Martes', 'Jueves'], '14:00', '18:00', 4);
      T(5, ['Miércoles'], '14:00', '18:00', 10); T(6, LV, '08:00', '12:00', 7); T(9, ['Lunes', 'Miércoles', 'Viernes'], '08:00', '13:00', 9); T(10, ['Martes', 'Jueves'], '14:00', '18:00', 6);
    }
    const dur = { 2: 20, 3: 45, 5: 40 };
    return base.map(t => ({ ...t, dur: dur[t.prof] || 30, vIni: '2026-01-01', vFin: t.id % 5 === 0 ? '2026-12-31' : null, estado: 'Publicada' }));
  }
  const AGENDAS = (M6 && M6.agendas) ? M6.agendas : seedAgendas();
  const BLOQS = (M6 && M6.bloqueos) ? M6.bloqueos : [
    { prof: 3, ini: dt(-1, '00:00'), fin: dt(3, '23:59') }, { prof: 2, ini: dt(8, '00:00'), fin: dt(22, '23:59') }, { prof: 4, ini: dt(-2, '08:00'), fin: dt(-2, '18:00') }, { prof: 6, ini: dt(2, '14:00'), fin: dt(2, '16:00') }];
  const vigenteEn = (a, f) => a.vIni <= f && (!a.vFin || a.vFin >= f);
  const bloqueado = (prof, s, e) => BLOQS.some(b => b.prof === prof && s < new Date(b.fin).getTime() && e > new Date(b.ini).getTime());

  /* ---------- Datos propios: cita_medica e historial_reprogramacion ---------- */
  const hashOcup = (id, f, m) => ((id * 131 + parseInt(f.replace(/-/g, ''), 10) * 17 + m * 7) % 100) < 38; // misma regla que el Módulo 6
  function generarCitas() {
    const out = [], activos = PACS.filter(p => p.estado === 'Activo'), usadoPD = new Set(), usadoPT = new Set(); let id = 1;
    const hoy = isoD(HOY), nm = AHORA.getHours() * 60 + AHORA.getMinutes();
    for (let off = -2; off <= 7; off++) {
      const d = new Date(HOY); d.setDate(d.getDate() + off); const f = isoD(d), dia = diaDe(f);
      AGENDAS.filter(a => a.estado === 'Publicada' && a.dia === dia && vigenteEn(a, f) && consDe(a.c)).forEach(a => {
        for (let m = toMin(a.ini); m + a.dur <= toMin(a.fin); m += a.dur) {
          if (!hashOcup(a.id, f, m)) continue;
          const s = parseD(f).getTime() + m * 6e4; if (bloqueado(a.prof, s, s + a.dur * 6e4)) continue;
          let pac = null, k = (id * 5 + m) % activos.length;
          for (let t = 0; t < activos.length; t++) { const p = activos[(k + t) % activos.length]; if (!usadoPD.has(`${p.id}|${a.prof}|${f}`) && !usadoPT.has(`${p.id}|${f}|${m}`)) { pac = p; break; } }
          if (!pac) continue; usadoPD.add(`${pac.id}|${a.prof}|${f}`); usadoPT.add(`${pac.id}|${f}|${m}`);
          const h = Math.abs(a.id * 31 + m * 3 + off * 17) % 100; let estado, checkin = null, motivo = '';
          if (f < hoy) estado = h % 9 === 0 ? 'Inasistencia' : h % 11 === 0 ? 'Cancelada' : 'Atendida';
          else if (f > hoy) estado = h % 13 === 0 ? 'Cancelada' : 'Programada';
          else estado = m + a.dur < nm ? (h % 7 === 0 ? 'Inasistencia' : 'Atendida') : m <= nm ? 'En Consulta' : m <= nm + 60 ? 'En Sala de Espera' : 'Programada';
          if (estado === 'Cancelada') motivo = 'Solicitud del paciente';
          if (['Atendida', 'En Consulta'].includes(estado)) checkin = isoDT(new Date(s - 10 * 6e4));
          if (estado === 'En Sala de Espera') checkin = isoDT(new Date(AHORA.getTime() - (5 + h % 20) * 6e4));
          out.push({ id: id++, prof: a.prof, c: a.c, pac: pac.id, fecha: f, hora: hm(m), tipo: ['Primera vez', 'Control', 'Valoración'][h % 3], estado, motivoCanc: motivo, checkin });
        }
      });
    }
    return out;
  }
  function seedHistorial(citas) {
    const usuarios = ['Camila Ortiz (Recepción)', 'María Ruiz (Admin IPS)', 'Luis Cruz (Recepción)'];
    return citas.filter(c => c.estado === 'Programada' && c.fecha > isoD(HOY)).slice(0, 7).map((c, i) => {
      const a = parseD(c.fecha); a.setDate(a.getDate() - (i % 3 + 1)); const r = new Date(HOY); r.setDate(r.getDate() - (i % 4 + 1)); r.setHours(9 + i, 10 + i * 4);
      return { id: i + 1, cita: c.id, ant: `${isoD(a)}T${c.hora}`, nueva: `${c.fecha}T${c.hora}`, usuario: usuarios[i % 3], registro: isoDT(r) };
    });
  }
  const KEY = 'saludsync_modulo7_v1';
  const DB = (() => { const s = leer(KEY); if (s && s.citas) return s; const citas = generarCitas(); return { citas, historial: seedHistorial(citas) }; })();
  const guardar = () => { try { sessionStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } };
  const citaDe = id => DB.citas.find(c => c.id === id);
  const activa = c => c.estado !== 'Cancelada';
  const setSelect = (el, html) => { el.innerHTML = html; };

  /* =====================================================
     PANTALLA 7.1 · Mesa de recepción
     ===================================================== */
  function initMesa() {
    if (document.body.dataset.page !== 'mesa_recepcion') return;
    const TAM = 10; let pagina = 1, filtroEstado = '', accion = null;
    $('#fechaMesa').value = isoD(HOY);
    setSelect($('#selProfM'), '<option value="">Todos</option>' + PROFS.map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join(''));
    setSelect($('#selSedeM'), '<option value="">Todas</option>' + SEDES.map(s => `<option value="${s.id}">${esc(s.nombre)}</option>`).join(''));

    const delDia = () => { const f = $('#fechaMesa').value, fp = +$('#selProfM').value, fs = +$('#selSedeM').value, q = norm($('#buscaPac').value.trim());
      return DB.citas.filter(c => { const p = pacDe(c.pac), co = consDe(c.c); return c.fecha === f && (!fp || c.prof === fp) && (!fs || (co && co.sede === fs)) && (!q || (p && (norm(p.nombre).includes(q) || norm(p.doc).includes(q)))); })
        .sort((a, b) => a.hora.localeCompare(b.hora) || a.prof - b.prof); };

    function acciones(c) {
      const hoy = $('#fechaMesa').value === isoD(HOY), pasado = $('#fechaMesa').value <= isoD(HOY), b = [];
      const btn = (act, ico, cls, tit, dis) => `<button class="btn btn-acc btn-outline-${cls}" data-act="${act}" data-id="${c.id}" title="${tit}" ${dis ? 'disabled' : ''}>${ico}</button>`;
      if (c.estado === 'Programada') b.push(btn('checkin', '✅', 'success', hoy ? 'Check-in (llegada)' : 'El check-in solo se realiza el día de la cita', !hoy), btn('reprog', '🔄', 'primary', 'Reprogramar'), btn('noshow', '🚫', 'danger', pasado ? 'Marcar inasistencia' : 'Aún no es la fecha de la cita', !pasado), btn('cancelar', '✖', 'secondary', 'Cancelar cita'));
      else if (c.estado === 'En Sala de Espera') b.push(btn('consulta', '▶', 'warning', 'Pasar a consulta'), btn('cancelar', '✖', 'secondary', 'Cancelar cita'));
      else if (c.estado === 'En Consulta') b.push(btn('atendida', '✔', 'success', 'Marcar como atendida'));
      b.unshift(btn('ver', '👁', 'primary', 'Ver detalle'));
      return b.join(' ');
    }

    function render() {
      const todas = delDia(), q = norm($('#buscaPac').value.trim());
      $('#chipsEstado').innerHTML = `<div class="chip-estado ${!filtroEstado ? 'activo' : ''}" data-e=""><strong>${todas.length}</strong><small>Todas</small></div>` +
        ESTADOS.map(e => `<div class="chip-estado ${ECLS[e]} ${filtroEstado === e ? 'activo' : ''}" data-e="${e}"><strong>${todas.filter(c => c.estado === e).length}</strong><small>${e}</small></div>`).join('');
      const lista = todas.filter(c => !filtroEstado || c.estado === filtroEstado), total = lista.length, paginas = Math.max(1, Math.ceil(total / TAM));
      if (pagina > paginas) pagina = paginas; const ini = (pagina - 1) * TAM, vista = lista.slice(ini, ini + TAM);
      $('#tablaCitas').innerHTML = vista.length ? vista.map(c => {
        const p = pacDe(c.pac) || { nombre: '—', tipo: '', doc: '' }, pr = profDe(c.prof) || { corto: '—' }, co = consDe(c.c) || { codigo: '—', sede: 0 };
        const espera = c.estado === 'En Sala de Espera' && c.checkin ? `<span class="espera">⏱ ${Math.max(0, Math.round((AHORA - new Date(c.checkin)) / 6e4))} min en espera</span>` : '';
        return `<tr><td class="hora-cell">${c.hora}</td><td><strong>${hl(p.nombre, q)}</strong><span class="cell-sub">${esc(p.tipo)} ${hl(p.doc, q)}</span></td>
          <td>${esc(pr.corto)}</td><td>${esc(co.codigo)}<span class="cell-sub">${esc((sedeDe(co.sede) || {}).nombre || '')}</span></td><td>${esc(c.tipo)}</td>
          <td><span class="badge bg-${BADGE[c.estado]}">${c.estado}</span>${espera}${c.checkin && c.estado !== 'En Sala de Espera' ? `<span class="cell-sub">Check-in ${fmtDT(c.checkin).slice(-5)}</span>` : ''}${c.motivoCanc ? `<span class="cell-sub">${esc(c.motivoCanc)}</span>` : ''}</td>
          <td class="text-end text-nowrap">${acciones(c)}</td></tr>`;
      }).join('') : '<tr><td colspan="7" class="text-center text-muted py-4">No hay citas para los filtros seleccionados.</td></tr>';
      $('#contador').textContent = total ? `Mostrando ${ini + 1}–${ini + vista.length} de ${total} citas` : 'Sin resultados';
      let pg = `<li class="page-item ${pagina === 1 ? 'disabled' : ''}"><button class="page-link" data-p="${pagina - 1}">«</button></li>`;
      for (let k = 1; k <= paginas; k++) pg += `<li class="page-item ${k === pagina ? 'active' : ''}"><button class="page-link" data-p="${k}">${k}</button></li>`;
      pg += `<li class="page-item ${pagina === paginas ? 'disabled' : ''}"><button class="page-link" data-p="${pagina + 1}">»</button></li>`;
      $('#paginacion').innerHTML = pg;
    }

    ['selProfM', 'selSedeM', 'fechaMesa'].forEach(id => $('#' + id).addEventListener('change', () => { pagina = 1; render(); }));
    $('#buscaPac').addEventListener('input', () => { pagina = 1; render(); });
    const mover = n => { const d = parseD($('#fechaMesa').value); d.setDate(d.getDate() + n); $('#fechaMesa').value = isoD(d); pagina = 1; render(); };
    $('#btnPrevDia').addEventListener('click', () => mover(-1)); $('#btnNextDia').addEventListener('click', () => mover(1));
    $('#btnHoyDia').addEventListener('click', () => { $('#fechaMesa').value = isoD(HOY); pagina = 1; render(); });
    $('#chipsEstado').addEventListener('click', e => { const ch = e.target.closest('[data-e]'); if (ch) { filtroEstado = ch.dataset.e; pagina = 1; render(); } });
    $('#paginacion').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b && !b.parentElement.classList.contains('disabled')) { pagina = +b.dataset.p; render(); } });

    // Transiciones de estado (RF-CIT-02/03/04)
    const TRANS = {
      checkin: { desde: 'Programada', a: 'En Sala de Espera', titulo: 'Registrar check-in', txt: 'Se registrará la llegada del paciente y el sello de tiempo del check-in.', cls: 'success', ok: 'Check-in registrado.' },
      noshow: { desde: 'Programada', a: 'Inasistencia', titulo: 'Marcar inasistencia (No-Show)', txt: 'El paciente no se presentó a la cita. Esta acción libera el seguimiento operativo de la franja.', cls: 'danger', ok: 'Inasistencia registrada.' },
      consulta: { desde: 'En Sala de Espera', a: 'En Consulta', titulo: 'Pasar a consulta', txt: 'El paciente ingresa al consultorio.', cls: 'warning', ok: 'Paciente en consulta.' },
      atendida: { desde: 'En Consulta', a: 'Atendida', titulo: 'Marcar como atendida', txt: 'Se cerrará la atención administrativa de la cita.', cls: 'success', ok: 'Cita marcada como atendida.' }
    };
    $('#tablaCitas').addEventListener('click', e => {
      const b = e.target.closest('button[data-act]'); if (!b || b.disabled) return; const c = citaDe(+b.dataset.id), p = pacDe(c.pac), act = b.dataset.act;
      if (act === 'reprog') { location.href = `agendamiento_cita.html?reprogramar=${c.id}`; return; }
      if (act === 'ver') return detalle(c);
      if (act === 'cancelar') {
        accion = c.id; $('#formCancelar').classList.remove('was-validated'); $('#cancelMotivo').value = ''; $('#cancelDetalle').value = ''; $('#reqDetalle').classList.add('d-none');
        $('#cancelInfo').innerHTML = `<strong>${esc(p.nombre)}</strong> · ${c.hora} con ${esc(profDe(c.prof).corto)}`; modal('modalCancelar').show(); return;
      }
      const t = TRANS[act]; accion = { id: c.id, act };
      $('#accionTitulo').textContent = t.titulo; $('#accionCuerpo').innerHTML = `<p><strong>${esc(p.nombre)}</strong> · ${c.hora} con ${esc(profDe(c.prof).corto)}</p><p class="mb-0">${t.txt}</p>`;
      $('#btnConfirmarAccion').className = `btn btn-${t.cls}`; modal('modalAccion').show();
    });
    $('#btnConfirmarAccion').addEventListener('click', e => {
      const t = TRANS[accion.act], unlock = SS.lock(e.currentTarget, 'Aplicando…');
      setTimeout(() => {
        const c = citaDe(accion.id), ant = c.estado;
        if (c.estado !== t.desde) { unlock(); modal('modalAccion').hide(); return SS.toast('El estado de la cita cambió; actualice la lista.', 'danger'); }
        c.estado = t.a; if (accion.act === 'checkin') c.checkin = isoDT(new Date());
        auditar('cita_medica', c.id, 'Modificación', { estado: ant }, { estado: t.a }); guardar(); render(); modal('modalAccion').hide(); unlock(); SS.toast(t.ok, t.cls === 'danger' ? 'secondary' : 'success');
      }, 600);
    });
    $('#cancelMotivo').addEventListener('change', e => { const o = e.target.value === 'Otro'; $('#cancelDetalle').required = o; $('#reqDetalle').classList.toggle('d-none', !o); });
    $('#formCancelar').addEventListener('submit', e => {
      e.preventDefault(); const btn = $('#btnConfirmarCancelar'); if (btn.disabled) return; e.currentTarget.classList.add('was-validated'); if (!e.currentTarget.checkValidity()) return;
      const unlock = SS.lock(btn, 'Cancelando…');
      setTimeout(() => {
        const c = citaDe(accion), det = $('#cancelDetalle').value.trim(), motivo = ($('#cancelMotivo').value + (det ? ': ' + det : '')).slice(0, 150);
        const ant = c.estado; c.estado = 'Cancelada'; c.motivoCanc = motivo;
        auditar('cita_medica', c.id, 'Modificación', { estado: ant }, { estado: 'Cancelada', motivo }); guardar(); render(); modal('modalCancelar').hide(); unlock(); SS.toast('Cita cancelada. La franja quedó libre.', 'secondary');
      }, 700);
    });

    function detalle(c) {
      const p = pacDe(c.pac), pr = profDe(c.prof), co = consDe(c.c), hist = DB.historial.filter(h => h.cita === c.id).sort((a, b) => a.registro.localeCompare(b.registro));
      $('#detTitulo').textContent = `Cita #${c.id}`;
      $('#detCuerpo').innerHTML = `<dl class="row small mb-3"><dt class="col-4">Paciente</dt><dd class="col-8">${esc(p.nombre)} (${esc(p.tipo)} ${esc(p.doc)})</dd>
        <dt class="col-4">Profesional</dt><dd class="col-8">${esc(pr.nombre)}<br><span class="text-muted">${esc(espNombres(pr))}</span></dd>
        <dt class="col-4">Fecha y hora</dt><dd class="col-8">${fmtFL(c.fecha)} · ${c.hora}</dd><dt class="col-4">Consultorio</dt><dd class="col-8">${esc(co.codigo)} · ${esc(co.nombre)} (${esc(sedeDe(co.sede).nombre)})</dd>
        <dt class="col-4">Tipo</dt><dd class="col-8">${esc(c.tipo)}</dd><dt class="col-4">Estado</dt><dd class="col-8"><span class="badge bg-${BADGE[c.estado]}">${c.estado}</span>${c.motivoCanc ? ' · ' + esc(c.motivoCanc) : ''}</dd>
        <dt class="col-4">Check-in</dt><dd class="col-8">${c.checkin ? fmtDT(c.checkin) : '—'}</dd></dl>
        <h3 class="h6">Reprogramaciones (${hist.length})</h3>` + (hist.length ? `<ul class="timeline-rep">${hist.map(h => `<li><strong>${fmtDT(h.ant)}</strong> → <strong>${fmtDT(h.nueva)}</strong><br><small class="text-muted">${esc(h.usuario)} · ${fmtDT(h.registro)}</small></li>`).join('')}</ul>` : '<p class="text-muted small mb-0">Esta cita no ha sido reprogramada.</p>');
      modal('modalDetalle').show();
    }
    render();
  }

  /* =====================================================
     PANTALLA 7.2 · Agendamiento y reprogramación
     ===================================================== */
  function initAgendar() {
    if (document.body.dataset.page !== 'agendamiento_cita') return;
    const rid = +new URLSearchParams(location.search).get('reprogramar'), reprog = rid ? citaDe(rid) : null;
    let sel = null, pac = reprog ? pacDe(reprog.pac) : null;
    setSelect($('#selSedeA'), '<option value="">Todas</option>' + SEDES.map(s => `<option value="${s.id}">${esc(s.nombre)}</option>`).join(''));
    setSelect($('#selEspA'), '<option value="">Todas</option>' + ESPS.filter(e => e.estado === 'Activo').map(e => `<option value="${e.id}">${esc(e.nombre)}</option>`).join(''));
    const llenarProf = () => { const fe = +$('#selEspA').value; setSelect($('#selProfA'), '<option value="">Todos</option>' + PROFS.filter(p => p.estado === 'Activo' && (!fe || p.esp.includes(fe))).map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')); };
    llenarProf(); $('#selEspA').addEventListener('change', llenarProf);
    const d2 = new Date(HOY); d2.setDate(d2.getDate() + 7); $('#fDesde').value = isoD(HOY); $('#fHasta').value = isoD(d2); $('#fDesde').min = isoD(HOY);

    /* Disponibilidad: cruza agenda del médico, consultorio, bloqueos y citas existentes (RF-CIT-01) */
    function indices(ignorar) {
      const P = new Set(), C = new Set();
      DB.citas.forEach(x => { if (x.id === ignorar || !activa(x)) return; const m = toMin(x.hora); P.add(`${x.prof}|${x.fecha}|${m}`); C.add(`${x.c}|${x.fecha}|${m}`); });
      return { P, C };
    }
    function buscar() {
      const sede = +$('#selSedeA').value, esp = +$('#selEspA').value, prof = +$('#selProfA').value, out = [], { P, C } = indices(reprog ? reprog.id : null);
      let desde = $('#fDesde').value || isoD(HOY), hasta = $('#fHasta').value || desde; if (desde < isoD(HOY)) desde = isoD(HOY);
      const lim = parseD(desde); lim.setDate(lim.getDate() + 30); if (parseD(hasta) > lim) hasta = isoD(lim);
      const d = parseD(desde), fin = parseD(hasta), now = Date.now();
      while (d <= fin) {
        const f = isoD(d), dia = diaDe(f);
        AGENDAS.filter(a => a.estado === 'Publicada' && a.dia === dia && vigenteEn(a, f)).forEach(a => {
          const p = profDe(a.prof), c = consDe(a.c); if (!p || !c || c.estado !== 'Habilitado' || p.estado !== 'Activo') return;
          if ((prof && a.prof !== prof) || (esp && !p.esp.includes(esp)) || (sede && c.sede !== sede)) return;
          for (let m = toMin(a.ini); m + a.dur <= toMin(a.fin); m += a.dur) {
            const s = parseD(f).getTime() + m * 6e4; if (s <= now || bloqueado(a.prof, s, s + a.dur * 6e4)) continue;
            if (P.has(`${a.prof}|${f}|${m}`) || C.has(`${a.c}|${f}|${m}`)) continue;
            out.push({ f, m, fin: m + a.dur, prof: a.prof, c: a.c });
          }
        });
        d.setDate(d.getDate() + 1);
      }
      return out;
    }
    function renderResultados() {
      const slots = buscar(), box = $('#resultados'); sel = null; renderSlot();
      $('#resContador').textContent = slots.length ? `${slots.length} franjas libres` : '';
      if (!slots.length) { box.innerHTML = '<div class="alert alert-light border mb-0">No hay franjas libres con los criterios indicados. Amplíe el rango de fechas o cambie los filtros.</div>'; return; }
      const porFecha = {}; slots.forEach(s => (porFecha[s.f] = porFecha[s.f] || []).push(s));
      box.innerHTML = Object.keys(porFecha).sort().map(f => {
        const grupos = {}; porFecha[f].forEach(s => (grupos[`${s.prof}|${s.c}`] = grupos[`${s.prof}|${s.c}`] || []).push(s));
        return `<div class="res-fecha"><span>${esc(fmtFL(f))}</span><span>${porFecha[f].length} franjas</span></div>` + Object.values(grupos).map(g => {
          const p = profDe(g[0].prof), c = consDe(g[0].c);
          return `<div class="res-fila"><div class="res-info"><strong>${esc(p.nombre)}</strong> · <span class="text-muted">${esc(espNombres(p))}</span><br>🚪 ${esc(c.codigo)} · ${esc(sedeDe(c.sede).nombre)}</div>
            <div>${g.sort((a, b) => a.m - b.m).map(s => `<button type="button" class="slot-btn" data-f="${s.f}" data-m="${s.m}" data-fin="${s.fin}" data-prof="${s.prof}" data-c="${s.c}">${hm(s.m)}</button>`).join('')}</div></div>`;
        }).join('');
      }).join('');
    }
    $('#btnBuscar').addEventListener('click', e => { const unlock = SS.lock(e.currentTarget, 'Buscando…'); setTimeout(() => { renderResultados(); unlock(); }, 350); });
    $('#resultados').addEventListener('click', e => {
      const b = e.target.closest('.slot-btn'); if (!b) return;
      $$('.slot-btn.sel').forEach(x => x.classList.remove('sel')); b.classList.add('sel');
      sel = { f: b.dataset.f, m: +b.dataset.m, fin: +b.dataset.fin, prof: +b.dataset.prof, c: +b.dataset.c }; renderSlot(); $('#errSlot').classList.add('d-none');
    });
    function renderSlot() {
      if (!sel) { $('#resSlot').innerHTML = '<span class="text-muted">Ninguna franja seleccionada.</span>'; return; }
      const p = profDe(sel.prof), c = consDe(sel.c);
      $('#resSlot').innerHTML = `<strong>${esc(fmtFL(sel.f))}</strong><br>🕒 ${hm(sel.m)} – ${hm(sel.fin)}<br>👨‍⚕️ ${esc(p.nombre)}<br>🚪 ${esc(c.codigo)} · ${esc(sedeDe(c.sede).nombre)}`;
    }

    /* Selector de paciente */
    function renderPac() {
      const card = $('#pacSel'); if (!pac) { card.classList.add('d-none'); return; }
      card.classList.remove('d-none'); card.innerHTML = `<div class="d-flex justify-content-between align-items-center"><div><strong>${esc(pac.nombre)}</strong><br><small class="text-muted">${esc(pac.tipo)} ${esc(pac.doc)}</small></div>${reprog ? '' : '<button type="button" class="btn btn-sm btn-outline-secondary" id="btnCambiarPac">Cambiar</button>'}</div>`;
      $('#errPac').classList.add('d-none'); $('#pacBuscar').classList.add('d-none'); $('#pacLista').classList.add('d-none');
    }
    $('#pacBuscar').addEventListener('input', e => {
      const q = norm(e.target.value.trim()), box = $('#pacLista'); if (!q) { box.classList.add('d-none'); return; }
      const r = PACS.filter(p => p.estado === 'Activo' && (norm(p.nombre).includes(q) || norm(p.doc).includes(q))).slice(0, 6);
      box.innerHTML = r.length ? r.map(p => `<button type="button" class="list-group-item list-group-item-action" data-id="${p.id}"><strong>${esc(p.nombre)}</strong><br><small class="text-muted">${esc(p.tipo)} ${esc(p.doc)}</small></button>`).join('') : '<div class="list-group-item text-muted small">Sin coincidencias entre pacientes activos.</div>';
      box.classList.remove('d-none');
    });
    $('#pacLista').addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) { pac = pacDe(+b.dataset.id); $('#pacBuscar').value = ''; renderPac(); } });
    $('#pacSel').addEventListener('click', e => { if (e.target.id === 'btnCambiarPac') { pac = null; $('#pacBuscar').classList.remove('d-none'); renderPac(); $('#pacBuscar').focus(); } });

    /* Validaciones de unicidad (uq_cita_*) */
    function validar() {
      const errs = [], otras = DB.citas.filter(c => c.id !== (reprog ? reprog.id : 0) && activa(c)), m = sel.m;
      if (!pac || pac.estado !== 'Activo') errs.push('El paciente debe estar activo.');
      const co = consDe(sel.c); if (!co || co.estado !== 'Habilitado') errs.push('El consultorio no está habilitado.');
      if (otras.some(c => c.prof === sel.prof && c.fecha === sel.f && toMin(c.hora) === m)) errs.push('El profesional ya tiene una cita en esa franja.');
      if (otras.some(c => c.c === sel.c && c.fecha === sel.f && toMin(c.hora) === m)) errs.push('El consultorio ya está ocupado en esa franja.');
      if (pac) {
        if (otras.some(c => c.pac === pac.id && c.fecha === sel.f && toMin(c.hora) === m)) errs.push('El paciente ya tiene otra cita a esa misma fecha y hora.');
        if (otras.some(c => c.pac === pac.id && c.prof === sel.prof && c.fecha === sel.f)) errs.push('El paciente ya tiene una cita con este profesional ese día.');
      }
      if (reprog && reprog.fecha === sel.f && toMin(reprog.hora) === m && reprog.prof === sel.prof) errs.push('La nueva franja es igual a la actual.');
      if (parseD(sel.f).getTime() + m * 6e4 <= Date.now()) errs.push('La franja seleccionada ya pasó.');
      return errs;
    }

    const f = $('#formCita'), btn = $('#btnConfirmarCita');
    f.addEventListener('submit', e => {
      e.preventDefault(); if (btn.disabled) return;
      $('#errSlot').classList.toggle('d-none', !!sel); $('#errPac').classList.toggle('d-none', !!pac); f.classList.add('was-validated');
      if (!sel || !pac || !f.checkValidity()) return;
      const errs = validar(), box = $('#errCita');
      if (errs.length) { box.innerHTML = '⛔ ' + errs.map(esc).join('<br>⛔ '); box.classList.remove('d-none'); return; }
      box.classList.add('d-none');
      const unlock = SS.lock(btn, reprog ? 'Reprogramando…' : 'Confirmando…');
      setTimeout(() => {
        const ahoraISO = isoDT(new Date()); let texto;
        if (reprog) {
          const c = citaDe(reprog.id), ant = `${c.fecha}T${c.hora}`; c.fecha = sel.f; c.hora = hm(sel.m); c.c = sel.c; c.tipo = $('#tipoCita').value; c.estado = 'Programada'; c.checkin = null;
          DB.historial.push({ id: Math.max(0, ...DB.historial.map(h => h.id)) + 1, cita: c.id, ant, nueva: `${c.fecha}T${c.hora}`, usuario: responsable(), registro: ahoraISO });
          auditar('historial_reprogramacion', c.id, 'Creación', { fecha_anterior: ant }, { fecha_nueva: `${c.fecha}T${c.hora}` });
          texto = `La cita #${c.id} de ${pac.nombre} pasó a ${fmtFL(c.fecha)} a las ${c.hora}. El cambio quedó en el historial.`;
        } else {
          const id = Math.max(0, ...DB.citas.map(c => c.id)) + 1;
          DB.citas.push({ id, prof: sel.prof, c: sel.c, pac: pac.id, fecha: sel.f, hora: hm(sel.m), tipo: $('#tipoCita').value, estado: 'Programada', motivoCanc: '', checkin: null });
          auditar('cita_medica', id, 'Creación', null, { paciente: pac.nombre, fecha: `${sel.f} ${hm(sel.m)}` });
          texto = `${pac.nombre} · ${fmtFL(sel.f)} a las ${hm(sel.m)} con ${profDe(sel.prof).nombre}.`;
        }
        guardar(); f.classList.add('d-none'); $('#exitoTitulo').textContent = reprog ? 'Cita reprogramada' : 'Cita registrada'; $('#exitoTexto').textContent = texto;
        $('#exito').classList.remove('d-none'); if (reprog) $('#btnOtra').classList.add('d-none'); renderResultados(); unlock();
        SS.toast(reprog ? 'Cita reprogramada correctamente.' : 'Cita agendada correctamente.');
      }, 900);
    });

    // Modo reprogramación
    if (reprog) {
      const p = profDe(reprog.prof);
      $('#tituloForm').textContent = `Reprogramar cita #${reprog.id}`; $('#crumbForm').textContent = 'Reprogramar';
      $('#subtituloForm').textContent = 'Elija una nueva franja. El cambio quedará registrado en el historial de reprogramación.';
      $('#bannerReprog').classList.remove('d-none');
      $('#bannerReprog').innerHTML = `<strong>Cita actual:</strong> ${esc(pac.nombre)} · ${esc(fmtFL(reprog.fecha))} a las ${reprog.hora} con ${esc(p.nombre)} (${esc(reprog.tipo)}).`;
      $('#selProfA').value = reprog.prof; $('#selProfA').disabled = true; $('#tipoCita').value = reprog.tipo; $('#btnConfirmarCita').innerHTML = '🔄 Confirmar reprogramación';
      $('#bloquePaciente').querySelector('label').textContent = 'Paciente'; renderPac();
    }
    renderResultados();
  }

  /* =====================================================
     PANTALLA 7.3 · Historial de reprogramación
     ===================================================== */
  function initHistorial() {
    if (document.body.dataset.page !== 'historial_reprogramacion') return;
    const TAM = 8; let pagina = 1;
    setSelect($('#selProfH'), '<option value="">Todos los profesionales</option>' + PROFS.map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join(''));
    const fila = h => { const c = citaDe(h.cita) || {}, p = pacDe(c.pac) || { nombre: '—', tipo: '', doc: '' }, pr = profDe(c.prof) || { nombre: '—' }; return { h, c, p, pr, delta: Math.round((new Date(h.nueva) - new Date(h.ant)) / 864e5) }; };
    function filtrar() {
      const q = norm($('#buscaH').value.trim()), fp = +$('#selProfH').value, d1 = $('#hDesde').value, d2 = $('#hHasta').value;
      return DB.historial.map(fila).filter(r => (!q || norm(r.p.nombre).includes(q) || String(r.h.cita) === q.replace('#', '')) && (!fp || r.c.prof === fp) && (!d1 || r.h.registro.slice(0, 10) >= d1) && (!d2 || r.h.registro.slice(0, 10) <= d2))
        .sort((a, b) => b.h.registro.localeCompare(a.h.registro));
    }
    function render() {
      const lista = filtrar(), total = lista.length, paginas = Math.max(1, Math.ceil(total / TAM)); if (pagina > paginas) pagina = paginas;
      const ini = (pagina - 1) * TAM, vista = lista.slice(ini, ini + TAM);
      $('#tablaHist').innerHTML = vista.length ? vista.map(r => `<tr><td><strong>#${r.h.cita}</strong><span class="cell-sub">${esc(r.c.tipo || '')}</span></td>
        <td>${esc(r.p.nombre)}<span class="cell-sub">${esc(r.p.tipo)} ${esc(r.p.doc)}</span></td><td>${esc(r.pr.nombre)}</td>
        <td class="fecha-flecha">${fmtDT(r.h.ant)}<br>→ <strong>${fmtDT(r.h.nueva)}</strong> <span class="delta ${r.delta >= 0 ? 'delta-pos' : 'delta-neg'}">${r.delta >= 0 ? '+' : ''}${r.delta} d</span></td>
        <td>${esc(r.h.usuario)}</td><td class="small">${fmtDT(r.h.registro)}</td>
        <td class="text-end"><button class="btn btn-sm btn-outline-primary" data-cita="${r.h.cita}" title="Ver trazabilidad">👁</button></td></tr>`).join('')
        : '<tr><td colspan="7" class="text-center text-muted py-4">No hay reprogramaciones con los filtros aplicados.</td></tr>';
      $('#contador').textContent = total ? `Mostrando ${ini + 1}–${ini + vista.length} de ${total} registros` : 'Sin resultados';
      let pg = `<li class="page-item ${pagina === 1 ? 'disabled' : ''}"><button class="page-link" data-p="${pagina - 1}">«</button></li>`;
      for (let k = 1; k <= paginas; k++) pg += `<li class="page-item ${k === pagina ? 'active' : ''}"><button class="page-link" data-p="${k}">${k}</button></li>`;
      pg += `<li class="page-item ${pagina === paginas ? 'disabled' : ''}"><button class="page-link" data-p="${pagina + 1}">»</button></li>`;
      $('#paginacion').innerHTML = pg;
      const todos = DB.historial.map(fila), citasUnicas = new Set(DB.historial.map(h => h.cita)), conteo = {}; DB.historial.forEach(h => conteo[h.cita] = (conteo[h.cita] || 0) + 1);
      const prom = todos.length ? (todos.reduce((a, r) => a + Math.abs(r.delta), 0) / todos.length).toFixed(1) : 0;
      $('#kpis').innerHTML = [['Reprogramaciones', DB.historial.length], ['Citas reprogramadas', citasUnicas.size], ['Desplazamiento medio', prom + ' d'], ['Citas con 2 o más cambios', Object.values(conteo).filter(n => n > 1).length]]
        .map(([l, v]) => `<div class="col-6 col-lg-3"><div class="kpi"><div class="kpi-num">${v}</div><div class="kpi-lbl">${l}</div></div></div>`).join('');
    }
    ['buscaH', 'selProfH', 'hDesde', 'hHasta'].forEach(id => ['input', 'change'].forEach(ev => $('#' + id).addEventListener(ev, () => { pagina = 1; render(); })));
    $('#btnLimpiar').addEventListener('click', () => { ['buscaH', 'selProfH', 'hDesde', 'hHasta'].forEach(id => $('#' + id).value = ''); pagina = 1; render(); });
    $('#paginacion').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b && !b.parentElement.classList.contains('disabled')) { pagina = +b.dataset.p; render(); } });
    $('#tablaHist').addEventListener('click', e => {
      const b = e.target.closest('[data-cita]'); if (!b) return; const id = +b.dataset.cita, c = citaDe(id) || {}, p = pacDe(c.pac) || { nombre: '—' };
      const hs = DB.historial.filter(h => h.cita === id).sort((a, z) => a.registro.localeCompare(z.registro));
      $('#histTitulo').textContent = `Cita #${id} · ${p.nombre}`;
      $('#histCuerpo').innerHTML = `<p class="small text-muted">Estado actual: <span class="badge bg-${BADGE[c.estado] || 'secondary'}">${esc(c.estado || '—')}</span> · Programada para ${c.fecha ? fmtFL(c.fecha) + ' ' + c.hora : '—'}</p>
        <ul class="timeline-rep">${hs.map(h => `<li><strong>${fmtDT(h.ant)}</strong> → <strong>${fmtDT(h.nueva)}</strong><br><small class="text-muted">${esc(h.usuario)} · registrado ${fmtDT(h.registro)}</small></li>`).join('')}</ul>`;
      modal('modalHist').show();
    });
    $('#btnExportar').addEventListener('click', e => {
      const unlock = SS.lock(e.currentTarget, 'Generando…');
      setTimeout(() => {
        const rows = [['id_cita', 'paciente', 'profesional', 'fecha_anterior', 'fecha_nueva', 'usuario_responsable', 'fecha_registro']].concat(filtrar().map(r => [r.h.cita, r.p.nombre, r.pr.nombre, r.h.ant.replace('T', ' '), r.h.nueva.replace('T', ' '), r.h.usuario, r.h.registro.replace('T', ' ')]));
        const csv = '\ufeff' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'historial_reprogramacion.csv'; a.click(); URL.revokeObjectURL(a.href);
        unlock(); SS.toast('Archivo CSV generado.');
      }, 600);
    });
    render();
  }

  document.addEventListener('DOMContentLoaded', () => { setInst(); initMesa(); initAgendar(); initHistorial(); });
})();