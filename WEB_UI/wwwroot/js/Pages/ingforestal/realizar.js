/* =====================================================
   realizar.js — Visitas / Realizar | PSA
   Ruta: wwwroot/js/ingforestal/realizar.js
   ===================================================== */

/* ═══════════════════════════════════════════════════
   ESTADO GLOBAL
═══════════════════════════════════════════════════ */
const RL = {
    decision:       null,   // 'aprobar' | 'rechazar'
    fotosNuevas:    [],     // archivos seleccionados
    camposModif:    new Set(),
    valoresOriginales: {},
};
/* ═══════════════════════════════════════════════════
   1. CAMPOS MODIFICADOS vs ORIGINALES
═══════════════════════════════════════════════════ */
function registrarOriginal(id) {
    const el = document.getElementById(id);
    if (el) RL.valoresOriginales[id] = el.value;
}
function eeRegistrarOriginales() {
    const campos = ['ee-hectareas', 'ee-vegetacion', 'ee-pendiente',
        'ee-recursos', 'ee-fecha-visita', 'ee-hora-visita',
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
function eeActualizarComparador() {
    const etiqVeg = { 'bosque-primario': 'Bosque Primario', 'bosque-secundario': 'Bosque Secundario', 'plantacion-forestal': 'Plantación Forestal', 'pasto': 'Pasto' };
    const etiqPen = { 'plana': 'Plana', 'inclinada': 'Inclinada', 'muy-inclinada': 'Muy inclinada' };
    const etiqRec = { 'ninguno': 'Ninguno', 'quebrada': 'Quebrada', 'rio': 'Río', 'naciente': 'Naciente', 'rio-naciente': 'Río y naciente' };

    const campos = [
        { id: 'ee-hectareas', etiq: null, label: 'Hectáreas', sufijo: ' ha' },
        { id: 'ee-vegetacion', etiq: etiqVeg, label: 'Vegetación', sufijo: '' },
        { id: 'ee-pendiente', etiq: etiqPen, label: 'Pendiente', sufijo: '' },
        { id: 'ee-recursos', etiq: etiqRec, label: 'Recursos', sufijo: '' },
    ];

    const wrapOrig = document.getElementById('ee-comp-original');
    const wrapNuev = document.getElementById('ee-comp-nuevo');
    if (!wrapOrig || !wrapNuev) return;

    wrapOrig.innerHTML = '';
    wrapNuev.innerHTML = '';

    campos.forEach(c => {
        const orig = EE.originales[c.id] ?? '—';
        const nuevo = document.getElementById(c.id)?.value ?? '—';
        const camb = orig !== nuevo;

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

function onCampoChange(id) {
    const el  = document.getElementById(id);
    if (!el) return;
    const original = RL.valoresOriginales[id] ?? '';
    const actual   = el.value;

    if (actual !== original) {
        RL.camposModif.add(id);
        el.classList.add('modificado');
        mostrarOriginal(id, original);
    } else {
        RL.camposModif.delete(id);
        el.classList.remove('modificado');
        ocultarOriginal(id);
    }

    actualizarBadgeCambios();
    actualizarProgreso();

    // Limpiar error si estaba marcado
    if (el.classList.contains('invalido')) validarCampo(id);
}

function mostrarOriginal(id, valorOrig) {
    const tag = document.getElementById(`${id}-orig`);
    if (tag && valorOrig) {
        tag.textContent = `Original: ${valorOrig}`;
        tag.style.display = 'inline-flex';
    }
}
function ocultarOriginal(id) {
    const tag = document.getElementById(`${id}-orig`);
    if (tag) tag.style.display = 'none';
}

function actualizarBadgeCambios() {
    const badge = document.getElementById('rl-badge-cambios');
    const n     = RL.camposModif.size;
    if (!badge) return;
    badge.textContent = `${n} cambio${n !== 1 ? 's' : ''}`;
    badge.classList.toggle('visible', n > 0);
}

/* ═══════════════════════════════════════════════════
   2. VALIDACIÓN
═══════════════════════════════════════════════════ */
const RL_REGLAS = {
    'rl-fecha-visita':  { req: true,  tipo: 'fecha',  msg: 'Ingrese la fecha real de la visita.' },
    'rl-hora-visita':   { req: true,  tipo: 'texto',  msg: 'Ingrese la hora de la visita.' },
    'rl-hectareas':     { req: true,  tipo: 'numero', msg: 'Las hectáreas deben ser un número mayor a 0.', min: 0.01 },
    'rl-vegetacion':    { req: true,  tipo: 'select', msg: 'Seleccione el tipo de vegetación observado.' },
    'rl-pendiente':     { req: true,  tipo: 'select', msg: 'Seleccione el tipo de pendiente observada.' },
    'rl-recursos':      { req: true,  tipo: 'select', msg: 'Seleccione los recursos hídricos observados.' },
    'rl-observaciones': { req: true,  tipo: 'texto',  msg: 'Las observaciones técnicas son obligatorias.', minLen: 20 },
};

function validarCampo(id) {
    const regla = RL_REGLAS[id];
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
        if (ok && regla.minLen && val.length < regla.minLen) ok = false;
    }

    el.classList.toggle('invalido', !ok);
    if (err) err.classList.toggle('visible', !ok);
    return ok;
}

function validarTodo() {
    const resultados = Object.keys(RL_REGLAS).map(id => validarCampo(id));

    // Validar decisión
    const okDecision = validarDecision();

    const ok = resultados.every(Boolean) && okDecision;
    if (!ok) mostrarToastRL('Corrija los campos marcados en rojo antes de guardar.', true);
    return ok;
}

function validarDecision() {
    const err = document.getElementById('rl-decision-err');
    const ok  = RL.decision !== null;
    if (err) err.classList.toggle('visible', !ok);
    return ok;
}

/* ═══════════════════════════════════════════════════
   3. DECISIÓN FINAL (aprobar / rechazar)
═══════════════════════════════════════════════════ */
function seleccionarDecision(tipo) {
    RL.decision = tipo;

    const btnAprobar  = document.getElementById('rl-btn-aprobar');
    const btnRechazar = document.getElementById('rl-btn-rechazar');
    const wrapMotivo  = document.getElementById('rl-wrap-motivo');

    if (btnAprobar)  btnAprobar.className  = 'rl-decision-btn' + (tipo === 'aprobar'  ? ' seleccionado-aprobar'  : '');
    if (btnRechazar) btnRechazar.className = 'rl-decision-btn' + (tipo === 'rechazar' ? ' seleccionado-rechazar' : '');

    // Motivo obligatorio solo al rechazar
    if (wrapMotivo) wrapMotivo.style.display = tipo === 'rechazar' ? 'block' : 'none';

    // Limpiar error
    document.getElementById('rl-decision-err')?.classList.remove('visible');

    // Agregar regla dinámica de motivo
    if (tipo === 'rechazar') {
        RL_REGLAS['rl-motivo-rechazo'] = {
            req: true, tipo: 'texto',
            msg: 'El motivo de rechazo debe tener al menos 15 caracteres.', minLen: 15
        };
    } else {
        delete RL_REGLAS['rl-motivo-rechazo'];
        document.getElementById('rl-motivo-rechazo')?.classList.remove('invalido');
        document.getElementById('rl-motivo-rechazo-err')?.classList.remove('visible');
    }

    actualizarProgreso();
}

/* ═══════════════════════════════════════════════════
   4. UPLOAD DE FOTOS
═══════════════════════════════════════════════════ */
function onFotosSeleccionadas(event) {
    const archivos = Array.from(event.target.files || []);
    const validos  = archivos.filter(f => f.type.startsWith('image/'));

    if (validos.length !== archivos.length) {
        mostrarToastRL('Solo se permiten archivos de imagen (JPG, PNG, WEBP).', true);
    }

    // Límite de 8 fotos totales
    const disponibles = 8 - RL.fotosNuevas.length;
    const aCargr      = validos.slice(0, disponibles);

    if (validos.length > disponibles) {
        mostrarToastRL(`Máximo 8 fotos. Se agregarán solo las primeras ${disponibles}.`, true);
    }

    aCargr.forEach(file => {
        RL.fotosNuevas.push(file);
        agregarThumbFoto(file, RL.fotosNuevas.length - 1);
    });

    actualizarProgreso();

    // Limpiar el input para permitir volver a seleccionar los mismos archivos
    event.target.value = '';
}

function agregarThumbFoto(file, idx) {
    const grid  = document.getElementById('rl-fotos-preview');
    if (!grid) return;

    const thumb = document.createElement('div');
    thumb.className = 'rl-foto-thumb';
    thumb.id        = `rl-thumb-${idx}`;

    const reader = new FileReader();
    reader.onload = e => {
        thumb.innerHTML = `
            <img src="${e.target.result}" alt="Foto ${idx + 1}">
            <button class="rl-foto-remove" onclick="removerFoto(${idx})" title="Eliminar foto" aria-label="Eliminar foto ${idx + 1}">
                <i class="fa-solid fa-xmark"></i>
            </button>`;
    };
    reader.readAsDataURL(file);
    grid.appendChild(thumb);
}

function removerFoto(idx) {
    RL.fotosNuevas.splice(idx, 1);
    document.getElementById(`rl-thumb-${idx}`)?.remove();
    // Re-indexar botones restantes
    document.querySelectorAll('.rl-foto-thumb').forEach((t, i) => {
        t.id = `rl-thumb-${i}`;
        const btn = t.querySelector('.rl-foto-remove');
        if (btn) {
            btn.setAttribute('onclick', `removerFoto(${i})`);
            btn.setAttribute('aria-label', `Eliminar foto ${i + 1}`);
        }
    });
    actualizarProgreso();
}

/* Drag & drop */
function onDragOver(e)  { e.preventDefault(); document.getElementById('rl-upload-zona')?.classList.add('drag-over'); }
function onDragLeave()  { document.getElementById('rl-upload-zona')?.classList.remove('drag-over'); }
function onDrop(e) {
    e.preventDefault();
    document.getElementById('rl-upload-zona')?.classList.remove('drag-over');
    const fakeEvt = { target: { files: e.dataTransfer.files }, value: '' };
    onFotosSeleccionadas(fakeEvt);
}

/* ═══════════════════════════════════════════════════
   5. PROGRESO LATERAL
═══════════════════════════════════════════════════ */
const RL_CHECKS = [
    { id: 'chk-datos',       label: 'Datos de campo',       fn: () => ['rl-fecha-visita','rl-hora-visita','rl-hectareas'].every(id => document.getElementById(id)?.value.trim()) },
    { id: 'chk-vegetacion',  label: 'Tipo de vegetación',   fn: () => !!document.getElementById('rl-vegetacion')?.value },
    { id: 'chk-pendiente',   label: 'Pendiente del terreno',fn: () => !!document.getElementById('rl-pendiente')?.value  },
    { id: 'chk-recursos',    label: 'Recursos hídricos',    fn: () => !!document.getElementById('rl-recursos')?.value   },
    { id: 'chk-observ',      label: 'Observaciones técnicas',fn: () => (document.getElementById('rl-observaciones')?.value.trim().length || 0) >= 20 },
    { id: 'chk-fotos',       label: 'Fotografías adjuntas', fn: () => RL.fotosNuevas.length > 0 },
    { id: 'chk-decision',    label: 'Decisión final',       fn: () => RL.decision !== null },
];

function actualizarProgreso() {
    let completados = 0;
    RL_CHECKS.forEach(c => {
        const ok  = c.fn();
        const dot = document.getElementById(c.id + '-dot');
        const row = document.getElementById(c.id + '-row');
        if (dot) dot.className = 'rl-check-dot' + (ok ? ' ok' : '');
        if (ok) {
            if (dot) dot.innerHTML = '<i class="fa-solid fa-check"></i>';
            row?.classList.add('completado');
            completados++;
        } else {
            if (dot) dot.innerHTML = '';
            row?.classList.remove('completado');
        }
    });

    const pct  = Math.round((completados / RL_CHECKS.length) * 100);
    const pctEl = document.getElementById('rl-progreso-pct');
    const bar   = document.getElementById('rl-progreso-bar');
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (bar)   bar.style.width   = `${pct}%`;
}

/* ═══════════════════════════════════════════════════
   6. GUARDAR EVALUACIÓN
═══════════════════════════════════════════════════ */
function guardarEvaluacion() {
    if (!validarTodo()) return;

    const id = obtenerIdVisita();
    const datos = {
        visitaId:       id,
        fechaVisita:    document.getElementById('rl-fecha-visita')?.value,
        horaVisita:     document.getElementById('rl-hora-visita')?.value,
        hectareas:      document.getElementById('rl-hectareas')?.value,
        vegetacion:     document.getElementById('rl-vegetacion')?.value,
        pendiente:      document.getElementById('rl-pendiente')?.value,
        recursos:       document.getElementById('rl-recursos')?.value,
        usoSuelo:       document.getElementById('rl-uso-suelo')?.value,
        observaciones:  document.getElementById('rl-observaciones')?.value,
        motivoRechazo:  document.getElementById('rl-motivo-rechazo')?.value || '',
        decision:       RL.decision,
        camposModif:    Array.from(RL.camposModif),
        cantFotos:      RL.fotosNuevas.length,
    };

    /* === Conectar al backend en producción ===
    const token    = document.querySelector('input[name="__RequestVerificationToken"]').value;
    const formData = new FormData();
    Object.entries(datos).forEach(([k,v]) => formData.append(k, Array.isArray(v) ? JSON.stringify(v) : v));
    RL.fotosNuevas.forEach((f, i) => formData.append(`fotos[${i}]`, f));

    fetch('/IngForestal/Visitas/GuardarEvaluacion', {
        method: 'POST',
        headers: { 'RequestVerificationToken': token },
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        if (data.exito) window.location.href = `/IngForestal/Visitas/Detalle?id=${id}`;
        else mostrarToastRL(data.mensaje || 'Error al guardar.', true);
    })
    .catch(() => mostrarToastRL('Error de conexión con el servidor.', true));
    */

    // Simulación frontend
    console.log('Evaluación a guardar:', datos);
    mostrarToastRL(`✅ Evaluación guardada. Decisión: ${RL.decision === 'aprobar' ? 'Aprobada' : 'Rechazada'}`);
    setTimeout(() => {
        window.location.href = `/IngForestal/Detalle?id=${id}`;
    }, 2000);
}

/* ═══════════════════════════════════════════════════
   7. HELPERS
═══════════════════════════════════════════════════ */
function obtenerIdVisita() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('id')) || 0;
}

function mostrarToastRL(mensaje, esError = false) {
    const toast   = document.getElementById('rl-toast');
    const msgSpan = document.getElementById('rl-toast-msg');
    if (!toast || !mensaje) return;
    msgSpan.textContent = mensaje;
    toast.classList.toggle('error', esError);
    toast.classList.add('visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('visible'), 3800);
}


/* ═══════════════════════════════════════════════════
   8. INIT
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

    // Registrar valores originales para comparación
    ['rl-hectareas','rl-vegetacion','rl-pendiente','rl-recursos','rl-uso-suelo'].forEach(registrarOriginal);

    // Fecha máxima = hoy
    const inputFecha = document.getElementById('rl-fecha-visita');
    if (inputFecha) inputFecha.max = new Date().toISOString().split('T')[0];

    // Validación en tiempo real
    Object.keys(RL_REGLAS).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('blur',   () => { validarCampo(id); actualizarProgreso(); });
        el.addEventListener('change', () => { validarCampo(id); actualizarProgreso(); onCampoChange(id); });
        el.addEventListener('input',  () => {
            if (el.classList.contains('invalido')) validarCampo(id);
            actualizarProgreso();
            onCampoChange(id);
        });
    });

    // Drag & drop en la zona de fotos
    const zona = document.getElementById('rl-upload-zona');
    if (zona) {
        zona.addEventListener('dragover',  onDragOver);
        zona.addEventListener('dragleave', onDragLeave);
        zona.addEventListener('drop',      onDrop);
    }

    // Render inicial del progreso
    actualizarProgreso();
});
