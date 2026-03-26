/* =====================================================
   visitas-index.js — Visitas / Index | PSA
   Adaptado para usar clases psatheme.css
   ===================================================== */

/* ── ESTADO GLOBAL ─────────────────────────────────── */
const VI = {
    tabActual: 'todos',
    columnaSort: null,
    dirSort: 'asc',
    paginaActual: 1,
    porPagina: 8,
};

/* ── 1. TABS (adaptado para psa-tabs) ───────────────── */
function cambiarTab(tab) {
    if (!tab) return;
    VI.tabActual = tab;
    VI.paginaActual = 1;

    // Actualizar estilo de los tabs usando clase psa-tab
    document.querySelectorAll('.psa-tab').forEach(btn => {
        if (btn.getAttribute('data-tab') === tab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    aplicarFiltros();
}

/* ── 2. FILTROS + BÚSQUEDA ────────────────────────── */
function aplicarFiltros() {
    const busqueda = (document.getElementById('vi-buscador')?.value || '').trim().toLowerCase();
    const orden = document.getElementById('vi-orden')?.value || 'fecha-desc';

    const filas = Array.from(document.querySelectorAll('#vi-tbody tr'));
    let visibles = [];

    filas.forEach(fila => {
        const estado = fila.dataset.estado || '';
        const texto = fila.innerText.toLowerCase();

        const passTab = VI.tabActual === 'todos' || estado === VI.tabActual;
        const passBusc = !busqueda || texto.includes(busqueda);

        if (passTab && passBusc) {
            fila.style.display = '';
            visibles.push(fila);
        } else {
            fila.style.display = 'none';
        }
    });

    // Ordenar
    visibles.sort((a, b) => {
        switch (orden) {
            case 'fecha-desc':
                return new Date(b.dataset.fecha) - new Date(a.dataset.fecha);
            case 'fecha-asc':
                return new Date(a.dataset.fecha) - new Date(b.dataset.fecha);
            case 'nombre-asc':
                return (a.dataset.nombre || '').localeCompare(b.dataset.nombre || '');
            case 'hectareas-desc':
                return parseFloat(b.dataset.hectareas) - parseFloat(a.dataset.hectareas);
            default:
                return 0;
        }
    });

    // Re-insertar en orden
    const tbody = document.getElementById('vi-tbody');
    visibles.forEach(f => tbody.appendChild(f));

    actualizarPaginacion(visibles.length);
    actualizarContadores();
    mostrarEstadoVacio(visibles.length === 0);
}

/* ── ACTUALIZAR CONTADORES DE LOS BADGES ──────────── */
function actualizarContadores() {
    const filas = document.querySelectorAll('#vi-tbody tr');
    let contadores = {
        todos: 0,
        pendiente: 0,
        proceso: 0,
        aprobada: 0,
        rechazada: 0
    };

    filas.forEach(fila => {
        const estado = fila.dataset.estado || '';
        contadores.todos++;
        if (estado === 'pendiente') contadores.pendiente++;
        if (estado === 'proceso') contadores.proceso++;
        if (estado === 'aprobada') contadores.aprobada++;
        if (estado === 'rechazada') contadores.rechazada++;
    });

    // Actualizar badges
    const badgeTodos = document.getElementById('badge-todos');
    const badgePendiente = document.getElementById('badge-pendiente');
    const badgeProceso = document.getElementById('badge-proceso');
    const badgeAprobada = document.getElementById('badge-aprobada');
    const badgeRechazada = document.getElementById('badge-rechazada');

    if (badgeTodos) badgeTodos.textContent = contadores.todos;
    if (badgePendiente) badgePendiente.textContent = contadores.pendiente;
    if (badgeProceso) badgeProceso.textContent = contadores.proceso;
    if (badgeAprobada) badgeAprobada.textContent = contadores.aprobada;
    if (badgeRechazada) badgeRechazada.textContent = contadores.rechazada;
}

function limpiarFiltros() {
    const buscador = document.getElementById('vi-buscador');
    const orden = document.getElementById('vi-orden');
    if (buscador) buscador.value = '';
    if (orden) orden.value = 'fecha-desc';
    VI.tabActual = 'todos';
    VI.paginaActual = 1;

    // Actualizar tabs visualmente
    document.querySelectorAll('.psa-tab').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === 'todos');
    });

    aplicarFiltros();
}

