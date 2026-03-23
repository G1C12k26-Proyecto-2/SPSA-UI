/* =====================================================
   evaluaciones-crear.js — Evaluaciones / Crear | PSA
   Ruta: wwwroot/js/ingforestal/evaluaciones-crear.js
   ===================================================== */

/* ═══════════════════════════════════════════════════
   PARÁMETROS DE CÁLCULO (desde el backend en prod.)
   En producción estos valores vienen del modelo Razor
   o de un endpoint /IngForestal/Parametros
═══════════════════════════════════════════════════ */
const EC_PARAMS = {
    precioBaseHa: 50000,   // ₡ por hectárea
    ajusteVeg: {
        'bosque-primario':     30,
        'bosque-secundario':   20,
        'plantacion-forestal': 10,
        'pasto':                0,
    },
    ajusteRecursos: {
        'ninguno':       0,
        'quebrada':      0,
        'rio':          10,
        'naciente':      5,
        'rio-naciente': 15,
    },
    ajustePendiente: {
        'plana':          0,
        'inclinada':     10,
        'muy-inclinada': 20,
    },
    tope: 40,   // % máximo de ajustes combinados
};

/* ── ESTADO GLOBAL ─────────────────────────────────── */
const EC = {
    solicitudId:    null,
    solicitudData:  null,
    usoSueloSel:    new Set(),
};

/* ── DATOS DE EJEMPLO ──────────────────────────────── */
const EC_SOLICITUDES = [
    { id: 1, finca: 'Hacienda El Roble',   prop: 'Manuel Araya',    ubic: 'Turrialba, Cartago',      has: '22.00', veg: 'bosque-primario',     pend: 'inclinada',    rec: 'rio'       },
    { id: 2, finca: 'Finca Los Naranjos',  prop: 'Silvia Mora',     ubic: 'Acosta, San José',        has: '15.50', veg: 'bosque-secundario',    pend: 'muy-inclinada',rec: 'naciente'  },
    { id: 3, finca: 'Parcela Monteverdi',  prop: 'Diego Campos',    ubic: 'Pérez Zeledón, San José', has: '31.00', veg: 'bosque-primario',     pend: 'inclinada',    rec: 'rio-naciente'},
    { id: 4, finca: 'Finca La Cima',       prop: 'Rosa Jiménez',    ubic: 'Dota, San José',          has: '8.75',  veg: 'plantacion-forestal',  pend: 'plana',        rec: 'ninguno'   },
    { id: 5, finca: 'Hacienda Verde',      prop: 'María Solano',    ubic: 'Sarapiquí, Heredia',      has: '28.00', veg: 'bosque-primario',     pend: 'muy-inclinada',rec: 'rio'       },
];

/* ═══════════════════════════════════════════════════
   1. RENDER DE SOLICITUDES
═══════════════════════════════════════════════════ */
function ecRenderSolicitudes(filtro = '') {
    const lista = document.getElementById('ec-sol-lista');
    if (!lista) return;
    lista.innerHTML = '';

    const filtradas = EC_SOLICITUDES.filter(s =>
        !filtro ||
        s.finca.toLowerCase().includes(filtro) ||
        s.prop.toLowerCase().includes(filtro)  ||
        s.ubic.toLowerCase().includes(filtro)
    );

    if (filtradas.length === 0) {
        lista.innerHTML = `<p style="text-align:center;color:var(--gris-medio);font-size:.85rem;padding:12px 0;">
            Sin solicitudes que coincidan.</p>`;
        return;
    }

    const etiqVeg = {
        'bosque-primario': 'Bosque Primario', 'bosque-secundario': 'Bosque Secundario',
        'plantacion-forestal': 'Plantación Forestal', 'pasto': 'Pasto',
    };

    filtradas.forEach(s => {
        const card = document.createElement('div');
        card.className  = 'ec-sol-card' + (EC.solicitudId === s.id ? ' seleccionada' : '');
        card.setAttribute('role', 'radio');
        card.setAttribute('aria-checked', EC.solicitudId === s.id ? 'true' : 'false');
        card.setAttribute('tabindex', '0');
        card.innerHTML = `
            <div class="ec-sol-radio"></div>
            <div class="ec-sol-info">
                <div class="ec-sol-nombre">${s.finca}</div>
                <div class="ec-sol-sub">
                    <i class="fa-solid fa-user" style="font-size:.68rem;"></i> ${s.prop}
                    &nbsp;·&nbsp;
                    <i class="fa-solid fa-location-dot" style="font-size:.68rem;"></i> ${s.ubic}
                </div>
                <div class="ec-sol-sub">
                    <i class="fa-solid fa-ruler-combined" style="font-size:.68rem;"></i> ${s.has} ha
                    &nbsp;·&nbsp;
                    <i class="fa-solid fa-tree" style="font-size:.68rem;"></i> ${etiqVeg[s.veg] || s.veg}
                </div>
            </div>
            <span class="chip chip-pendiente" style="flex-shrink:0;">Pendiente</span>`;

        card.addEventListener('click',   () => ecSeleccionarSol(s));
        card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') ecSeleccionarSol(s); });
        lista.appendChild(card);
    });
}

