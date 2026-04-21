/* =====================================================
   agenda.js — Visitas / Agenda | PSA
   Versión simplificada y funcional
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
            renderCalendario();
            // Seleccionar el día actual
            const hoy = new Date();
            if (AG.año === hoy.getFullYear() && AG.mes === hoy.getMonth()) {
                seleccionarDia(hoy.getDate());
            } else {
                seleccionarDia(1);
            }
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

    let html = '<table style="width:100%; border-collapse:collapse;">';
    html += '<tr style="background:#f5f5f5;">';
    html += '<th style="padding:8px; border:1px solid #ddd;">Dom</th>';
    html += '<th style="padding:8px; border:1px solid #ddd;">Lun</th>';
    html += '<th style="padding:8px; border:1px solid #ddd;">Mar</th>';
    html += '<th style="padding:8px; border:1px solid #ddd;">Mié</th>';
    html += '<th style="padding:8px; border:1px solid #ddd;">Jue</th>';
    html += '<th style="padding:8px; border:1px solid #ddd;">Vie</th>';
    html += '<th style="padding:8px; border:1px solid #ddd;">Sáb</th>';
    html += '</tr>';

    let dia = 1;
    let row = '<tr>';

    // Celdas vacías del mes anterior
    for (let i = 0; i < primerDia; i++) {
        row += '<td style="padding:8px; border:1px solid #ddd; background:#f9f9f9; height:100px; vertical-align:top;">&nbsp;</td>';
    }

    // Días del mes actual
    for (let d = 1; d <= diasEnMes; d++) {
        const fechaStr = `${AG.año}-${String(AG.mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const eventos = AG.eventos.filter(e => e.fechaVisita?.split('T')[0] === fechaStr);
        const esHoy = (AG.año === AG.hoy.getFullYear() && AG.mes === AG.hoy.getMonth() && d === AG.hoy.getDate());
        const esSel = (AG.diaSeleccionado === d);

        let estiloCelda = 'padding:8px; border:1px solid #ddd; height:100px; vertical-align:top;';
        if (esHoy) estiloCelda += ' border:2px solid #2d8653; background:#e8f5ee;';
        if (esSel) estiloCelda += ' background:#d4edda;';

        row += `<td style="${estiloCelda}" onclick="seleccionarDia(${d})">`;
        row += `<span style="font-weight:bold; display:inline-block; margin-bottom:5px; background:${esHoy ? '#2d8653' : '#e8f5ee'}; color:${esHoy ? '#fff' : '#0d2b1a'}; padding:2px 8px; border-radius:20px;">${d}</span>`;

        // Mostrar eventos
        eventos.slice(0, 2).forEach(ev => {
            let color = '';
            if (ev.estado === 'Pendiente') color = '#fdf3e3';
            else if (ev.estado === 'En Proceso') color = '#e8f0fb';
            else color = '#e8f5ee';
            row += `<div style="font-size:11px; padding:3px 5px; margin-bottom:2px; border-radius:4px; background:${color}; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">`;
            row += `${ev.horaInicio?.substring(0, 5) || ''} ${ev.nombreFinca}`;
            row += `</div>`;
        });

        if (eventos.length > 2) {
            row += `<div style="font-size:10px; color:#666; font-style:italic;">+${eventos.length - 2} más</div>`;
        }

        row += `</td>`;

        if ((primerDia + d) % 7 === 0) {
            row += '</tr><tr>';
        }
    }

    // Completar última fila
    const celdasUsadas = primerDia + diasEnMes;
    const celdasRestantes = 42 - celdasUsadas;
    for (let i = 0; i < celdasRestantes; i++) {
        row += '<td style="padding:8px; border:1px solid #ddd; background:#f9f9f9; height:100px; vertical-align:top;">&nbsp;</td>';
    }

    row += '</tr>';
    html += row + '</table>';

    document.getElementById('ag-semanas').innerHTML = html;
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
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#666;">📅<br>Sin visitas programadas para este día.</div>';
        return;
    }

    let html = '';
    eventos.forEach(ev => {
        let chipColor = '';
        if (ev.estado === 'Pendiente') chipColor = 'style="background:#fdf3e3; color:#c9922a;"';
        else if (ev.estado === 'En Proceso') chipColor = 'style="background:#e8f0fb; color:#1d4f8a;"';
        else chipColor = 'style="background:#e8f5ee; color:#2d8653;"';

        html += `
            <div style="display:flex; gap:15px; padding:15px; border-bottom:1px solid #eee;">
                <div style="min-width:60px; font-weight:bold; color:#2d8653;">${ev.horaInicio?.substring(0, 5) || ''}</div>
                <div style="flex:1;">
                    <div style="font-weight:bold; margin-bottom:4px;">${ev.nombreFinca}</div>
                    <div style="font-size:12px; color:#666;">${ev.ubicacionCompleta || ev.ubicacion || ''}</div>
                    <div style="margin-top:5px;"><span ${chipColor} style="padding:3px 10px; border-radius:20px; font-size:11px;">${ev.estado || ''}</span></div>
                </div>
                <div>
                    <button class="btn-icon" onclick="verDetalle(${ev.idSolicitud})" style="background:none; border:none; cursor:pointer; color:#2d8653;">👁️</button>
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