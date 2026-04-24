/* =====================================================
   programar.js — Visitas / Programar | PSA
   Ruta: wwwroot/js/ingforestal/programar.js
   Versión: Conectado al backend
   ===================================================== */

const API_URL = "https://localhost:44392";

/* ── ESTADO GLOBAL ─────────────────────────────────── */
const PR = {
    pasoActual: 1,
    totalPasos: 3,
    solicitudId: null,
    solicitudNombre: '',
    solicitudProp: '',
    solicitudUbic: '',
    solicitudHas: '',
    solicitudVeg: '',
    ingenieroId: null,
    todasSolicitudes: []  // ← Agregar esta línea
};

/* ── OBTENER ID DEL INGENIERO ─────────────────────── */
function obtenerIngenieroId() {
    let id = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (!id) {
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                id = user.id;
            } catch (e) { console.error('Error parsing user:', e); }
        }
    }
    if (!id) {
        console.warn('No se encontró ID de usuario, usando valor por defecto 57');
        return 57;
    }
    return parseInt(id);
}

/* ── CARGAR SOLICITUDES DESDE EL BACKEND ─────────── */
async function cargarSolicitudes(idParaFiltrar = null) {
    const listaContainer = document.getElementById('pr-lista-solicitudes');
    if (!listaContainer) return;

    listaContainer.innerHTML = '<div class="pr-solicitudes-empty"><i class="fas fa-spinner fa-spin"></i><p>Cargando solicitudes...</p></div>';

    try {
        PR.ingenieroId = obtenerIngenieroId();
        const response = await fetch(`${API_URL}/api/Ingeniero/solicitudes/pendientes/${PR.ingenieroId}`);
        const data = await response.json();

        if (data.result === "SUCCESS" && data.data && data.data.length > 0) {
            // Guardar todas las solicitudes originales
            PR.todasSolicitudes = data.data;

            // Renderizar solicitudes (con filtro si viene idParaFiltrar)
            renderSolicitudes(data.data, idParaFiltrar);

            // Si hay idParaFiltrar, buscar y seleccionar esa solicitud
            if (idParaFiltrar) {
                const solicitud = data.data.find(s => s.idSolicitud === idParaFiltrar);
                if (solicitud) {
                    seleccionarSolicitud(solicitud);
                    // Opcional: mostrar un mensaje indicando que se filtró
                    const buscador = document.getElementById('pr-buscar-sol');
                    if (buscador) {
                        buscador.value = solicitud.nombreFinca;
                        aplicarFiltroBusqueda(solicitud.nombreFinca);
                    }
                }
            }
        } else {
            listaContainer.innerHTML = '<div class="pr-solicitudes-empty"><i class="fas fa-inbox"></i><p>No hay solicitudes pendientes asignadas.</p></div>';
        }
    } catch (error) {
        console.error('Error al cargar solicitudes:', error);
        listaContainer.innerHTML = '<div class="pr-solicitudes-empty"><i class="fas fa-exclamation-triangle"></i><p>Error al cargar solicitudes.</p></div>';
        mostrarToastPR('Error de conexión con el servidor', true);
    }
}

function renderSolicitudes(solicitudes, idParaSeleccionar = null) {
    const listaContainer = document.getElementById('pr-lista-solicitudes');
    if (!listaContainer) return;

    listaContainer.innerHTML = '';

    if (!solicitudes || solicitudes.length === 0) {
        listaContainer.innerHTML = '<div class="pr-solicitudes-empty"><i class="fas fa-inbox"></i><p>No hay solicitudes pendientes.</p></div>';
        return;
    }

    solicitudes.forEach(sol => {
        const isSelected = (PR.solicitudId === sol.idSolicitud) || (idParaSeleccionar === sol.idSolicitud);
        const item = document.createElement('div');
        item.className = `pr-solicitud-item ${isSelected ? 'seleccionada' : ''}`;
        item.setAttribute('data-id', sol.idSolicitud);
        item.setAttribute('data-nombre', sol.nombreFinca);
        item.setAttribute('data-propietario', sol.propietario);
        item.setAttribute('data-ubicacion', sol.ubicacion);
        item.setAttribute('data-hectareas', sol.hectareas);
        item.setAttribute('data-vegetacion', sol.tipoVegetacion);
        item.setAttribute('role', 'radio');
        item.setAttribute('aria-checked', isSelected ? 'true' : 'false');
        item.setAttribute('tabindex', '0');

        item.innerHTML = `
            <div class="pr-solicitud-icono">
                <i class="fas fa-tree"></i>
            </div>
            <div class="pr-solicitud-contenido">
                <div class="pr-solicitud-nombre">${escapeHtml(sol.nombreFinca)}</div>
                <div class="pr-solicitud-detalle">
                    <span><i class="fas fa-user"></i> ${escapeHtml(sol.propietario)}</span>
                    <span><i class="fas fa-location-dot"></i> ${escapeHtml(sol.ubicacion)}</span>
                </div>
                <div class="pr-solicitud-metricas">
                    <span class="pr-metrica"><i class="fas fa-ruler-combined"></i> ${parseFloat(sol.hectareas).toFixed(2)} ha</span>
                    <span class="pr-metrica"><i class="fas fa-leaf"></i> ${escapeHtml(sol.tipoVegetacion)}</span>
                    <span class="pr-metrica estado"><i class="fas fa-hourglass-half"></i> ${escapeHtml(sol.estado)}</span>
                </div>
            </div>
            <div class="pr-solicitud-seleccion">
                <i class="fas fa-check"></i>
            </div>
        `;

        item.addEventListener('click', () => seleccionarSolicitud(sol));
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') seleccionarSolicitud(sol);
        });

        listaContainer.appendChild(item);
    });

    // Si hay idParaSeleccionar, actualizar PR.solicitudId
    if (idParaSeleccionar) {
        const solicitud = solicitudes.find(s => s.idSolicitud === idParaSeleccionar);
        if (solicitud && !PR.solicitudId) {
            PR.solicitudId = solicitud.idSolicitud;
            PR.solicitudNombre = solicitud.nombreFinca;
            PR.solicitudProp = solicitud.propietario;
            PR.solicitudUbic = solicitud.ubicacion;
            PR.solicitudHas = solicitud.hectareas;
            PR.solicitudVeg = solicitud.tipoVegetacion;
            actualizarResumen();
        }
    }
}

