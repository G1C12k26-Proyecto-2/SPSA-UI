/* =====================================================
   realizar.js — Realizar Visita Técnica | Ingeniero Forestal
   Ruta: wwwroot/js/ingforestal/realizar.js
   ===================================================== */

//const API_URL = "https://spsaapi.azurewebsites.net";
const API_URL = "https://localhost:44392";  // Para desarrollo local

// Estado global
const RL = {
    idSolicitud: null,
    datosSolicitud: null,
    parametros: null,
    decision: null,
    fotosNuevas: [],
    valoresOriginales: {},
    camposModif: new Set()
};

/* ═══════════════════════════════════════════════════
   1. CARGA INICIAL DESDE EL BACKEND
═══════════════════════════════════════════════════ */
async function cargarDatosIniciales() {
    mostrarLoading(true);

    try {
        // Obtener ID de la URL
        const urlParams = new URLSearchParams(window.location.search);
        RL.idSolicitud = parseInt(urlParams.get('id'));

        if (!RL.idSolicitud || isNaN(RL.idSolicitud)) {
            mostrarToast('ID de solicitud no válido', true);
            setTimeout(() => window.location.href = '/IngForestal/Index', 2000);
            return;
        }

        // Cargar datos en paralelo
        const [solicitudResponse, parametrosResponse] = await Promise.all([
            fetch(`${API_URL}/api/Ingeniero/realizar-visita/${RL.idSolicitud}`),
            fetch(`${API_URL}/api/Ingeniero/realizar-visita/parametros`)
        ]);

        const solicitudData = await solicitudResponse.json();
        const parametrosData = await parametrosResponse.json();

        if (solicitudData.result === "SUCCESS" && solicitudData.data) {
            RL.datosSolicitud = solicitudData.data;
            renderizarDatosSolicitud();
        } else {
            mostrarToast('Error al cargar la solicitud', true);
            return;
        }

        if (parametrosData.result === "SUCCESS" && parametrosData.data) {
            RL.parametros = parametrosData.data;
            renderizarParametros();
        } else {
            mostrarToast('Error al cargar parámetros de configuración', true);
        }

        // Configurar event listeners después de renderizar
        configurarEventListeners();

        // Si ya hay datos verificados previos, cargarlos
        if (RL.datosSolicitud.hectareasVerificadas) {
            cargarDatosExistentes();
        }

        actualizarProgreso();

    } catch (error) {
        console.error('Error cargando datos:', error);
        mostrarToast('Error de conexión con el servidor', true);
    } finally {
        mostrarLoading(false);
    }
}

/* ═══════════════════════════════════════════════════
   2. RENDERIZADO DE DATOS DINÁMICOS
═══════════════════════════════════════════════════ */
function renderizarDatosSolicitud() {
    const data = RL.datosSolicitud;

    // Actualizar alerta de contexto
    document.getElementById('rl-finca-nombre').textContent = data.nombreFinca || '';
    document.getElementById('rl-propietario').textContent = data.propietario || '';
    document.getElementById('rl-ubicacion').textContent = `${data.provincia || ''}, ${data.canton || ''}, ${data.distrito || ''}`.replace(/^, |, $/g, '');
    document.getElementById('rl-fecha-programada').textContent = data.fechaVisitaProgramada ? formatFecha(data.fechaVisitaProgramada) : 'No programada';
    document.getElementById('rl-hora-programada').textContent = data.horaInicioVisita || '00:00';
    document.getElementById('rl-estado').textContent = data.estado || 'Pendiente';

    // Guardar valores originales
    RL.valoresOriginales = {
        hectareas: data.hectareasOriginal || 0,
        vegetacion: data.tipoVegetacionOriginal || '',
        pendiente: data.pendienteOriginal || '',
        recursos: obtenerRecursoOriginal(data),
        usoSuelo: data.usoSueloOriginal || ''
    };

    // Pre-cargar valores en inputs
    const haInput = document.getElementById('rl-hectareas');
    if (haInput) {
        haInput.value = data.hectareasOriginal || '';
        haInput.dataset.original = data.hectareasOriginal || '';
    }
}

