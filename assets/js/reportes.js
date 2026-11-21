/* ===== SaludSync · Módulo 14: Reportes y Estadísticas (mockup interactivo, sin backend) ===== */
(function () {
  'use strict';

  /* ---------- Utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const modal = id => bootstrap.Modal.getOrCreateInstance(document.getElementById(id));
  const isoD = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseD = s => new Date(s + 'T00:00:00');
  const HOY = new Date(); HOY.setHours(0, 0, 0, 0);
  const addDias = (iso, n) => { const d = parseD(iso); d.setDate(d.getDate() + n); return isoD(d); };
  const fmtF = s => parseD(s).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtDT = s => { const d = new Date(s); return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const fmtN = n => Math.round(n).toLocaleString('es-CO');
  const fmtD = (n, d = 1) => Number(n).toFixed(d).replace('.', ',');
  const pct = (a, b) => b ? a / b * 100 : 0;
  const leer = k => { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } };
  const COP = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
  const sello = txt => { let h1 = 5381, h2 = 52711; for (const c of txt) { h1 = ((h1 * 33) ^ c.charCodeAt(0)) >>> 0; h2 = ((h2 * 31) ^ c.charCodeAt(0)) >>> 0; } return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).toUpperCase(); };

  /* ---------- Institución, usuario y auditoría ---------- */
  const SES = leer('saludsync_sesion'), M2 = leer('saludsync_modulo2_v1');
  function instActiva() {
    let id = 1; const u = M2 && SES && M2.usuarios.find(x => x.id === SES.id); if (u && u.inst) id = u.inst;
    const nombres = { 1: 'Clínica Santa Lucía S.A.S.', 2: 'IPS Vida Plena Ltda.', 3: 'Centro Médico Los Andes', 5: 'Salud Integral del Caribe IPS' };
    return { id, nombre: nombres[id] || 'Institución #' + id };
  }
  const INST = instActiva(), USUARIO = SES ? SES.nombre : 'Administrador (demo)', USUARIO_ID = SES ? SES.id : 2;
  const setInst = () => $$('[data-inst-nombre]').forEach(e => e.textContent = INST.nombre);
  function auditar(tabla, registro, accion, ant, nuevo) {
    if (!M2 || !M2.auditoria) return; const m2 = leer('saludsync_modulo2_v1');
    m2.auditoria.unshift({ id: Math.max(0, ...m2.auditoria.map(a => a.id)) + 1, usuario: SES ? `${SES.nombre} (${SES.rol})` : 'Administrador (demo)', tabla, registro, accion, ant, nuevo, ip: '192.168.1.10', fecha: `${isoD(new Date())} ${pad(new Date().getHours())}:${pad(new Date().getMinutes())}` });
    try { sessionStorage.setItem('saludsync_modulo2_v1', JSON.stringify(m2)); } catch (e) { }
  }

  /* ---------- Catálogos y conjunto de datos de ejemplo ---------- */
  const ESPS = { 1: 'Medicina General', 2: 'Pediatría', 3: 'Cardiología', 4: 'Ginecología y Obstetricia', 5: 'Odontología', 6: 'Medicina Interna', 8: 'Ortopedia y Traumatología' };
  const SEDES = { 1: 'Sede Principal', 2: 'Sede Cabecera', 3: 'Sede Floridablanca' };
  const CONS = [[1, 1, 'C-101', 'Habilitado', 1], [2, 1, 'C-102', 'Habilitado', 0], [3, 1, 'C-103', 'Habilitado', 1], [4, 1, 'C-201', 'Habilitado', 0], [5, 1, 'C-202', 'Habilitado', 0], [6, 2, 'C-101', 'Habilitado', 1], [7, 2, 'C-102', 'Habilitado', 0],
    [8, 2, 'C-103', 'En Mantenimiento', 0], [9, 3, 'C-101', 'Habilitado', 1], [10, 3, 'C-102', 'Habilitado', 0], [11, 3, 'C-103', 'Inactivo', 0]].map(([id, sede, codigo, estado, sab]) => ({ id, sede, codigo, estado, sab }));
  // profesional: [nombre, especialidad, sede, consultorio]
  const PROFD = { 1: ['Andrés Navarro Díaz', 1, 1, 1], 2: ['Paula Rueda Mantilla', 2, 1, 2], 3: ['Mauricio Ariza Gómez', 3, 2, 6], 4: ['Liliana Cortés Vargas', 4, 1, 4], 5: ['Iván Suárez Pinto', 5, 1, 3], 6: ['Marcela Quintero Ardila', 6, 2, 7],
    7: ['Camilo Ortega Rey', 8, 3, 9], 9: ['Sofía Bermúdez Luna', 1, 1, 5], 10: ['Diana Cifuentes Mora', 4, 3, 10] };
  // turnos: días (0=lun … 5=sáb), horas, duración de la cita y ocupación esperada
  const TURNOS = [{ p: 1, d: [0, 1, 2, 3, 4], i: 7, f: 12, dur: 30, oc: .85 }, { p: 2, d: [1, 3], i: 8, f: 17, dur: 20, oc: .8 }, { p: 3, d: [2], i: 9, f: 13, dur: 45, oc: .7 }, { p: 3, d: [3], i: 14, f: 18, dur: 45, oc: .7 },
    { p: 4, d: [0, 1, 3], i: 14, f: 18, dur: 30, oc: .75 }, { p: 5, d: [0, 1, 2, 3, 4], i: 8, f: 16, dur: 40, oc: .65 }, { p: 6, d: [0, 2, 4], i: 14, f: 18, dur: 30, oc: .7 }, { p: 7, d: [0, 1, 2, 3, 4], i: 8, f: 12, dur: 30, oc: .78 },
    { p: 9, d: [0, 2, 4], i: 8, f: 13, dur: 30, oc: .72 }, { p: 10, d: [2], i: 14, f: 18, dur: 30, oc: .6 }];
  const DXW = { 1: [['J06.9', 25], ['I10', 15], ['M54.5', 12], ['R51', 8], ['A09', 8], ['K29.7', 6], ['N39.0', 6], ['Z00.0', 10], ['E11.9', 5], ['J02.9', 5]], 2: [['J06.9', 30], ['R50.9', 18], ['Z00.1', 20], ['Z23', 12], ['A09', 10], ['J20.9', 10]],
    3: [['I10', 45], ['I25.9', 20], ['I50.9', 10], ['E78.5', 15], ['R42', 10]], 4: [['N76.0', 25], ['N92.0', 20], ['Z34.9', 30], ['Z30.0', 15], ['N39.0', 10]], 5: [['K02.9', 55], ['K05.1', 30], ['Z00.0', 15]],
    6: [['E11.9', 30], ['I10', 25], ['E78.5', 15], ['E66.9', 15], ['E03.9', 10], ['D64.9', 5]], 8: [['M54.5', 30], ['M17.9', 25], ['S93.4', 20], ['M25.5', 15], ['M19.9', 10]] };
  const CIE = { 'J06.9': 'Infección aguda de las vías respiratorias superiores', 'I10': 'Hipertensión esencial (primaria)', 'M54.5': 'Lumbago no especificado', 'R51': 'Cefalea', 'A09': 'Diarrea y gastroenteritis de presunto origen infeccioso', 'K29.7': 'Gastritis, no especificada',
    'N39.0': 'Infección de vías urinarias', 'Z00.0': 'Examen médico general', 'E11.9': 'Diabetes mellitus tipo 2 sin complicaciones', 'J02.9': 'Faringitis aguda', 'R50.9': 'Fiebre, no especificada', 'Z00.1': 'Control de salud de rutina del niño',
    'Z23': 'Inmunización contra enfermedad bacteriana', 'J20.9': 'Bronquitis aguda', 'I25.9': 'Enfermedad isquémica crónica del corazón', 'I50.9': 'Insuficiencia cardíaca', 'E78.5': 'Hiperlipidemia', 'R42': 'Mareo y desvanecimiento',
    'N76.0': 'Vaginitis aguda', 'N92.0': 'Menstruación excesiva y frecuente', 'Z34.9': 'Supervisión de embarazo normal', 'Z30.0': 'Asesoramiento sobre anticoncepción', 'K02.9': 'Caries dental', 'K05.1': 'Gingivitis crónica',
    'E66.9': 'Obesidad, no especificada', 'E03.9': 'Hipotiroidismo', 'D64.9': 'Anemia, no especificada', 'M17.9': 'Gonartrosis, no especificada', 'S93.4': 'Esguince y torcedura del tobillo', 'M25.5': 'Dolor en articulación', 'M19.9': 'Artrosis, no especificada' };
  const OP_BIAS = { 1: 0, 2: 0, 3: 6, 4: 3, 5: 0, 6: 3, 8: 4 };
  const PAC = [[1, '1100234567', 'Ana Lucía Torres Gil', '1991-04-12', 'F'], [2, '91234501', 'Carlos Eduardo Mendoza Ruiz', '1978-09-03', 'M'], [3, '1034567890', 'Valentina Rojas Mejía', '2010-02-20', 'F'], [4, '1098123456', 'Samuel Ortega Plata', '2022-06-15', 'M'],
    [5, '37890456', 'Rosa Elena Barrios Núñez', '1955-11-30', 'F'], [6, '5601234', 'Juan José Martínez Pérez', '1989-01-17', 'M'], [7, '5870023', 'Daniela Gómez Castro', '1996-07-08', 'F'], [8, '13789012', 'Héctor Fabio Lozano Vega', '1967-03-25', 'M'],
    [9, '63890123', 'Natalia Cárdenas Rueda', '1985-12-02', 'F'], [10, '1102345678', 'Santiago Arias Calderón', '2008-10-05', 'M'], [11, '4567890', 'Luisa Fernanda Herrera Díaz', '1993-05-19', 'F'], [12, 'AB123456', 'Michael Anderson', '1974-08-11', 'M']]
    .map(([id, doc, nombre, nac, sexo]) => ({ id, doc, nombre, nac, sexo }));
  const edadDe = nac => { const n = parseD(nac); let a = HOY.getFullYear() - n.getFullYear(); const m = HOY.getMonth() - n.getMonth(); if (m < 0 || (m === 0 && HOY.getDate() < n.getDate())) a--; return a; };
  const grupoEtario = a => a < 5 ? '0-4' : a < 18 ? '5-17' : a < 60 ? '18-59' : '60+';
  const anonId = id => 'PAC-' + sello('paciente' + id + 'salt-ss').slice(0, 6);

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function generarDataset() {
    const R = rng(20260901), citas = [], jornadas = []; let id = 1; const nm = new Date().getHours() * 60 + new Date().getMinutes();
    const pick = lista => { const tot = lista.reduce((a, x) => a + x[1], 0); let r = R() * tot; for (const [c, w] of lista) { r -= w; if (r <= 0) return c; } return lista[0][0]; };
    for (let back = 179; back >= 0; back--) {
      const d = new Date(HOY); d.setDate(d.getDate() - back); const dow = (d.getDay() + 6) % 7; if (dow === 6) continue; const f = isoD(d);
      TURNOS.forEach(t => {
        if (!t.d.includes(dow)) return; const [, esp, sede, cons] = PROFD[t.p]; if (R() < .04) return; // ausencia del profesional
        jornadas.push({ f, p: t.p, h: t.f - t.i });
        for (let m = t.i * 60; m + t.dur <= t.f * 60; m += t.dur) {
          if (R() > t.oc) continue; let e;
          if (back === 0) e = m + t.dur <= nm ? (R() < .85 ? 'A' : 'I') : 'P'; else { const r = R(), pi = .1 + (t.p % 3) * .02; e = r < 1 - pi - .08 ? 'A' : r < 1 - .08 ? 'I' : 'C'; }
          const rt = R(), r2 = R(), pac = PAC[Math.floor(R() * PAC.length)];
          citas.push({ id: id++, f, h: `${pad(Math.floor(m / 60))}:${pad(m % 60)}`, p: t.p, esp, sede, cons, e, tipo: rt < .35 ? 0 : rt < .85 ? 1 : 2, op: 1 + Math.floor(r2 * r2 * 18) + OP_BIAS[esp], pac: pac.id, dx: e === 'A' ? pick(DXW[esp]) : null, dur: t.dur });
        }
      });
    }
    return { citas, jornadas };
  }
  const DS = generarDataset();
  const TIPOS = ['Primera vez', 'Control', 'Valoración'], EST = { A: 'Atendida', I: 'Inasistencia', C: 'Cancelada', P: 'Programada' };

  /* ---------- Cálculos ---------- */
  const filtrarCitas = fl => DS.citas.filter(c => c.f >= fl.desde && c.f <= fl.hasta && (!fl.esp || c.esp === +fl.esp) && (!fl.sede || c.sede === +fl.sede));
  function metricas(fl) {
    const cs = filtrarCitas(fl), at = cs.filter(c => c.e === 'A'), ia = cs.filter(c => c.e === 'I'), cuenta = {}; at.forEach(c => cuenta[c.dx] = (cuenta[c.dx] || 0) + 1);
    const top = Object.entries(cuenta).sort((a, b) => b[1] - a[1]), tasa = pct(ia.length, at.length + ia.length), op = at.length ? at.reduce((a, c) => a + c.op, 0) / at.length : 0;
    const porEsp = Object.keys(ESPS).map(e => { const a = at.filter(c => c.esp === +e), i = ia.filter(c => c.esp === +e); return { esp: +e, nombre: ESPS[e], atenciones: a.length, inas: i.length, tasa: pct(i.length, a.length + i.length), op: a.length ? a.reduce((s, c) => s + c.op, 0) / a.length : 0 }; }).filter(x => x.atenciones || x.inas).sort((a, b) => b.atenciones - a.atenciones);
    const semanas = {}; at.forEach(c => { const d = parseD(c.f), lun = new Date(d); lun.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const k = isoD(lun); semanas[k] = (semanas[k] || 0) + 1; });
    return { cs, at, ia, top, tasa, op, porEsp, semanas: Object.entries(semanas).sort(), estados: { A: at.length, I: ia.length, C: cs.filter(c => c.e === 'C').length, P: cs.filter(c => c.e === 'P').length } };
  }
  const periodoPrevio = fl => { const n = Math.round((parseD(fl.hasta) - parseD(fl.desde)) / 864e5) + 1; return { ...fl, desde: addDias(fl.desde, -n), hasta: addDias(fl.desde, -1) }; };
  function adminCalc(fl) {
    const jor = DS.jornadas.filter(j => j.f >= fl.desde && j.f <= fl.hasta && (!fl.sede || PROFD[j.p][2] === +fl.sede)), cs = filtrarCitas({ desde: fl.desde, hasta: fl.hasta, esp: '', sede: fl.sede });
    const prof = Object.keys(PROFD).map(p => { const hp = jor.filter(j => j.p === +p).reduce((a, j) => a + j.h, 0), at = cs.filter(c => c.p === +p && c.e === 'A'), he = at.reduce((a, c) => a + c.dur / 60, 0), ia = cs.filter(c => c.p === +p && c.e === 'I').length;
      return { p: +p, nombre: PROFD[p][0], esp: ESPS[PROFD[p][1]], hp, he, prod: pct(he, hp), at: at.length, ia }; }).filter(x => x.hp > 0).sort((a, b) => b.prod - a.prod);
    let dias = 0, sabados = 0; for (let d = parseD(fl.desde); d <= parseD(fl.hasta); d.setDate(d.getDate() + 1)) { const dow = (d.getDay() + 6) % 7; if (dow < 5) dias++; else if (dow === 5) sabados++; }
    const cons = CONS.filter(c => !fl.sede || c.sede === +fl.sede).map(c => { const cap = c.estado === 'Habilitado' ? dias * 11 + (c.sab ? sabados * 5 : 0) : 0, profsC = Object.keys(PROFD).filter(p => PROFD[p][3] === c.id).map(Number);
      const asig = jor.filter(j => profsC.includes(j.p)).reduce((a, j) => a + j.h, 0), ej = cs.filter(x => x.cons === c.id && x.e === 'A').reduce((a, x) => a + x.dur / 60, 0); return { ...c, sedeN: SEDES[c.sede], cap, asig, ej, ocup: pct(asig, cap), uso: pct(ej, cap) }; });
    const hp = prof.reduce((a, x) => a + x.hp, 0), he = prof.reduce((a, x) => a + x.he, 0), capT = cons.reduce((a, x) => a + x.cap, 0), asT = cons.reduce((a, x) => a + x.asig, 0);
    return { prof, cons, hp, he, prodGlobal: pct(he, hp), ocupGlobal: pct(asT, capT) };
  }
  // Suscripción y facturación SaaS (Módulo 1 o semillas)
  function saasData() {
    const M1 = leer('saludsync_modulo1_v1'), M3 = leer('saludsync_modulo3_v1'), M4 = leer('saludsync_modulo4_v1');
    const planes = (M1 && M1.planes) || [{ id: 1, nombre: 'Básico', tarifa: 350000, medicos: 5, pacientes: 500, modulos: new Array(6) }, { id: 2, nombre: 'Profesional', tarifa: 890000, medicos: 20, pacientes: 5000, modulos: new Array(12) }, { id: 3, nombre: 'Empresarial', tarifa: 2100000, medicos: 100, pacientes: 50000, modulos: new Array(15) }];
    const sus = (M1 && M1.suscripciones && M1.suscripciones.find(s => s.inst === INST.id)) || { plan: 2, inicio: addDias(isoD(HOY), -270), corte: addDias(isoD(HOY), 95) }, plan = planes.find(p => p.id === sus.plan) || planes[1];
    const facts = []; for (let i = 5; i >= 0; i--) { const em = addDias(isoD(HOY), -i * 30 - 3); facts.push({ numero: `FS-${parseD(em).getFullYear()}-${String(210 - i).padStart(4, '0')}`, emision: em, vence: addDias(em, 15), total: Math.round(plan.tarifa * 1.19), estado: i === 0 ? 'Pendiente' : (i === 3 ? 'Mora' : 'Pagada') }); }
    facts[2].estado = 'Pagada'; // la mora se regularizó
    return { plan, sus, facts, medicos: (M4 && M4.profesionales ? M4.profesionales.filter(p => p.estado === 'Activo').length : 9), pacientes: (M3 && M3.pacientes ? M3.pacientes.filter(p => p.estado === 'Activo').length : 10), modulos: plan.modulos.length };
  }

  /* ---------- Generador de PDF (sin librerías) ---------- */
  function crearPDF() {
    const W = 595, H = 842, pages = []; let cur = null;
    const enc = s => String(s).replace(/[–—]/g, '-').replace(/[·•]/g, '-').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/₂/g, '2').replace(/[^\x20-\xFF]/g, '?').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    const col = c => c.map(v => v.toFixed(3)).join(' ');
    return { W, H, nueva() { cur = []; pages.push(cur); }, texto(x, y, s, f = 'F1', size = 10, c = [0, 0, 0]) { cur.push(`BT /${f} ${size} Tf ${col(c)} rg ${x.toFixed(1)} ${(H - y).toFixed(1)} Td (${enc(s)}) Tj ET`); },
      rect(x, y, w, h, c) { cur.push(`${col(c)} rg ${x.toFixed(1)} ${(H - y - h).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f`); }, linea(x1, y1, x2, y2, c = [.8, .8, .8], w = .6) { cur.push(`${col(c)} RG ${w} w ${x1} ${H - y1} m ${x2} ${H - y2} l S`); },
      construir() {
        const objs = []; objs[1] = '<< /Type /Catalog /Pages 2 0 R >>'; objs[2] = `<< /Type /Pages /Kids [${pages.map((_, i) => `${6 + i * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`;
        objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'; objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'; objs[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>';
        pages.forEach((p, i) => { const content = p.join('\n'); objs[6 + i * 2] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${7 + i * 2} 0 R >>`; objs[7 + i * 2] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`; });
        let out = '%PDF-1.4\n'; const off = []; for (let i = 1; i < objs.length; i++) { off[i] = out.length; out += `${i} 0 obj\n${objs[i]}\nendobj\n`; }
        const xr = out.length; out += `xref\n0 ${objs.length}\n0000000000 65535 f \n`; for (let i = 1; i < objs.length; i++) out += String(off[i]).padStart(10, '0') + ' 00000 n \n';
        out += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`; return new Blob([Uint8Array.from(out, c => c.charCodeAt(0) & 255)], { type: 'application/pdf' });
      } };
  }
  // cfg: {titulo, filtros:[], anon:boolean|null, kpis:[[etiqueta,valor]], tablas:[{titulo, cols:[{t,w,a}], rows:[[..]]}], pie}
  function armarPDF(cfg) {
    const pdf = crearPDF(), azul = [.043, .361, .671], gris = [.4, .45, .5]; let y = 0, nPag = 0; const cut = (s, w, sz) => String(s ?? '').slice(0, Math.max(3, Math.floor(w / (sz * .5))));
    const head = cont => { pdf.nueva(); nPag++; pdf.rect(0, 0, pdf.W, 62, azul); pdf.texto(40, 30, 'SaludSync', 'F2', 19, [1, 1, 1]); pdf.texto(40, 49, cfg.titulo + (cont ? ' (continuación)' : ''), 'F1', 10.5, [1, 1, 1]); pdf.texto(430, 30, fmtF(isoD(new Date())), 'F2', 10, [1, 1, 1]); pdf.texto(430, 49, 'Pág. ' + nPag, 'F1', 9, [1, 1, 1]); y = 84; };
    const asegurar = h => { if (y + h > 800) head(true); };
    head(false); pdf.texto(40, y, INST.nombre, 'F2', 11.5, azul); y += 15; cfg.filtros.forEach(l => { pdf.texto(40, y, l, 'F1', 9, gris); y += 12; });
    if (cfg.anon !== null && cfg.anon !== undefined) { y += 2; pdf.rect(40, y, 515, 18, cfg.anon ? [.9, .97, .93] : [.99, .92, .92]); pdf.texto(48, y + 12, cfg.anon ? 'DATOS ANONIMIZADOS: sin identificadores personales; conteos menores a 5 suprimidos.' : 'ATENCION: contiene datos personales de salud - uso restringido (Ley 1581 de 2012).', 'F2', 8.5, cfg.anon ? [.08, .46, .33] : [.75, .22, .17]); y += 28; } else y += 8;
    if (cfg.kpis && cfg.kpis.length) { const w = 515 / cfg.kpis.length; cfg.kpis.forEach(([l, v], i) => { pdf.rect(40 + i * w + 2, y, w - 4, 46, [.94, .96, .98]); pdf.texto(40 + i * w + 8, y + 20, cut(v, w - 14, 15), 'F2', 15, azul); pdf.texto(40 + i * w + 8, y + 36, cut(l, w - 14, 7.5), 'F1', 7.5, gris); }); y += 62; }
    cfg.tablas.forEach(t => {
      asegurar(50); pdf.texto(40, y, t.titulo, 'F2', 11, azul); y += 8; const tot = t.cols.reduce((a, c) => a + c.w, 0), esc_ = 515 / tot, cols = t.cols.map(c => ({ ...c, w: c.w * esc_ }));
      const fila = (vals, negrita, fondo) => { asegurar(16); if (fondo) pdf.rect(40, y, 515, 16, fondo); let x = 40; cols.forEach((c, i) => { pdf.texto(x + 4, y + 11, cut(vals[i], c.w - 6, 8), negrita ? 'F2' : 'F1', 8); x += c.w; }); y += 16; if (!fondo) pdf.linea(40, y, 555, y, [.88, .9, .93], .4); };
      fila(t.cols.map(c => c.t), true, [.88, .93, .98]); t.rows.forEach(r => fila(r, false, null)); y += 14; });
    if (cfg.pie) { asegurar(30); pdf.texto(40, y, cfg.pie, 'F3', 8, gris); }
    return pdf.construir();
  }
  const descargar = (blob, nombre) => { const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); };
  const descargarCSV = (nombre, cols, rows) => descargar(new Blob(['\ufeff' + [cols, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }), nombre);

  /* ---------- Registro de reportes generados (reporte_generado) y job asíncrono ---------- */
  const KEY = 'saludsync_modulo14_v1';
  const SEED_REP = () => { const d = (n, h) => { const x = new Date(); x.setDate(x.getDate() - n); x.setHours(h, 12); return x.toISOString(); }, f = (a, b) => JSON.stringify({ desde: addDias(isoD(HOY), -a), hasta: addDias(isoD(HOY), -b), especialidad: '', sede: '' });
    return [{ id: 4, tipo: 'Facturación SaaS', parametros: f(180, 0), formato: 'PDF', anon: 0, usuario: 'Administrador (demo)', fecha: d(2, 16) }, { id: 3, tipo: 'Epidemiológico CIE-10', parametros: f(90, 0), formato: 'Excel/CSV', anon: 1, usuario: 'Administrador (demo)', fecha: d(6, 10) },
      { id: 2, tipo: 'Productividad Médica', parametros: f(60, 30), formato: 'Excel/CSV', anon: 0, usuario: 'Administrador (demo)', fecha: d(12, 9) }, { id: 1, tipo: 'Volumen Atenciones', parametros: f(30, 0), formato: 'PDF', anon: 1, usuario: 'Administrador (demo)', fecha: d(20, 15) }]; };
  const DB = (() => { const s = leer(KEY); return s && s.reportes ? s : { reportes: SEED_REP() }; })();
  const guardar = () => { try { sessionStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } };
  function correrJob(titulo, pasos) {
    return new Promise(res => { $('#jobTitulo').textContent = titulo; $('#jobBarra').style.width = '0%'; $('#jobPaso').textContent = pasos[0]; modal('modalJob').show(); let p = 0;
      const iv = setInterval(() => { p = Math.min(100, p + 7 + Math.random() * 9); $('#jobBarra').style.width = p + '%'; $('#jobPaso').textContent = pasos[Math.min(pasos.length - 1, Math.floor(p / 100 * pasos.length))]; if (p >= 100) { clearInterval(iv); setTimeout(() => { modal('modalJob').hide(); setTimeout(res, 350); }, 300); } }, 170); });
  }
  function registrar(tipo, params, formato, anon) {
    const r = { id: Math.max(0, ...DB.reportes.map(x => x.id)) + 1, tipo, parametros: JSON.stringify(params), formato, anon: anon ? 1 : 0, usuario: USUARIO, fecha: new Date().toISOString() }; DB.reportes.push(r); guardar();
    auditar('reporte_generado', r.id, 'Creación', null, { tipo, formato, datos_anonimizados: r.anon }); return r;
  }
  function tablaHistorial(tiposPermitidos, alRegenerar) {
    let pagina = 1; const TAM = 5;
    const render = () => { const lista = DB.reportes.filter(r => tiposPermitidos.includes(r.tipo)).sort((a, b) => b.fecha.localeCompare(a.fecha)), paginas = Math.max(1, Math.ceil(lista.length / TAM)); if (pagina > paginas) pagina = paginas; const vista = lista.slice((pagina - 1) * TAM, pagina * TAM);
      $('#tablaReportes').innerHTML = vista.length ? vista.map(r => `<tr><td>${fmtDT(r.fecha)}</td><td><strong>${esc(r.tipo)}</strong></td><td>${r.formato === 'PDF' ? '📕' : '📗'} ${esc(r.formato)}</td><td><span class="badge ${r.anon ? 'badge-anon' : 'badge-nanon'}">${r.anon ? 'Anonimizados' : 'Identificables'}</span></td><td class="json-mini">${esc(r.parametros)}</td><td>${esc(r.usuario)}</td>
        <td class="text-end"><button class="btn btn-sm btn-outline-primary" data-id="${r.id}" title="Volver a generar con los mismos filtros">🔄 Regenerar</button></td></tr>`).join('') : '<tr><td colspan="7" class="text-center text-muted py-4">Aún no hay reportes generados.</td></tr>';
      let pg = `<li class="page-item ${pagina === 1 ? 'disabled' : ''}"><button class="page-link" data-p="${pagina - 1}">«</button></li>`; for (let k = 1; k <= paginas; k++) pg += `<li class="page-item ${k === pagina ? 'active' : ''}"><button class="page-link" data-p="${k}">${k}</button></li>`; pg += `<li class="page-item ${pagina === paginas ? 'disabled' : ''}"><button class="page-link" data-p="${pagina + 1}">»</button></li>`; $('#paginacion').innerHTML = pg; };
    $('#paginacion').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b && !b.parentElement.classList.contains('disabled')) { pagina = +b.dataset.p; render(); } });
    $('#tablaReportes').addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) alRegenerar(DB.reportes.find(r => r.id === +b.dataset.id), b); });
    render(); return render;
  }
  const presets = (aplicar) => $$('.preset [data-d]').forEach(b => b.addEventListener('click', () => { $$('.preset .btn').forEach(x => x.classList.toggle('active', x === b)); aplicar(+b.dataset.d); }));

  /* =====================================================
     PANTALLA 14.1 · Reportes asistenciales
     ===================================================== */
  function initAsistenciales() {
    if (document.body.dataset.page !== 'reportes_asistenciales') return;
    $('#fEsp').innerHTML = '<option value="">Todas</option>' + Object.entries(ESPS).map(([id, n]) => `<option value="${id}">${esc(n)}</option>`).join(''); $('#fSede').innerHTML = '<option value="">Todas</option>' + Object.entries(SEDES).map(([id, n]) => `<option value="${id}">${esc(n)}</option>`).join('');
    const setRango = n => { $('#fHasta').value = isoD(HOY); $('#fDesde').value = addDias(isoD(HOY), -(n - 1)); }; setRango(30); presets(n => { setRango(n); render(); });
    const filtros = () => ({ desde: $('#fDesde').value, hasta: $('#fHasta').value, esp: $('#fEsp').value, sede: $('#fSede').value });
    const validar = fl => { const e = $('#errFiltros'); let msg = ''; if (!fl.desde || !fl.hasta) msg = 'Indique el rango de fechas.'; else if (fl.desde > fl.hasta) msg = 'La fecha inicial no puede ser posterior a la final.'; else if (fl.hasta > isoD(HOY)) msg = 'La fecha final no puede ser futura.'; else if (Math.round((parseD(fl.hasta) - parseD(fl.desde)) / 864e5) > 179) msg = 'El rango máximo es de 180 días.';
      e.textContent = msg; e.classList.toggle('d-none', !msg); return !msg; };
    const delta = (actual, previo, mejorSube, dec = 0, unidad = '') => { if (!previo) return '<span class="delta neutro">sin periodo previo</span>'; const d = (actual - previo) / previo * 100, sube = d >= 0, bien = mejorSube ? sube : !sube; return `<span class="delta ${Math.abs(d) < .5 ? 'neutro' : bien ? 'bien' : 'mal'}">${sube ? '▲' : '▼'} ${fmtD(Math.abs(d), 1)} %</span> <span class="kpi-s">vs. periodo anterior</span>`; };

    function render() {
      const fl = filtros(); if (!validar(fl)) return; const m = metricas(fl), pv = metricas(periodoPrevio(fl)), topCod = m.top[0];
      $('#kpis').innerHTML = [
        ['Total de atenciones', fmtN(m.at.length), '', delta(m.at.length, pv.at.length, true), ''],
        ['Diagnóstico principal más frecuente', topCod ? topCod[0] : '—', 'k-green', topCod ? `<span class="kpi-s">${esc(CIE[topCod[0]] || '')} · ${fmtD(pct(topCod[1], m.at.length))} % de las atenciones</span>` : '', ''],
        ['Tasa de inasistencia', fmtD(m.tasa) + '<small> %</small>', m.tasa > 14 ? 'k-red' : m.tasa > 10 ? 'k-warn' : 'k-green', delta(m.tasa, pv.tasa, false), ''],
        ['Oportunidad promedio', fmtD(m.op) + '<small> días</small>', m.op > 10 ? 'k-warn' : 'k-green', delta(m.op, pv.op, false), '']]
        .map(([t, v, k, s]) => `<div class="col-6 col-lg-3"><div class="kpi-rep ${k}"><div class="kpi-t">${t}</div><div class="kpi-v">${v}</div><div>${s}</div></div></div>`).join('');
      // Top 5
      const mx = m.top[0] ? m.top[0][1] : 1; $('#topDx').innerHTML = m.top.slice(0, 5).map(([c, n], i) => `<div class="hbar"><div class="hbar-top"><span><span class="cie">${esc(c)}</span>${esc(CIE[c] || '')}</span><strong>${fmtN(n)} <small class="text-muted">(${fmtD(pct(n, m.at.length))} %)</small></strong></div><div class="hbar-track"><div class="hbar-fill r${i + 1}" style="width:${pct(n, mx)}%"></div></div></div>`).join('') || '<p class="text-muted mb-0">Sin diagnósticos en el periodo.</p>';
      // Donut de estados
      const cols = { A: '#1c9a6c', I: '#d9534f', C: '#9aa6b2', P: '#0b5cab' }, tot = Object.values(m.estados).reduce((a, b) => a + b, 0), R_ = 54, C_ = 2 * Math.PI * R_; let acc = 0;
      $('#donut').innerHTML = `<svg viewBox="0 0 140 140" role="img" aria-label="Estado de las citas"><circle cx="70" cy="70" r="${R_}" fill="none" stroke="#e9eef3" stroke-width="18"/>${Object.entries(m.estados).filter(([, v]) => v).map(([k, v]) => { const len = v / tot * C_, s = `<circle cx="70" cy="70" r="${R_}" fill="none" stroke="${cols[k]}" stroke-width="18" stroke-dasharray="${len} ${C_ - len}" stroke-dashoffset="${-acc}" transform="rotate(-90 70 70)"/>`; acc += len; return s; }).join('')}<text x="70" y="70" text-anchor="middle" class="donut-centro">${fmtN(tot)}</text><text x="70" y="84" text-anchor="middle" class="donut-sub">citas</text></svg>`;
      $('#donutLeg').innerHTML = Object.entries(m.estados).map(([k, v]) => `<li><span class="sw" style="background:${cols[k]}"></span>${EST[k]}: <strong>${fmtN(v)}</strong> <small class="text-muted">(${fmtD(pct(v, tot))} %)</small></li>`).join('');
      // Tendencia semanal (SVG)
      const sem = m.semanas, W = 620, H = 200, pl = 34, pb = 26, pt = 14, max = Math.max(1, ...sem.map(s => s[1])), bw = sem.length ? Math.min(46, (W - pl - 10) / sem.length - 8) : 30, paso = (W - pl - 10) / Math.max(1, sem.length);
      $('#tendencia').innerHTML = sem.length ? `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Atenciones por semana">${[0, .5, 1].map(f => { const yy = pt + (H - pt - pb) * (1 - f); return `<line class="svg-grid" x1="${pl}" x2="${W - 6}" y1="${yy}" y2="${yy}"/><text class="svg-txt" x="${pl - 5}" y="${yy + 3}" text-anchor="end">${fmtN(max * f)}</text>`; }).join('')}
        ${sem.map(([k, v], i) => { const h = (H - pt - pb) * v / max, x = pl + i * paso + (paso - bw) / 2, y = H - pb - h; return `<g><rect class="svg-bar" x="${x}" y="${y}" width="${bw}" height="${h}" rx="4"><title>Semana del ${fmtF(k)}: ${v} atenciones</title></rect><text class="svg-val" x="${x + bw / 2}" y="${y - 3}" text-anchor="middle">${v}</text><text class="svg-txt" x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${parseD(k).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</text></g>`; }).join('')}</svg>` : '<p class="text-muted mb-0">Sin atenciones en el periodo.</p>';
      // Tabla por especialidad
      $('#tablaEsp').innerHTML = m.porEsp.length ? m.porEsp.map(e => { const cl = e.tasa > 14 ? 'rojo' : e.tasa > 10 ? 'ambar' : 'verde'; return `<tr><td><strong>${esc(e.nombre)}</strong></td><td>${fmtN(e.atenciones)}</td><td><div class="d-flex align-items-center gap-2"><div class="mini-bar flex-grow-1"><span style="width:${pct(e.atenciones, m.at.length)}%"></span></div><small>${fmtD(pct(e.atenciones, m.at.length))} %</small></div></td><td>${fmtN(e.inas)}</td><td><span class="pct-txt ${cl}">${fmtD(e.tasa)} %</span></td><td>${fmtD(e.op)}</td></tr>`; }).join('') : '<tr><td colspan="6" class="text-center text-muted py-3">Sin datos para los filtros seleccionados.</td></tr>';
      return m;
    }
    $('#btnGenerar').addEventListener('click', async e => { const fl = filtros(); if (!validar(fl)) return; const unlock = SS.lock(e.currentTarget, 'Generando…'); await correrJob('Generando reporte…', ['Consultando atenciones…', 'Calculando indicadores…', 'Construyendo gráficos…']); render(); unlock(); SS.toast('Reporte generado correctamente.'); });

    /* Exportación con anonimización (RF-REP-01 / RF-REP-02) */
    const anonForzada = () => $('#tipoRep').value === 'Epidemiológico CIE-10';
    function actualizarAnon() { const f = anonForzada(); if (f) $('#chkAnon').checked = true; $('#chkAnon').disabled = f; const on = $('#chkAnon').checked;
      $('#anonInfo').className = 'anon-box' + (on ? '' : ' off'); $('#anonInfo').innerHTML = on ? '🛡️ Se omiten nombre y documento (se usa un código seudónimo), la edad se agrupa por rangos y los conteos menores a 5 se suprimen.' : '⚠ El archivo incluirá nombre y documento del paciente. Úselo solo con autorización y custodia adecuada.';
      $('#bloqueAutoriza').classList.toggle('d-none', on); $('#ayudaTipo').textContent = f ? 'El reporte epidemiológico siempre se exporta anonimizado (solo datos estadísticos).' : ({ 'Volumen Atenciones': 'Detalle de atenciones del periodo.', 'Inasistencias': 'Citas con inasistencia (No-Show) del periodo.' })[$('#tipoRep').value]; }
    $('#tipoRep').addEventListener('change', actualizarAnon); $('#chkAnon').addEventListener('change', actualizarAnon); actualizarAnon();

    function construir(tipo, fl, anon, m) {
      const nom = id => anon ? anonId(id) : PAC.find(p => p.id === id).nombre, doc = id => anon ? '—' : PAC.find(p => p.id === id).doc, edad = id => { const a = edadDe(PAC.find(p => p.id === id).nac); return anon ? grupoEtario(a) : a; };
      const filtroTxt = [`Periodo: ${fmtF(fl.desde)} a ${fmtF(fl.hasta)}`, `Especialidad: ${fl.esp ? ESPS[fl.esp] : 'Todas'}   ·   Sede: ${fl.sede ? SEDES[fl.sede] : 'Todas'}`, `Generado por: ${USUARIO}   ·   Tipo: ${tipo}`];
      const kpis = [['Atenciones', fmtN(m.at.length)], ['Dx frecuente', m.top[0] ? m.top[0][0] : '-'], ['Inasistencia', fmtD(m.tasa) + ' %'], ['Oportunidad', fmtD(m.op) + ' d']];
      const supr = n => anon && n < 5 ? '<5' : String(n);
      if (tipo === 'Epidemiológico CIE-10') {
        const filas = m.top.map(([c]) => { const a = m.at.filter(x => x.dx === c), sx = s => a.filter(x => PAC.find(p => p.id === x.pac).sexo === s).length, ed = g => a.filter(x => grupoEtario(edadDe(PAC.find(p => p.id === x.pac).nac)) === g).length;
          return [c, CIE[c] || '', supr(a.length), supr(sx('M')), supr(sx('F')), supr(ed('0-4')), supr(ed('5-17')), supr(ed('18-59')), supr(ed('60+'))]; });
        const cols = ['cie10', 'descripcion', 'total', 'hombres', 'mujeres', 'edad_0_4', 'edad_5_17', 'edad_18_59', 'edad_60_mas'];
        return { cols, rows: filas, pdf: { titulo: 'Reporte epidemiológico CIE-10 (morbilidad)', filtros: filtroTxt, anon, kpis, tablas: [{ titulo: 'Morbilidad por diagnóstico principal', cols: [{ t: 'CIE-10', w: 42 }, { t: 'Descripción', w: 170 }, { t: 'Total', w: 36 }, { t: 'Hombres', w: 46 }, { t: 'Mujeres', w: 46 }, { t: '0-4', w: 30 }, { t: '5-17', w: 32 }, { t: '18-59', w: 36 }, { t: '60+', w: 30 }], rows: filas }], pie: 'Conteos menores a 5 suprimidos para evitar reidentificación (anonimización).' } };
      }
      const base = tipo === 'Inasistencias' ? m.ia : m.cs.filter(c => c.e !== 'P'), cols = ['id_cita', 'fecha', 'hora', 'sede', 'especialidad', 'profesional', 'tipo_consulta', 'estado', 'oportunidad_dias', 'paciente', 'documento', 'edad_o_rango'];
      const rows = base.map(c => [c.id, c.f, c.h, SEDES[c.sede], ESPS[c.esp], PROFD[c.p][0], TIPOS[c.tipo], EST[c.e], c.op, nom(c.pac), doc(c.pac), edad(c.pac)]);
      const resumen = m.porEsp.map(e => [e.nombre, fmtN(e.atenciones), fmtN(e.inas), fmtD(e.tasa) + ' %', fmtD(e.op)]);
      return { cols, rows, pdf: { titulo: tipo === 'Inasistencias' ? 'Reporte de inasistencias' : 'Reporte de volumen de atenciones', filtros: filtroTxt, anon, kpis, tablas: [{ titulo: 'Resumen por especialidad', cols: [{ t: 'Especialidad', w: 150 }, { t: 'Atenciones', w: 60 }, { t: 'Inasist.', w: 55 }, { t: 'Tasa', w: 50 }, { t: 'Oportun. (d)', w: 70 }], rows: resumen },
        { titulo: `Top 5 diagnósticos principales`, cols: [{ t: 'CIE-10', w: 50 }, { t: 'Descripción', w: 220 }, { t: 'Casos', w: 50 }, { t: '%', w: 40 }], rows: m.top.slice(0, 5).map(([c, n]) => [c, CIE[c] || '', supr(n), fmtD(pct(n, m.at.length)) + ' %']) }], pie: `El detalle completo (${fmtN(rows.length)} registros) está disponible en la exportación Excel/CSV.` } };
    }
    async function exportar(formato, boton, forzado) {
      const fl = forzado ? forzado.fl : filtros(); if (!validar(fl)) return; const tipo = forzado ? forzado.tipo : $('#tipoRep').value, anon = forzado ? !!forzado.anon : (anonForzada() || $('#chkAnon').checked);
      if (!anon && !$('#chkAutoriza').checked && !forzado) { $('#errAutoriza').classList.remove('d-none'); return; } $('#errAutoriza').classList.add('d-none');
      const unlock = SS.lock(boton, 'Generando…'); await correrJob(`Generando reporte ${formato === 'PDF' ? 'PDF' : 'Excel/CSV'}…`, ['Consultando datos…', anon ? 'Aplicando anonimización…' : 'Preparando datos…', 'Construyendo archivo…', 'Registrando el reporte…']);
      const m = metricas(fl), r = construir(tipo, fl, anon, m), nombre = `reporte_${norm_(tipo)}_${isoD(new Date())}`;
      if (formato === 'PDF') descargar(armarPDF(r.pdf), nombre + '.pdf'); else descargarCSV(nombre + '.csv', r.cols, r.rows);
      registrar(tipo, { desde: fl.desde, hasta: fl.hasta, especialidad: fl.esp ? ESPS[fl.esp] : '', sede: fl.sede ? SEDES[fl.sede] : '' }, formato === 'PDF' ? 'PDF' : 'Excel/CSV', anon); renderHist(); unlock(); SS.toast(`Reporte ${formato === 'PDF' ? 'PDF' : 'Excel/CSV'} generado y registrado.`);
    }
    const norm_ = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_');
    $('#btnCSV').addEventListener('click', e => exportar('CSV', e.currentTarget)); $('#btnPDF').addEventListener('click', e => exportar('PDF', e.currentTarget));
    const renderHist = tablaHistorial(['Volumen Atenciones', 'Epidemiológico CIE-10', 'Inasistencias'], (r, boton) => {
      const p = JSON.parse(r.parametros), esp = Object.entries(ESPS).find(([, n]) => n === p.especialidad), sede = Object.entries(SEDES).find(([, n]) => n === p.sede);
      const fl = { desde: p.desde, hasta: p.hasta, esp: esp ? esp[0] : '', sede: sede ? sede[0] : '' }; $('#fDesde').value = fl.desde; $('#fHasta').value = fl.hasta; $('#fEsp').value = fl.esp; $('#fSede').value = fl.sede; render(); exportar(r.formato === 'PDF' ? 'PDF' : 'CSV', boton, { fl, tipo: r.tipo, anon: r.anon }); });
    render();
  }

  /* =====================================================
     PANTALLA 14.2 · Reportes administrativos
     ===================================================== */
  function initAdministrativos() {
    if (document.body.dataset.page !== 'reportes_administrativos') return;
    $('#aSede').innerHTML = '<option value="">Todas las sedes</option>' + Object.entries(SEDES).map(([id, n]) => `<option value="${id}">${esc(n)}</option>`).join('');
    const setRango = n => { $('#aHasta').value = isoD(HOY); $('#aDesde').value = addDias(isoD(HOY), -(n - 1)); }; setRango(30); presets(n => { setRango(n); render(); });
    const filtros = () => ({ desde: $('#aDesde').value, hasta: $('#aHasta').value, sede: $('#aSede').value });
    const validar = fl => { const e = $('#errFiltros'); let msg = ''; if (!fl.desde || !fl.hasta) msg = 'Indique el rango de fechas.'; else if (fl.desde > fl.hasta) msg = 'La fecha inicial no puede ser posterior a la final.'; else if (fl.hasta > isoD(HOY)) msg = 'La fecha final no puede ser futura.'; else if (Math.round((parseD(fl.hasta) - parseD(fl.desde)) / 864e5) > 179) msg = 'El rango máximo es de 180 días.'; e.textContent = msg; e.classList.toggle('d-none', !msg); return !msg; };
    const semaforo = v => v >= 80 ? 'verde' : v >= 60 ? 'ambar' : 'rojo', semOc = v => v >= 70 ? 'verde' : v >= 40 ? 'ambar' : 'rojo';

    function render() {
      const fl = filtros(); if (!validar(fl)) return; const a = adminCalc(fl), s = saasData();
      $('#kpis').innerHTML = [['Horas programadas', fmtN(a.hp) + '<small> h</small>', ''], ['Horas ejecutadas', fmtN(a.he) + '<small> h</small>', 'k-green'], ['Productividad global', fmtD(a.prodGlobal) + '<small> %</small>', a.prodGlobal >= 80 ? 'k-green' : a.prodGlobal >= 60 ? 'k-warn' : 'k-red'], ['Ocupación de consultorios', fmtD(a.ocupGlobal) + '<small> %</small>', a.ocupGlobal >= 70 ? 'k-green' : 'k-warn']]
        .map(([t, v, k]) => `<div class="col-6 col-lg-3"><div class="kpi-rep ${k}"><div class="kpi-t">${t}</div><div class="kpi-v">${v}</div></div></div>`).join('');
      $('#tablaProd').innerHTML = a.prof.length ? a.prof.map(p => { const c = semaforo(p.prod); return `<tr><td><strong>${esc(p.nombre)}</strong></td><td>${esc(p.esp)}</td><td>${fmtN(p.hp)} h</td><td>${fmtD(p.he)} h</td><td><div class="d-flex align-items-center gap-2"><div class="mini-bar ${c} flex-grow-1"><span style="width:${Math.min(100, p.prod)}%"></span></div><span class="pct-txt ${c}">${fmtD(p.prod)} %</span></div></td><td>${fmtN(p.at)}</td><td>${fmtN(p.ia)}</td></tr>`; }).join('') : '<tr><td colspan="7" class="text-center text-muted py-3">Sin jornadas programadas en el periodo.</td></tr>';
      $('#listaCons').innerHTML = a.cons.map(c => { const off = c.estado !== 'Habilitado', cap = Math.max(c.cap, 1); return `<div class="mb-3 ${off ? 'cons-off' : ''}"><div class="d-flex flex-wrap justify-content-between gap-2 mb-1"><span><strong>${esc(c.codigo)}</strong> · ${esc(c.sedeN)} ${off ? `<span class="badge bg-${c.estado === 'Inactivo' ? 'secondary' : 'warning text-dark'}">${c.estado}</span>` : ''}</span>
        <span class="small">${off ? 'Sin horario operativo' : `Ocupación <span class="pct-txt ${semOc(c.ocup)}">${fmtD(c.ocup)} %</span> · uso real <strong>${fmtD(c.uso)} %</strong> · ${fmtN(c.asig)} de ${fmtN(c.cap)} h`}</span></div>
        <div class="stack" title="Horas abiertas: ${fmtN(c.cap)} · asignadas: ${fmtN(c.asig)} · ejecutadas: ${fmtD(c.ej)}"><div class="asig" style="width:${Math.min(100, c.asig / cap * 100)}%"></div><div class="ejec" style="width:${Math.min(100, c.ej / cap * 100)}%"></div></div></div>`; }).join('');

      // SaaS
      const dTot = Math.max(1, Math.round((parseD(s.sus.corte) - parseD(s.sus.inicio)) / 864e5)), dTr = Math.round((HOY - parseD(s.sus.inicio)) / 864e5), dRest = Math.round((parseD(s.sus.corte) - HOY) / 864e5), uso = (l, v, mx, extra) => { const p = pct(v, mx), c = p >= 90 ? 'rojo' : p >= 70 ? 'ambar' : 'verde'; return `<div class="mb-3"><div class="uso-label"><span>${l}</span><span>${fmtN(v)} / ${fmtN(mx)} ${extra || ''}</span></div><div class="mini-bar ${c}" style="height:10px"><span style="width:${Math.max(p, 1.5)}%"></span></div></div>`; };
      $('#bloqueSaaS').innerHTML = `<div class="plan-box mb-3"><div class="d-flex justify-content-between align-items-start"><div><div class="small text-muted fw-semibold text-uppercase">Plan contratado</div><div class="h4 fw-bold mb-0">${esc(s.plan.nombre)}</div><div class="small text-muted">${COP(s.plan.tarifa)} / mes + IVA</div></div><span class="badge ${dRest < 0 ? 'bg-danger' : dRest <= 30 ? 'bg-warning text-dark' : 'bg-success'}">${dRest < 0 ? 'Vencida' : dRest <= 30 ? 'Por vencer' : 'Vigente'}</span></div>
        <div class="small mt-2">Vigencia: ${fmtF(s.sus.inicio)} → <strong>${fmtF(s.sus.corte)}</strong> (${dRest >= 0 ? dRest + ' días restantes' : 'vencida hace ' + Math.abs(dRest) + ' días'})</div></div>
        ${uso('Vigencia consumida', Math.min(dTr, dTot), dTot, 'días')}${uso('Médicos activos', s.medicos, s.plan.medicos)}${uso('Pacientes activos', s.pacientes, s.plan.pacientes)}${uso('Módulos habilitados', s.modulos, 15)}
        <a href="../plataforma/planes_suscripciones.html" class="btn btn-sm btn-outline-primary">Ver planes y suscripciones →</a>`;
      const tot = s.facts.reduce((x, f) => x + f.total, 0), pend = s.facts.filter(f => f.estado !== 'Pagada').reduce((x, f) => x + f.total, 0);
      $('#kpisFact').innerHTML = [['Facturado (6 meses)', COP(tot)], ['Pendiente / en mora', COP(pend)], ['Facturas', s.facts.length]].map(([t, v]) => `<div class="col-4"><div class="kpi-rep"><div class="kpi-t">${t}</div><div class="kpi-v" style="font-size:1.1rem">${v}</div></div></div>`).join('');
      $('#tablaFact').innerHTML = s.facts.slice().reverse().map(f => `<tr><td><strong>${esc(f.numero)}</strong></td><td>${fmtF(f.emision)}</td><td>${fmtF(f.vence)}</td><td class="text-end">${COP(f.total)}</td><td><span class="est-pago ep-${f.estado}">${f.estado}</span></td></tr>`).join('');
      return { a, s };
    }

    function construir(tipo, fl) {
      const a = adminCalc(fl), s = saasData(), filtroTxt = [`Periodo: ${fmtF(fl.desde)} a ${fmtF(fl.hasta)}`, `Sede: ${fl.sede ? SEDES[fl.sede] : 'Todas'}   ·   Generado por: ${USUARIO}`, `Tipo: ${tipo}`];
      if (tipo === 'Productividad Médica') { const rows = a.prof.map(p => [p.nombre, p.esp, fmtD(p.hp, 0), fmtD(p.he), fmtD(p.prod) + ' %', p.at, p.ia]); return { cols: ['profesional', 'especialidad', 'horas_programadas', 'horas_ejecutadas', 'productividad_pct', 'atenciones', 'inasistencias'], rows,
        pdf: { titulo: 'Productividad médica: horas programadas vs ejecutadas', filtros: filtroTxt, anon: null, kpis: [['H. programadas', fmtN(a.hp)], ['H. ejecutadas', fmtN(a.he)], ['Productividad', fmtD(a.prodGlobal) + ' %']], tablas: [{ titulo: 'Detalle por profesional', cols: [{ t: 'Profesional', w: 120 }, { t: 'Especialidad', w: 105 }, { t: 'H. prog.', w: 45 }, { t: 'H. ejec.', w: 45 }, { t: 'Product.', w: 48 }, { t: 'Atenc.', w: 40 }, { t: 'Inas.', w: 38 }], rows }] } }; }
      if (tipo === 'Ocupación Consultorios') { const rows = a.cons.map(c => [c.codigo, c.sedeN, c.estado, fmtN(c.cap), fmtN(c.asig), fmtD(c.ej), fmtD(c.ocup) + ' %', fmtD(c.uso) + ' %']); return { cols: ['consultorio', 'sede', 'estado', 'horas_abiertas', 'horas_asignadas', 'horas_ejecutadas', 'ocupacion_pct', 'uso_real_pct'], rows,
        pdf: { titulo: 'Ocupación y uso de consultorios', filtros: filtroTxt, anon: null, kpis: [['Ocupación global', fmtD(a.ocupGlobal) + ' %'], ['Consultorios', a.cons.length]], tablas: [{ titulo: 'Detalle por consultorio', cols: [{ t: 'Consult.', w: 45 }, { t: 'Sede', w: 100 }, { t: 'Estado', w: 70 }, { t: 'H. abiertas', w: 52 }, { t: 'H. asign.', w: 48 }, { t: 'H. ejec.', w: 44 }, { t: 'Ocup.', w: 46 }, { t: 'Uso real', w: 46 }], rows }] } }; }
      const rows = s.facts.map(f => [f.numero, f.emision, f.vence, f.total, f.estado]); return { cols: ['numero_factura', 'fecha_emision', 'fecha_vencimiento', 'total_cop', 'estado_pago'], rows,
        pdf: { titulo: 'Facturación SaaS', filtros: [...filtroTxt, `Plan: ${s.plan.nombre} · vigencia hasta ${fmtF(s.sus.corte)}`], anon: null, kpis: [['Plan', s.plan.nombre], ['Médicos', `${s.medicos}/${s.plan.medicos}`], ['Pacientes', `${s.pacientes}/${fmtN(s.plan.pacientes)}`]], tablas: [{ titulo: 'Facturas emitidas', cols: [{ t: 'N.º factura', w: 110 }, { t: 'Emisión', w: 80 }, { t: 'Vence', w: 80 }, { t: 'Total', w: 90 }, { t: 'Estado', w: 70 }], rows: s.facts.map(f => [f.numero, fmtF(f.emision), fmtF(f.vence), COP(f.total), f.estado]) }] } };
    }
    const norm_ = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_');
    async function exportar(formato, boton, forzado) {
      const fl = forzado ? forzado.fl : filtros(); if (!validar(fl)) return; const tipo = forzado ? forzado.tipo : $('#tipoRepA').value; const unlock = SS.lock(boton, 'Generando…');
      await correrJob(`Generando reporte ${formato === 'PDF' ? 'PDF' : 'Excel/CSV'}…`, ['Consultando datos…', 'Calculando indicadores…', 'Construyendo archivo…', 'Registrando el reporte…']);
      const r = construir(tipo, fl), nombre = `reporte_${norm_(tipo)}_${isoD(new Date())}`; if (formato === 'PDF') descargar(armarPDF(r.pdf), nombre + '.pdf'); else descargarCSV(nombre + '.csv', r.cols, r.rows);
      registrar(tipo, { desde: fl.desde, hasta: fl.hasta, especialidad: '', sede: fl.sede ? SEDES[fl.sede] : '' }, formato === 'PDF' ? 'PDF' : 'Excel/CSV', false); renderHist(); unlock(); SS.toast(`Reporte ${formato === 'PDF' ? 'PDF' : 'Excel/CSV'} generado y registrado.`);
    }
    $('#btnCSV').addEventListener('click', e => exportar('CSV', e.currentTarget)); $('#btnPDF').addEventListener('click', e => exportar('PDF', e.currentTarget));
    $('#btnGenerarA').addEventListener('click', async e => { const fl = filtros(); if (!validar(fl)) return; const unlock = SS.lock(e.currentTarget, 'Generando…'); await correrJob('Generando reporte…', ['Consultando jornadas y atenciones…', 'Calculando productividad y ocupación…', 'Consultando suscripción y facturas…']); render(); unlock(); SS.toast('Reporte generado correctamente.'); });
    const renderHist = tablaHistorial(['Ocupación Consultorios', 'Productividad Médica', 'Facturación SaaS'], (r, boton) => {
      const p = JSON.parse(r.parametros), sede = Object.entries(SEDES).find(([, n]) => n === p.sede), fl = { desde: p.desde, hasta: p.hasta, sede: sede ? sede[0] : '' }; $('#aDesde').value = fl.desde; $('#aHasta').value = fl.hasta; $('#aSede').value = fl.sede; render(); exportar(r.formato === 'PDF' ? 'PDF' : 'CSV', boton, { fl, tipo: r.tipo }); });
    render();
  }

  document.addEventListener('DOMContentLoaded', () => { setInst(); initAsistenciales(); initAdministrativos(); });
})();