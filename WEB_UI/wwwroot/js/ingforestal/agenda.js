/* =====================================================
   agenda.js — Visitas / Agenda | PSA
   Ruta: wwwroot/js/ingforestal/agenda.js
   ===================================================== */

/* ── DATOS DE EJEMPLO (reemplazar con modelo del servidor) ── */
const AG_EVENTOS = [
    { id: 1, fecha: '2026-03-23', hora: '08:00', finca: 'Finca Los Robles',    ubicacion: 'Turrialba, Cartago',        estado: 'pendiente' },
    { id: 2, fecha: '2026-03-25', hora: '10:30', finca: 'Hacienda Verde',      ubicacion: 'Sarapiquí, Heredia',        estado: 'pendiente' },
    { id: 3, fecha: '2026-03-28', hora: '07:00', finca: 'Lote El Pinar',       ubicacion: 'San Ramón, Alajuela',       estado: 'proceso'   },
    { id: 4, fecha: '2026-03-13', hora: '09:00', finca: 'Finca El Cedro',      ubicacion: 'Pérez Zeledón, San José',   estado: 'proceso'   },
    { id: 5, fecha: '2026-03-13', hora: '14:00', finca: 'Parcela Guayabo',     ubicacion: 'Turrialba, Cartago',        estado: 'aprobada'  },
    { id: 6, fecha: '2026-03-05', hora: '08:00', finca: 'Lote Montañés',       ubicacion: 'Tarrazú, San José',         estado: 'aprobada'  },
    { id: 7, fecha: '2026-03-19', hora: '11:00', finca: 'Finca La Esperanza',  ubicacion: 'Acosta, San José',          estado: 'pendiente' },
    { id: 8, fecha: '2026-04-03', hora: '08:30', finca: 'Reserva Los Pinos',   ubicacion: 'Montes de Oro, Puntarenas', estado: 'pendiente' },
    { id: 9, fecha: '2026-04-10', hora: '07:00', finca: 'Hacienda Río Claro',  ubicacion: 'Upala, Alajuela',           estado: 'pendiente' },
];

/* ── ESTADO GLOBAL ────────────────────────────────── */
const AG = {
    hoy:    new Date(),
    año:    new Date().getFullYear(),
    mes:    new Date().getMonth(),   // 0-based
    diaSeleccionado: null,
};

const MESES = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];
const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

/* ── 1. RENDER COMPLETO DEL CALENDARIO ───────────── */
function renderCalendario() {
    actualizarLabelMes();
    renderCeldas();
    // Por defecto seleccionar hoy si está en el mes actual
    const esHoy = AG.año === AG.hoy.getFullYear() && AG.mes === AG.hoy.getMonth();
    const diaInicial = esHoy ? AG.hoy.getDate() : 1;
    seleccionarDia(AG.año, AG.mes, diaInicial, false);
}

function actualizarLabelMes() {
    const el = document.getElementById('ag-mes-label');
    if (el) el.textContent = `${MESES[AG.mes]} ${AG.año}`;
}

function renderCeldas() {
    const wrap = document.getElementById('ag-semanas');
    if (!wrap) return;
    wrap.innerHTML = '';

    const primerDia   = new Date(AG.año, AG.mes, 1).getDay();   // 0=Dom
    const diasEnMes   = new Date(AG.año, AG.mes + 1, 0).getDate();
    const diasMesAnt  = new Date(AG.año, AG.mes, 0).getDate();

    const hoyStr = isoFecha(AG.hoy.getFullYear(), AG.hoy.getMonth(), AG.hoy.getDate());

    let celdas = [];

    // Días del mes anterior (relleno)
    for (let i = primerDia - 1; i >= 0; i--) {
        celdas.push({ dia: diasMesAnt - i, mes: AG.mes - 1, año: AG.año, otroMes: true });
    }
    // Días del mes actual
    for (let d = 1; d <= diasEnMes; d++) {
        celdas.push({ dia: d, mes: AG.mes, año: AG.año, otroMes: false });
    }
    // Relleno siguiente mes
    const restantes = 42 - celdas.length;
    for (let d = 1; d <= restantes; d++) {
        celdas.push({ dia: d, mes: AG.mes + 1, año: AG.año, otroMes: true });
    }

    celdas.forEach(c => {
        const fechaStr  = isoFecha(c.año, c.mes, c.dia);
        const eventos   = AG_EVENTOS.filter(e => e.fecha === fechaStr);
        const esHoyCell = fechaStr === hoyStr;
        const esSel     = AG.diaSeleccionado === fechaStr;

        const celda = document.createElement('div');
        celda.className = 'ag-cal-celda'
            + (c.otroMes              ? ' otro-mes'     : '')
            + (esHoyCell              ? ' hoy'          : '')
            + (esSel                  ? ' seleccionada' : '')
            + (eventos.length > 0     ? ' tiene-eventos': '');
        celda.setAttribute('role', 'button');
        celda.setAttribute('aria-label', `${c.dia} de ${MESES[c.mes]}`);

        // Número del día
        const num = document.createElement('div');
        num.className   = 'ag-cal-num';
        num.textContent = c.dia;
        celda.appendChild(num);

        // Píldoras de eventos (máx. 2 visibles)
        if (eventos.length > 0) {
            const evWrap = document.createElement('div');
            evWrap.className = 'ag-cal-eventos';

            eventos.slice(0, 2).forEach(ev => {
                const pill = document.createElement('div');
                pill.className   = `ag-cal-evento-pill ${ev.estado}`;
                pill.textContent = `${ev.hora} ${ev.finca}`;
                pill.title       = ev.finca;
                evWrap.appendChild(pill);
            });

            if (eventos.length > 2) {
                const mas = document.createElement('div');
                mas.className   = 'ag-cal-evento-mas';
                mas.textContent = `+${eventos.length - 2} más`;
                evWrap.appendChild(mas);
            }
            celda.appendChild(evWrap);
        }

        if (!c.otroMes) {
            celda.addEventListener('click', () => seleccionarDia(c.año, c.mes, c.dia));
        }
        wrap.appendChild(celda);
    });
}