function obtenerRecursoOriginal(data) {
    if (data.tieneRiosQuebradasOriginal && data.cantidadNacientesOriginal > 0) return 'rio-naciente';
    if (data.tieneRiosQuebradasOriginal) return 'quebrada';
    if (data.cantidadNacientesOriginal > 0) return 'naciente';
    return 'ninguno';
}

function renderizarParametros() {
    // Renderizar Tipo de Vegetación
    const vegetacionSelect = document.getElementById('rl-vegetacion');
    if (vegetacionSelect && RL.parametros.ajustesVegetacion) {
        vegetacionSelect.innerHTML = '<option value="">Seleccione...</option>';
        Object.keys(RL.parametros.ajustesVegetacion).forEach(clave => {
            const texto = formatearClave(clave);
            const option = document.createElement('option');
            option.value = clave;
            option.textContent = texto;
            if (RL.valoresOriginales.vegetacion === clave) {
                option.selected = true;
            }
            vegetacionSelect.appendChild(option);
        });
    }

    // Renderizar Pendiente
    const pendienteSelect = document.getElementById('rl-pendiente');
    if (pendienteSelect && RL.parametros.ajustesPendiente) {
        pendienteSelect.innerHTML = '<option value="">Seleccione...</option>';
        Object.keys(RL.parametros.ajustesPendiente).forEach(clave => {
            const texto = formatearClave(clave);
            const option = document.createElement('option');
            option.value = clave;
            option.textContent = texto;
            if (RL.valoresOriginales.pendiente === clave) {
                option.selected = true;
            }
            pendienteSelect.appendChild(option);
        });
    }

    // Recursos hídricos (fijos, no vienen de parámetros)
    const recursosSelect = document.getElementById('rl-recursos');
    if (recursosSelect && RL.valoresOriginales.recursos) {
        recursosSelect.value = RL.valoresOriginales.recursos;
    }

    // Uso de suelo
    const usoSueloSelect = document.getElementById('rl-uso-suelo');
    if (usoSueloSelect && RL.valoresOriginales.usoSuelo) {
        const valorMapeado = mapearUsoSueloReverse(RL.valoresOriginales.usoSuelo);
        if (valorMapeado) usoSueloSelect.value = valorMapeado;
    }
}

function formatearClave(clave) {
    return clave.replace(/_/g, ' ').toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function mapearUsoSueloReverse(valorBackend) {
    const mapa = {
        'Conservación': 'conservacion',
        'Ganadería': 'agropecuario',
        'Agricultura': 'agropecuario',
        'Mixto': 'mixto'
    };
    return mapa[valorBackend] || 'conservacion';
}

/* ═══════════════════════════════════════════════════
   3. CONFIGURAR EVENT LISTENERS
═══════════════════════════════════════════════════ */
function configurarEventListeners() {
    // Campos de fecha/hora
    const fechaInput = document.getElementById('rl-fecha-visita');
    const horaInput = document.getElementById('rl-hora-visita');
    if (fechaInput) fechaInput.max = new Date().toISOString().split('T')[0];
    if (fechaInput) fechaInput.addEventListener('change', () => validarCampo('rl-fecha-visita'));
    if (horaInput) horaInput.addEventListener('change', () => validarCampo('rl-hora-visita'));

    // Campos de datos de campo
    const campos = ['rl-hectareas', 'rl-vegetacion', 'rl-pendiente', 'rl-recursos', 'rl-observaciones'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                validarCampo(id);
                onCampoChange(id);
            });
            el.addEventListener('input', () => {
                if (document.getElementById(id)?.classList.contains('invalido')) validarCampo(id);
                onCampoChange(id);
            });
        }
    });

    // Recursos hídricos - mostrar campo de nacientes
    const recursoSelect = document.getElementById('rl-recursos');
    const nacientesField = document.getElementById('rl-field-nacientes');
    if (recursoSelect) {
        recursoSelect.addEventListener('change', () => {
            const showNacientes = recursoSelect.value === 'NACIENTES';
            if (nacientesField) nacientesField.style.display = showNacientes ? 'block' : 'none';
            validarCampo('rl-recursos');
            actualizarProgreso();
            onCampoChange('rl-recursos');
        });
        // Trigger inicial
        if (recursoSelect.value === 'NACIENTES' && nacientesField) {
            nacientesField.style.display = 'block';
        }
    }

    // Botones de decisión
    const btnAprobar = document.getElementById('rl-btn-aprobar');
    const btnRechazar = document.getElementById('rl-btn-rechazar');
    if (btnAprobar) btnAprobar.addEventListener('click', () => seleccionarDecision('Aprobado'));
    if (btnRechazar) btnRechazar.addEventListener('click', () => seleccionarDecision('Rechazado'));

    // Upload de fotos
    const uploadZona = document.getElementById('rl-upload-zona');
    const inputFotos = document.getElementById('rl-input-fotos');
    if (uploadZona && inputFotos) {
        uploadZona.addEventListener('click', () => inputFotos.click());
        inputFotos.addEventListener('change', onFotosSeleccionadas);
        setupDragAndDrop(uploadZona);
    }

    // Validación de motivo de rechazo
    const motivoRechazo = document.getElementById('rl-motivo-rechazo');
    if (motivoRechazo) {
        motivoRechazo.addEventListener('input', () => validarCampo('rl-motivo-rechazo'));
    }
}

