const API_URL = window.location.hostname === 'localhost'
    ? "https://awakatech-bzb3evdgapcdchc5.canadacentral-01.azurewebsites.net"
    : "https://spsaapi.azurewebsites.net";

async function cargarDashboard() {
    try {
        const res = await fetch(`${API_URL}/api/Dashboard/Get`);
        const json = await res.json();
        if (json.result === "ok") {
            const d = json.data;
            document.getElementById("totalSolicitudes").textContent = d.totalSolicitudes;
            document.getElementById("totalAprobadas").textContent = d.totalAprobadas;
            document.getElementById("totalPagos").textContent = `₡${Number(d.totalPagosMenuales).toLocaleString()}`;
            document.getElementById("totalPendientes").textContent = d.totalPendientes;
        }
    } catch (e) {
        console.error("Error cargando dashboard", e);
    }
}

async function cargarSolicitudesRecientes() {
    try {
        const res = await fetch(`${API_URL}/api/Reportes/GetSolicitudes`);
        const json = await res.json();
        if (json.result === "ok") {
            console.log("Solicitudes:", json.data);
            const tabla = document.getElementById("tablaSolicitudes");
            const recientes = json.data.slice(0, 5);
            recientes.forEach(s => {
                const c = { 'Aprobada': 'green', 'Pendiente': 'gold', 'En Proceso': 'blue', 'Rechazada': 'red' }[s.estado] || 'muted';
                tabla.innerHTML += `
                    <tr>
                        <td style="padding:0.9rem 1.3rem;">
                            ${s.nombreFinca}<br />
                            <span style="color:var(--psa-muted);font-size:0.75rem;">${s.hectareasOriginal ?? '—'} ha · ${s.provincia ?? '—'}</span>
                        </td>
                        <td style="padding:0.9rem 1.3rem;">${s.propietario ?? '—'}</td>
                        <td style="padding:0.9rem 1.3rem;"><span class="psa-badge psa-badge-${c}">${s.estado}</span></td>
                    </tr>`;
            });
        }
    } catch (e) {
        console.error("Error cargando solicitudes recientes", e);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    cargarDashboard();
    cargarSolicitudesRecientes();
});