/* ===== SaludSync · Módulo 11: Tratamientos y Prescripción Médica (mockup interactivo, sin backend) ===== */
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
  const fmtDT = s => { const d = new Date(s); return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const leer = k => { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } };
  const edad = s => { const n = parseD(s); let a = HOY.getFullYear() - n.getFullYear(); const m = HOY.getMonth() - n.getMonth(); if (m < 0 || (m === 0 && HOY.getDate() < n.getDate())) a--; return a; };
  const edadTxt = s => { const a = edad(s); if (a >= 2) return a + ' años'; const n = parseD(s); return ((HOY.getFullYear() - n.getFullYear()) * 12 + HOY.getMonth() - n.getMonth() - (HOY.getDate() < n.getDate() ? 1 : 0)) + ' meses'; };
  const sello = txt => { let h1 = 5381, h2 = 52711; for (const c of txt) { h1 = ((h1 * 33) ^ c.charCodeAt(0)) >>> 0; h2 = ((h2 * 31) ^ c.charCodeAt(0)) >>> 0; } return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).toUpperCase(); };
  const formulaNum = id => 'FM-' + String(id).padStart(6, '0');

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
  const PROF_SEED = [[1, 'Andrés Felipe', 'Navarro Díaz', 3, 'RM-0481923'], [2, 'Paula Andrea', 'Rueda Mantilla', 4, 'RM-0512044'], [3, 'Mauricio', 'Ariza Gómez', null, 'RM-0377810'], [4, 'Liliana', 'Cortés Vargas', null, 'RM-0420365'],
    [5, 'Iván Darío', 'Suárez Pinto', null, 'RM-0609712'], [6, 'Marcela', 'Quintero Ardila', null, 'RM-0298456'], [7, 'Camilo Andrés', 'Ortega Rey', null, 'RM-0734120'], [8, 'Sergio', 'Medina Restrepo', null, 'RM-0855031'],
    [9, 'Sofía', 'Bermúdez Luna', null, 'RM-0446779'], [10, 'Diana Patricia', 'Cifuentes Mora', null, 'RM-0361902']].map(([id, nombres, apellidos, uid, tarjeta]) => ({ id, nombres, apellidos, uid, tarjeta }));
  const M3 = leer('saludsync_modulo3_v1'), M4 = leer('saludsync_modulo4_v1'), M8 = leer('saludsync_modulo8_v1'), M10 = leer('saludsync_modulo10_v1');
  const PACS = ((M3 && M3.pacientes) ? M3.pacientes : PAC_SEED).map(p => ({ id: p.id, tipo: p.tipo, doc: p.doc, nombre: `${p.nombres} ${p.apellidos}`, estado: p.estado, nac: p.nac, sexo: p.sexo }));
  const PROFS = ((M4 && M4.profesionales) ? M4.profesionales : PROF_SEED).map(p => ({ id: p.id, nombre: `${p.nombres} ${p.apellidos}`, corto: `${p.nombres.split(' ')[0]} ${p.apellidos.split(' ')[0]}`, uid: p.uid, tarjeta: p.tarjeta || '—' }));
  const pacDe = id => PACS.find(p => p.id === id), profDe = id => PROFS.find(p => p.id === id);
  const medicoSesion = () => { const m2 = leer('saludsync_modulo2_v1'); const u = m2 && SES && m2.usuarios.find(x => x.id === SES.id); return u && u.rol === 3 ? PROFS.find(p => p.uid === u.id) : null; };
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
      out.push({ id: -(pid * 100 + i + 1), pac: pid, fecha: isoDT(d), fin: isoDT(new Date(d.getTime() + 25 * 6e4)), prof, motivo: pool[(pid + i) % pool.length], cita: null });
    }
    return out;
  }
  function atencionesDe(pid) {
    const out = atencionesSemilla(pid);
    if (M8 && M8.atenciones) M8.atenciones.filter(a => a.pac === pid && a.estado === 'Finalizada').forEach(a => out.push({ id: a.id, pac: pid, fecha: a.inicio, fin: a.fin, prof: a.prof, motivo: a.motivo || '(sin motivo)', cita: a.cita }));
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

  /* ---------- Catálogos clínicos ---------- */
  const UNIDADES = ['tableta', 'cápsula', 'mL', 'gotas', 'ampolla', 'sobre', 'aplicación', 'inhalación', 'parche', 'supositorio'];
  const PLURAL = { 'tableta': 'tabletas', 'cápsula': 'cápsulas', 'mL': 'mL', 'gotas': 'gotas', 'ampolla': 'ampollas', 'sobre': 'sobres', 'aplicación': 'aplicaciones', 'inhalación': 'inhalaciones', 'parche': 'parches', 'supositorio': 'supositorios' };
  const unidadTxt = (u, n) => n === 1 ? u : (PLURAL[u] || u);
  const FRECS = [['Dosis única', 0], ['Cada 4 horas', 4], ['Cada 6 horas', 6], ['Cada 8 horas', 8], ['Cada 12 horas', 12], ['Cada 24 horas', 24], ['Cada 48 horas', 48]];
  const CAT_MEDS = [['Acetaminofén', '500 mg tableta', 'Oral', 'tableta', 1, 8, 5], ['Acetaminofén', '150 mg/5 mL jarabe', 'Oral', 'mL', 5, 6, 3], ['Ibuprofeno', '400 mg tableta', 'Oral', 'tableta', 1, 8, 5], ['Amoxicilina', '500 mg cápsula', 'Oral', 'cápsula', 1, 8, 7],
    ['Amoxicilina', '250 mg/5 mL suspensión', 'Oral', 'mL', 5, 8, 7], ['Azitromicina', '500 mg tableta', 'Oral', 'tableta', 1, 24, 3], ['Cefalexina', '500 mg cápsula', 'Oral', 'cápsula', 1, 6, 7], ['Ciprofloxacino', '500 mg tableta', 'Oral', 'tableta', 1, 12, 7],
    ['Trimetoprim/Sulfametoxazol', '160/800 mg tableta', 'Oral', 'tableta', 1, 12, 5], ['Losartán', '50 mg tableta', 'Oral', 'tableta', 1, 24, 30], ['Enalapril', '20 mg tableta', 'Oral', 'tableta', 1, 12, 30], ['Amlodipino', '5 mg tableta', 'Oral', 'tableta', 1, 24, 30],
    ['Hidroclorotiazida', '25 mg tableta', 'Oral', 'tableta', 1, 24, 30], ['Metformina', '850 mg tableta', 'Oral', 'tableta', 1, 12, 30], ['Glibenclamida', '5 mg tableta', 'Oral', 'tableta', 1, 24, 30], ['Atorvastatina', '20 mg tableta', 'Oral', 'tableta', 1, 24, 30],
    ['Omeprazol', '20 mg cápsula', 'Oral', 'cápsula', 1, 24, 14], ['Loratadina', '10 mg tableta', 'Oral', 'tableta', 1, 24, 5], ['Prednisona', '20 mg tableta', 'Oral', 'tableta', 1, 24, 5], ['Diclofenaco', '50 mg tableta', 'Oral', 'tableta', 1, 12, 5],
    ['Naproxeno', '250 mg tableta', 'Oral', 'tableta', 1, 12, 5], ['Sumatriptán', '50 mg tableta', 'Oral', 'tableta', 1, 24, 5], ['Levotiroxina', '50 mcg tableta', 'Oral', 'tableta', 1, 24, 30], ['Salbutamol', '100 mcg/dosis inhalador', 'Otra', 'inhalación', 2, 6, 10],
    ['Hidrocortisona', 'crema 1 %', 'Tópica', 'aplicación', 1, 12, 7], ['Clotrimazol', 'crema 1 %', 'Tópica', 'aplicación', 1, 12, 14], ['Ceftriaxona', '1 g ampolla', 'Intramuscular', 'ampolla', 1, 24, 3], ['Diclofenaco', '75 mg/3 mL ampolla', 'Intramuscular', 'ampolla', 1, 24, 2]]
    .map(([nombre, pres, via, unidad, dosis, frec, dias]) => ({ nombre, pres, via, unidad, dosis, frec, dias }));
  const EXAMENES = { 'Laboratorio Clínico': ['Hemograma completo', 'Glicemia en ayunas', 'Hemoglobina glicosilada (HbA1c)', 'Perfil lipídico', 'Creatinina sérica', 'Uroanálisis', 'TSH', 'Transaminasas (AST/ALT)', 'Proteína C reactiva'],
    'Imagenología': ['Radiografía de tórax PA y lateral', 'Ecografía abdominal total', 'Radiografía de columna lumbosacra', 'Ecografía pélvica', 'Ecocardiograma transtorácico'], 'Procedimiento Especial': ['Electrocardiograma', 'Espirometría', 'Endoscopia digestiva alta', 'Holter de 24 horas'], 'Otro': [] };
  const REGLAS_ALERGIA = [['penicilina', ['amoxicilina', 'ampicilina', 'penicilina']], ['aine', ['ibuprofeno', 'diclofenaco', 'naproxeno', 'ketorolaco']], ['diclofenaco', ['ibuprofeno', 'diclofenaco', 'naproxeno', 'ketorolaco']], ['sulfa', ['trimetoprim', 'sulfametoxazol']]];

  /* ---------- Cálculo farmacéutico ---------- */
  function calcular(dosis, frecH, dias) {
    const d = +dosis, n = +dias; if (!(d > 0) || !(n >= 1)) return { tomas: 0, cantidad: 0 };
    const tomas = frecH === 0 ? 1 : Math.ceil(n * 24 / frecH); return { tomas, cantidad: Math.ceil(d * tomas) };
  }
  const medTexto = m => ({ dosis: `${m.dosisN} ${unidadTxt(m.unidad, m.dosisN)}`.slice(0, 30), frecuencia: (FRECS.find(f => f[1] === m.frecH) || FRECS[0])[0] });

  /* ---------- Datos propios: tratamiento, medicamento_formulado, orden_examen ---------- */
  const PLAN = {
    'I10': { tipo: 'Farmacológico', dias: 90, meds: [['Losartán', '50 mg tableta', 'Oral', 1, 'tableta', 24]], rec: 'Dieta baja en sodio, actividad física regular y control de la presión arterial en casa.', al: 'Dolor de pecho, dificultad para respirar o cefalea intensa.', ex: [['Creatinina sérica', 'Laboratorio Clínico']] },
    'E11.9': { tipo: 'Farmacológico', dias: 90, meds: [['Metformina', '850 mg tableta', 'Oral', 1, 'tableta', 12]], rec: 'Plan de alimentación, actividad física y control de glucemia.', al: 'Sed excesiva, mareo intenso o glucemia mayor de 300 mg/dL.', ex: [['Hemoglobina glicosilada (HbA1c)', 'Laboratorio Clínico']] },
    'M54.5': { tipo: 'Farmacológico', dias: 5, meds: [['Acetaminofén', '500 mg tableta', 'Oral', 1, 'tableta', 8]], rec: 'Reposo relativo, calor local y evitar cargas pesadas.', al: 'Pérdida de fuerza en piernas o dolor que no cede.', ex: [] },
    'J06.9': { tipo: 'Farmacológico', dias: 5, meds: [['Acetaminofén', '500 mg tableta', 'Oral', 1, 'tableta', 8], ['Loratadina', '10 mg tableta', 'Oral', 1, 'tableta', 24]], rec: 'Abundantes líquidos, reposo y lavado nasal.', al: 'Fiebre mayor de 39 °C o dificultad para respirar.', ex: [] },
    'G43.9': { tipo: 'Farmacológico', dias: 5, meds: [['Sumatriptán', '50 mg tableta', 'Oral', 1, 'tableta', 24]], rec: 'Identificar desencadenantes y mantener horarios de sueño regulares.', al: 'Cefalea súbita intensa, pérdida de visión o debilidad.', ex: [] },
    'R50.9': { tipo: 'Farmacológico', dias: 3, meds: [['Acetaminofén', '150 mg/5 mL jarabe', 'Oral', 5, 'mL', 6]], rec: 'Medios físicos, líquidos abundantes y ropa ligera.', al: 'Fiebre mayor de 39 °C por más de 48 horas, decaimiento marcado.', ex: [] },
    'Z00.0': { tipo: 'No farmacológico', dias: 30, meds: [], rec: 'Mantener hábitos saludables: alimentación balanceada, actividad física y sueño adecuado.', al: '', ex: [['Perfil lipídico', 'Laboratorio Clínico']] },
    'Z00.1': { tipo: 'No farmacológico', dias: 30, meds: [], rec: 'Pautas de alimentación, estimulación y seguridad según la edad.', al: '', ex: [] },
    'Z23': { tipo: 'No farmacológico', dias: 7, meds: [], rec: 'Vigilar la zona de aplicación y administrar acetaminofén solo si hay fiebre.', al: 'Fiebre mayor de 39 °C o reacción local extensa.', ex: [] }
  };
  function medsDesde(plan, dias) { return plan.meds.map(([pa, pres, via, dosisN, unidad, frecH]) => { const c = calcular(dosisN, frecH, dias), t = medTexto({ dosisN, unidad, frecH }); return { pa, pres, via, dosisN, unidad, frecH, dosis: t.dosis, frecuencia: t.frecuencia, dias, cantidad: c.cantidad }; }); }
  function semillaTrat() {
    const out = { tratamientos: [], ordenes: [] }; let idT = 1, idO = 1; const hoy = isoD(HOY);
    semillaDx().filter(d => d.tipo === 'Principal' && PLAN[d.cie]).forEach(d => {
      const at = PAC_HIST.map(p => atencionesSemilla(p)).flat().find(a => a.id === d.atencion), pl = PLAN[d.cie]; if (!at) return;
      const inicio = at.fecha.slice(0, 10), fin = addDias(inicio, pl.dias - 1), vencido = fin < hoy, cronico = pl.dias >= 90;
      out.tratamientos.push({ id: idT++, dx: d.id, pac: at.pac, prof: at.prof, atencion: at.id, tipo: pl.tipo, recom: pl.rec, alarma: pl.al, inicio, fin, estado: vencido ? 'Finalizado' : 'Activo', motivo: vencido ? (cronico ? 'Ajuste de dosis' : 'Mejoría clínica') : null, meds: medsDesde(pl, pl.dias), creada: at.fin, ajusteDe: null });
      pl.ex.forEach(([nombre, tipo]) => out.ordenes.push({ id: idO++, atencion: at.id, pac: at.pac, prof: at.prof, tipo, nombre, just: 'Control de la patología según guía clínica.', estado: vencido ? 'Realizada' : 'Generada', fecha: at.fin }));
    });
    const sus = out.tratamientos.find(t => t.estado === 'Activo' && t.tipo === 'Farmacológico' && t.pac === 9) || out.tratamientos.filter(t => t.estado === 'Activo' && t.tipo === 'Farmacológico')[1];
    if (sus) { sus.estado = 'Suspendido'; sus.motivo = 'Adversidad'; }
    return out;
  }
  const KEY = 'saludsync_modulo11_v1';
  const DB = (() => { const s = leer(KEY); return s && s.tratamientos ? s : semillaTrat(); })();
  const guardar = () => { try { sessionStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } };
  const tratDe = id => DB.tratamientos.find(t => t.id === id);
  const restantes = t => t.fin ? Math.round((parseD(t.fin) - HOY) / 864e5) + 1 : null;
  const dxTxt = t => { const d = dxDe(t.dx); return d ? `<span class="cie-code">${esc(d.cie)}</span><span class="cell-sub">${esc(descCie(d))}</span>` : '—'; };
  const medResumen = t => t.meds.length ? t.meds.map(m => esc(m.pa)).join(', ') : '—';
  function llenarSelectPac(sel, q, actual, todos) { const qq = norm(q || ''); sel.innerHTML = (todos ? '<option value="">Todos los pacientes</option>' : '<option value="">Seleccione…</option>') + PACS.filter(p => !qq || norm(p.nombre).includes(qq) || norm(p.doc).includes(qq)).map(p => `<option value="${p.id}">${esc(p.nombre)} · ${esc(p.tipo)} ${esc(p.doc)}</option>`).join(''); if (actual) sel.value = actual; }

  /* ---------- Generador de PDF (sin librerías) ---------- */
  function crearPDF() {
    const W = 595, H = 842, pages = []; let cur = null;
    const enc = s => String(s).replace(/[–—]/g, '-').replace(/[·•]/g, '-').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/₂/g, '2').replace(/[^\x20-\xFF]/g, '?').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    const col = c => c.map(v => v.toFixed(3)).join(' ');
    return {
      W, H, nueva() { cur = []; pages.push(cur); return pages.length; },
      texto(x, y, s, f = 'F1', size = 10, c = [0, 0, 0]) { cur.push(`BT /${f} ${size} Tf ${col(c)} rg ${x.toFixed(1)} ${(H - y).toFixed(1)} Td (${enc(s)}) Tj ET`); },
      rect(x, y, w, h, c) { cur.push(`${col(c)} rg ${x.toFixed(1)} ${(H - y - h).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f`); },
      linea(x1, y1, x2, y2, c = [.8, .8, .8], w = .6) { cur.push(`${col(c)} RG ${w} w ${x1} ${H - y1} m ${x2} ${H - y2} l S`); },
      construir() {
        const objs = []; objs[1] = '<< /Type /Catalog /Pages 2 0 R >>'; objs[2] = `<< /Type /Pages /Kids [${pages.map((_, i) => `${6 + i * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`;
        objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'; objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'; objs[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>';
        pages.forEach((p, i) => { const content = p.join('\n'); objs[6 + i * 2] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${7 + i * 2} 0 R >>`; objs[7 + i * 2] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`; });
        let out = '%PDF-1.4\n'; const off = []; for (let i = 1; i < objs.length; i++) { off[i] = out.length; out += `${i} 0 obj\n${objs[i]}\nendobj\n`; }
        const xr = out.length; out += `xref\n0 ${objs.length}\n0000000000 65535 f \n`; for (let i = 1; i < objs.length; i++) out += String(off[i]).padStart(10, '0') + ' 00000 n \n';
        out += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`;
        return new Blob([Uint8Array.from(out, c => c.charCodeAt(0) & 255)], { type: 'application/pdf' });
      }
    };
  }
  function envolver(s, max) { const out = []; String(s || '').split('\n').forEach(par => { let linea = ''; par.split(/\s+/).forEach(w => { if ((linea + ' ' + w).trim().length > max) { out.push(linea); linea = w; } else linea = (linea + ' ' + w).trim(); }); out.push(linea); }); return out; }
  function descargarFormula(t) {
    const pdf = crearPDF(), azul = [.043, .361, .671], gris = [.4, .45, .5], p = pacDe(t.pac), pr = profDe(t.prof), d = dxDe(t.dx), ords = DB.ordenes.filter(o => o.atencion === t.atencion);
    let y = 0, nPag = 0;
    const encabezado = (cont) => { pdf.nueva(); nPag++; pdf.rect(0, 0, pdf.W, 66, azul); pdf.texto(40, 34, 'SaludSync', 'F2', 20, [1, 1, 1]); pdf.texto(40, 52, cont ? 'Fórmula médica (continuación)' : 'Fórmula médica / Plan terapéutico', 'F1', 11, [1, 1, 1]);
      pdf.texto(430, 34, formulaNum(t.id), 'F2', 14, [1, 1, 1]); pdf.texto(430, 52, 'Emitida: ' + fmtF(t.creada || t.inicio), 'F1', 9, [1, 1, 1]); y = 90; };
    const asegurar = h => { if (y + h > 790) encabezado(true); };
    encabezado(false);
    pdf.texto(40, y, INST.nombre, 'F2', 12, azul); y += 14; pdf.texto(40, y, 'NIT 900.000.000-0 · Habilitación REPS vigente', 'F1', 8, gris); y += 18;
    pdf.rect(40, y, 515, 58, [.94, .96, .98]); pdf.texto(48, y + 16, 'Paciente: ' + p.nombre, 'F2', 10); pdf.texto(48, y + 30, `Documento: ${p.tipo} ${p.doc}   ·   Edad: ${edadTxt(p.nac)}   ·   Sexo: ${p.sexo}`, 'F1', 9);
    pdf.texto(48, y + 44, 'Diagnóstico: ' + (d ? `${d.cie} - ${descCie(d)}`.slice(0, 85) : '—'), 'F1', 9); y += 76;
    pdf.texto(40, y, `Tipo de tratamiento: ${t.tipo}      Inicio: ${fmtF(t.inicio)}      Fin estimado: ${t.fin ? fmtF(t.fin) : '—'}`, 'F1', 9.5); y += 22;
    if (t.meds.length) {
      pdf.texto(40, y, 'PRESCRIPCIÓN', 'F2', 11, azul); y += 8; pdf.rect(40, y, 515, 18, [.88, .93, .98]);
      [['Medicamento', 46], ['Vía', 250], ['Dosis', 310], ['Frecuencia', 375], ['Días', 465], ['Cant.', 505]].forEach(([h, x]) => pdf.texto(x, y + 12, h, 'F2', 8.5)); y += 18;
      t.meds.forEach(m => { asegurar(34); pdf.texto(46, y + 13, m.pa, 'F2', 9); pdf.texto(46, y + 24, m.pres, 'F1', 8, gris); pdf.texto(250, y + 13, m.via, 'F1', 9); pdf.texto(310, y + 13, m.dosis, 'F1', 9); pdf.texto(375, y + 13, m.frecuencia, 'F1', 9);
        pdf.texto(468, y + 13, String(m.dias), 'F1', 9); pdf.texto(508, y + 13, `${m.cantidad}`, 'F2', 9); y += 32; pdf.linea(40, y, 555, y); });
      y += 12;
    }
    const bloque = (titulo, texto, color) => { if (!texto) return; const ls = envolver(texto, 95); asegurar(24 + ls.length * 12); pdf.texto(40, y, titulo, 'F2', 10.5, color || azul); y += 14; ls.forEach(l => { pdf.texto(46, y, l, 'F1', 9.5); y += 12; }); y += 8; };
    bloque('RECOMENDACIONES', t.recom); bloque('SIGNOS DE ALARMA - consulte de inmediato si presenta:', t.alarma, [.75, .22, .17]);
    if (ords.length) { asegurar(30 + ords.length * 14); pdf.texto(40, y, 'ÓRDENES DE EXAMEN', 'F2', 10.5, azul); y += 14; ords.forEach(o => { pdf.texto(46, y, `- ${o.nombre} (${o.tipo})`, 'F1', 9.5); y += 13; pdf.texto(58, y, 'Justificación: ' + o.just.slice(0, 95), 'F3', 8.5, gris); y += 13; }); y += 8; }
    asegurar(110); y = Math.max(y + 10, 0); pdf.linea(40, y, 555, y, azul, 1); y += 18;
    const huella = sello(`${t.id}|${t.pac}|${t.dx}|${t.inicio}|${t.meds.map(m => m.pa + m.cantidad).join(',')}`);
    pdf.rect(40, y, 515, 74, [.99, .97, .9]); pdf.texto(48, y + 16, 'DOCUMENTO FIRMADO ELECTRÓNICAMENTE - Firma digital institucional', 'F2', 9.5, [.48, .35, 0]);
    pdf.texto(48, y + 31, `Profesional: ${pr.nombre}   ·   Tarjeta profesional: ${pr.tarjeta}`, 'F1', 9); pdf.texto(48, y + 45, `Sello de integridad: ${huella}`, 'F1', 9); pdf.texto(48, y + 59, `Fecha de generación: ${fmtDT(new Date())}   ·   ${INST.nombre}`, 'F1', 8.5, gris);
    pdf.texto(40, 825, `SaludSync - ${formulaNum(t.id)} - Página ${nPag}. Documento de demostración; su validez depende de la verificación del sello.`, 'F3', 7.5, gris);
    const url = URL.createObjectURL(pdf.construir()), a = document.createElement('a'); a.href = url; a.download = `formula_${formulaNum(t.id)}.pdf`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    auditar('tratamiento', t.id, 'Modificación', null, { accion: 'Descarga de fórmula PDF', formula: formulaNum(t.id) });
  }

  /* =====================================================
     PANTALLA 11.1 · Prescripción
     ===================================================== */
  function initPrescripcion() {
    if (document.body.dataset.page !== 'formulario_prescripcion') return;
    const params = new URLSearchParams(location.search); let aid = params.get('atencion') !== null ? +params.get('atencion') : null, pid = +params.get('pac') || 0, meds = [], ords = [], guardado = null;
    if (aid !== null && !pid) { const p = PACS.find(x => atencionesDe(x.id).some(a => a.id === aid)); if (p) pid = p.id; }
    const tipoSel = () => $('input[name=tipoT]:checked').value;
    llenarSelectPac($('#selPacT'), '', pid); $('#buscaPacT').addEventListener('input', () => llenarSelectPac($('#selPacT'), $('#buscaPacT').value, pid));
    $('#selPacT').addEventListener('change', e => { pid = +e.target.value || 0; aid = null; cargarPac(); });
    $('#selAtT').addEventListener('change', e => { aid = e.target.value === '' ? null : +e.target.value; cargarAtencion(); });
    $('#selDxT').addEventListener('change', () => ctxAlergias());

    function cargarPac() {
      const p = pacDe(pid); $('#ctxPac').classList.toggle('d-none', !p); $('#atResumen').classList.add('d-none'); $('#bloqueForm').classList.add('d-none'); if (!p) { $('#selAtT').innerHTML = '<option value="">Seleccione primero un paciente…</option>'; return; }
      ctxAlergias(); const ats = atencionesDe(pid);
      $('#selAtT').innerHTML = ats.length ? '<option value="">Seleccione…</option>' + ats.map(a => `<option value="${a.id}">${fmtDT(a.fecha)} · ${esc(a.motivo)}</option>`).join('') : '<option value="">Sin atenciones finalizadas</option>';
      if (!ats.length) { $('#atResumen').classList.remove('d-none'); $('#atResumen').innerHTML = 'El paciente no tiene atenciones finalizadas. Finalice una consulta en el <a href="../atencion/panel_asistencial.html">panel asistencial</a>.'; return; }
      if (aid !== null && ats.some(a => a.id === aid)) { $('#selAtT').value = aid; cargarAtencion(); }
    }
    function ctxAlergias() { const p = pacDe(pid), al = alergias(pid); $('#ctxPac').innerHTML = `<strong>${esc(p.nombre)}</strong> · ${esc(p.tipo)} ${esc(p.doc)} · ${edadTxt(p.nac)} · ${esc(p.sexo)}${al.length ? `<div class="alerta-alergia mt-2">⚠ ALERGIAS: ${al.map(esc).join(' · ')}</div>` : ''}`; }
    function cargarAtencion() {
      const a = atencionesDe(pid).find(x => x.id === aid); $('#bloqueForm').classList.toggle('d-none', !a); if (!a) { $('#atResumen').classList.add('d-none'); return; }
      const pr = profDe(a.prof) || { nombre: '—' }; $('#atResumen').classList.remove('d-none'); $('#atResumen').innerHTML = `<strong>${esc(a.motivo)}</strong><br>📅 ${fmtDT(a.fecha)} · 👨‍⚕️ ${esc(pr.nombre)}`;
      const dxs = DX.filter(d => d.atencion === a.id && d.tipo !== 'Descarte');
      $('#selDxT').innerHTML = dxs.length ? dxs.map(d => `<option value="${d.id}">${esc(d.tipo)} · ${esc(d.cie)} · ${esc(descCie(d).slice(0, 40))}</option>`).join('') : '<option value="">Sin diagnósticos</option>';
      if (!dxs.length) $('#atResumen').innerHTML += `<div class="alert alert-warning small mt-2 mb-0">Esta atención no tiene diagnósticos. Para formular un tratamiento primero <a href="../diagnosticos/registro_diagnostico.html?atencion=${a.id}" class="alert-link">registre el diagnóstico</a>; aún puede generar solo órdenes de examen.</div>`;
      meds = []; ords = []; $('#fInicio').value = isoD(HOY); renderMeds(); renderOrd(); actualizarTipo(); calcFin(); resetMed();
    }

    /* Plan terapéutico */
    function actualizarTipo() {
      const t = tipoSel(), plan = t !== 'ninguno', farma = t === 'Farmacológico'; $('#bloquePlan').classList.toggle('d-none', !plan); $('#bloqueMeds').classList.toggle('d-none', !farma); $('#colDur').classList.toggle('d-none', farma);
      $('#reqRecom').classList.toggle('d-none', farma || !plan); $('#selDxT').disabled = !plan; calcFin();
    }
    $$('input[name=tipoT]').forEach(r => r.addEventListener('change', actualizarTipo));
    function calcFin() {
      const ini = $('#fInicio').value; let dias = tipoSel() === 'Farmacológico' ? Math.max(0, ...meds.map(m => m.dias)) : +$('#fDur').value;
      $('#fFin').value = ini && dias > 0 ? fmtF(addDias(ini, dias - 1)) : '—';
    }
    $('#fInicio').addEventListener('input', calcFin); $('#fDur').addEventListener('input', calcFin);

    /* Medicamentos */
    $('#listaMeds').innerHTML = [...new Set(CAT_MEDS.map(m => m.nombre))].map(n => `<option value="${n}">`).join('');
    $('#m_unidad').innerHTML = UNIDADES.map(u => `<option>${u}</option>`).join(''); $('#m_frec').innerHTML = FRECS.map(([t, h]) => `<option value="${h}">${t}</option>`).join('');
    function resetMed() { $('#m_pa').value = ''; $('#m_pres').value = ''; $('#m_via').value = 'Oral'; $('#m_dosis').value = 1; $('#m_unidad').value = 'tableta'; $('#m_frec').value = 8; $('#m_dias').value = 7; $('#errMed').classList.add('d-none'); $('#bloqueOverride').classList.add('d-none'); $('#chkOverride').checked = false; calcMed(); }
    function calcMed() {
      const frecH = +$('#m_frec').value, unico = frecH === 0; if (unico) $('#m_dias').value = 1; $('#m_dias').disabled = unico;
      const c = calcular($('#m_dosis').value, frecH, $('#m_dias').value), u = $('#m_unidad').value; $('#calcNum').textContent = c.cantidad;
      $('#calcTxt').textContent = c.cantidad ? `${$('#m_dosis').value} ${unidadTxt(u, +$('#m_dosis').value)} × ${c.tomas} toma(s) = ${c.cantidad} ${unidadTxt(u, c.cantidad)}` : '—';
    }
    ['m_dosis', 'm_unidad', 'm_frec', 'm_dias'].forEach(id => ['input', 'change'].forEach(ev => $('#' + id).addEventListener(ev, calcMed)));
    function autocompletar() { const q = norm($('#m_pa').value.trim()), c = CAT_MEDS.find(m => norm(m.nombre) === q && (!$('#m_pres').value || m.pres === $('#m_pres').value)) || CAT_MEDS.find(m => norm(m.nombre) === q); if (!c) return;
      $('#m_pres').value = c.pres; $('#m_via').value = c.via; $('#m_unidad').value = c.unidad; $('#m_dosis').value = c.dosis; $('#m_frec').value = c.frec; $('#m_dias').value = c.dias; calcMed(); }
    $('#m_pa').addEventListener('change', autocompletar);
    function conflictos(nombre) { const n = norm(nombre), al = alergias(pid).map(norm), hits = []; REGLAS_ALERGIA.forEach(([k, ds]) => { if (al.some(a => a.includes(k)) && ds.some(d => n.includes(d))) hits.push(k); }); return [...new Set(hits)]; }
    $('#btnAddMed').addEventListener('click', () => {
      const pa = $('#m_pa').value.trim(), pres = $('#m_pres').value.trim(), dosisN = +$('#m_dosis').value, unidad = $('#m_unidad').value, frecH = +$('#m_frec').value, dias = +$('#m_dias').value, errs = [], box = $('#errMed');
      if (!pa) errs.push('Indique el principio activo.'); if (!pres) errs.push('Indique la presentación y concentración.'); if (!(dosisN > 0)) errs.push('La dosis debe ser mayor a 0.'); if (!(dias >= 1 && dias <= 365)) errs.push('La duración debe estar entre 1 y 365 días.');
      if (meds.some(m => norm(m.pa) === norm(pa))) errs.push('Este medicamento ya está en la fórmula.');
      const c = calcular(dosisN, frecH, dias); if (c.cantidad > 65535) errs.push('La cantidad total supera el máximo permitido.');
      const hits = pa ? conflictos(pa) : []; if (hits.length) { $('#bloqueOverride').classList.remove('d-none'); if (!$('#chkOverride').checked) errs.push(`⚠ ALERTA DE ALERGIA: el paciente tiene alergia registrada a «${hits.join(', ')}» y este medicamento pertenece a ese grupo. Confirme la casilla si decide prescribirlo.`); }
      if (errs.length) { box.innerHTML = '⛔ ' + errs.map(esc).join('<br>⛔ '); box.classList.remove('d-none'); return; }
      const t = medTexto({ dosisN, unidad, frecH }); meds.push({ pa, pres, via: $('#m_via').value, dosisN, unidad, frecH, dosis: t.dosis, frecuencia: t.frecuencia, dias, cantidad: c.cantidad, override: hits.length > 0 });
      resetMed(); renderMeds(); calcFin();
    });
    function renderMeds() {
      $('#tablaMeds').innerHTML = meds.length ? meds.map((m, i) => `<tr><td><span class="med-pa">${esc(m.pa)}</span><span class="cell-sub">${esc(m.pres)}${m.override ? ' · ⚠ prescrito pese a alergia' : ''}</span></td><td><span class="chip-via">${esc(m.via)}</span></td><td>${esc(m.dosis)}</td><td>${esc(m.frecuencia)}</td><td>${m.dias}</td><td><strong>${m.cantidad}</strong> ${unidadTxt(m.unidad, m.cantidad)}</td><td class="text-end"><button type="button" class="btn btn-sm btn-outline-danger" data-q="${i}" title="Quitar">✖</button></td></tr>`).join('')
        : '<tr><td colspan="7" class="text-center text-muted py-3">Aún no hay medicamentos en la fórmula.</td></tr>';
    }
    $('#tablaMeds').addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) { meds.splice(+b.dataset.q, 1); renderMeds(); calcFin(); } });

    /* Órdenes de examen */
    const listaEx = () => { $('#listaEx').innerHTML = (EXAMENES[$('#o_tipo').value] || []).map(n => `<option value="${n}">`).join(''); }; listaEx(); $('#o_tipo').addEventListener('change', listaEx);
    $('#btnAddOrd').addEventListener('click', () => {
      const nombre = $('#o_nombre').value.trim(), just = $('#o_just').value.trim(), errs = [], box = $('#errOrd');
      if (!nombre) errs.push('Indique el nombre del examen.'); if (just.length < 5) errs.push('La justificación clínica es obligatoria.'); if (ords.some(o => norm(o.nombre) === norm(nombre))) errs.push('Este examen ya fue agregado.');
      if (errs.length) { box.innerHTML = '⛔ ' + errs.map(esc).join('<br>⛔ '); box.classList.remove('d-none'); return; }
      box.classList.add('d-none'); ords.push({ tipo: $('#o_tipo').value, nombre, just }); $('#o_nombre').value = ''; $('#o_just').value = ''; renderOrd();
    });
    function renderOrd() { $('#tablaOrd').innerHTML = ords.length ? ords.map((o, i) => `<tr><td><span class="badge badge-ord-${o.tipo.split(' ')[0]}">${esc(o.tipo)}</span></td><td><strong>${esc(o.nombre)}</strong></td><td class="small">${esc(o.just)}</td><td class="text-end"><button type="button" class="btn btn-sm btn-outline-danger" data-q="${i}" title="Quitar">✖</button></td></tr>`).join('') : '<tr><td colspan="4" class="text-center text-muted py-3">Sin órdenes de examen.</td></tr>'; }
    $('#tablaOrd').addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) { ords.splice(+b.dataset.q, 1); renderOrd(); } });

    /* Guardar */
    $('#btnGuardarT').addEventListener('click', e => {
      const btn = e.currentTarget, t = tipoSel(), box = $('#errGuardar'), errs = []; $('#recom').classList.remove('is-invalid');
      const plan = t !== 'ninguno', dxId = +$('#selDxT').value;
      if (plan && !dxId) errs.push('Seleccione el diagnóstico CIE-10 al que se asocia el tratamiento.');
      if (!$('#fInicio').value && plan) errs.push('Indique la fecha de inicio.');
      if (t === 'Farmacológico' && !meds.length) errs.push('Un tratamiento farmacológico requiere al menos un medicamento.');
      if (plan && t !== 'Farmacológico' && $('#recom').value.trim().length < 10) { errs.push('Las recomendaciones son obligatorias (mínimo 10 caracteres).'); $('#recom').classList.add('is-invalid'); }
      if (!plan && !ords.length) errs.push('Agregue al menos una orden de examen.');
      if (errs.length) { box.innerHTML = '⛔ ' + errs.map(esc).join('<br>⛔ '); box.classList.remove('d-none'); box.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      box.classList.add('d-none'); const unlock = SS.lock(btn, 'Guardando…');
      setTimeout(() => {
        const at = atencionesDe(pid).find(x => x.id === aid), med = medicoSesion() || profDe(at.prof), ahora = isoDT(new Date()); let trat = null;
        if (plan) {
          const dias = t === 'Farmacológico' ? Math.max(...meds.map(m => m.dias)) : (+$('#fDur').value || 0), ini = $('#fInicio').value;
          trat = { id: Math.max(0, ...DB.tratamientos.map(x => x.id)) + 1, dx: dxId, pac: pid, prof: med.id, atencion: aid, tipo: t, recom: $('#recom').value.trim(), alarma: $('#alarma').value.trim(), inicio: ini, fin: dias > 0 ? addDias(ini, dias - 1) : null, estado: 'Activo', motivo: null, meds: meds.map(m => ({ ...m })), creada: ahora, ajusteDe: null };
          DB.tratamientos.push(trat); auditar('tratamiento', trat.id, 'Creación', null, { formula: formulaNum(trat.id), tipo: t, medicamentos: meds.length });
          meds.filter(m => m.override).forEach(m => auditar('medicamento_formulado', trat.id, 'Modificación', null, { alerta_alergia_ignorada: m.pa }));
        }
        ords.forEach(o => { const id = Math.max(0, ...DB.ordenes.map(x => x.id)) + 1; DB.ordenes.push({ id, atencion: aid, pac: pid, prof: med.id, tipo: o.tipo, nombre: o.nombre, just: o.just, estado: 'Generada', fecha: ahora }); auditar('orden_examen', id, 'Creación', null, { examen: o.nombre, tipo: o.tipo }); });
        guardar(); guardado = trat; unlock(); $('#flujo').classList.add('d-none'); $('#exito').classList.remove('d-none'); $('#btnVerActivos').href = `tratamientos_activos.html?pac=${pid}`;
        $('#btnPDF').classList.toggle('d-none', !trat); $('#exitoTexto').innerHTML = trat ? `Fórmula <strong>${formulaNum(trat.id)}</strong> registrada${meds.length ? ` con ${meds.length} medicamento(s)` : ''}${ords.length ? ` y ${ords.length} orden(es) de examen` : ''}.` : `Se generaron <strong>${ords.length}</strong> orden(es) de examen.`;
        window.scrollTo({ top: 0, behavior: 'smooth' }); SS.toast('Prescripción registrada correctamente.');
      }, 900);
    });
    $('#btnPDF').addEventListener('click', e => { if (!guardado) return; const unlock = SS.lock(e.currentTarget, 'Generando PDF…'); setTimeout(() => { descargarFormula(guardado); unlock(); SS.toast('Fórmula PDF generada.'); }, 700); });
    actualizarTipo(); calcMed(); if (pid) { $('#selPacT').value = pid; cargarPac(); } else $('#selAtT').innerHTML = '<option value="">Seleccione primero un paciente…</option>';
  }

  /* =====================================================
     PANTALLA 11.2 · Tratamientos activos
     ===================================================== */
  function initActivos() {
    if (document.body.dataset.page !== 'tratamientos_activos') return;
    let sel = null, cierreAcc = null;
    llenarSelectPac($('#fPac'), '', +new URLSearchParams(location.search).get('pac') || 0, true);
    ['fTxt', 'fPac', 'fTipo', 'fEstOrd'].forEach(id => ['input', 'change'].forEach(ev => $('#' + id).addEventListener(ev, render)));
    $('#btnLimpiar').addEventListener('click', () => { $('#fTxt').value = ''; $('#fPac').value = ''; $('#fTipo').value = ''; render(); });

    const filtrarT = lista => { const q = norm($('#fTxt').value.trim()), fp = +$('#fPac').value, ft = $('#fTipo').value;
      return lista.filter(t => { const p = pacDe(t.pac), d = dxDe(t.dx); return p && (!fp || t.pac === fp) && (!ft || t.tipo === ft) && (!q || norm(p.nombre).includes(q) || (d && norm(d.cie).includes(q)) || t.meds.some(m => norm(m.pa).includes(q))); }); };
    const btn = (a, ico, cls, tit, id) => `<button class="btn btn-sm btn-outline-${cls}" data-act="${a}" data-id="${id}" title="${tit}">${ico}</button>`;

    function render() {
      const vig = filtrarT(DB.tratamientos.filter(t => t.estado !== 'Finalizado')).sort((a, b) => (restantes(a) ?? 999) - (restantes(b) ?? 999)), hist = filtrarT(DB.tratamientos.filter(t => t.estado === 'Finalizado')).sort((a, b) => b.inicio.localeCompare(a.inicio));
      const act = DB.tratamientos.filter(t => t.estado === 'Activo');
      $('#kpis').innerHTML = [['Tratamientos activos', act.length, ''], ['Por vencer (≤ 3 días)', act.filter(t => restantes(t) !== null && restantes(t) <= 3).length, 'kpi-warn'], ['Suspendidos', DB.tratamientos.filter(t => t.estado === 'Suspendido').length, 'kpi-gray'], ['Finalizados', DB.tratamientos.filter(t => t.estado === 'Finalizado').length, 'kpi-green']]
        .map(([l, v, c]) => `<div class="col-6 col-lg-3"><div class="kpi ${c}"><div class="kpi-num">${v}</div><div class="kpi-lbl">${l}</div></div></div>`).join('');
      $('#nVig').textContent = vig.length; $('#nHist').textContent = hist.length;
      $('#tablaVig').innerHTML = vig.length ? vig.map(t => { const p = pacDe(t.pac), r = restantes(t), total = t.fin ? Math.round((parseD(t.fin) - parseD(t.inicio)) / 864e5) + 1 : 0, pct = t.fin ? Math.min(100, Math.max(0, Math.round((total - Math.max(r, 0)) / total * 100))) : 0, vence = r !== null && r <= 3;
        const vig_ = t.fin ? `<span class="dias-rest ${vence ? 'vence' : ''}">${r > 0 ? r + ' día(s) restantes' : 'Vencido: pendiente de cierre'}</span><div class="prog-trat ${vence ? 'vence' : ''} mt-1"><span style="width:${pct}%"></span></div><span class="cell-sub">${fmtF(t.inicio)} → ${fmtF(t.fin)}</span>` : `<span class="text-muted">Sin fecha fin</span><span class="cell-sub">Desde ${fmtF(t.inicio)}</span>`;
        return `<tr><td><strong>${formulaNum(t.id)}</strong><span class="cell-sub">${esc(medResumen(t))}</span></td><td>${esc(p.nombre)}<span class="cell-sub">${esc(p.tipo)} ${esc(p.doc)}</span></td><td>${dxTxt(t)}</td><td>${esc(t.tipo)}</td><td style="min-width:170px">${vig_}</td>
          <td><span class="est-trat est-${t.estado}">${t.estado}</span>${t.motivo ? `<span class="cell-sub">${esc(t.motivo)}</span>` : ''}</td>
          <td class="text-end text-nowrap">${btn('ver', '👁', 'primary', 'Ver detalle', t.id)} ${btn('pdf', '📄', 'danger', 'Descargar fórmula PDF', t.id)} ${t.estado === 'Activo' ? (t.meds.length ? btn('ajustar', '✏️', 'primary', 'Ajustar dosis', t.id) + ' ' : '') + btn('suspender', '⏸', 'warning', 'Suspender', t.id) + ' ' + btn('finalizar', '✔', 'success', 'Finalizar', t.id) : btn('reanudar', '▶', 'success', 'Reanudar', t.id) + ' ' + btn('finalizar', '✔', 'success', 'Finalizar', t.id)}</td></tr>`; }).join('')
        : '<tr><td colspan="7" class="text-center text-muted py-4">No hay tratamientos vigentes con estos filtros.</td></tr>';
      $('#tablaHist').innerHTML = hist.length ? hist.map(t => { const p = pacDe(t.pac); return `<tr><td><strong>${formulaNum(t.id)}</strong><span class="cell-sub">${esc(medResumen(t))}</span></td><td>${esc(p.nombre)}</td><td>${dxTxt(t)}</td><td>${esc(t.tipo)}</td><td>${fmtF(t.inicio)}${t.fin ? ' → ' + fmtF(t.fin) : ''}</td><td><span class="est-trat est-Finalizado">${esc(t.motivo || 'Finalizado')}</span></td>
        <td class="text-end text-nowrap">${btn('ver', '👁', 'primary', 'Ver detalle', t.id)} ${btn('pdf', '📄', 'danger', 'Descargar fórmula PDF', t.id)}</td></tr>`; }).join('') : '<tr><td colspan="7" class="text-center text-muted py-4">Sin prescripciones finalizadas.</td></tr>';
      const fo = $('#fEstOrd').value, fp = +$('#fPac').value, ordenes = DB.ordenes.filter(o => (!fo || o.estado === fo) && (!fp || o.pac === fp)).sort((a, b) => b.fecha.localeCompare(a.fecha)); $('#nOrd').textContent = ordenes.length;
      $('#tablaOrd').innerHTML = ordenes.length ? ordenes.map(o => { const p = pacDe(o.pac) || { nombre: '—' }; return `<tr><td>#${o.id}<span class="cell-sub">${fmtF(o.fecha)}</span></td><td>${esc(p.nombre)}</td><td><span class="badge badge-ord-${o.tipo.split(' ')[0]}">${esc(o.tipo)}</span></td><td><strong>${esc(o.nombre)}</strong></td><td class="small">${esc(o.just)}</td><td><span class="est-trat est-${o.estado}">${o.estado}</span></td>
        <td class="text-end text-nowrap">${o.estado === 'Generada' ? `<button class="btn btn-sm btn-outline-success" data-ord="realizada" data-id="${o.id}">✔ Realizada</button> <button class="btn btn-sm btn-outline-secondary" data-ord="cancelada" data-id="${o.id}">✖ Cancelar</button>` : ''}</td></tr>`; }).join('') : '<tr><td colspan="7" class="text-center text-muted py-4">No hay órdenes de examen.</td></tr>';
    }

    $('#tablaOrd').addEventListener('click', e => { const b = e.target.closest('[data-ord]'); if (!b) return; const o = DB.ordenes.find(x => x.id === +b.dataset.id), unlock = SS.lock(b, '…');
      setTimeout(() => { const ant = o.estado; o.estado = b.dataset.ord === 'realizada' ? 'Realizada' : 'Cancelada'; auditar('orden_examen', o.id, 'Modificación', { estado: ant }, { estado: o.estado }); guardar(); render(); SS.toast(`Orden ${o.estado.toLowerCase()}.`, 'secondary'); }, 500); });

    const detalle = t => {
      const p = pacDe(t.pac), pr = profDe(t.prof), d = dxDe(t.dx), ords = DB.ordenes.filter(o => o.atencion === t.atencion), suc = DB.tratamientos.find(x => x.ajusteDe === t.id), ant = t.ajusteDe ? DB.tratamientos.find(x => x.id === t.ajusteDe) : null;
      $('#detTitulo').textContent = `${formulaNum(t.id)} · ${p.nombre}`; $('#btnDetPDF').dataset.id = t.id;
      $('#detCuerpo').innerHTML = `<div class="row g-3 small mb-3"><div class="col-md-6"><strong>Diagnóstico:</strong> ${d ? `<span class="cie-code">${esc(d.cie)}</span> ${esc(descCie(d))}` : '—'}</div><div class="col-md-6"><strong>Médico:</strong> ${esc(pr.nombre)}</div>
        <div class="col-md-6"><strong>Tipo:</strong> ${esc(t.tipo)}</div><div class="col-md-6"><strong>Estado:</strong> <span class="est-trat est-${t.estado}">${t.estado}</span>${t.motivo ? ' · ' + esc(t.motivo) : ''}</div>
        <div class="col-md-6"><strong>Inicio:</strong> ${fmtF(t.inicio)}</div><div class="col-md-6"><strong>Fin estimado:</strong> ${t.fin ? fmtF(t.fin) : '—'}</div>
        ${ant ? `<div class="col-12 text-muted">↩ Ajuste de la fórmula ${formulaNum(ant.id)}</div>` : ''}${suc ? `<div class="col-12 text-muted">↪ Reemplazada por la fórmula ${formulaNum(suc.id)} (ajuste de dosis)</div>` : ''}</div>
        ${t.meds.length ? `<div class="table-responsive mb-3"><table class="table table-sm table-ss"><thead><tr><th>Medicamento</th><th>Vía</th><th>Dosis</th><th>Frecuencia</th><th>Días</th><th>Cantidad</th></tr></thead><tbody>${t.meds.map(m => `<tr><td><strong>${esc(m.pa)}</strong><span class="cell-sub">${esc(m.pres)}</span></td><td>${esc(m.via)}</td><td>${esc(m.dosis)}</td><td>${esc(m.frecuencia)}</td><td>${m.dias}</td><td>${m.cantidad}</td></tr>`).join('')}</tbody></table></div>` : ''}
        ${t.recom ? `<h3 class="h6">Recomendaciones</h3><p class="small">${esc(t.recom)}</p>` : ''}${t.alarma ? `<div class="alerta-alergia mb-3">⚠ Signos de alarma: ${esc(t.alarma)}</div>` : ''}
        ${ords.length ? `<h3 class="h6">Órdenes de examen de la atención</h3>${ords.map(o => `<div class="small">🧪 ${esc(o.nombre)} · <span class="est-trat est-${o.estado}">${o.estado}</span></div>`).join('')}` : ''}`;
      modal('modalDetalle').show();
    };
    const pdfBtn = (b, t) => { const unlock = SS.lock(b, 'Generando…'); setTimeout(() => { descargarFormula(t); unlock(); SS.toast('Fórmula PDF generada.'); }, 700); };
    $('#btnDetPDF').addEventListener('click', e => pdfBtn(e.currentTarget, tratDe(+e.currentTarget.dataset.id)));

    function abrirCierre(t, acc) {
      sel = t.id; cierreAcc = acc; const susp = acc === 'suspender'; $('#formCierre').classList.remove('was-validated');
      $('#cierreTitulo').textContent = susp ? 'Suspender tratamiento' : 'Finalizar tratamiento'; $('#cierreInfo').innerHTML = `<strong>${formulaNum(t.id)}</strong> · ${esc(pacDe(t.pac).nombre)} · ${esc(medResumen(t))}`;
      $('#cierreLabel').textContent = susp ? 'Motivo de la suspensión *' : 'Motivo de finalización *';
      $('#cierreMotivo').innerHTML = '<option value="">Seleccione…</option>' + (susp ? ['Adversidad', 'Abandono'] : ['Mejoría clínica', 'Adversidad', 'Abandono', 'Fallecimiento']).map(m => `<option>${m}</option>`).join('');
      $('#cierreAviso').classList.add('d-none'); $('#btnConfirmarCierre').className = 'btn btn-' + (susp ? 'warning' : 'success'); modal('modalCierre').show();
    }
    $('#cierreMotivo').addEventListener('change', e => { const av = $('#cierreAviso'); av.classList.toggle('d-none', e.target.value !== 'Fallecimiento'); av.textContent = 'Se registrará el fallecimiento del paciente como motivo de cierre. Verifique antes de confirmar.'; });
    $('#formCierre').addEventListener('submit', e => {
      e.preventDefault(); const f = e.currentTarget, b = $('#btnConfirmarCierre'); if (b.disabled) return; f.classList.add('was-validated'); if (!f.checkValidity()) return; const unlock = SS.lock(b, 'Aplicando…');
      setTimeout(() => { const t = tratDe(sel), ant = t.estado, nuevo = cierreAcc === 'suspender' ? 'Suspendido' : 'Finalizado'; t.estado = nuevo; t.motivo = $('#cierreMotivo').value;
        auditar('tratamiento', t.id, 'Modificación', { estado: ant }, { estado: nuevo, motivo: t.motivo }); guardar(); render(); modal('modalCierre').hide(); unlock(); SS.toast(`Tratamiento ${nuevo.toLowerCase()}.`, 'secondary'); }, 700);
    });

    function abrirAjuste(t) {
      sel = t.id; $('#ajusteErr').classList.add('d-none');
      $('#ajusteBody').innerHTML = t.meds.map((m, i) => `<tr data-i="${i}"><td><strong>${esc(m.pa)}</strong><span class="cell-sub">${esc(m.pres)}</span></td>
        <td><div class="input-group input-group-sm"><input type="number" class="form-control aj-dosis" min="0.25" max="99" step="0.25" value="${m.dosisN}"><span class="input-group-text">${esc(m.unidad)}</span></div></td>
        <td><select class="form-select form-select-sm aj-frec">${FRECS.map(([tx, h]) => `<option value="${h}" ${h === m.frecH ? 'selected' : ''}>${tx}</option>`).join('')}</select></td>
        <td><input type="number" class="form-control form-control-sm aj-dias" min="1" max="365" value="${m.dias}"></td><td class="aj-cant fw-bold">${m.cantidad}</td></tr>`).join('');
      modal('modalAjuste').show();
    }
    $('#ajusteBody').addEventListener('input', recalcAjuste); $('#ajusteBody').addEventListener('change', recalcAjuste);
    function recalcAjuste() { $$('#ajusteBody tr').forEach(tr => { const frec = +$('.aj-frec', tr).value; if (frec === 0) $('.aj-dias', tr).value = 1; $('.aj-dias', tr).disabled = frec === 0; $('.aj-cant', tr).textContent = calcular($('.aj-dosis', tr).value, frec, $('.aj-dias', tr).value).cantidad; }); }
    $('#btnConfirmarAjuste').addEventListener('click', e => {
      const t = tratDe(sel), filas = $$('#ajusteBody tr'), nuevos = [], err = $('#ajusteErr'); let cambios = 0, error = '';
      filas.forEach((tr, i) => { const m = t.meds[i], dosisN = +$('.aj-dosis', tr).value, frecH = +$('.aj-frec', tr).value, dias = +$('.aj-dias', tr).value; if (!(dosisN > 0) || !(dias >= 1)) error = 'Revise las dosis y los días: deben ser mayores a 0.';
        if (dosisN !== m.dosisN || frecH !== m.frecH || dias !== m.dias) cambios++; const c = calcular(dosisN, frecH, dias), tx = medTexto({ dosisN, unidad: m.unidad, frecH }); nuevos.push({ ...m, dosisN, frecH, dias, dosis: tx.dosis, frecuencia: tx.frecuencia, cantidad: c.cantidad, override: false }); });
      if (!error && !cambios) error = 'No hay cambios respecto a la fórmula actual.'; if (error) { err.textContent = '⛔ ' + error; err.classList.remove('d-none'); return; } err.classList.add('d-none');
      const unlock = SS.lock(e.currentTarget, 'Aplicando…');
      setTimeout(() => { const hoy = isoD(HOY), dias = Math.max(...nuevos.map(m => m.dias)), idN = Math.max(0, ...DB.tratamientos.map(x => x.id)) + 1, med = medicoSesion();
        t.estado = 'Finalizado'; t.motivo = 'Ajuste de dosis';
        DB.tratamientos.push({ ...t, id: idN, prof: med ? med.id : t.prof, inicio: hoy, fin: addDias(hoy, dias - 1), estado: 'Activo', motivo: null, meds: nuevos, creada: isoDT(new Date()), ajusteDe: t.id });
        auditar('tratamiento', t.id, 'Modificación', { estado: 'Activo' }, { estado: 'Finalizado', motivo: 'Ajuste de dosis' }); auditar('tratamiento', idN, 'Creación', null, { formula: formulaNum(idN), ajuste_de: formulaNum(t.id) });
        guardar(); render(); modal('modalAjuste').hide(); unlock(); SS.toast(`Dosis ajustada. Nueva fórmula ${formulaNum(idN)}.`); }, 800);
    });

    $('#btnConfirmarReanudar').addEventListener('click', e => { const unlock = SS.lock(e.currentTarget, 'Reanudando…');
      setTimeout(() => { const t = tratDe(sel); t.estado = 'Activo'; t.motivo = null; auditar('tratamiento', t.id, 'Modificación', { estado: 'Suspendido' }, { estado: 'Activo' }); guardar(); render(); modal('modalReanudar').hide(); unlock(); SS.toast('Tratamiento reanudado.'); }, 600); });

    const onAcc = e => { const b = e.target.closest('[data-act]'); if (!b) return; const t = tratDe(+b.dataset.id), a = b.dataset.act;
      if (a === 'ver') detalle(t); else if (a === 'pdf') pdfBtn(b, t); else if (a === 'ajustar') abrirAjuste(t); else if (a === 'suspender' || a === 'finalizar') abrirCierre(t, a);
      else if (a === 'reanudar') { sel = t.id; $('#reanudarCuerpo').innerHTML = `¿Reanudar el tratamiento <strong>${formulaNum(t.id)}</strong> de ${esc(pacDe(t.pac).nombre)}?`; modal('modalReanudar').show(); } };
    $('#tablaVig').addEventListener('click', onAcc); $('#tablaHist').addEventListener('click', onAcc);
    render();
  }

  document.addEventListener('DOMContentLoaded', () => { setInst(); initPrescripcion(); initActivos(); });
})();