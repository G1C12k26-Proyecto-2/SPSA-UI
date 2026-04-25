/* =====================================================
   detalle.js — Detalle de Solicitud | PSA
   Ruta: wwwroot/js/pages/ingforestal/detalle.js
   Versión: Con carga dinámica (igual que dashboard.js)
   ===================================================== */

const API_URL = window.location.hostname === 'localhost'
    ? "https://localhost:44392"  // Desarrollo local
    : "https://spsaapi.azurewebsites.net";  // Producción

// Variables globales
let datosDetalle = null;
let fotosActuales = [];
let fotoActualIndex = 0;

// =====================================================
// 1. CARGA INICIAL DESDE EL BACKEND
// =====================================================

async function cargarDetalle() {
    mostrarLoading(true);

    try {
        const idSolicitud = obtenerIdSolicitud();
        if (!idSolicitud) {
            mostrarToast('ID de solicitud no válido', true);
            return;
        }

        const response = await fetch(`${API_URL}/api/Ingeniero/solicitud/${idSolicitud}`);
        const data = await response.json();

        if (data.result === "SUCCESS" && data.data) {
            datosDetalle = data.data;
            renderizarDetalle(datosDetalle);
        } else {
            mostrarToast('Error al cargar los datos: ' + (data.message || 'Error desconocido'), true);
        }
    } catch (error) {
        console.error('Error al cargar detalle:', error);
        mostrarToast('Error de conexión con el servidor', true);
    } finally {
        mostrarLoading(false);
    }
}

function obtenerIdSolicitud() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function mostrarLoading(mostrar) {
    const loading = document.getElementById('dt-loading');
    const contenido = document.getElementById('dt-contenido');
    if (loading) loading.style.display = mostrar ? 'block' : 'none';
    if (contenido) contenido.style.display = mostrar ? 'none' : 'block';
}

// =====================================================
// 2. RENDERIZADO DEL DETALLE
// =====================================================

