/* =====================================================
   programar.js — Visitas / Programar | PSA
   Ruta: wwwroot/js/ingforestal/programar.js
   ===================================================== */

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
};

/* ── DATOS DE EJEMPLO (reemplazar con fetch al backend) ── */
const PR_SOLICITUDES = [
    { id: 1, finca: 'Finca Los Robles', propietario: 'José Ángel Mora', ubicacion: 'Turrialba, Cartago', hectareas: '12.50', vegetacion: 'Bosque Secundario' },
    { id: 2, finca: 'Hacienda Verde', propietario: 'María Solano Vega', ubicacion: 'Sarapiquí, Heredia', hectareas: '28.00', vegetacion: 'Bosque Primario' },
    { id: 3, finca: 'Finca La Esperanza', propietario: 'Carmen Ulate', ubicacion: 'Acosta, San José', hectareas: '18.30', vegetacion: 'Bosque Secundario' },
    { id: 4, finca: 'Parcela El Roble', propietario: 'Diego Vargas', ubicacion: 'Dota, San José', hectareas: '8.75', vegetacion: 'Plantación Forestal' },
];

/* ═══════════════════════════════════════════════════
   1. STEPPER — NAVEGACIÓN ENTRE PASOS
═══════════════════════════════════════════════════ */
function irPaso(paso) {
    if (paso < 1 || paso > PR.totalPasos) return;

    // Validar antes de avanzar
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

        // Ícono check para completados
        const numEl = el.querySelector('.pr-step-num');
        if (numEl) {
            numEl.innerHTML = n < PR.pasoActual
                ? '<i class="fas fa-check"></i>'
                : n;
        }
    });

    // Botones de navegación
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

/* ═══════════════════════════════════════════════════
   2. PASO 1 — SELECCIÓN DE SOLICITUD (con tu estructura HTML)
═══════════════════════════════════════════════════ */
function renderSolicitudes(filtro = '') {
    const lista = document.getElementById('pr-lista-solicitudes');
    if (!lista) return;

    // Limpiar lista actual
    lista.innerHTML = '';

    const filtradas = PR_SOLICITUDES.filter(s =>
        !filtro ||
        s.finca.toLowerCase().includes(filtro) ||
        s.propietario.toLowerCase().includes(filtro) ||
        s.ubicacion.toLowerCase().includes(filtro)
    );

    if (filtradas.length === 0) {
        lista.innerHTML = `<div class="pr-solicitudes-empty">
            <i class="fas fa-search"></i>
            <p>No se encontraron solicitudes que coincidan con la búsqueda.</p>
        </div>`;
        return;
    }

    filtradas.forEach(s => {
        const isSelected = PR.solicitudId === s.id;
        const item = document.createElement('div');
        item.className = `pr-solicitud-item ${isSelected ? 'seleccionada' : ''}`;
        item.setAttribute('data-id', s.id);
        item.setAttribute('data-nombre', s.finca);
        item.setAttribute('data-propietario', s.propietario);
        item.setAttribute('data-ubicacion', s.ubicacion);
        item.setAttribute('data-hectareas', s.hectareas);
        item.setAttribute('data-vegetacion', s.vegetacion);
        item.setAttribute('data-estado', 'Pendiente');
        item.setAttribute('role', 'radio');
        item.setAttribute('aria-checked', isSelected ? 'true' : 'false');
        item.setAttribute('tabindex', '0');

        item.innerHTML = `
            <div class="pr-solicitud-icono">
                <i class="fas fa-tree"></i>
            </div>
            <div class="pr-solicitud-contenido">
                <div class="pr-solicitud-nombre">${escapeHtml(s.finca)}</div>
                <div class="pr-solicitud-detalle">
                    <span><i class="fas fa-user"></i> ${escapeHtml(s.propietario)}</span>
                    <span><i class="fas fa-location-dot"></i> ${escapeHtml(s.ubicacion)}</span>
                </div>
                <div class="pr-solicitud-metricas">
                    <span class="pr-metrica"><i class="fas fa-ruler-combined"></i> ${s.hectareas} ha</span>
                    <span class="pr-metrica"><i class="fas fa-leaf"></i> ${escapeHtml(s.vegetacion)}</span>
                    <span class="pr-metrica estado"><i class="fas fa-hourglass-half"></i> Pendiente</span>
                </div>
            </div>
            <div class="pr-solicitud-seleccion">
                <i class="fas fa-check"></i>
            </div>
        `;

        item.addEventListener('click', (e) => seleccionarSolicitud(s));
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') seleccionarSolicitud(s);
        });

        lista.appendChild(item);
    });
}

// Función para escapar HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function seleccionarSolicitud(s) {
    PR.solicitudId = s.id;
    PR.solicitudNombre = s.finca;
    PR.solicitudProp = s.propietario;
    PR.solicitudUbic = s.ubicacion;
    PR.solicitudHas = s.hectareas;
    PR.solicitudVeg = s.vegetacion;

    // Actualizar la selección visual en la lista
    const items = document.querySelectorAll('.pr-solicitud-item');
    items.forEach(item => {
        const id = parseInt(item.getAttribute('data-id'));
        if (id === s.id) {
            item.classList.add('seleccionada');
            item.setAttribute('aria-checked', 'true');
        } else {
            item.classList.remove('seleccionada');
            item.setAttribute('aria-checked', 'false');
        }
    });

    actualizarResumen();

    // Quitar error si había
    const err = document.getElementById('pr-sol-err');
    if (err) err.style.display = 'none';
}

