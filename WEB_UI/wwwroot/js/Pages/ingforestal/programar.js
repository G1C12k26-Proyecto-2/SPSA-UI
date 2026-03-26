/* =====================================================
   programar.js — Visitas / Programar | PSA
   Ruta: wwwroot/js/ingforestal/programar.js
   ===================================================== */

/* ── ESTADO GLOBAL ─────────────────────────────────── */
const PR = {
    pasoActual:       1,
    totalPasos:       3,
    solicitudId:      null,
    solicitudNombre:  '',
    solicitudProp:    '',
    solicitudUbic:    '',
    solicitudHas:     '',
    solicitudVeg:     '',
};

/* ── DATOS DE EJEMPLO (reemplazar con fetch al backend) ── */
const PR_SOLICITUDES = [
    { id: 1, finca: 'Finca Los Robles',   propietario: 'José Ángel Mora',    ubicacion: 'Turrialba, Cartago',      hectareas: '12.50', vegetacion: 'Bosque Secundario'  },
    { id: 2, finca: 'Hacienda Verde',      propietario: 'María Solano Vega',  ubicacion: 'Sarapiquí, Heredia',      hectareas: '28.00', vegetacion: 'Bosque Primario'    },
    { id: 3, finca: 'Finca La Esperanza',  propietario: 'Carmen Ulate',       ubicacion: 'Acosta, San José',        hectareas: '18.30', vegetacion: 'Bosque Secundario'  },
    { id: 4, finca: 'Parcela El Roble',    propietario: 'Diego Vargas',       ubicacion: 'Dota, San José',          hectareas: '8.75',  vegetacion: 'Plantación Forestal'},
    { id: 5, finca: 'Finca Montecito',     propietario: 'Laura Brenes',       ubicacion: 'Upala, Alajuela',         hectareas: '35.00', vegetacion: 'Bosque Primario'    },
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
        if (n === PR.pasoActual)   el.classList.add('activo');
        if (n < PR.pasoActual)     el.classList.add('completado');

        // Ícono check para completados
        const numEl = el.querySelector('.pr-step-num');
        if (numEl) {
            numEl.innerHTML = n < PR.pasoActual
                ? '<i class="fa-solid fa-check"></i>'
                : n;
        }
    });

    // Botones de navegación
    const btnAnterior = document.getElementById('pr-btn-anterior');
    const btnSiguiente = document.getElementById('pr-btn-siguiente');
    const btnGuardar = document.getElementById('pr-btn-guardar');

    if (btnAnterior)  btnAnterior.style.display  = PR.pasoActual === 1 ? 'none' : 'inline-flex';
    if (btnSiguiente) btnSiguiente.style.display = PR.pasoActual === PR.totalPasos ? 'none' : 'inline-flex';
    if (btnGuardar)   btnGuardar.style.display   = PR.pasoActual === PR.totalPasos ? 'inline-flex' : 'none';
}

function mostrarSeccion(paso) {
    document.querySelectorAll('.pr-seccion').forEach((s, i) => {
        s.classList.toggle('activa', i + 1 === paso);
    });
}