function renderizarDetalle(data) {
    const detalle = data.detalle;
    const archivos = data.archivos?.archivos || [];
    const historial = data.historial?.historial || [];
    const calculoPago = data.calculoPago?.calculoPago;

    const fotos = archivos.filter(a => a.esImagen);
    const documentos = archivos.filter(a => !a.esImagen);
    fotosActuales = fotos;

    const html = `
        <!-- ===== PAGE HEADER ===== -->
        <div class="psa-page-header">
            <div>
                <span class="subtitle">Detalle de Solicitud</span>
                <h1>${escapeHtml(detalle.nombreFinca || '')}</h1>
                <div class="psa-meta" style="display: flex; gap: 1rem; margin-top: 0.5rem; flex-wrap: wrap;">
                    <span class="psa-badge ${getBadgeClass(detalle.estado)}">
                        ${getEstadoTexto(detalle.estado)}
                    </span>
                    <span class="psa-meta-item" style="font-size: 0.75rem; color: var(--psa-muted);">
                        <i class="fas fa-location-dot"></i> ${escapeHtml(detalle.provincia || '')}, ${escapeHtml(detalle.canton || '')}
                    </span>
                    <span class="psa-meta-item" style="font-size: 0.75rem; color: var(--psa-muted);">
                        <i class="fas fa-calendar"></i> Visita: ${formatFecha(detalle.fechaVisitaProgramada) || 'No programada'}
                    </span>
                    <span class="psa-meta-item" style="font-size: 0.75rem; color: var(--psa-muted);">
                        <i class="fas fa-user-tie"></i> ${escapeHtml(detalle.ingenieroNombre || 'No asignado')}
                    </span>
                </div>
            </div>
<div style="display: flex; gap: 0.75rem;">
    <a class="btn btn-outline-psa btn-sm" href="javascript:history.back()">
        <i class="fas fa-arrow-left"></i> Volver
    </a>
    ${detalle.estado?.toLowerCase() === 'pendiente' ? `
    <button class="btn btn-outline-psa btn-sm" onclick="programarVisita()">
        <i class="fas fa-calendar-plus"></i> Programar Visita
    </button>` : ''}
    ${detalle.estado?.toLowerCase() === 'en proceso' ? `
    <button class="btn btn-psa btn-sm" onclick="realizarVisita()">
        <i class="fas fa-clipboard-check"></i> Realizar Visita
    </button>` : ''}
</div>
        </div>

        <!-- ===== LAYOUT ===== -->
        <div style="display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; align-items: start;">
            
            <!-- COLUMNA PRINCIPAL -->
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">

                <!-- DATOS DE LA FINCA -->
                <div class="psa-card">
                    <div class="psa-card-header">
                        <div class="psa-card-title">
                            <i class="fas fa-tree"></i> Datos de la Finca
                        </div>
                    </div>
                    <div class="psa-card-body">
                        <div class="dt-data-grid">
                            <div class="dt-data-item">
                                <span class="dt-data-label">Propietario</span>
                                <span class="dt-data-valor destacado">${escapeHtml(detalle.propietario || '')}</span>
                            </div>
                            <div class="dt-data-item">
                                <span class="dt-data-label">Ubicación</span>
                                <span class="dt-data-valor">${escapeHtml(detalle.provincia || '')}, ${escapeHtml(detalle.canton || '')}, ${escapeHtml(detalle.distrito || '')}</span>
                            </div>
                            <div class="dt-data-item">
                                <span class="dt-data-label">Hectáreas</span>
                                <span class="dt-data-valor destacado">${detalle.hectareasOriginal ? detalle.hectareasOriginal.toFixed(2) : '0'} ha</span>
                            </div>
                            <div class="dt-data-item">
                                <span class="dt-data-label">Tipo de vegetación</span>
                                <span class="dt-data-valor">${escapeHtml(detalle.tipoVegetacionOriginal || '')}</span>
                            </div>
                            <div class="dt-data-item">
                                <span class="dt-data-label">Recursos hídricos</span>
                                <span class="dt-data-valor">${getRecursosHidricosTexto(detalle)}</span>
                            </div>
                            <div class="dt-data-item">
                                <span class="dt-data-label">Pendiente</span>
                                <span class="dt-data-valor">${escapeHtml(detalle.pendienteOriginal || '')}</span>
                            </div>
                            <div class="dt-data-item">
                                <span class="dt-data-label">Uso de suelo</span>
                                <span class="dt-data-valor">${escapeHtml(detalle.usoSueloOriginal || '')}</span>
                            </div>
                            <div class="dt-data-item">
                                <span class="dt-data-label">Fecha de solicitud</span>
                                <span class="dt-data-valor">${formatFecha(detalle.fechaSolicitud)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                ${detalle.hectareasVerificadas ? `
                <!-- DATOS VERIFICADOS EN CAMPO -->
                <div class="psa-card">
                    <div class="psa-card-header">
                        <div class="psa-card-title">
                            <i class="fas fa-clipboard-list"></i> Datos Verificados en Campo
                        </div>
                    </div>
                    <div class="psa-card-body">
                        <div class="dt-data-grid">
                            <div class="dt-data-item">
                                <span class="dt-data-label">Hectáreas verificadas</span>
                                <span class="dt-data-valor destacado">${detalle.hectareasVerificadas ? detalle.hectareasVerificadas.toFixed(2) : '—'} ha</span>
                            </div>
                            <div class="dt-data-item">
                                <span class="dt-data-label">Tipo de vegetación</span>
                                <span class="dt-data-valor">${escapeHtml(detalle.tipoVegetacionVerificado || '')}</span>
                            </div>
                            <div class="dt-data-item">
                                <span class="dt-data-label">Pendiente</span>
                                <span class="dt-data-valor">${escapeHtml(detalle.pendienteVerificada || '')}</span>
                            </div>
                            <div class="dt-data-item">
                                <span class="dt-data-label">Recursos hídricos</span>
                                <span class="dt-data-valor">${getRecursosHidricosVerificadosTexto(detalle)}</span>
                            </div>
                            <div class="dt-data-item">
                                <span class="dt-data-label">Uso de suelo</span>
                                <span class="dt-data-valor">${escapeHtml(detalle.usoSueloVerificado || '')}</span>
                            </div>
                            ${detalle.observacionesTecnicas ? `
                            <div class="dt-data-item" style="grid-column: span 2;">
                                <span class="dt-data-label">Observaciones técnicas</span>
                                <span class="dt-data-valor">${escapeHtml(detalle.observacionesTecnicas)}</span>
                            </div>` : ''}
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- FOTOGRAFÍAS -->
                ${fotos.length > 0 ? `
                <div class="psa-card">
                    <div class="psa-card-header">
                        <div class="psa-card-title">
                            <i class="fas fa-images"></i> Fotografías de la Finca
                        </div>
                        <span style="font-size: 0.7rem; color: var(--psa-muted);">${fotos.length} foto(s) adjunta(s)</span>
                    </div>
                    <div class="psa-card-body">
                        <div class="dt-galeria">
                            ${fotos.map((foto, idx) => `
                                <div class="dt-foto-item" data-foto-index="${idx}" data-foto-src="${foto.urlArchivo}" data-foto-alt="${foto.nombreArchivo}" role="button" tabindex="0">
                                    <div class="dt-foto-placeholder">📷</div>
                                    <div class="dt-foto-overlay"><i class="fas fa-search-plus"></i></div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- DOCUMENTOS ADJUNTOS -->
                ${documentos.length > 0 ? `
                <div class="psa-card">
                    <div class="psa-card-header">
                        <div class="psa-card-title">
                            <i class="fas fa-paperclip"></i> Documentos Adjuntos
                        </div>
                    </div>
                    <div class="psa-card-body">
                        <div class="dt-doc-list">
                            ${documentos.map(doc => `
                                <div class="dt-doc-item" role="button" tabindex="0" onclick="window.open('${doc.urlArchivo}', '_blank')">
                                    <div class="dt-doc-icon"><i class="fas fa-file-${doc.extension === '.pdf' ? 'pdf' : 'alt'}"></i></div>
                                    <span class="dt-doc-nombre">${escapeHtml(doc.nombreArchivo)}</span>
                                    <span class="dt-doc-meta">${doc.tipoArchivo}</span>
                                    <i class="fas fa-download" style="color: var(--psa-muted); font-size: 0.85rem;"></i>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <!-- CÁLCULO DE PAGO - Solo visible si la solicitud está APROBADA -->
${detalle.estado?.toLowerCase() === 'aprobada' && calculoPago && calculoPago.montoTotalMensual > 0 ? `
<div class="psa-card">
    <div class="psa-card-header">
        <div class="psa-card-title">
            <i class="fas fa-coins"></i> Cálculo de Pago Mensual Estimado
        </div>
    </div>
    <div class="psa-card-body" style="padding: 0;">
        <div class="ed-calculo-wrap">
            <div class="ed-calculo-header">
                <div class="ed-calculo-header-left">
                    <p>Pago mensual estimado</p>
                    <div class="ed-calculo-monto">
                        ${calculoPago.montoTotalFormateado || `₡ ${calculoPago.montoTotalMensual.toLocaleString()}`}
                    </div>
                    <div class="ed-calculo-sub">
                        Tope de ajustes: ${Math.round(calculoPago.topeAplicado || 0)}% · Ajuste aplicado: ${Math.round(calculoPago.porcentajeAplicado || 0)}%
                    </div>
                </div>
                <div class="ed-calculo-icon">💰</div>
            </div>
            <div class="ed-calculo-filas">
                <div class="ed-calculo-fila">
                    <span class="ed-calculo-label">Precio base por hectárea</span>
                    <span class="ed-calculo-val">${calculoPago.montoBaseFormateado || `₡ ${(calculoPago.precioBaseHectarea || 0).toLocaleString()}`}</span>
                </div>
                <div class="ed-calculo-fila">
                    <span class="ed-calculo-label">Hectáreas verificadas</span>
                    <span class="ed-calculo-val">${(calculoPago.hectareasUtilizadas || 0).toFixed(2)} ha</span>
                </div>
                <div class="ed-calculo-fila">
                    <span class="ed-calculo-label">Monto base</span>
                    <span class="ed-calculo-val">${calculoPago.montoBaseFormateado || `₡ ${(calculoPago.montoBase || 0).toLocaleString()}`}</span>
                </div>
                <div class="ed-calculo-fila">
                    <span class="ed-calculo-label">Ajuste vegetación (${calculoPago.tipoVegetacion || 'N/A'})</span>
                    <span class="ed-calculo-val positivo">+${Math.round(calculoPago.porcentajeVegetacion || 0)}%</span>
                </div>
                <div class="ed-calculo-fila">
                    <span class="ed-calculo-label">Ajuste pendiente (${calculoPago.pendiente || 'N/A'})</span>
                    <span class="ed-calculo-val positivo">+${Math.round(calculoPago.porcentajePendiente || 0)}%</span>
                </div>
                <div class="ed-calculo-fila">
                    <span class="ed-calculo-label">Ajuste recursos hídricos</span>
                    <span class="ed-calculo-val positivo">+${Math.round(calculoPago.porcentajeHidrico || 0)}%</span>
                </div>
                <div class="ed-calculo-fila">
                    <span class="ed-calculo-label">Total ajuste aplicado</span>
                    <span class="ed-calculo-val positivo">
                        +${Math.round(calculoPago.porcentajeAplicado || 0)}% = ${calculoPago.montoAjusteFormateado || `₡ ${(calculoPago.montoAjuste || 0).toLocaleString()}`}
                    </span>
                </div>
                <div class="ed-calculo-fila" style="border-top: 2px solid var(--psa-border); padding-top: 0.75rem; margin-top: 0.25rem;">
                    <span class="ed-calculo-label" style="font-weight: 700; font-size: 0.9rem;">Total mensual estimado</span>
                    <span class="ed-calculo-val total">${calculoPago.montoTotalFormateado || `₡ ${(calculoPago.montoTotalMensual || 0).toLocaleString()}`}</span>
                </div>
            </div>
            <p class="ed-calculo-nota">
                Estimación referencial basada en los parámetros vigentes al momento de la evaluación.
                El monto final es calculado y ejecutado por el sistema de pagos al aprobar la solicitud.
            </p>
        </div>
    </div>
</div>
` : ''}

            </div>

            <!-- COLUMNA ASIDE -->
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">

                <!-- Tarjeta de estado -->
                <!-- Tarjeta de estado -->
<div class="dt-estado-card">
    <div class="dt-estado-header ${getEstadoHeaderClass(detalle.estado)}">
        <p>Estado actual</p>
        <div class="dt-estado-chip-grande ${getEstadoChipClass(detalle.estado)}">
            <i class="fas ${getEstadoIcono(detalle.estado)}"></i>
            <span id="dt-estado-grande">${getEstadoTexto(detalle.estado)}</span>
        </div>
    </div>
    <div class="dt-estado-body">
        <div class="dt-estado-fila">
            <span class="dt-estado-fila-label">Solicitud</span>
            <span class="dt-estado-fila-val">${formatFecha(detalle.fechaSolicitud)}</span>
        </div>
        <div class="dt-estado-fila">
            <span class="dt-estado-fila-label">Visita programada</span>
            <span class="dt-estado-fila-val">${formatFecha(detalle.fechaVisitaProgramada) || '—'}</span>
        </div>
        <div class="dt-estado-fila">
            <span class="dt-estado-fila-label">Hora</span>
            <span class="dt-estado-fila-val">${detalle.horaInicioVisita || '—'}</span>
        </div>
        <div class="dt-estado-fila">
            <span class="dt-estado-fila-label">Ingeniero</span>
            <span class="dt-estado-fila-val">${escapeHtml(detalle.ingenieroNombre || 'No asignado')}</span>
        </div>
    </div>
</div>

<!-- Acciones rápidas - Solo visible para Pendiente o En Proceso -->
${detalle.estado?.toLowerCase() === 'pendiente' || detalle.estado?.toLowerCase() === 'en proceso' ? `
<div class="psa-card">
    <div class="psa-card-header">
        <div class="psa-card-title">
            <i class="fas fa-bolt"></i> Acciones
        </div>
    </div>
    <div class="psa-card-body">
        <div class="dt-acciones-aside">
            ${detalle.estado?.toLowerCase() === 'pendiente' ? `
            <button class="btn btn-psa" onclick="programarVisita()">
                <i class="fas fa-calendar-plus"></i> Programar Visita
            </button>` : ''}
            ${detalle.estado?.toLowerCase() === 'en proceso' ? `
            <button class="btn btn-psa" onclick="realizarVisita()">
                <i class="fas fa-clipboard-check"></i> Realizar Visita
            </button>` : ''}
            <a class="btn btn-outline-psa" href="/IngForestal/Agenda" style="justify-content: center;">
                <i class="fas fa-calendar-days"></i> Ver Agenda
            </a>
        </div>
    </div>
</div>
` : ''}

                <!-- Timeline / Historial -->
                ${historial.length > 0 ? `
                <div class="psa-card">
                    <div class="psa-card-header">
                        <div class="psa-card-title">
                            <i class="fas fa-timeline"></i> Historial
                        </div>
                    </div>
                    <div class="psa-card-body" style="padding: 0;">
                        <div class="dt-timeline">
                            ${historial.map(item => `
                                <div class="dt-timeline-item">
                                    <div class="dt-timeline-dot ${getTimelineDotClass(item)}">
                                        ${getTimelineDotIcon(item)}
                                    </div>
                                    <div class="dt-timeline-info">
                                        <div class="dt-timeline-titulo">${escapeHtml(item.estadoNuevoNombre)}</div>
                                        <div class="dt-timeline-sub">${escapeHtml(item.usuarioNombre)} · ${escapeHtml(item.modulo)}</div>
                                        ${item.motivo ? `<div class="dt-timeline-sub" style="color: var(--psa-red);">Motivo: ${escapeHtml(item.motivo)}</div>` : ''}
                                    </div>
                                    <div class="dt-timeline-fecha">${formatFecha(item.fechaCambio)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                ` : ''}

            </div>

        </div>
    `;

    document.getElementById('dt-contenido').innerHTML = html;

    // Inicializar eventos de las fotos
    inicializarGaleria();
}

// =====================================================
// 3. FUNCIONES AUXILIARES
// =====================================================

function getBadgeClass(estado) {
    const e = estado?.toLowerCase() || '';
    if (e === 'pendiente') return 'psa-badge-gold';
    if (e === 'en proceso') return 'psa-badge-blue';
    if (e === 'aprobada') return 'psa-badge-green';
    if (e === 'rechazada') return 'psa-badge-red';
    return 'psa-badge-grey';
}

function getEstadoTexto(estado) {
    const e = estado?.toLowerCase() || '';
    if (e === 'pendiente') return 'Pendiente';
    if (e === 'en proceso') return 'En Proceso';
    if (e === 'aprobada') return 'Aprobada';
    if (e === 'rechazada') return 'Rechazada';
    return estado || 'Desconocido';
}
function getEstadoChipClass(estado) {
    const e = estado?.toLowerCase() || '';
    if (e === 'pendiente') return 'dt-estado-chip-gold';
    if (e === 'en proceso') return 'dt-estado-chip-blue';
    if (e === 'aprobada') return 'dt-estado-chip-green';
    if (e === 'rechazada') return 'dt-estado-chip-red';
    return 'dt-estado-chip-grey';
}

function getEstadoIcono(estado) {
    const e = estado?.toLowerCase() || '';
    if (e === 'pendiente') return 'fa-hourglass-half';
    if (e === 'en proceso') return 'fa-spinner fa-pulse';
    if (e === 'aprobada') return 'fa-check-circle';
    if (e === 'rechazada') return 'fa-times-circle';
    return 'fa-question-circle';
}
function getEstadoHeaderClass(estado) {
    const e = estado?.toLowerCase() || '';
    if (e === 'pendiente') return 'dt-estado-header-gold';
    if (e === 'en proceso') return 'dt-estado-header-blue';
    if (e === 'aprobada') return 'dt-estado-header-green';
    if (e === 'rechazada') return 'dt-estado-header-red';
    return 'dt-estado-header-grey';
}
function getRecursosHidricosTexto(detalle) {
    const partes = [];
    if (detalle.tieneRiosQuebradasOriginal) partes.push('Río/Quebrada');
    if (detalle.cantidadNacientesOriginal > 0) partes.push(`${detalle.cantidadNacientesOriginal} naciente(s)`);
    if (partes.length === 0) return 'No registrados';
    return partes.join(' · ');
}

function getRecursosHidricosVerificadosTexto(detalle) {
    const partes = [];
    if (detalle.tieneRiosQuebradasVerificado) partes.push('Río/Quebrada');
    if (detalle.cantidadNacientesVerificado > 0) partes.push(`${detalle.cantidadNacientesVerificado} naciente(s)`);
    if (partes.length === 0) return 'No registrados';
    return partes.join(' · ');
}

function getTimelineDotClass(item) {
    const estadoActual = datosDetalle?.detalle?.estado?.toLowerCase() || '';
    const itemEstado = item.estadoNuevoNombre?.toLowerCase() || '';

    if (itemEstado === getEstadoTexto(estadoActual).toLowerCase()) return 'activo';
    if (item.estadoNuevo === 0) return 'pendiente';
    return 'completado';
}

function getTimelineDotIcon(item) {
    const estadoActual = datosDetalle?.detalle?.estado?.toLowerCase() || '';
    const itemEstado = item.estadoNuevoNombre?.toLowerCase() || '';

    if (itemEstado === getEstadoTexto(estadoActual).toLowerCase()) return '<i class="fas fa-spinner"></i>';
    if (item.estadoNuevo === 0) return '<i class="fas fa-circle"></i>';
    return '<i class="fas fa-check"></i>';
}

function formatFecha(fecha) {
    if (!fecha) return '';
    const date = new Date(fecha);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function mostrarToast(mensaje, esError = false) {
    const toast = document.getElementById('dt-toast');
    const msgSpan = document.getElementById('dt-toast-msg');
    if (!toast || !mensaje) return;
    msgSpan.textContent = mensaje;
    toast.classList.toggle('error', esError);
    toast.classList.add('visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('visible'), 3500);
}

// =====================================================
// 4. VISOR DE FOTOS (lightbox)
// =====================================================

function inicializarGaleria() {
    const fotosElements = document.querySelectorAll('.dt-foto-item');
    fotosElements.forEach((el, idx) => {
        el.addEventListener('click', () => abrirFoto(idx));
    });
}

function abrirFoto(index) {
    if (index < 0 || index >= fotosActuales.length) return;
    fotoActualIndex = index;
    const overlay = document.getElementById('dt-lightbox');
    const img = document.getElementById('dt-lightbox-img');
    const counter = document.getElementById('dt-lightbox-counter');
    if (!overlay || !img) return;

    img.src = fotosActuales[index].urlArchivo;
    img.alt = fotosActuales[index].nombreArchivo || 'Fotografía de la finca';
    if (counter) counter.textContent = `${index + 1} / ${fotosActuales.length}`;

    overlay.classList.add('activo');
    document.addEventListener('keydown', lightboxTeclado);
}

function cerrarLightbox() {
    document.getElementById('dt-lightbox')?.classList.remove('activo');
    document.removeEventListener('keydown', lightboxTeclado);
}

function lightboxAnterior() {
    abrirFoto(fotoActualIndex - 1 < 0 ? fotosActuales.length - 1 : fotoActualIndex - 1);
}

function lightboxSiguiente() {
    abrirFoto(fotoActualIndex + 1 >= fotosActuales.length ? 0 : fotoActualIndex + 1);
}

function lightboxTeclado(e) {
    if (e.key === 'Escape') cerrarLightbox();
    if (e.key === 'ArrowLeft') lightboxAnterior();
    if (e.key === 'ArrowRight') lightboxSiguiente();
}

// =====================================================
// 5. NAVEGACIÓN
// =====================================================

function realizarVisita() {
    const id = obtenerIdSolicitud();
    if (!id) { mostrarToast('ID de solicitud inválido.', true); return; }
    window.location.href = `/IngForestal/Realizar?id=${encodeURIComponent(id)}`;
}

function programarVisita() {
    const id = obtenerIdSolicitud();
    if (!id) { mostrarToast('ID de solicitud inválido.', true); return; }
    window.location.href = `/IngForestal/Programar?id=${encodeURIComponent(id)}`;
}

// =====================================================
// 6. INICIALIZACIÓN
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    cargarDetalle();
});