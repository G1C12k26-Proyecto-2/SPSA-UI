/* =====================================================
   dashboard.js — Ingeniero Forestal | PSA
   Ruta: wwwroot/js/tecnico/dashboard.js
   Versión: Con filtros locales y paginación
   ===================================================== */

//const API_URL = "https://spsaapi.azurewebsites.net";
const API_URL = "https://localhost:44392";

const VI = {
    tabActual: 'todos',
    columnaSort: null,
    dirSort: 'asc',
    paginaActual: 1,
    porPagina: 8,
    datosOriginales: [],      // Almacena las solicitudes originales del backend
    agendaOriginal: [],       // Almacena la agenda original
};

// Variables para filtros actuales
let filtrosActuales = {
    estado: 'todos',
    tipoVegetacion: '',
    fechaDesde: '',
    fechaHasta: '',
    busqueda: ''
};

// Variables de paginación
let datosPaginados = [];

// =====================================================
// 1. CARGA INICIAL DESDE EL BACKEND
// =====================================================
async function cargarDashboard() {
    mostrarLoading(true);

    try {
        const ingenieroId = obtenerIngenieroId();
        const response = await fetch(`${API_URL}/api/Ingeniero/Ingeniero/${ingenieroId}`);
        const data = await response.json();

        if (data.result === "SUCCESS" && data.data) {
            // Guardar datos originales
            VI.datosOriginales = data.data.solicitudesRecientes || [];
            VI.agendaOriginal = data.data.agendaProxima || [];

            // Actualizar resumen de estadísticas
            actualizarResumenEstadisticas(data.data.resumen);

            // Actualizar resumen mensual
            actualizarResumenMensual(data.data.resumenMensual);

            // Renderizar agenda
            renderizarAgenda(VI.agendaOriginal);

            // Actualizar nombre del ingeniero
            const nombreIngeniero = data.data.nombreIngeniero || obtenerNombreIngeniero();
            if (nombreIngeniero) {
                actualizarNombreIngeniero(nombreIngeniero);
            }

            // Aplicar filtros y paginación
            filtrarLocalmente();

        } else {
            mostrarToast('Error al cargar los datos: ' + (data.message || 'Error desconocido'), true);
        }
    } catch (error) {
        console.error('Error al cargar dashboard:', error);
        mostrarToast('Error de conexión con el servidor', true);
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

// Obtener el nombre del ingeniero
function obtenerNombreIngeniero() {
    let nombre = localStorage.getItem('userName');
    if (!nombre) nombre = sessionStorage.getItem('userName');
    if (!nombre) {
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                nombre = user.fullName || user.userName;
            } catch (e) { console.error('Error parsing user:', e); }
        }
    }
    return nombre || 'Ingeniero';
}

