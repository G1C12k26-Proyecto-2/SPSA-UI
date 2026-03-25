/* =====================================================
   evaluaciones-editar.js — Evaluaciones / Editar | PSA
   Ruta: wwwroot/js/ingforestal/evaluaciones-editar.js
   ===================================================== */

/* ═══════════════════════════════════════════════════
   PARÁMETROS DE CÁLCULO
═══════════════════════════════════════════════════ */
const EE_PARAMS = {
    precioBaseHa: 50000,
    ajusteVeg: {
        'bosque-primario': 30, 'bosque-secundario': 20,
        'plantacion-forestal': 10, 'pasto': 0,
    },
    ajusteRecursos: {
        'ninguno': 0, 'quebrada': 0, 'rio': 10,
        'naciente': 5, 'rio-naciente': 15,
    },
    ajustePendiente: { 'plana': 0, 'inclinada': 10, 'muy-inclinada': 20 },
    tope: 40,
};

/* ═══════════════════════════════════════════════════
   ESTADO GLOBAL
═══════════════════════════════════════════════════ */
const EE = {
    originales:   {},   // valores al cargar la página
    modificados:  new Set(),
    usoSueloSel:  new Set(),
    usoSueloOrig: new Set(),
    hayCambios:   false,
};

/* ═══════════════════════════════════════════════════
   1. REGISTRO DE VALORES ORIGINALES
═══════════════════════════════════════════════════ */
function eeRegistrarOriginales() {
    const campos = ['ee-hectareas','ee-vegetacion','ee-pendiente',
                    'ee-recursos','ee-fecha-visita','ee-hora-visita',
                    'ee-observaciones'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) EE.originales[id] = el.value;
    });

    // Uso de suelo original
    document.querySelectorAll('.ee-check-item.marcado').forEach(el => {
        EE.usoSueloOrig.add(el.dataset.valor);
        EE.usoSueloSel.add(el.dataset.valor);
    });
}

/* ═══════════════════════════════════════════════════
   2. TRACKING DE CAMBIOS
═══════════════════════════════════════════════════ */
function eeOnCampo(id) {
    const el  = document.getElementById(id);
    if (!el) return;

    const orig   = EE.originales[id] ?? '';
    const actual = el.value;

    if (actual !== orig) {
        EE.modificados.add(id);
        el.classList.add('modificado');
        eeMostrarOrigVal(id, orig);
    } else {
        EE.modificados.delete(id);
        el.classList.remove('modificado');
        eeOcultarOrigVal(id);
    }

    // Limpiar error si lo había
    if (el.classList.contains('invalido')) eeValidarCampo(id);

    eeActualizarEstadoCambios();
    eeActualizarComparador();
    eeCalcularPago();
}

function eeOnUsoSuelo(valor, elLabel) {
    if (EE.usoSueloSel.has(valor)) {
        EE.usoSueloSel.delete(valor);
        elLabel.classList.remove('marcado');
    } else {
        EE.usoSueloSel.add(valor);
        elLabel.classList.add('marcado');
    }
    eeActualizarEstadoCambios();
    eeActualizarComparador();
}

function eeActualizarEstadoCambios() {
    // Comparar uso de suelo
    const usoChanged = [...EE.usoSueloSel].sort().join() !== [...EE.usoSueloOrig].sort().join();
    EE.hayCambios = EE.modificados.size > 0 || usoChanged;

    const badge   = document.getElementById('ee-badge-cambios');
    const alerta  = document.getElementById('ee-alerta-cambios');
    const total   = EE.modificados.size + (usoChanged ? 1 : 0);

    if (badge) {
        badge.innerHTML = `<i class="fa-solid fa-pen"></i> ${total} cambio${total !== 1 ? 's' : ''}`;
        badge.classList.toggle('visible', total > 0);
    }
    if (alerta) alerta.classList.toggle('visible', total > 0);
}

function eeMostrarOrigVal(id, valor) {
    const el = document.getElementById(`${id}-orig`);
    const etiq = { 'bosque-primario':'Bosque Primario','bosque-secundario':'Bosque Secundario',
        'plantacion-forestal':'Plantación Forestal','pasto':'Pasto',
        'plana':'Plana','inclinada':'Inclinada','muy-inclinada':'Muy inclinada',
        'ninguno':'Ninguno','quebrada':'Quebrada','rio':'Río',
        'naciente':'Naciente','rio-naciente':'Río y naciente' };
    if (el && valor) {
        el.innerHTML = `<i class="fa-solid fa-rotate-left"></i> Original: ${etiq[valor] || valor}`;
        el.classList.add('visible');
    }
}
function eeOcultarOrigVal(id) {
    const el = document.getElementById(`${id}-orig`);
    if (el) el.classList.remove('visible');
}

