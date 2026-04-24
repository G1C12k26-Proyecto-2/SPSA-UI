/* =====================================================
   ListaSolicitudes.js — Lista de Solicitudes | PSA
   Ruta: wwwroot/js/pages/ingforestal/ListaSolicitudes.js
   Versión: Con carga dinámica desde el backend
   ===================================================== */

const API_URL = "https://localhost:44392"; // Cambiar según entorno

/* ── ESTADO GLOBAL ─────────────────────────────────── */
const VI = {
    tabActual: 'todos',
    columnaSort: null,
    dirSort: 'asc',
    paginaActual: 1,
    porPagina: 8,
    datosOriginales: [],      // Almacena todas las solicitudes
};

/* ── 1. CARGA INICIAL DESDE EL BACKEND ─────────────── */
async function cargarSolicitudes() {
    mostrarLoading(true);

    try {
        const ingenieroId = obtenerIngenieroId();
        const response = await fetch(`${API_URL}/api/Ingeniero/Ingeniero/${ingenieroId}`);
        const data = await response.json();

        if (data.result === "SUCCESS" && data.data) {
            // Guardar datos originales
            VI.datosOriginales = data.data.solicitudesRecientes || [];

            // Actualizar badges con los contadores
            actualizarBadges(VI.datosOriginales);

            // Renderizar tabla
            renderizarTabla(VI.datosOriginales);

            // Aplicar filtros y paginación
            actualizarContadores();
            aplicarFiltros();

        } else {
            mostrarToastVI('Error al cargar los datos: ' + (data.message || 'Error desconocido'), true);
        }
    } catch (error) {
        console.error('Error al cargar solicitudes:', error);
        mostrarToastVI('Error de conexión con el servidor', true);
    } finally {
        mostrarLoading(false);
    }
}

// Función para obtener el ID del ingeniero
function obtenerIngenieroId() {
    let ingenieroId = localStorage.getItem('userId');
    if (!ingenieroId) ingenieroId = sessionStorage.getItem('userId');
    if (!ingenieroId) {
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                ingenieroId = user.id;
            } catch (e) { console.error('Error parsing user:', e); }
        }
    }
    if (!ingenieroId) {
        console.warn('No se encontró ID de usuario, usando valor por defecto 1');
        return 1;
    }
    return parseInt(ingenieroId);
}

function mostrarLoading(mostrar) {
    const tbody = document.getElementById('vi-tbody');
    if (!tbody) return;

    if (mostrar) {
        tbody.innerHTML = `<tr id="loading-row">
            <td colspan="7" style="text-align: center; padding: 60px 20px; color: var(--psa-muted);">
                <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 10px; display: inline-block;"></i>
                <div>Cargando solicitudes...</div>
            </td>
        </tr>`;
    }
}