// Mostrar/ocultar loading
function mostrarLoading(mostrar) {
    let loader = document.getElementById('global-loader');
    if (!loader && mostrar) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;`;
        loader.innerHTML = `<div style="background: white; padding: 20px 30px; border-radius: 12px; display: flex; gap: 12px; align-items: center;"><i class="fas fa-spinner fa-spin" style="font-size: 24px; color: var(--psa-leaf);"></i><span>Cargando dashboard...</span></div>`;
        document.body.appendChild(loader);
    } else if (loader && !mostrar) {
        loader.remove();
    }
}

// Actualizar resumen de estadísticas
function actualizarResumenEstadisticas(resumen) {
    if (!resumen) return;
    const badgeTodos = document.getElementById('badge-todos');
    const badgePendiente = document.getElementById('badge-pendiente');
    const badgeProceso = document.getElementById('badge-proceso');
    const badgeAprobada = document.getElementById('badge-aprobada');
    const badgeRechazada = document.getElementById('badge-rechazada');
    if (badgeTodos) badgeTodos.textContent = resumen.totalSolicitudes || 0;
    if (badgePendiente) badgePendiente.textContent = resumen.pendientes || 0;
    if (badgeProceso) badgeProceso.textContent = resumen.enProceso || 0;
    if (badgeAprobada) badgeAprobada.textContent = resumen.aprobadas || 0;
    if (badgeRechazada) badgeRechazada.textContent = resumen.rechazadas || 0;
}

// Actualizar resumen mensual
function actualizarResumenMensual(resumenMensual) {
    if (!resumenMensual) return;
    const fincasEvaluadas = resumenMensual.fincasEvaluadas || 0;
    const metaFincas = resumenMensual.metaFincas || 20;
    const porcentajeFincas = metaFincas > 0 ? (fincasEvaluadas / metaFincas) * 100 : 0;
    const progressFill = document.querySelector('.psa-progress-fill');
    const progressPct = document.querySelector('.psa-progress-pct');
    if (progressFill) progressFill.style.width = `${porcentajeFincas}%`;
    if (progressPct) progressPct.textContent = `${fincasEvaluadas} / ${metaFincas}`;
    const haEvaluadas = document.querySelector('.psa-detail-item:nth-child(2) .psa-detail-value');
    if (haEvaluadas) haEvaluadas.textContent = `${resumenMensual.hectareasEvaluadas || 0} ha`;
    const tasaAprobacion = document.querySelector('.psa-detail-item:nth-child(3) .psa-detail-value');
    if (tasaAprobacion) tasaAprobacion.textContent = `${resumenMensual.tasaAprobacion || 0}%`;
    const tiempoPromedio = document.querySelector('.psa-detail-item:nth-child(4) .psa-detail-value');
    if (tiempoPromedio) tiempoPromedio.textContent = `${resumenMensual.tiempoPromedioDias || 0} días`;
}

// Renderizar tabla (solo los datos de la página actual)
function renderizarTabla(solicitudes) {
    const tbody = document.getElementById('cuerpoTabla');
    if (!tbody) return;

    if (!solicitudes || solicitudes.length === 0) {
        tbody.innerHTML = '';
        const emptyDiv = document.getElementById('estadoVacio');
        if (emptyDiv) emptyDiv.style.display = 'block';
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

        row.innerHTML = `
            <td style="padding: 14px 20px;">
                <div style="font-weight: 600; color: var(--psa-forest);">${escapeHtml(sol.nombreFinca || '')}</div>
                <div style="font-size: 0.75rem; color: var(--psa-muted);">${escapeHtml(sol.propietario || '')}</div>
            </td>
            <td style="padding: 14px 20px;">${escapeHtml(sol.ubicacion || '')}</td>
            <td style="padding: 14px 20px;">${hectareasFormateadas}</td>
            <td style="padding: 14px 20px;">${escapeHtml(sol.tipoVegetacion || '')}</td>
            <td style="padding: 14px 20px;"><span class="psa-badge ${estadoInfo.class}">${estadoInfo.text}</span></td>
            <td style="padding: 14px 20px;">${fechaFormateada}</td>
            <td style="padding: 14px 20px;">
                <button class="btn-icon" style="background: none; border: none; cursor: pointer; color: var(--psa-leaf); font-size: 0.9rem; padding: 4px 8px; border-radius: 6px;" title="Ver detalle" onclick="verDetalle(${sol.idSolicitud})"><i class="fas fa-eye"></i></button>
                ${estadoTexto === 'Pendiente' ? `<button class="btn-icon" style="background: none; border: none; cursor: pointer; color: var(--psa-gold); font-size: 0.9rem; padding: 4px 8px; border-radius: 6px;" title="Iniciar evaluación" onclick="abrirModalProceso(${sol.idSolicitud}, '${escapeHtml(sol.nombreFinca)}', '${escapeHtml(sol.propietario)}')"><i class="fas fa-play"></i></button>` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });

    const emptyDiv = document.getElementById('estadoVacio');
    if (emptyDiv) emptyDiv.style.display = 'none';
}