function ecSeleccionarSol(s) {
    EC.solicitudId   = s.id;
    EC.solicitudData = s;

    // Prellenar campos de referencia
    ecSet('ec-finca-ref',  s.finca);
    ecSet('ec-prop-ref',   s.prop);
    ecSet('ec-ubic-ref',   s.ubic);

    // Prellenar campos editables con valores del registro
    const ha  = document.getElementById('ec-hectareas');
    const veg = document.getElementById('ec-vegetacion');
    const pen = document.getElementById('ec-pendiente');
    const rec = document.getElementById('ec-recursos');
    if (ha)  ha.value  = s.has;
    if (veg) veg.value = s.veg;
    if (pen) pen.value = s.pend;
    if (rec) rec.value = s.rec;

    ecRenderSolicitudes(document.getElementById('ec-buscar-sol')?.value.toLowerCase() || '');
    document.getElementById('ec-sol-err')?.classList.remove('visible');

    ecActualizarResumen();
    ecCalcularPago();
}

/* ═══════════════════════════════════════════════════
   2. CÁLCULO DE PAGO ESTIMADO
═══════════════════════════════════════════════════ */
function ecCalcularPago() {
    const has  = parseFloat(document.getElementById('ec-hectareas')?.value) || 0;
    const veg  = document.getElementById('ec-vegetacion')?.value  || '';
    const pen  = document.getElementById('ec-pendiente')?.value   || '';
    const rec  = document.getElementById('ec-recursos')?.value    || '';

    const base = EC_PARAMS.precioBaseHa * has;

    let ajusteVeg  = EC_PARAMS.ajusteVeg[veg]       ?? 0;
    let ajustePen  = EC_PARAMS.ajustePendiente[pen]  ?? 0;
    let ajusteRec  = EC_PARAMS.ajusteRecursos[rec]   ?? 0;

    // Aplicar tope máximo de ajustes
    let totalAjustePct = Math.min(ajusteVeg + ajustePen + ajusteRec, EC_PARAMS.tope);
    const montoAjuste  = base * (totalAjustePct / 100);
    const total        = base + montoAjuste;

    // Actualizar DOM
    ecSetCalc('ec-calc-base',    `₡${formatNum(base)}`);
    ecSetCalc('ec-calc-veg',     ajusteVeg  > 0 ? `+${ajusteVeg}%`  : '0%', ajusteVeg  > 0);
    ecSetCalc('ec-calc-pen',     ajustePen  > 0 ? `+${ajustePen}%`  : '0%', ajustePen  > 0);
    ecSetCalc('ec-calc-rec',     ajusteRec  > 0 ? `+${ajusteRec}%`  : '0%', ajusteRec  > 0);
    ecSetCalc('ec-calc-ajuste',  `₡${formatNum(montoAjuste)}`, montoAjuste > 0);

    const totalEl = document.getElementById('ec-calc-total');
    if (totalEl) {
        totalEl.textContent = `₡${formatNum(total)}`;
        totalEl.className   = 'ec-calculo-fila-val total';
    }

    const montoEl = document.getElementById('ec-calculo-monto');
    if (montoEl) montoEl.textContent = has > 0 ? `₡${formatNum(total)}` : '₡0';
}

