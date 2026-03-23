/* =====================================================
   evaluaciones-pendientes.js — Evaluaciones / Pendientes | PSA
   Ruta: wwwroot/js/ingforestal/evaluaciones-pendientes.js
   ===================================================== */

/* ── ESTADO GLOBAL ─────────────────────────────────── */
const EP = {
    paginaActual: 1,
    porPagina:    8,
    sortCol:      null,
    sortDir:      'asc',
    idActual:     null,
    fincaActual:  '',
    propActual:   '',
};

/* ═══════════════════════════════════════════════════
   1. FILTRADO
═══════════════════════════════════════════════════ */
function epFiltrar() {
    const busqueda  = (document.getElementById('ep-buscador')?.value  || '').trim().toLowerCase();
    const vegFiltro = document.getElementById('ep-filtro-veg')?.value  || '';
    const priFilter = document.getElementById('ep-filtro-pri')?.value  || '';
    const orden     = document.getElementById('ep-orden')?.value       || 'fecha-desc';

    const filas    = Array.from(document.querySelectorAll('#ep-tbody tr'));
    let   visibles = [];

    filas.forEach(fila => {
        const texto = fila.innerText.toLowerCase();
        const veg   = fila.dataset.veg   || '';
        const pri   = fila.dataset.pri   || '';

        const okBusc = !busqueda  || texto.includes(busqueda);
        const okVeg  = !vegFiltro || veg === vegFiltro;
        const okPri  = !priFilter || pri === priFilter;

        const mostrar = okBusc && okVeg && okPri;
        fila.classList.toggle('oculta', !mostrar);
        if (mostrar) visibles.push(fila);
    });

    // Ordenar
    visibles.sort((a, b) => {
        switch (orden) {
            case 'fecha-desc':     return new Date(b.dataset.fecha)       - new Date(a.dataset.fecha);
            case 'fecha-asc':     return new Date(a.dataset.fecha)       - new Date(b.dataset.fecha);
            case 'nombre-asc':    return (a.dataset.nombre || '').localeCompare(b.dataset.nombre || '');
            case 'espera-desc':   return parseInt(b.dataset.espera || 0) - parseInt(a.dataset.espera || 0);
            case 'hectareas-desc':return parseFloat(b.dataset.hectareas || 0) - parseFloat(a.dataset.hectareas || 0);
            default: return 0;
        }
    });

    const tbody = document.getElementById('ep-tbody');
    visibles.forEach(f => tbody.appendChild(f));

    EP.paginaActual = 1;
    epActualizarPaginacion(visibles.length);
    epMostrarVacio(visibles.length === 0);
}

function epLimpiarFiltros() {
    ['ep-buscador','ep-filtro-veg','ep-filtro-pri','ep-orden'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = id === 'ep-orden' ? 'fecha-desc' : '';
    });
    epFiltrar();
}

/* ═══════════════════════════════════════════════════
   2. PAGINACIÓN
═══════════════════════════════════════════════════ */
function epActualizarPaginacion(total) {
    const totalPags = Math.max(1, Math.ceil(total / EP.porPagina));
    if (EP.paginaActual > totalPags) EP.paginaActual = totalPags;

    const filas = Array.from(document.querySelectorAll('#ep-tbody tr:not(.oculta)'));
    filas.forEach((f, i) => {
        const enPag = i >= (EP.paginaActual - 1) * EP.porPagina &&
                      i <   EP.paginaActual       * EP.porPagina;
        f.style.display = enPag ? '' : 'none';
    });

    const desde = total === 0 ? 0 : (EP.paginaActual - 1) * EP.porPagina + 1;
    const hasta = Math.min(EP.paginaActual * EP.porPagina, total);
    const info  = document.getElementById('ep-pag-info');
    if (info) info.textContent = total === 0
        ? 'Sin resultados'
        : `Mostrando ${desde}–${hasta} de ${total} evaluación${total !== 1 ? 'es' : ''}`;

    epRenderPagBtns(totalPags);
}

function epRenderPagBtns(totalPags) {
    const wrap = document.getElementById('ep-pag-btns');
    if (!wrap) return;
    wrap.innerHTML = '';

    const prev = epCrearPagBtn('<i class="fa-solid fa-chevron-left"></i>', 'Anterior', EP.paginaActual === 1);
    prev.addEventListener('click', () => { if (EP.paginaActual > 1) { EP.paginaActual--; epFiltrar(); } });
    wrap.appendChild(prev);

    for (let p = 1; p <= totalPags; p++) {
        const btn = epCrearPagBtn(p, `Página ${p}`, false);
        if (p === EP.paginaActual) btn.classList.add('activo');
        btn.addEventListener('click', () => { EP.paginaActual = p; epFiltrar(); });
        wrap.appendChild(btn);
    }

    const next = epCrearPagBtn('<i class="fa-solid fa-chevron-right"></i>', 'Siguiente', EP.paginaActual === totalPags);
    next.addEventListener('click', () => { if (EP.paginaActual < totalPags) { EP.paginaActual++; epFiltrar(); } });
    wrap.appendChild(next);
}

function epCrearPagBtn(contenido, title, disabled) {
    const btn = document.createElement('button');
    btn.className  = 'ep-pag-btn';
    btn.title      = title;
    btn.disabled   = disabled;
    btn.innerHTML  = contenido;
    return btn;
}

/* ═══════════════════════════════════════════════════
   3. ESTADO VACÍO
═══════════════════════════════════════════════════ */
function epMostrarVacio(vacio) {
    const el = document.getElementById('ep-empty');
    if (el) el.style.display = vacio ? 'block' : 'none';
}

