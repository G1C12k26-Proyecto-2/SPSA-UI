/* =====================================================
   visitas-index.js — Visitas / Index | PSA
   Ruta: wwwroot/js/tecnico/visitas-index.js
   ===================================================== */

/* ── ESTADO GLOBAL ─────────────────────────────────── */
const VI = {
    tabActual:    'todos',
    columnaSort:  null,
    dirSort:      'asc',
    paginaActual: 1,
    porPagina:    8,
};

/* ── 1. TABS ──────────────────────────────────────── */
function cambiarTab(tab) {
    if (!tab) return;
    VI.tabActual    = tab;
    VI.paginaActual = 1;

    document.querySelectorAll('.vi-tab').forEach(btn => {
        btn.classList.toggle('activo', btn.dataset.tab === tab);
    });

    aplicarFiltros();
}

/* ── 2. FILTROS + BÚSQUEDA ────────────────────────── */
function aplicarFiltros() {
    const busqueda = (document.getElementById('vi-buscador')?.value || '').trim().toLowerCase();
    const orden    =  document.getElementById('vi-orden')?.value || 'fecha-desc';

    const filas = Array.from(document.querySelectorAll('#vi-tbody tr'));
    let visibles = [];

    filas.forEach(fila => {
        const estado = fila.dataset.estado || '';
        const texto  = fila.innerText.toLowerCase();

        const passTab  = VI.tabActual === 'todos' || estado === VI.tabActual;
        const passBusc = !busqueda || texto.includes(busqueda);

        fila.classList.toggle('oculta', !(passTab && passBusc));
        if (passTab && passBusc) visibles.push(fila);
    });

    // Ordenar
    visibles.sort((a, b) => {
        switch (orden) {
            case 'fecha-desc':     return new Date(b.dataset.fecha)      - new Date(a.dataset.fecha);
            case 'fecha-asc':      return new Date(a.dataset.fecha)      - new Date(b.dataset.fecha);
            case 'nombre-asc':     return (a.dataset.nombre  || '').localeCompare(b.dataset.nombre  || '');
            case 'hectareas-desc': return parseFloat(b.dataset.hectareas) - parseFloat(a.dataset.hectareas);
            default:               return 0;
        }
    });

    // Re-insertar en orden
    const tbody = document.getElementById('vi-tbody');
    visibles.forEach(f => tbody.appendChild(f));

    actualizarPaginacion(visibles.length);
    mostrarEstadoVacio(visibles.length === 0);
}

function limpiarFiltros() {
    const buscador = document.getElementById('vi-buscador');
    const orden    = document.getElementById('vi-orden');
    if (buscador) buscador.value = '';
    if (orden)    orden.value   = 'fecha-desc';
    VI.tabActual    = 'todos';
    VI.paginaActual = 1;
    document.querySelectorAll('.vi-tab').forEach(b => b.classList.toggle('activo', b.dataset.tab === 'todos'));
    aplicarFiltros();
}

/* ── 3. PAGINACIÓN ───────────────────────────────── */
function actualizarPaginacion(total) {
    const totalPags = Math.max(1, Math.ceil(total / VI.porPagina));
    if (VI.paginaActual > totalPags) VI.paginaActual = totalPags;

    const filas = Array.from(document.querySelectorAll('#vi-tbody tr:not(.oculta)'));
    filas.forEach((f, i) => {
        const enPagina = i >= (VI.paginaActual - 1) * VI.porPagina &&
                         i <   VI.paginaActual       * VI.porPagina;
        f.style.display = enPagina ? '' : 'none';
    });

    // Texto de info
    const desde = total === 0 ? 0 : (VI.paginaActual - 1) * VI.porPagina + 1;
    const hasta = Math.min(VI.paginaActual * VI.porPagina, total);
    const info  = document.getElementById('vi-pag-info');
    if (info) info.textContent = total === 0
        ? 'Sin resultados'
        : `Mostrando ${desde}–${hasta} de ${total} visita${total !== 1 ? 's' : ''}`;

    // Botones de página
    renderBotonesPag(totalPags);
}

