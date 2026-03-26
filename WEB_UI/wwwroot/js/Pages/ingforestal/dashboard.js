/* =====================================================
   dashboard.js — Ingeniero Forestal | PSA
   Ruta: wwwroot/js/tecnico/dashboard.js
   ===================================================== */

const VI = {
    tabActual: 'todos',
    columnaSort: null,
    dirSort: 'asc',
    paginaActual: 1,
    porPagina: 8,
};

// Función para cambiar de tab (desde las pestañas o desde las tarjetas)
function cambiarTab(tab) {
    if (!tab) return;

    // Mapeo de valores
    let tabValue = tab;
    if (tab === 'pendientes') tabValue = 'pendiente';
    if (tab === 'aprobados') tabValue = 'aprobada';
    if (tab === 'rechazado') tabValue = 'rechazada';
    if (tab === 'todos') tabValue = 'todos';

    VI.tabActual = tabValue;
    VI.paginaActual = 1;

    // Actualizar estilo de los tabs originales (psa-tab)
    document.querySelectorAll('.psa-tab').forEach(btn => {
        const btnTab = btn.getAttribute('data-tab');
        if (btnTab === tabValue) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Actualizar estilo de las nuevas estadísticas tipo tabs
    document.querySelectorAll('.psa-stats-tab').forEach(tabEl => {
        const tabData = tabEl.getAttribute('data-tab');
        if (tabData === tabValue) {
            tabEl.classList.add('active');
        } else {
            tabEl.classList.remove('active');
        }
    });

    // Actualizar el select de estado
    const filtroEstado = document.getElementById('filtroEstado');
    if (filtroEstado) {
        filtroEstado.value = tabValue === 'todos' ? '' : tabValue;
    }

    filtrarTabla();
}

// Función para limpiar todos los filtros
function limpiarFiltros() {
    const buscador = document.getElementById('buscador');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroOrden = document.getElementById('filtroOrden');

    if (buscador) buscador.value = '';
    if (filtroEstado) filtroEstado.value = '';
    if (filtroOrden) filtroOrden.value = 'fecha-desc';

    VI.tabActual = 'todos';
    VI.paginaActual = 1;

    // Actualizar tabs visualmente
    document.querySelectorAll('.psa-tab').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === 'todos');
    });

    filtrarTabla();
}

/* ── 1. FILTRADO DE TABLA ────────────────────────────────── */
function filtrarTabla() {
    const busqueda = document.getElementById('buscador')?.value.trim().toLowerCase() || '';
    const estado = document.getElementById('filtroEstado')?.value || '';
    const orden = document.getElementById('filtroOrden')?.value || 'fecha-desc';

    const filas = Array.from(document.querySelectorAll('#cuerpoTabla tr'));
    let visibles = 0;

    // Filtrar visibilidad
    filas.forEach(fila => {
        const textoFila = fila.innerText.toLowerCase();
        const estadoFila = fila.dataset.estado || '';

        // Combinar filtro de estado (select) con filtro de tab
        let estadoCoincide = true;
        if (estado) {
            estadoCoincide = estadoFila === estado;
        } else if (VI.tabActual !== 'todos') {
            estadoCoincide = estadoFila === VI.tabActual;
        }

        const coincideBusqueda = !busqueda || textoFila.includes(busqueda);

        const mostrar = coincideBusqueda && estadoCoincide;
        fila.style.display = mostrar ? '' : 'none';
        if (mostrar) visibles++;
    });

    // Ordenar filas visibles
    const tbody = document.getElementById('cuerpoTabla');
    const visArr = filas.filter(f => f.style.display !== 'none');

    visArr.sort((a, b) => {
        if (orden === 'fecha-desc') return new Date(b.dataset.fecha) - new Date(a.dataset.fecha);
        if (orden === 'fecha-asc') return new Date(a.dataset.fecha) - new Date(b.dataset.fecha);
        if (orden === 'nombre-asc') return (a.dataset.nombre || '').localeCompare(b.dataset.nombre || '');
        if (orden === 'hectareas-desc') return parseFloat(b.dataset.hectareas) - parseFloat(a.dataset.hectareas);
        return 0;
    });

    visArr.forEach(f => tbody.appendChild(f));

    // Estado vacío
    const emptyDiv = document.getElementById('estadoVacio');
    if (emptyDiv) emptyDiv.style.display = visibles === 0 ? 'block' : 'none';

    // Actualizar información de paginación
    const pagInfo = document.getElementById('pag-info');
    if (pagInfo) {
        pagInfo.textContent = visibles === 0
            ? 'Sin resultados'
            : `Mostrando ${visibles} solicitud${visibles !== 1 ? 'es' : ''}`;
    }
}

