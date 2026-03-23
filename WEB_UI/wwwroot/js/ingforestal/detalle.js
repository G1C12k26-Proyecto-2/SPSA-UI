/* =====================================================
   detalle.js — Visitas / Detalle | PSA
   Ruta: wwwroot/js/ingforestal/detalle.js
   ===================================================== */

/* ═══════════════════════════════════════════════════
   1. MODAL CAMBIO DE ESTADO
═══════════════════════════════════════════════════ */
function abrirModalEstado() {
    limpiarErroresModal();
    document.getElementById('dt-modal-overlay').classList.add('activo');
    document.addEventListener('keydown', cerrarModalEsc);
}

function cerrarModal() {
    document.getElementById('dt-modal-overlay').classList.remove('activo');
    document.removeEventListener('keydown', cerrarModalEsc);
    document.getElementById('dt-form-estado')?.reset();
    limpiarErroresModal();
}

function cerrarModalEsc(e) { if (e.key === 'Escape') cerrarModal(); }

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('dt-modal-overlay')?.addEventListener('click', e => {
        if (e.target.id === 'dt-modal-overlay') cerrarModal();
    });
});

/* ── Mostrar/ocultar campo motivo según estado seleccionado ── */
function onEstadoCambio() {
    const val       = document.getElementById('dt-nuevo-estado')?.value || '';
    const wrapMotivo = document.getElementById('dt-wrap-motivo');
    if (wrapMotivo) {
        // El motivo es obligatorio al rechazar; opcional al aprobar/procesar
        wrapMotivo.style.display = val ? 'block' : 'none';
        const label = wrapMotivo.querySelector('label');
        if (label) {
            label.innerHTML = val === 'rechazada'
                ? 'Motivo del rechazo <span class="req">*</span>'
                : 'Observación (opcional)';
        }
    }
    // Limpiar error del campo si lo hay
    if (document.getElementById('dt-nuevo-estado')?.classList.contains('invalido')) {
        validarCampoModal('dt-nuevo-estado');
    }
}

/* ═══════════════════════════════════════════════════
   2. VALIDACIÓN DEL MODAL
═══════════════════════════════════════════════════ */
function validarCampoModal(id) {
    const el  = document.getElementById(id);
    const err = document.getElementById(`${id}-err`);
    if (!el) return true;

    const val = el.value.trim();
    let ok = true;

    if (id === 'dt-nuevo-estado' && !val)  ok = false;
    if (id === 'dt-motivo') {
        const estado = document.getElementById('dt-nuevo-estado')?.value;
        if (estado === 'rechazada' && val.length < 10) ok = false;
    }

    el.classList.toggle('invalido', !ok);
    if (err) err.classList.toggle('visible', !ok);
    return ok;
}

function limpiarErroresModal() {
    ['dt-nuevo-estado', 'dt-motivo'].forEach(id => {
        document.getElementById(id)?.classList.remove('invalido');
        document.getElementById(`${id}-err`)?.classList.remove('visible');
    });
}

function guardarEstado() {
    const okEstado = validarCampoModal('dt-nuevo-estado');
    const okMotivo = validarCampoModal('dt-motivo');

    if (!okEstado || !okMotivo) {
        mostrarToastDT('Corrija los campos marcados antes de continuar.', true);
        return;
    }

    const nuevoEstado = document.getElementById('dt-nuevo-estado').value;
    const motivo      = document.getElementById('dt-motivo').value.trim();
    const id          = obtenerIdVisita();

    /* === Conectar al backend en producción ===
    const token = document.querySelector('input[name="__RequestVerificationToken"]').value;
    fetch('/IngForestal/Visitas/CambiarEstado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'RequestVerificationToken': token },
        body: JSON.stringify({ id, nuevoEstado, motivo })
    })
    .then(r => r.json())
    .then(data => {
        if (data.exito) {
            cerrarModal();
            actualizarChipEstado(nuevoEstado);
            mostrarToastDT('Estado actualizado correctamente.');
        } else {
            mostrarToastDT(data.mensaje || 'Error al actualizar.', true);
        }
    })
    .catch(() => mostrarToastDT('Error de conexión con el servidor.', true));
    */

    // Simulación frontend
    cerrarModal();
    actualizarChipEstado(nuevoEstado);
    mostrarToastDT('✅ Estado actualizado correctamente.');
}

