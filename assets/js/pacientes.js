/* ===== SaludSync · Módulo 3: Gestión de Pacientes (datos desde controls/pacientes/*.php) ===== */
(function () {
  'use strict';

  /* ---------- Utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => new Date(s + 'T00:00:00');
  const fmt = s => parse(s).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  const modal = id => bootstrap.Modal.getOrCreateInstance(document.getElementById(id));
  const HOY = new Date(); HOY.setHours(0, 0, 0, 0);

  const edad = s => { const n = parse(s); let a = HOY.getFullYear() - n.getFullYear(); const m = HOY.getMonth() - n.getMonth(); if (m < 0 || (m === 0 && HOY.getDate() < n.getDate())) a--; return a; };
  const edadTxt = s => {
    const a = edad(s); if (a >= 2) return a + ' años';
    const n = parse(s), meses = (HOY.getFullYear() - n.getFullYear()) * 12 + HOY.getMonth() - n.getMonth() - (HOY.getDate() < n.getDate() ? 1 : 0);
    return meses + ' meses';
  };
  const nombreCompleto = p => `${p.nombres} ${p.apellidos}`;
  const iniciales = p => (p.nombres[0] + p.apellidos[0]).toUpperCase();
  const hl = (texto, q) => {
    if (!q) return esc(texto);
    const i = norm(texto).indexOf(q); if (i < 0) return esc(texto);
    return esc(texto.slice(0, i)) + '<mark class="hl">' + esc(texto.slice(i, i + q.length)) + '</mark>' + esc(texto.slice(i + q.length));
  };
  const BADGE_CITA = { 'Programada': 'primary', 'En Sala de Espera': 'info text-dark', 'En Consulta': 'warning text-dark', 'Atendida': 'success', 'Cancelada': 'secondary', 'Inasistencia': 'danger' };

  /* ---------- Datos: llegan del servidor (controls/pacientes/*.php); la institución sale de la sesión ---------- */
  const RUTA_DIR = 'controls/pacientes/directorio_pacientes.php', RUTA_REG = 'controls/pacientes/registro_paciente.php', RUTA_EXP = 'controls/pacientes/expediente_paciente.php';
  const ponerInstitucion = nombre => $$('[data-inst-nombre]').forEach(e => { e.textContent = nombre || '—'; });

  // Botón "Cargar más" para listas que el servidor entrega por páginas (RNF-REN-02)
  function botonCargarMas(despuesDe, texto, alClic) {
    const caja = document.createElement('div'); caja.className = 'text-center mt-2';
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-sm btn-outline-primary'; b.textContent = texto;
    b.addEventListener('click', alClic); caja.appendChild(b); despuesDe.after(caja);
    return { mostrar: v => caja.classList.toggle('d-none', !v), boton: b };
  }

  /* =====================================================
     PANTALLA 3.1 · Directorio de pacientes
     ===================================================== */
  async function initDirectorio() {
    const tbody = $('#tablaPacientes'); if (!tbody) return;
    let pagina = 1, pendiente = null, lista = [], total = 0, limite = 6, puedeEscribir = false, secuencia = 0, temporizador = null;

    // Pide al servidor solo la página y los filtros actuales (búsqueda, tipo, estado)
    async function cargar() {
      const mia = ++secuencia;
      const params = new URLSearchParams({ accion: 'listar', pagina, q: $('#buscador').value.trim(), tipo: $('#filtroTipo').value, estado: $('#filtroEstado').value });
      const r = await SS.api(RUTA_DIR + '?' + params);
      if (mia !== secuencia) return;                 // llegó una respuesta más nueva: esta se descarta
      if (!r.ok) { SS.toast(r.mensaje || 'No fue posible cargar los pacientes.', 'danger'); return; }
      const d = r.datos;
      lista = d.pacientes; total = d.total; limite = d.limite; puedeEscribir = d.puede_escribir; pagina = d.pagina;
      ponerInstitucion(d.institucion);
      $('#kpiTotal').textContent = d.kpis.total; $('#kpiActivos').textContent = d.kpis.activos;
      $('#kpiInactivos').textContent = d.kpis.inactivos; $('#kpiMenores').textContent = d.kpis.menores;
      render();
    }

    function render() {
      const q = norm($('#buscador').value.trim()), paginas = Math.max(1, Math.ceil(total / limite)), ini = (pagina - 1) * limite;
      tbody.innerHTML = lista.length ? lista.map(p => {
        const activo = p.estado === 'Activo', a = edad(p.nac);
        return `<tr>
          <td><strong>${esc(p.tipo)}</strong> ${hl(p.doc, q)}</td>
          <td><div class="d-flex align-items-center gap-2"><span class="avatar">${esc(iniciales(p))}</span>
            <div><strong>${hl(nombreCompleto(p), q)}</strong>${a < 18 ? ' <span class="badge badge-menor">Menor</span>' : ''}<span class="cell-sub">${esc(p.correo || 'Sin correo')}</span></div></div></td>
          <td>${esc(edadTxt(p.nac))}<span class="cell-sub">${esc(p.sexo)}</span></td>
          <td>${esc(p.tel)}</td><td>${esc(p.eps || '—')}</td>
          <td><span class="badge bg-${activo ? 'success' : 'secondary'}">${p.estado}</span></td>
          <td class="text-end text-nowrap">
            <a class="btn btn-sm btn-outline-primary" href="expediente_paciente.html?id=${p.id}" title="Ver ficha integral">📂</a>
            ${puedeEscribir ? `<a class="btn btn-sm btn-outline-primary" href="registro_paciente.html?id=${p.id}" title="Editar paciente">✏️</a>
            <button class="btn btn-sm ${activo ? 'btn-outline-danger' : 'btn-outline-success'}" data-id="${p.id}" title="${activo ? 'Inactivar' : 'Activar'} paciente">${activo ? '⏸' : '▶'}</button>` : ''}
          </td></tr>`;
      }).join('') : '<tr><td colspan="7" class="text-center text-muted py-4">No se encontraron pacientes con los criterios indicados.</td></tr>';

      $('#contador').textContent = total ? `Mostrando ${ini + 1}–${ini + lista.length} de ${total} pacientes` : 'Sin resultados';
      let pg = `<li class="page-item ${pagina === 1 ? 'disabled' : ''}"><button class="page-link" data-p="${pagina - 1}">«</button></li>`;
      for (let n = 1; n <= paginas; n++) pg += `<li class="page-item ${n === pagina ? 'active' : ''}"><button class="page-link" data-p="${n}">${n}</button></li>`;
      pg += `<li class="page-item ${pagina === paginas ? 'disabled' : ''}"><button class="page-link" data-p="${pagina + 1}">»</button></li>`;
      $('#paginacion').innerHTML = pg;
    }

    const recargar = () => { pagina = 1; cargar(); };
    $('#buscador').addEventListener('input', () => { clearTimeout(temporizador); temporizador = setTimeout(recargar, 300); }); // búsqueda en tiempo real, sin una petición por tecla
    $('#filtroTipo').addEventListener('change', recargar);
    $('#filtroEstado').addEventListener('change', recargar);
    $('#btnLimpiar').addEventListener('click', () => { $('#buscador').value = ''; $('#filtroTipo').value = ''; $('#filtroEstado').value = ''; recargar(); });
    $('#paginacion').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b && !b.parentElement.classList.contains('disabled')) { pagina = +b.dataset.p; cargar(); } });

    tbody.addEventListener('click', e => {
      const b = e.target.closest('button[data-id]'); if (!b) return;
      const p = lista.find(x => x.id === +b.dataset.id); pendiente = p.id; const activar = p.estado === 'Inactivo';
      $('#modalEstadoTitulo').textContent = activar ? 'Activar paciente' : 'Inactivar paciente';
      $('#modalEstadoCuerpo').innerHTML = activar
        ? `¿Desea activar a <strong>${esc(nombreCompleto(p))}</strong>?`
        : `¿Desea inactivar a <strong>${esc(nombreCompleto(p))}</strong>? Su historial se conserva, pero no podrá recibir nuevas citas.`;
      $('#btnConfirmarEstado').className = 'btn ' + (activar ? 'btn-success' : 'btn-danger');
      modal('modalEstado').show();
    });

    $('#btnConfirmarEstado').addEventListener('click', async e => {
      const unlock = SS.lock(e.currentTarget, 'Aplicando…');
      const p = lista.find(x => x.id === pendiente), nuevo = p.estado === 'Activo' ? 'Inactivo' : 'Activo';
      const r = await SS.api(RUTA_DIR, { method: 'POST', body: { accion: 'estado', id: p.id, estado: nuevo } });
      unlock(); modal('modalEstado').hide();
      if (!r.ok) { SS.toast(r.mensaje, 'danger'); return; }
      await cargar();
      SS.toast(`Paciente ${nuevo === 'Activo' ? 'activado' : 'inactivado'} correctamente.`, nuevo === 'Activo' ? 'success' : 'secondary');
    });
    await cargar();
  }

  /* =====================================================
     PANTALLA 3.2 · Registro / edición de paciente
     ===================================================== */
  async function initRegistro() {
    const f = $('#formPaciente'); if (!f) return;
    f.addEventListener('submit', e => e.preventDefault()); // evita el envío nativo mientras llegan los datos del servidor
    const editId = +new URLSearchParams(location.search).get('id') || null, btn = $('#btnGuardar');
    const fn = $('#fecha_nacimiento'); fn.max = iso(HOY);

    // El documento es único por institución: lo valida el servidor y su respuesta se marca aquí
    function marcarDoc(dup, msg) { const el = $('#numero_documento'), fb = $('[data-fb="doc"]'); el.setCustomValidity(dup ? 'dup' : ''); fb.textContent = dup ? msg : fb.dataset.default; }
    // Edad, sugerencia de tipo de documento y obligatoriedad del acudiente
    function actualizarEdad() {
      const v = fn.value, aviso = $('#avisoTipo');
      if (!v || parse(v) > HOY) { $('#edadCalc').textContent = 'Edad: —'; aviso.classList.add('d-none'); marcarMenor(false); return; }
      const a = edad(v); $('#edadCalc').textContent = 'Edad: ' + edadTxt(v);
      const esperado = a < 7 ? 'RC' : a < 18 ? 'TI' : 'CC', t = $('#tipo_documento').value;
      if (['RC', 'TI', 'CC'].includes(t) && t !== esperado) { aviso.textContent = `⚠ Por la edad (${a} años) normalmente corresponde ${esperado}.`; aviso.classList.remove('d-none'); }
      else aviso.classList.add('d-none');
      marcarMenor(a < 18);
    }
    function marcarMenor(es) {
      $('#avisoMenor').classList.toggle('d-none', !es);
      $$('.req-ce').forEach(s => s.classList.toggle('d-none', !es));
      ['ce_nombre', 'ce_parentesco', 'ce_telefono'].forEach(id => $('#' + id).required = es);
    }
    ['tipo_documento', 'numero_documento'].forEach(id => $('#' + id).addEventListener('input', () => marcarDoc(false)));
    $('#tipo_documento').addEventListener('change', () => { marcarDoc(false); actualizarEdad(); });
    fn.addEventListener('input', actualizarEdad);
    $$('input[name=sexo]').forEach(r => r.addEventListener('change', () => $('#errSexo').classList.add('d-none')));

    // Modo edición (RF-PAC-01): los datos vienen de la BD; en alta solo se pide el nombre de la institución
    if (editId) {
      const r = await SS.api(RUTA_REG + '?accion=obtener&id=' + editId);
      if (!r.ok) { SS.toast(r.mensaje, 'danger'); btn.disabled = true; return; }
      const p = r.datos.paciente; ponerInstitucion(r.datos.institucion);
      $('#tituloForm').textContent = 'Modificar información del paciente'; $('#crumbForm').textContent = 'Modificar';
      $('#subtituloForm').innerHTML = `Editando: <strong>${esc(nombreCompleto(p))}</strong> · Los cambios quedan registrados en auditoría.`;
      $('#btnGuardar').innerHTML = '💾 Guardar cambios';
      $('#tipo_documento').value = p.tipo; $('#numero_documento').value = p.doc; $('#nombres').value = p.nombres; $('#apellidos').value = p.apellidos;
      fn.value = p.nac; $(`input[name=sexo][value="${p.sexo}"]`).checked = true; $('#eps').value = p.eps || '';
      $('#telefono').value = p.tel; $('#correo').value = p.correo || ''; $('#direccion').value = p.dir || '';
      $('#ce_nombre').value = p.ce_nombre || ''; $('#ce_parentesco').value = p.ce_parentesco || ''; $('#ce_telefono').value = p.ce_tel || ''; $('#estado').value = p.estado;
      actualizarEdad();
    } else {
      const r = await SS.api(RUTA_REG + '?accion=contexto');
      if (!r.ok) { SS.toast(r.mensaje, 'danger'); btn.disabled = true; return; }
      ponerInstitucion(r.datos.institucion);
    }

    f.addEventListener('reset', () => { f.classList.remove('was-validated'); setTimeout(() => { $('#avisoTipo').classList.add('d-none'); $('#edadCalc').textContent = 'Edad: —'; marcarMenor(false); marcarDoc(false); }, 0); });

    f.addEventListener('submit', async e => {
      e.preventDefault(); if (btn.disabled) return;
      marcarDoc(false);
      const sexo = $('input[name=sexo]:checked');
      $('#errSexo').classList.toggle('d-none', !!sexo);
      if (fn.value && parse(fn.value) > HOY) fn.setCustomValidity('futura'); else fn.setCustomValidity('');
      f.classList.add('was-validated');
      if (!f.checkValidity() || !sexo) { (f.querySelector(':invalid') || $('#errSexo')).scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      const unlock = SS.lock(btn, 'Guardando…');   // RNF-USA-03: evita inserciones duplicadas
      const r = await SS.api(RUTA_REG, { method: 'POST', body: {
        accion: editId ? 'editar' : 'crear', id: editId,
        tipo_documento: $('#tipo_documento').value, numero_documento: $('#numero_documento').value.trim(),
        nombres: $('#nombres').value.trim(), apellidos: $('#apellidos').value.trim(), fecha_nacimiento: fn.value, sexo: sexo.value,
        eps: $('#eps').value.trim(), telefono: $('#telefono').value.trim(), correo: $('#correo').value.trim(), direccion: $('#direccion').value.trim(),
        ce_nombre: $('#ce_nombre').value.trim(), ce_parentesco: $('#ce_parentesco').value, ce_telefono: $('#ce_telefono').value.trim(), estado: $('#estado').value } });
      if (!r.ok) {
        unlock();
        if (r.datos && r.datos.campo === 'doc') marcarDoc(true, r.mensaje);
        SS.toast(r.mensaje, 'danger');
        return;
      }
      SS.toast(editId ? 'Datos del paciente actualizados.' : 'Paciente registrado correctamente.');
      setTimeout(() => { location.href = 'directorio_pacientes.html'; }, 1300); // el botón permanece deshabilitado
    });
  }

  /* =====================================================
     PANTALLA 3.3 · Ficha integral e historial
     ===================================================== */
  async function initExpediente() {
    if (document.body.dataset.page !== 'expediente_paciente') return;
    const id = +new URLSearchParams(location.search).get('id');
    const r = await SS.api(RUTA_EXP + '?accion=expediente&id=' + id);
    if (!r.ok) { $('#expNoEncontrado').classList.remove('d-none'); if (r.estado !== 404) SS.toast(r.mensaje, 'danger'); return; }
    const { paciente: p, resumen, citas, atenciones, ve_detalle_clinico: veDetalle } = r.datos, a = edad(p.nac);
    ponerInstitucion(r.datos.institucion);
    $('#expContenido').classList.remove('d-none');

    $('#fAvatar').textContent = iniciales(p);
    $('#fNombre').textContent = nombreCompleto(p);
    $('#fSub').textContent = `${p.tipo} ${p.doc} · ${edadTxt(p.nac)} · ${p.sexo}`;
    $('#fBadges').innerHTML = `<span class="badge bg-${p.estado === 'Activo' ? 'success' : 'secondary'}">${p.estado}</span> ` +
      (a < 18 ? '<span class="badge badge-menor">Menor de edad</span> ' : '') + (p.eps ? `<span class="badge bg-primary">EPS: ${esc(p.eps)}</span>` : '');
    $('#btnEditar').href = `registro_paciente.html?id=${p.id}`;

    const dato = (t, v, cls) => `<div class="${cls || 'col-md-6'}"><dt>${t}</dt><dd>${esc(v || '—')}</dd></div>`;
    $('#fDatos').innerHTML = dato('Fecha de nacimiento', fmt(p.nac)) + dato('Edad', edadTxt(p.nac)) + dato('Sexo biológico', p.sexo) + dato('Teléfono', p.tel) +
      dato('Correo electrónico', p.correo) + dato('EPS', p.eps) + dato('Dirección residencial', p.dir, 'col-12') + dato('Fecha de registro', fmt(p.registro));
    $('#fEmergencia').innerHTML = p.ce_nombre
      ? `<dt>Nombre</dt><dd>${esc(p.ce_nombre)}</dd><dt>Parentesco</dt><dd>${esc(p.ce_parentesco || '—')}</dd><dt>Teléfono</dt><dd>${esc(p.ce_tel || '—')}</dd>`
      : '<p class="text-muted mb-0">No se registró contacto de emergencia.</p>';

    // El resumen lo calcula el servidor sobre TODAS las citas, no solo las de la página cargada
    $('#fResumen').innerHTML = [['Citas totales', resumen.total], ['Atendidas', resumen.atendidas], ['Inasistencias', resumen.inasistencias], ['Canceladas', resumen.canceladas],
      ['Próxima cita', resumen.proxima ? fmt(resumen.proxima) : 'Sin programar']].map(([l, v]) => `<div class="col-6 col-md"><div class="resumen-chip"><strong>${esc(v)}</strong><small>${l}</small></div></div>`).join('');

    /* Citas: se piden de 10 en 10 y el filtro de estado lo aplica el servidor */
    const filaCita = c => `<tr>
        <td>${fmt(c.fecha)}</td><td>${c.hora}</td><td>${esc(c.medico)}</td><td>${esc(c.esp)}</td><td>${esc(c.consultorio)}</td><td>${esc(c.tipo)}</td>
        <td><span class="badge bg-${BADGE_CITA[c.estado]}">${c.estado}</span>${c.motivoCanc ? `<span class="cell-sub">${esc(c.motivoCanc)}</span>` : ''}</td></tr>`;
    let pagCitas = 1, filasCitas = citas.filas, totalCitas = citas.total;
    const masCitas = botonCargarMas($('#tablaCitas').closest('.table-responsive') || $('#tablaCitas').closest('table'), 'Cargar más citas', async () => {
      pagCitas++; await cargarCitas(false);
    });
    function pintarCitas() {
      $('#tablaCitas').innerHTML = filasCitas.length ? filasCitas.map(filaCita).join('') : '<tr><td colspan="7" class="text-center text-muted py-4">Sin citas para este filtro.</td></tr>';
      masCitas.mostrar(filasCitas.length < totalCitas);
    }
    async function cargarCitas(reiniciar) {
      if (reiniciar) pagCitas = 1;
      const rc = await SS.api(`${RUTA_EXP}?accion=citas&id=${id}&pagina=${pagCitas}&estado=${encodeURIComponent($('#filtroCita').value)}`);
      if (!rc.ok) { SS.toast(rc.mensaje, 'danger'); return; }
      filasCitas = reiniciar ? rc.datos.filas : filasCitas.concat(rc.datos.filas); totalCitas = rc.datos.total; pintarCitas();
    }
    $('#filtroCita').addEventListener('change', () => cargarCitas(true)); pintarCitas();

    /* Atenciones: línea de tiempo por páginas. El detalle clínico solo llega si quien consulta es Médico */
    let pagAt = 1, filasAt = atenciones.filas, totalAt = atenciones.total;
    const masAtenciones = botonCargarMas($('#lineaAtenciones'), 'Cargar más atenciones', async () => {
      pagAt++;
      const ra = await SS.api(`${RUTA_EXP}?accion=atenciones&id=${id}&pagina=${pagAt}`);
      if (!ra.ok) { SS.toast(ra.mensaje, 'danger'); return; }
      filasAt = filasAt.concat(ra.datos.filas); totalAt = ra.datos.total; pintarAtenciones();
    });
    function pintarAtenciones() {
      $('#lineaAtenciones').innerHTML = filasAt.length ? filasAt.map(t => `<li class="timeline-item"><div class="timeline-card">
        <div class="d-flex flex-wrap justify-content-between gap-2">
          <h3>${esc(t.motivo)}</h3><span class="badge bg-success">${esc(t.estado)}</span></div>
        <div class="timeline-meta">📅 ${fmt(t.fecha)} · ${esc(t.inicio)}–${esc(t.fin)} · ${esc(t.medico)} (${esc(t.esp)})</div>
        ${veDetalle ? `<button class="btn btn-sm btn-link px-0 mt-1" type="button" data-bs-toggle="collapse" data-bs-target="#det${t.id}" aria-expanded="false">Ver detalle clínico</button>
        <div class="collapse" id="det${t.id}"><dl class="timeline-detail mb-0 mt-2">
          <dt>Enfermedad actual</dt><dd>${esc(t.ea)}</dd><dt>Examen físico</dt><dd>${esc(t.ef)}</dd></dl></div>`
          : '<div class="small text-muted mt-1">🔒 El detalle clínico solo está disponible para el personal médico.</div>'}
        </div></li>`).join('') : '<li class="text-muted">Este paciente aún no registra atenciones médicas.</li>';
      masAtenciones.mostrar(filasAt.length < totalAt);
    }
    pintarAtenciones();
  }

  document.addEventListener('DOMContentLoaded', () => { initDirectorio(); initRegistro(); initExpediente(); });
})();
