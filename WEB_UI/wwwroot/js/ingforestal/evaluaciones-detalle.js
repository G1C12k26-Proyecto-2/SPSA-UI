/* =====================================================
   evaluaciones-detalle.js — Evaluaciones / Detalle | PSA
   Ruta: wwwroot/js/ingforestal/evaluaciones-detalle.js
   ===================================================== */

/* ═══════════════════════════════════════════════════
   1. MODAL CAMBIO DE ESTADO
═══════════════════════════════════════════════════ */
function edAbrirModal() {
    edLimpiarModal();
    document.getElementById('ed-modal-overlay')?.classList.add('activo');
    document.addEventListener('keydown', edModalEsc);
    document.getElementById('ed-nuevo-estado')?.focus();
}

function edCerrarModal() {
    document.getElementById('ed-modal-overlay')?.classList.remove('activo');
    document.removeEventListener('keydown', edModalEsc);
    document.getElementById('ed-form-estado')?.reset();
    edLimpiarModal();
}

function edModalEsc(e) { if (e.key === 'Escape') edCerrarModal(); }

function edLimpiarModal() {
    ['ed-nuevo-estado','ed-motivo'].forEach(id => {
        document.getElementById(id)?.classList.remove('invalido');
        document.getElementById(`${id}-err`)?.classList.remove('visible');
    });
    document.getElementById('ed-wrap-motivo').style.display = 'none';
}

/* ── Mostrar motivo solo al rechazar ── */
function edOnEstadoCambio() {
    const val        = document.getElementById('ed-nuevo-estado')?.value || '';
    const wrapMotivo = document.getElementById('ed-wrap-motivo');
    if (!wrapMotivo) return;

    wrapMotivo.style.display = val ? 'block' : 'none';

    const lbl = wrapMotivo.querySelector('label');
    if (lbl) {
        lbl.innerHTML = val === 'rechazada'
            ? 'Motivo del rechazo <span class="req">*</span>'
            : 'Observación <span style="font-weight:400;text-transform:none;">(opcional)</span>';
    }

    // Limpiar error anterior
    if (document.getElementById('ed-nuevo-estado')?.classList.contains('invalido')) {
        edValidarCampoModal('ed-nuevo-estado');
    }
}

/* ═══════════════════════════════════════════════════
   2. VALIDACIÓN DEL MODAL
═══════════════════════════════════════════════════ */
function edValidarCampoModal(id) {
    const el  = document.getElementById(id);
    const err = document.getElementById(`${id}-err`);
    if (!el) return true;

    const val    = el.value.trim();
    const estado = document.getElementById('ed-nuevo-estado')?.value || '';
    let ok = true;

    if (id === 'ed-nuevo-estado' && !val)                           ok = false;
    if (id === 'ed-motivo' && estado === 'rechazada' && val.length < 10) ok = false;

    el.classList.toggle('invalido', !ok);
    if (err) err.classList.toggle('visible', !ok);
    return ok;
}

function edValidarModal() {
    const okEst = edValidarCampoModal('ed-nuevo-estado');
    const okMot = edValidarCampoModal('ed-motivo');
    if (!okEst || !okMot) {
        edToast('Corrija los campos marcados antes de continuar.', true);
        return false;
    }
    return true;
}

/* ═══════════════════════════════════════════════════
   3. GUARDAR CAMBIO DE ESTADO
═══════════════════════════════════════════════════ */
function edGuardarEstado() {
    if (!edValidarModal()) return;

    const nuevoEstado = document.getElementById('ed-nuevo-estado').value;
    const motivo      = document.getElementById('ed-motivo').value.trim();
    const id          = edGetId();

    /* === Conectar al backend en producción ===
    const token = document.querySelector('input[name="__RequestVerificationToken"]').value;
    fetch('/IngForestal/Evaluaciones/CambiarEstado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'RequestVerificationToken': token },
        body: JSON.stringify({ id, nuevoEstado, motivo })
    })
    .then(r => r.json())
    .then(data => {
        if (data.exito) {
            edCerrarModal();
            edActualizarEstado(nuevoEstado);
            edToast('Estado actualizado correctamente.');
        } else {
            edToast(data.mensaje || 'Error al actualizar.', true);
        }
    })
    .catch(() => edToast('Error de conexión.', true));
    */

    // Simulación frontend
    edCerrarModal();
    edActualizarEstado(nuevoEstado);
    edToast('✅ Estado actualizado correctamente.');
}

