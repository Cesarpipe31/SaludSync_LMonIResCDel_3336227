/* ===== SaludSync · Módulo 4: Profesionales de la Salud y Especialidades (datos desde controls/profesionales/*.php) ===== */
(function () {
  'use strict';

  /* ---------- Utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const modal = id => bootstrap.Modal.getOrCreateInstance(document.getElementById(id));
  const hl = (texto, q) => {
    if (!q) return esc(texto);
    const i = norm(texto).indexOf(q); if (i < 0) return esc(texto);
    return esc(texto.slice(0, i)) + '<mark class="hl">' + esc(texto.slice(i, i + q.length)) + '</mark>' + esc(texto.slice(i + q.length));
  };
  const nombreCompleto = p => `${p.nombres} ${p.apellidos}`;
  const iniciales = p => (p.nombres[0] + p.apellidos[0]).toUpperCase();

  /* ---------- Datos: llegan del servidor (controls/profesionales/*.php); la institución sale de la sesión ---------- */
  const RUTA_DIR = 'controls/profesionales/directorio_profesionales.php', RUTA_REG = 'controls/profesionales/registro_profesional.php', RUTA_ESP = 'controls/profesionales/especialidades_medicas.php';
  const ponerInstitucion = nombre => { $$('[data-inst-nombre]').forEach(e => { e.textContent = nombre || '—'; }); const r = $('#instReadonly'); if (r) r.value = nombre || ''; };
  const espChips = (p, catalogo) => p.esp.map(id => { const e = catalogo.find(x => x.id === id); return e ? `<span class="esp-chip ${e.estado === 'Inactivo' ? 'off' : ''}">${esc(e.nombre)}</span>` : ''; }).join('');

  // Marca un campo cuya unicidad rechazó el servidor (tarjeta, documento, correo, código, nombre)
  function marcar(el, dup, msg, clave) { el.setCustomValidity(dup ? 'dup' : ''); const fb = $(`[data-fb="${clave}"]`); fb.textContent = dup ? msg : fb.dataset.default; }

  /* =====================================================
     PANTALLA 4.1 · Directorio de profesionales
     ===================================================== */
  async function initDirectorio() {
    const tbody = $('#tablaProfesionales'); if (!tbody) return;
    let pagina = 1, pendiente = null, lista = [], total = 0, limite = 6, catalogo = [], puedeEscribir = false, secuencia = 0, temporizador = null, filtroListo = false;
    const esGrupo = () => $('input[name=vista]:checked').value === 'grupo';

    // Pide al servidor solo lo que se ve: una página (vista lista) o todos los que coinciden (vista agrupada)
    async function cargar() {
      const mia = ++secuencia;
      const params = new URLSearchParams({ accion: 'listar', q: $('#buscador').value.trim(), esp: $('#filtroEsp').value, estado: $('#filtroEstado').value });
      if (esGrupo()) params.set('todos', '1'); else params.set('pagina', pagina);
      const r = await SS.api(RUTA_DIR + '?' + params);
      if (mia !== secuencia) return;                 // llegó una respuesta más nueva: esta se descarta
      if (!r.ok) { SS.toast(r.mensaje || 'No fue posible cargar los profesionales.', 'danger'); return; }
      const d = r.datos;
      lista = d.profesionales; total = d.total; limite = d.limite; pagina = d.pagina; catalogo = d.especialidades; puedeEscribir = d.puede_escribir;
      if (!filtroListo) { $('#filtroEsp').innerHTML += catalogo.map(e => `<option value="${e.id}">${esc(e.nombre)}</option>`).join(''); filtroListo = true; }
      ponerInstitucion(d.institucion);
      $('#kpiTotal').textContent = d.kpis.total; $('#kpiActivos').textContent = d.kpis.activos;
      $('#kpiInactivos').textContent = d.kpis.inactivos; $('#kpiEsp').textContent = d.kpis.esp_activas;
      render();
    }

    function render() {
      const q = norm($('#buscador').value.trim()), grupo = esGrupo();
      $('#vistaLista').classList.toggle('d-none', grupo); $('#vistaAgrupada').classList.toggle('d-none', !grupo);

      if (grupo) {
        const grupos = catalogo.map(e => ({ e, ps: lista.filter(p => p.esp.includes(e.id)) })).filter(g => g.ps.length);
        $('#vistaAgrupada').innerHTML = grupos.length ? grupos.map(g => `<div class="col-md-6 col-xl-4"><div class="grupo-card">
          <div class="grupo-head"><div><strong>${esc(g.e.nombre)}</strong><span class="cell-sub">${esc(g.e.codigo)}${g.e.estado === 'Inactivo' ? ' · Inactiva' : ''}</span></div><span class="badge bg-primary">${g.ps.length}</span></div>
          <ul class="list-group list-group-flush">${g.ps.map(p => `<li class="list-group-item d-flex justify-content-between align-items-center">
            <span><span class="dot ${p.estado === 'Activo' ? 'dot-on' : 'dot-off'}"></span>${esc(nombreCompleto(p))}</span><span class="chip-tp">${esc(p.tarjeta)}</span></li>`).join('')}</ul></div></div>`).join('')
          : '<div class="col-12"><div class="alert alert-light border text-center">No hay profesionales con los filtros aplicados.</div></div>';
      } else {
        const paginas = Math.max(1, Math.ceil(total / limite)), ini = (pagina - 1) * limite;
        tbody.innerHTML = lista.length ? lista.map(p => {
          const activo = p.estado === 'Activo';
          return `<tr>
            <td><div class="d-flex align-items-center gap-2"><span class="avatar-prof">${esc(iniciales(p))}</span>
              <div><strong>${hl(nombreCompleto(p), q)}</strong><span class="cell-sub">${esc(p.correo)}</span></div></div></td>
            <td>${esc(p.tipo)} ${hl(p.doc, q)}</td>
            <td><span class="chip-tp">${hl(p.tarjeta, q)}</span></td>
            <td>${espChips(p, catalogo)}</td>
            <td>${esc(p.sede || '—')}</td>
            <td><span class="badge bg-${activo ? 'success' : 'secondary'}">${p.estado}</span></td>
            <td class="text-end text-nowrap">
              <button class="btn btn-sm btn-outline-primary" data-act="ver" data-id="${p.id}" title="Ver detalle">👁</button>
              ${puedeEscribir ? `<a class="btn btn-sm btn-outline-primary" href="registro_profesional.html?id=${p.id}" title="Editar profesional">✏️</a>
              <button class="btn btn-sm ${activo ? 'btn-outline-danger' : 'btn-outline-success'}" data-act="estado" data-id="${p.id}" title="${activo ? 'Inactivar' : 'Activar'} profesional">${activo ? '⏸' : '▶'}</button>` : ''}
            </td></tr>`;
        }).join('') : '<tr><td colspan="7" class="text-center text-muted py-4">No se encontraron profesionales con los filtros aplicados.</td></tr>';
        $('#contador').textContent = total ? `Mostrando ${ini + 1}–${ini + lista.length} de ${total} profesionales` : 'Sin resultados';
        let pg = `<li class="page-item ${pagina === 1 ? 'disabled' : ''}"><button class="page-link" data-p="${pagina - 1}">«</button></li>`;
        for (let n = 1; n <= paginas; n++) pg += `<li class="page-item ${n === pagina ? 'active' : ''}"><button class="page-link" data-p="${n}">${n}</button></li>`;
        pg += `<li class="page-item ${pagina === paginas ? 'disabled' : ''}"><button class="page-link" data-p="${pagina + 1}">»</button></li>`;
        $('#paginacion').innerHTML = pg;
      }
    }

    const recargar = () => { pagina = 1; cargar(); };
    $('#buscador').addEventListener('input', () => { clearTimeout(temporizador); temporizador = setTimeout(recargar, 300); }); // búsqueda en tiempo real, sin una petición por tecla
    $('#filtroEsp').addEventListener('change', recargar);
    $('#filtroEstado').addEventListener('change', recargar);
    $$('input[name=vista]').forEach(r => r.addEventListener('change', recargar));
    $('#btnLimpiar').addEventListener('click', () => { $('#buscador').value = ''; $('#filtroEsp').value = ''; $('#filtroEstado').value = ''; recargar(); });
    $('#paginacion').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b && !b.parentElement.classList.contains('disabled')) { pagina = +b.dataset.p; cargar(); } });

    tbody.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const p = lista.find(x => x.id === +b.dataset.id);
      if (b.dataset.act === 'estado') {
        pendiente = p.id; const activar = p.estado !== 'Activo';
        $('#modalEstadoTitulo').textContent = activar ? 'Activar profesional' : 'Inactivar profesional';
        $('#modalEstadoCuerpo').innerHTML = activar
          ? `¿Desea reactivar a <strong>${esc(nombreCompleto(p))}</strong>? Podrá recibir nuevas asignaciones de citas.`
          : `¿Desea inactivar a <strong>${esc(nombreCompleto(p))}</strong>? <span class="text-danger">No se le podrán asignar nuevas citas</span>; su historial asistencial se conserva.`;
        $('#btnConfirmarEstado').className = 'btn ' + (activar ? 'btn-success' : 'btn-danger');
        modal('modalEstado').show();
      } else {
        $('#detalleTitulo').textContent = nombreCompleto(p);
        $('#detalleCuerpo').innerHTML = `<div class="row g-3 small">
          <div class="col-md-6"><strong>Documento:</strong> ${esc(p.tipo)} ${esc(p.doc)}</div>
          <div class="col-md-6"><strong>Tarjeta profesional:</strong> <span class="chip-tp">${esc(p.tarjeta)}</span></div>
          <div class="col-md-6"><strong>Correo:</strong> ${esc(p.correo)}</div>
          <div class="col-md-6"><strong>Teléfono:</strong> ${esc(p.tel || '—')}</div>
          <div class="col-md-6"><strong>Institución:</strong> ${esc($('[data-inst-nombre]') ? $('[data-inst-nombre]').textContent : '—')}</div>
          <div class="col-md-6"><strong>Sede(s) de atención:</strong> ${esc(p.sede || 'Sin agenda configurada')}</div>
          <div class="col-md-6"><strong>Estado:</strong> ${p.estado}</div>
          <div class="col-md-6"><strong>Cuenta de usuario:</strong> Vinculada (#${p.uid})</div>
          <div class="col-12"><strong>Especialidades habilitadas:</strong><br>${espChips(p, catalogo)}</div></div>`;
        modal('modalDetalle').show();
      }
    });

    $('#btnConfirmarEstado').addEventListener('click', async e => {
      const unlock = SS.lock(e.currentTarget, 'Aplicando…');
      const p = lista.find(x => x.id === pendiente), nuevo = p.estado === 'Activo' ? 'Inactivo' : 'Activo';
      const r = await SS.api(RUTA_DIR, { method: 'POST', body: { accion: 'estado', id: p.id, estado: nuevo } });
      unlock(); modal('modalEstado').hide();
      if (!r.ok) { SS.toast(r.mensaje, 'danger'); return; }
      await cargar();
      SS.toast(`Profesional ${nuevo === 'Activo' ? 'activado' : 'inactivado'} correctamente.`, nuevo === 'Activo' ? 'success' : 'secondary');
    });
    await cargar();
  }

  /* =====================================================
     PANTALLA 4.2 · Registro / edición de profesional
     ===================================================== */
  async function initRegistro() {
    const f = $('#formProfesional'); if (!f) return;
    f.addEventListener('submit', e => e.preventDefault()); // evita el envío nativo mientras llegan los datos del servidor
    const editId = +new URLSearchParams(location.search).get('id') || null, btn = $('#btnGuardar');

    // La sede y la dirección no tienen columna en el esquema: no se guardan, así que se muestran inactivas y con la explicación
    $('#sede').innerHTML = '<option value="">No se almacena en esta versión</option>'; $('#sede').required = false; $('#sede').disabled = true;
    $('#direccion').disabled = true; $('#direccion').placeholder = 'No se almacena en esta versión';

    // Datos desde el servidor: en alta, el catálogo de especialidades activas; en edición, el profesional y su catálogo
    let profesional = null, catalogo = [];
    const r0 = await SS.api(RUTA_REG + (editId ? '?accion=obtener&id=' + editId : '?accion=contexto'));
    if (!r0.ok) { SS.toast(r0.mensaje, 'danger'); btn.disabled = true; return; }
    catalogo = r0.datos.especialidades; profesional = editId ? r0.datos.profesional : null;
    ponerInstitucion(r0.datos.institucion);

    $('#espGrid').innerHTML = catalogo.map(e => `<div class="col-sm-6 col-lg-4"><div class="form-check svc">
      <input class="form-check-input" type="checkbox" name="especialidades" value="${e.id}" id="esp_${e.id}">
      <label class="form-check-label" for="esp_${e.id}">${esc(e.nombre)}${e.estado === 'Inactivo' ? ' <span class="badge bg-secondary">Inactiva</span>' : ''}<span class="cell-sub">${esc(e.codigo)}</span></label></div></div>`).join('')
      || '<div class="col-12 text-muted small">No hay especialidades activas. Cree una en el catálogo de especialidades.</div>';
    const contar = () => { const n = $$('input[name=especialidades]:checked').length; $('#espCount').textContent = `${n} seleccionada${n === 1 ? '' : 's'}`; $('#errEsp').classList.toggle('d-none', n > 0); };
    $('#espGrid').addEventListener('change', contar);

    const limpiarMarcas = () => { marcar($('#tarjeta'), false, '', 'tarjeta'); marcar($('#numero_documento'), false, '', 'doc'); marcar($('#correo'), false, '', 'correo'); };
    $('#tarjeta').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, ''); limpiarMarcas(); });
    ['tipo_documento', 'numero_documento', 'correo'].forEach(id => $('#' + id).addEventListener('input', limpiarMarcas));
    $('#tipo_documento').addEventListener('change', limpiarMarcas);

    if (profesional) {
      const p = profesional;
      $('#tituloForm').textContent = 'Modificar profesional de la salud'; $('#crumbForm').textContent = 'Modificar';
      $('#subtituloForm').innerHTML = `Editando: <strong>${esc(nombreCompleto(p))}</strong> · Institución: <strong>${esc(r0.datos.institucion)}</strong>`;
      btn.innerHTML = '💾 Guardar cambios'; $('#avisoUsuario').classList.add('d-none');
      if (p.estado === 'Bloqueado') { const o = document.createElement('option'); o.textContent = 'Bloqueado'; $('#estado').appendChild(o); } // cuenta bloqueada por intentos fallidos
      $('#nombres').value = p.nombres; $('#apellidos').value = p.apellidos; $('#tipo_documento').value = p.tipo; $('#numero_documento').value = p.doc;
      $('#correo').value = p.correo; $('#telefono').value = p.tel; $('#tarjeta').value = p.tarjeta; $('#estado').value = p.estado;
      p.esp.forEach(id => { const c = $('#esp_' + id); if (c) c.checked = true; });
    }
    contar(); if (!$$('input[name=especialidades]:checked').length) $('#errEsp').classList.add('d-none');

    f.addEventListener('reset', () => { f.classList.remove('was-validated'); setTimeout(() => { contar(); $('#errEsp').classList.add('d-none'); limpiarMarcas(); }, 0); });

    f.addEventListener('submit', async e => {
      e.preventDefault(); if (btn.disabled) return;
      limpiarMarcas();
      const sel = $$('input[name=especialidades]:checked').map(c => +c.value);
      $('#errEsp').classList.toggle('d-none', sel.length > 0);
      f.classList.add('was-validated');
      if (!f.checkValidity() || !sel.length) { (f.querySelector(':invalid') || $('#errEsp')).scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      const unlock = SS.lock(btn, 'Guardando…');
      const r = await SS.api(RUTA_REG, { method: 'POST', body: {
        accion: editId ? 'editar' : 'crear', id: editId, nombres: $('#nombres').value.trim(), apellidos: $('#apellidos').value.trim(),
        tipo_documento: $('#tipo_documento').value, numero_documento: $('#numero_documento').value.trim(), correo: $('#correo').value.trim(),
        telefono: $('#telefono').value.trim(), tarjeta: $('#tarjeta').value.trim(), estado: $('#estado').value, especialidades: sel } });
      if (!r.ok) {
        unlock();
        const campo = r.datos && r.datos.campo;
        if (campo === 'tarjeta') marcar($('#tarjeta'), true, r.mensaje, 'tarjeta');
        if (campo === 'doc') marcar($('#numero_documento'), true, r.mensaje, 'doc');
        if (campo === 'correo') marcar($('#correo'), true, r.mensaje, 'correo');
        SS.toast(r.mensaje, 'danger');
        return;
      }
      if (editId) {
        SS.toast('Profesional actualizado correctamente.');
        setTimeout(() => { location.href = 'directorio_profesionales.html'; }, 1400); // el botón permanece deshabilitado
        return;
      }
      // Alta: la clave temporal de la cuenta solo se muestra ahora (no se guarda en claro ni se envía por correo)
      unlock(); btn.disabled = true;
      f.addEventListener('input', () => { btn.disabled = false; }, { once: true }); // se libera si el usuario empieza otro registro
      const cred = r.datos.credenciales, caja = document.createElement('div');
      caja.className = 'alert alert-success py-2 small mt-3 mb-0'; caja.id = 'credencialesProf';
      const titulo = document.createElement('strong'); titulo.textContent = 'Profesional registrado.';
      const linea = document.createElement('div'); linea.textContent = `Cuenta de acceso: ${cred.correo} · Clave temporal: ${cred.clave}`;
      const aviso = document.createElement('div'); aviso.textContent = 'Anótela ahora: no se vuelve a mostrar. Entréguela al profesional por un canal seguro.';
      const volver = document.createElement('a'); volver.href = 'directorio_profesionales.html'; volver.className = 'btn btn-sm btn-success mt-2'; volver.textContent = 'Ir al directorio';
      caja.append(titulo, linea, aviso, volver);
      const previa = $('#credencialesProf'); if (previa) previa.remove();
      $('#avisoUsuario').after(caja); caja.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* =====================================================
     PANTALLA 4.3 · Catálogo de especialidades
     ===================================================== */
  async function initEspecialidades() {
    const tbody = $('#tablaEsp'); if (!tbody) return;
    const f = $('#formEsp'), btn = $('#btnGuardarEsp'); let editId = null, lista = [];

    async function cargar() {
      const r = await SS.api(RUTA_ESP + '?accion=listar');
      if (!r.ok) { SS.toast(r.mensaje || 'No fue posible cargar las especialidades.', 'danger'); return; }
      lista = r.datos.especialidades; ponerInstitucion(r.datos.institucion);
      $('#kpiTotal').textContent = r.datos.kpis.total; $('#kpiActivas').textContent = r.datos.kpis.activas;
      $('#kpiMedicos').textContent = r.datos.kpis.medicos; $('#kpiSinMedico').textContent = r.datos.kpis.sin_medico;
      render();
    }

    const limpiarMarcas = () => { marcar($('#esp_codigo'), false, '', 'codigo'); marcar($('#esp_nombre'), false, '', 'nombre'); };
    $('#esp_codigo').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, ''); limpiarMarcas(); });
    $('#esp_nombre').addEventListener('input', limpiarMarcas);
    $('#esp_desc').addEventListener('input', e => $('#descCount').textContent = e.target.value.length);

    function salirEdicion() {
      editId = null; f.reset(); f.classList.remove('was-validated');
      $('#tituloEsp').textContent = '➕ Nueva especialidad'; $('#btnCancelarEsp').classList.add('d-none'); $('#descCount').textContent = '0';
      limpiarMarcas(); render();
    }
    $('#btnCancelarEsp').addEventListener('click', salirEdicion);

    function render() {
      const q = norm($('#buscaEsp').value.trim()), fe = $('#estadoEsp').value;
      const visibles = lista.filter(e => (!q || norm(e.nombre).includes(q) || norm(e.codigo).includes(q)) && (!fe || e.estado === fe));
      const max = Math.max(1, ...lista.map(e => e.medicos.length));
      tbody.innerHTML = visibles.length ? visibles.map(e => {
        const n = e.medicos.length;
        return `<tr class="${e.id === editId ? 'row-editando' : ''}">
          <td><span class="codigo-esp">${esc(e.codigo)}</span></td>
          <td><strong>${esc(e.nombre)}</strong><span class="cell-sub">${esc((e.desc || '').slice(0, 70))}${(e.desc || '').length > 70 ? '…' : ''}</span></td>
          <td style="min-width:140px"><button class="btn btn-link btn-sm p-0 text-decoration-none" data-act="medicos" data-id="${e.id}" title="Ver médicos vinculados">👨‍⚕️ ${n} médico${n === 1 ? '' : 's'}</button>
            <div class="bar-medicos mt-1"><span style="width:${Math.round(n / max * 100)}%"></span></div></td>
          <td><span class="badge bg-${e.estado === 'Activo' ? 'success' : 'secondary'}">${e.estado}</span></td>
          <td class="text-end text-nowrap"><button class="btn btn-sm btn-outline-primary" data-act="editar" data-id="${e.id}" title="Editar especialidad">✏️</button></td></tr>`;
      }).join('') : '<tr><td colspan="5" class="text-center text-muted py-4">No hay especialidades para mostrar.</td></tr>';
    }
    $('#buscaEsp').addEventListener('input', render); $('#estadoEsp').addEventListener('change', render);

    tbody.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const esp = lista.find(x => x.id === +b.dataset.id);
      if (b.dataset.act === 'editar') {
        editId = esp.id; f.classList.remove('was-validated');
        $('#esp_codigo').value = esp.codigo; $('#esp_nombre').value = esp.nombre; $('#esp_desc').value = esp.desc || ''; $('#esp_estado').value = esp.estado;
        $('#descCount').textContent = (esp.desc || '').length;
        $('#tituloEsp').textContent = '✏️ Editar especialidad'; $('#btnCancelarEsp').classList.remove('d-none');
        limpiarMarcas(); render(); $('#esp_nombre').focus();
      } else {
        $('#modalMedicosTitulo').textContent = `${esp.nombre} · médicos activos`;
        $('#modalMedicosCuerpo').innerHTML = esp.medicos.length ? `<ul class="list-group list-group-flush">${esp.medicos.map(p => `<li class="list-group-item d-flex justify-content-between align-items-center">
          <span><strong>${esc(p.nombre)}</strong></span><span class="chip-tp">${esc(p.tarjeta)}</span></li>`).join('')}</ul>`
          : '<p class="text-muted mb-0">Esta especialidad no tiene médicos activos vinculados.</p>';
        modal('modalMedicos').show();
      }
    });

    f.addEventListener('submit', async e => {
      e.preventDefault(); if (btn.disabled) return;
      limpiarMarcas(); f.classList.add('was-validated'); if (!f.checkValidity()) return;
      const unlock = SS.lock(btn, 'Guardando…');
      const edit = !!editId;
      const r = await SS.api(RUTA_ESP, { method: 'POST', body: { accion: 'guardar', id: editId, codigo: $('#esp_codigo').value.trim().toUpperCase(),
        nombre: $('#esp_nombre').value.trim(), desc: $('#esp_desc').value.trim(), estado: $('#esp_estado').value } });
      unlock();
      if (!r.ok) {
        const campo = r.datos && r.datos.campo;
        if (campo === 'codigo') marcar($('#esp_codigo'), true, r.mensaje, 'codigo');
        if (campo === 'nombre') marcar($('#esp_nombre'), true, r.mensaje, 'nombre');
        SS.toast(r.mensaje, 'danger');
        return;
      }
      await cargar(); salirEdicion();
      SS.toast(edit ? 'Especialidad actualizada correctamente.' : 'Especialidad creada correctamente.');
    });
    await cargar();
  }

  document.addEventListener('DOMContentLoaded', () => { initDirectorio(); initRegistro(); initEspecialidades(); });
})();