function seleccionarSolicitud(sol) {
    PR.solicitudId = sol.idSolicitud;
    PR.solicitudNombre = sol.nombreFinca;
    PR.solicitudProp = sol.propietario;
    PR.solicitudUbic = sol.ubicacion;
    PR.solicitudHas = sol.hectareas;
    PR.solicitudVeg = sol.tipoVegetacion;

    // Actualizar visualmente
    const items = document.querySelectorAll('.pr-solicitud-item');
    items.forEach(item => {
        const id = parseInt(item.getAttribute('data-id'));
        if (id === sol.idSolicitud) {
            item.classList.add('seleccionada');
            item.setAttribute('aria-checked', 'true');
        } else {
            item.classList.remove('seleccionada');
            item.setAttribute('aria-checked', 'false');
        }
    });

    actualizarResumen();
    const err = document.getElementById('pr-sol-err');
    if (err) err.style.display = 'none';
}

function getSolicitudSeleccionada() {
    if (!PR.solicitudId) return null;
    return {
        idSolicitud: PR.solicitudId,
        nombreFinca: PR.solicitudNombre,
        propietario: PR.solicitudProp,
        ubicacion: PR.solicitudUbic,
        hectareas: PR.solicitudHas,
        tipoVegetacion: PR.solicitudVeg
    };
}

/* ── FUNCIONES DE NAVEGACIÓN ─────────────────────── */
function irPaso(paso) {
    if (paso < 1 || paso > PR.totalPasos) return;
    if (paso > PR.pasoActual) {
        if (!validarPasoActual()) return;
    }

    PR.pasoActual = paso;
    actualizarStepper();
    mostrarSeccion(paso);
    if (paso === PR.totalPasos) construirConfirmacion();
}

function pasoAnterior() { irPaso(PR.pasoActual - 1); }
function pasoSiguiente() { irPaso(PR.pasoActual + 1); }

function actualizarStepper() {
    document.querySelectorAll('.pr-step').forEach((el, i) => {
        const n = i + 1;
        el.classList.remove('activo', 'completado');
        if (n === PR.pasoActual) el.classList.add('activo');
        if (n < PR.pasoActual) el.classList.add('completado');

        const numEl = el.querySelector('.pr-step-num');
        if (numEl) {
            numEl.innerHTML = n < PR.pasoActual ? '<i class="fas fa-check"></i>' : n;
        }
    });

    const btnAnterior = document.getElementById('pr-btn-anterior');
    const btnSiguiente = document.getElementById('pr-btn-siguiente');
    const btnGuardar = document.getElementById('pr-btn-guardar');

    if (btnAnterior) btnAnterior.style.display = PR.pasoActual === 1 ? 'none' : 'inline-flex';
    if (btnSiguiente) btnSiguiente.style.display = PR.pasoActual === PR.totalPasos ? 'none' : 'inline-flex';
    if (btnGuardar) btnGuardar.style.display = PR.pasoActual === PR.totalPasos ? 'inline-flex' : 'none';
}

function mostrarSeccion(paso) {
    document.querySelectorAll('.pr-seccion').forEach((s, i) => {
        s.classList.toggle('activa', i + 1 === paso);
    });
}