/* ═══════════════════════════════════════════════════
   4. CAMPOS MODIFICADOS
═══════════════════════════════════════════════════ */
function onCampoChange(id) {
    const el = document.getElementById(id);
    if (!el) return;

    let original = '';
    switch (id) {
        case 'rl-hectareas': original = RL.valoresOriginales.hectareas?.toString() || ''; break;
        case 'rl-vegetacion': original = RL.valoresOriginales.vegetacion || ''; break;
        case 'rl-pendiente': original = RL.valoresOriginales.pendiente || ''; break;
        case 'rl-recursos': original = RL.valoresOriginales.recursos || ''; break;
        default: return;
    }

    const actual = el.value;

    if (actual !== original && actual !== '') {
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
}

function mostrarOriginal(id, valorOrig) {
    const tag = document.getElementById(`${id}-orig`);
    if (tag && valorOrig) {
        let displayValue = valorOrig;
        if (id === 'rl-vegetacion') displayValue = formatearClave(valorOrig);
        if (id === 'rl-pendiente') displayValue = formatearClave(valorOrig);
        if (id === 'rl-recursos') displayValue = formatearRecurso(valorOrig);
        tag.textContent = `Original: ${displayValue}`;
        tag.style.display = 'inline-flex';
    }
}

function formatearRecurso(valor) {
    const mapa = {
        'quebrada': 'Quebrada',
        'rio': 'Río',
        'naciente': 'Naciente',
        'rio-naciente': 'Río y naciente',
        'ninguno': 'Ninguno'
    };
    return mapa[valor] || valor;
}

function ocultarOriginal(id) {
    const tag = document.getElementById(`${id}-orig`);
    if (tag) tag.style.display = 'none';
}

function actualizarBadgeCambios() {
    const badge = document.getElementById('rl-badge-cambios');
    const n = RL.camposModif.size;
    if (badge) {
        badge.innerHTML = `<i class="fas fa-pen"></i> ${n} cambio${n !== 1 ? 's' : ''}`;
    }
}

/* ═══════════════════════════════════════════════════
   5. VALIDACIÓN
═══════════════════════════════════════════════════ */
function validarCampo(id) {
    const el = document.getElementById(id);
    const err = document.getElementById(`${id}-err`);
    if (!el) return true;

    let ok = true;
    const val = el.value.trim();

    switch (id) {
        case 'rl-fecha-visita':
            ok = val !== '';
            break;
        case 'rl-hora-visita':
            ok = val !== '';
            break;
        case 'rl-hectareas':
            const num = parseFloat(val);
            ok = !isNaN(num) && num > 0;
            break;
        case 'rl-vegetacion':
        case 'rl-pendiente':
        case 'rl-recursos':
            ok = val !== '';
            break;
        case 'rl-observaciones':
            ok = val.length >= 20;
            break;
        case 'rl-motivo-rechazo':
            if (RL.decision === 'Rechazado') {
                ok = val.length >= 15;
            } else {
                ok = true;
            }
            break;
        default:
            return true;
    }

    if (err) err.classList.toggle('visible', !ok);
    if (el) el.classList.toggle('invalido', !ok);
    return ok;
}

function validarTodo() {
    const camposBasicos = ['rl-fecha-visita', 'rl-hora-visita', 'rl-hectareas', 'rl-vegetacion', 'rl-pendiente', 'rl-recursos', 'rl-observaciones'];
    let ok = camposBasicos.every(id => validarCampo(id));

    if (RL.decision === 'Rechazado') {
        ok = ok && validarCampo('rl-motivo-rechazo');
    }

    const okDecision = RL.decision !== null;
    const decisionErr = document.getElementById('rl-decision-err');
    if (decisionErr) decisionErr.classList.toggle('visible', !okDecision);
    ok = ok && okDecision;

    if (!ok) mostrarToast('Corrija los campos marcados en rojo antes de guardar.', true);
    return ok;
}

/* ═══════════════════════════════════════════════════
   6. DECISIÓN FINAL
═══════════════════════════════════════════════════ */
function seleccionarDecision(valor) {
    RL.decision = valor;
    document.getElementById('rl-califica-pago').value = valor;

    const btnAprobar = document.getElementById('rl-btn-aprobar');
    const btnRechazar = document.getElementById('rl-btn-rechazar');
    const wrapMotivo = document.getElementById('rl-wrap-motivo');

    if (btnAprobar) btnAprobar.classList.toggle('seleccionado', valor === 'Aprobado');
    if (btnRechazar) btnRechazar.classList.toggle('seleccionado', valor === 'Rechazado');
    if (wrapMotivo) wrapMotivo.style.display = valor === 'Rechazado' ? 'block' : 'none';

    const decisionErr = document.getElementById('rl-decision-err');
    if (decisionErr) decisionErr.classList.remove('visible');

    if (valor === 'Rechazado') {
        validarCampo('rl-motivo-rechazo');
    }

    actualizarProgreso();
}

/* ═══════════════════════════════════════════════════
   7. FOTOS - UPLOAD Y PREVIEW
═══════════════════════════════════════════════════ */
function onFotosSeleccionadas(event) {
    const archivos = Array.from(event.target.files || []);
    const validos = archivos.filter(f => f.type.startsWith('image/'));

    if (validos.length !== archivos.length) {
        mostrarToast('Solo se permiten archivos de imagen (JPG, PNG, WEBP).', true);
    }

    const disponibles = 8 - RL.fotosNuevas.length;
    const aCargar = validos.slice(0, disponibles);

    if (validos.length > disponibles) {
        mostrarToast(`Máximo 8 fotos. Se agregarán solo las primeras ${disponibles}.`, true);
    }

    aCargar.forEach(file => {
        RL.fotosNuevas.push(file);
        agregarThumbFoto(file, RL.fotosNuevas.length - 1);
    });

    actualizarProgreso();
    event.target.value = '';
}

function agregarThumbFoto(file, idx) {
    const grid = document.getElementById('rl-fotos-preview');
    if (!grid) return;

    const thumb = document.createElement('div');
    thumb.className = 'rl-foto-thumb';
    thumb.id = `rl-thumb-${idx}`;

    const reader = new FileReader();
    reader.onload = (e) => {
        thumb.innerHTML = `
            <img src="${e.target.result}" alt="Foto ${idx + 1}">
            <button class="rl-foto-remove" type="button" onclick="removerFoto(${idx})" title="Eliminar foto">
                <i class="fa-solid fa-xmark"></i>
            </button>`;
    };
    reader.readAsDataURL(file);
    grid.appendChild(thumb);
}

function removerFoto(idx) {
    RL.fotosNuevas.splice(idx, 1);
    document.getElementById(`rl-thumb-${idx}`)?.remove();
    // Re-indexar
    document.querySelectorAll('.rl-foto-thumb').forEach((t, i) => {
        t.id = `rl-thumb-${i}`;
        const btn = t.querySelector('.rl-foto-remove');
        if (btn) btn.setAttribute('onclick', `removerFoto(${i})`);
    });
    actualizarProgreso();
}

function setupDragAndDrop(zona) {
    zona.addEventListener('dragover', (e) => {
        e.preventDefault();
        zona.classList.add('drag-over');
    });
    zona.addEventListener('dragleave', () => {
        zona.classList.remove('drag-over');
    });
    zona.addEventListener('drop', (e) => {
        e.preventDefault();
        zona.classList.remove('drag-over');
        const fakeEvt = { target: { files: e.dataTransfer.files }, value: '' };
        onFotosSeleccionadas(fakeEvt);
    });
}

/* ═══════════════════════════════════════════════════
   8. PROGRESO
═══════════════════════════════════════════════════ */
function actualizarProgreso() {
    const checks = [
        !!document.getElementById('rl-fecha-visita')?.value,
        !!document.getElementById('rl-hora-visita')?.value,
        parseFloat(document.getElementById('rl-hectareas')?.value) > 0,
        !!document.getElementById('rl-vegetacion')?.value,
        !!document.getElementById('rl-pendiente')?.value,
        !!document.getElementById('rl-recursos')?.value,
        (document.getElementById('rl-observaciones')?.value.length || 0) >= 20,
        RL.decision !== null,
        RL.fotosNuevas.length > 0
    ];

    const completados = checks.filter(Boolean).length;
    const total = checks.length;
    const pct = Math.round((completados / total) * 100);

    const pctEl = document.getElementById('rl-progreso-pct');
    const bar = document.getElementById('rl-progreso-bar');
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (bar) bar.style.width = `${pct}%`;

    // Actualizar checks individuales
    const checkIds = ['datos', 'vegetacion', 'pendiente', 'recursos', 'observ', 'decision', 'fotos'];
    checks.forEach((ok, i) => {
        const dot = document.getElementById(`chk-${checkIds[i]}-dot`);
        const row = document.getElementById(`chk-${checkIds[i]}-row`);
        if (dot) {
            dot.className = `rl-check-dot${ok ? ' ok' : ''}`;
            if (ok) dot.innerHTML = '<i class="fa-solid fa-check"></i>';
            else dot.innerHTML = '';
        }
        if (row && ok) row.classList.add('completado');
        else if (row) row.classList.remove('completado');
    });
}

/* ═══════════════════════════════════════════════════
   9. GUARDAR EVALUACIÓN
═══════════════════════════════════════════════════ */
async function guardarEvaluacion() {
    if (!validarTodo()) return;

    mostrarLoading(true);

    // Construir request DTO
    const request = {
        idSolicitud: RL.idSolicitud,
        hectareasVerificadas: parseFloat(document.getElementById('rl-hectareas')?.value) || 0,
        tipoVegetacionVerificado: document.getElementById('rl-vegetacion')?.value || '',
        pendienteVerificada: document.getElementById('rl-pendiente')?.value || '',
        recursoHidricoVerificado: document.getElementById('rl-recursos')?.value || '',
        cantidadNacientesVerificado: parseInt(document.getElementById('rl-cantidad-nacientes')?.value) || 0,
        usoSueloVerificado: mapearUsoSuelo(document.getElementById('rl-uso-suelo')?.value),
        fechaVisitaReal: document.getElementById('rl-fecha-visita')?.value
            ? new Date(document.getElementById('rl-fecha-visita').value).toISOString()
            : null,
        horaInicioReal: document.getElementById('rl-hora-visita')?.value || null,
        observacionesTecnicas: document.getElementById('rl-observaciones')?.value || null,
        calificaParaPago: RL.decision,
        razonRechazo: RL.decision === 'Rechazado'
            ? document.getElementById('rl-motivo-rechazo')?.value || ''
            : '',
        fotosCampo: await convertirFotosABase64()
    };

    try {
        const response = await fetch(`${API_URL}/api/Ingeniero/realizar-visita/guardar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
        });

        const result = await response.json();

        if (result.result === "SUCCESS") {
            mostrarToast(result.message || '✅ Evaluación guardada exitosamente');
            setTimeout(() => {
                window.location.href = `/IngForestal/Detalle?id=${RL.idSolicitud}`;
            }, 2000);
        } else {
            mostrarToast(result.message || 'Error al guardar la evaluación', true);
        }
    } catch (error) {
        console.error('Error guardando:', error);
        mostrarToast('Error de conexión con el servidor', true);
    } finally {
        mostrarLoading(false);
    }
}

function mapearUsoSuelo(valorFront) {
    const mapa = {
        'conservacion': 'Conservación',
        'agropecuario': 'Ganadería',
        'mixto': 'Mixto',
        'sin-uso': 'Sin uso definido'
    };
    return mapa[valorFront] || '';
}

async function convertirFotosABase64() {
    const fotosBase64 = [];
    for (const file of RL.fotosNuevas) {
        const base64 = await fileToBase64(file);
        fotosBase64.push({
            nombreArchivo: file.name,
            base64Content: base64.split(',')[1],
            tipoArchivo: file.type
        });
    }
    return fotosBase64;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/* ═══════════════════════════════════════════════════
   10. FUNCIONES AUXILIARES
═══════════════════════════════════════════════════ */
function cargarDatosExistentes() {
    const data = RL.datosSolicitud;
    if (data.hectareasVerificadas) {
        document.getElementById('rl-hectareas').value = data.hectareasVerificadas;
    }
    if (data.tipoVegetacionVerificado) {
        document.getElementById('rl-vegetacion').value = data.tipoVegetacionVerificado;
    }
    if (data.pendienteVerificada) {
        document.getElementById('rl-pendiente').value = data.pendienteVerificada;
    }
    if (data.fechaVisitaReal) {
        const fecha = new Date(data.fechaVisitaReal);
        document.getElementById('rl-fecha-visita').value = fecha.toISOString().split('T')[0];
    }
    if (data.horaInicioReal) {
        document.getElementById('rl-hora-visita').value = data.horaInicioReal.substring(0, 5);
    }
    if (data.observacionesTecnicas) {
        document.getElementById('rl-observaciones').value = data.observacionesTecnicas;
    }
    if (data.calificaParaPago === true) {
        seleccionarDecision('Aprobado');
    } else if (data.calificaParaPago === false) {
        seleccionarDecision('Rechazado');
        if (data.razonRechazo) {
            document.getElementById('rl-motivo-rechazo').value = data.razonRechazo;
        }
    }
}

function formatFecha(fecha) {
    if (!fecha) return '';
    const date = new Date(fecha);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

function mostrarLoading(mostrar) {
    let loader = document.getElementById('global-loader');
    if (!loader && mostrar) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;`;
        loader.innerHTML = `<div style="background: white; padding: 20px 30px; border-radius: 12px; display: flex; gap: 12px; align-items: center;"><i class="fas fa-spinner fa-spin" style="font-size: 24px; color: var(--psa-leaf);"></i><span>Cargando...</span></div>`;
        document.body.appendChild(loader);
    } else if (loader && !mostrar) {
        loader.remove();
    }
}

function mostrarToast(mensaje, esError = false) {
    const toast = document.getElementById('rl-toast');
    const msgSpan = document.getElementById('rl-toast-msg');
    if (!toast || !msgSpan) return;
    msgSpan.textContent = mensaje;
    toast.classList.toggle('error', esError);
    toast.classList.add('visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('visible'), 3500);
}

/* ═══════════════════════════════════════════════════
   11. INICIALIZACIÓN
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    cargarDatosIniciales();

    // Botón guardar
    const btnGuardar = document.getElementById('rl-btn-guardar');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarEvaluacion);
    }

    // Cerrar modal con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modalProceso');
            if (modal && modal.style.display === 'flex') cerrarModal();
        }
    });
});