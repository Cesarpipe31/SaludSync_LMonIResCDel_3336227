/* ===== SaludSync · Módulo 10: Diagnósticos Médicos (mockup interactivo, sin backend) ===== */
(function () {
  'use strict';

  /* ---------- Utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const pad = n => String(n).padStart(2, '0');
  const isoD = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const isoDT = d => `${isoD(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const parseD = s => new Date(s + 'T00:00:00');
  const HOY = new Date(); HOY.setHours(0, 0, 0, 0);
  const fmtDT = s => { const d = new Date(s); return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const fmtF = s => new Date(s).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  const leer = k => { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } };
  const edad = s => { const n = parseD(s); let a = HOY.getFullYear() - n.getFullYear(); const m = HOY.getMonth() - n.getMonth(); if (m < 0 || (m === 0 && HOY.getDate() < n.getDate())) a--; return a; };
  const edadTxt = s => { const a = edad(s); if (a >= 2) return a + ' años'; const n = parseD(s); return ((HOY.getFullYear() - n.getFullYear()) * 12 + HOY.getMonth() - n.getMonth() - (HOY.getDate() < n.getDate() ? 1 : 0)) + ' meses'; };
  const hl = (t, q) => { if (!q) return esc(t); const i = norm(t).indexOf(q); return i < 0 ? esc(t) : esc(t.slice(0, i)) + '<mark class="hl">' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length)); };
  const cls = s => s.replace(/\s+/g, '').replace(/\//g, '-').replace(/ó/g, 'o');

  /* ---------- Institución, sesión y auditoría ---------- */
  function instActiva() {
    let id = 1; const s = leer('saludsync_sesion'), m2 = leer('saludsync_modulo2_v1'); const u = m2 && s && m2.usuarios.find(x => x.id === s.id); if (u && u.inst) id = u.inst;
    const nombres = { 1: 'Clínica Santa Lucía S.A.S.', 2: 'IPS Vida Plena Ltda.', 3: 'Centro Médico Los Andes', 5: 'Salud Integral del Caribe IPS' };
    return { id, nombre: nombres[id] || 'Institución #' + id };
  }
  const INST = instActiva(), SES = leer('saludsync_sesion');
  const responsable = () => SES ? `${SES.nombre} (${SES.rol})` : 'Usuario del sistema';
  const setInst = () => $$('[data-inst-nombre]').forEach(e => e.textContent = INST.nombre);
  function auditar(tabla, registro, accion, ant, nuevo) {
    const m2 = leer('saludsync_modulo2_v1'); if (!m2 || !m2.auditoria) return;
    m2.auditoria.unshift({ id: Math.max(0, ...m2.auditoria.map(a => a.id)) + 1, usuario: responsable(), tabla, registro, accion, ant, nuevo, ip: '192.168.1.10', fecha: `${isoD(new Date())} ${pad(new Date().getHours())}:${pad(new Date().getMinutes())}` });
    try { sessionStorage.setItem('saludsync_modulo2_v1', JSON.stringify(m2)); } catch (e) { }
  }

  /* ---------- Catálogo CIE-10 (muestra de códigos frecuentes) ---------- */
  const C = { inf: 'Enfermedades infecciosas y parasitarias', san: 'Enfermedades de la sangre', end: 'Endocrinas, nutricionales y metabólicas', men: 'Trastornos mentales y del comportamiento', nrv: 'Enfermedades del sistema nervioso',
    ojo: 'Enfermedades del ojo y del oído', cir: 'Enfermedades del sistema circulatorio', res: 'Enfermedades del sistema respiratorio', dig: 'Enfermedades del sistema digestivo', pie: 'Enfermedades de la piel',
    osm: 'Enfermedades del sistema osteomuscular', gen: 'Enfermedades del sistema genitourinario', sin: 'Síntomas y signos generales', tra: 'Traumatismos', fac: 'Factores que influyen en la salud' };
  const CIE10 = [['A09', 'Diarrea y gastroenteritis de presunto origen infeccioso', C.inf], ['B34.9', 'Infección viral, no especificada', C.inf], ['B35.9', 'Dermatofitosis, no especificada', C.inf], ['D64.9', 'Anemia, no especificada', C.san],
    ['E03.9', 'Hipotiroidismo, no especificado', C.end], ['E11.9', 'Diabetes mellitus tipo 2, sin mención de complicación', C.end], ['E55.9', 'Deficiencia de vitamina D, sin otra especificación', C.end], ['E66.9', 'Obesidad, no especificada', C.end], ['E78.5', 'Hiperlipidemia, no especificada', C.end],
    ['F32.9', 'Episodio depresivo, no especificado', C.men], ['F41.1', 'Trastorno de ansiedad generalizada', C.men], ['F51.0', 'Insomnio no orgánico', C.men], ['G43.9', 'Migraña, sin otra especificación', C.nrv], ['G44.2', 'Cefalea tensional', C.nrv],
    ['H10.9', 'Conjuntivitis, no especificada', C.ojo], ['H66.9', 'Otitis media, no especificada', C.ojo], ['I10', 'Hipertensión esencial (primaria)', C.cir], ['I25.9', 'Enfermedad isquémica crónica del corazón, no especificada', C.cir], ['I50.9', 'Insuficiencia cardíaca, no especificada', C.cir],
    ['I83.9', 'Várices de miembros inferiores sin úlcera ni inflamación', C.cir], ['J00', 'Rinofaringitis aguda (resfriado común)', C.res], ['J02.9', 'Faringitis aguda, no especificada', C.res], ['J03.9', 'Amigdalitis aguda, no especificada', C.res],
    ['J06.9', 'Infección aguda de las vías respiratorias superiores, no especificada', C.res], ['J18.9', 'Neumonía, no especificada', C.res], ['J20.9', 'Bronquitis aguda, no especificada', C.res], ['J30.4', 'Rinitis alérgica, no especificada', C.res], ['J45.9', 'Asma, no especificada', C.res],
    ['K02.9', 'Caries dental, sin otra especificación', C.dig], ['K05.1', 'Gingivitis crónica', C.dig], ['K21.9', 'Enfermedad del reflujo gastroesofágico sin esofagitis', C.dig], ['K29.7', 'Gastritis, no especificada', C.dig], ['K59.0', 'Estreñimiento', C.dig],
    ['L20.9', 'Dermatitis atópica, no especificada', C.pie], ['L30.9', 'Dermatitis, no especificada', C.pie], ['L70.0', 'Acné vulgar', C.pie], ['M17.9', 'Gonartrosis, no especificada', C.osm], ['M19.9', 'Artrosis, no especificada', C.osm], ['M25.5', 'Dolor en articulación', C.osm],
    ['M54.2', 'Cervicalgia', C.osm], ['M54.5', 'Lumbago no especificado', C.osm], ['M79.1', 'Mialgia', C.osm], ['N30.0', 'Cistitis aguda', C.gen], ['N39.0', 'Infección de vías urinarias, sitio no especificado', C.gen], ['N76.0', 'Vaginitis aguda', C.gen],
    ['N92.0', 'Menstruación excesiva y frecuente con ciclo regular', C.gen], ['R05', 'Tos', C.sin], ['R10.4', 'Dolor abdominal, otro y el no especificado', C.sin], ['R42', 'Mareo y desvanecimiento', C.sin], ['R50.9', 'Fiebre, no especificada', C.sin], ['R51', 'Cefalea', C.sin],
    ['S93.4', 'Esguince y torcedura del tobillo', C.tra], ['Z00.0', 'Examen médico general', C.fac], ['Z00.1', 'Control de salud de rutina del niño', C.fac], ['Z23', 'Necesidad de inmunización contra enfermedad bacteriana única', C.fac],
    ['Z30.0', 'Asesoramiento general sobre anticoncepción', C.fac], ['Z34.9', 'Supervisión de embarazo normal, no especificado', C.fac], ['Z71.3', 'Consejo y vigilancia dietética', C.fac]].map(([codigo, desc, cat]) => ({ codigo, desc, cat }));
  const cieDe = c => CIE10.find(x => x.codigo === c) || { codigo: c, desc: '(código fuera del catálogo de muestra)', cat: '—' };
  const PROGRAMAS = ['Hipertensión arterial y riesgo cardiovascular', 'Diabetes mellitus', 'Salud mental', 'Salud materno-perinatal', 'Crecimiento y desarrollo', 'Inmunizaciones (PAI)', 'Salud oral', 'Tuberculosis y enfermedades transmisibles'];
  const progSugerido = c => c.startsWith('I10') || c.startsWith('I25') || c.startsWith('I50') ? PROGRAMAS[0] : c.startsWith('E11') ? PROGRAMAS[1] : c.startsWith('F') ? PROGRAMAS[2] : c.startsWith('Z34') ? PROGRAMAS[3] : c === 'Z00.1' ? PROGRAMAS[4] : c === 'Z23' ? PROGRAMAS[5] : c.startsWith('K02') || c.startsWith('K05') ? PROGRAMAS[6] : '';

  /* ---------- Catálogos de otros módulos (sesión o semillas) ---------- */
  const PAC_SEED = [[1, 'CC', '1100234567', 'Ana Lucía', 'Torres Gil', 'Activo', '1991-04-12', 'Femenino'], [2, 'CC', '91234501', 'Carlos Eduardo', 'Mendoza Ruiz', 'Activo', '1978-09-03', 'Masculino'], [3, 'TI', '1034567890', 'Valentina', 'Rojas Mejía', 'Activo', '2010-02-20', 'Femenino'],
    [4, 'RC', '1098123456', 'Samuel', 'Ortega Plata', 'Activo', '2022-06-15', 'Masculino'], [5, 'CC', '37890456', 'Rosa Elena', 'Barrios Núñez', 'Activo', '1955-11-30', 'Femenino'], [6, 'CE', '5601234', 'Juan José', 'Martínez Pérez', 'Activo', '1989-01-17', 'Masculino'],
    [7, 'PPT', '5870023', 'Daniela', 'Gómez Castro', 'Activo', '1996-07-08', 'Femenino'], [8, 'CC', '13789012', 'Héctor Fabio', 'Lozano Vega', 'Inactivo', '1967-03-25', 'Masculino'], [9, 'CC', '63890123', 'Natalia', 'Cárdenas Rueda', 'Activo', '1985-12-02', 'Femenino'],
    [10, 'TI', '1102345678', 'Santiago', 'Arias Calderón', 'Activo', '2008-10-05', 'Masculino'], [11, 'PEP', '4567890', 'Luisa Fernanda', 'Herrera Díaz', 'Activo', '1993-05-19', 'Femenino'], [12, 'Pasaporte', 'AB123456', 'Michael', 'Anderson', 'Inactivo', '1974-08-11', 'Masculino']]
    .map(([id, tipo, doc, nombres, apellidos, estado, nac, sexo]) => ({ id, tipo, doc, nombres, apellidos, estado, nac, sexo }));
  const PROF_SEED = [[1, 'Andrés Felipe', 'Navarro Díaz', 3], [2, 'Paula Andrea', 'Rueda Mantilla', 4], [3, 'Mauricio', 'Ariza Gómez', null], [4, 'Liliana', 'Cortés Vargas', null], [5, 'Iván Darío', 'Suárez Pinto', null], [6, 'Marcela', 'Quintero Ardila', null],
    [7, 'Camilo Andrés', 'Ortega Rey', null], [8, 'Sergio', 'Medina Restrepo', null], [9, 'Sofía', 'Bermúdez Luna', null], [10, 'Diana Patricia', 'Cifuentes Mora', null]].map(([id, nombres, apellidos, uid]) => ({ id, nombres, apellidos, uid }));
  const M3 = leer('saludsync_modulo3_v1'), M4 = leer('saludsync_modulo4_v1'), M8 = leer('saludsync_modulo8_v1');
  const PACS = ((M3 && M3.pacientes) ? M3.pacientes : PAC_SEED).map(p => ({ id: p.id, tipo: p.tipo, doc: p.doc, nombre: `${p.nombres} ${p.apellidos}`, estado: p.estado, nac: p.nac, sexo: p.sexo }));
  const PROFS = ((M4 && M4.profesionales) ? M4.profesionales : PROF_SEED).map(p => ({ id: p.id, nombre: `${p.nombres} ${p.apellidos}`, corto: `${p.nombres.split(' ')[0]} ${p.apellidos.split(' ')[0]}`, uid: p.uid }));
  const pacDe = id => PACS.find(p => p.id === id), profDe = id => PROFS.find(p => p.id === id);
  const medicoSesion = () => { const m2 = leer('saludsync_modulo2_v1'); const u = m2 && SES && m2.usuarios.find(x => x.id === SES.id); return u && u.rol === 3 ? PROFS.find(p => p.uid === u.id) : null; };
  const ALERG_SEED = { 1: ['Penicilina: rash cutáneo generalizado.'], 3: ['Alergia estacional al polen.'], 6: ['AINEs (diclofenaco): urticaria.'] };
  const alergias = pid => (M8 && M8.antecedentes) ? M8.antecedentes.filter(a => a.pac === pid && a.tipo === 'Alérgico').map(a => a.desc) : (ALERG_SEED[pid] || []);

  /* ---------- Atenciones finalizadas (mismas del Módulo 9: históricas de ejemplo + reales del Módulo 8) ---------- */
  const MOT_AD = ['Control de presión arterial', 'Dolor lumbar de 5 días de evolución', 'Síntomas gripales y tos', 'Revisión general y exámenes de rutina', 'Cefalea recurrente', 'Control de glucemia'];
  const MOT_PED = ['Control de crecimiento y desarrollo', 'Fiebre y malestar general', 'Esquema de vacunación'];
  const PAC_HIST = [1, 2, 3, 5, 6, 9];
  function atencionesSemilla(pid) {
    const p = pacDe(pid); if (!p || !PAC_HIST.includes(pid)) return [];
    const a = edad(p.nac), offs = [28, 95, 210, 380, 540], n = 2 + (pid % 3), out = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(HOY); d.setDate(d.getDate() - offs[i] - pid); d.setHours(8 + (pid + i) % 8, 10 + (i * 15) % 50);
      const pool = a < 14 ? MOT_PED : MOT_AD, prof = a < 14 ? 2 : [1, 3, 6, 9][(pid + i) % 4];
      out.push({ id: -(pid * 100 + i + 1), pac: pid, fecha: isoDT(d), fin: isoDT(new Date(d.getTime() + 25 * 6e4)), prof, motivo: pool[(pid + i) % pool.length], cita: null });
    }
    return out;
  }
  function atencionesDe(pid) {
    const out = atencionesSemilla(pid);
    if (M8 && M8.atenciones) M8.atenciones.filter(a => a.pac === pid && a.estado === 'Finalizada').forEach(a => out.push({ id: a.id, pac: pid, fecha: a.inicio, fin: a.fin, prof: a.prof, motivo: a.motivo || '(sin motivo)', cita: a.cita }));
    return out.sort((x, y) => y.fecha.localeCompare(x.fecha));
  }
  const atTxt = a => `${a.id < 0 ? '#H' + Math.abs(a.id) : '#' + a.id}`;

  /* ---------- Datos propios: diagnostico ---------- */
  const MAPA = { 'Control de presión arterial': [['I10', 'Principal']], 'Dolor lumbar de 5 días de evolución': [['M54.5', 'Principal']], 'Síntomas gripales y tos': [['J06.9', 'Principal'], ['R05', 'Relacionado 1']],
    'Revisión general y exámenes de rutina': [['Z00.0', 'Principal']], 'Cefalea recurrente': [['G43.9', 'Principal'], ['R51', 'Relacionado 1']], 'Control de glucemia': [['E11.9', 'Principal'], ['E66.9', 'Relacionado 1']],
    'Control de crecimiento y desarrollo': [['Z00.1', 'Principal']], 'Fiebre y malestar general': [['R50.9', 'Principal'], ['J02.9', 'Relacionado 1']], 'Esquema de vacunación': [['Z23', 'Principal']] };
  function semillaDx() {
    const out = []; let id = 1;
    PAC_HIST.forEach(pid => {
      const vistos = new Set();
      atencionesSemilla(pid).slice().sort((a, b) => a.fecha.localeCompare(b.fecha)).forEach((a, i) => {
        if ((pid + i) % 5 === 0) return; // algunas atenciones quedan pendientes de diagnóstico
        (MAPA[a.motivo] || []).forEach(([cod, tipo]) => {
          const conf = vistos.has(cod) ? 'Confirmado Repetido' : (cod === 'G43.9' ? 'Impresión Diagnóstica' : 'Confirmado Nuevo'); vistos.add(cod);
          out.push({ id: id++, atencion: a.id, cie: cod, tipo, conf, obs: `Valoración clínica en la consulta del ${fmtF(a.fecha)}.`, programa: tipo === 'Principal' ? progSugerido(cod) : '', fecha: isoDT(new Date(new Date(a.fin).getTime() + 15 * 6e4)), prof: a.prof });
        });
      });
    });
    return out;
  }
  const KEY = 'saludsync_modulo10_v1';
  const DB = (() => { const s = leer(KEY); return s && s.diagnosticos ? s : { diagnosticos: semillaDx() }; })();
  const guardar = () => { try { sessionStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } };
  const dxDeAtencion = id => DB.diagnosticos.filter(d => d.atencion === id);
  // Diagnósticos del paciente con la atención asociada
  function dxPac(pid) { const ats = atencionesDe(pid), ids = new Map(ats.map(a => [a.id, a])); return DB.diagnosticos.filter(d => ids.has(d.atencion)).map(d => ({ ...d, at: ids.get(d.atencion) })).sort((a, b) => b.at.fecha.localeCompare(a.at.fecha)); }
  // Estado actual de la patología (derivado del historial; el modelo no tiene esta columna)
  function estadoPatologia(pid, cie) {
    const ds = dxPac(pid).filter(d => d.cie === cie).sort((a, b) => a.at.fecha.localeCompare(b.at.fecha)), ult = ds[ds.length - 1]; if (!ult) return '—';
    if (ult.tipo === 'Descarte') return 'Descartado'; if (ult.conf === 'Impresión Diagnóstica') return 'En estudio';
    return ds.filter(d => d.tipo !== 'Descarte' && d.conf !== 'Impresión Diagnóstica').length >= 2 ? 'Crónico / recurrente' : 'Confirmado';
  }
  const badgeTipo = t => `<span class="tdx tdx-${t.replace(' ', '')}">${t}</span>`;
  const badgeConf = c => `<span class="conf-chip conf-${c.includes('Nuevo') ? 'Nuevo' : c.includes('Repetido') ? 'Repetido' : 'Impresion'}">${c}</span>`;
  const badgeEst = e => `<span class="est-pat est-${e.replace(/\s*\/\s*/g, '-').replace(/\s+/g, '-')}">${e}</span>`;
  function llenarSelectPac(sel, q, actual) { const qq = norm(q || ''); sel.innerHTML = '<option value="">Seleccione…</option>' + PACS.filter(p => !qq || norm(p.nombre).includes(qq) || norm(p.doc).includes(qq)).map(p => `<option value="${p.id}">${esc(p.nombre)} · ${esc(p.tipo)} ${esc(p.doc)}</option>`).join(''); if (actual) sel.value = actual; }
  const ctxHTML = p => { const al = alergias(p.id); return `<div class="d-flex flex-wrap justify-content-between align-items-center gap-2"><div><strong>${esc(p.nombre)}</strong> · ${esc(p.tipo)} ${esc(p.doc)} · ${edadTxt(p.nac)} · ${esc(p.sexo)}</div></div>${al.length ? `<div class="alerta-alergia mt-2">⚠ ALERGIAS: ${al.map(esc).join(' · ')}</div>` : ''}`; };

  /* =====================================================
     PANTALLA 10.1 · Registro de diagnóstico
     ===================================================== */
  function initRegistro() {
    if (document.body.dataset.page !== 'registro_diagnostico') return;
    const params = new URLSearchParams(location.search); let aid = params.get('atencion') !== null ? +params.get('atencion') : null, pid = +params.get('pac') || 0, cieSel = null, trabajo = [];
    if (aid !== null && !pid) { const p = PACS.find(x => atencionesDe(x.id).some(a => a.id === aid)); if (p) pid = p.id; }
    const llenar = () => llenarSelectPac($('#selPacD'), $('#buscaPacD').value, pid); llenar();
    $('#buscaPacD').addEventListener('input', llenar);
    $('#selPacD').addEventListener('change', e => { pid = +e.target.value || 0; aid = null; cargarPac(); });
    $('#selAtD').addEventListener('change', e => { aid = e.target.value === '' ? null : +e.target.value; cargarAtencion(); });

    function cargarPac() {
      const p = pacDe(pid); $('#ctxPac').classList.toggle('d-none', !p); $('#atResumen').classList.add('d-none'); $('#bloqueDx').classList.add('d-none'); $('#bloqueLista').classList.add('d-none');
      if (!p) { $('#selAtD').innerHTML = '<option value="">Seleccione primero un paciente…</option>'; return; }
      $('#ctxPac').innerHTML = ctxHTML(p); const ats = atencionesDe(pid);
      $('#selAtD').innerHTML = ats.length ? '<option value="">Seleccione…</option>' + ats.map(a => { const n = dxDeAtencion(a.id).length; return `<option value="${a.id}">${fmtDT(a.fecha)} · ${esc(a.motivo)} ${n ? '· ✔ ' + n + ' dx' : '· (sin diagnóstico)'}</option>`; }).join('') : '<option value="">Sin atenciones finalizadas</option>';
      if (!ats.length) { $('#atResumen').classList.remove('d-none'); $('#atResumen').innerHTML = 'Este paciente no tiene atenciones finalizadas. Finalice una consulta en el <a href="../atencion/panel_asistencial.html">panel asistencial</a>.'; return; }
      if (aid !== null && ats.some(a => a.id === aid)) { $('#selAtD').value = aid; cargarAtencion(); }
    }
    function cargarAtencion() {
      const a = atencionesDe(pid).find(x => x.id === aid); $('#bloqueDx').classList.toggle('d-none', !a); $('#bloqueLista').classList.toggle('d-none', !a); if (!a) { $('#atResumen').classList.add('d-none'); return; }
      const pr = profDe(a.prof) || { nombre: '—' }; $('#atResumen').classList.remove('d-none'); $('#atResumen').innerHTML = `<strong>${esc(a.motivo)}</strong><br>📅 ${fmtDT(a.fecha)} · 👨‍⚕️ ${esc(pr.nombre)} · Atención ${atTxt(a)}${a.cita ? ' · Cita #' + a.cita : ''}`;
      trabajo = dxDeAtencion(a.id).map(d => ({ ...d, guardado: true })); cieSel = null; renderCie(); renderSel(); renderTrabajo(); $('#errGuardar').classList.add('d-none');
    }

    /* Catálogo CIE-10 */
    $('#cieCat').innerHTML = '<option value="">Todas las categorías</option>' + [...new Set(CIE10.map(c => c.cat))].map(c => `<option>${esc(c)}</option>`).join('');
    function renderCie() {
      const q = norm($('#cieBuscar').value.trim()), cat = $('#cieCat').value, lista = CIE10.filter(c => (!cat || c.cat === cat) && (!q || norm(c.codigo).includes(q) || norm(c.desc).includes(q))), usados = new Set(trabajo.map(t => t.cie));
      $('#cieContador').textContent = `${lista.length} código(s) encontrados` + (lista.length > 25 ? ' · mostrando 25' : '');
      $('#cieLista').innerHTML = lista.length ? lista.slice(0, 25).map(c => `<div class="cie-item ${cieSel === c.codigo ? 'sel' : ''}" data-c="${c.codigo}"><span class="cie-code">${hl(c.codigo, q)}</span><div><div class="desc">${hl(c.desc, q)} ${usados.has(c.codigo) ? '<span class="badge bg-secondary">ya agregado</span>' : ''}</div><div class="cat">${esc(c.cat)}</div></div></div>`).join('') : '<div class="p-3 text-muted">Sin resultados. Pruebe con otro término.</div>';
    }
    $('#cieBuscar').addEventListener('input', renderCie); $('#cieCat').addEventListener('change', renderCie);
    $('#cieLista').addEventListener('click', e => { const it = e.target.closest('[data-c]'); if (!it) return; cieSel = it.dataset.c; renderCie(); renderSel(); });

    function tiposDisponibles() { const usados = trabajo.map(t => t.tipo); return ['Principal', 'Relacionado 1', 'Relacionado 2'].filter(t => !usados.includes(t)).concat(['Descarte']); }
    function renderSel() {
      const box = $('#cieSel'), btn = $('#btnAgregarDx'), disp = tiposDisponibles(), usados = trabajo.map(t => t.tipo);
      $('#dx_tipo').innerHTML = disp.map(t => `<option>${t}</option>`).join('');
      $('#slotInfo').innerHTML = ['Principal', 'Relacionado 1', 'Relacionado 2'].map(t => `<span class="me-2 ${usados.includes(t) ? 'usado' : ''}">${t}${usados.includes(t) ? ' ✔' : ''}</span>`).join('') + '<span>Descarte (varios)</span>';
      $('#errAdd').classList.add('d-none'); $('#hintPrev').textContent = ''; btn.disabled = !cieSel;
      if (!cieSel) { box.innerHTML = '<span class="text-muted">Seleccione un código de la lista.</span>'; $('#chkProg').checked = false; $('#selProg').classList.add('d-none'); return; }
      const c = cieDe(cieSel); box.innerHTML = `<span class="cie-code">${esc(c.codigo)}</span> <strong>${esc(c.desc)}</strong><br><small class="text-muted">${esc(c.cat)}</small>`;
      // Sugerencia según el historial del paciente
      const prev = dxPac(pid).filter(d => d.cie === cieSel && d.atencion !== aid && d.tipo !== 'Descarte');
      if (prev.length) { $('#hintPrev').innerHTML = `ℹ Ya diagnosticado ${prev.length} vez/veces (último: ${fmtF(prev[0].at.fecha)}). Sugerencia: <strong>Confirmado Repetido</strong>.`; $('#dx_conf').value = 'Confirmado Repetido'; }
      else { $('#hintPrev').textContent = 'Primer registro de este código para el paciente.'; $('#dx_conf').value = 'Impresión Diagnóstica'; }
      const ps = progSugerido(cieSel); if (ps) { $('#chkProg').checked = true; $('#selProg').classList.remove('d-none'); $('#selProg').innerHTML = PROGRAMAS.map(x => `<option ${x === ps ? 'selected' : ''}>${x}</option>`).join(''); } else { $('#chkProg').checked = false; $('#selProg').classList.add('d-none'); }
    }
    $('#chkProg').addEventListener('change', e => { $('#selProg').classList.toggle('d-none', !e.target.checked); if (e.target.checked && !$('#selProg').innerHTML) $('#selProg').innerHTML = PROGRAMAS.map(x => `<option>${x}</option>`).join(''); });
    $('#dx_obs').addEventListener('input', e => $('#obsCount').textContent = e.target.value.length);

    $('#btnAgregarDx').addEventListener('click', () => {
      if (!cieSel) return; const tipo = $('#dx_tipo').value, conf = $('#dx_conf').value, box = $('#errAdd'), errs = [];
      if (trabajo.some(t => t.cie === cieSel)) errs.push('Este código ya fue agregado a la consulta.');
      if (tipo === 'Descarte' && conf !== 'Impresión Diagnóstica') errs.push('Un diagnóstico de descarte solo puede tener confirmación «Impresión Diagnóstica».');
      if (conf === 'Confirmado Repetido' && !dxPac(pid).some(d => d.cie === cieSel && d.atencion !== aid && d.tipo !== 'Descarte')) errs.push('«Confirmado Repetido» requiere un diagnóstico previo con este mismo código. Use «Confirmado Nuevo».');
      if (errs.length) { box.innerHTML = '⛔ ' + errs.map(esc).join('<br>⛔ '); box.classList.remove('d-none'); return; }
      trabajo.push({ id: null, atencion: aid, cie: cieSel, tipo, conf, obs: $('#dx_obs').value.trim(), programa: $('#chkProg').checked ? $('#selProg').value : '', guardado: false });
      cieSel = null; $('#dx_obs').value = ''; $('#obsCount').textContent = '0'; renderCie(); renderSel(); renderTrabajo();
    });

    function renderTrabajo() {
      const orden = { 'Principal': 0, 'Relacionado 1': 1, 'Relacionado 2': 2, 'Descarte': 3 }, lista = trabajo.slice().sort((a, b) => orden[a.tipo] - orden[b.tipo]), tienePrincipal = trabajo.some(t => t.tipo === 'Principal');
      $('#estadoPrincipal').innerHTML = tienePrincipal ? '<span class="badge bg-success">✔ Diagnóstico principal definido</span>' : '<span class="badge bg-danger">Falta el diagnóstico principal</span>';
      $('#tablaDx').innerHTML = lista.length ? lista.map(d => { const c = cieDe(d.cie), i = trabajo.indexOf(d);
        return `<tr class="${d.guardado ? 'dx-guardado' : 'dx-nuevo'}"><td>${badgeTipo(d.tipo)}</td><td><span class="cie-code">${esc(d.cie)}</span><span class="cell-sub">${esc(c.desc)}</span></td><td>${badgeConf(d.conf)}</td><td class="small">${esc(d.obs || '—')}</td>
          <td>${d.programa ? `<span class="prog-badge">🔔 ${esc(d.programa)}</span>` : '<span class="text-muted">—</span>'}</td>
          <td class="text-end">${d.guardado ? '<span class="badge bg-secondary">🔒 Guardado</span>' : `<button type="button" class="btn btn-sm btn-outline-danger" data-quitar="${i}" title="Quitar">✖</button>`}</td></tr>`; }).join('')
        : '<tr><td colspan="6" class="text-center text-muted py-4">Aún no hay diagnósticos. Busque un código CIE-10 y agréguelo.</td></tr>';
    }
    $('#tablaDx').addEventListener('click', e => { const b = e.target.closest('[data-quitar]'); if (!b) return; trabajo.splice(+b.dataset.quitar, 1); renderCie(); renderSel(); renderTrabajo(); });

    $('#btnGuardarDx').addEventListener('click', e => {
      const btn = e.currentTarget, box = $('#errGuardar'), nuevos = trabajo.filter(t => !t.guardado), errs = [];
      if (!trabajo.some(t => t.tipo === 'Principal')) errs.push('Debe registrar un diagnóstico principal para la consulta.');
      if (!nuevos.length) errs.push('No hay diagnósticos nuevos para guardar.');
      if (errs.length) { box.innerHTML = '⛔ ' + errs.map(esc).join('<br>⛔ '); box.classList.remove('d-none'); return; }
      box.classList.add('d-none'); const unlock = SS.lock(btn, 'Guardando…');
      setTimeout(() => {
        const a = atencionesDe(pid).find(x => x.id === aid), med = medicoSesion() || profDe(a.prof), ahora = isoDT(new Date());
        nuevos.forEach(n => { const id = Math.max(0, ...DB.diagnosticos.map(d => d.id)) + 1; DB.diagnosticos.push({ id, atencion: aid, cie: n.cie, desc: cieDe(n.cie).desc, tipo: n.tipo, conf: n.conf, obs: n.obs, programa: n.programa, fecha: ahora, prof: med.id });
          auditar('diagnostico', id, 'Creación', null, { cie10: n.cie, tipo: n.tipo, confirmacion: n.conf }); if (n.programa) auditar('diagnostico', id, 'Modificación', null, { notificacion_programa: n.programa }); });
        guardar(); unlock(); $('#flujo').classList.add('d-none'); $('#exito').classList.remove('d-none'); $('#btnVerHistorial').href = `historial_diagnostico.html?pac=${pid}`; $('#btnTrat').href = `../tratamientos/formulario_prescripcion.html?atencion=${aid}`;
        const prin = trabajo.find(t => t.tipo === 'Principal'), notif = nuevos.filter(n => n.programa).length;
        $('#exitoTexto').innerHTML = `Se guardaron <strong>${nuevos.length}</strong> diagnóstico(s) para ${esc(pacDe(pid).nombre)}. Principal: <strong>${esc(prin.cie)}</strong> · ${esc(cieDe(prin.cie).desc)}.${notif ? `<br>🔔 ${notif} notificación(es) a programas de control.` : ''}`;
        window.scrollTo({ top: 0, behavior: 'smooth' }); SS.toast('Diagnósticos registrados correctamente.');
      }, 900);
    });
    renderCie(); renderSel(); if (pid) { $('#selPacD').value = pid; cargarPac(); } else $('#selAtD').innerHTML = '<option value="">Seleccione primero un paciente…</option>';
  }

  /* =====================================================
     PANTALLA 10.2 · Historial diagnóstico
     ===================================================== */
  function initHistorial() {
    if (document.body.dataset.page !== 'historial_diagnostico') return;
    let pid = +new URLSearchParams(location.search).get('pac') || (PAC_HIST[0]);
    const llenar = () => llenarSelectPac($('#selPacH'), $('#buscaPacH').value, pid); llenar();
    $('#buscaPacH').addEventListener('input', llenar); $('#selPacH').addEventListener('change', e => { pid = +e.target.value || pid; render(); });
    ['fTxt', 'fTipo', 'fEst'].forEach(id => ['input', 'change'].forEach(ev => $('#' + id).addEventListener(ev, render)));
    $('#btnLimpiar').addEventListener('click', () => { $('#fTxt').value = ''; $('#fTipo').value = ''; $('#fEst').value = ''; render(); });

    function render() {
      const p = pacDe(pid); if (!p) return; $('#ctxPac').classList.remove('d-none'); $('#ctxPac').innerHTML = ctxHTML(p);
      const todos = dxPac(pid), q = norm($('#fTxt').value.trim()), ft = $('#fTipo').value, fe = $('#fEst').value;
      const lista = todos.filter(d => { const c = cieDe(d.cie); return (!q || norm(d.cie).includes(q) || norm(c.desc).includes(q)) && (!ft || d.tipo === ft) && (!fe || estadoPatologia(pid, d.cie) === fe); });
      const codigos = [...new Set(todos.map(d => d.cie))], estados = codigos.map(c => estadoPatologia(pid, c));
      $('#kpis').innerHTML = [['Diagnósticos registrados', todos.length], ['Patologías distintas', codigos.length], ['Crónicas / recurrentes', estados.filter(e => e === 'Crónico / recurrente').length], ['En estudio', estados.filter(e => e === 'En estudio').length]]
        .map(([l, v]) => `<div class="col-6 col-lg-3"><div class="kpi"><div class="kpi-num">${v}</div><div class="kpi-lbl">${l}</div></div></div>`).join('');

      // Cronológico por consulta
      const porAt = new Map(); lista.forEach(d => { if (!porAt.has(d.atencion)) porAt.set(d.atencion, []); porAt.get(d.atencion).push(d); });
      const orden = { 'Principal': 0, 'Relacionado 1': 1, 'Relacionado 2': 2, 'Descarte': 3 };
      $('#crono').innerHTML = porAt.size ? [...porAt.values()].map(ds => { const a = ds[0].at, pr = profDe(a.prof) || { nombre: '—' };
        return `<div class="dx-card"><div class="dx-card-head"><div><strong>📅 ${fmtDT(a.fecha)}</strong> · ${esc(a.motivo)}</div><small class="text-muted">👨‍⚕️ ${esc(pr.nombre)} · Atención ${atTxt(a)}</small></div>` +
          ds.sort((x, y) => orden[x.tipo] - orden[y.tipo]).map(d => { const c = cieDe(d.cie), med = profDe(d.prof) || pr;
            return `<div class="dx-row">${badgeTipo(d.tipo)}<span class="cie-code">${hl(d.cie, q)}</span><span class="desc">${hl(c.desc, q)}<span class="cat">${esc(c.cat)}${d.obs ? ' · ' + esc(d.obs) : ''}</span></span>${badgeConf(d.conf)}${badgeEst(estadoPatologia(pid, d.cie))}${d.programa ? `<span class="prog-badge" title="${esc(d.programa)}">🔔 Programa</span>` : ''}<small class="text-muted">Emitido ${fmtF(d.fecha)} · ${esc(med.corto || med.nombre)}</small></div>`; }).join('') + '</div>'; }).join('')
        : '<p class="text-muted mb-0">No hay diagnósticos registrados que coincidan. Registre uno desde <a href="registro_diagnostico.html">Registrar diagnóstico</a>.</p>';

      // Por patología
      const grupos = new Map(); lista.forEach(d => { if (!grupos.has(d.cie)) grupos.set(d.cie, []); grupos.get(d.cie).push(d); });
      $('#tablaPat').innerHTML = grupos.size ? [...grupos.entries()].map(([cie, ds]) => { const c = cieDe(cie), asc = ds.slice().sort((a, b) => a.at.fecha.localeCompare(b.at.fecha)), ult = asc[asc.length - 1], pr = profDe(ult.prof) || { nombre: '—' };
        return `<tr><td><span class="cie-code">${esc(cie)}</span></td><td><strong>${esc(c.desc)}</strong><span class="cell-sub">${esc(c.cat)}</span></td><td>${ds.length}</td><td>${fmtF(asc[0].at.fecha)}</td><td>${fmtF(ult.at.fecha)}</td><td>${esc(pr.nombre)}</td><td>${badgeEst(estadoPatologia(pid, cie))}</td></tr>`; }).join('')
        : '<tr><td colspan="7" class="text-center text-muted py-4">Sin patologías para mostrar.</td></tr>';
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', () => { setInst(); initRegistro(); initHistorial(); });
})();