/* ── VALIDACIÓN ──────────────────────────────────── */
const PR_REGLAS = {
    'pr-fecha': { req: true, tipo: 'fecha-futura', msg: 'Seleccione una fecha válida (hoy o posterior).' },
    'pr-hora': { req: true, tipo: 'texto', msg: 'Indique la hora de la visita.' },
    'pr-transporte': { req: true, tipo: 'select', msg: 'Seleccione el medio de transporte.' },
    'pr-objetivo': { req: true, tipo: 'texto', msg: 'Describa el objetivo (mín. 10 caracteres).', minLen: 10 },
    'pr-duracion': { req: true, tipo: 'select', msg: 'Seleccione la duración estimada.' },
};

function validarCampo(id) {
    const regla = PR_REGLAS[id];
    if (!regla) return true;

    const el = document.getElementById(id);
    const err = document.getElementById(`${id}-err`);
    if (!el) return true;

    let ok = true;
    const val = el.value.trim();

    if (regla.req) {
        if (!val || (regla.tipo === 'select' && val === '')) ok = false;
        if (ok && regla.tipo === 'fecha-futura') {
            const sel = new Date(val);
            sel.setHours(0, 0, 0, 0);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            if (sel < hoy) ok = false;
        }
        if (ok && regla.minLen && val.length < regla.minLen) ok = false;
    }

    if (err) err.classList.toggle('visible', !ok);
    return ok;
}

function validarPasoActual() {
    if (PR.pasoActual === 1) {
        const err = document.getElementById('pr-sol-err');
        if (!PR.solicitudId) {
            if (err) err.style.display = 'block';
            mostrarToastPR('Seleccione una solicitud para continuar.', true);
            return false;
        }
        if (err) err.style.display = 'none';
        return true;
    }

    if (PR.pasoActual === 2) {
        const campos = ['pr-fecha', 'pr-hora', 'pr-transporte', 'pr-objetivo', 'pr-duracion'];
        const resultados = campos.map(validarCampo);
        const ok = resultados.every(Boolean);
        if (!ok) mostrarToastPR('Corrija los campos marcados en rojo.', true);
        return ok;
    }
    return true;
}

/* ── RESUMEN ─────────────────────────────────────── */
function actualizarResumen() {
    set('pr-res-finca', PR.solicitudNombre);
    set('pr-res-prop', PR.solicitudProp);
    set('pr-res-ubic', PR.solicitudUbic);
    set('pr-res-has', PR.solicitudHas ? `${parseFloat(PR.solicitudHas).toFixed(2)} ha` : null);
    set('pr-res-veg', PR.solicitudVeg);
    set('pr-res-fecha', document.getElementById('pr-fecha')?.value ? formatFecha(document.getElementById('pr-fecha').value) : null);
    set('pr-res-hora', document.getElementById('pr-hora')?.value || null);
    set('pr-res-transporte', document.getElementById('pr-transporte')?.selectedOptions[0]?.text !== 'Seleccione...' ? document.getElementById('pr-transporte')?.selectedOptions[0]?.text : null);
    set('pr-res-duracion', document.getElementById('pr-duracion')?.selectedOptions[0]?.text !== 'Seleccione...' ? document.getElementById('pr-duracion')?.selectedOptions[0]?.text : null);

    function set(id, valor) {
        const el = document.getElementById(id);
        if (!el) return;
        if (valor && valor !== '') {
            el.textContent = valor;
            el.classList.remove('vacio');
        } else {
            el.textContent = '—';
            el.classList.add('vacio');
        }
    }
}

function formatFecha(iso) {
    if (!iso) return '';
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
}

/* ── CONFIRMACIÓN ────────────────────────────────── */
function construirConfirmacion() {
    const datos = {
        'Finca': PR.solicitudNombre,
        'Propietario': PR.solicitudProp,
        'Ubicación': PR.solicitudUbic,
        'Hectáreas': `${parseFloat(PR.solicitudHas).toFixed(2)} ha`,
        'Tipo de vegetación': PR.solicitudVeg,
        'Fecha de visita': formatFecha(document.getElementById('pr-fecha')?.value),
        'Hora': document.getElementById('pr-hora')?.value,
        'Duración estimada': document.getElementById('pr-duracion')?.selectedOptions[0]?.text,
        'Transporte': document.getElementById('pr-transporte')?.selectedOptions[0]?.text,
        'Objetivo': document.getElementById('pr-objetivo')?.value,
    };

    const wrap = document.getElementById('pr-conf-detalle');
    if (!wrap) return;
    wrap.innerHTML = '';

    Object.entries(datos).forEach(([label, valor]) => {
        if (!valor || valor === 'Seleccione...') return;
        const fila = document.createElement('div');
        fila.style.display = 'flex';
        fila.style.justifyContent = 'space-between';
        fila.style.padding = '0.5rem 0';
        fila.style.borderBottom = '1px solid var(--psa-border)';
        fila.innerHTML = `<span style="font-weight:600; color:var(--psa-muted);">${label}</span><span>${escapeHtml(valor)}</span>`;
        wrap.appendChild(fila);
    });
}

