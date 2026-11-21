/* ===== SaludSync · Módulo 12: Seguimiento y Controles Médicos (mockup interactivo, sin backend) ===== */
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
  const parseD = s => new Date(s.slice(0, 10) + 'T00:00:00');
  const HOY = new Date(); HOY.setHours(0, 0, 0, 0);
  const addDias = (iso, n) => { const d = parseD(iso); d.setDate(d.getDate() + n); return isoD(d); };
  const fmtF = s => parseD(s).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  const leer = k => { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } };
  const edad = s => { const n = parseD(s); let a = HOY.getFullYear() - n.getFullYear(); const m = HOY.getMonth() - n.getMonth(); if (m < 0 || (m === 0 && HOY.getDate() < n.getDate())) a--; return a; };
  const edadTxt = s => { const a = edad(s); if (a >= 2) return a + ' años'; const n = parseD(s); return ((HOY.getFullYear() - n.getFullYear()) * 12 + HOY.getMonth() - n.getMonth() - (HOY.getDate() < n.getDate() ? 1 : 0)) + ' meses'; };
  const hl = (t, q) => { if (!q) return esc(t); const i = norm(t).indexOf(q); return i < 0 ? esc(t) : esc(t.slice(0, i)) + '<mark class="hl">' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length)); };

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

  /* ---------- Catálogos de otros módulos (sesión o semillas) ---------- */
  const PAC_SEED = [[1, 'CC', '1100234567', 'Ana Lucía', 'Torres Gil', 'Activo', '1991-04-12', 'Femenino'], [2, 'CC', '91234501', 'Carlos Eduardo', 'Mendoza Ruiz', 'Activo', '1978-09-03', 'Masculino'], [3, 'TI', '1034567890', 'Valentina', 'Rojas Mejía', 'Activo', '2010-02-20', 'Femenino'],
    [4, 'RC', '1098123456', 'Samuel', 'Ortega Plata', 'Activo', '2022-06-15', 'Masculino'], [5, 'CC', '37890456', 'Rosa Elena', 'Barrios Núñez', 'Activo', '1955-11-30', 'Femenino'], [6, 'CE', '5601234', 'Juan José', 'Martínez Pérez', 'Activo', '1989-01-17', 'Masculino'],
    [7, 'PPT', '5870023', 'Daniela', 'Gómez Castro', 'Activo', '1996-07-08', 'Femenino'], [8, 'CC', '13789012', 'Héctor Fabio', 'Lozano Vega', 'Inactivo', '1967-03-25', 'Masculino'], [9, 'CC', '63890123', 'Natalia', 'Cárdenas Rueda', 'Activo', '1985-12-02', 'Femenino'],
    [10, 'TI', '1102345678', 'Santiago', 'Arias Calderón', 'Activo', '2008-10-05', 'Masculino'], [11, 'PEP', '4567890', 'Luisa Fernanda', 'Herrera Díaz', 'Activo', '1993-05-19', 'Femenino'], [12, 'Pasaporte', 'AB123456', 'Michael', 'Anderson', 'Inactivo', '1974-08-11', 'Masculino']]
    .map(([id, tipo, doc, nombres, apellidos, estado, nac, sexo]) => ({ id, tipo, doc, nombres, apellidos, estado, nac, sexo }));
  const PROF_SEED = [[1, 'Andrés Felipe', 'Navarro Díaz', [1], 'Activo'], [2, 'Paula Andrea', 'Rueda Mantilla', [2], 'Activo'], [3, 'Mauricio', 'Ariza Gómez', [3, 6], 'Activo'], [4, 'Liliana', 'Cortés Vargas', [4], 'Activo'], [5, 'Iván Darío', 'Suárez Pinto', [5], 'Activo'],
    [6, 'Marcela', 'Quintero Ardila', [6, 1], 'Activo'], [7, 'Camilo Andrés', 'Ortega Rey', [8], 'Activo'], [8, 'Sergio', 'Medina Restrepo', [1], 'Inactivo'], [9, 'Sofía', 'Bermúdez Luna', [2, 1], 'Activo'], [10, 'Diana Patricia', 'Cifuentes Mora', [4, 7], 'Activo']]
    .map(([id, nombres, apellidos, esp, estado]) => ({ id, nombres, apellidos, esp, estado }));
  const ESP_NOM = { 1: 'Medicina General', 2: 'Pediatría', 3: 'Cardiología', 4: 'Ginecología y Obstetricia', 5: 'Odontología', 6: 'Medicina Interna', 7: 'Dermatología', 8: 'Ortopedia y Traumatología' };
  const M3 = leer('saludsync_modulo3_v1'), M4 = leer('saludsync_modulo4_v1'), M8 = leer('saludsync_modulo8_v1'), M10 = leer('saludsync_modulo10_v1');
  const PACS = ((M3 && M3.pacientes) ? M3.pacientes : PAC_SEED).map(p => ({ id: p.id, tipo: p.tipo, doc: p.doc, nombre: `${p.nombres} ${p.apellidos}`, estado: p.estado, nac: p.nac, sexo: p.sexo }));
  const PROFS = ((M4 && M4.profesionales) ? M4.profesionales : PROF_SEED).map(p => ({ id: p.id, nombre: `${p.nombres} ${p.apellidos}`, corto: `${p.nombres.split(' ')[0]} ${p.apellidos.split(' ')[0]}`, esp: p.esp, estado: p.estado }));
  const ESPS = ((M4 && M4.especialidades) ? M4.especialidades.filter(e => e.estado === 'Activo').map(e => ({ id: e.id, nombre: e.nombre })) : Object.entries(ESP_NOM).filter(([id]) => +id !== 7).map(([id, nombre]) => ({ id: +id, nombre })));
  const pacDe = id => PACS.find(p => p.id === id), profDe = id => PROFS.find(p => p.id === id);
  const ALERG_SEED = { 1: ['Penicilina: rash cutáneo generalizado.'], 3: ['Alergia estacional al polen.'], 6: ['AINEs (diclofenaco): urticaria.'] };
  const alergias = pid => (M8 && M8.antecedentes) ? M8.antecedentes.filter(a => a.pac === pid && a.tipo === 'Alérgico').map(a => a.desc) : (ALERG_SEED[pid] || []);

  /* ---------- Atenciones y diagnósticos (mismos de los Módulos 9 y 10) ---------- */
  const CIE_MIN = { 'I10': 'Hipertensión esencial (primaria)', 'M54.5': 'Lumbago no especificado', 'J06.9': 'Infección aguda de las vías respiratorias superiores, no especificada', 'R05': 'Tos', 'Z00.0': 'Examen médico general', 'G43.9': 'Migraña, sin otra especificación',
    'R51': 'Cefalea', 'E11.9': 'Diabetes mellitus tipo 2, sin mención de complicación', 'E66.9': 'Obesidad, no especificada', 'Z00.1': 'Control de salud de rutina del niño', 'R50.9': 'Fiebre, no especificada', 'J02.9': 'Faringitis aguda, no especificada', 'Z23': 'Necesidad de inmunización contra enfermedad bacteriana única' };
  const MOT_AD = ['Control de presión arterial', 'Dolor lumbar de 5 días de evolución', 'Síntomas gripales y tos', 'Revisión general y exámenes de rutina', 'Cefalea recurrente', 'Control de glucemia'];
  const MOT_PED = ['Control de crecimiento y desarrollo', 'Fiebre y malestar general', 'Esquema de vacunación'];
  const PAC_HIST = [1, 2, 3, 5, 6, 9];
  function atencionesSemilla(pid) {
    const p = pacDe(pid); if (!p || !PAC_HIST.includes(pid)) return [];
    const a = edad(p.nac), offs = [28, 95, 210, 380, 540], n = 2 + (pid % 3), out = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(HOY); d.setDate(d.getDate() - offs[i] - pid); d.setHours(8 + (pid + i) % 8, 10 + (i * 15) % 50);
      const pool = a < 14 ? MOT_PED : MOT_AD, prof = a < 14 ? 2 : [1, 3, 6, 9][(pid + i) % 4];
      out.push({ id: -(pid * 100 + i + 1), pac: pid, fecha: isoDT(d), fin: isoDT(new Date(d.getTime() + 25 * 6e4)), prof, motivo: pool[(pid + i) % pool.length] });
    }
    return out;
  }
  function atencionesDe(pid) {
    const out = atencionesSemilla(pid);
    if (M8 && M8.atenciones) M8.atenciones.filter(a => a.pac === pid && a.estado === 'Finalizada').forEach(a => out.push({ id: a.id, pac: pid, fecha: a.inicio, fin: a.fin, prof: a.prof, motivo: a.motivo || '(sin motivo)' }));
    return out.sort((x, y) => y.fecha.localeCompare(x.fecha));
  }
  const MAPA = { 'Control de presión arterial': [['I10', 'Principal']], 'Dolor lumbar de 5 días de evolución': [['M54.5', 'Principal']], 'Síntomas gripales y tos': [['J06.9', 'Principal'], ['R05', 'Relacionado 1']], 'Revisión general y exámenes de rutina': [['Z00.0', 'Principal']],
    'Cefalea recurrente': [['G43.9', 'Principal'], ['R51', 'Relacionado 1']], 'Control de glucemia': [['E11.9', 'Principal'], ['E66.9', 'Relacionado 1']], 'Control de crecimiento y desarrollo': [['Z00.1', 'Principal']], 'Fiebre y malestar general': [['R50.9', 'Principal'], ['J02.9', 'Relacionado 1']], 'Esquema de vacunación': [['Z23', 'Principal']] };
  function semillaDx() {
    const out = []; let id = 1;
    PAC_HIST.forEach(pid => { atencionesSemilla(pid).slice().sort((a, b) => a.fecha.localeCompare(b.fecha)).forEach((a, i) => { if ((pid + i) % 5 === 0) return;
      (MAPA[a.motivo] || []).forEach(([cod, tipo]) => out.push({ id: id++, atencion: a.id, cie: cod, tipo, prof: a.prof })); }); });
    return out;
  }
  const DX = (M10 && M10.diagnosticos) ? M10.diagnosticos : semillaDx();
  const descCie = d => d.desc || CIE_MIN[d.cie] || '(sin descripción)';
  const dxDe = id => DX.find(d => d.id === id);
  // Diagnósticos vigentes (no descartados) del paciente, con la atención asociada
  function dxPac(pid) { const ats = new Map(atencionesDe(pid).map(a => [a.id, a])); return DX.filter(d => ats.has(d.atencion) && d.tipo !== 'Descarte').map(d => ({ ...d, at: ats.get(d.atencion) })).sort((a, b) => b.at.fecha.localeCompare(a.at.fecha)); }

  /* ---------- Reglas de seguimiento ---------- */
  const INTERVALOS = ['15 días', '1 mes', '3 meses', '6 meses'];
  function addIntervalo(iso, int) {
    const d = parseD(iso); if (int === '15 días') d.setDate(d.getDate() + 15);
    else { const m = { '1 mes': 1, '3 meses': 3, '6 meses': 6 }[int], dia = d.getDate(); d.setMonth(d.getMonth() + m); if (d.getDate() !== dia) d.setDate(0); }
    return isoD(d);
  }
  const diasPara = prox => Math.round((parseD(prox) - HOY) / 864e5);
  const estadoDe = prox => { const d = diasPara(prox); return d < 0 ? 'Vencido' : d <= 7 ? 'Próximo a vencer' : 'Al día'; };
  const estCls = e => e.replace(/\s+/g, '');
  const relTxt = prox => { const d = diasPara(prox); return d < 0 ? `<span class="rel-dias neg">Hace ${Math.abs(d)} día(s)</span>` : d === 0 ? '<span class="rel-dias warn">Hoy</span>' : d <= 7 ? `<span class="rel-dias warn">En ${d} día(s)</span>` : `<span class="rel-dias ok">En ${d} días</span>`; };
  const SUG_INT = { 'I10': '1 mes', 'E11': '3 meses', 'E66': '1 mes', 'G43': '3 meses', 'M54': '15 días', 'J45': '3 meses', 'J06': '15 días', 'Z00': '6 meses' };
  const SUG_METAS = { 'I10': [['Presión arterial', '< 140/90 mmHg', 'Creatinina sérica'], ['Peso', 'Reducir 3 kg', '']], 'E11': [['Hemoglobina glicosilada', '< 7 %', 'Hemoglobina glicosilada (HbA1c)'], ['Glicemia en ayunas', '80-130 mg/dL', 'Glicemia en ayunas']],
    'E66': [['IMC', '< 25 kg/m²', ''], ['Peso', 'Reducir 5 %', '']], 'G43': [['Crisis de migraña', '≤ 2 por mes', '']], 'M54': [['Dolor (escala 0-10)', '≤ 2', '']], 'J45': [['Crisis asmáticas', '0 por semana', 'Espirometría']],
    'J06': [['Resolución de síntomas', 'Sin fiebre ni tos', '']], 'Z00': [['Hábitos saludables', 'Actividad física 150 min/semana', '']] };
  const PARAMETROS = ['Presión arterial', 'Hemoglobina glicosilada', 'Glicemia en ayunas', 'Peso', 'IMC', 'Colesterol LDL', 'Frecuencia cardíaca', 'Saturación de oxígeno', 'Crisis de migraña', 'Dolor (escala 0-10)', 'Crisis asmáticas', 'Resolución de síntomas'];
  const EXAMENES = ['Hemograma completo', 'Glicemia en ayunas', 'Hemoglobina glicosilada (HbA1c)', 'Perfil lipídico', 'Creatinina sérica', 'Uroanálisis', 'TSH', 'Espirometría', 'Electrocardiograma'];

  /* ---------- Datos propios: seguimiento_control, meta_clinica (+ controles registrados) ---------- */
  const SEG_SEED = [[6, 'I10', '1 mes', 12, 1], [5, 'I10', '1 mes', 26, 6], [5, 'E11.9', '3 meses', 40, 6], [3, 'G43.9', '3 meses', 98, 3], [1, 'M54.5', '15 días', 10, 1], [2, 'E11.9', '3 meses', 75, 6], [9, 'G43.9', '1 mes', 45, 9]];
  const metasSug = cie => SUG_METAS[cie.slice(0, 3)] || SUG_METAS[cie] || [];
  function semilla() {
    const out = { seguimientos: [], metas: [], controles: [] }; let id = 1, idM = 1;
    SEG_SEED.forEach(([pid, cie, int, hace, prof]) => {
      const dx = dxPac(pid).find(d => d.cie === cie); if (!dx) return;
      const ultimo = addDias(isoD(HOY), -hace), prox = addIntervalo(ultimo, int);
      out.seguimientos.push({ id, pac: pid, dx: dx.id, prof, ultimo, proximo: prox, intervalo: int, estado: estadoDe(prox), motivo: 'Evaluar la respuesta al tratamiento y el cumplimiento de metas.', esp: '', recordatorio: true, diasRec: 7 });
      metasSug(cie).forEach(([parametro, valor, examen]) => out.metas.push({ id: idM++, seg: id, parametro, valor, examen }));
      id++;
    });
    return out;
  }
  const KEY = 'saludsync_modulo12_v1';
  const DB = (() => { const s = leer(KEY); return s && s.seguimientos ? s : semilla(); })();
  const guardar = () => { try { sessionStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } };
  const segDe = id => DB.seguimientos.find(s => s.id === id);
  const metasDe = id => DB.metas.filter(m => m.seg === id);
  function llenarSelectPac(sel, q, actual) { const qq = norm(q || ''); sel.innerHTML = '<option value="">Seleccione…</option>' + PACS.filter(p => !qq || norm(p.nombre).includes(qq) || norm(p.doc).includes(qq)).map(p => `<option value="${p.id}">${esc(p.nombre)} · ${esc(p.tipo)} ${esc(p.doc)}</option>`).join(''); if (actual) sel.value = actual; }

  /* =====================================================
     PANTALLA 12.1 · Panel de seguimiento
     ===================================================== */
  function initPanel() {
    if (document.body.dataset.page !== 'panel_seguimiento') return;
    const TAM = 8; let pagina = 1, fEst = '', selId = null;
    $('#fechaHoy').textContent = HOY.toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase());
    $('#fProf').innerHTML = '<option value="">Todos los profesionales</option>' + PROFS.map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('');
    // Refresca estados según la fecha actual
    DB.seguimientos.forEach(s => s.estado = estadoDe(s.proximo));

    function filtrar() {
      const q = norm($('#fTxt').value.trim()), fp = +$('#fProf').value, fi = $('#fInt').value;
      return DB.seguimientos.filter(s => { const p = pacDe(s.pac), d = dxDe(s.dx); return p && (!q || norm(p.nombre).includes(q) || norm(p.doc).includes(q) || (d && norm(d.cie).includes(q))) && (!fp || s.prof === fp) && (!fi || s.intervalo === fi); })
        .sort((a, b) => a.proximo.localeCompare(b.proximo));
    }
    function render() {
      const base = filtrar(), q = norm($('#fTxt').value.trim()), lista = base.filter(s => !fEst || estadoDe(s.proximo) === fEst), total = lista.length, paginas = Math.max(1, Math.ceil(total / TAM)); if (pagina > paginas) pagina = paginas;
      const todos = DB.seguimientos, cnt = e => base.filter(s => estadoDe(s.proximo) === e).length;
      $('#kpis').innerHTML = [['Pacientes en seguimiento', new Set(todos.map(s => s.pac)).size, ''], ['Controles esta semana (7 días)', todos.filter(s => { const d = diasPara(s.proximo); return d >= 0 && d <= 6; }).length, 'kpi-green'], ['Próximos a vencer', todos.filter(s => estadoDe(s.proximo) === 'Próximo a vencer').length, 'kpi-warn'], ['Vencidos / alertas', todos.filter(s => estadoDe(s.proximo) === 'Vencido').length, 'kpi-gray']]
        .map(([l, v, c]) => `<div class="col-6 col-lg-3"><div class="kpi ${c}"><div class="kpi-num">${v}</div><div class="kpi-lbl">${l}</div></div></div>`).join('');
      $('#chipsEstado').innerHTML = `<div class="chip-est ${!fEst ? 'activo' : ''}" data-e=""><strong>${base.length}</strong><small>Todos</small></div>` +
        [['Al día', 'c-ok'], ['Próximo a vencer', 'c-prox'], ['Vencido', 'c-venc']].map(([e, c]) => `<div class="chip-est ${c} ${fEst === e ? 'activo' : ''}" data-e="${e}"><strong>${cnt(e)}</strong><small>${e}</small></div>`).join('');
      const ini = (pagina - 1) * TAM, vista = lista.slice(ini, ini + TAM);
      $('#tablaSeg').innerHTML = vista.length ? vista.map(s => { const p = pacDe(s.pac), d = dxDe(s.dx), pr = profDe(s.prof) || { corto: '—' }, ms = metasDe(s.id), est = estadoDe(s.proximo);
        return `<tr class="fila-${estCls(est)}"><td><strong>${hl(p.nombre, q)}</strong><span class="cell-sub">${esc(p.tipo)} ${hl(p.doc, q)}</span></td>
          <td>${d ? `<span class="cie-code">${hl(d.cie, q)}</span><span class="cell-sub">${esc(descCie(d))}</span>` : '—'}</td><td>${fmtF(s.ultimo)}</td>
          <td><strong>${fmtF(s.proximo)}</strong><br>${relTxt(s.proximo)}<span class="cell-sub">Cada ${esc(s.intervalo)}</span></td>
          <td>${ms.length ? ms.slice(0, 2).map(m => `<span class="meta-chip">${esc(m.parametro)}: <b>${esc(m.valor)}</b></span>`).join('') + (ms.length > 2 ? `<span class="meta-chip">+${ms.length - 2}</span>` : '') : '<span class="text-muted">Sin metas</span>'}</td>
          <td>${esc(pr.corto || pr.nombre)}</td><td><span class="est-seg est-${estCls(est)}">${est}</span></td>
          <td class="text-end text-nowrap"><button class="btn btn-sm btn-outline-primary" data-act="ver" data-id="${s.id}" title="Ver detalle">👁</button> <button class="btn btn-sm btn-outline-success" data-act="ctrl" data-id="${s.id}" title="Registrar control realizado">✅</button> <a class="btn btn-sm btn-outline-primary" href="programar_control.html?id=${s.id}" title="Editar plan">✏️</a> <a class="btn btn-sm btn-outline-secondary" href="../citas/agendamiento_cita.html" title="Agendar cita de control">🗓️</a></td></tr>`; }).join('')
        : '<tr><td colspan="8" class="text-center text-muted py-4">No hay pacientes en seguimiento con estos filtros. <a href="programar_control.html">Programe un control</a>.</td></tr>';
      $('#contador').textContent = total ? `Mostrando ${ini + 1}–${ini + vista.length} de ${total} planes` : 'Sin resultados';
      let pg = `<li class="page-item ${pagina === 1 ? 'disabled' : ''}"><button class="page-link" data-p="${pagina - 1}">«</button></li>`;
      for (let k = 1; k <= paginas; k++) pg += `<li class="page-item ${k === pagina ? 'active' : ''}"><button class="page-link" data-p="${k}">${k}</button></li>`;
      pg += `<li class="page-item ${pagina === paginas ? 'disabled' : ''}"><button class="page-link" data-p="${pagina + 1}">»</button></li>`; $('#paginacion').innerHTML = pg;
    }
    ['fTxt', 'fProf', 'fInt'].forEach(id => ['input', 'change'].forEach(ev => $('#' + id).addEventListener(ev, () => { pagina = 1; render(); })));
    $('#btnLimpiar').addEventListener('click', () => { $('#fTxt').value = ''; $('#fProf').value = ''; $('#fInt').value = ''; fEst = ''; pagina = 1; render(); });
    $('#chipsEstado').addEventListener('click', e => { const c = e.target.closest('[data-e]'); if (c) { fEst = c.dataset.e; pagina = 1; render(); } });
    $('#paginacion').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b && !b.parentElement.classList.contains('disabled')) { pagina = +b.dataset.p; render(); } });

    /* Detalle */
    function detalle(s) {
      selId = s.id; const p = pacDe(s.pac), d = dxDe(s.dx), pr = profDe(s.prof) || { nombre: '—' }, ms = metasDe(s.id), est = estadoDe(s.proximo), ctrls = DB.controles.filter(c => c.seg === s.id).sort((a, b) => b.fecha.localeCompare(a.fecha)), al = alergias(s.pac);
      $('#detTitulo').textContent = `${p.nombre} · ${d ? d.cie : ''}`; $('#detEditar').href = `programar_control.html?id=${s.id}`;
      $('#detCuerpo').innerHTML = `<div class="row g-3 small mb-3"><div class="col-md-6"><strong>Paciente:</strong> ${esc(p.nombre)} · ${esc(p.tipo)} ${esc(p.doc)} · ${edadTxt(p.nac)}</div><div class="col-md-6"><strong>Diagnóstico:</strong> ${d ? `<span class="cie-code">${esc(d.cie)}</span> ${esc(descCie(d))}` : '—'}</div>
        <div class="col-md-4"><strong>Último control:</strong> ${fmtF(s.ultimo)}</div><div class="col-md-4"><strong>Próximo control:</strong> ${fmtF(s.proximo)} ${relTxt(s.proximo)}</div><div class="col-md-4"><strong>Estado:</strong> <span class="est-seg est-${estCls(est)}">${est}</span></div>
        <div class="col-md-4"><strong>Intervalo:</strong> ${esc(s.intervalo)}</div><div class="col-md-4"><strong>Profesional:</strong> ${esc(pr.nombre)}</div><div class="col-md-4"><strong>Recordatorio:</strong> ${s.recordatorio ? `Sí (${s.diasRec} días antes)` : 'No'}</div>
        ${s.motivo ? `<div class="col-12"><strong>Motivo del control:</strong> ${esc(s.motivo)}</div>` : ''}</div>${al.length ? `<div class="alerta-alergia mb-3">⚠ ALERGIAS: ${al.map(esc).join(' · ')}</div>` : ''}
        <h3 class="h6">Metas clínicas</h3>${ms.length ? `<div class="table-responsive mb-3"><table class="table table-sm table-ss"><thead><tr><th>Parámetro</th><th>Valor objetivo</th><th>Examen requerido</th></tr></thead><tbody>${ms.map(m => `<tr><td>${esc(m.parametro)}</td><td><strong>${esc(m.valor)}</strong></td><td>${esc(m.examen || '—')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="text-muted small">Sin metas configuradas.</p>'}
        <h3 class="h6">Historial de controles realizados</h3>${ctrls.length ? `<ul class="timeline-ctrl">${ctrls.map(c => { const ok = c.eval.filter(e => e.cumplida).length; return `<li><strong>${fmtF(c.fecha)}</strong> · <span class="${ok === c.eval.length ? 'cumple-ok' : 'cumple-no'}">${ok}/${c.eval.length} metas cumplidas</span><br><small class="text-muted">${c.eval.map(e => `${esc(e.parametro)}: ${esc(e.observado || '—')} ${e.cumplida ? '✔' : '✖'}`).join(' · ')}${c.obs ? '<br>' + esc(c.obs) : ''} — ${esc(c.usuario)}</small></li>`; }).join('')}</ul>` : '<p class="text-muted small mb-0">Aún no se han registrado controles desde este panel.</p>'}`;
      modal('modalDetalle').show();
    }
    $('#tablaSeg').addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b) return; const s = segDe(+b.dataset.id); if (b.dataset.act === 'ver') detalle(s); else abrirControl(s); });
    $('#detRegistrar').addEventListener('click', () => { modal('modalDetalle').hide(); abrirControl(segDe(selId)); });

    /* Registrar control (RF-MON-02: evaluación de metas) */
    function abrirControl(s) {
      selId = s.id; const p = pacDe(s.pac), d = dxDe(s.dx), ms = metasDe(s.id); $('#formControl').classList.remove('was-validated');
      $('#ctrlInfo').innerHTML = `<strong>${esc(p.nombre)}</strong> · <span class="cie-code">${esc(d ? d.cie : '')}</span> · Último control: ${fmtF(s.ultimo)}`;
      $('#c_fecha').value = isoD(HOY); $('#c_fecha').min = s.ultimo; $('#c_fecha').max = isoD(HOY); $('#c_int').value = s.intervalo; $('#c_obs').value = '';
      $('#ctrlMetas').innerHTML = ms.length ? ms.map((m, i) => `<tr data-i="${i}"><td><strong>${esc(m.parametro)}</strong>${m.examen ? `<span class="cell-sub">Examen: ${esc(m.examen)}</span>` : ''}</td><td>${esc(m.valor)}</td><td><input type="text" class="form-control form-control-sm c-obs" maxlength="60" placeholder="Valor medido"></td><td class="text-center"><input type="checkbox" class="form-check-input c-ok" aria-label="Meta cumplida"></td></tr>`).join('')
        : '<tr><td colspan="4" class="text-center text-muted">Este plan no tiene metas configuradas.</td></tr>';
      actualizarProx(); modal('modalControl').show();
    }
    function actualizarProx() { const f = $('#c_fecha').value; $('#c_prox').textContent = f ? fmtF(addIntervalo(f, $('#c_int').value)) : '—'; }
    $('#c_fecha').addEventListener('input', actualizarProx); $('#c_int').addEventListener('change', actualizarProx);
    $('#formControl').addEventListener('submit', e => {
      e.preventDefault(); const f = e.currentTarget, btn = $('#btnGuardarCtrl'); if (btn.disabled) return; const s = segDe(selId), fecha = $('#c_fecha').value;
      const bad = !fecha || fecha < s.ultimo || fecha > isoD(HOY); $('#c_fecha').setCustomValidity(bad ? 'x' : ''); $('#fbFecha').textContent = bad ? `La fecha debe estar entre ${fmtF(s.ultimo)} y hoy.` : 'Indique una fecha válida.';
      f.classList.add('was-validated'); if (!f.checkValidity()) return; const unlock = SS.lock(btn, 'Registrando…');
      setTimeout(() => {
        const ms = metasDe(s.id), evals = $$('#ctrlMetas tr[data-i]').map(tr => { const m = ms[+tr.dataset.i]; return { parametro: m.parametro, objetivo: m.valor, observado: $('.c-obs', tr).value.trim(), cumplida: $('.c-ok', tr).checked }; });
        const ant = { ultimo: s.ultimo, proximo: s.proximo, estado: estadoDe(s.proximo) }; s.ultimo = fecha; s.intervalo = $('#c_int').value; s.proximo = addIntervalo(fecha, s.intervalo); s.estado = estadoDe(s.proximo);
        DB.controles.push({ id: Math.max(0, ...DB.controles.map(c => c.id)) + 1, seg: s.id, fecha, eval: evals, obs: $('#c_obs').value.trim(), usuario: responsable() });
        auditar('seguimiento_control', s.id, 'Modificación', ant, { ultimo: s.ultimo, proximo: s.proximo, estado: s.estado }); guardar(); render(); modal('modalControl').hide(); unlock();
        const ok = evals.filter(x => x.cumplida).length; SS.toast(`Control registrado${evals.length ? `: ${ok} de ${evals.length} metas cumplidas` : ''}. Próximo: ${fmtF(s.proximo)}.`, evals.length && ok < evals.length ? 'warning' : 'success');
      }, 800);
    });
    render();
  }

  /* =====================================================
     PANTALLA 12.2 · Programar control
     ===================================================== */
  function initProgramar() {
    if (document.body.dataset.page !== 'programar_control') return;
    const f = $('#formSeg'), btn = $('#btnGuardarS'), params = new URLSearchParams(location.search), editId = +params.get('id') || null, editando = editId ? segDe(editId) : null;
    let pid = editando ? editando.pac : (+params.get('pac') || 0), metas = editando ? metasDe(editId).map(m => ({ parametro: m.parametro, valor: m.valor, examen: m.examen })) : [], proxManual = false;
    const intSel = () => $('input[name=intS]:checked').value;
    $('#listaParam').innerHTML = PARAMETROS.map(x => `<option value="${x}">`).join(''); $('#listaEx').innerHTML = EXAMENES.map(x => `<option value="${x}">`).join('');
    $('#selEspS').innerHTML = '<option value="">Cualquiera</option>' + ESPS.map(e => `<option value="${e.id}">${esc(e.nombre)}</option>`).join('');
    llenarSelectPac($('#selPacS'), '', pid); $('#buscaPacS').addEventListener('input', () => llenarSelectPac($('#selPacS'), $('#buscaPacS').value, pid));
    $('#selPacS').addEventListener('change', e => { pid = +e.target.value || 0; cargarPac(); });

    function llenarProfs(pref) { const fe = +$('#selEspS').value; $('#selProfS').innerHTML = '<option value="">Seleccione…</option>' + PROFS.filter(p => p.estado === 'Activo' && (!fe || p.esp.includes(fe))).map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join(''); if (pref) $('#selProfS').value = pref; }
    $('#selEspS').addEventListener('change', () => llenarProfs()); llenarProfs();

    function cargarPac() {
      const p = pacDe(pid); $('#ctxPac').classList.toggle('d-none', !p); $('#avisoExiste').classList.add('d-none');
      if (!p) { $('#selDxS').innerHTML = '<option value="">Seleccione primero un paciente…</option>'; return; }
      const al = alergias(pid); $('#ctxPac').innerHTML = `<strong>${esc(p.nombre)}</strong> · ${esc(p.tipo)} ${esc(p.doc)} · ${edadTxt(p.nac)} · ${esc(p.sexo)}${al.length ? `<div class="alerta-alergia mt-2">⚠ ALERGIAS: ${al.map(esc).join(' · ')}</div>` : ''}`;
      const dxs = dxPac(pid); $('#selDxS').innerHTML = dxs.length ? '<option value="">Seleccione…</option>' + dxs.map(d => `<option value="${d.id}">${esc(d.tipo)} · ${esc(d.cie)} · ${esc(descCie(d).slice(0, 45))}</option>`).join('') : '<option value="">El paciente no tiene diagnósticos</option>';
      if (!dxs.length) { $('#avisoExiste').classList.remove('d-none'); $('#avisoExiste').innerHTML = 'Este paciente no tiene diagnósticos. <a href="../diagnosticos/registro_diagnostico.html" class="alert-link">Registre un diagnóstico</a> para programar su seguimiento.'; }
    }
    function alSeleccionarDx() {
      const dx = dxDe(+$('#selDxS').value), box = $('#avisoExiste'); box.classList.add('d-none'); if (!dx) return;
      const dup = DB.seguimientos.find(s => s.pac === pid && s.dx === dx.id && s.id !== editId); if (dup) { box.classList.remove('d-none'); box.innerHTML = `⚠ Ya existe un plan de seguimiento para este diagnóstico (próximo control: ${fmtF(dup.proximo)}). <a href="programar_control.html?id=${dup.id}" class="alert-link">Editar el plan existente</a>.`; }
      if (!editando) { const si = SUG_INT[dx.cie.slice(0, 3)]; if (si) $(`input[name=intS][value="${si}"]`).checked = true; const at = atencionesDe(pid).find(a => a.id === dx.atencion); const fa = at ? at.fecha.slice(0, 10) : isoD(HOY); $('#fUltimo').value = fa > isoD(HOY) ? isoD(HOY) : fa;
        const pr = at ? profDe(at.prof) : null; if (pr && pr.estado === 'Activo') { $('#selEspS').value = ''; llenarProfs(pr.id); } calcProx(true); }
    }
    $('#selDxS').addEventListener('change', alSeleccionarDx);

    /* Fechas */
    function calcProx(forzar) { if (!proxManual || forzar) { const u = $('#fUltimo').value; if (u) $('#fProximo').value = addIntervalo(u, intSel()); proxManual = false; } vistaPrevia(); }
    function vistaPrevia() { const p = $('#fProximo').value, u = $('#fUltimo').value; if (!p) { $('#estadoPrev').textContent = '—'; $('#estadoRel').textContent = ''; return; }
      const est = estadoDe(p); $('#estadoPrev').innerHTML = `<span class="est-seg est-${estCls(est)}">${est}</span>`; const d = diasPara(p); $('#estadoRel').textContent = d < 0 ? `Vencido hace ${Math.abs(d)} día(s)` : d === 0 ? 'Vence hoy' : `Faltan ${d} día(s)`;
      $('#ayudaProx').textContent = u && p === addIntervalo(u, intSel()) ? 'Calculada según el intervalo.' : 'Fecha personalizada (distinta al intervalo).'; }
    $$('input[name=intS]').forEach(r => r.addEventListener('change', () => calcProx(true)));
    $('#fUltimo').addEventListener('input', () => calcProx(false)); $('#fProximo').addEventListener('input', () => { proxManual = true; vistaPrevia(); });

    /* Metas */
    function renderMetas() { $('#tablaMetas').innerHTML = metas.length ? metas.map((m, i) => `<tr><td><strong>${esc(m.parametro)}</strong></td><td>${esc(m.valor)}</td><td>${esc(m.examen || '—')}</td><td class="text-end"><button type="button" class="btn btn-sm btn-outline-danger" data-q="${i}" title="Quitar">✖</button></td></tr>`).join('') : '<tr><td colspan="4" class="text-center text-muted py-3">Aún no hay metas. Agregue al menos una.</td></tr>'; }
    $('#btnAddMeta').addEventListener('click', () => {
      const parametro = $('#p_parametro').value.trim(), valor = $('#p_valor').value.trim(), examen = $('#p_examen').value.trim(), errs = [], box = $('#errMeta');
      if (!parametro) errs.push('Indique el parámetro.'); if (!valor) errs.push('Indique el valor objetivo.'); if (metas.some(m => norm(m.parametro) === norm(parametro))) errs.push('Ese parámetro ya está en la lista.');
      if (errs.length) { box.innerHTML = '⛔ ' + errs.map(esc).join('<br>⛔ '); box.classList.remove('d-none'); return; } box.classList.add('d-none');
      metas.push({ parametro, valor, examen }); $('#p_parametro').value = ''; $('#p_valor').value = ''; $('#p_examen').value = ''; renderMetas(); $('#errGuardar').classList.add('d-none');
    });
    $('#tablaMetas').addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) { metas.splice(+b.dataset.q, 1); renderMetas(); } });
    $('#btnSugerir').addEventListener('click', () => {
      const dx = dxDe(+$('#selDxS').value); if (!dx) { SS.toast('Seleccione primero un diagnóstico.', 'secondary'); return; }
      const sug = metasSug(dx.cie); if (!sug.length) { SS.toast('No hay metas sugeridas para este código; agréguelas manualmente.', 'secondary'); return; }
      let n = 0; sug.forEach(([parametro, valor, examen]) => { if (!metas.some(m => norm(m.parametro) === norm(parametro))) { metas.push({ parametro, valor, examen }); n++; } }); renderMetas(); SS.toast(`${n} meta(s) sugerida(s) agregada(s). Revíselas y ajústelas.`);
    });

    /* Edición */
    if (editando) {
      $('#tituloForm').textContent = 'Editar plan de seguimiento'; $('#crumbForm').textContent = 'Editar'; btn.innerHTML = '💾 Guardar cambios';
      cargarPac(); $('#selPacS').value = pid; $('#selPacS').disabled = true; $('#buscaPacS').disabled = true; $('#selDxS').value = editando.dx; $('#selDxS').disabled = true;
      $(`input[name=intS][value="${editando.intervalo}"]`).checked = true; $('#fUltimo').value = editando.ultimo; $('#fProximo').value = editando.proximo; proxManual = editando.proximo !== addIntervalo(editando.ultimo, editando.intervalo);
      $('#selEspS').value = editando.esp || ''; llenarProfs(editando.prof); $('#motivoS').value = editando.motivo || ''; $('#chkRec').checked = editando.recordatorio; $('#selDiasRec').value = editando.diasRec || 7; vistaPrevia();
    } else { $('#fUltimo').value = isoD(HOY); calcProx(true); if (pid) { $('#selPacS').value = pid; cargarPac(); } else $('#selDxS').innerHTML = '<option value="">Seleccione primero un paciente…</option>'; }
    renderMetas(); $('#chkRec').addEventListener('change', e => { $('#selDiasRec').disabled = !e.target.checked; });

    f.addEventListener('submit', e => {
      e.preventDefault(); if (btn.disabled) return; const errs = [], box = $('#errGuardar'), u = $('#fUltimo').value, p = $('#fProximo').value, dxId = +$('#selDxS').value;
      const dup = !editando && DB.seguimientos.some(s => s.pac === pid && s.dx === dxId); if (dup) errs.push('Ya existe un plan de seguimiento para este paciente y diagnóstico. Edítelo desde el panel.');
      const malProx = !!u && !!p && p <= u; $('#fProximo').setCustomValidity(malProx ? 'x' : ''); if (malProx) errs.push('La fecha límite debe ser posterior al último control.');
      if (u && u > isoD(HOY)) { $('#fUltimo').setCustomValidity('x'); errs.push('El último control no puede estar en el futuro.'); } else $('#fUltimo').setCustomValidity('');
      if (!metas.length) errs.push('Registre al menos una meta clínica.');
      f.classList.add('was-validated'); if (!f.checkValidity() || errs.length) { if (errs.length) { box.innerHTML = '⛔ ' + errs.map(esc).join('<br>⛔ '); box.classList.remove('d-none'); } (f.querySelector(':invalid') || box).scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      box.classList.add('d-none'); const unlock = SS.lock(btn, 'Guardando…');
      setTimeout(() => {
        const datos = { prof: +$('#selProfS').value, ultimo: u, proximo: p, intervalo: intSel(), estado: estadoDe(p), motivo: $('#motivoS').value.trim(), esp: $('#selEspS').value, recordatorio: $('#chkRec').checked, diasRec: +$('#selDiasRec').value }; let seg;
        if (editando) { const ant = { proximo: editando.proximo, intervalo: editando.intervalo }; Object.assign(editando, datos); seg = editando; DB.metas = DB.metas.filter(m => m.seg !== seg.id); auditar('seguimiento_control', seg.id, 'Modificación', ant, { proximo: p, intervalo: datos.intervalo }); }
        else { seg = { id: Math.max(0, ...DB.seguimientos.map(s => s.id)) + 1, pac: pid, dx: dxId, ...datos }; DB.seguimientos.push(seg); auditar('seguimiento_control', seg.id, 'Creación', null, { paciente: pacDe(pid).nombre, intervalo: datos.intervalo, proximo: p }); }
        metas.forEach(m => { const id = Math.max(0, ...DB.metas.map(x => x.id)) + 1; DB.metas.push({ id, seg: seg.id, ...m }); }); auditar('meta_clinica', seg.id, editando ? 'Modificación' : 'Creación', null, { metas: metas.map(m => m.parametro).join(', ') });
        guardar(); unlock(); f.classList.add('d-none'); $('#exito').classList.remove('d-none'); $('#exitoTitulo').textContent = editando ? 'Plan de seguimiento actualizado' : 'Plan de seguimiento guardado';
        $('#exitoTexto').innerHTML = `${esc(pacDe(seg.pac).nombre)} · próximo control el <strong>${fmtF(seg.proximo)}</strong> (${esc(seg.intervalo)}) con ${esc(profDe(seg.prof).nombre)}.<br>${metas.length} meta(s) clínica(s) registrada(s)${seg.recordatorio ? ` · 🔔 recordatorio ${seg.diasRec} días antes` : ''}.`;
        window.scrollTo({ top: 0, behavior: 'smooth' }); SS.toast('Plan de seguimiento guardado correctamente.');
      }, 900);
    });
  }

  document.addEventListener('DOMContentLoaded', () => { setInst(); initPanel(); initProgramar(); });
})();