// Función para actualizar los contadores en tiempo real
function actualizarContadores() {
    const filas = document.querySelectorAll('#cuerpoTabla tr');
    let contadores = {
        pendiente: 0,
        proceso: 0,
        aprobada: 0,
        rechazada: 0,
        total: 0
    };

    filas.forEach(fila => {
        const estado = fila.dataset.estado || '';
        contadores.total++;
        if (estado === 'pendiente') contadores.pendiente++;
        if (estado === 'proceso') contadores.proceso++;
        if (estado === 'aprobada') contadores.aprobada++;
        if (estado === 'rechazada') contadores.rechazada++;
    });

    // Actualizar los valores en las tarjetas
    const totalEl = document.getElementById('cnt-todas');
    const pendEl = document.getElementById('cnt-pendientes');
    const procEl = document.getElementById('cnt-proceso');
    const aprobEl = document.getElementById('cnt-aprobadas');
    const rechEl = document.getElementById('cnt-rechazadas');

    if (totalEl) totalEl.textContent = contadores.total;
    if (pendEl) pendEl.textContent = contadores.pendiente;
    if (procEl) procEl.textContent = contadores.proceso;
    if (aprobEl) aprobEl.textContent = contadores.aprobada;
    if (rechEl) rechEl.textContent = contadores.rechazada;

    // Actualizar badges de los tabs
    const badgeTodos = document.getElementById('badge-todos');
    const badgePendiente = document.getElementById('badge-pendiente');
    const badgeProceso = document.getElementById('badge-proceso');
    const badgeAprobada = document.getElementById('badge-aprobada');
    const badgeRechazada = document.getElementById('badge-rechazada');

    if (badgeTodos) badgeTodos.textContent = contadores.total;
    if (badgePendiente) badgePendiente.textContent = contadores.pendiente;
    if (badgeProceso) badgeProceso.textContent = contadores.proceso;
    if (badgeAprobada) badgeAprobada.textContent = contadores.aprobada;
    if (badgeRechazada) badgeRechazada.textContent = contadores.rechazada;
}

// ── 2. MODAL: INICIAR EVALUACIÓN ─────────────────────────
let idSolicitudActual = null;

function abrirModalProceso(id, finca, propietario) {
    if (!id || !finca || !propietario) {
        mostrarToast('Datos de solicitud inválidos.', true);
        return;
    }

    idSolicitudActual = id;
    document.getElementById('modal-finca').textContent = finca;
    document.getElementById('modal-propietario').textContent = propietario;

    const overlay = document.getElementById('modalProceso');
    overlay.style.display = 'flex';
    overlay.classList.add('activo');

    document.addEventListener('keydown', cerrarModalEsc);
}

function cerrarModal() {
    const overlay = document.getElementById('modalProceso');
    overlay.style.display = 'none';
    overlay.classList.remove('activo');
    document.removeEventListener('keydown', cerrarModalEsc);
    idSolicitudActual = null;
}

function cerrarModalEsc(e) {
    if (e.key === 'Escape') cerrarModal();
}

function confirmarIniciarProceso() {
    if (!idSolicitudActual) {
        mostrarToast('Error: no se identificó la solicitud.', true);
        cerrarModal();
        return;
    }

    // Simulación frontend
    actualizarFilaEnTabla(idSolicitudActual);
    cerrarModal();
    mostrarToast('✅ Solicitud marcada como "En Proceso" correctamente.');
}

function actualizarFilaEnTabla(id) {
    const filas = document.querySelectorAll('#cuerpoTabla tr');
    let filaEncontrada = null;

    // Buscar la fila por data-id o por índice
    filas.forEach(fila => {
        if (fila.dataset.id == id || (fila.querySelector('.btn-icon') && fila.querySelector('.btn-icon').getAttribute('onclick')?.includes(id))) {
            filaEncontrada = fila;
        }
    });

    if (!filaEncontrada) return;

    filaEncontrada.dataset.estado = 'proceso';

    const chip = filaEncontrada.querySelector('.chip');
    if (chip) {
        chip.className = 'chip chip-proceso';
        chip.innerHTML = '● En Proceso';
    }

    // Actualizar contadores
    actualizarContadores();

    // Reaplicar filtros
    filtrarTabla();
}

// ── 3. NAVEGACIÓN ─────────────────────────────────────────
function verDetalle(id) {
    if (!id || isNaN(id)) {
        mostrarToast('ID de solicitud inválido.', true);
        return;
    }
    window.location.href = `/IngForestal/Detalle?id=${encodeURIComponent(id)}`;
}

function programarVisita() {
    window.location.href = '/IngForestal/Programar';
}

// ── 4. TOAST ──────────────────────────────────────────────
function mostrarToast(mensaje, esError = false) {
    const toast = document.getElementById('toast');
    const msgSpan = document.getElementById('toast-msg');

    if (!mensaje || typeof mensaje !== 'string' || mensaje.trim() === '') return;

    msgSpan.textContent = mensaje;
    toast.classList.toggle('error', esError);
    toast.classList.add('visible');

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('visible'), 3500);
}

// ── 5. INICIALIZACIÓN AL CARGAR ──────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar contadores
    actualizarContadores();

    // Aplicar filtros iniciales
    filtrarTabla();

    // Animación de barras de progreso
    document.querySelectorAll('.td-progress-bar').forEach(barra => {
        const meta = barra.style.width;
        barra.style.width = '0';
        requestAnimationFrame(() => { barra.style.width = meta; });
    });

    // Cerrar modal al hacer clic fuera del diálogo
    const overlay = document.getElementById('modalProceso');
    if (overlay) {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) cerrarModal();
        });
    }

    // Event listeners para los filtros si existen
    const buscador = document.getElementById('buscador');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroOrden = document.getElementById('filtroOrden');

    if (buscador) buscador.addEventListener('input', filtrarTabla);
    if (filtroEstado) filtroEstado.addEventListener('change', filtrarTabla);
    if (filtroOrden) filtroOrden.addEventListener('change', filtrarTabla);
});