/* ===== SaludSync · Módulo 9: Historia Clínica Electrónica (mockup interactivo, sin backend) ===== */
(function () {
  'use strict';

  /* ---------- Utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const pad = n => String(n).padStart(2, '0');
  const modal = id => bootstrap.Modal.getOrCreateInstance(document.getElementById(id));
  const isoD = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const isoDT = d => `${isoD(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const parseD = s => new Date(s + 'T00:00:00');
  const HOY = new Date(); HOY.setHours(0, 0, 0, 0);
  const fmtDT = s => { const d = new Date(s); return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const fmtF = s => new Date(s).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  const leer = k => { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } };
  const edad = s => { const n = parseD(s); let a = HOY.getFullYear() - n.getFullYear(); const m = HOY.getMonth() - n.getMonth(); if (m < 0 || (m === 0 && HOY.getDate() < n.getDate())) a--; return a; };
  const edadTxt = s => { const a = edad(s); if (a >= 2) return a + ' años'; const n = parseD(s); return ((HOY.getFullYear() - n.getFullYear()) * 12 + HOY.getMonth() - n.getMonth() - (HOY.getDate() < n.getDate() ? 1 : 0)) + ' meses'; };
  const folioTxt = id => 'HC-' + String(id).padStart(6, '0');
  const sello = txt => { let h1 = 5381, h2 = 52711; for (const c of txt) { h1 = ((h1 * 33) ^ c.charCodeAt(0)) >>> 0; h2 = ((h2 * 31) ^ c.charCodeAt(0)) >>> 0; } return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).toUpperCase(); };

  /* ---------- Institución, sesión y auditoría ---------- */
  function instActiva() {
    let id = 1; const s = leer('saludsync_sesion'), m2 = leer('saludsync_modulo2_v1'); const u = m2 && s && m2.usuarios.find(x => x.id === s.id); if (u && u.inst) id = u.inst;
    const nombres = { 1: 'Clínica Santa Lucía S.A.S.', 2: 'IPS Vida Plena Ltda.', 3: 'Centro Médico Los Andes', 5: 'Salud Integral del Caribe IPS' };
    return { id, nombre: nombres[id] || 'Institución #' + id };
  }
  const INST = instActiva();
  const SES = leer('saludsync_sesion');
  const responsable = () => SES ? `${SES.nombre} (${SES.rol})` : 'Usuario del sistema';
  const setInst = () => $$('[data-inst-nombre]').forEach(e => e.textContent = INST.nombre);
  function auditar(tabla, registro, accion, ant, nuevo) {
    const m2 = leer('saludsync_modulo2_v1'); if (!m2 || !m2.auditoria) return;
    m2.auditoria.unshift({ id: Math.max(0, ...m2.auditoria.map(a => a.id)) + 1, usuario: responsable(), tabla, registro, accion, ant, nuevo, ip: '192.168.1.10', fecha: `${isoD(new Date())} ${pad(new Date().getHours())}:${pad(new Date().getMinutes())}` });
    try { sessionStorage.setItem('saludsync_modulo2_v1', JSON.stringify(m2)); } catch (e) { }
  }

  /* ---------- Catálogos de otros módulos (sesión o semillas) ---------- */
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
  const ESP_NOM = { 1: 'Medicina General', 2: 'Pediatría', 3: 'Cardiología', 4: 'Ginecología y Obstetricia', 5: 'Odontología', 6: 'Medicina Interna', 7: 'Dermatología', 8: 'Ortopedia y Traumatología' };
  const M3 = leer('saludsync_modulo3_v1'), M4 = leer('saludsync_modulo4_v1'), M8 = leer('saludsync_modulo8_v1');
  const PACS = ((M3 && M3.pacientes) ? M3.pacientes : PAC_SEED).map(p => ({ id: p.id, tipo: p.tipo, doc: p.doc, nombre: `${p.nombres} ${p.apellidos}`, estado: p.estado, nac: p.nac, sexo: p.sexo, eps: p.eps }));
  const PROFS = ((M4 && M4.profesionales) ? M4.profesionales : PROF_SEED).map(p => ({ id: p.id, nombre: `${p.nombres} ${p.apellidos}`, corto: `${p.nombres.split(' ')[0]} ${p.apellidos.split(' ')[0]}`, esp: p.esp, estado: p.estado, uid: p.uid }));
  const pacDe = id => PACS.find(p => p.id === id), profDe = id => PROFS.find(p => p.id === id);
  const espProf = p => p ? p.esp.map(id => ESP_NOM[id]).filter(Boolean).join(', ') : '';
  const iniciales = p => (p.nombre.split(' ')[0][0] + (p.nombre.split(' ').slice(-1)[0][0] || '')).toUpperCase();

  // Antecedentes (Módulo 8) con semilla de respaldo
  const A = (id, pac, prof, tipo, desc, dias) => { const d = new Date(HOY); d.setDate(d.getDate() - dias); return { id, pac, prof, atencion: null, tipo, desc, fecha: isoDT(d) }; };
  const ANT = (M8 && M8.antecedentes) ? M8.antecedentes : [A(1, 1, 1, 'Alérgico', 'Penicilina: rash cutáneo generalizado.', 400), A(2, 1, 1, 'Patológico', 'Hipertensión arterial diagnosticada en 2019.', 400),
    A(3, 2, 1, 'Patológico', 'Diabetes mellitus tipo 2.', 300), A(4, 2, 1, 'Farmacológico', 'Metformina 850 mg cada 12 horas.', 300), A(5, 5, 6, 'Quirúrgico', 'Colecistectomía laparoscópica (2015).', 520),
    A(6, 5, 6, 'Familiar', 'Madre con cáncer de mama.', 520), A(7, 3, 2, 'Alérgico', 'Alergia estacional al polen.', 200), A(8, 9, 1, 'Patológico', 'Asma bronquial leve intermitente.', 150), A(9, 6, 1, 'Alérgico', 'AINEs (diclofenaco): urticaria.', 90)];

  /* ---------- Atenciones finalizadas: históricas de ejemplo + las reales del Módulo 8 ---------- */
  const MOT_AD = [{ m: 'Control de presión arterial', ea: 'Refiere cifras tensionales elevadas en casa durante las últimas dos semanas.', ef: 'Sin signos de dificultad respiratoria. Ruidos cardíacos rítmicos.' },
    { m: 'Dolor lumbar de 5 días de evolución', ea: 'Dolor tipo punzante posterior a esfuerzo físico, mejora parcialmente con reposo.', ef: 'Dolor a la palpación paravertebral, sin déficit neurológico.' },
    { m: 'Síntomas gripales y tos', ea: 'Cuadro de 3 días con congestión nasal, tos seca y malestar general.', ef: 'Faringe congestiva, murmullo vesicular conservado.' },
    { m: 'Revisión general y exámenes de rutina', ea: 'Asintomático. Acude a chequeo anual.', ef: 'Examen físico sin hallazgos patológicos.' },
    { m: 'Cefalea recurrente', ea: 'Episodios de cefalea hemicraneana dos veces por semana asociados a estrés.', ef: 'Pares craneales normales, sin signos meníngeos.' },
    { m: 'Control de glucemia', ea: 'Seguimiento de glucemia alterada; adherente a recomendaciones nutricionales.', ef: 'IMC 27,4. Pulsos presentes, sin lesiones en pies.' }];
  const MOT_PED = [{ m: 'Control de crecimiento y desarrollo', ea: 'Acude con su acudiente a control programado. Sin molestias referidas.', ef: 'Peso y talla acordes para la edad. Desarrollo adecuado.' },
    { m: 'Fiebre y malestar general', ea: 'Fiebre de 38,5 °C desde hace 24 horas con disminución del apetito.', ef: 'Orofaringe eritematosa, sin dificultad respiratoria.' },
    { m: 'Esquema de vacunación', ea: 'Se presenta para verificación y aplicación de vacunas pendientes.', ef: 'Examen físico normal. Carné revisado.' }];
  const PAC_HIST = [1, 2, 3, 5, 6, 9];
  function atencionesSemilla(pid) {
    const p = pacDe(pid); if (!p || !PAC_HIST.includes(pid)) return [];
    const a = edad(p.nac), offs = [28, 95, 210, 380, 540], n = 2 + (pid % 3), out = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(HOY); d.setDate(d.getDate() - offs[i] - pid); d.setHours(8 + (pid + i) % 8, 10 + (i * 15) % 50);
      const pool = a < 14 ? MOT_PED : MOT_AD, mt = pool[(pid + i) % pool.length], prof = a < 14 ? 2 : [1, 3, 6, 9][(pid + i) % 4], h = (pid * 17 + i * 29) % 100;
      const peso = 55 + h % 35, talla = 150 + h % 35, fin = new Date(d.getTime() + 25 * 6e4);
      out.push({ id: -(pid * 100 + i + 1), fecha: isoDT(d), fin: isoDT(fin), prof, motivo: mt.m, ea: mt.ea, rs: 'Sin hallazgos relevantes por sistemas.', ef: mt.ef, obs: 'Se explican signos de alarma. Control según evolución.',
        sig: { pas: 108 + h % 30, pad: 68 + h % 16, fc: 62 + h % 30, fr: 14 + h % 6, temp: +(36.2 + (h % 10) / 10).toFixed(1), sat: 95 + h % 5, peso, talla, imc: +(peso / ((talla / 100) ** 2)).toFixed(1) }, cita: null, real: false });
    }
    return out;
  }
  function atencionesDe(pid) {
    const out = atencionesSemilla(pid);
    if (M8 && M8.atenciones) M8.atenciones.filter(a => a.pac === pid && a.estado === 'Finalizada').forEach(a => {
      const s = (M8.signos || []).find(x => x.atencion === a.id);
      out.push({ id: a.id, fecha: a.inicio, fin: a.fin, prof: a.prof, motivo: a.motivo, ea: a.ea, rs: a.rs, ef: a.ef, obs: a.obs, sig: s ? { pas: s.pas, pad: s.pad, fc: s.fc, fr: s.fr, temp: s.temp, sat: s.sat, peso: s.peso, talla: s.talla, imc: s.imc } : null, cita: a.cita, real: true });
    });
    return out.sort((x, y) => y.fecha.localeCompare(x.fecha));
  }

  /* ---------- Datos propios: historia_clinica, nota_evolucion, anexo_clinico ---------- */
  function semillaDB() {
    const db = { historias: [], notas: [], anexos: [] };
    PAC_HIST.forEach((pid, i) => {
      const ats = atencionesSemilla(pid); if (!ats.length) return;
      const hid = i + 1, prim = ats[ats.length - 1];
      db.historias.push({ id: hid, pac: pid, inst: INST.id, apertura: prim.fecha, estado: 'Activa', cierre: null });
      ats.forEach((a, k) => { if (k % 3 === 2) return; const sg = a.sig;
        const o = `TA ${sg.pas}/${sg.pad} mmHg, FC ${sg.fc} lpm, FR ${sg.fr} rpm, T° ${sg.temp} °C, SatO₂ ${sg.sat} %, IMC ${sg.imc}.\n${a.ef}`;
        const an = `Cuadro clínico compatible con «${a.motivo.toLowerCase()}», sin signos de alarma en el momento de la evaluación.`, pl = 'Manejo ambulatorio, medidas generales y educación al paciente. Control en 30 días o antes si hay signos de alarma.';
        const fecha = isoDT(new Date(new Date(a.fin).getTime() + 10 * 6e4));
        db.notas.push({ id: db.notas.length + 1, historia: hid, atencion: a.id, prof: a.prof, s: a.motivo + '. ' + a.ea, o, a: an, p: pl, firma: 1, fecha, hash: sello(a.id + an + pl + fecha) });
      });
    });
    const h1 = db.historias.find(h => h.pac === 1), a1 = atencionesSemilla(1)[0];
    if (h1 && a1) { db.anexos.push({ id: 1, historia: h1.id, atencion: a1.id, usuario: 'Camila Ortiz (Recepción)', nombre: 'Hemograma_completo.pdf', ruta: `/uploads/hc/${folioTxt(h1.id)}/Hemograma_completo.pdf`, tipo: 'PDF', fecha: a1.fin, size: 312000 },
      { id: 2, historia: h1.id, atencion: null, usuario: 'Camila Ortiz (Recepción)', nombre: 'Rx_torax_PA.jpg', ruta: `/uploads/hc/${folioTxt(h1.id)}/Rx_torax_PA.jpg`, tipo: 'Imagen', fecha: a1.fin, size: 845000 }); }
    return db;
  }
  const KEY = 'saludsync_modulo9_v1';
  const DB = (() => { const s = leer(KEY); return s && s.historias ? s : semillaDB(); })();
  const guardar = () => { try { sessionStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } };
  const historiaDe = pid => DB.historias.find(h => h.pac === pid && h.inst === INST.id);
  const notasDe = hid => DB.notas.filter(n => n.historia === hid);
  const anexosDe = hid => DB.anexos.filter(x => x.historia === hid);
  // Un folio se genera automáticamente cuando el paciente ya tiene atenciones finalizadas reales
  PACS.forEach(p => { if (!historiaDe(p.id)) { const r = atencionesDe(p.id).filter(a => a.real); if (r.length) { DB.historias.push({ id: Math.max(0, ...DB.historias.map(h => h.id)) + 1, pac: p.id, inst: INST.id, apertura: r[r.length - 1].fecha, estado: 'Activa', cierre: null }); guardar(); } } });
  function abrirFolio(pid) {
    const h = { id: Math.max(0, ...DB.historias.map(x => x.id)) + 1, pac: pid, inst: INST.id, apertura: isoDT(new Date()), estado: 'Activa', cierre: null };
    DB.historias.push(h); auditar('historia_clinica', h.id, 'Creación', null, { paciente: pacDe(pid).nombre, folio: folioTxt(h.id) }); guardar(); return h;
  }
  const medicoSesion = () => { const m2 = leer('saludsync_modulo2_v1'); const u = m2 && SES && m2.usuarios.find(x => x.id === SES.id); return u && u.rol === 3 ? PROFS.find(p => p.uid === u.id) : null; };

  // Selector de pacientes con búsqueda (compartido)
  function llenarSelectPac(sel, q, actual, marcar) {
    const qq = norm(q || ''); const lista = PACS.filter(p => !qq || norm(p.nombre).includes(qq) || norm(p.doc).includes(qq));
    sel.innerHTML = '<option value="">Seleccione…</option>' + lista.map(p => `<option value="${p.id}">${esc(p.nombre)} · ${esc(p.tipo)} ${esc(p.doc)}${marcar ? (historiaDe(p.id) ? ' · ' + folioTxt(historiaDe(p.id).id) : ' · (sin folio)') : ''}</option>`).join('');
    if (actual) sel.value = actual;
  }
  const BADGE_ANT = t => `<span class="badge badge-ant-${t} me-1">${t}</span>`;
  const notaHTML = n => {
    const pr = profDe(n.prof) || { nombre: '—' }, blk = (l, t, c) => t ? `<div class="soap-blk soap-${l}"><span class="soap-l">${l}</span><div class="soap-txt"><strong>${c}</strong><br>${esc(t)}</div></div>` : '';
    return `<div class="nota-card"><div class="d-flex justify-content-between flex-wrap gap-1 mb-2"><span class="badge bg-primary">SOAP</span><small class="text-muted">Atención ${n.atencion < 0 ? '#H' + Math.abs(n.atencion) : '#' + n.atencion}</small></div>
      ${blk('S', n.s, 'Subjetivo')}${blk('O', n.o, 'Objetivo')}${blk('A', n.a, 'Análisis')}${blk('P', n.p, 'Plan')}
      <div class="sello">🔏 Firmada electrónicamente por <strong>${esc(pr.nombre)}</strong> · ${fmtDT(n.fecha)} · Sello <code>${esc(n.hash)}</code> · 🔒 Inmutable</div></div>`;
  };

  /* =====================================================
     PANTALLA 9.1 · Visor de historia clínica
     ===================================================== */
  function initVisor() {
    if (document.body.dataset.page !== 'visor_historia') return;
    const params = new URLSearchParams(location.search); let pid = +params.get('pac') || (DB.historias[0] || {}).pac || 1;
    const llenar = () => llenarSelectPac($('#selPac'), $('#buscaPac').value, pid, true);
    llenar();
    $('#buscaPac').addEventListener('input', llenar); $('#selPac').addEventListener('change', e => { pid = +e.target.value || pid; render(); });

    function render() {
      const p = pacDe(pid), h = historiaDe(pid); $('#vacio').classList.toggle('d-none', !!h); $('#vContenido').classList.toggle('d-none', !h);
      if (!p) return;
      if (!h) { $('#vacioTexto').textContent = p.estado === 'Activo' ? `${p.nombre} aún no tiene folio en ${INST.nombre}. Cada paciente tiene un único folio por institución.` : 'El paciente está inactivo: no se puede abrir un folio nuevo.'; $('#btnAbrirFolio').disabled = p.estado !== 'Activo'; return; }
      const ats = atencionesDe(pid), notas = notasDe(h.id), anexos = anexosDe(h.id), cerrada = h.estado === 'Cerrada', ant = ANT.filter(a => a.pac === pid), al = ant.filter(a => a.tipo === 'Alérgico');
      $('#vAvatar').textContent = iniciales(p); $('#vFolio').textContent = folioTxt(h.id); $('#vEstado').className = 'badge ' + (cerrada ? 'bg-secondary' : 'bg-success'); $('#vEstado').textContent = h.estado;
      $('#vInmutable').classList.toggle('d-none', !cerrada); $('#folioCard').classList.toggle('cerrada', cerrada);
      $('#vNombre').textContent = p.nombre; $('#vDatos').textContent = `${p.tipo} ${p.doc} · ${edadTxt(p.nac)} · ${p.sexo} · EPS: ${p.eps || '—'}`;
      $('#vApertura').textContent = `Folio abierto el ${fmtF(h.apertura)} · ${INST.nombre}${cerrada ? ' · Cerrado el ' + fmtF(h.cierre) : ''}`;
      $('#vAlergias').classList.toggle('d-none', !al.length); $('#vAlergias').innerHTML = '⚠ ALERGIAS: ' + al.map(a => esc(a.desc)).join(' · ');
      $('#vStats').innerHTML = [['Atenciones finalizadas', ats.length], ['Notas firmadas', notas.length], ['Anexos', anexos.length], ['Antecedentes', ant.length]].map(([l, v]) => `<div class="col-6 col-md-3"><div class="mini-stat"><strong>${v}</strong><small>${l}</small></div></div>`).join('');
      $('#bannerCerrada').classList.toggle('d-none', !cerrada); $('#btnCerrarFolio').classList.toggle('d-none', cerrada);
      $('#btnNuevaNota').classList.toggle('disabled', cerrada); $('#btnNuevaNota').href = `evolucion_clinica.html?pac=${pid}`;
      $('#formAnexo').classList.toggle('d-none', cerrada);

      // Resumen
      const u = ats[0], s = u && u.sig;
      $('#vUltimos').innerHTML = s ? `<div class="small text-muted mb-1">${fmtDT(u.fecha)}</div><table class="table table-sm ultimo-signos mb-0"><tbody>
        <tr><td>Presión arterial</td><td><strong>${s.pas}/${s.pad}</strong> mmHg</td></tr><tr><td>F. cardíaca / respiratoria</td><td><strong>${s.fc}</strong> lpm · <strong>${s.fr}</strong> rpm</td></tr>
        <tr><td>Temperatura / SatO₂</td><td><strong>${s.temp}</strong> °C · <strong>${s.sat}</strong> %</td></tr><tr><td>Peso / Talla / IMC</td><td><strong>${s.peso}</strong> kg · <strong>${s.talla}</strong> cm · <strong>${s.imc}</strong></td></tr></tbody></table>`
        : '<p class="text-muted small mb-0">Sin signos vitales registrados.</p>';
      $('#vAntecedentes').innerHTML = ant.length ? ['Alérgico', 'Patológico', 'Quirúrgico', 'Farmacológico', 'Familiar'].filter(t => ant.some(a => a.tipo === t)).map(t => `<h3>${t}</h3>` + ant.filter(a => a.tipo === t).map(a => `<div class="ant-item">${esc(a.desc)}<br><small>${fmtF(a.fecha)}</small></div>`).join('')).join('') : '<p class="text-muted small mb-0">Sin antecedentes registrados.</p>';

      // Línea de tiempo
      $('#fProf').innerHTML = '<option value="">Todos los profesionales</option>' + [...new Set(ats.map(a => a.prof))].map(id => `<option value="${id}">${esc((profDe(id) || { nombre: '—' }).nombre)}</option>`).join('');
      renderTimeline(ats, h, cerrada);
      $('#nNotas').textContent = notas.length; $('#nAnexos').textContent = anexos.length;
      $('#listaNotas').innerHTML = notas.length ? notas.slice().sort((a, b) => b.fecha.localeCompare(a.fecha)).map(notaHTML).join('') : '<p class="text-muted mb-0">Aún no hay notas de evolución firmadas en este folio.</p>';
      $('#fAtencion').innerHTML = '<option value="">General (sin atención)</option>' + ats.map(a => `<option value="${a.id}">${fmtDT(a.fecha)} · ${esc(a.motivo)}</option>`).join('');
      $('#tablaAnexos').innerHTML = anexos.length ? anexos.slice().sort((a, b) => b.fecha.localeCompare(a.fecha)).map(x => { const at = ats.find(a => a.id === x.atencion); return `<tr><td><span class="anexo-ico">${x.tipo === 'PDF' ? '📄' : x.tipo === 'Imagen' ? '🖼️' : '📃'}</span> <strong>${esc(x.nombre)}</strong><span class="cell-sub">${esc(x.ruta)} · ${(x.size / 1024).toFixed(0)} KB</span></td><td><span class="badge bg-primary">${x.tipo}</span></td><td>${at ? fmtDT(at.fecha) : 'General'}</td><td>${esc(x.usuario)}</td><td>${fmtDT(x.fecha)}</td></tr>`; }).join('') : '<tr><td colspan="5" class="text-center text-muted py-4">Sin anexos indexados.</td></tr>';
    }

    function renderTimeline(ats, h, cerrada) {
      const q = norm($('#fTexto').value.trim()), fp = +$('#fProf').value, lista = ats.filter(a => (!q || norm(a.motivo).includes(q)) && (!fp || a.prof === fp));
      let year = '';
      $('#timeline').innerHTML = lista.length ? lista.map(a => {
        const pr = profDe(a.prof) || { nombre: '—', esp: [] }, y = new Date(a.fecha).getFullYear(), idc = 'd' + Math.abs(a.id) + (a.id < 0 ? 'h' : 'r');
        const ns = notasDe(h.id).filter(n => n.atencion === a.id), ax = anexosDe(h.id).filter(x => x.atencion === a.id), s = a.sig;
        let head = ''; if (y !== year) { year = y; head = `<li class="tl-year">${y}</li>`; }
        return head + `<li class="tl-item"><div class="tl-card"><div class="d-flex flex-wrap justify-content-between gap-2"><div><h3>${esc(a.motivo)}</h3>
          <div class="tl-meta">📅 ${fmtDT(a.fecha)} · 👨‍⚕️ ${esc(pr.nombre)} (${esc(espProf(pr))}) · Atención ${a.id < 0 ? '#H' + Math.abs(a.id) : '#' + a.id}${a.cita ? ' · Cita #' + a.cita : ''}</div></div>
          <div><span class="badge bg-${ns.length ? 'success' : 'secondary'}">🔏 ${ns.length} nota(s)</span> <span class="badge bg-${ax.length ? 'info text-dark' : 'secondary'}">📎 ${ax.length}</span></div></div>
          <button class="btn btn-sm btn-link px-0" type="button" data-bs-toggle="collapse" data-bs-target="#${idc}">Ver detalle clínico</button>
          ${cerrada ? '' : `<a class="btn btn-sm btn-outline-success ms-2 no-print" href="evolucion_clinica.html?pac=${h.pac}&atencion=${a.id}">✍️ Agregar nota</a>`}
          <div class="collapse" id="${idc}"><dl class="tl-detail mt-2 mb-2"><dt>Enfermedad actual</dt><dd>${esc(a.ea || '—')}</dd><dt>Revisión por sistemas</dt><dd>${esc(a.rs || '—')}</dd><dt>Examen físico</dt><dd>${esc(a.ef || '—')}</dd>
            ${a.obs ? `<dt>Observaciones</dt><dd>${esc(a.obs)}</dd>` : ''}</dl>
            ${s ? `<table class="table table-bordered sig-table mb-3"><thead><tr><th>PA</th><th>FC</th><th>FR</th><th>T°</th><th>SatO₂</th><th>Peso</th><th>Talla</th><th>IMC</th></tr></thead><tbody><tr><td>${s.pas}/${s.pad}</td><td>${s.fc}</td><td>${s.fr}</td><td>${s.temp}</td><td>${s.sat}%</td><td>${s.peso}</td><td>${s.talla}</td><td>${s.imc}</td></tr></tbody></table>` : ''}
            ${ns.map(notaHTML).join('') || '<p class="text-muted small">Sin notas de evolución para esta atención.</p>'}
            ${ax.length ? '<div class="small">' + ax.map(x => `📎 ${esc(x.nombre)}`).join(' · ') + '</div>' : ''}</div></div></li>`;
      }).join('') : '<li class="text-muted">No hay atenciones finalizadas para mostrar.</li>';
    }
    $('#fTexto').addEventListener('input', () => { const h = historiaDe(pid); if (h) renderTimeline(atencionesDe(pid), h, h.estado === 'Cerrada'); });
    $('#fProf').addEventListener('change', () => { const h = historiaDe(pid); if (h) renderTimeline(atencionesDe(pid), h, h.estado === 'Cerrada'); });
    $('#btnImprimir').addEventListener('click', () => window.print());

    // Abrir folio
    $('#btnAbrirFolio').addEventListener('click', e => { const unlock = SS.lock(e.currentTarget, 'Abriendo folio…'); setTimeout(() => { const h = abrirFolio(pid); llenar(); render(); unlock(); SS.toast(`Folio ${folioTxt(h.id)} abierto correctamente.`); }, 700); });

    // Cerrar folio (inmutable)
    $('#btnCerrarFolio').addEventListener('click', () => { const h = historiaDe(pid); $('#chkCerrar').checked = false; $('#errCerrar').classList.add('d-none'); $('#cerrarInfo').innerHTML = `Folio <strong>${folioTxt(h.id)}</strong> de <strong>${esc(pacDe(pid).nombre)}</strong>.`; modal('modalCerrar').show(); });
    $('#btnConfirmarCierre').addEventListener('click', e => {
      if (!$('#chkCerrar').checked) { $('#errCerrar').classList.remove('d-none'); return; }
      const unlock = SS.lock(e.currentTarget, 'Cerrando…');
      setTimeout(() => { const h = historiaDe(pid); h.estado = 'Cerrada'; h.cierre = isoDT(new Date()); auditar('historia_clinica', h.id, 'Modificación', { estado: 'Activa' }, { estado: 'Cerrada' }); guardar(); modal('modalCerrar').hide(); unlock(); llenar(); render(); SS.toast('Folio cerrado. Quedó inmutable.', 'secondary'); }, 900);
    });

    // Anexos (RF-HCL-03)
    const EXT = { pdf: 'PDF', png: 'Imagen', jpg: 'Imagen', jpeg: 'Imagen', doc: 'Documento', docx: 'Documento' };
    $('#formAnexo').addEventListener('submit', e => {
      e.preventDefault(); const btn = $('#btnSubirAnexo'); if (btn.disabled) return; const f = $('#fArchivo').files[0], h = historiaDe(pid), fb = $('#fbArchivo'), inp = $('#fArchivo');
      let err = ''; if (!f) err = 'Seleccione un archivo.'; else { const ext = f.name.split('.').pop().toLowerCase(); if (!EXT[ext]) err = 'Tipo no permitido. Use PDF, PNG, JPG, DOC o DOCX.'; else if (f.size > 10 * 1024 * 1024) err = 'El archivo supera los 10 MB.'; }
      inp.setCustomValidity(err); fb.textContent = err || 'Seleccione un archivo válido.'; e.currentTarget.classList.add('was-validated'); if (err) return;
      const unlock = SS.lock(btn, 'Subiendo…');
      setTimeout(() => {
        const ext = f.name.split('.').pop().toLowerCase(), id = Math.max(0, ...DB.anexos.map(x => x.id)) + 1, at = $('#fAtencion').value;
        DB.anexos.push({ id, historia: h.id, atencion: at ? +at : null, usuario: responsable(), nombre: f.name.slice(0, 150), ruta: `/uploads/hc/${folioTxt(h.id)}/${f.name}`, tipo: EXT[ext], fecha: isoDT(new Date()), size: f.size });
        auditar('anexo_clinico', id, 'Creación', null, { archivo: f.name, folio: folioTxt(h.id) }); guardar(); $('#formAnexo').reset(); $('#formAnexo').classList.remove('was-validated'); render(); unlock(); SS.toast('Anexo indexado en la historia clínica.');
      }, 800);
    });
    render();
  }

  /* =====================================================
     PANTALLA 9.2 · Nota de evolución SOAP
     ===================================================== */
  function initEvolucion() {
    if (document.body.dataset.page !== 'evolucion_clinica') return;
    const params = new URLSearchParams(location.search), f = $('#formNota'), btn = $('#btnFirmar'); let pid = +params.get('pac') || 0, aid = params.get('atencion') !== null ? +params.get('atencion') : null, hist = null;
    const llenar = () => llenarSelectPac($('#selPacF'), $('#buscaPacF').value, pid, true); llenar();
    $('#buscaPacF').addEventListener('input', llenar);
    $('#selPacF').addEventListener('change', e => { pid = +e.target.value || 0; aid = null; cargar(); });

    function habilitar(ok) { $('#fsNota').disabled = !ok; $('#chkFirma').disabled = !ok; btn.disabled = !ok; $('#btnPrecargar').disabled = !ok; }
    function cargar() {
      const p = pacDe(pid), box = $('#bloqueFolio'); hist = p ? historiaDe(pid) : null; habilitar(false); $('#selAtencion').innerHTML = '<option value="">Seleccione primero un paciente…</option>'; $('#atResumen').classList.add('d-none'); $('#notasPrevias').innerHTML = '';
      const pr = medicoSesion(); $('#firmante').textContent = pr ? pr.nombre : 'Se tomará del profesional de la atención (demostración)';
      if (!p) { box.innerHTML = ''; return; }
      if (!hist) {
        box.innerHTML = p.estado === 'Activo' ? `<div class="alert alert-warning mb-0 d-flex flex-wrap justify-content-between align-items-center gap-2"><span>📂 <strong>${esc(p.nombre)}</strong> no tiene folio de historia clínica en esta institución.</span><button type="button" class="btn btn-success btn-sm" id="btnAbrirFolioF">📁 Abrir folio</button></div>` : '<div class="alert alert-danger mb-0">El paciente está inactivo: no se puede abrir un folio nuevo.</div>';
        const b = $('#btnAbrirFolioF'); if (b) b.addEventListener('click', e => { const unlock = SS.lock(e.currentTarget, 'Abriendo…'); setTimeout(() => { abrirFolio(pid); llenar(); unlock(); SS.toast('Folio abierto correctamente.'); cargar(); }, 700); });
        return;
      }
      if (hist.estado === 'Cerrada') { box.innerHTML = `<div class="alert alert-secondary mb-0">🔒 El folio <strong>${folioTxt(hist.id)}</strong> está <strong>cerrado</strong>. No admite nuevas notas de evolución.</div>`; return; }
      box.innerHTML = `<div class="pac-sel-card d-flex flex-wrap justify-content-between align-items-center gap-2"><div><strong>${esc(p.nombre)}</strong> · ${esc(p.tipo)} ${esc(p.doc)} · ${edadTxt(p.nac)}<br><small class="text-muted">Folio abierto el ${fmtF(hist.apertura)}</small></div><span class="badge bg-success fs-6">${folioTxt(hist.id)} · Activa</span></div>`;
      const ats = atencionesDe(pid);
      if (!ats.length) { $('#selAtencion').innerHTML = '<option value="">Sin atenciones finalizadas</option>'; $('#notasPrevias').innerHTML = '<div class="alert alert-warning small mb-0">El paciente no tiene atenciones finalizadas. Finalice una consulta en el <a href="../atencion/panel_asistencial.html">panel asistencial</a> para poder registrar la nota.</div>'; return; }
      $('#selAtencion').innerHTML = '<option value="">Seleccione…</option>' + ats.map(a => `<option value="${a.id}">${fmtDT(a.fecha)} · ${esc((profDe(a.prof) || { corto: '—' }).corto)} · ${esc(a.motivo)}</option>`).join('');
      if (aid !== null && ats.some(a => a.id === aid)) $('#selAtencion').value = aid; selAtencion();
    }
    function selAtencion() {
      const id = $('#selAtencion').value === '' ? null : +$('#selAtencion').value; aid = id; const ats = atencionesDe(pid), a = ats.find(x => x.id === id);
      habilitar(!!a); if (!a) { $('#atResumen').classList.add('d-none'); $('#notasPrevias').innerHTML = ''; return; }
      const pr = profDe(a.prof), med = medicoSesion(); $('#firmante').textContent = (med || pr).nombre;
      $('#atResumen').classList.remove('d-none'); $('#atResumen').innerHTML = `<strong>${esc(a.motivo)}</strong><br>📅 ${fmtDT(a.fecha)} · 👨‍⚕️ ${esc(pr.nombre)} · ${a.cita ? 'Cita #' + a.cita : 'Cita histórica'} · Atención ${a.id < 0 ? '#H' + Math.abs(a.id) : '#' + a.id}`;
      const prev = notasDe(hist.id).filter(n => n.atencion === a.id); $('#notasPrevias').innerHTML = prev.length ? `<div class="alert alert-info small mb-0">Esta atención ya tiene <strong>${prev.length}</strong> nota(s) firmada(s). La nueva se registrará como una nota adicional.</div>` : '';
    }
    $('#selAtencion').addEventListener('change', selAtencion);
    $('#btnPrecargar').addEventListener('click', () => {
      const a = atencionesDe(pid).find(x => x.id === aid); if (!a) return; const s = a.sig;
      $('#n_s').value = `${a.motivo}.\n${a.ea || ''}`.trim();
      $('#n_o').value = (s ? `TA ${s.pas}/${s.pad} mmHg, FC ${s.fc} lpm, FR ${s.fr} rpm, T° ${s.temp} °C, SatO₂ ${s.sat} %, IMC ${s.imc}.\n` : '') + (a.ef || '');
      SS.toast('Subjetivo y Objetivo precargados. Revíselos y complete Análisis y Plan.', 'secondary');
    });
    $$('textarea[id^="n_"]').forEach(t => t.addEventListener('input', () => { const c = $(`[data-cnt="${t.id}"]`); if (c) c.textContent = t.value.length; }));

    f.addEventListener('submit', e => {
      e.preventDefault(); if (btn.disabled) return; f.classList.add('was-validated');
      if (!f.checkValidity()) { (f.querySelector(':invalid') || f).scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      const a = atencionesDe(pid).find(x => x.id === aid), pr = medicoSesion() || profDe(a.prof);
      $('#firmaCuerpo').innerHTML = `<p>Se firmará la nota SOAP de <strong>${esc(pacDe(pid).nombre)}</strong> (folio <strong>${folioTxt(hist.id)}</strong>) como <strong>${esc(pr.nombre)}</strong>.</p><p class="small text-muted mb-0">Quedará registrada con sello de integridad y no podrá editarse ni eliminarse.</p>`;
      modal('modalFirma').show();
    });
    $('#btnConfirmarFirma').addEventListener('click', e => {
      const unlock = SS.lock(e.currentTarget, 'Firmando…'); btn.disabled = true;
      setTimeout(() => {
        const a = atencionesDe(pid).find(x => x.id === aid), pr = medicoSesion() || profDe(a.prof), fecha = isoDT(new Date()), id = Math.max(0, ...DB.notas.map(n => n.id)) + 1;
        const n = { id, historia: hist.id, atencion: aid, prof: pr.id, s: $('#n_s').value.trim(), o: $('#n_o').value.trim(), a: $('#n_a').value.trim(), p: $('#n_p').value.trim(), firma: 1, fecha };
        n.hash = sello(aid + n.s + n.o + n.a + n.p + fecha); DB.notas.push(n);
        auditar('nota_evolucion', id, 'Creación', null, { folio: folioTxt(hist.id), tipo: 'SOAP', firma_digital: 1 }); guardar();
        modal('modalFirma').hide(); unlock(); f.classList.add('d-none'); $('#exito').classList.remove('d-none'); $('#btnVerHistoria').href = `visor_historia.html?pac=${pid}`;
        $('#exitoTexto').innerHTML = `Nota de evolución firmada por <strong>${esc(pr.nombre)}</strong> en el folio <strong>${folioTxt(hist.id)}</strong>.<br><small>Sello de integridad: <code>${n.hash}</code></small>`; window.scrollTo({ top: 0, behavior: 'smooth' }); SS.toast('Nota firmada y registrada.');
      }, 900);
    });
    cargar();
  }

  document.addEventListener('DOMContentLoaded', () => { setInst(); initVisor(); initEvolucion(); });
})();