/* ── GUARDAR VISITA ──────────────────────────────── */
async function guardarVisita() {
    const seleccionada = getSolicitudSeleccionada();
    if (!seleccionada) {
        mostrarToastPR('Debe seleccionar una solicitud.', true);
        return;
    }

    const duracion = parseInt(document.getElementById('pr-duracion')?.value) || 0;

    const request = {
        idSolicitud: seleccionada.idSolicitud,
        fechaVisita: document.getElementById('pr-fecha')?.value,
        horaInicio: document.getElementById('pr-hora')?.value + ':00',
        duracionEstimada: duracion,
        medioTransporte: document.getElementById('pr-transporte')?.value,
        objetivoVisita: document.getElementById('pr-objetivo')?.value,
        equipoMateriales: document.getElementById('pr-equipo')?.value || '',
        observacionesCoordinacion: document.getElementById('pr-observacion')?.value || ''
    };

    mostrarToastPR('Guardando visita...');

    try {
        const response = await fetch(`${API_URL}/api/Ingeniero/visita/programar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });
        const data = await response.json();

        if (data.result === "SUCCESS") {
            mostrarToastPR('✅ Visita programada correctamente.');
            setTimeout(() => {
                window.location.href = '/IngForestal/ListaSolicitudes';
            }, 1800);
        } else {
            mostrarToastPR(data.message || 'Error al programar la visita.', true);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToastPR('Error de conexión con el servidor', true);
    }
}

/* ── TOAST ───────────────────────────────────────── */
function mostrarToastPR(mensaje, esError = false) {
    const toast = document.getElementById('pr-toast');
    const msgSpan = document.getElementById('pr-toast-msg');
    if (!toast || !mensaje) return;
    msgSpan.textContent = mensaje;
    toast.classList.toggle('error', esError);
    toast.classList.add('visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('visible'), 3500);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}
function aplicarFiltroBusqueda(filtro) {
    const items = document.querySelectorAll('.pr-solicitud-item');
    let visibles = 0;

    items.forEach(item => {
        const texto = item.innerText.toLowerCase();
        const coincide = !filtro || texto.includes(filtro.toLowerCase());
        item.style.display = coincide ? 'flex' : 'none';
        if (coincide) visibles++;
    });

    // Mostrar mensaje si no hay resultados
    const listaContainer = document.getElementById('pr-lista-solicitudes');
    const emptyMsg = listaContainer.querySelector('.pr-solicitudes-empty');

    if (visibles === 0 && items.length > 0) {
        if (!emptyMsg) {
            const msg = document.createElement('div');
            msg.className = 'pr-solicitudes-empty';
            msg.innerHTML = '<i class="fas fa-search"></i><p>No se encontraron solicitudes que coincidan con la búsqueda.</p>';
            listaContainer.appendChild(msg);
        }
    } else if (emptyMsg && visibles > 0) {
        emptyMsg.remove();
    }
}

/* ── INICIALIZACIÓN ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    // Configurar fecha mínima
    const inputFecha = document.getElementById('pr-fecha');
    if (inputFecha) inputFecha.min = new Date().toISOString().split('T')[0];

    // Inicializar wizard
    actualizarStepper();
    mostrarSeccion(1);

    // Obtener ID de solicitud desde URL (si viene)
    const params = new URLSearchParams(window.location.search);
    const idParam = parseInt(params.get('id'));

    // Cargar solicitudes y luego preseleccionar/filtrar si hay ID
    cargarSolicitudes(idParam);

    // Configurar eventos de los botones
    const btnAnterior = document.getElementById('pr-btn-anterior');
    const btnSiguiente = document.getElementById('pr-btn-siguiente');
    const btnGuardar = document.getElementById('pr-btn-guardar');

    if (btnAnterior) {
        btnAnterior.onclick = function () { pasoAnterior(); };
    }
    if (btnSiguiente) {
        btnSiguiente.onclick = function () { pasoSiguiente(); };
    }
    if (btnGuardar) {
        btnGuardar.onclick = function () { guardarVisita(); };
    }

    // Búsqueda de solicitudes
    const buscador = document.getElementById('pr-buscar-sol');
    if (buscador) {
        buscador.addEventListener('input', function (e) {
            const filtro = e.target.value.trim().toLowerCase();
            aplicarFiltroBusqueda(filtro);
        });
    }

    // Validación en tiempo real
    Object.keys(PR_REGLAS).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('blur', function () { validarCampo(id); actualizarResumen(); });
        el.addEventListener('input', function () { validarCampo(id); actualizarResumen(); });
        el.addEventListener('change', function () { validarCampo(id); actualizarResumen(); });
    });
});