/* ── Actualiza el chip de estado en el header y el aside ── */
function actualizarChipEstado(estado) {
    const mapa = {
        pendiente:  { clase: 'chip-pendiente', texto: 'Pendiente' },
        proceso:    { clase: 'chip-proceso',   texto: 'En Proceso' },
        aprobada:   { clase: 'chip-aprobada',  texto: 'Aprobada'  },
        rechazada:  { clase: 'chip-rechazada', texto: 'Rechazada' },
    };
    const info = mapa[estado];
    if (!info) return;

    document.querySelectorAll('.dt-chip-estado').forEach(el => {
        el.className = `chip ${info.clase} dt-chip-estado`;
        el.innerHTML = `● ${info.texto}`;
    });

    // Actualizar estado grande en el aside
    const grande = document.getElementById('dt-estado-grande');
    if (grande) grande.textContent = info.texto;

    // Mostrar/ocultar botón "Realizar visita" según nuevo estado
    const btnRealizar = document.getElementById('dt-btn-realizar');
    if (btnRealizar) btnRealizar.style.display = estado === 'proceso' ? 'inline-flex' : 'none';
}

/* ═══════════════════════════════════════════════════
   3. VISOR DE FOTOS (lightbox simple)
═══════════════════════════════════════════════════ */
let fotoActual = 0;
const FOTOS = [];   // Se llena desde el markup al inicializar

function abrirFoto(idx) {
    if (idx < 0 || idx >= FOTOS.length) return;
    fotoActual = idx;
    const overlay = document.getElementById('dt-lightbox');
    const img     = document.getElementById('dt-lightbox-img');
    const counter = document.getElementById('dt-lightbox-counter');
    if (!overlay || !img) return;

    img.src            = FOTOS[idx].src;
    img.alt            = FOTOS[idx].alt || 'Fotografía de la finca';
    if (counter) counter.textContent = `${idx + 1} / ${FOTOS.length}`;

    overlay.classList.add('activo');
    document.addEventListener('keydown', lightboxTeclado);
}

function cerrarLightbox() {
    document.getElementById('dt-lightbox')?.classList.remove('activo');
    document.removeEventListener('keydown', lightboxTeclado);
}

function lightboxAnterior() { abrirFoto(fotoActual - 1 < 0 ? FOTOS.length - 1 : fotoActual - 1); }
function lightboxSiguiente() { abrirFoto(fotoActual + 1 >= FOTOS.length ? 0 : fotoActual + 1); }

function lightboxTeclado(e) {
    if (e.key === 'Escape')      cerrarLightbox();
    if (e.key === 'ArrowLeft')   lightboxAnterior();
    if (e.key === 'ArrowRight')  lightboxSiguiente();
}

/* ═══════════════════════════════════════════════════
   4. HELPERS
═══════════════════════════════════════════════════ */
function obtenerIdVisita() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('id')) || 0;
}

function realizarVisita() {
    const id = obtenerIdVisita();
    if (!id) { mostrarToastDT('ID de visita inválido.', true); return; }
    window.location.href = `/IngForestal/Realizar?id=${encodeURIComponent(id)}`;
}

function volverLista() {
    window.location.href = '/IngForestal/Index';
}

/* ═══════════════════════════════════════════════════
   5. TOAST
═══════════════════════════════════════════════════ */
function mostrarToastDT(mensaje, esError = false) {
    const toast   = document.getElementById('dt-toast');
    const msgSpan = document.getElementById('dt-toast-msg');
    if (!toast || !mensaje) return;
    msgSpan.textContent = mensaje;
    toast.classList.toggle('error', esError);
    toast.classList.add('visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('visible'), 3500);
}

/* ═══════════════════════════════════════════════════
   6. INIT
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

    // Registrar fotos para el lightbox
    document.querySelectorAll('[data-foto-src]').forEach((el, i) => {
        FOTOS.push({ src: el.dataset.fotoSrc, alt: el.dataset.fotoAlt || '' });
        el.addEventListener('click', () => abrirFoto(i));
    });

    // Lightbox: cerrar al hacer clic fuera de la imagen
    document.getElementById('dt-lightbox')?.addEventListener('click', e => {
        if (e.target.id === 'dt-lightbox') cerrarLightbox();
    });

    // Validación en tiempo real del modal
    document.getElementById('dt-nuevo-estado')?.addEventListener('change', () => {
        onEstadoCambio();
        validarCampoModal('dt-nuevo-estado');
    });
    document.getElementById('dt-motivo')?.addEventListener('blur', () => validarCampoModal('dt-motivo'));
    document.getElementById('dt-motivo')?.addEventListener('input', () => {
        if (document.getElementById('dt-motivo')?.classList.contains('invalido')) {
            validarCampoModal('dt-motivo');
        }
    });

    // Mostrar botón "Realizar" solo si estado es En Proceso
    const estadoActual = document.getElementById('dt-estado-actual')?.value || '';
    const btnRealizar  = document.getElementById('dt-btn-realizar');
    if (btnRealizar) btnRealizar.style.display = estadoActual === 'proceso' ? 'inline-flex' : 'none';
});
