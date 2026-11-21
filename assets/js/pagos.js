/* ===== SaludSync · Módulo 16: Pasarela de Pagos y Transacciones (mockup interactivo, sin backend) ===== */
(function () {
  'use strict';

  /* ---------- Utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const COP = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fmt = s => new Date(s + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  const HOY = new Date(); HOY.setHours(0, 0, 0, 0);
  const modal = id => bootstrap.Modal.getOrCreateInstance(document.getElementById(id));
  const BADGE_ESTADO = { 'Pendiente': 'secondary', 'Pagada': 'success', 'Mora': 'danger', 'Anulada': 'dark' };

  /* ---------- Datos: llegan del servidor (controls/pagos/*.php); ya no hay datos de ejemplo ---------- */
  const DB = { transacciones: [] };
  const transDe = id => DB.transacciones.find(t => t.id === id);
  const SESION = (() => { try { return JSON.parse(sessionStorage.getItem('saludsync_sesion')) || {}; } catch (e) { return {}; } })();
  const ES_ADMIN_IPS = SESION.rolId === 2; // solo mejora la pantalla: quien decide es el servidor
  const RUTA_HIST = 'controls/pagos/historial_transacciones.php', RUTA_PAGO = 'controls/pagos/checkout_pago.php';
  const NOMBRE_MEDIO = { tarjeta: 'Tarjeta de Crédito/Débito', pse: 'PSE', nequi: 'Nequi', daviplata: 'Daviplata', efecty: 'Efecty' };

  /* =====================================================
     PANTALLA 16.1 · Checkout de pago
     ===================================================== */
  async function initCheckout() {
    const f = $('#formPago'); if (!f) return;
    const detalleMetodo = $('#detalleMetodo');
    const datosTarjeta = $('#datosTarjeta');
    const datosBilletera = $('#datosBilletera');
    const datosEfecty = $('#datosEfecty');

    // Mostrar campos según método seleccionado
    $$('input[name="metodo"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const metodo = radio.value;
        detalleMetodo.classList.remove('d-none');
        datosTarjeta.classList.toggle('d-none', metodo !== 'tarjeta');
        datosBilletera.classList.toggle('d-none', !['nequi', 'daviplata'].includes(metodo));
        datosEfecty.classList.toggle('d-none', metodo !== 'efecty');
        $('#errMetodo').classList.add('d-none');
      });
    });

    // Formatear número de tarjeta
    const numTarjeta = $('#numero_tarjeta');
    if (numTarjeta) {
      numTarjeta.addEventListener('input', e => {
        let v = e.target.value.replace(/\D/g, '').substring(0, 16);
        e.target.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
      });
    }

    // Formatear fecha expiración
    const fechaExp = $('#fecha_exp');
    if (fechaExp) {
      fechaExp.addEventListener('input', e => {
        let v = e.target.value.replace(/\D/g, '').substring(0, 4);
        if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2);
        e.target.value = v;
      });
    }

    // Orden a pagar: la factura de ?factura=FAC-n o, si no se indica, la pendiente más antigua de la institución
    const btn = $('#btnProcesarPago');
    let factura = null;
    ['#referenciaOrden', '#subtotal', '#impuestos', '#total'].forEach(s => { $(s).textContent = '—'; });
    const sinOrden = msg => { SS.toast(msg, 'warning'); btn.disabled = true; $$('input[name="metodo"]').forEach(r => { r.disabled = true; }); };
    const pedida = new URLSearchParams(location.search).get('factura');
    const orden = await SS.api(RUTA_PAGO + '?accion=orden' + (pedida ? '&factura=' + encodeURIComponent(pedida) : ''));
    if (!orden.ok || !orden.datos.factura) {
      sinOrden(orden.mensaje || 'No hay facturas pendientes de pago.');
    } else {
      factura = orden.datos.factura;
      $('#conceptoPago').textContent = factura.concepto; $('#referenciaOrden').textContent = factura.referencia;
      $('#subtotal').textContent = COP(factura.subtotal); $('#impuestos').textContent = COP(factura.impuestos); $('#total').textContent = COP(factura.monto);
    }

    f.addEventListener('submit', async e => {
      e.preventDefault();
      const metodo = $$('input[name="metodo"]:checked')[0];
      if (!metodo) {
        $('#errMetodo').classList.remove('d-none');
        return;
      }
      if (!factura) return;
      if (metodo.value === 'copago') { SS.toast('El copago institucional no está disponible en esta versión.', 'warning'); return; }

      const unlock = SS.lock(btn, 'Procesando...');
      // Solo viajan el número de factura y el medio elegido: número de tarjeta, CVV y celular nunca se envían al servidor
      const r = await SS.api(RUTA_PAGO, { method: 'POST', body: { accion: 'pagar', numero_factura: factura.numero, metodo: metodo.value } });
      if (!r.ok) { unlock(); SS.toast(r.mensaje, 'danger'); return; }

      f.reset(); // no dejar datos de tarjeta escritos en el formulario
      f.classList.add('d-none');
      $('#exitoPago').classList.remove('d-none');
      $('#idTransaccion').textContent = r.datos.numero;
      $('#mensajeExito').textContent = `El pago de ${COP(r.datos.total)} se registró mediante ${NOMBRE_MEDIO[r.datos.medio]}. Pasarela simulada: no se realizó ningún cargo real.`;
      unlock();
    });
  }

  /* =====================================================
     PANTALLA 16.2 · Historial de transacciones
     ===================================================== */
  async function initHistorial() {
    const tbody = $('#tablaTransacciones'); if (!tbody) return;
    const TAM = 10; let pagina = 1;

    function filtrar() {
      const q = norm($('#buscador').value.trim());
      const fc = $('#filtroConcepto').value;
      const fe = $('#filtroEstado').value;
      const fm = $('#filtroMetodo').value;
      const fDesde = $('#fDesde').value;
      const fHasta = $('#fHasta').value;

      return DB.transacciones.filter(t => {
        const okQ = !q || norm(t.id.toString()).includes(q) || norm(t.referencia).includes(q);
        const okC = !fc || t.concepto === fc;
        const okE = !fe || t.estado === fe;
        const okM = !fm || t.metodo.toLowerCase().includes(fm.toLowerCase());
        const okF = (!fDesde || t.fecha >= fDesde) && (!fHasta || t.fecha <= fHasta + ' 23:59:59');
        return okQ && okC && okE && okM && okF;
      });
    }

    function kpis() {
      const lista = filtrar();
      $('#kpiTotal').textContent = lista.length;
      $('#kpiRecaudado').textContent = COP(lista.filter(t => t.estado === 'Pagada').reduce((s, t) => s + t.monto, 0));
      $('#kpiAprobadas').textContent = lista.filter(t => t.estado === 'Pagada').length;
      $('#kpiPendientes').textContent = lista.filter(t => t.estado === 'Pendiente' || t.estado === 'Mora').length;
    }

    function render() {
      const lista = filtrar(), total = lista.length, paginas = Math.max(1, Math.ceil(total / TAM));
      if (pagina > paginas) pagina = paginas;
      const ini = (pagina - 1) * TAM, vista = lista.slice(ini, ini + TAM);

      tbody.innerHTML = vista.length ? vista.map(t => {
        return `<tr>
          <td><strong>#${t.id}</strong></td>
          <td>${fmt(t.fecha)}</td>
          <td>${esc(t.concepto)}<span class="cell-sub">${esc(t.referencia)}</span></td>
          <td>${esc(t.institucion)}</td>
          <td>${esc(t.metodo)}</td>
          <td class="text-end fw-semibold">${COP(t.monto)}</td>
          <td><span class="badge bg-${BADGE_ESTADO[t.estado]}">${t.estado}</span></td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary" data-id="${t.id}" title="Ver detalle">👁</button>
            ${ES_ADMIN_IPS && (t.estado === 'Pendiente' || t.estado === 'Mora') ? `<a class="btn btn-sm btn-success ms-1" href="checkout_pago.html?factura=${encodeURIComponent(t.numero)}" title="Pagar factura">💳</a>` : ''}
          </td>
        </tr>`;
      }).join('') : '<tr><td colspan="8" class="text-center text-muted py-4">No se encontraron transacciones con los filtros aplicados.</td></tr>';

      $('#contador').textContent = total ? `Mostrando ${ini + 1}–${ini + vista.length} de ${total} transacciones` : 'Sin resultados';
      
      let pg = `<li class="page-item ${pagina === 1 ? 'disabled' : ''}"><button class="page-link" data-p="${pagina - 1}">«</button></li>`;
      for (let n = 1; n <= paginas; n++) pg += `<li class="page-item ${n === pagina ? 'active' : ''}"><button class="page-link" data-p="${n}">${n}</button></li>`;
      pg += `<li class="page-item ${pagina === paginas ? 'disabled' : ''}"><button class="page-link" data-p="${pagina + 1}">»</button></li>`;
      $('#paginacion').innerHTML = pg;

      kpis();
    }

    $('#buscador').addEventListener('input', () => { pagina = 1; render(); });
    $('#filtroConcepto').addEventListener('change', () => { pagina = 1; render(); });
    $('#filtroEstado').addEventListener('change', () => { pagina = 1; render(); });
    $('#filtroMetodo').addEventListener('change', () => { pagina = 1; render(); });
    $('#fDesde').addEventListener('change', () => { pagina = 1; render(); });
    $('#fHasta').addEventListener('change', () => { pagina = 1; render(); });
    $('#paginacion').addEventListener('click', e => {
      const b = e.target.closest('[data-p]');
      if (b && !b.parentElement.classList.contains('disabled')) {
        pagina = +b.dataset.p;
        render();
      }
    });

    if (!ES_ADMIN_IPS) $('#btnNuevoPago').classList.add('d-none'); // solo el administrador de la IPS paga
    $('#btnNuevoPago').addEventListener('click', () => {
      window.location.href = 'checkout_pago.html';
    });

    $('#btnExportar').addEventListener('click', () => {
      SS.toast('Función de exportación en desarrollo. Disponible en próxima versión.', 'info');
    });

    tbody.addEventListener('click', e => {
      const b = e.target.closest('[data-id]');
      if (!b) return;
      const t = transDe(+b.dataset.id);
      $('#detalleCuerpo').innerHTML = `<div class="row g-3 small">
        <div class="col-md-6"><strong>ID Transacción:</strong> #${t.id}</div>
        <div class="col-md-6"><strong>Fecha:</strong> ${fmt(t.fecha)}</div>
        <div class="col-md-6"><strong>Concepto:</strong> ${esc(t.concepto)}</div>
        <div class="col-md-6"><strong>Referencia:</strong> ${esc(t.referencia)}</div>
        <div class="col-md-6"><strong>Institución:</strong> ${esc(t.institucion)}</div>
        <div class="col-md-6"><strong>Estado:</strong> <span class="badge bg-${BADGE_ESTADO[t.estado]}">${t.estado}</span></div>
        <div class="col-md-6"><strong>Monto:</strong> ${COP(t.monto)}</div>
        <div class="col-md-6"><strong>Impuestos:</strong> ${COP(t.impuestos)}</div>
        <div class="col-md-6"><strong>Moneda:</strong> ${t.moneda}</div>
        <div class="col-md-6"><strong>Método:</strong> ${esc(t.metodo)}</div>
        <div class="col-md-6"><strong>Vencimiento:</strong> ${fmt(t.vence)}</div>
      </div>`;
      
      $('#btnReembolso').classList.toggle('d-none', t.estado !== 'Pagada');
      modal('modalDetalle').show();
    });

    $('#btnReembolso').addEventListener('click', () => {
      SS.toast('Función de reembolso en desarrollo. Disponible en próxima versión.', 'info');
    });

    const r = await SS.api(RUTA_HIST + '?accion=listar');
    if (r.ok) DB.transacciones = r.datos.transacciones; else SS.toast(r.mensaje, 'danger');
    render();
  }

  /* ---------- Inicialización según página ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    if ($('[data-page="checkout_pago"]')) initCheckout();
    if ($('[data-page="historial_transacciones"]')) initHistorial();
  });
})();
