/* =====================================================
   ListaSolicitudes.js — Lista de Solicitudes | PSA
   Ruta: wwwroot/js/pages/ingforestal/ListaSolicitudes.js
   Versión: Con paginación como dashboard.js
   ===================================================== */

const API_URL = window.location.hostname === 'localhost'
    ? "https://localhost:44392"  // Desarrollo local
    : "https://spsaapi.azurewebsites.net";  // Producción

/* ── ESTADO GLOBAL ─────────────────────────────────── */
const VI = {
    tabActual: 'todos',
    paginaActual: 1,
    porPagina: 8,
    datosOriginales: [],      // Almacena todas las solicitudes
    datosFiltrados: []        // Almacena datos después de filtros
};

// Variables para filtros actuales (como en dashboard.js)
let filtrosActualesVI = {
    estado: 'todos',
    busqueda: ''
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

            // Aplicar filtros y paginación (como en dashboard.js)
            filtrarLocalmente();

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
    let loader = document.getElementById('global-loader');
    if (!loader && mostrar) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;`;
        loader.innerHTML = `<div style="background: white; padding: 20px 30px; border-radius: 12px; display: flex; gap: 12px; align-items: center;"><i class="fas fa-spinner fa-spin" style="font-size: 24px; color: var(--psa-leaf);"></i><span>Cargando solicitudes...</span></div>`;
        document.body.appendChild(loader);
    } else if (loader && !mostrar) {
        loader.remove();
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

/* ── 2. FUNCIONES DE FILTRADO Y PAGINACIÓN (como dashboard.js) ── */
function filtrarLocalmente() {
    if (!VI.datosOriginales || VI.datosOriginales.length === 0) {
        actualizarPaginacion([]);
        return;
    }

    let datosFiltrados = [...VI.datosOriginales];

    // Filtrar por estado (tab activo)
    if (filtrosActualesVI.estado && filtrosActualesVI.estado !== 'todos') {
        datosFiltrados = datosFiltrados.filter(sol => {
            const estadoTexto = (sol.estado || '').toLowerCase();
            const estadoFiltro = filtrosActualesVI.estado.toLowerCase();
            if (estadoFiltro === 'pendiente') return estadoTexto === 'pendiente';
            if (estadoFiltro === 'proceso') return estadoTexto === 'en proceso';
            if (estadoFiltro === 'aprobada') return estadoTexto === 'aprobada';
            if (estadoFiltro === 'rechazada') return estadoTexto === 'rechazada';
            return true;
        });
    }

    // Filtrar por búsqueda
    if (filtrosActualesVI.busqueda) {
        const busquedaLower = filtrosActualesVI.busqueda.toLowerCase();
        datosFiltrados = datosFiltrados.filter(sol =>
            (sol.nombreFinca || '').toLowerCase().includes(busquedaLower) ||
            (sol.propietario || '').toLowerCase().includes(busquedaLower) ||
            (sol.ubicacion || '').toLowerCase().includes(busquedaLower)
        );
    }

    // Ordenar datos (según select)
    datosFiltrados = ordenarDatos(datosFiltrados);

    // Guardar datos filtrados
    VI.datosFiltrados = datosFiltrados;

    // Actualizar paginación
    actualizarPaginacion(datosFiltrados);
}

function ordenarDatos(datos) {
    const orden = document.getElementById('vi-orden')?.value || 'fecha-desc';
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

// Actualizar paginación (como en dashboard.js)
function actualizarPaginacion(datos) {
    const totalPaginas = Math.ceil(datos.length / VI.porPagina);
    VI.paginaActual = Math.min(VI.paginaActual, totalPaginas || 1);
    renderizarPagina();
    actualizarControlesPaginacion(totalPaginas);

    // Actualizar contadores visibles
    actualizarContadoresDesdeDatos(datos);
}

// Renderizar la página actual (como en dashboard.js)
function renderizarPagina() {
    if (!VI.datosFiltrados) return;
    const inicio = (VI.paginaActual - 1) * VI.porPagina;
    const fin = inicio + VI.porPagina;
    const datosPagina = VI.datosFiltrados.slice(inicio, fin);
    renderizarTabla(datosPagina);

    const total = VI.datosFiltrados.length;
    const inicioMostrando = total === 0 ? 0 : inicio + 1;
    const finMostrando = Math.min(fin, total);
    const pagInfo = document.getElementById('pag-info');
    const pagInfoBottom = document.getElementById('vi-pag-info-bottom');

    const textoInfo = total === 0
        ? 'Sin resultados'
        : `Mostrando ${inicioMostrando} - ${finMostrando} de ${total} solicitudes`;

    if (pagInfo) pagInfo.textContent = textoInfo;
    if (pagInfoBottom) pagInfoBottom.textContent = textoInfo;

    // Mostrar/ocultar estado vacío
    const emptyDiv = document.getElementById('vi-empty');
    if (emptyDiv) emptyDiv.style.display = total === 0 ? 'block' : 'none';
}

// Actualizar botones de paginación (como en dashboard.js)
function actualizarControlesPaginacion(totalPaginas) {
    const btnPrev = document.getElementById('btn-pag-prev');
    const btnNext = document.getElementById('btn-pag-next');
    const numerosContainer = document.getElementById('pag-numeros');

    if (btnPrev) {
        btnPrev.disabled = (VI.paginaActual <= 1);
        btnPrev.onclick = () => {
            if (VI.paginaActual > 1) {
                VI.paginaActual--;
                renderizarPagina();
                actualizarControlesPaginacion(totalPaginas);
            }
        };
    }
    if (btnNext) {
        btnNext.disabled = (VI.paginaActual >= totalPaginas);
        btnNext.onclick = () => {
            if (VI.paginaActual < totalPaginas) {
                VI.paginaActual++;
                renderizarPagina();
                actualizarControlesPaginacion(totalPaginas);
            }
        };
    }

    if (numerosContainer) {
        numerosContainer.innerHTML = '';
        let inicioPaginas = Math.max(1, VI.paginaActual - 2);
        let finPaginas = Math.min(totalPaginas, inicioPaginas + 4);
        if (finPaginas - inicioPaginas < 4 && inicioPaginas > 1) inicioPaginas = Math.max(1, finPaginas - 4);
        for (let i = inicioPaginas; i <= finPaginas; i++) {
            const btn = document.createElement('button');
            btn.className = i === VI.paginaActual ? 'btn btn-psa btn-sm' : 'btn btn-outline-psa btn-sm';
            btn.style.padding = '4px 10px';
            btn.textContent = i;
            btn.onclick = () => {
                VI.paginaActual = i;
                renderizarPagina();
                actualizarControlesPaginacion(totalPaginas);
            };
            numerosContainer.appendChild(btn);
        }
    }
}

// Actualizar contadores desde datos filtrados
function actualizarContadoresDesdeDatos(datos) {
    let contadores = { total: datos.length, pendiente: 0, proceso: 0, aprobada: 0, rechazada: 0 };
    datos.forEach(sol => {
        const estado = (sol.estado || '').toLowerCase();
        if (estado === 'pendiente') contadores.pendiente++;
        else if (estado === 'en proceso') contadores.proceso++;
        else if (estado === 'aprobada') contadores.aprobada++;
        else if (estado === 'rechazada') contadores.rechazada++;
    });

    // Actualizar badges generales (totales)
    const badgeTodos = document.getElementById('badge-todos');
    const badgePendiente = document.getElementById('badge-pendiente');
    const badgeProceso = document.getElementById('badge-proceso');
    const badgeAprobada = document.getElementById('badge-aprobada');
    const badgeRechazada = document.getElementById('badge-rechazada');

    if (badgeTodos) badgeTodos.textContent = VI.datosOriginales.length;
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

/* ── 3. TABS (como en dashboard.js) ── */
function cambiarTab(tab, event = null) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (!tab) return;

    let estado = 'todos';
    if (tab === 'pendiente' || tab === 'pendientes') estado = 'pendiente';
    else if (tab === 'proceso') estado = 'proceso';
    else if (tab === 'aprobada' || tab === 'aprobadas') estado = 'aprobada';
    else if (tab === 'rechazada' || tab === 'rechazadas') estado = 'rechazada';
    else if (tab === 'todos' || tab === 'todas') estado = 'todos';
    else estado = tab;

    VI.paginaActual = 1;
    filtrosActualesVI.estado = estado;
    VI.tabActual = estado;

    const tabs = document.querySelectorAll('.psa-tab');
    tabs.forEach(btn => {
        const btnTab = btn.getAttribute('data-tab');
        if (btnTab === estado) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    const filtroEstado = document.getElementById('filtroEstado');
    if (filtroEstado) filtroEstado.value = (estado === 'todos') ? '' : estado;

    filtrarLocalmente();
}

/* ── 4. FILTROS ── */
function aplicarFiltros() {
    // Sincronizar búsqueda desde el input
    const buscador = document.getElementById('vi-buscador');
    if (buscador) {
        filtrosActualesVI.busqueda = buscador.value;
    }

    VI.paginaActual = 1;
    filtrarLocalmente();
}

function limpiarFiltros() {
    VI.paginaActual = 1;
    filtrosActualesVI = { estado: 'todos', busqueda: '' };

    const buscador = document.getElementById('vi-buscador');
    const filtroEstado = document.getElementById('filtroEstado');
    const orden = document.getElementById('vi-orden');

    if (buscador) buscador.value = '';
    if (filtroEstado) filtroEstado.value = '';
    if (orden) orden.value = 'fecha-desc';

    VI.tabActual = 'todos';
    document.querySelectorAll('.psa-tab').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === 'todos');
    });

    filtrarLocalmente();
}

/* ── 5. MODAL PROGRAMAR VISITA ── */
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

/* ── 6. VALIDACIÓN DEL FORMULARIO ── */
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
        const span = err.querySelector('span');
        if (span && !ok) span.textContent = regla.msg;
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

/* ── 7. TOAST ── */
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

/* ── 8. NAVEGACIÓN ── */
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

/* ── 9. FUNCIONES AUXILIARES ── */
function formatFecha(fecha) {
    if (!fecha) return '';
    const date = new Date(fecha);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ── 10. INIT ── */
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

    // Configurar event listeners para búsqueda
    const buscador = document.getElementById('vi-buscador');
    if (buscador) {
        buscador.addEventListener('input', aplicarFiltros);
    }

    const ordenSelect = document.getElementById('vi-orden');
    if (ordenSelect) {
        ordenSelect.addEventListener('change', aplicarFiltros);
    }

    // Cargar solicitudes desde el backend
    cargarSolicitudes();
});