function actualizarBadges(solicitudes) {
    let contadores = {
        todos: solicitudes.length,
        pendiente: 0,
        proceso: 0,
        aprobada: 0,
        rechazada: 0
    };

    solicitudes.forEach(sol => {
        const estado = (sol.estado || '').toLowerCase();
        if (estado === 'pendiente') contadores.pendiente++;
        else if (estado === 'en proceso') contadores.proceso++;
        else if (estado === 'aprobada') contadores.aprobada++;
        else if (estado === 'rechazada') contadores.rechazada++;
    });

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

function renderizarTabla(solicitudes) {
    const tbody = document.getElementById('vi-tbody');
    if (!tbody) return;

    if (!solicitudes || solicitudes.length === 0) {
        tbody.innerHTML = '';
        return;
    }

    tbody.innerHTML = '';

    const estadoMap = {
        'Pendiente': { class: 'psa-badge-gold', text: 'Pendiente', value: 'pendiente' },
        'En Proceso': { class: 'psa-badge-blue', text: 'En Proceso', value: 'proceso' },
        'Aprobada': { class: 'psa-badge-green', text: 'Aprobada', value: 'aprobada' },
        'Rechazada': { class: 'psa-badge-red', text: 'Rechazada', value: 'rechazada' }
    };

    solicitudes.forEach((sol) => {
        const estadoTexto = sol.estado || 'Pendiente';
        const estadoInfo = estadoMap[estadoTexto] || estadoMap['Pendiente'];
        const fechaFormateada = formatFecha(sol.fechaSolicitud);
        const hectareasFormateadas = `${parseFloat(sol.hectareas).toFixed(2)} ha`;

        const row = document.createElement('tr');
        row.setAttribute('data-estado', estadoInfo.value);
        row.setAttribute('data-nombre', sol.nombreFinca || '');
        row.setAttribute('data-fecha', sol.fechaSolicitud ? sol.fechaSolicitud.split('T')[0] : '');
        row.setAttribute('data-hectareas', sol.hectareas || 0);
        row.setAttribute('data-id', sol.idSolicitud);
        row.style.borderBottom = '1px solid var(--psa-border)';

        // Determinar botones según estado
        let botones = `
            <button class="btn-icon" style="background: none; border: none; cursor: pointer; color: var(--psa-leaf); font-size: 0.9rem; padding: 4px 8px; border-radius: 6px;" 
                    title="Ver detalle" onclick="verDetalle(${sol.idSolicitud})">
                <i class="fas fa-eye"></i>
            </button>
        `;

        if (estadoTexto === 'Pendiente') {
            botones += `
                <button class="btn-icon" style="background: none; border: none; cursor: pointer; color: var(--psa-leaf); font-size: 0.9rem; padding: 4px 8px; border-radius: 6px;" 
                        title="Programar visita" onclick="abrirModalProgramar(${sol.idSolicitud}, '${escapeHtml(sol.nombreFinca)}', '${escapeHtml(sol.propietario)}')">
                    <i class="fas fa-calendar-plus"></i>
                </button>
            `;
        } else if (estadoTexto === 'En Proceso') {
            botones += `
                <button class="btn-icon" style="background: none; border: none; cursor: pointer; color: var(--psa-gold); font-size: 0.9rem; padding: 4px 8px; border-radius: 6px;" 
                        title="Continuar evaluación" onclick="realizarVisita(${sol.idSolicitud})">
                    <i class="fas fa-pen-to-square"></i>
                </button>
            `;
        }

        row.innerHTML = `
            <td style="padding: 14px 16px;">
                <div style="font-weight: 600; color: var(--psa-forest);">${escapeHtml(sol.nombreFinca || '')}</div>
                <div style="font-size: 0.75rem; color: var(--psa-muted);">${escapeHtml(sol.propietario || '')}</div>
            </td>
            <td style="padding: 14px 16px;">${escapeHtml(sol.ubicacion || '')}</td>
            <td style="padding: 14px 16px;">${hectareasFormateadas}</td>
            <td style="padding: 14px 16px;">${escapeHtml(sol.tipoVegetacion || '')}</td>
            <td style="padding: 14px 16px;"><span class="psa-badge ${estadoInfo.class}">${estadoInfo.text}</span></td>
            <td style="padding: 14px 16px;">${fechaFormateada}</td>
            <td style="padding: 14px 16px;">${botones}</td>
        `;

        tbody.appendChild(row);
    });
}

/* ── 2. TABS ───────────────────────────────────────── */
function cambiarTab(tab) {
    if (!tab) return;
    VI.tabActual = tab;
    VI.paginaActual = 1;

    document.querySelectorAll('.psa-tab').forEach(btn => {
        if (btn.getAttribute('data-tab') === tab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    aplicarFiltros();
}

/* ── 3. FILTROS + BÚSQUEDA ────────────────────────── */
function aplicarFiltros() {
    if (!VI.datosOriginales || VI.datosOriginales.length === 0) {
        actualizarPaginacion([]);
        return;
    }

    let datosFiltrados = [...VI.datosOriginales];

    // Filtrar por estado
    if (VI.tabActual && VI.tabActual !== 'todos') {
        datosFiltrados = datosFiltrados.filter(sol => {
            const estadoTexto = (sol.estado || '').toLowerCase();
            const estadoFiltro = VI.tabActual.toLowerCase();

            if (estadoFiltro === 'pendiente') return estadoTexto === 'pendiente';
            if (estadoFiltro === 'proceso') return estadoTexto === 'en proceso';
            if (estadoFiltro === 'aprobada') return estadoTexto === 'aprobada';
            if (estadoFiltro === 'rechazada') return estadoTexto === 'rechazada';
            return true;
        });
    }

    // Filtrar por búsqueda
    const busqueda = document.getElementById('vi-buscador')?.value.trim().toLowerCase() || '';
    if (busqueda) {
        datosFiltrados = datosFiltrados.filter(sol =>
            (sol.nombreFinca || '').toLowerCase().includes(busqueda) ||
            (sol.propietario || '').toLowerCase().includes(busqueda) ||
            (sol.ubicacion || '').toLowerCase().includes(busqueda)
        );
    }

    // Ordenar
    const orden = document.getElementById('vi-orden')?.value || 'fecha-desc';
    datosFiltrados = ordenarDatos(datosFiltrados, orden);

    // Actualizar paginación
    actualizarPaginacion(datosFiltrados);
    actualizarContadores();
}

function ordenarDatos(datos, orden) {
    const datosOrdenados = [...datos];
    switch (orden) {
        case 'fecha-desc':
            return datosOrdenados.sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));
        case 'fecha-asc':
            return datosOrdenados.sort((a, b) => new Date(a.fechaSolicitud) - new Date(b.fechaSolicitud));
        case 'nombre-asc':
            return datosOrdenados.sort((a, b) => (a.nombreFinca || '').localeCompare(b.nombreFinca || ''));
        case 'hectareas-desc':
            return datosOrdenados.sort((a, b) => (b.hectareas || 0) - (a.hectareas || 0));
        default:
            return datosOrdenados;
    }
}

function actualizarContadores() {
    if (!VI.datosOriginales) return;

    let contadores = {
        todos: VI.datosOriginales.length,
        pendiente: 0,
        proceso: 0,
        aprobada: 0,
        rechazada: 0
    };

    VI.datosOriginales.forEach(sol => {
        const estado = (sol.estado || '').toLowerCase();
        if (estado === 'pendiente') contadores.pendiente++;
        else if (estado === 'en proceso') contadores.proceso++;
        else if (estado === 'aprobada') contadores.aprobada++;
        else if (estado === 'rechazada') contadores.rechazada++;
    });

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

    document.querySelectorAll('.psa-tab').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === 'todos');
    });

    aplicarFiltros();
}