/* ═══════════════════════════════════════════════════
   2. PASO 1 — SELECCIÓN DE SOLICITUD
═══════════════════════════════════════════════════ */
function renderSolicitudes(filtro = '') {
    const lista = document.getElementById('pr-lista-solicitudes');
    if (!lista) return;
    lista.innerHTML = '';

    const filtradas = PR_SOLICITUDES.filter(s =>
        !filtro ||
        s.finca.toLowerCase().includes(filtro) ||
        s.propietario.toLowerCase().includes(filtro) ||
        s.ubicacion.toLowerCase().includes(filtro)
    );

    if (filtradas.length === 0) {
        lista.innerHTML = `<p style="text-align:center;color:var(--gris-medio);font-size:.85rem;padding:16px 0;">
            Sin solicitudes que coincidan.</p>`;
        return;
    }

    filtradas.forEach(s => {
        const card = document.createElement('div');
        card.className = 'pr-solicitud-card' + (PR.solicitudId === s.id ? ' seleccionada' : '');
        card.setAttribute('role', 'radio');
        card.setAttribute('aria-checked', PR.solicitudId === s.id ? 'true' : 'false');
        card.setAttribute('tabindex', '0');
        card.innerHTML = `
            <div class="pr-solicitud-radio"></div>
            <div class="pr-solicitud-info">
                <div class="pr-solicitud-nombre">${s.finca}</div>
                <div class="pr-solicitud-sub">
                    <i class="fa-solid fa-user" style="font-size:.7rem;"></i> ${s.propietario} &nbsp;·&nbsp;
                    <i class="fa-solid fa-location-dot" style="font-size:.7rem;"></i> ${s.ubicacion}
                </div>
                <div class="pr-solicitud-sub" style="margin-top:2px;">
                    <i class="fa-solid fa-ruler-combined" style="font-size:.7rem;"></i> ${s.hectareas} ha &nbsp;·&nbsp;
                    <i class="fa-solid fa-tree" style="font-size:.7rem;"></i> ${s.vegetacion}
                </div>
            </div>
            <div class="pr-solicitud-badge">
                <span class="chip chip-pendiente">Pendiente</span>
            </div>`;

        card.addEventListener('click',   () => seleccionarSolicitud(s));
        card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') seleccionarSolicitud(s); });
        lista.appendChild(card);
    });
}

function seleccionarSolicitud(s) {
    PR.solicitudId     = s.id;
    PR.solicitudNombre = s.finca;
    PR.solicitudProp   = s.propietario;
    PR.solicitudUbic   = s.ubicacion;
    PR.solicitudHas    = s.hectareas;
    PR.solicitudVeg    = s.vegetacion;

    renderSolicitudes(document.getElementById('pr-buscar-sol')?.value.toLowerCase() || '');
    actualizarResumen();

    // Quitar error si había
    const err = document.getElementById('pr-sol-err');
    if (err) err.classList.remove('visible');
}

/* ═══════════════════════════════════════════════════
   3. VALIDACIÓN POR PASO
═══════════════════════════════════════════════════ */
const PR_REGLAS = {
    // Paso 2
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

    const el  = document.getElementById(id);
    const err = document.getElementById(`${id}-err`);
    if (!el) return true;

    let ok  = true;
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
        err.textContent = regla.msg;
        err.classList.toggle('visible', !ok);
    }
    return ok;
}