/* ═══════════════════════════════════════════════════
   4. DÍAS EN ESPERA
═══════════════════════════════════════════════════ */
function epCalcularEsperas() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    document.querySelectorAll('[data-fecha-sol]').forEach(el => {
        const raw   = el.dataset.fechaSol;
        if (!raw) return;
        const fecha = new Date(raw);
        fecha.setHours(0, 0, 0, 0);
        const dias  = Math.round((hoy - fecha) / 86400000);

        const span  = el.querySelector('.ep-espera');
        const fila  = el.closest('tr');
        if (!span) return;

        span.textContent = `${dias} día${dias !== 1 ? 's' : ''}`;
        if (fila) fila.dataset.espera = dias;

        if (dias >= 14)      { span.className = 'ep-espera critico'; if (fila) fila.dataset.pri = 'alta'; }
        else if (dias >= 7)  { span.className = 'ep-espera alerta';  if (fila) fila.dataset.pri = 'media'; }
        else                 { span.className = 'ep-espera normal';  if (fila && !fila.dataset.pri) fila.dataset.pri = 'baja'; }
    });
}

/* ═══════════════════════════════════════════════════
   5. MODAL INICIAR EVALUACIÓN
═══════════════════════════════════════════════════ */
function epAbrirModal(id, finca, propietario, ubicacion, hectareas, vegetacion) {
    if (!id) { epToast('Datos de solicitud inválidos.', true); return; }

    EP.idActual    = id;
    EP.fincaActual = finca;
    EP.propActual  = propietario;

    const set = (elId, val) => { const e = document.getElementById(elId); if (e) e.textContent = val || '—'; };
    set('ep-modal-finca',      finca);
    set('ep-modal-prop',       propietario);
    set('ep-modal-ubic',       ubicacion);
    set('ep-modal-hectareas',  hectareas ? `${hectareas} ha` : '—');
    set('ep-modal-veg',        vegetacion);

    document.getElementById('ep-modal-overlay')?.classList.add('activo');
    document.addEventListener('keydown', epCerrarModalEsc);
}

function epCerrarModal() {
    document.getElementById('ep-modal-overlay')?.classList.remove('activo');
    document.removeEventListener('keydown', epCerrarModalEsc);
    EP.idActual = null;
}

function epCerrarModalEsc(e) { if (e.key === 'Escape') epCerrarModal(); }

function epConfirmarIniciar() {
    if (!EP.idActual) { epToast('Error: solicitud no identificada.', true); return; }

    /* === Conectar al backend en producción ===
    const token = document.querySelector('input[name="__RequestVerificationToken"]').value;
    fetch('/IngForestal/Evaluaciones/IniciarEvaluacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'RequestVerificationToken': token },
        body: JSON.stringify({ id: EP.idActual })
    })
    .then(r => r.json())
    .then(data => {
        if (data.exito) {
            epCerrarModal();
            epToast(`✅ Evaluación iniciada para ${EP.fincaActual}.`);
            epActualizarFilaEstado(EP.idActual);
        } else {
            epToast(data.mensaje || 'Error al iniciar.', true);
        }
    })
    .catch(() => epToast('Error de conexión.', true));
    */

    // Simulación frontend
    epCerrarModal();
    epToast(`✅ Evaluación iniciada para ${EP.fincaActual}.`);
    epActualizarFilaEstado(EP.idActual);
}

function epActualizarFilaEstado(id) {
    const fila = document.querySelector(`#ep-tbody tr[data-id="${id}"]`);
    if (!fila) return;

    const chip = fila.querySelector('.chip');
    if (chip) {
        chip.className   = 'chip chip-proceso';
        chip.innerHTML   = '● En Proceso';
    }

    // Reemplazar botón "Iniciar" por "Continuar"
    const td = fila.querySelector('td:last-child');
    if (td) {
        td.innerHTML = `
            <button class="btn-icon" title="Ver detalle"
                    onclick="epVerDetalle(${id})">
                <i class="fa-solid fa-eye"></i>
            </button>
            <button class="btn-icon" title="Continuar evaluación"
                    onclick="epRealizar(${id})">
                <i class="fa-solid fa-pen-to-square"></i>
            </button>`;
    }
}

/* ═══════════════════════════════════════════════════
   6. NAVEGACIÓN
═══════════════════════════════════════════════════ */
function epVerDetalle(id) {
    if (!id || isNaN(id)) { epToast('ID inválido.', true); return; }
    window.location.href = `/IngForestal/Detalle?id=${encodeURIComponent(id)}`;
}

function epRealizar(id) {
    if (!id || isNaN(id)) { epToast('ID inválido.', true); return; }
    window.location.href = `/IngForestal/Realizar?id=${encodeURIComponent(id)}`;
}

/* ═══════════════════════════════════════════════════
   7. TOAST
═══════════════════════════════════════════════════ */
function epToast(mensaje, esError = false) {
    const toast   = document.getElementById('ep-toast');
    const msgSpan = document.getElementById('ep-toast-msg');
    if (!toast || !mensaje) return;
    msgSpan.textContent = mensaje;
    toast.classList.toggle('error', esError);
    toast.classList.add('visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('visible'), 3500);
}

/* ═══════════════════════════════════════════════════
   8. INIT
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

    // Calcular días en espera dinámicamente
    epCalcularEsperas();

    // Cerrar modal al hacer clic fuera
    document.getElementById('ep-modal-overlay')?.addEventListener('click', e => {
        if (e.target.id === 'ep-modal-overlay') epCerrarModal();
    });

    // Filtrado inicial
    epFiltrar();
});