/* ── 4. PAGINACIÓN ───────────────────────────────── */
function actualizarPaginacion(datos) {
    const total = datos.length;
    const totalPags = Math.max(1, Math.ceil(total / VI.porPagina));
    if (VI.paginaActual > totalPags) VI.paginaActual = totalPags;

    // Obtener datos de la página actual
    const inicio = (VI.paginaActual - 1) * VI.porPagina;
    const fin = inicio + VI.porPagina;
    const datosPagina = datos.slice(inicio, fin);

    // Renderizar tabla solo con los datos de la página actual
    renderizarTabla(datosPagina);

    // Texto de info
    const desde = total === 0 ? 0 : inicio + 1;
    const hasta = Math.min(fin, total);
    const infoBottom = document.getElementById('vi-pag-info-bottom');
    const infoTop = document.getElementById('vi-pag-info');

    const textoInfo = total === 0
        ? 'Sin resultados'
        : `Mostrando ${desde}–${hasta} de ${total} visita${total !== 1 ? 's' : ''}`;

    if (infoBottom) infoBottom.textContent = textoInfo;
    if (infoTop) infoTop.textContent = textoInfo;

    // Mostrar/ocultar estado vacío
    mostrarEstadoVacio(total === 0);

    // Renderizar botones de página
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

function mostrarEstadoVacio(vacio) {
    const el = document.getElementById('vi-empty');
    if (el) el.style.display = vacio ? 'block' : 'none';
}

/* ── 5. MODAL PROGRAMAR VISITA ───────────────────── */
function abrirModalProgramar(id, finca, propietario) {
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

    const id = document.getElementById('pv-solicitud-id')?.value;
    const fecha = document.getElementById('pv-fecha')?.value;
    const hora = document.getElementById('pv-hora')?.value;
    const transporte = document.getElementById('pv-transporte')?.value;
    const objetivo = document.getElementById('pv-objetivo')?.value;
    const observacion = document.getElementById('pv-observacion')?.value;

    // Aquí se haría la llamada al backend
    // fetch(`${API_URL}/api/Agenda/programar`, { method: 'POST', body: JSON.stringify({...}) })

    mostrarToastVI('✅ Visita programada correctamente.');
    cerrarModal();

    // Recargar para mostrar los cambios
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
    toast.style.background = esError ? 'var(--psa-red)' : 'var(--psa-leaf)';
    toast.classList.add('visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('visible'), 3500);
}

/* ── 8. NAVEGACIÓN ───────────────────────────────── */
function verDetalle(id) {
    if (!id || isNaN(id)) { mostrarToastVI('ID de solicitud inválido.', true); return; }
    window.location.href = `/IngForestal/Detalle?id=${encodeURIComponent(id)}`;
}

function realizarVisita(id) {
    if (!id || isNaN(id)) { mostrarToastVI('ID de solicitud inválido.', true); return; }
    window.location.href = `/IngForestal/Realizar?id=${encodeURIComponent(id)}`;
}

function programarVisita() {
    window.location.href = '/IngForestal/Programar';
}

/* ── 9. FUNCIONES AUXILIARES ─────────────────────── */
function formatFecha(fecha) {
    if (!fecha) return '';
    const date = new Date(fecha);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ── 10. INIT ────────────────────────────────────── */
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

    // Cargar solicitudes desde el backend
    cargarSolicitudes();
});