/* ── 3. PAGINACIÓN ───────────────────────────────── */
function actualizarPaginacion(total) {
    const totalPags = Math.max(1, Math.ceil(total / VI.porPagina));
    if (VI.paginaActual > totalPags) VI.paginaActual = totalPags;

    const filas = Array.from(document.querySelectorAll('#vi-tbody tr')).filter(f => f.style.display !== 'none');
    filas.forEach((f, i) => {
        const enPagina = i >= (VI.paginaActual - 1) * VI.porPagina &&
            i < VI.paginaActual * VI.porPagina;
        f.style.display = enPagina ? '' : 'none';
    });

    // Texto de info
    const desde = total === 0 ? 0 : (VI.paginaActual - 1) * VI.porPagina + 1;
    const hasta = Math.min(VI.paginaActual * VI.porPagina, total);
    const infoBottom = document.getElementById('vi-pag-info-bottom');
    if (infoBottom) {
        infoBottom.textContent = total === 0
            ? 'Sin resultados'
            : `Mostrando ${desde}–${hasta} de ${total} visita${total !== 1 ? 's' : ''}`;
    }

    // Botones de página
    renderBotonesPag(totalPags);
}

function renderBotonesPag(totalPags) {
    const wrap = document.getElementById('vi-pag-btns');
    if (!wrap) return;
    wrap.innerHTML = '';

    // Anterior
    const btnPrev = crearPagBtn('<i class="fas fa-chevron-left"></i>', 'Anterior', VI.paginaActual === 1);
    btnPrev.addEventListener('click', () => { if (VI.paginaActual > 1) { VI.paginaActual--; aplicarFiltros(); } });
    wrap.appendChild(btnPrev);

    // Números
    const maxVisible = 5;
    let startPage = Math.max(1, VI.paginaActual - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPags, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let p = startPage; p <= endPage; p++) {
        const btn = crearPagBtn(p, `Página ${p}`, false);
        if (p === VI.paginaActual) btn.classList.add('activo');
        btn.addEventListener('click', () => { VI.paginaActual = p; aplicarFiltros(); });
        wrap.appendChild(btn);
    }

    // Siguiente
    const btnNext = crearPagBtn('<i class="fas fa-chevron-right"></i>', 'Siguiente', VI.paginaActual === totalPags);
    btnNext.addEventListener('click', () => { if (VI.paginaActual < totalPags) { VI.paginaActual++; aplicarFiltros(); } });
    wrap.appendChild(btnNext);
}

function crearPagBtn(contenido, title, deshabilitado) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline-psa btn-sm';
    if (deshabilitado) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    }
    btn.title = title;
    btn.innerHTML = contenido;
    return btn;
}

/* ── 4. ESTADO VACÍO ─────────────────────────────── */
function mostrarEstadoVacio(vacio) {
    const el = document.getElementById('vi-empty');
    if (el) el.style.display = vacio ? 'block' : 'none';
}

/* ── 5. MODAL PROGRAMAR VISITA ───────────────────── */
function abrirModalProgramar(id, finca, propietario) {
    // Prellenar campos de referencia (solo lectura)
    const elFinca = document.getElementById('pv-finca');
    const elProp = document.getElementById('pv-propietario');
    const elId = document.getElementById('pv-solicitud-id');
    if (elFinca) elFinca.value = finca || '';
    if (elProp) elProp.value = propietario || '';
    if (elId) elId.value = id || '';

    limpiarErroresModal();

    const overlay = document.getElementById('vi-modal-overlay');
    if (overlay) overlay.style.display = 'flex';
    document.addEventListener('keydown', cerrarModalEsc);
}

function cerrarModal() {
    const overlay = document.getElementById('vi-modal-overlay');
    if (overlay) overlay.style.display = 'none';
    document.removeEventListener('keydown', cerrarModalEsc);
    const form = document.getElementById('vi-form-programar');
    if (form) form.reset();
    limpiarErroresModal();
}

