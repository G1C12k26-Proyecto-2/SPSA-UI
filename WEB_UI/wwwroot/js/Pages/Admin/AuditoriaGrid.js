const API_URL = "https://awakatech-bzb3evdgapcdchc5.canadacentral-01.azurewebsites.net";

function AuditoriaGrid() {
    this.InitView = () => {
        this.LoadGrid();
    };

    this.LoadGrid = async () => {
        const self = this;
        const colDefs = [
            { field: "fechaCambio", headerName: "Fecha", flex: 1 },
            { field: "usuario", headerName: "Usuario", flex: 1 },
            {
                field: "accion", headerName: "Acción", flex: 1.2,
                cellRenderer: p => {
                    const c = { 'Pago ejecutado': 'green', 'Usuario creado': 'blue', 'Parámetro editado': 'gold', 'Solicitud rechazada': 'red', 'Solicitud aprobada': 'green', 'Inicio sesión': 'blue' }[p.value] || 'muted';
                    return `<span class="psa-badge psa-badge-${c}">${p.value}</span>`;
                }
            },
            { field: "modulo", headerName: "Módulo", flex: 1 },
            {
                field: "descripcion", headerName: "Descripción", flex: 1.5,
                cellRenderer: p => `<span style="font-size:0.75rem;">${p.value ?? ''}</span>`
            },
            {
                headerName: "", width: 100, minWidth: 100, sortable: false, filter: false,
                cellRenderer: p => `<a href="/Auditoria/Detalle" class="btn btn-psa btn-sm" style="font-size:0.68rem;padding:1px 8px;">Ver</a>`
            }
        ];

        let data = [];
        try {
            const res = await fetch(`${API_URL}/api/Auditoria/GetAll`);
            const json = await res.json();
            if (json.result === "ok") data = json.data;
        } catch (e) {
            console.error("Error cargando auditoría", e);
        }

        const gridDiv = document.querySelector('#gridAuditoria');
        agGrid.createGrid(gridDiv, {
            columnDefs: colDefs, rowData: data, rowSelection: 'single', rowHeight: 45,
            defaultColDef: { sortable: true, filter: true }, pagination: true, paginationPageSize: 10,
            onGridReady: p => { self.gridApi = p.api; }
        });
    };
}

$(document).ready(() => { let v = new AuditoriaGrid(); v.InitView(); });