function getSolicitudSeleccionada() {
    if (!PR.solicitudId) return null;
    return {
        id: PR.solicitudId,
        nombre: PR.solicitudNombre,
        propietario: PR.solicitudProp,
        ubicacion: PR.solicitudUbic,
        hectareas: PR.solicitudHas,
        vegetacion: PR.solicitudVeg,
        estado: 'Pendiente'
    };
}

/* ═══════════════════════════════════════════════════
   3. VALIDACIÓN POR PASO
═══════════════════════════════════════════════════ */
const PR_REGLAS = {
    'pr-fecha': {
        req: true, tipo: 'fecha-futura',
        msg: 'Seleccione una fecha válida (hoy o posterior).'
    },
    'pr-hora': {
        req: true, tipo: 'texto',
        msg: 'Indique la hora de la visita.'
    },
    'pr-transporte': {
        req: true, tipo: 'select',
        msg: 'Seleccione el medio de transporte.'
    },
    'pr-objetivo': {
        req: true, tipo: 'texto',
        msg: 'Describa el objetivo de la visita (mín. 10 caracteres).',
        minLen: 10
    },
    'pr-duracion': {
        req: true, tipo: 'select',
        msg: 'Seleccione la duración estimada.'
    },
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

    el.classList.toggle('invalido', !ok);
    if (err) {
        err.classList.toggle('visible', !ok);
    }
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

/* ═══════════════════════════════════════════════════
   4. RESUMEN LATERAL (actualiza en tiempo real)
═══════════════════════════════════════════════════ */
function actualizarResumen() {
    set('pr-res-finca', PR.solicitudNombre || null);
    set('pr-res-prop', PR.solicitudProp || null);
    set('pr-res-ubic', PR.solicitudUbic || null);
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

/* ═══════════════════════════════════════════════════
   5. PASO 3 — CONFIRMACIÓN
═══════════════════════════════════════════════════ */
function construirConfirmacion() {
    const datos = {
        'Finca': PR.solicitudNombre,
        'Propietario': PR.solicitudProp,
        'Ubicación': PR.solicitudUbic,
        'Hectáreas': `${PR.solicitudHas} ha`,
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

/* ═══════════════════════════════════════════════════
   6. GUARDAR / ENVIAR
═══════════════════════════════════════════════════ */
function guardarVisita() {
    const seleccionada = getSolicitudSeleccionada();
    if (!seleccionada) {
        mostrarToastPR('Debe seleccionar una solicitud.', true);
        return;
    }

    const datos = {
        solicitudId: seleccionada.id,
        finca: seleccionada.nombre,
        propietario: seleccionada.propietario,
        ubicacion: seleccionada.ubicacion,
        hectareas: seleccionada.hectareas,
        vegetacion: seleccionada.vegetacion,
        fechaVisita: document.getElementById('pr-fecha')?.value,
        horaVisita: document.getElementById('pr-hora')?.value,
        duracion: document.getElementById('pr-duracion')?.value,
        transporte: document.getElementById('pr-transporte')?.value,
        objetivo: document.getElementById('pr-objetivo')?.value,
        observacion: document.getElementById('pr-observacion')?.value,
        equipo: document.getElementById('pr-equipo')?.value,
    };

    console.log('Visita a guardar:', datos);
    mostrarToastPR('✅ Visita programada correctamente.');

    setTimeout(() => {
        window.location.href = '/IngForestal/ListaSolicitudes';
    }, 1800);
}

/* ═══════════════════════════════════════════════════
   7. TOAST
═══════════════════════════════════════════════════ */
function mostrarToastPR(mensaje, esError = false) {
    const toast = document.getElementById('pr-toast');
    const msgSpan = document.getElementById('pr-toast-msg');
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

/* ═══════════════════════════════════════════════════
   8. INIT
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    // Fecha mínima = hoy
    const inputFecha = document.getElementById('pr-fecha');
    if (inputFecha) inputFecha.min = new Date().toISOString().split('T')[0];

    // Render inicial del stepper y sección
    actualizarStepper();
    mostrarSeccion(1);
    renderSolicitudes();

    // Búsqueda de solicitudes
    const buscador = document.getElementById('pr-buscar-sol');
    if (buscador) {
        buscador.addEventListener('input', e => {
            renderSolicitudes(e.target.value.trim().toLowerCase());
        });
    }

    // Validación en tiempo real
    Object.keys(PR_REGLAS).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('blur', () => { validarCampo(id); actualizarResumen(); });
        el.addEventListener('input', () => {
            if (el.classList.contains('invalido')) validarCampo(id);
            actualizarResumen();
        });
        el.addEventListener('change', () => { validarCampo(id); actualizarResumen(); });
    });

    // Prellenar si viene id en query string
    const params = new URLSearchParams(window.location.search);
    const idParam = parseInt(params.get('id'));
    if (idParam) {
        const s = PR_SOLICITUDES.find(x => x.id === idParam);
        if (s) seleccionarSolicitud(s);
    }
});