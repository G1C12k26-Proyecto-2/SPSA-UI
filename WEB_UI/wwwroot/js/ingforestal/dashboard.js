/* =====================================================
   dashboard.js — Ingeniero Forestal | PSA
   Ruta: wwwroot/js/tecnico/dashboard.js
   ===================================================== */

// ── 1. FILTRADO DE TABLA ──────────────────────────────────
function filtrarTabla() {
    const busqueda = document.getElementById('buscador').value.trim().toLowerCase();
    const estado   = document.getElementById('filtroEstado').value;
    const orden    = document.getElementById('filtroOrden').value;

    const filas  = Array.from(document.querySelectorAll('#cuerpoTabla tr'));
    let visibles = 0;

    // Filtrar visibilidad
    filas.forEach(fila => {
        const textoFila  = fila.innerText.toLowerCase();
        const estadoFila = fila.dataset.estado || '';

        const coincideBusqueda = !busqueda || textoFila.includes(busqueda);
        const coincideEstado   = !estado   || estadoFila === estado;

        const mostrar = coincideBusqueda && coincideEstado;
        fila.style.display = mostrar ? '' : 'none';
        if (mostrar) visibles++;
    });

    // Ordenar filas visibles
    const tbody   = document.getElementById('cuerpoTabla');
    const visArr  = filas.filter(f => f.style.display !== 'none');

    visArr.sort((a, b) => {
        if (orden === 'fecha-desc')     return new Date(b.dataset.fecha)     - new Date(a.dataset.fecha);
        if (orden === 'fecha-asc')      return new Date(a.dataset.fecha)     - new Date(b.dataset.fecha);
        if (orden === 'nombre-asc')     return (a.dataset.nombre || '').localeCompare(b.dataset.nombre || '');
        if (orden === 'hectareas-desc') return parseFloat(b.dataset.hectareas) - parseFloat(a.dataset.hectareas);
        return 0;
    });

    visArr.forEach(f => tbody.appendChild(f));

    // Estado vacío
    document.getElementById('estadoVacio').style.display = visibles === 0 ? 'block' : 'none';
    document.getElementById('pag-info').textContent =
        visibles === 0
            ? 'Sin resultados'
            : `Mostrando ${visibles} solicitud${visibles !== 1 ? 'es' : ''}`;
}

// ── 2. MODAL: INICIAR EVALUACIÓN ─────────────────────────
let idSolicitudActual = null;

function abrirModalProceso(id, finca, propietario) {
    if (!id || !finca || !propietario) {
        mostrarToast('Datos de solicitud inválidos.', true);
        return;
    }

    idSolicitudActual = id;
    document.getElementById('modal-finca').textContent       = finca;
    document.getElementById('modal-propietario').textContent = propietario;

    const overlay = document.getElementById('modalProceso');
    overlay.classList.add('activo');
    overlay.querySelector('.td-modal').focus();

    document.addEventListener('keydown', cerrarModalEsc);
}

function cerrarModal() {
    document.getElementById('modalProceso').classList.remove('activo');
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

    /* === Conectar al backend en producción ===
    const token = document.querySelector('input[name="__RequestVerificationToken"]').value;

    fetch('/Visitas/CambiarEstado', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'RequestVerificationToken': token
        },
        body: JSON.stringify({ id: idSolicitudActual, nuevoEstado: 'EnProceso' })
    })
    .then(r => r.json())
    .then(data => {
        if (data.exito) {
            actualizarFilaEnTabla(idSolicitudActual);
            mostrarToast('Solicitud marcada como En Proceso.');
        } else {
            mostrarToast(data.mensaje || 'Error al actualizar.', true);
        }
    })
    .catch(() => mostrarToast('Error de conexión con el servidor.', true));
    */

    // ── Simulación frontend (retirar cuando el backend esté listo) ──
    actualizarFilaEnTabla(idSolicitudActual);
    cerrarModal();
    mostrarToast('✅ Solicitud marcada como "En Proceso" correctamente.');
}

function actualizarFilaEnTabla(id) {
    // En producción, usar data-id en cada <tr> para identificar la fila
    const filas = document.querySelectorAll('#cuerpoTabla tr');
    const fila  = filas[id - 1];
    if (!fila) return;

    fila.dataset.estado = 'proceso';

    const chip = fila.querySelector('.chip');
    if (chip) {
        chip.className   = 'chip chip-proceso';
        chip.textContent = '';

        const dot = document.createElement('span');
        dot.style.fontSize = '.55rem';
        dot.textContent    = '●';
        chip.appendChild(dot);
        chip.append(' En Proceso');
    }

    // Actualizar contadores del header
    const pendEl = document.getElementById('cnt-pendientes');
    const procEl = document.getElementById('cnt-proceso');
    if (pendEl) pendEl.textContent = Math.max(0, parseInt(pendEl.textContent) - 1);
    if (procEl) procEl.textContent = parseInt(procEl.textContent) + 1;
}

// ── 3. NAVEGACIÓN ─────────────────────────────────────────
function verDetalle(id) {
    if (!id || isNaN(id)) {
        mostrarToast('ID de solicitud inválido.', true);
        return;
    }
    window.location.href = `/Detalle?id=${encodeURIComponent(id)}`;
}

// ── 4. TOAST ──────────────────────────────────────────────
function mostrarToast(mensaje, esError = false) {
    const toast   = document.getElementById('toast');
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
});