/* ── 2. SELECCIÓN DE DÍA ─────────────────────────── */
function seleccionarDia(año, mes, dia, reRender = true) {
    AG.diaSeleccionado = isoFecha(año, mes, dia);
    if (reRender) renderCeldas();
    renderListaDia();
}

function renderListaDia() {
    const panel = document.getElementById('ag-lista-dia');
    const label = document.getElementById('ag-dia-label');
    if (!panel) return;

    const fecha   = new Date(AG.diaSeleccionado + 'T00:00:00');
    const nombre  = `${DIAS_SEMANA[fecha.getDay()]}, ${fecha.getDate()} de ${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
    if (label) label.textContent = nombre;

    const eventos = AG_EVENTOS
        .filter(e => e.fecha === AG.diaSeleccionado)
        .sort((a, b) => a.hora.localeCompare(b.hora));

    panel.innerHTML = '';

    if (eventos.length === 0) {
        panel.innerHTML = `
            <div class="ag-dia-vacio">
                <div class="ag-dia-vacio-icon">📅</div>
                <p>Sin visitas programadas para este día.</p>
            </div>`;
        return;
    }

    eventos.forEach(ev => {
        const item = document.createElement('div');
        item.className = 'ag-lista-item';
        item.innerHTML = `
            <div class="ag-lista-hora">${ev.hora}</div>
            <div class="ag-lista-info">
                <div class="ag-lista-nombre">${ev.finca}</div>
                <div class="ag-lista-sub">
                    <i class="fa-solid fa-location-dot"></i> ${ev.ubicacion}
                </div>
                <div style="margin-top:4px;">
                    <span class="chip chip-${ev.estado}">${etiquetaEstado(ev.estado)}</span>
                </div>
            </div>
            <div class="ag-lista-acciones">
                <button class="btn-icon" title="Ver detalle" onclick="verDetalle(${ev.id})">
                    <i class="fa-solid fa-eye"></i>
                </button>
                ${ev.estado === 'proceso' ? `
                <button class="btn-icon" title="Realizar visita" onclick="realizarVisita(${ev.id})">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>` : ''}
            </div>`;
        panel.appendChild(item);
    });
}

/* ── 3. NAVEGACIÓN MES ───────────────────────────── */
function mesAnterior() {
    AG.mes--;
    if (AG.mes < 0) { AG.mes = 11; AG.año--; }
    renderCalendario();
}

function mesSiguiente() {
    AG.mes++;
    if (AG.mes > 11) { AG.mes = 0; AG.año++; }
    renderCalendario();
}

function irHoy() {
    AG.año = AG.hoy.getFullYear();
    AG.mes = AG.hoy.getMonth();
    renderCalendario();
}

/* ── 4. NAVEGACIÓN ───────────────────────────────── */
function verDetalle(id) {
    if (!id || isNaN(id)) { mostrarToastAG('ID inválido.', true); return; }
    window.location.href = `/IngForestal/Detalle?id=${encodeURIComponent(id)}`;
}

function realizarVisita(id) {
    if (!id || isNaN(id)) { mostrarToastAG('ID inválido.', true); return; }
    window.location.href = `/IngForestal/Realizar?id=${encodeURIComponent(id)}`;
}

function programarVisita() {
    window.location.href = '/IngForestal/Programar';
}

/* ── 5. HELPERS ──────────────────────────────────── */
function isoFecha(año, mes, dia) {
    const m = String(mes + 1).padStart(2, '0');   // mes 0-based → 1-based
    const d = String(dia).padStart(2, '0');
    return `${año}-${m}-${d}`;
}

function etiquetaEstado(estado) {
    const mapa = { pendiente: 'Pendiente', proceso: 'En Proceso', aprobada: 'Aprobada', rechazada: 'Rechazada' };
    return mapa[estado] || estado;
}

/* ── 6. TOAST ────────────────────────────────────── */
function mostrarToastAG(mensaje, esError = false) {
    const toast   = document.getElementById('ag-toast');
    const msgSpan = document.getElementById('ag-toast-msg');
    if (!toast || !mensaje) return;
    msgSpan.textContent = mensaje;
    toast.classList.toggle('error', esError);
    toast.classList.add('visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('visible'), 3500);
}

/* ── 7. INIT ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    renderCalendario();
});
