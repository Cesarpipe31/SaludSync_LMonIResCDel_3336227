/* ===== SaludSync · Módulo 15: Tableros de Control / Dashboard (mockup interactivo, sin backend) ===== */
(function () {
  'use strict';

  /* ---------- Utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const modal = id => bootstrap.Modal.getOrCreateInstance(document.getElementById(id));
  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const hm = m => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  const isoD = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const isoDT = d => `${isoD(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const parseD = s => new Date(s.slice(0, 10) + 'T00:00:00');
  const HOY = new Date(); HOY.setHours(0, 0, 0, 0);
  const AHORA = new Date();
  const addDias = (iso, n) => { const d = parseD(iso); d.setDate(d.getDate() + n); return isoD(d); };
  const diaDe = f => DIAS[(parseD(f).getDay() + 6) % 7];
  const fmtF = s => parseD(s).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtFC = s => parseD(s).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' });
  const fmtN = n => Math.round(n).toLocaleString('es-CO');
  const COP = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
  const leer = k => { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } };
  const edad = s => { const n = parseD(s); let a = HOY.getFullYear() - n.getFullYear(); const m = HOY.getMonth() - n.getMonth(); if (m < 0 || (m === 0 && HOY.getDate() < n.getDate())) a--; return a; };
  const edadTxt = s => { const a = edad(s); if (a >= 2) return a + ' años'; const n = parseD(s); return ((HOY.getFullYear() - n.getFullYear()) * 12 + HOY.getMonth() - n.getMonth() - (HOY.getDate() < n.getDate() ? 1 : 0)) + ' meses'; };
  const minDesde = iso => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 6e4));

  /* ---------- Institución, sesión, rol y auditoría ---------- */
  const SES = leer('saludsync_sesion'), M2 = leer('saludsync_modulo2_v1');
  const ROL = (SES && M2 && (M2.usuarios.find(u => u.id === SES.id) || {}).rol) || null;
  function instActiva() {
    let id = 1; const u = M2 && SES && M2.usuarios.find(x => x.id === SES.id); if (u && u.inst) id = u.inst;
    const nombres = { 1: 'Clínica Santa Lucía S.A.S.', 2: 'IPS Vida Plena Ltda.', 3: 'Centro Médico Los Andes', 5: 'Salud Integral del Caribe IPS' };
    return { id, nombre: nombres[id] || 'Institución #' + id };
  }
  const INST = instActiva();
  const setInst = () => $$('[data-inst-nombre]').forEach(e => e.textContent = INST.nombre);
  function auditar(tabla, registro, accion, ant, nuevo) {
    const m2 = leer('saludsync_modulo2_v1'); if (!m2 || !m2.auditoria) return;
    m2.auditoria.unshift({ id: Math.max(0, ...m2.auditoria.map(a => a.id)) + 1, usuario: SES ? `${SES.nombre} (${SES.rol})` : 'Médico (demo)', tabla, registro, accion, ant, nuevo, ip: '192.168.1.10', fecha: `${isoD(new Date())} ${pad(new Date().getHours())}:${pad(new Date().getMinutes())}` });
    try { sessionStorage.setItem('saludsync_modulo2_v1', JSON.stringify(m2)); } catch (e) { }
  }
  // Control de acceso por rol (en demostración sin sesión se permite)
  function acceso(permitidos) { if (ROL && !permitidos.includes(ROL)) { $('#sinAcceso').classList.remove('d-none'); $('#contenido').classList.add('d-none'); return false; } return true; }
  const reloj = () => { const r = $('#reloj'); if (r) { const tick = () => r.textContent = new Date().toLocaleTimeString('es-CO', { hour12: false }); tick(); setInterval(tick, 1000); } const f = $('#fechaHoy'); if (f) f.textContent = HOY.toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase()); };
  const marcaAct = () => { const a = $('#actualizado'); if (a) a.textContent = new Date().toLocaleTimeString('es-CO', { hour12: false }); };
  // Acciones rápidas: se deshabilitan al hacer clic (RNF-USA-03) y luego navegan
  document.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (!b || b.disabled) return; const unlock = SS.lock(b, 'Abriendo…'); setTimeout(() => { location.href = b.dataset.go; }, 450); });

  /* ---------- Catálogos de otros módulos (sesión o semillas) ---------- */
  const SEDES = [{ id: 1, nombre: 'Sede Principal' }, { id: 2, nombre: 'Sede Cabecera' }, { id: 3, nombre: 'Sede Floridablanca' }];
  const PAC_SEED = [[1, 'CC', '1100234567', 'Ana Lucía', 'Torres Gil', 'Activo', '1991-04-12', 'Femenino'], [2, 'CC', '91234501', 'Carlos Eduardo', 'Mendoza Ruiz', 'Activo', '1978-09-03', 'Masculino'], [3, 'TI', '1034567890', 'Valentina', 'Rojas Mejía', 'Activo', '2010-02-20', 'Femenino'],
    [4, 'RC', '1098123456', 'Samuel', 'Ortega Plata', 'Activo', '2022-06-15', 'Masculino'], [5, 'CC', '37890456', 'Rosa Elena', 'Barrios Núñez', 'Activo', '1955-11-30', 'Femenino'], [6, 'CE', '5601234', 'Juan José', 'Martínez Pérez', 'Activo', '1989-01-17', 'Masculino'],
    [7, 'PPT', '5870023', 'Daniela', 'Gómez Castro', 'Activo', '1996-07-08', 'Femenino'], [8, 'CC', '13789012', 'Héctor Fabio', 'Lozano Vega', 'Inactivo', '1967-03-25', 'Masculino'], [9, 'CC', '63890123', 'Natalia', 'Cárdenas Rueda', 'Activo', '1985-12-02', 'Femenino'],
    [10, 'TI', '1102345678', 'Santiago', 'Arias Calderón', 'Activo', '2008-10-05', 'Masculino'], [11, 'PEP', '4567890', 'Luisa Fernanda', 'Herrera Díaz', 'Activo', '1993-05-19', 'Femenino'], [12, 'Pasaporte', 'AB123456', 'Michael', 'Anderson', 'Inactivo', '1974-08-11', 'Masculino']]
    .map(([id, tipo, doc, nombres, apellidos, estado, nac, sexo]) => ({ id, tipo, doc, nombres, apellidos, estado, nac, sexo }));
  const PROF_SEED = [[1, 'Andrés Felipe', 'Navarro Díaz', [1], 'Activo', 3], [2, 'Paula Andrea', 'Rueda Mantilla', [2], 'Activo', 4], [3, 'Mauricio', 'Ariza Gómez', [3, 6], 'Activo', null], [4, 'Liliana', 'Cortés Vargas', [4], 'Activo', null], [5, 'Iván Darío', 'Suárez Pinto', [5], 'Activo', null],
    [6, 'Marcela', 'Quintero Ardila', [6, 1], 'Activo', null], [7, 'Camilo Andrés', 'Ortega Rey', [8], 'Activo', null], [8, 'Sergio', 'Medina Restrepo', [1], 'Inactivo', null], [9, 'Sofía', 'Bermúdez Luna', [2, 1], 'Activo', null], [10, 'Diana Patricia', 'Cifuentes Mora', [4, 7], 'Activo', null]]
    .map(([id, nombres, apellidos, esp, estado, uid]) => ({ id, nombres, apellidos, esp, estado, uid }));
  const ESP_NOM = { 1: 'Medicina General', 2: 'Pediatría', 3: 'Cardiología', 4: 'Ginecología y Obstetricia', 5: 'Odontología', 6: 'Medicina Interna', 7: 'Dermatología', 8: 'Ortopedia y Traumatología' };
  const CONS_SEED = [[1, 1, 'C-101', 'Consulta Externa 1', 'Habilitado'], [2, 1, 'C-102', 'Consulta Externa 2', 'Habilitado'], [3, 1, 'C-103', 'Odontología 1', 'Habilitado'], [4, 1, 'C-201', 'Sala de Procedimientos', 'Habilitado'], [5, 1, 'C-202', 'Consulta Especializada', 'Habilitado'],
    [6, 2, 'C-101', 'Consulta Externa 1', 'Habilitado'], [7, 2, 'C-102', 'Odontología 1', 'Habilitado'], [8, 2, 'C-103', 'Sala de Curaciones', 'En Mantenimiento'], [9, 3, 'C-101', 'Consulta Externa 1', 'Habilitado'], [10, 3, 'C-102', 'Consulta Pediátrica', 'Habilitado'], [11, 3, 'C-103', 'Consulta Externa 3', 'Inactivo']]
    .map(([id, sede, codigo, nombre, estado]) => ({ id, sede, codigo, nombre, estado }));
  const M1 = leer('saludsync_modulo1_v1'), M3 = leer('saludsync_modulo3_v1'), M4 = leer('saludsync_modulo4_v1'), M5 = leer('saludsync_modulo5_v1'), M6 = leer('saludsync_modulo6_v1'), M8 = leer('saludsync_modulo8_v1'), M10 = leer('saludsync_modulo10_v1'), M12 = leer('saludsync_modulo12_v1');
  const PACS = ((M3 && M3.pacientes) ? M3.pacientes : PAC_SEED).map(p => ({ id: p.id, tipo: p.tipo, doc: p.doc, nombre: `${p.nombres} ${p.apellidos}`, estado: p.estado, nac: p.nac, sexo: p.sexo }));
  const PROFS = ((M4 && M4.profesionales) ? M4.profesionales : PROF_SEED).map(p => ({ id: p.id, nombre: `${p.nombres} ${p.apellidos}`, corto: `${p.nombres.split(' ')[0]} ${p.apellidos.split(' ')[0]}`, esp: p.esp, estado: p.estado, uid: p.uid }));
  const CONS = ((M5 && M5.consultorios) ? M5.consultorios : CONS_SEED).map(c => ({ id: c.id, sede: c.sede, codigo: c.codigo, nombre: c.nombre, estado: c.estado }));
  const pacDe = id => PACS.find(p => p.id === id), profDe = id => PROFS.find(p => p.id === id), consDe = id => CONS.find(c => c.id === id), sedeDe = id => SEDES.find(s => s.id === id);
  const ALERG_SEED = { 1: ['Penicilina: rash cutáneo generalizado.'], 3: ['Alergia estacional al polen.'], 6: ['AINEs (diclofenaco): urticaria.'] };
  const alergias = pid => (M8 && M8.antecedentes) ? M8.antecedentes.filter(a => a.pac === pid && a.tipo === 'Alérgico').map(a => a.desc) : (ALERG_SEED[pid] || []);

  /* ---------- Citas del Módulo 7 (se leen o se generan igual que en ese módulo) ---------- */
  const dt = (off, h) => { const d = new Date(HOY); d.setDate(d.getDate() + off); return `${isoD(d)}T${h}`; };
  const vigenteEn = (a, f) => a.vIni <= f && (!a.vFin || a.vFin >= f);
  function seedAgendas() {
    let base;
    if (M5 && M5.turnos) base = M5.turnos.map(t => ({ id: t.id, prof: t.prof, c: t.c, dia: t.dia, ini: t.inicio, fin: t.fin }));
    else { base = []; let id = 1; const LV = DIAS.slice(0, 5), T = (c, dias, ini, fin, prof) => dias.forEach(d => base.push({ id: id++, prof, c, dia: d, ini, fin }));
      T(1, LV, '07:00', '12:00', 1); T(1, ['Lunes', 'Miércoles', 'Viernes'], '14:00', '18:00', 6); T(1, ['Sábado'], '08:00', '13:00', 1); T(2, ['Martes', 'Jueves'], '08:00', '17:00', 2); T(2, ['Lunes'], '14:00', '18:00', 9);
      T(3, LV, '08:00', '16:00', 5); T(3, ['Sábado'], '08:00', '12:00', 5); T(4, ['Miércoles'], '09:00', '13:00', 3); T(4, ['Jueves'], '14:00', '18:00', 3); T(5, ['Lunes', 'Martes', 'Jueves'], '14:00', '18:00', 4);
      T(5, ['Miércoles'], '14:00', '18:00', 10); T(6, LV, '08:00', '12:00', 7); T(9, ['Lunes', 'Miércoles', 'Viernes'], '08:00', '13:00', 9); T(10, ['Martes', 'Jueves'], '14:00', '18:00', 6); }
    const dur = { 2: 20, 3: 45, 5: 40 }; return base.map(t => ({ ...t, dur: dur[t.prof] || 30, vIni: '2026-01-01', vFin: t.id % 5 === 0 ? '2026-12-31' : null, estado: 'Publicada' }));
  }
  const AGENDAS = (M6 && M6.agendas) ? M6.agendas : seedAgendas();
  const BLOQS = (M6 && M6.bloqueos) ? M6.bloqueos : [{ prof: 3, ini: dt(-1, '00:00'), fin: dt(3, '23:59') }, { prof: 2, ini: dt(8, '00:00'), fin: dt(22, '23:59') }, { prof: 4, ini: dt(-2, '08:00'), fin: dt(-2, '18:00') }, { prof: 6, ini: dt(2, '14:00'), fin: dt(2, '16:00') }];
  const bloqueado = (prof, s, e) => BLOQS.some(b => b.prof === prof && s < new Date(b.fin).getTime() && e > new Date(b.ini).getTime());
  const hashOcup = (id, f, m) => ((id * 131 + parseInt(f.replace(/-/g, ''), 10) * 17 + m * 7) % 100) < 38;
  function generarCitas() {
    const out = [], activos = PACS.filter(p => p.estado === 'Activo'), usadoPD = new Set(), usadoPT = new Set(); let id = 1; const hoy = isoD(HOY), nm = AHORA.getHours() * 60 + AHORA.getMinutes();
    for (let off = -2; off <= 7; off++) {
      const d = new Date(HOY); d.setDate(d.getDate() + off); const f = isoD(d), dia = diaDe(f);
      AGENDAS.filter(a => a.estado === 'Publicada' && a.dia === dia && vigenteEn(a, f) && consDe(a.c)).forEach(a => {
        for (let m = toMin(a.ini); m + a.dur <= toMin(a.fin); m += a.dur) {
          if (!hashOcup(a.id, f, m)) continue; const s = parseD(f).getTime() + m * 6e4; if (bloqueado(a.prof, s, s + a.dur * 6e4)) continue;
          let pac = null; const k = (id * 5 + m) % activos.length; for (let t = 0; t < activos.length; t++) { const p = activos[(k + t) % activos.length]; if (!usadoPD.has(`${p.id}|${a.prof}|${f}`) && !usadoPT.has(`${p.id}|${f}|${m}`)) { pac = p; break; } }
          if (!pac) continue; usadoPD.add(`${pac.id}|${a.prof}|${f}`); usadoPT.add(`${pac.id}|${f}|${m}`);
          const h = Math.abs(a.id * 31 + m * 3 + off * 17) % 100; let estado, checkin = null, motivo = '';
          if (f < hoy) estado = h % 9 === 0 ? 'Inasistencia' : h % 11 === 0 ? 'Cancelada' : 'Atendida'; else if (f > hoy) estado = h % 13 === 0 ? 'Cancelada' : 'Programada';
          else estado = m + a.dur < nm ? (h % 7 === 0 ? 'Inasistencia' : 'Atendida') : m <= nm ? 'En Consulta' : m <= nm + 60 ? 'En Sala de Espera' : 'Programada';
          if (estado === 'Cancelada') motivo = 'Solicitud del paciente'; if (['Atendida', 'En Consulta'].includes(estado)) checkin = isoDT(new Date(s - 10 * 6e4)); if (estado === 'En Sala de Espera') checkin = isoDT(new Date(AHORA.getTime() - (5 + h % 20) * 6e4));
          out.push({ id: id++, prof: a.prof, c: a.c, pac: pac.id, fecha: f, hora: hm(m), tipo: ['Primera vez', 'Control', 'Valoración'][h % 3], estado, motivoCanc: motivo, checkin });
        }
      });
    }
    return out;
  }
  function seedHistorial(citas) {
    const us = ['Camila Ortiz (Recepción)', 'María Ruiz (Admin IPS)', 'Luis Cruz (Recepción)'];
    return citas.filter(c => c.estado === 'Programada' && c.fecha > isoD(HOY)).slice(0, 7).map((c, i) => { const a = parseD(c.fecha); a.setDate(a.getDate() - (i % 3 + 1)); const r = new Date(HOY); r.setDate(r.getDate() - (i % 4 + 1)); r.setHours(9 + i, 10 + i * 4);
      return { id: i + 1, cita: c.id, ant: `${isoD(a)}T${c.hora}`, nueva: `${c.fecha}T${c.hora}`, usuario: us[i % 3], registro: isoDT(r) }; });
  }
  let DB7 = leer('saludsync_modulo7_v1'); if (!(DB7 && DB7.citas)) { const c = generarCitas(); DB7 = { citas: c, historial: seedHistorial(c) }; }
  const guardar7 = () => { try { sessionStorage.setItem('saludsync_modulo7_v1', JSON.stringify(DB7)); } catch (e) { } };
  const EC = { 'Programada': 'Programada', 'En Sala de Espera': 'Sala', 'En Consulta': 'Consulta', 'Atendida': 'Atendida', 'Inasistencia': 'Inasistencia', 'Cancelada': 'Cancelada' };
  const ORDEN_E = ['Programada', 'En Sala de Espera', 'En Consulta', 'Atendida', 'Inasistencia', 'Cancelada'];
  const hoyISO = isoD(HOY);
  // Equivalente a la vista vw_kpi_citas_dia (por institución y fecha)
  const vwKpi = f => { const cs = DB7.citas.filter(c => c.fecha === f); return { total: cs.length, atendidas: cs.filter(c => c.estado === 'Atendida').length, canceladas: cs.filter(c => c.estado === 'Cancelada').length, inasistencias: cs.filter(c => c.estado === 'Inasistencia').length }; };
  const delta = (a, b, mejorSube) => { if (!b) return '<span class="delta neutro">sin dato de ayer</span>'; const d = (a - b) / b * 100, sube = d >= 0, bien = mejorSube ? sube : !sube; return `<span class="delta ${Math.abs(d) < .5 ? 'neutro' : bien ? 'bien' : 'mal'}">${sube ? '▲' : '▼'} ${Math.abs(d).toFixed(0)} %</span> <span class="kpi-s">vs. ayer</span>`; };
  const kpi = (l, n, cls, ico, sub) => `<div class="col-6 col-lg-3"><div class="kpi-dash ${cls}"><span class="kpi-ico">${ico}</span><div class="kpi-n">${n}</div><div class="kpi-l">${l}</div><div>${sub || ''}</div></div></div>`;

  /* =====================================================
     PANTALLA 15.1 · Dashboard Admin IPS
     ===================================================== */
  function initAdmin() {
    if (document.body.dataset.page !== 'dashboard_admin' || !acceso([1, 2])) return;
    let sede = 0; reloj(); setInst();
    $('#selSede').innerHTML = '<option value="0">Todas las sedes</option>' + SEDES.map(s => `<option value="${s.id}">${esc(s.nombre)}</option>`).join(''); $('#selSede').addEventListener('change', e => { sede = +e.target.value; render(); });
    $('#leyenda').innerHTML = ORDEN_E.map(e => `<span class="e-${EC[e]}"><span class="dot-e"></span>${e}</span>`).join('');
    const delSede = c => !sede || (consDe(c.c) && consDe(c.c).sede === sede);

    function render() {
      const hoy = DB7.citas.filter(c => c.fecha === hoyISO && delSede(c)), ayer = vwKpi(addDias(hoyISO, -1)), v = vwKpi(hoyISO), n = e => hoy.filter(c => c.estado === e).length;
      const tot = sede ? hoy.length : v.total, at = sede ? n('Atendida') : v.atendidas, ia = sede ? n('Inasistencia') : v.inasistencias, ca = sede ? n('Cancelada') : v.canceladas;
      $('#kpis').innerHTML = kpi('Citas del día', fmtN(tot), '', '📅', delta(tot, sede ? 0 : ayer.total, true) + ` <span class="kpi-s">· ${fmtN(ca)} canceladas</span>`) + kpi('Pacientes en sala de espera', fmtN(n('En Sala de Espera')), 'k-info', '🪑', `<span class="kpi-s">${n('En Consulta')} en consulta ahora</span>`)
        + kpi('Atenciones completadas', fmtN(at), 'k-green', '✅', `<span class="kpi-s">${(at / Math.max(1, tot) * 100).toFixed(0)} % de las citas del día</span>`) + kpi('Inasistencias', fmtN(ia), ia / Math.max(1, at + ia) > .14 ? 'k-red' : 'k-warn', '🚫', delta(ia, sede ? 0 : ayer.inasistencias, false));

      // Actividad por hora
      const horas = []; for (let h = 7; h <= 18; h++) horas.push(h); const porH = {}; horas.forEach(h => porH[h] = hoy.filter(c => +c.hora.slice(0, 2) === h)); const max = Math.max(1, ...horas.map(h => porH[h].length));
      $('#tablaHoras').innerHTML = horas.map(h => { const cs = porH[h], c = e => cs.filter(x => x.estado === e).length;
        return `<tr class="fila-hora ${h === AHORA.getHours() ? 'actual' : ''}" data-h="${h}"><td>${pad(h)}:00</td><td><div class="stack-h" style="width:${Math.max(8, cs.length / max * 100)}%">${ORDEN_E.map(e => c(e) ? `<span class="e-${EC[e]}" style="width:${c(e) / cs.length * 100}%" title="${e}: ${c(e)}"></span>` : '').join('')}</div></td>
          <td><strong>${cs.length}</strong></td><td>${c('En Sala de Espera') || '—'}</td><td>${c('Atendida') || '—'}</td><td>${c('Inasistencia') || '—'}</td></tr>`; }).join('');

      // Citas por día (SVG apilado)
      const dias = [-2, -1, 0, 1, 2, 3, 4].map(o => { const f = addDias(hoyISO, o), cs = DB7.citas.filter(c => c.fecha === f && delSede(c)); return { f, A: cs.filter(c => c.estado === 'Atendida').length, I: cs.filter(c => c.estado === 'Inasistencia').length, C: cs.filter(c => c.estado === 'Cancelada').length, P: cs.filter(c => ['Programada', 'En Sala de Espera', 'En Consulta'].includes(c.estado)).length }; });
      const W = 360, H = 190, pl = 8, pb = 24, pt = 14, mx = Math.max(1, ...dias.map(d => d.A + d.I + d.C + d.P)), bw = 30, paso = (W - pl * 2) / dias.length, col = { A: '#1c9a6c', I: '#d9534f', C: '#9aa6b2', P: '#0b5cab' };
      $('#graficoDias').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Citas por día">${dias.map((d, i) => { let y = H - pb; const x = pl + i * paso + (paso - bw) / 2, tot = d.A + d.I + d.C + d.P; return `<g>${['A', 'I', 'C', 'P'].map(k => { const h = (H - pt - pb) * d[k] / mx; y -= h; return h ? `<rect x="${x}" y="${y}" width="${bw}" height="${h}" fill="${col[k]}" rx="2"><title>${fmtFC(d.f)} · ${{ A: 'Atendidas', I: 'Inasistencias', C: 'Canceladas', P: 'Programadas/En curso' }[k]}: ${d[k]}</title></rect>` : ''; }).join('')}<text class="svg-val" x="${x + bw / 2}" y="${y - 3}" text-anchor="middle">${tot}</text><text class="svg-txt" x="${x + bw / 2}" y="${H - 8}" text-anchor="middle" ${d.f === hoyISO ? 'style="font-weight:800;fill:#0b5cab"' : ''}>${d.f === hoyISO ? 'Hoy' : parseD(d.f).toLocaleDateString('es-CO', { weekday: 'short' })}</text></g>`; }).join('')}</svg>`;

      // Consultorios
      const lista = CONS.filter(c => !sede || c.sede === sede), estadoC = c => { if (c.estado === 'En Mantenimiento') return { k: 'mant', t: 'Mantenimiento' }; if (c.estado === 'Inactivo') return { k: 'off', t: 'Inactivo' }; const ocup = DB7.citas.find(x => x.fecha === hoyISO && x.c === c.id && x.estado === 'En Consulta'); return ocup ? { k: 'ocupado', t: 'Ocupado', cita: ocup } : { k: 'libre', t: 'Libre' }; };
      const cnt = k => lista.filter(c => estadoC(c).k === k).length; $('#resumenCons').innerHTML = `<span><span class="est-cons ec-ocupado">Ocupados ${cnt('ocupado')}</span></span><span><span class="est-cons ec-libre">Libres ${cnt('libre')}</span></span><span><span class="est-cons ec-mant">Mantenimiento ${cnt('mant')}</span></span><span><span class="est-cons ec-off">Inactivos ${cnt('off')}</span></span>`;
      $('#chipsSede').innerHTML = [{ id: 0, nombre: 'Todas' }, ...SEDES].map(s => `<span class="chip-sede ${sede === s.id ? 'activo' : ''}" data-s="${s.id}">${esc(s.nombre)}</span>`).join('');
      $('#gridCons').innerHTML = lista.map(c => { const e = estadoC(c), prox = DB7.citas.filter(x => x.fecha === hoyISO && x.c === c.id && ['Programada', 'En Sala de Espera'].includes(x.estado)).sort((a, b) => a.hora.localeCompare(b.hora))[0];
        return `<div class="col-6 col-md-4 col-xl-3"><div class="cons-card cons-${e.k}" data-c="${c.id}" role="button" tabindex="0"><div class="d-flex justify-content-between align-items-start"><span class="cod">${esc(c.codigo)}</span><span class="est-cons ec-${e.k}">${e.t}</span></div><div class="small text-muted">${esc(c.nombre)} · ${esc(sedeDe(c.sede).nombre)}</div>
          <div class="small mt-2">${e.k === 'ocupado' ? `👤 <strong>${esc(pacDe(e.cita.pac).nombre)}</strong><br>🩺 ${esc((profDe(e.cita.prof) || { corto: '—' }).corto)}` : e.k === 'libre' ? (prox ? `Próxima cita: <strong>${prox.hora}</strong>` : 'Sin más citas hoy') : '<span class="text-muted">Fuera de servicio</span>'}</div></div></div>`; }).join('');
      marcaAct();
    }
    $('#tablaHoras').addEventListener('click', e => { const tr = e.target.closest('[data-h]'); if (!tr) return; const h = +tr.dataset.h, cs = DB7.citas.filter(c => c.fecha === hoyISO && +c.hora.slice(0, 2) === h && delSede(c)).sort((a, b) => a.hora.localeCompare(b.hora));
      $('#horaTitulo').textContent = `Citas de ${pad(h)}:00 a ${pad(h)}:59`; $('#horaCuerpo').innerHTML = cs.length ? cs.map(c => `<div class="item-lista"><span class="hora-badge">${c.hora}</span><div class="flex-grow-1"><strong>${esc(pacDe(c.pac).nombre)}</strong><div class="small text-muted">${esc((profDe(c.prof) || { corto: '—' }).corto)} · ${esc((consDe(c.c) || { codigo: '—' }).codigo)}</div></div><span class="e-${EC[c.estado]}"><span class="dot-e"></span><small>${c.estado}</small></span></div>`).join('') : '<p class="text-muted mb-0">Sin citas en esta franja.</p>'; modal('modalHora').show(); });
    const abrirCons = el => { const c = consDe(+el.dataset.c), cs = DB7.citas.filter(x => x.fecha === hoyISO && x.c === c.id).sort((a, b) => a.hora.localeCompare(b.hora));
      $('#consTitulo').textContent = `${c.codigo} · ${c.nombre}`; $('#consCuerpo').innerHTML = `<p class="small text-muted">${esc(sedeDe(c.sede).nombre)} · estado operativo: <strong>${c.estado}</strong></p>` + (cs.length ? cs.map(x => `<div class="item-lista"><span class="hora-badge">${x.hora}</span><div class="flex-grow-1"><strong>${esc(pacDe(x.pac).nombre)}</strong><div class="small text-muted">${esc((profDe(x.prof) || { corto: '—' }).corto)}</div></div><span class="e-${EC[x.estado]}"><span class="dot-e"></span><small>${x.estado}</small></span></div>`).join('') : '<p class="text-muted mb-0">Sin citas hoy en este consultorio.</p>'); modal('modalCons').show(); };
    $('#gridCons').addEventListener('click', e => { const c = e.target.closest('[data-c]'); if (c) abrirCons(c); }); $('#gridCons').addEventListener('keydown', e => { if (e.key === 'Enter') { const c = e.target.closest('[data-c]'); if (c) abrirCons(c); } });
    $('#chipsSede').addEventListener('click', e => { const c = e.target.closest('[data-s]'); if (c) { sede = +c.dataset.s; $('#selSede').value = sede; render(); } });
    $('#btnActualizar').addEventListener('click', e => { const unlock = SS.lock(e.currentTarget, 'Actualizando…'); setTimeout(() => { render(); unlock(); SS.toast('Dashboard actualizado.', 'secondary'); }, 600); });
    render(); setInterval(render, 30000);
  }

  /* =====================================================
     PANTALLA 15.2 · Dashboard Médico
     ===================================================== */
  const addIntervalo = (iso, int) => { const d = parseD(iso); if (int === '15 días') d.setDate(d.getDate() + 15); else { const m = { '1 mes': 1, '3 meses': 3, '6 meses': 6 }[int], dia = d.getDate(); d.setMonth(d.getMonth() + m); if (d.getDate() !== dia) d.setDate(0); } return isoD(d); };
  const diasPara = p => Math.round((parseD(p) - HOY) / 864e5);
  const CIE_MIN = { 'I10': 'Hipertensión esencial (primaria)', 'E11.9': 'Diabetes mellitus tipo 2', 'G43.9': 'Migraña', 'M54.5': 'Lumbago no especificado' };
  function alertasSeg(profId) {
    let lista;
    if (M12 && M12.seguimientos) { const dx = (M10 && M10.diagnosticos) || []; lista = M12.seguimientos.map(s => ({ pac: s.pac, prof: s.prof, proximo: s.proximo, cie: (dx.find(d => d.id === s.dx) || {}).cie || '' })); }
    else lista = [[6, 'I10', '1 mes', 12, 1], [5, 'I10', '1 mes', 26, 6], [5, 'E11.9', '3 meses', 40, 6], [3, 'G43.9', '3 meses', 98, 3], [1, 'M54.5', '15 días', 10, 1], [2, 'E11.9', '3 meses', 75, 6], [9, 'G43.9', '1 mes', 45, 9]]
      .map(([pac, cie, int, hace, prof]) => ({ pac, cie, prof, proximo: addIntervalo(addDias(hoyISO, -hace), int) }));
    return lista.filter(s => s.prof === profId && diasPara(s.proximo) <= 7).sort((a, b) => a.proximo.localeCompare(b.proximo));
  }
  function initMedico() {
    if (document.body.dataset.page !== 'dashboard_medico' || !acceso([1, 2, 3])) return; reloj(); setInst();
    const propio = ROL === 3 ? PROFS.find(p => p.uid === SES.id) : null, activos = PROFS.filter(p => p.estado === 'Activo'), n = id => DB7.citas.filter(c => c.prof === id && c.fecha === hoyISO).length;
    let profSel = propio ? propio.id : activos.slice().sort((a, b) => n(b.id) - n(a.id))[0].id;
    $('#selProf').innerHTML = activos.map(p => `<option value="${p.id}">${esc(p.nombre)} (${n(p.id)} citas hoy)</option>`).join(''); $('#selProf').value = profSel; $('#selProf').disabled = !!propio; $('#ayudaProf').textContent = propio ? 'Sesión iniciada como este profesional.' : 'Modo demostración: elija el médico a visualizar.';
    $('#selProf').addEventListener('change', e => { profSel = +e.target.value; render(); });
    const wCls = m => m > 30 ? 'w-alto' : m > 15 ? 'w-med' : 'w-ok';

    function iniciar(cita, boton) {
      const unlock = SS.lock(boton, 'Iniciando…');
      setTimeout(() => {
        const c = DB7.citas.find(x => x.id === cita);
        if (c.estado !== 'En Sala de Espera') { unlock(); SS.toast('La cita ya no está en sala de espera.', 'danger'); render(); return; }
        if (DB7.citas.some(x => x.prof === c.prof && x.fecha === hoyISO && x.estado === 'En Consulta')) { unlock(); SS.toast('Ya tiene una atención en curso.', 'danger'); render(); return; }
        c.estado = 'En Consulta'; guardar7(); auditar('cita_medica', c.id, 'Modificación', { estado: 'En Sala de Espera' }, { estado: 'En Consulta' }); SS.toast('Atención iniciada. Abriendo el formulario clínico…'); setTimeout(() => { location.href = `../atencion/formulario_consulta.html?cita=${c.id}`; }, 600);
      }, 700);
    }
    function render() {
      const p = profDe(profSel), mias = DB7.citas.filter(c => c.prof === profSel && c.fecha === hoyISO).sort((a, b) => a.hora.localeCompare(b.hora)), cola = mias.filter(c => c.estado === 'En Sala de Espera').sort((a, b) => (a.checkin || a.hora).localeCompare(b.checkin || b.hora)), curso = mias.find(c => c.estado === 'En Consulta');
      const h = AHORA.getHours(); $('#saludo').textContent = `${h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'}, ${p.corto}`;
      const noCanc = mias.filter(c => c.estado !== 'Cancelada'), c = e => mias.filter(x => x.estado === e).length;
      $('#kpis').innerHTML = kpi('Citas asignadas hoy', noCanc.length, '', '📅', `<span class="kpi-s">${c('Programada')} por llegar</span>`) + kpi('Atendidas', c('Atendida'), 'k-green', '✅', `<span class="kpi-s">${noCanc.length ? (c('Atendida') / noCanc.length * 100).toFixed(0) : 0} % del día</span>`) + kpi('En espera', cola.length, 'k-info', '🪑', `<span class="kpi-s">${curso ? '1 en consulta' : 'consultorio libre'}</span>`) + kpi('Inasistencias', c('Inasistencia'), c('Inasistencia') ? 'k-red' : 'k-green', '🚫', '');

      // Paciente en turno (RF-DSH-02/03)
      const cardTurno = (cita, modo) => { const pa = pacDe(cita.pac), al = alergias(pa.id), w = cita.checkin ? minDesde(cita.checkin) : 0, co = consDe(cita.c) || { codigo: '—' };
        return `<div class="turno-card ${modo === 'curso' ? 'en-curso' : ''}"><div class="d-flex flex-wrap align-items-center gap-3"><div class="turno-av">${esc((pa.nombre.split(' ')[0][0] + pa.nombre.split(' ').slice(-1)[0][0]).toUpperCase())}</div>
          <div class="flex-grow-1"><div class="small text-uppercase fw-bold text-muted">${modo === 'curso' ? '🩺 Atención en curso' : '👋 Paciente en turno'}</div><div class="h4 fw-bold mb-0">${esc(pa.nombre)}</div><div class="small text-muted">${esc(pa.tipo)} ${esc(pa.doc)} · ${edadTxt(pa.nac)} · ${esc(pa.sexo)} · Cita ${cita.hora} · ${esc(cita.tipo)} · ${esc(co.codigo)}</div>
            ${modo === 'turno' ? `<span class="espera-chip ${wCls(w)} mt-1 d-inline-block">⏱ ${w} min en espera</span>` : ''}</div>
          <div>${modo === 'curso' ? `<a href="../atencion/formulario_consulta.html?cita=${cita.id}" class="btn btn-warning btn-iniciar">📝 Continuar atención</a>` : `<button type="button" class="btn btn-success btn-iniciar" data-ini="${cita.id}">▶ Iniciar Atención Médica</button>`}</div></div>
          ${al.length ? `<div class="alerta-alergia mt-3">⚠ ALERGIAS: ${al.map(esc).join(' · ')}</div>` : ''}</div>`; };
      $('#turno').innerHTML = curso ? cardTurno(curso, 'curso') : cola[0] ? cardTurno(cola[0], 'turno') : `<div class="turno-card vacio text-center"><div class="display-6">☕</div><div class="h5 mb-1">Sin pacientes en espera</div><div class="text-muted small">${(() => { const nx = mias.find(x => x.estado === 'Programada'); return nx ? `Próxima cita programada a las <strong>${nx.hora}</strong> con ${esc(pacDe(nx.pac).nombre)}.` : 'No tiene más citas programadas hoy.'; })()}</div></div>`;
      $('#nCola').textContent = `${cola.length} paciente(s)`;
      $('#cola').innerHTML = cola.length ? cola.map((x, i) => { const w = minDesde(x.checkin || isoDT(new Date())); return `<div class="item-lista"><span class="hora-badge">${i + 1}</span><div class="flex-grow-1"><strong>${esc(pacDe(x.pac).nombre)}</strong>${alergias(x.pac).length ? ' <span class="badge bg-danger">⚠ alergias</span>' : ''}<div class="small text-muted">Cita ${x.hora} · ${esc(x.tipo)}</div></div><span class="espera-chip ${wCls(w)}">⏱ ${w} min</span></div>`; }).join('') : '<p class="text-muted my-2">La sala de espera está vacía.</p>';

      // Próximas citas
      const prox = DB7.citas.filter(x => x.prof === profSel && x.estado === 'Programada' && (x.fecha > hoyISO || x.fecha === hoyISO)).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora)).slice(0, 6);
      $('#proximas').innerHTML = prox.length ? prox.map(x => `<div class="item-lista"><span class="hora-badge">${x.hora}</span><div class="flex-grow-1"><strong>${esc(pacDe(x.pac).nombre)}</strong><div class="small text-muted">${x.fecha === hoyISO ? 'Hoy' : fmtFC(x.fecha)} · ${esc(x.tipo)} · ${esc((consDe(x.c) || { codigo: '—' }).codigo)}</div></div></div>`).join('') : '<p class="text-muted my-2">No hay citas programadas próximas.</p>';

      // Alertas de seguimiento
      const al = alertasSeg(profSel); $('#alertasSeg').innerHTML = al.length ? al.map(s => { const d = diasPara(s.proximo), pa = pacDe(s.pac); return `<div class="alerta-seg ${d < 0 ? 'venc' : ''}"><div class="d-flex justify-content-between gap-2"><strong>${esc(pa ? pa.nombre : '—')}</strong><span class="rel ${d < 0 ? 'text-danger' : 'text-warning-emphasis'}">${d < 0 ? `Vencido hace ${Math.abs(d)} d` : d === 0 ? 'Vence hoy' : `Vence en ${d} d`}</span></div>
        <div class="small text-muted">${s.cie ? `<span class="cie-code">${esc(s.cie)}</span> ${esc(CIE_MIN[s.cie] || '')} · ` : ''}Control límite: ${fmtF(s.proximo)}</div></div>`; }).join('') : '<p class="text-muted mb-0">✔ Sin controles por vencer para este profesional.</p>';
      marcaAct();
    }
    $('#turno').addEventListener('click', e => { const b = e.target.closest('[data-ini]'); if (b && !b.disabled) iniciar(+b.dataset.ini, b); });
    $('#btnActualizar').addEventListener('click', e => { const unlock = SS.lock(e.currentTarget, 'Actualizando…'); setTimeout(() => { render(); unlock(); SS.toast('Dashboard actualizado.', 'secondary'); }, 600); });
    render(); setInterval(render, 30000);
  }

  /* =====================================================
     PANTALLA 15.3 · Dashboard SuperAdmin
     ===================================================== */
  const PLAN_NOM = { 1: 'Básico', 2: 'Profesional', 3: 'Empresarial' }, PLAN_TAR = { 1: 350000, 2: 890000, 3: 2100000 };
  const INST_SEED = [[1, 'Clínica Santa Lucía S.A.S.', 'Bucaramanga', 'Activa'], [2, 'IPS Vida Plena Ltda.', 'Girón', 'Activa'], [3, 'Centro Médico Los Andes', 'Medellín', 'Activa'], [4, 'Clínica del Norte S.A.', 'Cúcuta', 'Inactiva'], [5, 'Salud Integral del Caribe IPS', 'Barranquilla', 'Activa'],
    [6, 'Odontología Sonrisa Sana S.A.S.', 'Bogotá', 'Activa'], [7, 'Laboratorio Clínico Aurora', 'Cali', 'Activa'], [8, 'Hospital Local San Rafael', 'Floridablanca', 'Activa'], [9, 'IPS Familiar Esperanza', 'Cartagena', 'Activa'], [10, 'Centro de Especialistas Cordillera', 'Bogotá', 'Activa'],
    [11, 'Clínica Pediátrica Arcoíris', 'Envigado', 'Activa'], [12, 'Unidad Médica Horizonte', 'Piedecuesta', 'Inactiva']].map(([id, razon, ciudad, estado]) => ({ id, razon, ciudad, estado }));
  const SUS_SEED = [[1, 2, '2026-01-20', '2027-01-20'], [2, 1, '2025-11-02', '2026-11-02'], [3, 3, '2026-03-10', '2027-03-10'], [4, 2, '2025-09-30', '2026-09-30'], [5, 3, '2026-01-01', '2026-12-31'], [6, 1, '2025-10-25', '2026-10-25'], [7, 1, '2026-02-14', '2027-02-14'],
    [8, 2, '2025-12-05', '2026-12-05'], [9, 1, '2025-10-10', '2026-10-10'], [10, 3, '2026-04-01', '2027-04-01'], [11, 2, '2025-11-12', '2026-11-12'], [12, 2, '2026-01-05', '2027-01-05']].map(([inst, plan, inicio, corte]) => ({ inst, plan, inicio, corte }));
  function plataforma() {
    const insts = ((M1 && M1.instituciones) ? M1.instituciones.map(i => ({ id: i.id, razon: i.razon, ciudad: i.ciudad, estado: i.estado })) : INST_SEED), sus = (M1 && M1.suscripciones) ? M1.suscripciones : SUS_SEED, planes = (M1 && M1.planes) ? M1.planes : null;
    const tarifa = id => (planes && (planes.find(p => p.id === id) || {}).tarifa) || PLAN_TAR[id], nomPlan = id => (planes && (planes.find(p => p.id === id) || {}).nombre) || PLAN_NOM[id];
    const medReal = (M4 && M4.profesionales) ? M4.profesionales.filter(p => p.estado === 'Activo').length : PROFS.filter(p => p.estado === 'Activo').length, pacReal = PACS.filter(p => p.estado === 'Activo').length;
    return insts.map(i => { const s = sus.find(x => x.inst === i.id), d = s ? Math.round((parseD(s.corte) - HOY) / 864e5) : null, plan = s ? s.plan : 0;
      const med = i.id === INST.id ? medReal : plan === 1 ? 3 + (i.id * 7) % 3 : plan === 2 ? 8 + (i.id * 5) % 9 : 30 + (i.id * 11) % 41, pac = i.id === INST.id ? pacReal : plan === 1 ? 120 + (i.id * 97) % 330 : plan === 2 ? 800 + (i.id * 233) % 2700 : 8000 + (i.id * 1811) % 22000;
      return { ...i, plan, planN: s ? nomPlan(plan) : 'Sin plan', tarifa: s ? tarifa(plan) : 0, corte: s ? s.corte : null, dias: d, estSus: !s ? 'Sin plan' : d < 0 ? 'Vencida' : d <= 30 ? 'Por vencer' : 'Vigente', pago: !s ? '—' : d < 0 ? 'Mora' : d <= 5 ? 'Pendiente' : 'Pagada', registro: addDias(hoyISO, -(30 + (i.id * 83) % 420)), med, pac }; });
  }
  function initSuper() {
    if (document.body.dataset.page !== 'dashboard_superadmin' || !acceso([1])) return; reloj();
    function render() {
      const L = plataforma(), act = L.filter(i => i.estado === 'Activa'), renovar = L.filter(i => i.dias !== null && i.dias <= 30 && i.estado === 'Activa').sort((a, b) => a.dias - b.dias), mrr = act.filter(i => i.dias !== null && i.dias >= 0).reduce((a, i) => a + i.tarifa, 0);
      $('#kpis').innerHTML = [['Instituciones activas', fmtN(act.length), '', '🏥', `<span class="kpi-s">${L.length - act.length} inactiva(s)</span>`], ['Total de médicos', fmtN(act.reduce((a, i) => a + i.med, 0)), 'k-green', '👨‍⚕️', '<span class="kpi-s">en instituciones activas</span>'], ['Pacientes registrados', fmtN(act.reduce((a, i) => a + i.pac, 0)), 'k-info', '🧑‍🤝‍🧑', '<span class="kpi-s">en toda la plataforma</span>'],
        ['Suscripciones por renovar', fmtN(renovar.length), renovar.length ? 'k-warn' : 'k-green', '🔔', '<span class="kpi-s">vencen en ≤ 30 días o vencidas</span>'], ['Ingreso mensual recurrente', COP(mrr), 'k-purple', '💰', '<span class="kpi-s">suscripciones vigentes</span>']]
        .map(([l, n, c, i, s]) => `<div class="col-6 col-lg"><div class="kpi-dash ${c}"><span class="kpi-ico">${i}</span><div class="kpi-n" style="font-size:${n.length > 11 ? '1.5rem' : '2.1rem'}">${n}</div><div class="kpi-l">${l}</div><div>${s}</div></div></div>`).join('');

      // Distribución por plan
      const cuenta = { 1: 0, 2: 0, 3: 0 }, ing = { 1: 0, 2: 0, 3: 0 }; act.filter(i => i.plan).forEach(i => { cuenta[i.plan]++; ing[i.plan] += i.tarifa; }); const tot = Object.values(cuenta).reduce((a, b) => a + b, 0) || 1, col = { 1: '#0b5cab', 2: '#1c9a6c', 3: '#8e44ad' }, R_ = 46, C_ = 2 * Math.PI * R_; let acc = 0;
      $('#donut').innerHTML = `<svg viewBox="0 0 120 120" role="img" aria-label="Suscripciones por plan"><circle cx="60" cy="60" r="${R_}" fill="none" stroke="#e9eef3" stroke-width="16"/>${[1, 2, 3].filter(k => cuenta[k]).map(k => { const len = cuenta[k] / tot * C_, s = `<circle cx="60" cy="60" r="${R_}" fill="none" stroke="${col[k]}" stroke-width="16" stroke-dasharray="${len} ${C_ - len}" stroke-dashoffset="${-acc}" transform="rotate(-90 60 60)"/>`; acc += len; return s; }).join('')}<text x="60" y="62" text-anchor="middle" class="donut-centro">${tot}</text><text x="60" y="75" text-anchor="middle" class="donut-sub">suscripciones</text></svg>`;
      $('#barrasPlan').innerHTML = [1, 2, 3].map(k => `<div class="plan-barra"><div class="top"><span><strong>${PLAN_NOM[k]}</strong> · ${cuenta[k]} <small class="text-muted">(${(cuenta[k] / tot * 100).toFixed(0)} %)</small></span><span class="small text-muted">${COP(ing[k])}/mes</span></div><div class="pb-track"><div class="pb-fill pb-${k}" style="width:${cuenta[k] / tot * 100}%"></div></div></div>`).join('');

      $('#nRenovar').textContent = renovar.length;
      $('#tablaRenovar').innerHTML = renovar.length ? renovar.map(i => `<tr><td><strong>${esc(i.razon)}</strong><span class="cell-sub">${esc(i.ciudad)}</span></td><td>${esc(i.planN)}</td><td>${fmtF(i.corte)}<span class="cell-sub">${i.dias < 0 ? 'Vencida hace ' + Math.abs(i.dias) + ' d' : 'En ' + i.dias + ' d'}</span></td><td><span class="est-susc es-${i.estSus.replace(/\s/g, '')}">${i.estSus}</span></td>
        <td class="text-end"><button class="btn btn-sm btn-outline-primary" data-rec="${i.id}">🔔 Recordar</button></td></tr>`).join('') : '<tr><td colspan="5" class="text-center text-muted py-3">✔ No hay suscripciones por renovar.</td></tr>';
      $('#tablaClinicas').innerHTML = L.slice().sort((a, b) => b.registro.localeCompare(a.registro)).slice(0, 6).map(i => `<tr><td><strong>${esc(i.razon)}</strong><span class="cell-sub">${esc(i.ciudad)} · ${i.estado}</span></td><td>${esc(i.planN)}</td><td>${fmtF(i.registro)}</td><td>${fmtN(i.med)}</td><td>${fmtN(i.pac)}</td>
        <td><span class="est-susc es-${i.estSus.replace(/\s/g, '')}">${i.estSus}</span>${i.corte ? `<span class="cell-sub">Corte ${fmtF(i.corte)}</span>` : ''}</td><td>${i.pago === '—' ? '—' : `<span class="est-pago ep-${i.pago}">${i.pago}</span>`}</td><td class="text-end"><button class="btn btn-sm btn-outline-secondary" data-aud="${i.id}" title="Ver auditoría">🔍 Auditar</button></td></tr>`).join('');
    }
    $('#tablaRenovar').addEventListener('click', e => { const b = e.target.closest('[data-rec]'); if (!b) return; const unlock = SS.lock(b, 'Enviando…'); const i = plataforma().find(x => x.id === +b.dataset.rec); setTimeout(() => { unlock(); b.textContent = '✔ Enviado'; b.disabled = true; SS.toast(`Recordatorio de renovación enviado a ${i.razon}.`); }, 700); });
    $('#tablaClinicas').addEventListener('click', e => { const b = e.target.closest('[data-aud]'); if (!b) return; const i = plataforma().find(x => x.id === +b.dataset.aud), unlock = SS.lock(b, '…');
      setTimeout(() => { unlock(); const m2 = leer('saludsync_modulo2_v1'), logs = (m2 && m2.auditoria ? m2.auditoria : []).slice(0, 8);
        $('#auditTitulo').textContent = `Auditoría · ${i.razon}`; $('#auditCuerpo').innerHTML = `<div class="small mb-3"><strong>Plan:</strong> ${esc(i.planN)} · <strong>Registro:</strong> ${fmtF(i.registro)} · <strong>Médicos:</strong> ${fmtN(i.med)} · <strong>Pacientes:</strong> ${fmtN(i.pac)}</div><h3 class="h6">Actividad reciente de la plataforma</h3>` +
          (logs.length ? logs.map(a => `<div class="audit-item"><strong>${esc(a.accion)}</strong> en <code>${esc(a.tabla)}</code> #${a.registro}<div class="text-muted small">${esc(a.usuario)} · ${esc(a.fecha)} · IP ${esc(a.ip)}</div></div>`).join('') : '<p class="text-muted small mb-0">Aún no hay eventos de auditoría en esta sesión. Realice acciones en otros módulos para verlos aquí.</p>'); modal('modalAudit').show(); }, 450); });
    render(); setInterval(render, 60000);
  }

  document.addEventListener('DOMContentLoaded', () => { initAdmin(); initMedico(); initSuper(); setInst(); });
})();