/* ═══════════════════════════════════════════════════
   3. COMPARADOR ORIGINAL vs NUEVO
═══════════════════════════════════════════════════ */
function eeActualizarComparador() {
    const etiqVeg = { 'bosque-primario':'Bosque Primario','bosque-secundario':'Bosque Secundario','plantacion-forestal':'Plantación Forestal','pasto':'Pasto' };
    const etiqPen = { 'plana':'Plana','inclinada':'Inclinada','muy-inclinada':'Muy inclinada' };
    const etiqRec = { 'ninguno':'Ninguno','quebrada':'Quebrada','rio':'Río','naciente':'Naciente','rio-naciente':'Río y naciente' };

    const campos = [
        { id:'ee-hectareas',    etiq:null,    label:'Hectáreas',   sufijo:' ha' },
        { id:'ee-vegetacion',   etiq:etiqVeg, label:'Vegetación',  sufijo:'' },
        { id:'ee-pendiente',    etiq:etiqPen, label:'Pendiente',   sufijo:'' },
        { id:'ee-recursos',     etiq:etiqRec, label:'Recursos',    sufijo:'' },
    ];

    const wrapOrig = document.getElementById('ee-comp-original');
    const wrapNuev = document.getElementById('ee-comp-nuevo');
    if (!wrapOrig || !wrapNuev) return;

    wrapOrig.innerHTML = '';
    wrapNuev.innerHTML = '';

    campos.forEach(c => {
        const orig  = EE.originales[c.id] ?? '—';
        const nuevo = document.getElementById(c.id)?.value ?? '—';
        const camb  = orig !== nuevo;

        const etiqFn = v => c.etiq ? (c.etiq[v] || v) : v;

        wrapOrig.innerHTML += `
            <div class="ee-comparar-fila">
                <span class="ee-comparar-fila-label">${c.label}</span>
                <span class="ee-comparar-fila-val">${etiqFn(orig)}${orig !== '—' ? c.sufijo : ''}</span>
            </div>`;
        wrapNuev.innerHTML += `
            <div class="ee-comparar-fila">
                <span class="ee-comparar-fila-label">${c.label}</span>
                <span class="ee-comparar-fila-val${camb ? ' cambiado' : ''}">${etiqFn(nuevo)}${nuevo !== '—' ? c.sufijo : ''}</span>
            </div>`;
    });
}

/* ═══════════════════════════════════════════════════
   4. CÁLCULO DE PAGO
═══════════════════════════════════════════════════ */
function eeCalcularPago() {
    const has = parseFloat(document.getElementById('ee-hectareas')?.value) || 0;
    const veg = document.getElementById('ee-vegetacion')?.value || '';
    const pen = document.getElementById('ee-pendiente')?.value  || '';
    const rec = document.getElementById('ee-recursos')?.value   || '';

    const base        = EE_PARAMS.precioBaseHa * has;
    const pctVeg      = EE_PARAMS.ajusteVeg[veg]       ?? 0;
    const pctPen      = EE_PARAMS.ajustePendiente[pen]  ?? 0;
    const pctRec      = EE_PARAMS.ajusteRecursos[rec]   ?? 0;
    const pctTotal    = Math.min(pctVeg + pctPen + pctRec, EE_PARAMS.tope);
    const montoAjuste = base * (pctTotal / 100);
    const total       = base + montoAjuste;

    eeSetCalc('ee-calc-base',   `₡${fmtNum(base)}`);
    eeSetCalc('ee-calc-veg',    pctVeg  > 0 ? `+${pctVeg}%`  : '0%', pctVeg  > 0);
    eeSetCalc('ee-calc-pen',    pctPen  > 0 ? `+${pctPen}%`  : '0%', pctPen  > 0);
    eeSetCalc('ee-calc-rec',    pctRec  > 0 ? `+${pctRec}%`  : '0%', pctRec  > 0);
    eeSetCalc('ee-calc-ajuste', `₡${fmtNum(montoAjuste)}`, montoAjuste > 0);

    const tot = document.getElementById('ee-calc-total');
    if (tot) { tot.textContent = `₡${fmtNum(total)}`; tot.className = 'ee-calculo-fila-val total'; }

    const hdr = document.getElementById('ee-calculo-monto');
    if (hdr) hdr.textContent = has > 0 ? `₡${fmtNum(total)}` : '₡0';
}

function eeSetCalc(id, txt, pos = false) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = txt;
    el.className   = 'ee-calculo-fila-val' + (pos ? ' positivo' : '');
}

function fmtNum(n) { return Math.round(n).toLocaleString('es-CR'); }

/* ═══════════════════════════════════════════════════
   5. VALIDACIÓN
═══════════════════════════════════════════════════ */
const EE_REGLAS = {
    'ee-hectareas':    { req:true, tipo:'numero', msg:'Las hectáreas deben ser un número mayor a 0.', min:0.01 },
    'ee-vegetacion':   { req:true, tipo:'select', msg:'Seleccione el tipo de vegetación.' },
    'ee-pendiente':    { req:true, tipo:'select', msg:'Seleccione el tipo de pendiente.' },
    'ee-recursos':     { req:true, tipo:'select', msg:'Seleccione los recursos hídricos.' },
    'ee-fecha-visita': { req:true, tipo:'fecha-futura', msg:'La fecha de visita debe ser hoy o posterior.' },
    'ee-observaciones':{ req:true, tipo:'texto', msg:'Las observaciones son obligatorias (mín. 15 caracteres).', minLen:15 },
};