function ecSetCalc(id, texto, positivo = false) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = texto;
    el.className   = 'ec-calculo-fila-val' + (positivo ? ' positivo' : '');
}

function formatNum(n) {
    return Math.round(n).toLocaleString('es-CR');
}

/* ═══════════════════════════════════════════════════
   3. USO DE SUELO (checkboxes múltiples)
═══════════════════════════════════════════════════ */
function ecToggleUso(valor, el) {
    if (EC.usoSueloSel.has(valor)) {
        EC.usoSueloSel.delete(valor);
        el.classList.remove('marcado');
    } else {
        EC.usoSueloSel.add(valor);
        el.classList.add('marcado');
    }
    ecActualizarResumen();
}

/* ═══════════════════════════════════════════════════
   4. RESUMEN LATERAL
═══════════════════════════════════════════════════ */
function ecActualizarResumen() {
    const veg = document.getElementById('ec-vegetacion');
    const pen = document.getElementById('ec-pendiente');
    const rec = document.getElementById('ec-recursos');
    const ha  = document.getElementById('ec-hectareas');

    const etiqVeg = { 'bosque-primario':'Bosque Primario','bosque-secundario':'Bosque Secundario','plantacion-forestal':'Plantación Forestal','pasto':'Pasto' };
    const etiqPen = { 'plana':'Plana','inclinada':'Inclinada','muy-inclinada':'Muy inclinada' };
    const etiqRec = { 'ninguno':'Ninguno','quebrada':'Quebrada','rio':'Río','naciente':'Naciente','rio-naciente':'Río y naciente' };

    ecSetRes('ec-res-finca',    EC.solicitudData?.finca || null);
    ecSetRes('ec-res-prop',     EC.solicitudData?.prop  || null);
    ecSetRes('ec-res-has',      ha?.value  ? `${ha.value} ha` : null);
    ecSetRes('ec-res-veg',      veg?.value ? etiqVeg[veg.value] || veg.value : null);
    ecSetRes('ec-res-pen',      pen?.value ? etiqPen[pen.value] || pen.value : null);
    ecSetRes('ec-res-rec',      rec?.value ? etiqRec[rec.value] || rec.value : null);
    ecSetRes('ec-res-uso',      EC.usoSueloSel.size > 0 ? [...EC.usoSueloSel].join(', ') : null);
}

function ecSetRes(id, valor) {
    const el = document.getElementById(id);
    if (!el) return;
    if (valor) { el.textContent = valor; el.className = 'ec-res-valor'; }
    else        { el.textContent = '—';   el.className = 'ec-res-valor vacio'; }
}

function ecSet(id, valor) {
    const el = document.getElementById(id);
    if (el) el.value = valor || '';
}

/* ═══════════════════════════════════════════════════
   5. VALIDACIÓN
═══════════════════════════════════════════════════ */
const EC_REGLAS = {
    'ec-hectareas':   { req: true, tipo: 'numero', msg: 'Las hectáreas deben ser un número mayor a 0.', min: 0.01 },
    'ec-vegetacion':  { req: true, tipo: 'select', msg: 'Seleccione el tipo de vegetación.' },
    'ec-pendiente':   { req: true, tipo: 'select', msg: 'Seleccione el tipo de pendiente.' },
    'ec-recursos':    { req: true, tipo: 'select', msg: 'Seleccione los recursos hídricos.' },
    'ec-fecha-visita':{ req: true, tipo: 'fecha-futura', msg: 'Seleccione una fecha de visita válida (hoy o posterior).' },
    'ec-observaciones':{ req: true, tipo: 'texto', msg: 'Las observaciones son obligatorias (mín. 15 caracteres).', minLen: 15 },
};