/* ── Actualiza chips y aside sin recargar ── */
function edActualizarEstado(estado) {
    const mapa = {
        pendiente:  { clase:'chip-pendiente', texto:'Pendiente',  icono:'fa-hourglass-half' },
        proceso:    { clase:'chip-proceso',   texto:'En Proceso', icono:'fa-spinner'        },
        aprobada:   { clase:'chip-aprobada',  texto:'Aprobada',   icono:'fa-circle-check'   },
        rechazada:  { clase:'chip-rechazada', texto:'Rechazada',  icono:'fa-circle-xmark'   },
    };
    const info = mapa[estado];
    if (!info) return;

    // Chips del header
    document.querySelectorAll('.ed-chip-estado').forEach(el => {
        el.className = `chip ${info.clase} ed-chip-estado`;
        el.innerHTML = `● ${info.texto}`;
    });

    // Aside: estado grande
    const grande = document.getElementById('ed-estado-grande');
    if (grande) {
        grande.innerHTML = `<i class="fa-solid ${info.icono}"></i> ${info.texto}`;
    }

    // Mostrar/ocultar botón "Realizar visita"
    const btnRealizar = document.getElementById('ed-btn-realizar');
    if (btnRealizar) {
        btnRealizar.style.display = estado === 'proceso' ? 'flex' : 'none';
    }

    // Mostrar/ocultar botón "Editar"
    const btnEditar = document.getElementById('ed-btn-editar');
    if (btnEditar) {
        btnEditar.style.display = (estado === 'pendiente' || estado === 'proceso') ? 'flex' : 'none';
    }
}

/* ═══════════════════════════════════════════════════
   4. NAVEGACIÓN
═══════════════════════════════════════════════════ */
function edEditar() {
    const id = edGetId();
    window.location.href = `/IngForestal/EvaluacionesEditar?id=${encodeURIComponent(id)}`;
}

function edRealizar() {
    const id = edGetId();
    window.location.href = `/IngForestal/Realizar?id=${encodeURIComponent(id)}`;
}

function edGetId() {
    return new URLSearchParams(window.location.search).get('id') || '0';
}

/* ═══════════════════════════════════════════════════
   5. TOAST
═══════════════════════════════════════════════════ */
function edToast(msg, err = false) {
    const t = document.getElementById('ed-toast');
    const s = document.getElementById('ed-toast-msg');
    if (!t || !msg) return;
    s.textContent = msg;
    t.classList.toggle('error', err);
    t.classList.add('visible');
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('visible'), 3500);
}

/* ═══════════════════════════════════════════════════
   6. INIT
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

    // Cerrar modal al hacer clic fuera
    document.getElementById('ed-modal-overlay')?.addEventListener('click', e => {
        if (e.target.id === 'ed-modal-overlay') edCerrarModal();
    });

    // Validación en tiempo real del modal
    document.getElementById('ed-nuevo-estado')?.addEventListener('change', () => {
        edOnEstadoCambio();
        edValidarCampoModal('ed-nuevo-estado');
    });
    document.getElementById('ed-motivo')?.addEventListener('blur', () => edValidarCampoModal('ed-motivo'));
    document.getElementById('ed-motivo')?.addEventListener('input', () => {
        if (document.getElementById('ed-motivo')?.classList.contains('invalido')) {
            edValidarCampoModal('ed-motivo');
        }
    });

    // Estado inicial de botones según estado actual
    const estadoActual = document.getElementById('ed-estado-actual')?.value || '';
    const btnRealizar  = document.getElementById('ed-btn-realizar');
    const btnEditar    = document.getElementById('ed-btn-editar');

    if (btnRealizar) btnRealizar.style.display = estadoActual === 'proceso'   ? 'flex' : 'none';
    if (btnEditar)   btnEditar.style.display   = (estadoActual === 'pendiente' || estadoActual === 'proceso') ? 'flex' : 'none';
});