// Renderizar agenda próxima - Versión corregida con alineación
function renderizarAgenda(agenda) {
    const timelineContainer = document.querySelector('.psa-timeline');
    if (!timelineContainer) return;

    if (!agenda || agenda.length === 0) {
        timelineContainer.innerHTML = '<div style="padding: 40px 20px; text-align: center; color: var(--psa-muted);"><i class="fas fa-calendar-day"></i><br>No hay visitas programadas</div>';
        return;
    }

    timelineContainer.innerHTML = '';

    agenda.forEach(evento => {
        const fecha = new Date(evento.fechaVisita);
        const dia = fecha.getDate();
        // Mes en mayúsculas como en el diseño original
        const mes = fecha.toLocaleString('es', { month: 'short' }).replace('.', '').toUpperCase();
        const horaFormateada = evento.horaInicioStr || evento.horaInicio;

        // Color por defecto: verde (como el original)
        let dotColor = 'green';

        // Solo cambiar color si el estado lo requiere
        const estadoEvento = (evento.estado || '').toString().toLowerCase();
        if (estadoEvento === 'pendiente') dotColor = 'gold';
        else if (estadoEvento === 'rechazada') dotColor = 'red';

        const item = document.createElement('div');
        item.className = 'psa-tl-item';
        item.style.cursor = 'pointer';
        item.onclick = () => verDetalle(evento.idSolicitud);

        item.innerHTML = `
            <div class="psa-tl-dot ${dotColor}">
                <span class="dia">${dia}</span>
                <span class="mes">${mes}</span>
            </div>
            <div class="psa-tl-body">
                <div class="psa-tl-title">${escapeHtml(evento.nombreFinca)}</div>
                <div class="psa-tl-desc">
                    <i class="fas fa-location-dot"></i> ${escapeHtml(evento.ubicacion)}
                </div>
                <div class="psa-tl-time">${horaFormateada}</div>
            </div>
        `;

        timelineContainer.appendChild(item);
    });
}

// Actualizar nombre del ingeniero en el header
function actualizarNombreIngeniero(nombre) {
    const headerBienvenida = document.querySelector('.psa-page-header p');
    if (headerBienvenida && nombre) {
        headerBienvenida.innerHTML = `Bienvenido, <strong>${escapeHtml(nombre)}</strong> — ${formatFechaHoy()}`;
    }
}

// =====================================================
// 2. FUNCIONES DE FILTRADO Y PAGINACIÓN
// =====================================================

// Función principal de filtrado local
function filtrarLocalmente() {
    if (!VI.datosOriginales || VI.datosOriginales.length === 0) {
        actualizarPaginacion([]);
        return;
    }

    let datosFiltrados = [...VI.datosOriginales];

    // Filtrar por estado
    if (filtrosActuales.estado && filtrosActuales.estado !== 'todos') {
        datosFiltrados = datosFiltrados.filter(sol => {
            const estadoTexto = (sol.estado || '').toLowerCase();
            const estadoFiltro = filtrosActuales.estado.toLowerCase();
            if (estadoFiltro === 'pendiente') return estadoTexto === 'pendiente';
            if (estadoFiltro === 'proceso') return estadoTexto === 'en proceso';
            if (estadoFiltro === 'aprobada') return estadoTexto === 'aprobada';
            if (estadoFiltro === 'rechazada') return estadoTexto === 'rechazada';
            return true;
        });
    }

    // Filtrar por búsqueda
    if (filtrosActuales.busqueda) {
        const busquedaLower = filtrosActuales.busqueda.toLowerCase();
        datosFiltrados = datosFiltrados.filter(sol =>
            (sol.nombreFinca || '').toLowerCase().includes(busquedaLower) ||
            (sol.propietario || '').toLowerCase().includes(busquedaLower) ||
            (sol.ubicacion || '').toLowerCase().includes(busquedaLower)
        );
    }

    // Filtrar por tipo de vegetación
    if (filtrosActuales.tipoVegetacion) {
        datosFiltrados = datosFiltrados.filter(sol =>
            (sol.tipoVegetacion || '').toLowerCase() === filtrosActuales.tipoVegetacion.toLowerCase()
        );
    }

    // Filtrar por rango de fechas
    if (filtrosActuales.fechaDesde) {
        const fechaDesde = new Date(filtrosActuales.fechaDesde);
        fechaDesde.setHours(0, 0, 0, 0);
        datosFiltrados = datosFiltrados.filter(sol => {
            if (!sol.fechaSolicitud) return false;
            return new Date(sol.fechaSolicitud) >= fechaDesde;
        });
    }
    if (filtrosActuales.fechaHasta) {
        const fechaHasta = new Date(filtrosActuales.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999);
        datosFiltrados = datosFiltrados.filter(sol => {
            if (!sol.fechaSolicitud) return false;
            return new Date(sol.fechaSolicitud) <= fechaHasta;
        });
    }

    // Ordenar datos
    datosFiltrados = ordenarDatos(datosFiltrados);

    // Actualizar paginación
    actualizarPaginacion(datosFiltrados);

    // Actualizar contadores
    actualizarContadoresDesdeDatos(datosFiltrados);
}

