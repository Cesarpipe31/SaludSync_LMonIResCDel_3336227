/* ===== SaludSync · Módulo 8: Atención Médica y Consulta Externa (mockup interactivo, sin backend) ===== */
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
  const parseD = s => new Date(s + 'T00:00:00');
  const HOY = new Date(); HOY.setHours(0, 0, 0, 0);
  const AHORA = new Date();
  const diaDe = f => DIAS[(parseD(f).getDay() + 6) % 7];
  const fmtFL = s => parseD(s).toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const fmtDT = s => { const d = new Date(s); return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const leer = k => { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } };
  const edad = s => { const n = parseD(s); let a = HOY.getFullYear() - n.getFullYear(); const m = HOY.getMonth() - n.getMonth(); if (m < 0 || (m === 0 && HOY.getDate() < n.getDate())) a--; return a; };
  const edadTxt = s => { const a = edad(s); if (a >= 2) return a + ' años'; const n = parseD(s); return ((HOY.getFullYear() - n.getFullYear()) * 12 + HOY.getMonth() - n.getMonth() - (HOY.getDate() < n.getDate() ? 1 : 0)) + ' meses'; };

  /* ---------- Institución, sesión y auditoría ---------- */
  function instActiva() {
    let id = 1; const s = leer('saludsync_sesion'), m2 = leer('saludsync_modulo2_v1'); const u = m2 && s && m2.usuarios.find(x => x.id === s.id); if (u && u.inst) id = u.inst;
    const nombres = { 1: 'Clínica Santa Lucía S.A.S.', 2: 'IPS Vida Plena Ltda.', 3: 'Centro Médico Los Andes', 5: 'Salud Integral del Caribe IPS' };
    return { id, nombre: nombres[id] || 'Institución #' + id };
  }
  const INST = instActiva();
  const setInst = () => $$('[data-inst-nombre]').forEach(e => e.textContent = INST.nombre);
  const responsable = () => { const s = leer('saludsync_sesion'); return s ? `${s.nombre} (${s.rol})` : 'Médico (demo)'; };
  function auditar(tabla, registro, accion, ant, nuevo) {
    const m2 = leer('saludsync_modulo2_v1'); if (!m2 || !m2.auditoria) return;
    m2.auditoria.unshift({ id: Math.max(0, ...m2.auditoria.map(a => a.id)) + 1, usuario: responsable(), tabla, registro, accion, ant, nuevo, ip: '192.168.1.10', fecha: `${isoD(new Date())} ${pad(new Date().getHours())}:${pad(new Date().getMinutes())}` });
    try { sessionStorage.setItem('saludsync_modulo2_v1', JSON.stringify(m2)); } catch (e) { }
  }

  /* ---------- Catálogos de otros módulos (sesión o semillas) ---------- */
  const SEDES = [{ id: 1, nombre: 'Sede Principal' }, { id: 2, nombre: 'Sede Cabecera' }, { id: 3, nombre: 'Sede Floridablanca' }];
  const PAC_SEED = [[1, 'CC', '1100234567', 'Ana Lucía', 'Torres Gil', 'Activo', '1991-04-12', 'Femenino', 'Sanitas'], [2, 'CC', '91234501', 'Carlos Eduardo', 'Mendoza Ruiz', 'Activo', '1978-09-03', 'Masculino', 'Nueva EPS'],
    [3, 'TI', '1034567890', 'Valentina', 'Rojas Mejía', 'Activo', '2010-02-20', 'Femenino', 'Sura'], [4, 'RC', '1098123456', 'Samuel', 'Ortega Plata', 'Activo', '2022-06-15', 'Masculino', 'Sanitas'],
    [5, 'CC', '37890456', 'Rosa Elena', 'Barrios Núñez', 'Activo', '1955-11-30', 'Femenino', 'Coosalud'], [6, 'CE', '5601234', 'Juan José', 'Martínez Pérez', 'Activo', '1989-01-17', 'Masculino', 'Sura'],
    [7, 'PPT', '5870023', 'Daniela', 'Gómez Castro', 'Activo', '1996-07-08', 'Femenino', 'Nueva EPS'], [8, 'CC', '13789012', 'Héctor Fabio', 'Lozano Vega', 'Inactivo', '1967-03-25', 'Masculino', 'Famisanar'],
    [9, 'CC', '63890123', 'Natalia', 'Cárdenas Rueda', 'Activo', '1985-12-02', 'Femenino', 'Sanitas'], [10, 'TI', '1102345678', 'Santiago', 'Arias Calderón', 'Activo', '2008-10-05', 'Masculino', 'Nueva EPS'],
    [11, 'PEP', '4567890', 'Luisa Fernanda', 'Herrera Díaz', 'Activo', '1993-05-19', 'Femenino', 'Salud Total'], [12, 'Pasaporte', 'AB123456', 'Michael', 'Anderson', 'Inactivo', '1974-08-11', 'Masculino', 'Particular']]
    .map(([id, tipo, doc, nombres, apellidos, estado, nac, sexo, eps]) => ({ id, tipo, doc, nombres, apellidos, estado, nac, sexo, eps }));
  const PROF_SEED = [[1, 'Andrés Felipe', 'Navarro Díaz', [1], 'Activo', 3], [2, 'Paula Andrea', 'Rueda Mantilla', [2], 'Activo', 4], [3, 'Mauricio', 'Ariza Gómez', [3, 6], 'Activo', null], [4, 'Liliana', 'Cortés Vargas', [4], 'Activo', null],
    [5, 'Iván Darío', 'Suárez Pinto', [5], 'Activo', null], [6, 'Marcela', 'Quintero Ardila', [6, 1], 'Activo', null], [7, 'Camilo Andrés', 'Ortega Rey', [8], 'Activo', null], [8, 'Sergio', 'Medina Restrepo', [1], 'Inactivo', null],
    [9, 'Sofía', 'Bermúdez Luna', [2, 1], 'Activo', null], [10, 'Diana Patricia', 'Cifuentes Mora', [4, 7], 'Activo', null]].map(([id, nombres, apellidos, esp, estado, uid]) => ({ id, nombres, apellidos, esp, estado, uid }));
  const CONS_SEED = [[1, 1, 'C-101', 'Consulta Externa 1', 'Habilitado'], [2, 1, 'C-102', 'Consulta Externa 2', 'Habilitado'], [3, 1, 'C-103', 'Odontología 1', 'Habilitado'], [4, 1, 'C-201', 'Sala de Procedimientos', 'Habilitado'],
    [5, 1, 'C-202', 'Consulta Especializada', 'Habilitado'], [6, 2, 'C-101', 'Consulta Externa 1', 'Habilitado'], [7, 2, 'C-102', 'Odontología 1', 'Habilitado'], [8, 2, 'C-103', 'Sala de Curaciones', 'En Mantenimiento'],
    [9, 3, 'C-101', 'Consulta Externa 1', 'Habilitado'], [10, 3, 'C-102', 'Consulta Pediátrica', 'Habilitado'], [11, 3, 'C-103', 'Consulta Externa 3', 'Inactivo']].map(([id, sede, codigo, nombre, estado]) => ({ id, sede, codigo, nombre, estado }));
  const M3 = leer('saludsync_modulo3_v1'), M4 = leer('saludsync_modulo4_v1'), M5 = leer('saludsync_modulo5_v1'), M6 = leer('saludsync_modulo6_v1');
  const PACS = ((M3 && M3.pacientes) ? M3.pacientes : PAC_SEED).map(p => ({ id: p.id, tipo: p.tipo, doc: p.doc, nombre: `${p.nombres} ${p.apellidos}`, estado: p.estado, nac: p.nac, sexo: p.sexo, eps: p.eps }));
  const PROFS = ((M4 && M4.profesionales) ? M4.profesionales : PROF_SEED).map(p => ({ id: p.id, nombre: `${p.nombres} ${p.apellidos}`, corto: `${p.nombres.split(' ')[0]} ${p.apellidos.split(' ')[0]}`, estado: p.estado, uid: p.uid }));
  const CONS = ((M5 && M5.consultorios) ? M5.consultorios : CONS_SEED).map(c => ({ id: c.id, sede: c.sede, codigo: c.codigo, nombre: c.nombre, estado: c.estado }));
  const pacDe = id => PACS.find(p => p.id === id), profDe = id => PROFS.find(p => p.id === id), consDe = id => CONS.find(c => c.id === id), sedeDe = id => SEDES.find(s => s.id === id);

  /* ---------- Citas del Módulo 7 (se leen, o se generan igual que en ese módulo) ---------- */
  const dt = (off, h) => { const d = new Date(HOY); d.setDate(d.getDate() + off); return `${isoD(d)}T${h}`; };
  const vigenteEn = (a, f) => a.vIni <= f && (!a.vFin || a.vFin >= f);
  function seedAgendas() {
    let base;
    if (M5 && M5.turnos) base = M5.turnos.map(t => ({ id: t.id, prof: t.prof, c: t.c, dia: t.dia, ini: t.inicio, fin: t.fin }));
    else {
      base = []; let id = 1; const LV = DIAS.slice(0, 5), T = (c, dias, ini, fin, prof) => dias.forEach(d => base.push({ id: id++, prof, c, dia: d, ini, fin }));
      T(1, LV, '07:00', '12:00', 1); T(1, ['Lunes', 'Miércoles', 'Viernes'], '14:00', '18:00', 6); T(1, ['Sábado'], '08:00', '13:00', 1); T(2, ['Martes', 'Jueves'], '08:00', '17:00', 2); T(2, ['Lunes'], '14:00', '18:00', 9);
      T(3, LV, '08:00', '16:00', 5); T(3, ['Sábado'], '08:00', '12:00', 5); T(4, ['Miércoles'], '09:00', '13:00', 3); T(4, ['Jueves'], '14:00', '18:00', 3); T(5, ['Lunes', 'Martes', 'Jueves'], '14:00', '18:00', 4);
      T(5, ['Miércoles'], '14:00', '18:00', 10); T(6, LV, '08:00', '12:00', 7); T(9, ['Lunes', 'Miércoles', 'Viernes'], '08:00', '13:00', 9); T(10, ['Martes', 'Jueves'], '14:00', '18:00', 6);
    }
    const dur = { 2: 20, 3: 45, 5: 40 }; return base.map(t => ({ ...t, dur: dur[t.prof] || 30, vIni: '2026-01-01', vFin: t.id % 5 === 0 ? '2026-12-31' : null, estado: 'Publicada' }));
  }
  const AGENDAS = (M6 && M6.agendas) ? M6.agendas : seedAgendas();
  const BLOQS = (M6 && M6.bloqueos) ? M6.bloqueos : [{ prof: 3, ini: dt(-1, '00:00'), fin: dt(3, '23:59') }, { prof: 2, ini: dt(8, '00:00'), fin: dt(22, '23:59') }, { prof: 4, ini: dt(-2, '08:00'), fin: dt(-2, '18:00') }, { prof: 6, ini: dt(2, '14:00'), fin: dt(2, '16:00') }];
  const bloqueado = (prof, s, e) => BLOQS.some(b => b.prof === prof && s < new Date(b.fin).getTime() && e > new Date(b.ini).getTime());
  const hashOcup = (id, f, m) => ((id * 131 + parseInt(f.replace(/-/g, ''), 10) * 17 + m * 7) % 100) < 38;
  function generarCitas() {
    const out = [], activos = PACS.filter(p => p.estado === 'Activo'), usadoPD = new Set(), usadoPT = new Set(); let id = 1;
    const hoy = isoD(HOY), nm = AHORA.getHours() * 60 + AHORA.getMinutes();
    for (let off = -2; off <= 7; off++) {
      const d = new Date(HOY); d.setDate(d.getDate() + off); const f = isoD(d), dia = diaDe(f);
      AGENDAS.filter(a => a.estado === 'Publicada' && a.dia === dia && vigenteEn(a, f) && consDe(a.c)).forEach(a => {
        for (let m = toMin(a.ini); m + a.dur <= toMin(a.fin); m += a.dur) {
          if (!hashOcup(a.id, f, m)) continue; const s = parseD(f).getTime() + m * 6e4; if (bloqueado(a.prof, s, s + a.dur * 6e4)) continue;
          let pac = null; const k = (id * 5 + m) % activos.length;
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
  const DB7 = (() => { const s = leer('saludsync_modulo7_v1'); return s && s.citas ? s : { citas: generarCitas(), historial: [] }; })();
  const guardar7 = () => { try { sessionStorage.setItem('saludsync_modulo7_v1', JSON.stringify(DB7)); } catch (e) { } };
  const citaDe = id => DB7.citas.find(c => c.id === id);

  /* ---------- Datos propios: atencion_medica, signos_vitales, antecedente_clinico ---------- */
  const A = (id, pac, prof, tipo, descripcion, dias) => { const d = new Date(HOY); d.setDate(d.getDate() - dias); return { id, pac, prof, atencion: null, tipo, desc: descripcion, fecha: isoDT(d) }; };
  const SEED8 = { atenciones: [], signos: [], antecedentes: [
    A(1, 1, 1, 'Alérgico', 'Penicilina: rash cutáneo generalizado.', 400), A(2, 1, 1, 'Patológico', 'Hipertensión arterial diagnosticada en 2019.', 400), A(3, 2, 1, 'Patológico', 'Diabetes mellitus tipo 2.', 300),
    A(4, 2, 1, 'Farmacológico', 'Metformina 850 mg cada 12 horas.', 300), A(5, 5, 6, 'Quirúrgico', 'Colecistectomía laparoscópica (2015).', 520), A(6, 5, 6, 'Familiar', 'Madre con cáncer de mama.', 520),
    A(7, 3, 2, 'Alérgico', 'Alergia estacional al polen.', 200), A(8, 9, 1, 'Patológico', 'Asma bronquial leve intermitente.', 150), A(9, 6, 1, 'Alérgico', 'AINEs (diclofenaco): urticaria.', 90)] };
  const DB8 = (() => { const s = leer('saludsync_modulo8_v1'); return s && s.atenciones ? s : JSON.parse(JSON.stringify(SEED8)); })();
  const guardar8 = () => { try { sessionStorage.setItem('saludsync_modulo8_v1', JSON.stringify(DB8)); } catch (e) { } };
  const atDeCita = id => DB8.atenciones.find(a => a.cita === id);
  const signosDe = id => DB8.signos.find(s => s.atencion === id);
  const alergias = pid => DB8.antecedentes.filter(a => a.pac === pid && a.tipo === 'Alérgico');
  const minDesde = iso => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 6e4));
  const BADGE = { 'Programada': 'primary', 'En Sala de Espera': 'info text-dark', 'En Consulta': 'warning text-dark', 'Atendida': 'success', 'Cancelada': 'secondary', 'Inasistencia': 'danger' };

  // Bloqueo de edición concurrente entre pestañas/ventanas (localStorage compartido)
  const LKEY = 'saludsync_locks', TAB = Math.random().toString(36).slice(2), LOCK_TTL = 45000;
  const leerLocks = () => { try { return JSON.parse(localStorage.getItem(LKEY)) || {}; } catch (e) { return {}; } };
  const escribirLocks = o => { try { localStorage.setItem(LKEY, JSON.stringify(o)); } catch (e) { } };
  const lockAjeno = id => { const x = leerLocks()[id]; return x && x.tab !== TAB && Date.now() - x.ts < LOCK_TTL ? x : null; };
  const tomarLock = (id, prof) => { if (lockAjeno(id)) return false; const l = leerLocks(); l[id] = { tab: TAB, prof, ts: Date.now() }; escribirLocks(l); return true; };
  const soltarLock = id => { const l = leerLocks(); if (l[id] && l[id].tab === TAB) { delete l[id]; escribirLocks(l); } };

  /* =====================================================
     PANTALLA 8.1 · Panel asistencial
     ===================================================== */
  function initPanel() {
    if (document.body.dataset.page !== 'panel_asistencial') return;
    const hoy = isoD(HOY); let profSel = 0, pendiente = null;
    $('#fechaHoy').textContent = fmtFL(hoy).replace(/^./, c => c.toUpperCase());

    // Profesional: el médico de la sesión (Módulo 2) o selección manual para la demostración
    const s = leer('saludsync_sesion'), m2 = leer('saludsync_modulo2_v1'), u = s && m2 && m2.usuarios.find(x => x.id === s.id);
    const propio = u && u.rol === 3 ? PROFS.find(p => p.uid === u.id) : null;
    const conCitas = PROFS.filter(p => p.estado === 'Activo').sort((a, b) => DB7.citas.filter(c => c.prof === b.id && c.fecha === hoy).length - DB7.citas.filter(c => c.prof === a.id && c.fecha === hoy).length);
    profSel = propio ? propio.id : (conCitas[0] || {}).id;
    $('#selProf').innerHTML = PROFS.filter(p => p.estado === 'Activo').map(p => `<option value="${p.id}">${esc(p.nombre)} (${DB7.citas.filter(c => c.prof === p.id && c.fecha === hoy).length} citas hoy)</option>`).join('');
    $('#selProf').value = profSel; if (propio) { $('#selProf').disabled = true; $('#ayudaProf').textContent = 'Sesión iniciada como este profesional.'; } else $('#ayudaProf').textContent = 'Modo demostración: elija el médico cuya cola desea ver.';
    $('#selProf').addEventListener('change', e => { profSel = +e.target.value; render(); });

    const citasProf = () => DB7.citas.filter(c => c.prof === profSel && c.fecha === hoy).sort((a, b) => a.hora.localeCompare(b.hora));
    const filaPac = c => { const p = pacDe(c.pac), al = alergias(c.pac).length; return `<strong>${esc(p.nombre)}</strong>${al ? '<span class="alerg-flag" title="Tiene alergias registradas">⚠ Alergias</span>' : ''}<span class="cell-sub">${esc(p.tipo)} ${esc(p.doc)} · ${edadTxt(p.nac)} · ${esc(p.sexo)}</span>`; };

    function render() {
      const todas = citasProf(), cola = todas.filter(c => c.estado === 'En Sala de Espera').sort((a, b) => (a.checkin || a.hora).localeCompare(b.checkin || b.hora)),
        curso = todas.filter(c => c.estado === 'En Consulta'), prog = todas.filter(c => c.estado === 'Programada'), aten = todas.filter(c => c.estado === 'Atendida');
      const espMedia = cola.length ? Math.round(cola.reduce((a, c) => a + minDesde(c.checkin || isoDT(AHORA)), 0) / cola.length) : 0;
      $('#kpis').innerHTML = [['En sala de espera', cola.length, 'kpi-warn'], ['En atención', curso.length, ''], ['Programadas restantes', prog.length, ''], ['Atendidas hoy', aten.length, 'kpi-green'], ['Espera promedio', espMedia + ' min', 'kpi-gray']]
        .map(([l, v, cls]) => `<div class="col-6 col-lg"><div class="kpi ${cls}"><div class="kpi-num">${v}</div><div class="kpi-lbl">${l}</div></div></div>`).join('');

      $('#enCurso').innerHTML = curso.map(c => { const p = pacDe(c.pac), a = atDeCita(c.id), bloqueo = a && lockAjeno(a.id), ini = a ? a.inicio : (c.checkin || isoDT(AHORA));
        return `<div class="en-curso d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2"><div><span class="badge bg-warning text-dark mb-1">En atención</span> ${bloqueo ? '<span class="badge bg-danger">🔒 Abierta en otra ventana</span>' : ''}
          <div class="h5 mb-0">${esc(p.nombre)}</div><div class="small text-muted">${c.hora} · ${esc(c.tipo)} · en consulta hace ${minDesde(ini)} min</div></div>
          <a class="btn btn-warning fw-bold" href="formulario_consulta.html?cita=${c.id}">${bloqueo ? '👁 Ver (solo lectura)' : '📝 Continuar atención'}</a></div>`; }).join('');

      const hayCurso = curso.length > 0;
      $('#tablaCola').innerHTML = cola.length ? cola.map((c, i) => { const co = consDe(c.c) || { codigo: '—' }, w = minDesde(c.checkin || isoDT(AHORA)), cls = w > 30 ? 'espera-alto' : w > 15 ? 'espera-med' : 'espera-ok';
        return `<tr><td><span class="cola-num">${i + 1}</span></td><td class="hora-cell">${c.hora}</td><td>${filaPac(c)}</td><td>${esc(c.tipo)}</td><td>${esc(co.codigo)}</td>
          <td><span class="espera-chip ${cls}">⏱ ${w} min</span></td>
          <td class="text-end"><button class="btn btn-success btn-sm btn-iniciar" data-id="${c.id}" ${hayCurso ? 'disabled title="Finalice la atención en curso antes de iniciar otra"' : ''}>▶ Iniciar atención</button></td></tr>`; }).join('')
        : '<tr><td colspan="7" class="text-center text-muted py-4">No hay pacientes en sala de espera. Los pacientes aparecen aquí cuando recepción registra su check-in.</td></tr>';

      $('#nProg').textContent = prog.length; $('#nAten').textContent = aten.length;
      $('#tablaProg').innerHTML = prog.length ? prog.map(c => `<tr><td class="hora-cell">${c.hora}</td><td>${filaPac(c)}</td><td>${esc(c.tipo)}</td><td>${esc((consDe(c.c) || {}).codigo || '—')}</td><td><span class="badge bg-${BADGE[c.estado]}">${c.estado}</span><span class="cell-sub">Pendiente de check-in</span></td></tr>`).join('') : '<tr><td colspan="5" class="text-center text-muted py-4">Sin citas programadas pendientes.</td></tr>';
      $('#tablaAten').innerHTML = aten.length ? aten.map(c => `<tr><td class="hora-cell">${c.hora}</td><td>${filaPac(c)}</td><td>${esc(c.tipo)}</td><td>${esc((consDe(c.c) || {}).codigo || '—')}</td><td class="text-end"><a class="btn btn-sm btn-outline-primary" href="formulario_consulta.html?cita=${c.id}&ver=1">👁 Ver registro</a></td></tr>`).join('') : '<tr><td colspan="5" class="text-center text-muted py-4">Aún no hay consultas finalizadas hoy.</td></tr>';
    }

    $('#tablaCola').addEventListener('click', e => {
      const b = e.target.closest('.btn-iniciar'); if (!b || b.disabled) return; const c = citaDe(+b.dataset.id), p = pacDe(c.pac); pendiente = c.id;
      const al = alergias(p.id);
      $('#iniciarCuerpo').innerHTML = `<p class="mb-2"><strong>${esc(p.nombre)}</strong> · ${esc(p.tipo)} ${esc(p.doc)} · ${edadTxt(p.nac)}</p>
        <p class="small text-muted mb-2">La cita pasará a <strong>En Consulta</strong>, se creará el registro de atención <strong>En Atención</strong> y la historia quedará <strong>bloqueada para edición concurrente</strong>.</p>
        ${al.length ? `<div class="alerta-alergia">⚠ Alergias: ${al.map(a => esc(a.desc)).join(' · ')}</div>` : ''}`;
      modal('modalIniciar').show();
    });
    $('#btnConfirmarInicio').addEventListener('click', e => {
      const unlock = SS.lock(e.currentTarget, 'Iniciando…');
      setTimeout(() => {
        const c = citaDe(pendiente);
        if (c.estado !== 'En Sala de Espera' || atDeCita(c.id)) { unlock(); modal('modalIniciar').hide(); render(); return SS.toast('La cita ya no está disponible para iniciar atención.', 'danger'); }
        if (citasProf().some(x => x.estado === 'En Consulta')) { unlock(); modal('modalIniciar').hide(); return SS.toast('Ya tiene una atención en curso.', 'danger'); }
        const a = { id: Math.max(0, ...DB8.atenciones.map(x => x.id)) + 1, cita: c.id, pac: c.pac, prof: c.prof, motivo: '', ea: '', rs: '', ef: '', obs: '', estado: 'En Atención', inicio: isoDT(new Date()), fin: null };
        DB8.atenciones.push(a); c.estado = 'En Consulta'; guardar8(); guardar7();
        auditar('cita_medica', c.id, 'Modificación', { estado: 'En Sala de Espera' }, { estado: 'En Consulta' }); auditar('atencion_medica', a.id, 'Creación', null, { cita: c.id, estado: 'En Atención' });
        SS.toast('Atención iniciada. Abriendo el formulario clínico…'); setTimeout(() => { location.href = `formulario_consulta.html?cita=${c.id}`; }, 700);
      }, 700);
    });
    render(); setInterval(render, 30000);
  }

  /* =====================================================
     PANTALLA 8.2 · Formulario de atención médica
     ===================================================== */
  const MOT_DEMO = [{ m: 'Control de presión arterial', ea: 'Refiere cifras tensionales elevadas en casa durante las últimas dos semanas.', ef: 'TA estable, sin signos de dificultad respiratoria.' },
    { m: 'Dolor lumbar de 5 días de evolución', ea: 'Dolor tipo punzante posterior a esfuerzo físico, mejora con reposo.', ef: 'Dolor a la palpación paravertebral, sin déficit neurológico.' },
    { m: 'Síntomas gripales y tos', ea: 'Cuadro de 3 días con congestión nasal, tos seca y malestar general.', ef: 'Faringe congestiva, murmullo vesicular conservado.' },
    { m: 'Revisión general y exámenes de rutina', ea: 'Asintomático. Acude a chequeo anual.', ef: 'Examen físico sin hallazgos patológicos.' }];
  function demoAtencion(c) {
    const h = (c.id * 37) % 100, mt = MOT_DEMO[h % MOT_DEMO.length], fin = hm(toMin(c.hora) + 25);
    const a = { id: -c.id, cita: c.id, pac: c.pac, prof: c.prof, motivo: mt.m, ea: mt.ea, rs: 'Sin hallazgos relevantes por sistemas.', ef: mt.ef, obs: 'Control según evolución. Signos de alarma explicados.', estado: 'Finalizada', inicio: `${c.fecha}T${c.hora}`, fin: `${c.fecha}T${fin}`, demo: true };
    const peso = 55 + h % 35, talla = 150 + h % 35, s = { atencion: a.id, pas: 108 + h % 30, pad: 68 + h % 16, fc: 62 + h % 30, fr: 14 + h % 6, temp: +(36.2 + (h % 10) / 10).toFixed(1), sat: 95 + h % 5, peso, talla, imc: +(peso / ((talla / 100) ** 2)).toFixed(1) };
    return { a, s };
  }
  const SISTEMAS = ['Cardiovascular', 'Respiratorio', 'Digestivo', 'Neurológico', 'Genitourinario', 'Musculoesquelético', 'Piel y anexos', 'Endocrino'];
  const IMC_CLASES = [[18.5, 'Bajo peso', 'imc-bajo'], [25, 'Peso normal', 'imc-normal'], [30, 'Sobrepeso', 'imc-sobre'], [35, 'Obesidad grado I', 'imc-ob1'], [40, 'Obesidad grado II', 'imc-ob2'], [999, 'Obesidad grado III', 'imc-ob3']];

  function initFormulario() {
    if (document.body.dataset.page !== 'formulario_consulta') return;
    const params = new URLSearchParams(location.search), cid = +params.get('cita'), soloVer = params.get('ver') === '1', c = citaDe(cid), noDisp = $('#noDisponible');
    const falla = txt => { noDisp.innerHTML = `${txt} <a href="panel_asistencial.html" class="alert-link">Volver al panel asistencial</a>.`; noDisp.classList.remove('d-none'); };
    if (!c) return falla('No se encontró la cita solicitada.');

    // Obtener la atención asociada
    let a = atDeCita(c.id), s = a ? signosDe(a.id) : null, demo = false;
    if (!a && c.estado === 'En Consulta') { a = { id: Math.max(0, ...DB8.atenciones.map(x => x.id)) + 1, cita: c.id, pac: c.pac, prof: c.prof, motivo: '', ea: '', rs: '', ef: '', obs: '', estado: 'En Atención', inicio: c.checkin || isoDT(new Date()), fin: null }; DB8.atenciones.push(a); guardar8(); }
    if (!a && c.estado === 'Atendida') { const d = demoAtencion(c); a = d.a; s = d.s; demo = true; }
    if (!a) return falla(`La cita está en estado «${c.estado}»: la atención solo puede abrirse desde la cola de espera.`);

    const p = pacDe(a.pac), pr = profDe(a.prof), co = consDe(c.c) || { codigo: '—', sede: 1 };
    $('#contenido').classList.remove('d-none');
    $('#hAvatar').textContent = (p.nombre.split(' ')[0][0] + (p.nombre.split(' ').slice(-1)[0][0] || '')).toUpperCase();
    $('#hNombre').textContent = p.nombre; $('#hDatos').textContent = `${p.tipo} ${p.doc} · ${edadTxt(p.nac)} · ${p.sexo} · EPS: ${p.eps || '—'}`;
    $('#hCita').innerHTML = `Cita #${c.id} · ${c.hora} · ${esc(c.tipo)} · ${esc(co.codigo)} (${esc((sedeDe(co.sede) || {}).nombre || '')}) · <strong>${esc(pr.nombre)}</strong>`;
    $('#hEstado').className = 'badge ' + (a.estado === 'Finalizada' ? 'bg-success' : 'bg-warning text-dark'); $('#hEstado').textContent = a.estado;
    const refAlerg = () => { const al = alergias(p.id), b = $('#hAlergias'); b.classList.toggle('d-none', !al.length); b.innerHTML = '⚠ ALERGIAS: ' + al.map(x => esc(x.desc)).join(' · '); }; refAlerg();

    // Modo: edición, lectura o bloqueado por otra ventana
    let editable = a.estado === 'En Atención' && !soloVer && !demo;
    const aplicarModo = () => {
      let msg = '';
      if (a.estado === 'Finalizada' || soloVer || demo) { editable = false; msg = demo ? 'Registro histórico de ejemplo (solo lectura).' : 'Consulta finalizada: el registro es de solo lectura.'; $('#bannerLock').classList.add('d-none'); }
      else if (!tomarLock(a.id, a.prof)) { editable = false; const x = lockAjeno(a.id); $('#bannerLock').classList.remove('d-none'); $('#bannerLock').innerHTML = `🔒 <strong>Atención bloqueada:</strong> está siendo editada en otra ventana o sesión (${esc(profDe(x.prof).nombre)}). Se evitan ediciones concurrentes. <button type="button" class="btn btn-sm btn-outline-danger ms-2" id="btnReintentar">Reintentar</button>`; msg = 'Modo solo lectura por bloqueo concurrente.'; }
      else { editable = true; $('#bannerLock').classList.add('d-none'); }
      $('#bannerLectura').classList.toggle('d-none', editable); $('#bannerLectura').textContent = msg;
      $('#fsForm').disabled = !editable; $('#barraAcciones').classList.toggle('d-none', !editable);
    };
    aplicarModo();
    $('#bannerLock').addEventListener('click', e => { if (e.target.id === 'btnReintentar') { aplicarModo(); if (editable) SS.toast('Bloqueo adquirido. Ya puede editar.'); else SS.toast('La atención sigue bloqueada.', 'danger'); } });
    if (editable) { setInterval(() => { const l = leerLocks(); if (l[a.id] && l[a.id].tab === TAB) { l[a.id].ts = Date.now(); escribirLocks(l); } }, 15000); window.addEventListener('pagehide', () => soltarLock(a.id)); }

    // Cronómetro
    const tick = () => { const fin = a.fin ? new Date(a.fin).getTime() : Date.now(), seg = Math.max(0, Math.round((fin - new Date(a.inicio).getTime()) / 1000)); $('#timer').textContent = `${pad(Math.floor(seg / 60))}:${pad(seg % 60)}`; };
    tick(); if (a.estado === 'En Atención') setInterval(tick, 1000);

    // Cargar datos
    $('#f_motivo').value = a.motivo; $('#f_ea').value = a.ea; $('#f_rs').value = a.rs; $('#f_ef').value = a.ef; $('#f_obs').value = a.obs || '';
    if (s) { $('#s_pas').value = s.pas; $('#s_pad').value = s.pad; $('#s_fc').value = s.fc; $('#s_fr').value = s.fr; $('#s_temp').value = s.temp; $('#s_sat').value = s.sat; $('#s_peso').value = s.peso; $('#s_talla').value = s.talla; }
    $('#chipsSistemas').innerHTML = SISTEMAS.map(x => `<span class="sistema-chip" data-sis="${x}">+ ${x}</span>`).join('');
    $('#chipsSistemas').addEventListener('click', e => { const ch = e.target.closest('[data-sis]'); if (!ch || !editable) return; const t = $('#f_rs'); t.value += (t.value && !t.value.endsWith('\n') ? '\n' : '') + `${ch.dataset.sis}: sin hallazgos.`; t.focus(); progreso(); });

    /* Signos vitales: alertas e IMC */
    const v = id => parseFloat($('#' + id).value);
    function evaluar() {
      const msgs = { pa: ['', ''], fc: ['', ''], fr: ['', ''], temp: ['', ''], sat: ['', ''] }, pas = v('s_pas'), pad_ = v('s_pad'), fc = v('s_fc'), fr = v('s_fr'), t = v('s_temp'), sat = v('s_sat');
      if (pas && pad_) { if (pas >= 180 || pad_ >= 120) msgs.pa = ['Crisis hipertensiva', 'crit']; else if (pas >= 140 || pad_ >= 90) msgs.pa = ['Rango hipertensivo', 'warn']; else if (pas < 90 || pad_ < 60) msgs.pa = ['Hipotensión', 'warn']; else msgs.pa = ['Normal', '']; }
      if (fc) msgs.fc = fc > 100 ? ['Taquicardia', 'warn'] : fc < 50 ? ['Bradicardia', 'warn'] : ['Normal', ''];
      if (fr) msgs.fr = fr > 20 ? ['Taquipnea', 'warn'] : fr < 12 ? ['Bradipnea', 'warn'] : ['Normal', ''];
      if (t) msgs.temp = t >= 39 ? ['Fiebre alta', 'crit'] : t >= 38 ? ['Fiebre', 'warn'] : t < 35.5 ? ['Hipotermia', 'warn'] : ['Normal', ''];
      if (sat) msgs.sat = sat < 90 ? ['Hipoxemia severa', 'crit'] : sat < 94 ? ['Saturación baja', 'warn'] : ['Normal', ''];
      Object.keys(msgs).forEach(k => { const el = $(`[data-msg="${k}"]`), card = $(`[data-v="${k}"]`); el.textContent = msgs[k][0]; el.className = 'vital-msg ' + msgs[k][1]; card.classList.toggle('alerta', msgs[k][1] === 'crit'); card.classList.toggle('alerta2', msgs[k][1] === 'warn'); });
      const peso = v('s_peso'), talla = v('s_talla');
      if (peso > 0 && talla > 0) { const imc = +(peso / ((talla / 100) ** 2)).toFixed(1), cl = IMC_CLASES.find(x => imc < x[0]); $('#imcValor').textContent = imc.toFixed(1); $('#s_imc').value = imc; $('#imcClase').className = 'badge mt-1 ' + cl[2]; $('#imcClase').textContent = cl[1]; }
      else { $('#imcValor').textContent = '—'; $('#s_imc').value = ''; $('#imcClase').className = 'badge mt-1 bg-secondary'; $('#imcClase').textContent = 'Ingrese peso y talla'; }
      $('#s_pad').setCustomValidity(pas && pad_ && pas <= pad_ ? 'La sistólica debe ser mayor que la diastólica' : '');
    }
    function progreso() {
      const ok = (ids) => ids.every(id => $('#' + id).value.trim() !== ''), sv = ['s_pas', 's_pad', 's_fc', 's_fr', 's_temp', 's_sat', 's_peso', 's_talla'];
      $('[data-paso="anamnesis"]').classList.toggle('ok', ok(['f_motivo', 'f_ea', 'f_ef'])); $('[data-paso="signos"]').classList.toggle('ok', ok(sv));
      $$('[data-cnt]').forEach(sp => sp.textContent = $('#' + sp.dataset.cnt).value.length);
    }
    $$('#fsForm input, #fsForm textarea').forEach(el => el.addEventListener('input', () => { evaluar(); progreso(); })); evaluar(); progreso();

    /* Antecedentes */
    function renderAnt() {
      const lista = DB8.antecedentes.filter(x => x.pac === p.id), tipos = ['Alérgico', 'Patológico', 'Quirúrgico', 'Farmacológico', 'Familiar'];
      $('#listaAnt').innerHTML = lista.length ? tipos.filter(t => lista.some(x => x.tipo === t)).map(t => `<h3>${t}</h3>` + lista.filter(x => x.tipo === t).map(x => {
        const nuevo = x.atencion === a.id, quien = (profDe(x.prof) || { corto: '—' }).corto;
        return `<div class="ant-item ${nuevo ? 'ant-nuevo' : ''}"><div><span class="badge badge-ant-${x.tipo} me-1">${x.tipo}</span>${esc(x.desc)}<br><small>${esc(quien)} · ${fmtDT(x.fecha)}${nuevo ? ' · <strong class="text-success">Esta consulta</strong>' : ''}</small></div>
          ${nuevo && editable ? `<button type="button" class="btn btn-sm btn-outline-danger" data-del="${x.id}" title="Quitar">✖</button>` : ''}</div>`; }).join('')).join('') : '<p class="text-muted mb-0">El paciente no tiene antecedentes registrados.</p>';
    }
    renderAnt();
    $('#btnAddAnt').addEventListener('click', e => {
      const d = $('#a_desc').value.trim(); if (!editable) return; if (!d) { $('#a_desc').classList.add('is-invalid'); return; } $('#a_desc').classList.remove('is-invalid');
      const unlock = SS.lock(e.currentTarget, 'Agregando…');
      setTimeout(() => {
        const id = Math.max(0, ...DB8.antecedentes.map(x => x.id)) + 1; DB8.antecedentes.push({ id, pac: p.id, prof: a.prof, atencion: a.id, tipo: $('#a_tipo').value, desc: d, fecha: isoDT(new Date()) });
        auditar('antecedente_clinico', id, 'Creación', null, { tipo: $('#a_tipo').value, paciente: p.nombre }); guardar8(); $('#a_desc').value = ''; renderAnt(); refAlerg(); unlock(); SS.toast('Antecedente agregado a esta consulta.');
      }, 500);
    });
    $('#listaAnt').addEventListener('click', e => { const b = e.target.closest('[data-del]'); if (!b) return; DB8.antecedentes = DB8.antecedentes.filter(x => x.id !== +b.dataset.del); guardar8(); renderAnt(); refAlerg(); });

    /* Guardado */
    function volcar() {
      a.motivo = $('#f_motivo').value.trim(); a.ea = $('#f_ea').value.trim(); a.rs = $('#f_rs').value.trim(); a.ef = $('#f_ef').value.trim(); a.obs = $('#f_obs').value.trim();
      const ids = ['s_pas', 's_pad', 's_fc', 's_fr', 's_temp', 's_sat', 's_peso', 's_talla'];
      if (ids.some(id => $('#' + id).value !== '')) {
        const nuevo = { id: s && s.id ? s.id : Math.max(0, ...DB8.signos.map(x => x.id)) + 1, atencion: a.id, pas: v('s_pas') || 0, pad: v('s_pad') || 0, fc: v('s_fc') || 0, fr: v('s_fr') || 0, temp: v('s_temp') || 0, sat: v('s_sat') || 0, peso: v('s_peso') || 0, talla: v('s_talla') || 0, imc: v('s_imc') || 0 };
        const i = DB8.signos.findIndex(x => x.atencion === a.id); if (i >= 0) DB8.signos[i] = nuevo; else DB8.signos.push(nuevo); s = nuevo;
      }
      guardar8();
    }
    const marcaGuardado = txt => { $('#guardadoInfo').textContent = `${txt} ${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`; };
    $('#btnBorrador').addEventListener('click', e => { if (!editable) return; const unlock = SS.lock(e.currentTarget, 'Guardando…'); setTimeout(() => { volcar(); marcaGuardado('Borrador guardado a las'); unlock(); SS.toast('Borrador guardado.'); }, 500); });
    if (editable) setInterval(() => { if (editable && a.estado === 'En Atención') { volcar(); marcaGuardado('Autoguardado a las'); } }, 30000);

    /* Finalizar */
    const f = $('#formConsulta'), btn = $('#btnFinalizar');
    f.addEventListener('submit', e => {
      e.preventDefault(); if (btn.disabled || !editable) return; evaluar(); f.classList.add('was-validated');
      const inval = f.querySelector(':invalid'), err = $('#errSignos');
      if (inval) { err.textContent = 'Revise los campos marcados: motivo, enfermedad actual, examen físico y los 8 valores de signos vitales y antropometría son obligatorios y deben estar en rango.'; err.classList.remove('d-none'); inval.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      err.classList.add('d-none');
      const nAnt = DB8.antecedentes.filter(x => x.atencion === a.id).length;
      $('#finCuerpo').innerHTML = `<p>Se cerrará la atención de <strong>${esc(p.nombre)}</strong> y la cita pasará a <strong>Atendida</strong>. Luego no podrá editar el registro.</p>
        <ul class="small mb-0"><li>IMC: <strong>${$('#imcValor').textContent}</strong> (${$('#imcClase').textContent})</li><li>Antecedentes nuevos en esta consulta: <strong>${nAnt}</strong></li><li>Duración: <strong>${$('#timer').textContent}</strong></li></ul>`;
      modal('modalFin').show();
    });
    $('#btnConfirmarFin').addEventListener('click', e => {
      const unlock = SS.lock(e.currentTarget, 'Finalizando…'); btn.disabled = true;
      setTimeout(() => {
        volcar(); a.estado = 'Finalizada'; a.fin = isoDT(new Date()); c.estado = 'Atendida'; guardar8(); guardar7(); soltarLock(a.id);
        auditar('atencion_medica', a.id, 'Modificación', { estado: 'En Atención' }, { estado: 'Finalizada', imc: s.imc }); auditar('cita_medica', c.id, 'Modificación', { estado: 'En Consulta' }, { estado: 'Atendida' });
        const dur = Math.max(1, Math.round((new Date(a.fin) - new Date(a.inicio)) / 6e4)); modal('modalFin').hide(); unlock(); editable = false;
        $('#formConsulta').classList.add('d-none'); $('#bannerLectura').classList.add('d-none'); $('#hEstado').className = 'badge bg-success'; $('#hEstado').textContent = 'Finalizada'; tick();
        $('#exitoTexto').textContent = `Atención de ${p.nombre} finalizada en ${dur} min. Los signos vitales, antecedentes y anamnesis quedaron registrados.`; $('#exito').classList.remove('d-none'); $('#btnDx').href = `../diagnosticos/registro_diagnostico.html?atencion=${a.id}`; window.scrollTo({ top: 0, behavior: 'smooth' });
        SS.toast('Consulta finalizada correctamente.');
      }, 900);
    });
  }

  document.addEventListener('DOMContentLoaded', () => { setInst(); initPanel(); initFormulario(); });
})();