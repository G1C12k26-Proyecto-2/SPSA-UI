const API_URL = window.location.hostname === 'localhost'
    ? "https://awakatech-bzb3evdgapcdchc5.canadacentral-01.azurewebsites.net"
    : "https://spsaapi.azurewebsites.net";

function cargarPagos() {
    $.ajax({
        url: `${API_URL}/api/Pago/GetAll`,
        type: 'GET',
        success: function (json) {
            if (json.result === "ok") {
                const pendientes = json.data.filter(p => p.estado === 'Aprobada' && p.pagoMensual);
                const procesados = json.data.filter(p => p.estado === 'Pagada');

                const tablaPendientes = document.getElementById("tablaPendientes");
                const tablaProcesados = document.getElementById("tablaProcesados");

                tablaPendientes.innerHTML = '';
                tablaProcesados.innerHTML = '';

                pendientes.forEach(p => {
                    tablaPendientes.innerHTML += `
                        <tr>
                            <td style="padding:0.9rem 1.3rem;">${p.nombreFinca}</td>
                            <td style="padding:0.9rem 1.3rem;">${p.propietario ?? '—'}</td>
                            <td style="padding:0.9rem 1.3rem;"><strong>₡${Number(p.pagoMensual).toLocaleString()}</strong></td>
                            <td style="padding:0.9rem 1.3rem;">${p.provincia ?? '—'}</td>
                            <td style="padding:0.9rem 1.3rem;">
                                <button class="btn btn-psa btn-sm" style="font-size:0.75rem;" onclick="procesarPago(${p.id})">Procesar</button>
                            </td>
                        </tr>`;
                });

                procesados.forEach(p => {
                    tablaProcesados.innerHTML += `
                        <tr>
                            <td style="padding:0.9rem 1.3rem;">${p.nombreFinca}</td>
                            <td style="padding:0.9rem 1.3rem;">${p.propietario ?? '—'}</td>
                            <td style="padding:0.9rem 1.3rem;"><strong>₡${Number(p.pagoMensual).toLocaleString()}</strong></td>
                            <td style="padding:0.9rem 1.3rem;">${p.provincia ?? '—'}</td>
                            <td style="padding:0.9rem 1.3rem;"><span class="psa-badge psa-badge-green">Pagada</span></td>
                        </tr>`;
                });
            }
        },
        error: function (e) {
            console.error("Error cargando pagos", e);
        }
    });
}

function procesarPago(id) {
    $.ajax({
        url: `${API_URL}/api/Reportes/UpdateStatus`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ idSolicitud: id, nuevoEstado: 'Pagada' }),
        success: function (json) {
            if (json.result === "ok") {
                cargarPagos();
            } else {
                alert("Error: " + json.message);
            }
        },
        error: function (e) {
            console.error("Error procesando pago", e);
        }
    });
}

$(document).ready(() => { cargarPagos(); });