function ecValidarCampo(id) {
    const regla = EC_REGLAS[id];
    if (!regla) return true;
    const el  = document.getElementById(id);
    const err = document.getElementById(`${id}-err`);
    if (!el) return true;

    const val = el.value.trim();
    let ok = true;

    if (regla.req) {
        if (!val || (regla.tipo === 'select' && val === '')) ok = false;
        if (ok && regla.tipo === 'numero') {
            const n = parseFloat(val);
            if (isNaN(n) || n < (regla.min || 0)) ok = false;
        }
        if (ok && regla.tipo === 'fecha-futura') {
            const sel = new Date(val); sel.setHours(0,0,0,0);
            const hoy = new Date();   hoy.setHours(0,0,0,0);
            if (sel < hoy) ok = false;
        }
        if (ok && regla.minLen && val.length < regla.minLen) ok = false;
    }

    el.classList.toggle('invalido', !ok);
    if (err) err.classList.toggle('visible', !ok);
    return ok;
}

function ecValidarTodo() {
    // Validar solicitud seleccionada
    if (!EC.solicitudId) {
        document.getElementById('ec-sol-err')?.classList.add('visible');
        ecToast('Seleccione una solicitud pendiente.', true);
        return false;
    }

    const campos = Object.keys(EC_REGLAS).map(ecValidarCampo);
    const ok     = campos.every(Boolean);
    if (!ok) ecToast('Corrija los campos marcados en rojo.', true);
    return ok;
}

/* ═══════════════════════════════════════════════════
   6. GUARDAR
═══════════════════════════════════════════════════ */
function ecGuardar() {
    if (!ecValidarTodo()) return;

    const datos = {
        solicitudId:    EC.solicitudId,
        hectareas:      document.getElementById('ec-hectareas')?.value,
        vegetacion:     document.getElementById('ec-vegetacion')?.value,
        pendiente:      document.getElementById('ec-pendiente')?.value,
        recursos:       document.getElementById('ec-recursos')?.value,
        usoSuelo:       [...EC.usoSueloSel],
        fechaVisita:    document.getElementById('ec-fecha-visita')?.value,
        horaVisita:     document.getElementById('ec-hora-visita')?.value,
        observaciones:  document.getElementById('ec-observaciones')?.value,
    };

    /* === Conectar al backend en producción ===
    const token = document.querySelector('input[name="__RequestVerificationToken"]').value;
    fetch('/IngForestal/Evaluaciones/Crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'RequestVerificationToken': token },
        body: JSON.stringify(datos)
    })
    .then(r => r.json())
    .then(data => {
        if (data.exito) window.location.href = `/IngForestal/EvaluacionesPendientes`;
        else ecToast(data.mensaje || 'Error al guardar.', true);
    })
    .catch(() => ecToast('Error de conexión.', true));
    */

    console.log('Evaluación a crear:', datos);
    ecToast('✅ Evaluación creada correctamente.');
    setTimeout(() => { window.location.href = '/IngForestal/EvaluacionesPendientes'; }, 1800);
}

/* ═══════════════════════════════════════════════════
   7. TOAST
═══════════════════════════════════════════════════ */
function ecToast(msg, err = false) {
    const t = document.getElementById('ec-toast');
    const s = document.getElementById('ec-toast-msg');
    if (!t || !msg) return;
    s.textContent = msg;
    t.classList.toggle('error', err);
    t.classList.add('visible');
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('visible'), 3500);
}

/* ═══════════════════════════════════════════════════
   8. INIT
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

    // Fecha mínima = hoy
    const inputFecha = document.getElementById('ec-fecha-visita');
    if (inputFecha) inputFecha.min = new Date().toISOString().split('T')[0];

    // Render solicitudes
    ecRenderSolicitudes();
    document.getElementById('ec-buscar-sol')?.addEventListener('input', e => {
        ecRenderSolicitudes(e.target.value.trim().toLowerCase());
    });

    // Validación + recálculo en tiempo real
    Object.keys(EC_REGLAS).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('blur',   () => ecValidarCampo(id));
        el.addEventListener('change', () => { ecValidarCampo(id); ecActualizarResumen(); ecCalcularPago(); });
        el.addEventListener('input',  () => {
            if (el.classList.contains('invalido')) ecValidarCampo(id);
            ecActualizarResumen();
            ecCalcularPago();
        });
    });

    // Prellenar desde query string ?id=X
    const id = parseInt(new URLSearchParams(window.location.search).get('id'));
    if (id) {
        const s = EC_SOLICITUDES.find(x => x.id === id);
        if (s) ecSeleccionarSol(s);
    }
});
