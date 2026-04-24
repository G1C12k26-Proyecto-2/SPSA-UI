/* =====================================================
   agenda.js — Visitas / Agenda | PSA
   Versión con Grid layout
   ===================================================== */

const API_URL = "https://localhost:44392";

const AG = {
    hoy: new Date(),
    año: new Date().getFullYear(),
    mes: new Date().getMonth(),
    diaSeleccionado: null,
    eventos: [],
    ingenieroId: null
};

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function obtenerIngenieroId() {
    let id = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (!id) {
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                id = user.id;
            } catch (e) { }
        }
    }
    return id ? parseInt(id) : 1;
}

async function cargarAgenda() {
    try {
        AG.ingenieroId = obtenerIngenieroId();
        const response = await fetch(`${API_URL}/api/Ingeniero/agenda/${AG.ingenieroId}?anio=${AG.año}&mes=${AG.mes + 1}`);
        const data = await response.json();

        if (data.result === "SUCCESS") {
            AG.eventos = data.data.eventosMes || [];

            if (AG.diaSeleccionado === null) {
                AG.diaSeleccionado = 1;
            }

            renderCalendario();
            cargarVisitasDia(AG.diaSeleccionado);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderCalendario() {
    document.getElementById('ag-mes-label').textContent = `${MESES[AG.mes]} ${AG.año}`;

    const primerDia = new Date(AG.año, AG.mes, 1).getDay();
    const diasEnMes = new Date(AG.año, AG.mes + 1, 0).getDate();
    const diasMesAnt = new Date(AG.año, AG.mes, 0).getDate();

    let celdas = [];

    // Días del mes anterior
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

    const semanasContainer = document.getElementById('ag-semanas');
    semanasContainer.innerHTML = '';

    for (let i = 0; i < celdas.length; i += 7) {
        const fila = document.createElement('div');
        fila.style.display = 'grid';
        fila.style.gridTemplateColumns = 'repeat(7, 1fr)';
        fila.style.gap = '6px';
        fila.style.marginBottom = '6px';

        for (let j = i; j < i + 7; j++) {
            const c = celdas[j];
            const fechaStr = `${c.año}-${String(c.mes + 1).padStart(2, '0')}-${String(c.dia).padStart(2, '0')}`;
            const eventos = AG.eventos.filter(e => e.fechaVisita?.split('T')[0] === fechaStr);

            // SOLO marcar como hoy si es el día actual Y estamos en el mes/año actual
            const esHoy = (c.año === AG.hoy.getFullYear() &&
                c.mes === AG.hoy.getMonth() &&
                c.dia === AG.hoy.getDate() &&
                !c.otroMes);

            // SOLO marcar como seleccionado si es el día seleccionado Y NO es otro mes
            const esSel = (AG.diaSeleccionado === c.dia && !c.otroMes);

            const celda = document.createElement('div');
            celda.style.background = '#fff';
            celda.style.border = '1px solid #e2e8f0';
            celda.style.borderRadius = '8px';
            celda.style.padding = '8px 6px';
            celda.style.height = '90px';
            celda.style.minHeight = '90px';
            celda.style.cursor = 'pointer';
            celda.style.display = 'flex';
            celda.style.flexDirection = 'column';
            celda.style.overflow = 'hidden';

            if (c.otroMes) {
                celda.style.background = '#f8faf8';
                celda.style.opacity = '0.6';
            }
            if (esHoy) {
                celda.style.border = '2px solid #2d8653';
                celda.style.background = '#e8f5ee';
            }
            if (esSel) {
                celda.style.background = '#d4edda';
                celda.style.border = '2px solid #2d8653';
            }

            // Número del día
            const numSpan = document.createElement('span');
            numSpan.style.fontWeight = 'bold';
            numSpan.style.fontSize = '0.8rem';
            numSpan.style.display = 'inline-block';
            numSpan.style.background = esHoy ? '#2d8653' : '#e8f5ee';
            numSpan.style.color = esHoy ? '#fff' : '#0d2b1a';
            numSpan.style.padding = '2px 8px';
            numSpan.style.borderRadius = '20px';
            numSpan.style.marginBottom = '6px';
            numSpan.style.width = 'fit-content';
            numSpan.textContent = c.dia;
            celda.appendChild(numSpan);

            // Eventos
            if (eventos.length > 0) {
                eventos.slice(0, 2).forEach(ev => {
                    const pill = document.createElement('div');
                    let bgColor = '', textColor = '', borderColor = '';

                    if (ev.estado === 'Pendiente') {
                        bgColor = '#fdf3e3'; textColor = '#c9922a'; borderColor = '#c9922a';
                    } else if (ev.estado === 'En Proceso') {
                        bgColor = '#e8f0fb'; textColor = '#1d4f8a'; borderColor = '#1d4f8a';
                    } else {
                        bgColor = '#e8f5ee'; textColor = '#2d8653'; borderColor = '#2d8653';
                    }

                    pill.style.fontSize = '0.65rem';
                    pill.style.padding = '3px 5px';
                    pill.style.marginBottom = '3px';
                    pill.style.borderRadius = '4px';
                    pill.style.background = bgColor;
                    pill.style.color = textColor;
                    pill.style.borderLeft = `3px solid ${borderColor}`;
                    pill.style.whiteSpace = 'nowrap';
                    pill.style.overflow = 'hidden';
                    pill.style.textOverflow = 'ellipsis';
                    pill.textContent = `${ev.horaInicio?.substring(0, 5) || ''} ${ev.nombreFinca.substring(0, 12)}${ev.nombreFinca.length > 12 ? '...' : ''}`;
                    celda.appendChild(pill);
                });
                if (eventos.length > 2) {
                    const mas = document.createElement('div');
                    mas.style.fontSize = '0.6rem';
                    mas.style.color = '#64748b';
                    mas.style.fontStyle = 'italic';
                    mas.textContent = `+${eventos.length - 2} más`;
                    celda.appendChild(mas);
                }
            }

            // Click para seleccionar día
            if (!c.otroMes) {
                celda.onclick = (function (d) {
                    return function () {
                        // Limpiar selección anterior y seleccionar nuevo
                        AG.diaSeleccionado = d;
                        renderCalendario();
                        cargarVisitasDia(d);
                    };
                })(c.dia);
            }

            fila.appendChild(celda);
        }
        semanasContainer.appendChild(fila);
    }
}

function seleccionarDia(dia) {
    AG.diaSeleccionado = dia;
    renderCalendario();
    cargarVisitasDia(dia);
}

async function cargarVisitasDia(dia) {
    const fecha = `${AG.año}-${String(AG.mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const fechaObj = new Date(AG.año, AG.mes, dia);
    const nombreDia = fechaObj.toLocaleDateString('es', { weekday: 'long' });

    document.getElementById('ag-dia-label').textContent = `${nombreDia}, ${dia} de ${MESES[AG.mes]} ${AG.año}`;

    const eventos = AG.eventos.filter(e => e.fechaVisita?.split('T')[0] === fecha);
    const container = document.getElementById('ag-lista-dia');

    if (eventos.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#666;"><i class="fa-solid fa-calendar-day" style="font-size:2rem; opacity:0.5;"></i><br>Sin visitas programadas para este día.</div>';
        return;
    }

    let html = '';
    eventos.forEach(ev => {
        let chipStyle = '';
        if (ev.estado === 'Pendiente') chipStyle = 'background:#fdf3e3; color:#c9922a;';
        else if (ev.estado === 'En Proceso') chipStyle = 'background:#e8f0fb; color:#1d4f8a;';
        else chipStyle = 'background:#e8f5ee; color:#2d8653;';

        html += `
            <div style="display:flex; gap:15px; padding:15px; border-bottom:1px solid #e2e8f0;">
                <div style="min-width:60px; font-weight:bold; color:#2d8653; font-size:0.9rem;">${ev.horaInicio?.substring(0, 5) || ''}</div>
                <div style="flex:1;">
                    <div style="font-weight:bold; margin-bottom:4px; color:#0d2b1a;">${ev.nombreFinca}</div>
                    <div style="font-size:0.7rem; color:#64748b;">${ev.ubicacionCompleta || ev.ubicacion || `${ev.provincia}, ${ev.canton}`}</div>
                    <div style="margin-top:6px;"><span style="padding:3px 10px; border-radius:20px; font-size:0.65rem; ${chipStyle}">${ev.estado || ''}</span></div>
                </div>
                <div>
                    <button onclick="verDetalle(${ev.idSolicitud})" style="background:none; border:none; cursor:pointer; color:#2d8653; font-size:1rem;">👁️</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function mesAnterior() {
    AG.mes--;
    if (AG.mes < 0) { AG.mes = 11; AG.año--; }
    cargarAgenda();
}

function mesSiguiente() {
    AG.mes++;
    if (AG.mes > 11) { AG.mes = 0; AG.año++; }
    cargarAgenda();
}

function irHoy() {
    AG.año = AG.hoy.getFullYear();
    AG.mes = AG.hoy.getMonth();
    cargarAgenda();
}

function verDetalle(id) {
    window.location.href = `/IngForestal/Detalle?id=${id}`;
}

function programarVisita() {
    window.location.href = '/IngForestal/Programar';
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    cargarAgenda();
});