function renderBotonesPag(totalPags) {
    const wrap = document.getElementById('vi-pag-btns');
    if (!wrap) return;
    wrap.innerHTML = '';

    // Anterior
    const btnPrev = crearPagBtn('<i class="fa-solid fa-chevron-left"></i>', 'Anterior', VI.paginaActual === 1);
    btnPrev.addEventListener('click', () => { if (VI.paginaActual > 1) { VI.paginaActual--; aplicarFiltros(); } });
    wrap.appendChild(btnPrev);

    // Números
    for (let p = 1; p <= totalPags; p++) {
        const btn = crearPagBtn(p, `Página ${p}`, false);
        if (p === VI.paginaActual) btn.classList.add('activo');
        btn.addEventListener('click', () => { VI.paginaActual = p; aplicarFiltros(); });
        wrap.appendChild(btn);
    }

    // Siguiente
    const btnNext = crearPagBtn('<i class="fa-solid fa-chevron-right"></i>', 'Siguiente', VI.paginaActual === totalPags);
    btnNext.addEventListener('click', () => { if (VI.paginaActual < totalPags) { VI.paginaActual++; aplicarFiltros(); } });
    wrap.appendChild(btnNext);
}

function crearPagBtn(contenido, title, deshabilitado) {
    const btn = document.createElement('button');
    btn.className    = 'vi-pag-btn';
    btn.title        = title;
    btn.disabled     = deshabilitado;
    btn.innerHTML    = contenido;
    return btn;
}

/* ── 4. ESTADO VACÍO ─────────────────────────────── */
function mostrarEstadoVacio(vacio) {
    const el = document.getElementById('vi-empty');
    if (el) el.style.display = vacio ? 'block' : 'none';
}

/* ── 5. ETIQUETA "DÍAS RESTANTES" ────────────────── */
function calcularDiasRestantes() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    document.querySelectorAll('[data-fecha-visita]').forEach(el => {
        const raw = el.dataset.fechaVisita;
        if (!raw) return;
        const fecha = new Date(raw);
        fecha.setHours(0, 0, 0, 0);
        const diff = Math.round((fecha - hoy) / 86400000);

        const span = el.querySelector('.vi-fecha-dias');
        if (!span) return;

        if (diff < 0)       { span.textContent = 'Vencida';                span.className = 'vi-fecha-dias urgente'; }
        else if (diff === 0){ span.textContent = 'Hoy';                    span.className = 'vi-fecha-dias urgente'; }
        else if (diff === 1){ span.textContent = 'Mañana';                 span.className = 'vi-fecha-dias pronto';  }
        else if (diff <= 3) { span.textContent = `En ${diff} días`;        span.className = 'vi-fecha-dias pronto';  }
        else                { span.textContent = `En ${diff} días`;        span.className = 'vi-fecha-dias ok';      }
    });
}

/* ── 6. MODAL PROGRAMAR VISITA ───────────────────── */
function abrirModalProgramar(id, finca, propietario) {
    // Prellenar campos de referencia (solo lectura)
    const elFinca = document.getElementById('pv-finca');
    const elProp  = document.getElementById('pv-propietario');
    const elId    = document.getElementById('pv-solicitud-id');
    if (elFinca) elFinca.value       = finca       || '';
    if (elProp)  elProp.value        = propietario || '';
    if (elId)    elId.value          = id          || '';

    limpiarErroresModal();

    const overlay = document.getElementById('vi-modal-overlay');
    if (overlay) overlay.classList.add('activo');
    document.addEventListener('keydown', cerrarModalEsc);
}

function cerrarModal() {
    const overlay = document.getElementById('vi-modal-overlay');
    if (overlay) overlay.classList.remove('activo');
    document.removeEventListener('keydown', cerrarModalEsc);
    document.getElementById('vi-form-programar')?.reset();
    limpiarErroresModal();
}

function cerrarModalEsc(e) { if (e.key === 'Escape') cerrarModal(); }

/* ── 7. VALIDACIÓN DEL FORMULARIO ────────────────── */
const REGLAS = {
    'pv-fecha':       { req: true,  tipo: 'fecha-futura', msg: 'Seleccione una fecha válida (hoy o posterior).' },
    'pv-hora':        { req: true,  tipo: 'texto',        msg: 'Indique la hora de la visita.' },
    'pv-objetivo':    { req: true,  tipo: 'texto',        msg: 'Describa el objetivo de la visita.' },
    'pv-transporte':  { req: true,  tipo: 'select',       msg: 'Seleccione el medio de transporte.' },
    'pv-observacion': { req: false                                                                   },
};

