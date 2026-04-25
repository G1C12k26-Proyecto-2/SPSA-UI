const API_URL = "https://spsaapi.azurewebsites.net";

function SolicitudesReporteGrid() {
    this.InitView = () => {
        this.LoadGrid();
    };

    this.LoadGrid = () => {
        const self = this;
        const colDefs = [
            {
                field: "nombreFinca", headerName: "Finca", flex: 1.5,
                cellRenderer: p => `<div><div style="font-weight:500;">${p.data.nombreFinca}</div><div style="font-size:0.75rem;color:var(--psa-muted);">${p.data.hectareasOriginal ?? ''} ha · ${p.data.provincia ?? ''}</div></div>`
            },
            { field: "propietario", headerName: "Propietario", flex: 1 },
            { field: "fechaSolicitud", headerName: "Fecha", flex: 0.8 },
            { field: "ingenieroNombre", headerName: "Técnico", flex: 1 },
            {
                field: "estado", headerName: "Estado",
                cellRenderer: p => {
                    const c = { 'En Proceso': 'gold', 'Pendiente': 'blue', 'Aprobada': 'green', 'Rechazada': 'red' }[p.value] || 'muted';
                    return `<span class="psa-badge psa-badge-${c}">${p.value}</span>`;
                }
            }
        ];

        $.ajax({
            url: `${API_URL}/api/Reportes/GetSolicitudes`,
            type: 'GET',
            success: function (json) {
                let data = [];
                if (json.result === "ok") data = json.data;
                const gridDiv = document.querySelector('#gridReporteSolicitudes');
                agGrid.createGrid(gridDiv, {
                    columnDefs: colDefs, rowData: data, rowSelection: 'single', rowHeight: 50,
                    defaultColDef: { sortable: true, filter: true }, pagination: true, paginationPageSize: 10,
                    onGridReady: p => { self.gridApi = p.api; }
                });
            },
            error: function (e) {
                console.error("Error cargando solicitudes", e);
            }
        });
    };
}

$(document).ready(() => { let v = new SolicitudesReporteGrid(); v.InitView(); });