// Ordenar datos según el selector
function ordenarDatos(datos) {
    const orden = document.getElementById('filtroOrden')?.value || 'fecha-desc';
    const datosOrdenados = [...datos];
    switch (orden) {
        case 'fecha-desc': return datosOrdenados.sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));
        case 'fecha-asc': return datosOrdenados.sort((a, b) => new Date(a.fechaSolicitud) - new Date(b.fechaSolicitud));
        case 'nombre-asc': return datosOrdenados.sort((a, b) => (a.nombreFinca || '').localeCompare(b.nombreFinca || ''));
        case 'hectareas-desc': return datosOrdenados.sort((a, b) => (b.hectareas || 0) - (a.hectareas || 0));
        default: return datosOrdenados;
    }
}

// Actualizar paginación
function actualizarPaginacion(datos) {
    datosPaginados = datos;
    const totalPaginas = Math.ceil(datos.length / VI.porPagina);
    VI.paginaActual = Math.min(VI.paginaActual, totalPaginas || 1);
    renderizarPagina();
    actualizarControlesPaginacion(totalPaginas);
}

// Renderizar la página actual
function renderizarPagina() {
    if (!datosPaginados) return;
    const inicio = (VI.paginaActual - 1) * VI.porPagina;
    const fin = inicio + VI.porPagina;
    const datosPagina = datosPaginados.slice(inicio, fin);
    renderizarTabla(datosPagina);

    const total = datosPaginados.length;
    const inicioMostrando = total === 0 ? 0 : inicio + 1;
    const finMostrando = Math.min(fin, total);
    const pagInfo = document.getElementById('pag-info');
    if (pagInfo) {
        if (total === 0) pagInfo.textContent = 'Sin resultados';
        else pagInfo.textContent = `Mostrando ${inicioMostrando} - ${finMostrando} de ${total} solicitudes`;
    }
}

// Actualizar botones de paginación
function actualizarControlesPaginacion(totalPaginas) {
    const btnPrev = document.getElementById('btn-pag-prev');
    const btnNext = document.getElementById('btn-pag-next');
    const numerosContainer = document.getElementById('pag-numeros');

    if (btnPrev) {
        btnPrev.disabled = (VI.paginaActual <= 1);
        btnPrev.onclick = () => { if (VI.paginaActual > 1) { VI.paginaActual--; renderizarPagina(); actualizarControlesPaginacion(totalPaginas); } };
    }
    if (btnNext) {
        btnNext.disabled = (VI.paginaActual >= totalPaginas);
        btnNext.onclick = () => { if (VI.paginaActual < totalPaginas) { VI.paginaActual++; renderizarPagina(); actualizarControlesPaginacion(totalPaginas); } };
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
            btn.onclick = () => { VI.paginaActual = i; renderizarPagina(); actualizarControlesPaginacion(totalPaginas); };
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
}

// Función para cambiar tab
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
    filtrosActuales.estado = estado;
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

// Función para limpiar todos los filtros
function limpiarFiltros() {
    VI.paginaActual = 1;
    filtrosActuales = { estado: 'todos', tipoVegetacion: '', fechaDesde: '', fechaHasta: '', busqueda: '' };
    const buscador = document.getElementById('buscador');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroOrden = document.getElementById('filtroOrden');
    const filtroVegetacion = document.getElementById('filtroVegetacion');
    const fechaDesde = document.getElementById('fechaDesde');
    const fechaHasta = document.getElementById('fechaHasta');
    if (buscador) buscador.value = '';
    if (filtroEstado) filtroEstado.value = '';
    if (filtroOrden) filtroOrden.value = 'fecha-desc';
    if (filtroVegetacion) filtroVegetacion.value = '';
    if (fechaDesde) fechaDesde.value = '';
    if (fechaHasta) fechaHasta.value = '';
    VI.tabActual = 'todos';
    document.querySelectorAll('.psa-tab').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === 'todos');
    });
    filtrarLocalmente();
}

