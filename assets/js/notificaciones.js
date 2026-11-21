/* ===== SaludSync · Módulo 13: Notificaciones y Alertas del Sistema (mockup interactivo, sin backend) ===== */
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
  const HOY = new Date(); HOY.setHours(0, 0, 0, 0);
  const fd = n => { const d = new Date(HOY); d.setDate(d.getDate() + n); return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }); };
  const leer = k => { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } };
  const hl = (t, q) => { if (!q) return esc(t); const i = norm(t).indexOf(q); return i < 0 ? esc(t) : esc(t.slice(0, i)) + '<mark class="hl">' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length)); };
  const hace = iso => { const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 6e4)); return m < 1 ? 'ahora' : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.floor(m / 60)} h` : `hace ${Math.floor(m / 1440)} d`; };
  const diaLabel = iso => { const d = new Date(iso); d.setHours(0, 0, 0, 0); const n = Math.round((HOY - d) / 864e5); return n === 0 ? 'Hoy' : n === 1 ? 'Ayer' : d.toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long' }).replace(/^./, c => c.toUpperCase()); };

  /* ---------- Institución, sesión y auditoría ---------- */
  const SES = leer('saludsync_sesion'), M2 = leer('saludsync_modulo2_v1');
  function instActiva() {
    let id = 1; const u = M2 && SES && M2.usuarios.find(x => x.id === SES.id); if (u && u.inst) id = u.inst;
    const nombres = { 1: 'Clínica Santa Lucía S.A.S.', 2: 'IPS Vida Plena Ltda.', 3: 'Centro Médico Los Andes', 5: 'Salud Integral del Caribe IPS' };
    return { id, nombre: nombres[id] || 'Institución #' + id };
  }
  const INST = instActiva();
  const responsable = () => SES ? `${SES.nombre} (${SES.rol})` : 'Administrador (demo)';
  const setInst = () => $$('[data-inst-nombre]').forEach(e => e.textContent = INST.nombre);
  function auditar(tabla, registro, accion, ant, nuevo) {
    const m2 = leer('saludsync_modulo2_v1'); if (!m2 || !m2.auditoria) return;
    m2.auditoria.unshift({ id: Math.max(0, ...m2.auditoria.map(a => a.id)) + 1, usuario: responsable(), tabla, registro, accion, ant, nuevo, ip: '192.168.1.10', fecha: `${isoD(new Date())} ${pad(new Date().getHours())}:${pad(new Date().getMinutes())}` });
    try { sessionStorage.setItem('saludsync_modulo2_v1', JSON.stringify(m2)); } catch (e) { }
  }

  /* ---------- Usuarios (Módulo 2 o semillas) ---------- */
  const ROLES = { 1: 'SuperAdmin', 2: 'Admin IPS', 3: 'Médico', 4: 'Recepción', 5: 'Paciente' };
  const USER_SEED = [[1, 'Laura', 'Pineda Gómez', 1, null], [2, 'María Fernanda', 'Ruiz Salazar', 2, 1], [3, 'Andrés Felipe', 'Navarro Díaz', 3, 1], [5, 'Camila', 'Ortiz Vargas', 4, 1], [8, 'Ana Lucía', 'Torres Gil', 5, 1]]
    .map(([id, n, a, rol, inst]) => ({ id, n, a, rol, inst, estado: 'Activo' }));
  const USERS = ((M2 && M2.usuarios) ? M2.usuarios : USER_SEED).map(u => ({ id: u.id, nombre: `${u.n} ${u.a}`, rol: u.rol, inst: u.inst, estado: u.estado }));
  const userDe = id => USERS.find(u => u.id === id);

  /* ---------- Tipos de notificación y enrutamiento contextual ---------- */
  const TIPOS = { 'Cita Médica': { ico: '📅', cls: 'Cita' }, 'Alerta Clínica': { ico: '🚨', cls: 'Alerta' }, 'Suscripción SaaS': { ico: '💳', cls: 'Susc' }, 'Novedad de Agenda': { ico: '📆', cls: 'Agenda' } };
  const ENT = { cita_medica: ['Cita médica', '../citas/mesa_recepcion.html'], seguimiento_control: ['Seguimiento', '../seguimiento/panel_seguimiento.html'], suscripcion: ['Suscripción', '../plataforma/planes_suscripciones.html'], factura_saas: ['Factura SaaS', '../plataforma/planes_suscripciones.html'],
    institucion: ['Institución', '../plataforma/instituciones.html'], bloqueo_agenda: ['Bloqueo de agenda', '../agenda/bloqueo_agenda.html'], agenda_medica: ['Agenda', '../agenda/calendario_agenda.html'], tratamiento: ['Tratamiento', '../tratamientos/tratamientos_activos.html'],
    orden_examen: ['Orden de examen', '../tratamientos/tratamientos_activos.html'], atencion_medica: ['Atención médica', '../atencion/panel_asistencial.html'], paciente: ['Paciente', '../pacientes/expediente_paciente.html'] };
  const ruta = (ent, id) => { const e = ENT[ent]; if (!e) return null; return ent === 'paciente' && id ? `${e[1]}?id=${id}` : e[1]; };

  /* ---------- Semilla: notificacion, configuracion_alerta (+ canales) ---------- */
  // [tipo, título, mensaje, entidad, id_entidad, minutos atrás, estado (N=No Leída, L=Leída, A=Archivada)]
  const PLANT = {
    1: [['Suscripción SaaS', 'Suscripción vencida', 'La suscripción de IPS Familiar Esperanza (plan Básico) está vencida. Sus usuarios podrían ser bloqueados.', 'suscripcion', 9, 180, 'N'],
      ['Suscripción SaaS', 'Suscripción próxima a vencer', `Odontología Sonrisa Sana S.A.S. vence el ${fd(8)} (plan Básico). Gestione la renovación.`, 'suscripcion', 6, 420, 'N'],
      ['Suscripción SaaS', 'Factura en mora', 'La factura FS-2026-0104 de IPS Familiar Esperanza figura en mora.', 'factura_saas', 4, 2900, 'N'],
      ['Suscripción SaaS', 'Suscripción próxima a vencer', `Clínica Pediátrica Arcoíris vence el ${fd(26)} (plan Profesional).`, 'suscripcion', 11, 1500, 'L'],
      ['Suscripción SaaS', 'Nueva institución registrada', 'Se registró una nueva institución y está pendiente de asignar plan.', 'institucion', 12, 4300, 'L'],
      ['Suscripción SaaS', 'Renovación exitosa', 'Centro Médico Los Andes renovó su plan Empresarial.', 'suscripcion', 3, 9000, 'A']],
    2: [['Suscripción SaaS', 'Su suscripción vence pronto', `La suscripción de su institución vence el ${fd(12)}. Renueve para evitar bloqueos.`, 'suscripcion', 1, 90, 'N'],
      ['Novedad de Agenda', 'Vacaciones programadas', `La Dra. Paula Rueda estará de vacaciones desde el ${fd(8)}. Hay citas por reprogramar.`, 'bloqueo_agenda', 2, 240, 'N'],
      ['Novedad de Agenda', 'Incapacidad registrada', 'El Dr. Mauricio Ariza registró una incapacidad médica. 6 citas afectadas.', 'bloqueo_agenda', 1, 600, 'N'],
      ['Alerta Clínica', 'Controles de seguimiento vencidos', '2 pacientes tienen su control de seguimiento vencido. Revise el panel.', 'seguimiento_control', 1, 800, 'N'],
      ['Cita Médica', 'Cancelaciones del día', '3 citas fueron canceladas hoy en Sede Principal.', 'cita_medica', 0, 120, 'L'],
      ['Cita Médica', 'Inasistencias de ayer', '4 pacientes no asistieron a su cita ayer.', 'cita_medica', 0, 1700, 'L'],
      ['Suscripción SaaS', 'Factura emitida', 'Se emitió la factura FS-2026-0105. Vence en 15 días.', 'factura_saas', 5, 2200, 'L'],
      ['Novedad de Agenda', 'Agenda publicada', 'Se publicó la agenda del Dr. Iván Suárez (Odontología) en Sede Cabecera.', 'agenda_medica', 5, 3000, 'L'],
      ['Novedad de Agenda', 'Bloqueo finalizado', 'La novedad «Permiso» de la Dra. Liliana Cortés finalizó.', 'bloqueo_agenda', 3, 5000, 'A']],
    3: [['Cita Médica', 'Paciente en sala de espera', 'Ana Lucía Torres Gil llegó para su cita de 09:30 (Sede Principal, consultorio C-101).', 'cita_medica', 1, 5, 'N'],
      ['Alerta Clínica', 'Alergia registrada', 'Ana Lucía Torres Gil tiene alergia a la penicilina. Verifique antes de prescribir.', 'paciente', 1, 25, 'N'],
      ['Alerta Clínica', 'Control de seguimiento vencido', 'Rosa Elena Barrios Núñez: su control de hipertensión está vencido.', 'seguimiento_control', 2, 300, 'N'],
      ['Alerta Clínica', 'Resultado de examen disponible', 'La hemoglobina glicosilada de Carlos Mendoza Ruiz está lista para su revisión.', 'orden_examen', 1, 2500, 'N'],
      ['Cita Médica', 'Nueva cita asignada', `Carlos Mendoza Ruiz agendó una cita con usted para el ${fd(2)} a las 10:40.`, 'cita_medica', 2, 700, 'L'],
      ['Novedad de Agenda', 'Cambio en su agenda', 'Se actualizó su horario del jueves en el consultorio C-102.', 'agenda_medica', 4, 1500, 'L'],
      ['Alerta Clínica', 'Tratamiento por finalizar', 'El tratamiento FM-000003 de Natalia Cárdenas Rueda finaliza en 2 días.', 'tratamiento', 3, 4000, 'L'],
      ['Cita Médica', 'Cita reprogramada', `Juan José Martínez Pérez reprogramó su cita para el ${fd(4)}.`, 'cita_medica', 6, 5200, 'A']],
    4: [['Cita Médica', 'Cita agendada', `Se agendó una cita para Daniela Gómez Castro el ${fd(1)} a las 14:00.`, 'cita_medica', 7, 35, 'N'],
      ['Cita Médica', 'Cita cancelada', 'Santiago Arias Calderón canceló su cita de las 10:40.', 'cita_medica', 10, 150, 'N'],
      ['Cita Médica', 'Inasistencia registrada', 'Héctor Lozano Vega no asistió a su cita de las 08:00.', 'cita_medica', 8, 380, 'L'],
      ['Novedad de Agenda', 'Bloqueo de agenda', `La Dra. Paula Rueda estará ausente desde el ${fd(8)}: reprograme sus citas.`, 'bloqueo_agenda', 2, 240, 'N'],
      ['Cita Médica', 'Cita reprogramada', `La cita de Luisa Herrera Díaz pasó al ${fd(3)} a las 09:30.`, 'cita_medica', 11, 1400, 'L'],
      ['Alerta Clínica', 'Paciente en sala de espera', 'Natalia Cárdenas Rueda lleva más de 25 minutos en espera.', 'atencion_medica', 9, 3200, 'A']],
    5: [['Cita Médica', 'Recordatorio de cita', 'Hola Ana Lucía, su cita con el Dr. Andrés Navarro es mañana a las 09:30 en Sede Principal.', 'cita_medica', 1, 60, 'N'],
      ['Alerta Clínica', 'Control de seguimiento próximo', `Su control de hipertensión debe realizarse antes del ${fd(5)}. Agende su cita.`, 'seguimiento_control', 1, 500, 'N'],
      ['Cita Médica', 'Cita confirmada', 'Su cita del jueves fue confirmada. Consultorio C-101, Sede Principal.', 'cita_medica', 1, 2000, 'L'],
      ['Alerta Clínica', 'Resultados disponibles', 'Sus resultados de laboratorio ya están disponibles.', 'orden_examen', 1, 4300, 'L'],
      ['Alerta Clínica', 'Tratamiento activo', 'Recuerde tomar su medicamento según la fórmula FM-000001.', 'tratamiento', 1, 6000, 'A']]
  };
  function semillaNotif() {
    const out = []; let id = 1;
    USERS.filter(u => u.estado === 'Activo' && (u.rol === 1 || !u.inst || u.inst === INST.id)).forEach(u => (PLANT[u.rol] || []).forEach(([tipo, titulo, msg, ent, eid, min, est]) =>
      out.push({ id: id++, usuario: u.id, inst: u.inst || INST.id, tipo, titulo: titulo.slice(0, 100), mensaje: msg.slice(0, 255), estado: est === 'N' ? 'No Leída' : est === 'L' ? 'Leída' : 'Archivada', entidad: ent, entidadId: eid || null, fecha: new Date(Date.now() - min * 6e4).toISOString() })));
    return out;
  }
  const R = (id, evento, horas, canales, estado, plantilla) => ({ id, inst: INST.id, evento, horas, canales, estado, plantilla });
  const REGLAS_SEED = [
    R(1, 'Recordatorio de cita médica', 24, ['Web', 'Correo Electrónico', 'SMS'], 'Activa', 'SaludSync: {Nombre_Paciente}, cita con {Doctor} el {Fecha_Cita} {Hora_Cita} en {Sede}. Llegue 15 min antes.'),
    R(2, 'Confirmación de cita agendada', null, ['Web', 'Correo Electrónico'], 'Activa', 'Su cita con {Doctor} quedó confirmada para el {Fecha_Cita} a las {Hora_Cita} en {Sede} (consultorio {Consultorio}).'),
    R(3, 'Cancelación o reprogramación de cita', null, ['Web', 'SMS'], 'Activa', 'SaludSync: su cita con {Doctor} del {Fecha_Cita} fue modificada. Consulte la nueva fecha en la web o llame a {Sede}.'),
    R(4, 'Recordatorio de control de seguimiento', 168, ['Web', 'Correo Electrónico'], 'Activa', '{Nombre_Paciente}, su control con {Doctor} debe realizarse antes del {Fecha_Cita}. Agende su cita en {Sede}.'),
    R(5, 'Control de seguimiento vencido', null, ['Web'], 'Activa', 'Alerta: el control de {Nombre_Paciente} con {Doctor} está vencido (fecha límite {Fecha_Cita}).'),
    R(6, 'Novedad de agenda del profesional', null, ['Web', 'Correo Electrónico'], 'Activa', 'La agenda de {Doctor} en {Sede} fue modificada. Revise las citas afectadas desde el {Fecha_Cita}.'),
    R(7, 'Suscripción próxima a vencer', 120, ['Web', 'Correo Electrónico'], 'Activa', 'La suscripción de {Sede} vence el {Fecha_Cita}. Renueve su plan para evitar bloqueos.'),
    R(8, 'Tratamiento próximo a finalizar', 72, ['Web'], 'Inactiva', 'El tratamiento de {Nombre_Paciente} finaliza el {Fecha_Cita}. Evalúe continuar o ajustar con {Doctor}.'),
    R(9, 'Orden de examen generada', null, ['Web', 'Correo Electrónico'], 'Activa', '{Nombre_Paciente}: {Doctor} generó una orden de examen. Preséntela en {Sede} antes del {Fecha_Cita}.')];
  const KEY = 'saludsync_modulo13_v1';
  const DB = (() => { const s = leer(KEY); if (s && s.notificaciones) return s; return { notificaciones: semillaNotif(), reglas: REGLAS_SEED, logs: [], usuarioVista: null }; })();
  const guardar = () => { try { sessionStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } document.dispatchEvent(new Event('ss:notif')); };
  if (!leer(KEY)) { try { sessionStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } }
  const vistaId = () => (SES && SES.id) || DB.usuarioVista || (USERS.find(u => u.rol === 2) || USERS[0]).id;

  /* =====================================================
     PANTALLA 13.1 · Centro de notificaciones
     ===================================================== */
  function initCentro() {
    if (document.body.dataset.page !== 'centro_notificaciones') return;
    const TAM = 10; let est = 'bandeja', tipo = '', pagina = 1; const sel = new Set();
    if (!SES) { $('#bloqueUsuario').classList.remove('d-none'); $('#selUsuario').innerHTML = USERS.filter(u => u.estado === 'Activo').map(u => `<option value="${u.id}">${esc(u.nombre)} · ${ROLES[u.rol]}</option>`).join(''); $('#selUsuario').value = vistaId(); $('#selUsuario').addEventListener('change', e => { DB.usuarioVista = +e.target.value; guardar(); sel.clear(); pagina = 1; render(); }); }
    const mias = () => DB.notificaciones.filter(n => n.usuario === vistaId());

    function filtrar() {
      const q = norm($('#fTxt').value.trim()), r = +$('#fRango').value, lim = r ? Date.now() - r * 864e5 : 0;
      return mias().filter(n => (est === 'bandeja' ? n.estado !== 'Archivada' : n.estado === est) && (!tipo || n.tipo === tipo) && (!q || norm(n.titulo).includes(q) || norm(n.mensaje).includes(q)) && (!r || new Date(n.fecha).getTime() >= (r === 1 ? HOY.getTime() : lim)))
        .sort((a, b) => b.fecha.localeCompare(a.fecha));
    }
    function render() {
      const u = userDe(vistaId()) || { nombre: '—', rol: 0 }; $('#quienBandeja').textContent = `${u.nombre} (${ROLES[u.rol] || '—'})`;
      const todas = mias(), c = e => todas.filter(n => n.estado === e).length;
      $('#kpis').innerHTML = [['No leídas', c('No Leída'), 'kpi-warn'], ['Leídas', c('Leída'), 'kpi-green'], ['Archivadas', c('Archivada'), 'kpi-gray'], ['Recibidas hoy', todas.filter(n => new Date(n.fecha) >= HOY).length, '']].map(([l, v, k]) => `<div class="col-6 col-lg-3"><div class="kpi ${k}"><div class="kpi-num">${v}</div><div class="kpi-lbl">${l}</div></div></div>`).join('');
      const base = todas.filter(n => est === 'bandeja' ? n.estado !== 'Archivada' : n.estado === est);
      $('#chipsTipo').innerHTML = `<span class="chip-tipo ${!tipo ? 'activo' : ''}" data-t="">Todas<span class="n">${base.length}</span></span>` + Object.keys(TIPOS).map(t => `<span class="chip-tipo ${tipo === t ? 'activo' : ''}" data-t="${t}">${TIPOS[t].ico} ${t}<span class="n">${base.filter(n => n.tipo === t).length}</span></span>`).join('');
      $$('#pillsEstado .btn').forEach(b => b.classList.toggle('active', b.dataset.e === est));

      const lista = filtrar(), total = lista.length, paginas = Math.max(1, Math.ceil(total / TAM)); if (pagina > paginas) pagina = paginas;
      const ini = (pagina - 1) * TAM, vista = lista.slice(ini, ini + TAM), q = norm($('#fTxt').value.trim()); let dia = '';
      $('#lista').innerHTML = vista.length ? vista.map(n => { const t = TIPOS[n.tipo], e = ENT[n.entidad], nl = n.estado === 'No Leída', arch = n.estado === 'Archivada', d = diaLabel(n.fecha); let cab = ''; if (d !== dia) { dia = d; cab = `<div class="notif-dia">${esc(d)}</div>`; }
        return cab + `<div class="notif ${nl ? 'no-leida' : ''} ${arch ? 'archivada' : ''}" data-id="${n.id}"><input type="checkbox" class="form-check-input notif-chk mt-2" data-id="${n.id}" ${sel.has(n.id) ? 'checked' : ''} aria-label="Seleccionar notificación">
          <div class="notif-ico ti-${t.cls}" aria-hidden="true">${t.ico}</div>
          <div class="notif-body" data-go="${n.id}" role="link" tabindex="0"><div class="d-flex justify-content-between gap-2"><span class="notif-titulo">${nl ? '<span class="punto-nl"></span>' : ''}${hl(n.titulo, q)}</span><small class="text-muted text-nowrap">${hace(n.fecha)}</small></div>
            <div class="notif-msg">${hl(n.mensaje, q)}</div><div class="notif-meta"><span class="badge-tipo bt-${t.cls}">${n.tipo}</span> ${e ? `· <span class="go-link">Ir a ${esc(e[0])} →</span>` : ''}</div></div>
          <div class="notif-acc">${arch ? `<button class="btn btn-outline-dark" data-acc="restaurar" data-id="${n.id}" title="Restaurar a la bandeja">↩</button>` : `<button class="btn btn-outline-${nl ? 'success' : 'primary'}" data-acc="${nl ? 'Leída' : 'No Leída'}" data-id="${n.id}" title="${nl ? 'Marcar como leída' : 'Marcar como no leída'}">${nl ? '✔' : '↺'}</button><button class="btn btn-outline-secondary" data-acc="Archivada" data-id="${n.id}" title="Archivar">📥</button>`}</div></div>`; }).join('')
        : '<div class="card panel"><div class="card-body text-center text-muted py-5"><div class="display-6">📭</div>No hay notificaciones con estos filtros.</div></div>';
      $('#contador').textContent = total ? `${ini + 1}–${ini + vista.length} de ${total}` : '';
      let pg = `<li class="page-item ${pagina === 1 ? 'disabled' : ''}"><button class="page-link" data-p="${pagina - 1}">«</button></li>`; for (let k = 1; k <= paginas; k++) pg += `<li class="page-item ${k === pagina ? 'active' : ''}"><button class="page-link" data-p="${k}">${k}</button></li>`;
      pg += `<li class="page-item ${pagina === paginas ? 'disabled' : ''}"><button class="page-link" data-p="${pagina + 1}">»</button></li>`; $('#paginacion').innerHTML = pg;
      $('#barraSel').classList.toggle('d-none', !sel.size); $('#nSel').textContent = sel.size; $('#chkTodos').checked = vista.length > 0 && vista.every(n => sel.has(n.id)); $('#btnTodasLeidas').disabled = !c('No Leída');
    }
    const aplicar = (ids, accion) => { ids.forEach(id => { const n = DB.notificaciones.find(x => x.id === id); if (!n) return; n.estado = accion === 'restaurar' ? 'Leída' : accion; }); guardar(); };

    $('#chipsTipo').addEventListener('click', e => { const c = e.target.closest('[data-t]'); if (c) { tipo = c.dataset.t; pagina = 1; render(); } });
    $('#pillsEstado').addEventListener('click', e => { const b = e.target.closest('[data-e]'); if (b) { est = b.dataset.e; sel.clear(); pagina = 1; render(); } });
    ['fTxt', 'fRango'].forEach(id => ['input', 'change'].forEach(ev => $('#' + id).addEventListener(ev, () => { pagina = 1; render(); })));
    $('#paginacion').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b && !b.parentElement.classList.contains('disabled')) { pagina = +b.dataset.p; render(); } });

    // Clic en una notificación: se marca como leída y se enruta al registro relacionado
    function ir(id) { const n = DB.notificaciones.find(x => x.id === id), r = ruta(n.entidad, n.entidadId); if (n.estado === 'No Leída') { n.estado = 'Leída'; guardar(); } if (r) location.href = r; else { SS.toast('Esta notificación no tiene un registro asociado.', 'secondary'); render(); } }
    $('#lista').addEventListener('click', e => {
      const chk = e.target.closest('.notif-chk'); if (chk) { chk.checked ? sel.add(+chk.dataset.id) : sel.delete(+chk.dataset.id); render(); return; }
      const acc = e.target.closest('[data-acc]'); if (acc) { aplicar([+acc.dataset.id], acc.dataset.acc); sel.delete(+acc.dataset.id); render(); SS.toast(acc.dataset.acc === 'Archivada' ? 'Notificación archivada.' : acc.dataset.acc === 'restaurar' ? 'Notificación restaurada.' : `Marcada como ${acc.dataset.acc === 'Leída' ? 'leída' : 'no leída'}.`, 'secondary'); return; }
      const go = e.target.closest('[data-go]'); if (go) ir(+go.dataset.go);
    });
    $('#lista').addEventListener('keydown', e => { if (e.key === 'Enter') { const go = e.target.closest('[data-go]'); if (go) ir(+go.dataset.go); } });
    $('#chkTodos').addEventListener('change', e => { filtrar().slice((pagina - 1) * TAM, pagina * TAM).forEach(n => e.target.checked ? sel.add(n.id) : sel.delete(n.id)); render(); });
    $('#btnQuitarSel').addEventListener('click', () => { sel.clear(); render(); });
    $('#barraSel').addEventListener('click', e => { const b = e.target.closest('[data-bulk]'); if (!b || b.disabled) return; const unlock = SS.lock(b, '…'); const ids = [...sel];
      setTimeout(() => { aplicar(ids, b.dataset.bulk); sel.clear(); unlock(); render(); SS.toast(`${ids.length} notificación(es) actualizada(s).`); }, 450); });

    // Marcar todas como leídas (acción masiva)
    $('#btnTodasLeidas').addEventListener('click', () => { const n = mias().filter(x => x.estado === 'No Leída').length; if (!n) return; $('#masivoCuerpo').innerHTML = `Se marcarán como leídas <strong>${n}</strong> notificación(es) no leída(s) de la bandeja de <strong>${esc($('#quienBandeja').textContent)}</strong>.`; modal('modalMasivo').show(); });
    $('#btnConfirmarMasivo').addEventListener('click', e => { const unlock = SS.lock(e.currentTarget, 'Marcando…');
      setTimeout(() => { const ids = mias().filter(x => x.estado === 'No Leída').map(x => x.id); aplicar(ids, 'Leída'); modal('modalMasivo').hide(); unlock(); render(); SS.toast(`${ids.length} notificación(es) marcada(s) como leídas.`); }, 700); });
    render();
  }

  /* =====================================================
     PANTALLA 13.2 · Configuración de alertas
     ===================================================== */
  const VARS = { Nombre_Paciente: 'Ana Lucía Torres', Fecha_Cita: fd(2), Hora_Cita: '09:30', Doctor: 'Dr. Andrés Navarro', Sede: 'Sede Principal', Consultorio: 'C-101' };
  const categoriaDe = ev => { const e = norm(ev); return /suscrip|factura|plan/.test(e) ? 'Suscripción SaaS' : /agenda|bloqueo/.test(e) ? 'Novedad de Agenda' : /control|seguimiento|tratamiento|examen|alerta|clinic/.test(e) ? 'Alerta Clínica' : 'Cita Médica'; };
  const entidadDe = ev => { const e = norm(ev); return /suscrip|plan/.test(e) ? 'suscripcion' : /factura/.test(e) ? 'factura_saas' : /agenda|bloqueo/.test(e) ? 'bloqueo_agenda' : /control|seguimiento/.test(e) ? 'seguimiento_control' : /tratamiento/.test(e) ? 'tratamiento' : /examen/.test(e) ? 'orden_examen' : 'cita_medica'; };
  const canalCls = c => c === 'Web' ? 'Web' : c.startsWith('Correo') ? 'Correo' : 'SMS';
  const horasTxt = h => !h ? '—' : h < 24 ? `${h} h` : (h % 24 === 0 ? `${h / 24} día(s)` : `${Math.floor(h / 24)} d ${h % 24} h`);
  const renderPlantilla = (txt, resaltar) => String(txt).replace(/\{([^}]+)\}/g, (m, k) => VARS[k] !== undefined ? (resaltar ? `<mark>${esc(VARS[k])}</mark>` : VARS[k]) : m);

  function initConfig() {
    if (document.body.dataset.page !== 'configuracion_alertas') return;
    const f = $('#formRegla'), btn = $('#btnGuardarRegla'); let editId = null; const rol = SES ? (M2 && M2.usuarios.find(u => u.id === SES.id) || {}).rol : null, puede = !SES || rol === 1 || rol === 2;
    if (!puede) { $('#avisoPermiso').classList.remove('d-none'); $('#fsRegla').disabled = true; btn.disabled = true; $('#btnNuevaRegla').disabled = true; }
    $('#chipsVars').innerHTML = Object.keys(VARS).map(v => `<span class="var-chip" data-v="{${v}}" title="Insertar variable">{${v}}</span>`).join('');
    const regla = id => DB.reglas.find(r => r.id === id);

    function renderTabla() {
      $('#kpis').innerHTML = [['Reglas', DB.reglas.length, ''], ['Activas', DB.reglas.filter(r => r.estado === 'Activa').length, 'kpi-green'], ['Con SMS', DB.reglas.filter(r => r.canales.includes('SMS')).length, 'kpi-warn'], ['Con anticipación', DB.reglas.filter(r => r.horas).length, '']].map(([l, v, k]) => `<div class="col-6 col-lg-3"><div class="kpi ${k}"><div class="kpi-num">${v}</div><div class="kpi-lbl">${l}</div></div></div>`).join('');
      $('#tablaReglas').innerHTML = DB.reglas.map(r => `<tr class="${r.id === editId ? 'row-editando' : ''}"><td><span class="regla-ev">${esc(r.evento)}</span><span class="cell-sub">${esc(categoriaDe(r.evento))}</span></td><td>${r.horas ? `<strong>${r.horas} h</strong><span class="cell-sub">${horasTxt(r.horas)} antes</span>` : '<span class="text-muted">Inmediato</span>'}</td>
        <td>${r.canales.map(c => `<span class="chip-canal cc-${canalCls(c)}">${c === 'Correo Electrónico' ? 'Correo' : c}</span>`).join('')}</td>
        <td><div class="form-check form-switch"><input class="form-check-input sw-estado" type="checkbox" role="switch" data-id="${r.id}" ${r.estado === 'Activa' ? 'checked' : ''} ${puede ? '' : 'disabled'} aria-label="Regla activa"></div></td>
        <td class="text-end text-nowrap"><button class="btn btn-sm btn-outline-primary" data-act="editar" data-id="${r.id}" title="${puede ? 'Editar' : 'Ver'}">${puede ? '✏️' : '👁'}</button> <button class="btn btn-sm btn-outline-success" data-act="probar" data-id="${r.id}" title="Enviar notificación de prueba">🧪</button></td></tr>`).join('');
      $('#tablaLogs').innerHTML = DB.logs.length ? DB.logs.slice().reverse().slice(0, 8).map(l => `<tr><td class="small">${new Date(l.fecha).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td><td>${esc(l.regla)}</td><td><span class="chip-canal cc-${canalCls(l.canal)}">${l.canal === 'Correo Electrónico' ? 'Correo' : l.canal}</span></td><td class="log-ok">✔ ${esc(l.resultado)}</td></tr>`).join('') : '<tr><td colspan="4" class="text-center text-muted py-3">Aún no hay despachos de prueba.</td></tr>';
    }

    /* Editor y vista previa */
    const canales = () => $$('.canal:checked').map(c => c.value);
    function actualizarPrev() {
      const txt = $('#r_plantilla').value, ev = $('#r_evento').value.trim(); $('#plCount').textContent = txt.length; $('#catEvento').textContent = ev ? categoriaDe(ev) : '—';
      $('#horasTxt').textContent = $('#r_inmediato').checked ? 'inmediato' : (+$('#r_horas').value ? horasTxt(+$('#r_horas').value) : '—');
      $('#pvWeb').innerHTML = txt ? renderPlantilla(txt, true) : '<span class="text-muted">Escriba la plantilla…</span>'; $('#pvAsunto').textContent = ev ? `SaludSync · ${ev}` : '—'; $('#pvCorreo').innerHTML = txt ? `${renderPlantilla(txt, true)}<hr class="my-2"><small class="text-muted">${esc(INST.nombre)}</small>` : '—';
      const sms = renderPlantilla(txt, false); $('#pvSms').textContent = txt ? sms : '—'; const sc = $('#smsCount'); sc.textContent = `${sms.length}/160`; sc.className = 'sms-count ms-2 ' + (sms.length > 160 ? 'warn' : 'ok');
    }
    ['r_plantilla', 'r_evento', 'r_horas', 'r_inmediato'].forEach(id => ['input', 'change'].forEach(ev => $('#' + id).addEventListener(ev, actualizarPrev)));
    $('#r_inmediato').addEventListener('change', e => { $('#r_horas').disabled = e.target.checked; if (e.target.checked) $('#r_horas').value = ''; });
    $('#chipsVars').addEventListener('click', e => { const c = e.target.closest('[data-v]'); if (!c || !puede) return; const t = $('#r_plantilla'), a = t.selectionStart ?? t.value.length, b = t.selectionEnd ?? a; t.value = t.value.slice(0, a) + c.dataset.v + t.value.slice(b); t.focus(); t.selectionStart = t.selectionEnd = a + c.dataset.v.length; actualizarPrev(); });

    function cargar(r) {
      editId = r ? r.id : null; f.classList.remove('was-validated'); $('#errRegla').classList.add('d-none'); $('#errCanal').classList.add('d-none');
      $('#tituloRegla').textContent = r ? '✏️ Editar regla' : '➕ Nueva regla'; $('#btnCancelarRegla').classList.toggle('d-none', !r);
      $('#r_evento').value = r ? r.evento : ''; $('#r_inmediato').checked = r ? !r.horas : false; $('#r_horas').value = r && r.horas ? r.horas : ''; $('#r_horas').disabled = $('#r_inmediato').checked;
      $$('.canal').forEach(c => c.checked = r ? r.canales.includes(c.value) : c.value === 'Web'); $('#r_plantilla').value = r ? r.plantilla : ''; $('#r_estado').checked = r ? r.estado === 'Activa' : true; actualizarPrev(); renderTabla();
    }
    $('#btnNuevaRegla').addEventListener('click', () => cargar(null)); $('#btnCancelarRegla').addEventListener('click', () => cargar(null));

    $('#tablaReglas').addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b) return; const r = regla(+b.dataset.id); if (b.dataset.act === 'editar') { cargar(r); window.scrollTo({ top: 0, behavior: 'smooth' }); } else probar(r, b); });
    $('#tablaReglas').addEventListener('change', e => { const s = e.target.closest('.sw-estado'); if (!s || !puede) return; const r = regla(+s.dataset.id), ant = r.estado; r.estado = s.checked ? 'Activa' : 'Inactiva';
      auditar('configuracion_alerta', r.id, 'Modificación', { estado: ant }, { estado: r.estado }); guardar(); renderTabla(); SS.toast(`Regla ${r.estado === 'Activa' ? 'activada' : 'desactivada'}.`, 'secondary'); });

    /* Validaciones y guardado (RF-NOT-04 / RF-NOT-05) */
    function validar() {
      const errs = [], ev = $('#r_evento').value.trim(), horas = +$('#r_horas').value, inm = $('#r_inmediato').checked, pl = $('#r_plantilla').value.trim(), cs = canales();
      const dup = DB.reglas.some(r => r.id !== editId && norm(r.evento) === norm(ev)); $('#r_evento').setCustomValidity(ev.length < 3 || dup ? 'x' : ''); $('#fbEvento').textContent = dup ? 'Ya existe una regla con este evento.' : 'Ingrese el nombre del evento (3 a 60 caracteres).';
      if (dup) errs.push('Ya existe una regla con este evento en la institución.');
      const malHoras = !inm && (!Number.isInteger(horas) || horas < 1 || horas > 720); $('#r_horas').setCustomValidity(malHoras ? 'x' : ''); if (malHoras) errs.push('La anticipación debe ser un entero entre 1 y 720 horas (o marque «evento inmediato»).');
      $('#errCanal').classList.toggle('d-none', cs.length > 0); if (!cs.length) errs.push('Seleccione al menos un canal de envío.');
      const desconocidas = [...new Set([...pl.matchAll(/\{([^}]*)\}/g)].map(m => m[1]).filter(v => VARS[v] === undefined))]; $('#r_plantilla').setCustomValidity(!pl || desconocidas.length ? 'x' : ''); $('#fbPlantilla').textContent = pl ? 'Variables no válidas en la plantilla.' : 'La plantilla es obligatoria.';
      if (desconocidas.length) errs.push(`Variables no reconocidas: ${desconocidas.map(v => '{' + v + '}').join(', ')}. Use: ${Object.keys(VARS).map(v => '{' + v + '}').join(', ')}.`);
      if (/\{[^}]*$/.test(pl) || /^[^{]*\}/.test(pl.replace(/\{[^}]*\}/g, ''))) errs.push('Hay llaves sin cerrar en la plantilla.');
      return errs;
    }
    f.addEventListener('submit', e => {
      e.preventDefault(); if (btn.disabled || !puede) return; const errs = validar(), box = $('#errRegla'); f.classList.add('was-validated');
      if (errs.length || !f.checkValidity()) { if (errs.length) { box.innerHTML = '⛔ ' + errs.map(esc).join('<br>⛔ '); box.classList.remove('d-none'); } return; } box.classList.add('d-none');
      const unlock = SS.lock(btn, 'Guardando…');
      setTimeout(() => {
        const datos = { evento: $('#r_evento').value.trim(), horas: $('#r_inmediato').checked ? null : +$('#r_horas').value, canales: canales(), estado: $('#r_estado').checked ? 'Activa' : 'Inactiva', plantilla: $('#r_plantilla').value.trim() }; let r;
        if (editId) { r = regla(editId); const ant = { evento: r.evento, horas: r.horas, canales: r.canales.join(','), estado: r.estado }; Object.assign(r, datos); auditar('configuracion_alerta', r.id, 'Modificación', ant, { evento: r.evento, horas: r.horas, canales: r.canales.join(','), estado: r.estado }); }
        else { r = { id: Math.max(0, ...DB.reglas.map(x => x.id)) + 1, inst: INST.id, ...datos }; DB.reglas.push(r); auditar('configuracion_alerta', r.id, 'Creación', null, { evento: r.evento, canales: r.canales.join(',') }); }
        auditar('configuracion_alerta_canal', r.id, editId ? 'Modificación' : 'Creación', null, { canales: r.canales.join(', ') }); const edit = !!editId; guardar(); cargar(null); unlock(); SS.toast(edit ? 'Regla actualizada correctamente.' : 'Regla creada correctamente.');
      }, 800);
    });

    /* Probar una regla: genera la notificación Web y simula Correo/SMS */
    function probar(r, boton) {
      const unlock = SS.lock(boton, '…');
      setTimeout(() => {
        const uid = vistaId(), uObj = userDe(uid), msg = renderPlantilla(r.plantilla, false).slice(0, 255), tipo = categoriaDe(r.evento);
        if (r.canales.includes('Web')) DB.notificaciones.push({ id: Math.max(0, ...DB.notificaciones.map(n => n.id)) + 1, usuario: uid, inst: (uObj && uObj.inst) || INST.id, tipo, titulo: r.evento.slice(0, 100), mensaje: msg, estado: 'No Leída', entidad: entidadDe(r.evento), entidadId: null, fecha: new Date().toISOString() });
        r.canales.forEach(c => DB.logs.push({ fecha: new Date().toISOString(), regla: r.evento, canal: c, resultado: c === 'Web' ? 'Entregada en la bandeja' : 'Enviado (simulado)' }));
        guardar(); renderTabla(); unlock(); SS.toast(r.canales.includes('Web') ? 'Notificación de prueba enviada. Revise su bandeja.' : 'Despacho simulado registrado (sin canal Web).');
      }, 600);
    }
    $('#btnProbar').addEventListener('click', e => { const errs = validar(); if (errs.length) { $('#errRegla').innerHTML = '⛔ ' + errs.map(esc).join('<br>⛔ '); $('#errRegla').classList.remove('d-none'); f.classList.add('was-validated'); return; }
      probar({ evento: $('#r_evento').value.trim(), plantilla: $('#r_plantilla').value.trim(), canales: canales() }, e.currentTarget); });

    const pid = +new URLSearchParams(location.search).get('id'); cargar(pid ? regla(pid) : null);
  }

  document.addEventListener('DOMContentLoaded', () => { setInst(); initCentro(); initConfig(); });
})();