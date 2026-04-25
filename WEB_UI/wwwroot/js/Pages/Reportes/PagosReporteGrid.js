const API_URL = "https://awakatech-bzb3evdgapcdchc5.canadacentral-01.azurewebsites.net";

function PagosReporteGrid() {
    this.InitView = () => {
        this.LoadGrid();
    };

    this.LoadGrid = async () => {
        const self = this;
        const colDefs = [
            { field: "nombreFinca", headerName: "Finca", flex: 1 },
            { field: "propietario", headerName: "Propietario", flex: 1 },
            { field: "provincia", headerName: "Provincia", flex: 0.8 },
            { field: "canton", headerName: "Cantón", flex: 0.8 },
            { field: "fechaSolicitud", headerName: "Fecha", flex: 0.8 },
            {
                field: "pagoMensual", headerName: "Monto", flex: 0.8,
                cellRenderer: p => p.value ? `<span style="font-weight:600;font-family:'Fraunces',serif;">₡${Number(p.value).toLocaleString()}</span>` : '—'
            },
            {
                field: "estado", headerName: "Estado",
                cellRenderer: p => {
                    const c = { 'Aprobada': 'green', 'Pendiente': 'gold', 'En Proceso': 'blue', 'Rechazada': 'red' }[p.value] || 'muted';
                    return `<span class="psa-badge psa-badge-${c}">${p.value}</span>`;
                }
            }
        ];

        let data = [];
        try {
            const res = await fetch(`${API_URL}/api/Pago/GetAll`);
            const json = await res.json();
            if (json.result === "ok") data = json.data;
        } catch (e) {
            console.error("Error cargando pagos", e);
        }

        const gridDiv = document.querySelector('#gridReportePagos');
        agGrid.createGrid(gridDiv, {
            columnDefs: colDefs, rowData: data, rowSelection: 'single', rowHeight: 45,
            defaultColDef: { sortable: true, filter: true }, pagination: true, paginationPageSize: 10,
            onGridReady: p => { self.gridApi = p.api; }
        });
    };
}

$(document).ready(() => { let v = new PagosReporteGrid(); v.InitView(); });