// =====================================================
// 3. MODAL: INICIAR EVALUACIÓN
// =====================================================
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

async function confirmarIniciarProceso() {
    if (!idSolicitudActual) {
        mostrarToast('Error: no se identificó la solicitud.', true);
        cerrarModal();
        return;
    }
    const solicitud = VI.datosOriginales.find(s => s.idSolicitud === idSolicitudActual);
    if (solicitud) solicitud.estado = 'En Proceso';
    cerrarModal();
    filtrarLocalmente();
    mostrarToast('✅ Solicitud marcada como "En Proceso" correctamente.');
}

// =====================================================
// 4. NAVEGACIÓN
// =====================================================
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

// =====================================================
// 5. TOAST
// =====================================================
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

// =====================================================
// 6. FUNCIONES AUXILIARES
// =====================================================
function formatFecha(fecha) {
    if (!fecha) return '';
    const date = new Date(fecha);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

function formatFechaHoy() {
    const hoy = new Date();
    return hoy.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Configurar event listeners para filtros adicionales
function configurarFiltrosAvanzados() {
    const filtroVegetacion = document.getElementById('filtroVegetacion');
    if (filtroVegetacion) {
        filtroVegetacion.addEventListener('change', (e) => {
            filtrosActuales.tipoVegetacion = e.target.value;
            VI.paginaActual = 1;
            filtrarLocalmente();
        });
    }
    const fechaDesde = document.getElementById('fechaDesde');
    const fechaHasta = document.getElementById('fechaHasta');
    if (fechaDesde) {
        fechaDesde.addEventListener('change', (e) => {
            filtrosActuales.fechaDesde = e.target.value;
            VI.paginaActual = 1;
            filtrarLocalmente();
        });
    }
    if (fechaHasta) {
        fechaHasta.addEventListener('change', (e) => {
            filtrosActuales.fechaHasta = e.target.value;
            VI.paginaActual = 1;
            filtrarLocalmente();
        });
    }
}

// =====================================================
// 7. INICIALIZACIÓN
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    cargarDashboard();

    const buscador = document.getElementById('buscador');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroOrden = document.getElementById('filtroOrden');

    if (buscador) {
        buscador.addEventListener('input', (e) => {
            filtrosActuales.busqueda = e.target.value;
            VI.paginaActual = 1;
            filtrarLocalmente();
        });
    }
    if (filtroEstado) {
        filtroEstado.addEventListener('change', (e) => {
            filtrosActuales.estado = e.target.value || 'todos';
            VI.paginaActual = 1;
            document.querySelectorAll('.psa-tab').forEach(btn => {
                const btnTab = btn.getAttribute('data-tab');
                if (btnTab === filtrosActuales.estado) btn.classList.add('active');
                else btn.classList.remove('active');
            });
            filtrarLocalmente();
        });
    }
    if (filtroOrden) {
        filtroOrden.addEventListener('change', () => {
            VI.paginaActual = 1;
            filtrarLocalmente();
        });
    }

    configurarFiltrosAvanzados();

    const btnLimpiar = document.getElementById('btnLimpiarFiltros');
    if (btnLimpiar) btnLimpiar.addEventListener('click', limpiarFiltros);

    const overlay = document.getElementById('modalProceso');
    if (overlay) {
        overlay.addEventListener('click', e => { if (e.target === overlay) cerrarModal(); });
    }
});