function cerrarModalEsc(e) { if (e.key === 'Escape') cerrarModal(); }

/* ── 6. VALIDACIÓN DEL FORMULARIO ────────────────── */
const REGLAS = {
    'pv-fecha': { req: true, tipo: 'fecha-futura', msg: 'Seleccione una fecha válida (hoy o posterior).' },
    'pv-hora': { req: true, tipo: 'texto', msg: 'Indique la hora de la visita.' },
    'pv-objetivo': { req: true, tipo: 'texto', msg: 'Describa el objetivo de la visita (mín. 10 caracteres).', minLen: 10 },
    'pv-transporte': { req: true, tipo: 'select', msg: 'Seleccione el medio de transporte.' },
    'pv-observacion': { req: false },
};

function validarCampo(id) {
    const regla = REGLAS[id];
    if (!regla) return true;

    const el = document.getElementById(id);
    const err = document.getElementById(`${id}-err`);
    if (!el) return true;

    let ok = true;

    if (regla.req) {
        const val = el.value.trim();
        if (!val || (regla.tipo === 'select' && val === '')) ok = false;
        if (ok && regla.tipo === 'fecha-futura' && val) {
            const sel = new Date(val);
            sel.setHours(0, 0, 0, 0);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            if (sel < hoy) ok = false;
        }
        if (ok && regla.minLen && val.length < regla.minLen) ok = false;
    }

    if (err) {
        err.style.display = ok ? 'none' : 'block';
    }
    return ok;
}

function validarFormulario() {
    return Object.keys(REGLAS).map(validarCampo).every(Boolean);
}

function limpiarErroresModal() {
    Object.keys(REGLAS).forEach(id => {
        const err = document.getElementById(`${id}-err`);
        if (err) err.style.display = 'none';
    });
}

function guardarVisita() {
    if (!validarFormulario()) {
        mostrarToastVI('Corrija los campos marcados antes de continuar.', true);
        return;
    }

    // Simulación frontend
    cerrarModal();
    mostrarToastVI('✅ Visita programada correctamente.');

    // Recargar la página para mostrar la nueva visita
    setTimeout(() => {
        location.reload();
    }, 1500);
}

/* ── 7. TOAST ────────────────────────────────────── */
function mostrarToastVI(mensaje, esError = false) {
    const toast = document.getElementById('vi-toast');
    const msgSpan = document.getElementById('vi-toast-msg');
    if (!toast || !mensaje) return;
    msgSpan.textContent = mensaje;
    if (esError) {
        toast.style.background = 'var(--psa-red)';
    } else {
        toast.style.background = 'var(--psa-leaf)';
    }
    toast.classList.add('visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('visible'), 3500);
}

/* ── 8. NAVEGACIÓN ───────────────────────────────── */
function verDetalle(id) {
    if (!id || isNaN(id)) { mostrarToastVI('ID de visita inválido.', true); return; }
    window.location.href = `/IngForestal/Detalle?id=${encodeURIComponent(id)}`;
}

function realizarVisita(id) {
    if (!id || isNaN(id)) { mostrarToastVI('ID de visita inválido.', true); return; }
    window.location.href = `/IngForestal/Realizar?id=${encodeURIComponent(id)}`;
}

function programarVisita() {
    window.location.href = '/IngForestal/Programar';
}

/* ── 9. INIT ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    // Fecha mínima del input del modal = hoy
    const inputFecha = document.getElementById('pv-fecha');
    if (inputFecha) {
        const hoy = new Date().toISOString().split('T')[0];
        inputFecha.min = hoy;
    }

    // Cerrar modal al hacer clic fuera
    const modalOverlay = document.getElementById('vi-modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', e => {
            if (e.target.id === 'vi-modal-overlay') cerrarModal();
        });
    }

    // Validación en tiempo real de cada campo del modal
    Object.keys(REGLAS).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('blur', () => validarCampo(id));
            el.addEventListener('input', () => {
                if (validarCampo(id)) {
                    const err = document.getElementById(`${id}-err`);
                    if (err) err.style.display = 'none';
                }
            });
        }
    });

    // Aplicar filtros iniciales
    actualizarContadores();
    aplicarFiltros();
});