function eeValidarCampo(id) {
    const regla = EE_REGLAS[id];
    if (!regla) return true;
    const el  = document.getElementById(id);
    const err = document.getElementById(`${id}-err`);
    if (!el) return true;

    const val = el.value.trim();
    let ok = true;

    if (regla.req) {
        if (!val || (regla.tipo === 'select' && val === '')) ok = false;
        if (ok && regla.tipo === 'numero') { const n = parseFloat(val); if (isNaN(n) || n < (regla.min||0)) ok = false; }
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

function eeValidarTodo() {
    const res = Object.keys(EE_REGLAS).map(eeValidarCampo);
    const ok  = res.every(Boolean);
    if (!ok) eeToast('Corrija los campos marcados en rojo.', true);
    return ok;
}

/* ═══════════════════════════════════════════════════
   6. GUARDAR
═══════════════════════════════════════════════════ */
function eeGuardar() {
    if (!eeValidarTodo()) return;

    const id = new URLSearchParams(window.location.search).get('id') || '0';

    const datos = {
        evaluacionId:   id,
        hectareas:      document.getElementById('ee-hectareas')?.value,
        vegetacion:     document.getElementById('ee-vegetacion')?.value,
        pendiente:      document.getElementById('ee-pendiente')?.value,
        recursos:       document.getElementById('ee-recursos')?.value,
        usoSuelo:       [...EE.usoSueloSel],
        fechaVisita:    document.getElementById('ee-fecha-visita')?.value,
        horaVisita:     document.getElementById('ee-hora-visita')?.value,
        observaciones:  document.getElementById('ee-observaciones')?.value,
        camposModif:    [...EE.modificados],
    };

    /* === Conectar al backend en producción ===
    const token = document.querySelector('input[name="__RequestVerificationToken"]').value;
    fetch('/IngForestal/Evaluaciones/Editar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'RequestVerificationToken': token },
        body: JSON.stringify(datos)
    })
    .then(r => r.json())
    .then(data => {
        if (data.exito) window.location.href = `/IngForestal/EvaluacionesDetalle?id=${id}`;
        else eeToast(data.mensaje || 'Error al guardar.', true);
    })
    .catch(() => eeToast('Error de conexión.', true));
    */

    console.log('Evaluación editada:', datos);
    eeToast('✅ Cambios guardados correctamente.');
    setTimeout(() => { window.location.href = `/IngForestal/EvaluacionesDetalle?id=${id}`; }, 1800);
}

/* ═══════════════════════════════════════════════════
   7. MODAL DESCARTE
═══════════════════════════════════════════════════ */
function eeConfirmarSalir() {
    if (!EE.hayCambios) { window.location.href = '/IngForestal/EvaluacionesPendientes'; return; }
    document.getElementById('ee-modal-overlay')?.classList.add('activo');
    document.addEventListener('keydown', eeModalEsc);
}

function eeCerrarModal() {
    document.getElementById('ee-modal-overlay')?.classList.remove('activo');
    document.removeEventListener('keydown', eeModalEsc);
}

function eeModalEsc(e) { if (e.key === 'Escape') eeCerrarModal(); }

function eeDescartarCambios() {
    eeCerrarModal();
    window.location.href = '/IngForestal/EvaluacionesPendientes';
}

/* ═══════════════════════════════════════════════════
   8. TOAST
═══════════════════════════════════════════════════ */
function eeToast(msg, err = false) {
    const t = document.getElementById('ee-toast');
    const s = document.getElementById('ee-toast-msg');
    if (!t || !msg) return;
    s.textContent = msg;
    t.classList.toggle('error', err);
    t.classList.add('visible');
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('visible'), 3500);
}

/* ═══════════════════════════════════════════════════
   9. INIT
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

    // Fecha mínima = hoy
    const fi = document.getElementById('ee-fecha-visita');
    if (fi) fi.min = new Date().toISOString().split('T')[0];

    // Registrar originales DESPUÉS de que el DOM esté cargado
    eeRegistrarOriginales();

    // Adjuntar listeners
    Object.keys(EE_REGLAS).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('blur',   () => eeValidarCampo(id));
        el.addEventListener('change', () => { eeOnCampo(id); eeValidarCampo(id); });
        el.addEventListener('input',  () => {
            eeOnCampo(id);
            if (el.classList.contains('invalido')) eeValidarCampo(id);
        });
    });

    // Modal descarte al hacer clic fuera
    document.getElementById('ee-modal-overlay')?.addEventListener('click', e => {
        if (e.target.id === 'ee-modal-overlay') eeCerrarModal();
    });

    // Render inicial del comparador y cálculo
    eeActualizarComparador();
    eeCalcularPago();
});