function validarCampo(id) {
    const regla = REGLAS[id];
    if (!regla) return true;

    const el  = document.getElementById(id);
    const err = document.getElementById(`${id}-err`);
    if (!el) return true;

    let ok = true;

    if (regla.req) {
        const val = el.value.trim();
        if (!val || (regla.tipo === 'select' && val === '')) ok = false;
        if (regla.tipo === 'fecha-futura' && val) {
            const sel = new Date(val);
            sel.setHours(0, 0, 0, 0);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            if (sel < hoy) ok = false;
        }
    }

    el.classList.toggle('invalido', !ok);
    if (err) {
        err.textContent = regla.msg || 'Campo requerido.';
        err.classList.toggle('visible', !ok);
    }
    return ok;
}

function validarFormulario() {
    return Object.keys(REGLAS).map(validarCampo).every(Boolean);
}

function limpiarErroresModal() {
    Object.keys(REGLAS).forEach(id => {
        document.getElementById(id)?.classList.remove('invalido');
        const err = document.getElementById(`${id}-err`);
        if (err) err.classList.remove('visible');
    });
}

function guardarVisita() {
    if (!validarFormulario()) {
        mostrarToastVI('Corrija los campos marcados antes de continuar.', true);
        return;
    }

    /* === Conectar al backend en producción ===
    const token = document.querySelector('input[name="__RequestVerificationToken"]').value;
    const datos = {
        solicitudId:  document.getElementById('pv-solicitud-id').value,
        fechaVisita:  document.getElementById('pv-fecha').value,
        horaVisita:   document.getElementById('pv-hora').value,
        objetivo:     document.getElementById('pv-objetivo').value,
        transporte:   document.getElementById('pv-transporte').value,
        observacion:  document.getElementById('pv-observacion').value,
    };
    fetch('/Visitas/Programar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'RequestVerificationToken': token },
        body: JSON.stringify(datos)
    })
    .then(r => r.json())
    .then(data => {
        if (data.exito) { cerrarModal(); mostrarToastVI('Visita programada correctamente.'); aplicarFiltros(); }
        else            { mostrarToastVI(data.mensaje || 'Error al guardar.', true); }
    })
    .catch(() => mostrarToastVI('Error de conexión con el servidor.', true));
    */

    // Simulación frontend
    cerrarModal();
    mostrarToastVI('✅ Visita programada correctamente.');
}

/* ── 8. TOAST ────────────────────────────────────── */
function mostrarToastVI(mensaje, esError = false) {
    const toast   = document.getElementById('vi-toast');
    const msgSpan = document.getElementById('vi-toast-msg');
    if (!toast || !mensaje) return;
    msgSpan.textContent = mensaje;
    toast.classList.toggle('error', esError);
    toast.classList.add('visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('visible'), 3500);
}

/* ── 9. NAVEGACIÓN ───────────────────────────────── */
function verDetalle(id) {
    if (!id || isNaN(id)) { mostrarToastVI('ID de visita inválido.', true); return; }
    window.location.href = `/Detalle?id=${encodeURIComponent(id)}`;
}

function realizarVisita(id) {
    if (!id || isNaN(id)) { mostrarToastVI('ID de visita inválido.', true); return; }
    window.location.href = `/Realizar?id=${encodeURIComponent(id)}`;
}

/* ── 10. INIT ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

    // Fecha mínima del input del modal = hoy
    const inputFecha = document.getElementById('pv-fecha');
    if (inputFecha) {
        const hoy = new Date().toISOString().split('T')[0];
        inputFecha.min = hoy;
    }

    // Cerrar modal al hacer clic fuera
    document.getElementById('vi-modal-overlay')?.addEventListener('click', e => {
        if (e.target.id === 'vi-modal-overlay') cerrarModal();
    });

    // Validación en tiempo real de cada campo del modal
    Object.keys(REGLAS).forEach(id => {
        document.getElementById(id)?.addEventListener('blur', () => validarCampo(id));
        document.getElementById(id)?.addEventListener('input', () => {
            if (document.getElementById(id)?.classList.contains('invalido')) validarCampo(id);
        });
    });

    // Calcular días restantes
    calcularDiasRestantes();

    // Aplicar filtros iniciales (muestra todos)
    aplicarFiltros();
});