function validarPasoActual() {
    if (PR.pasoActual === 1) {
        const err = document.getElementById('pr-sol-err');
        if (!PR.solicitudId) {
            if (err) err.classList.add('visible');
            mostrarToastPR('Seleccione una solicitud para continuar.', true);
            return false;
        }
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
    set('pr-res-finca',      PR.solicitudNombre || null);
    set('pr-res-prop',       PR.solicitudProp   || null);
    set('pr-res-ubic',       PR.solicitudUbic   || null);
    set('pr-res-fecha',      document.getElementById('pr-fecha')?.value      ? formatFecha(document.getElementById('pr-fecha').value) : null);
    set('pr-res-hora',       document.getElementById('pr-hora')?.value       || null);
    set('pr-res-transporte', document.getElementById('pr-transporte')?.selectedOptions[0]?.text !== 'Seleccione...' ? document.getElementById('pr-transporte')?.selectedOptions[0]?.text : null);
    set('pr-res-duracion',   document.getElementById('pr-duracion')?.selectedOptions[0]?.text   !== 'Seleccione...' ? document.getElementById('pr-duracion')?.selectedOptions[0]?.text   : null);

    function set(id, valor) {
        const el = document.getElementById(id);
        if (!el) return;
        if (valor) {
            el.textContent = valor;
            el.className   = 'pr-resumen-valor';
        } else {
            el.textContent = '—';
            el.className   = 'pr-resumen-valor vacio';
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
        'Finca':              PR.solicitudNombre,
        'Propietario':        PR.solicitudProp,
        'Ubicación':          PR.solicitudUbic,
        'Hectáreas':          `${PR.solicitudHas} ha`,
        'Tipo de vegetación': PR.solicitudVeg,
        'Fecha de visita':    formatFecha(document.getElementById('pr-fecha')?.value),
        'Hora':               document.getElementById('pr-hora')?.value,
        'Duración estimada':  document.getElementById('pr-duracion')?.selectedOptions[0]?.text,
        'Transporte':         document.getElementById('pr-transporte')?.selectedOptions[0]?.text,
        'Objetivo':           document.getElementById('pr-objetivo')?.value,
    };

    const wrap = document.getElementById('pr-conf-detalle');
    if (!wrap) return;
    wrap.innerHTML = '';

    Object.entries(datos).forEach(([label, valor]) => {
        if (!valor || valor === 'Seleccione...') return;
        const fila = document.createElement('div');
        fila.className = 'pr-confirmacion-fila';
        fila.innerHTML = `<span>${label}</span><span>${valor}</span>`;
        wrap.appendChild(fila);
    });
}

/* ═══════════════════════════════════════════════════
   6. GUARDAR / ENVIAR
═══════════════════════════════════════════════════ */
function guardarVisita() {
    const datos = {
        solicitudId:  PR.solicitudId,
        fechaVisita:  document.getElementById('pr-fecha')?.value,
        horaVisita:   document.getElementById('pr-hora')?.value,
        duracion:     document.getElementById('pr-duracion')?.value,
        transporte:   document.getElementById('pr-transporte')?.value,
        objetivo:     document.getElementById('pr-objetivo')?.value,
        observacion:  document.getElementById('pr-observacion')?.value,
        equipo:       document.getElementById('pr-equipo')?.value,
    };

    /* === Conectar al backend en producción ===
    const token = document.querySelector('input[name="__RequestVerificationToken"]').value;
    fetch('/IngForestal/Guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'RequestVerificationToken': token },
        body: JSON.stringify(datos)
    })
    .then(r => r.json())
    .then(data => {
        if (data.exito) window.location.href = '/IngForestal/Index';
        else mostrarToastPR(data.mensaje || 'Error al guardar.', true);
    })
    .catch(() => mostrarToastPR('Error de conexión con el servidor.', true));
    */

    // Simulación frontend
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
    const toast   = document.getElementById('pr-toast');
    const msgSpan = document.getElementById('pr-toast-msg');
    if (!toast || !mensaje) return;
    msgSpan.textContent = mensaje;
    toast.classList.toggle('error', esError);
    toast.classList.add('visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('visible'), 3500);
}

// Función para manejar la selección de solicitudes
function inicializarSeleccionSolicitudes() {
    const items = document.querySelectorAll('.pr-solicitud-item');
    const errorElement = document.getElementById('pr-sol-err');

    items.forEach(item => {
        item.addEventListener('click', function (e) {
            // Remover selección de todos
            items.forEach(i => i.classList.remove('seleccionada'));
            // Agregar selección al actual
            this.classList.add('seleccionada');

            // Ocultar error si existe
            if (errorElement) errorElement.style.display = 'none';

            // Actualizar resumen con los datos seleccionados
            actualizarResumenSeleccion(this);
        });
    });
}

// Función para actualizar el resumen con la finca seleccionada
function actualizarResumenSeleccion(item) {
    const nombre = item.dataset.nombre;
    const propietario = item.dataset.propietario;
    const ubicacion = item.dataset.ubicacion;

    const resFinca = document.getElementById('pr-res-finca');
    const resProp = document.getElementById('pr-res-prop');
    const resUbic = document.getElementById('pr-res-ubic');

    if (resFinca) {
        resFinca.textContent = nombre;
        resFinca.classList.remove('vacio');
    }
    if (resProp) {
        resProp.textContent = propietario;
        resProp.classList.remove('vacio');
    }
    if (resUbic) {
        resUbic.textContent = ubicacion;
        resUbic.classList.remove('vacio');
    }
}

// Función para obtener la solicitud seleccionada
function getSolicitudSeleccionada() {
    const seleccionada = document.querySelector('.pr-solicitud-item.seleccionada');
    if (!seleccionada) return null;

    return {
        id: seleccionada.dataset.id,
        nombre: seleccionada.dataset.nombre,
        propietario: seleccionada.dataset.propietario,
        ubicacion: seleccionada.dataset.ubicacion,
        hectareas: seleccionada.dataset.hectareas,
        vegetacion: seleccionada.dataset.vegetacion,
        estado: seleccionada.dataset.estado
    };
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    inicializarSeleccionSolicitudes();
});

// Función para el paso siguiente (validar selección)
function pasoSiguiente() {
    const pasoActual = document.querySelector('.pr-seccion.activa');
    const pasoActualId = pasoActual.id;

    if (pasoActualId === 'pr-seccion-1') {
        const seleccionada = getSolicitudSeleccionada();
        if (!seleccionada) {
            const errorElement = document.getElementById('pr-sol-err');
            if (errorElement) errorElement.style.display = 'block';
            return;
        }
    }

    // Cambiar de paso
    const pasos = document.querySelectorAll('.pr-seccion');
    const steps = document.querySelectorAll('.pr-step');

    for (let i = 0; i < pasos.length; i++) {
        if (pasos[i].id === pasoActualId && i + 1 < pasos.length) {
            pasos[i].classList.remove('activa');
            pasos[i + 1].classList.add('activa');

            steps[i].classList.remove('activo');
            steps[i + 1].classList.add('activo');

            // Actualizar botones
            document.getElementById('pr-btn-anterior').style.display = i + 1 === 1 ? 'none' : 'inline-flex';
            document.getElementById('pr-btn-siguiente').style.display = i + 2 === pasos.length ? 'none' : 'inline-flex';
            document.getElementById('pr-btn-guardar').style.display = i + 2 === pasos.length ? 'inline-flex' : 'none';
            break;
        }
    }
}

function pasoAnterior() {
    const pasoActual = document.querySelector('.pr-seccion.activa');
    const pasoActualId = pasoActual.id;
    const pasos = document.querySelectorAll('.pr-seccion');
    const steps = document.querySelectorAll('.pr-step');

    for (let i = 0; i < pasos.length; i++) {
        if (pasos[i].id === pasoActualId && i - 1 >= 0) {
            pasos[i].classList.remove('activa');
            pasos[i - 1].classList.add('activa');

            steps[i].classList.remove('activo');
            steps[i - 1].classList.add('activo');

            document.getElementById('pr-btn-anterior').style.display = i - 1 === 0 ? 'none' : 'inline-flex';
            document.getElementById('pr-btn-siguiente').style.display = 'inline-flex';
            document.getElementById('pr-btn-guardar').style.display = 'none';
            break;
        }
    }
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
    document.getElementById('pr-buscar-sol')?.addEventListener('input', e => {
        renderSolicitudes(e.target.value.trim().toLowerCase());
    });

    // Validación en tiempo real (blur + corrección al escribir)
    Object.keys(PR_REGLAS).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('blur',  () => { validarCampo(id); actualizarResumen(); });
        el.addEventListener('input', () => {
            if (el.classList.contains('invalido')) validarCampo(id);
            actualizarResumen();
        });
        el.addEventListener('change', () => { validarCampo(id); actualizarResumen(); });
    });

    // Prellenar si viene id en query string (ej: desde el dashboard)
    const params = new URLSearchParams(window.location.search);
    const idParam = parseInt(params.get('id'));
    if (idParam) {
        const s = PR_SOLICITUDES.find(x => x.id === idParam);
        if (s) seleccionarSolicitud(s);
    }
});
