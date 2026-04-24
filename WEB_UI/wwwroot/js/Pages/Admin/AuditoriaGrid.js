function AuditoriaGrid() {
    this.InitView = () => {
        this.LoadGrid();
    };

    this.LoadGrid = () => {
        const self = this;
        const colDefs = [
            { field: "fecha", headerName: "Fecha", flex: 1 },
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
                field: "ip", headerName: "IP", flex: 1,
                cellRenderer: p => `<span style="font-family:monospace;font-size:0.75rem;">${p.value}</span>`
            },
            {
                headerName: "", width: 100, minWidth: 100, sortable: false, filter: false,
                cellRenderer: p => `<a href="/Auditoria/Detalle" class="btn btn-psa btn-sm" style="font-size:0.68rem;padding:1px 8px;">Ver</a>`
            }
        ];

        const data = [
            { fecha: "22/03/2026 10:14", usuario: "Admin Sistema", accion: "Pago ejecutado", modulo: "Pagos", ip: "192.168.1.10" },
            { fecha: "22/03/2026 08:30", usuario: "Admin Sistema", accion: "Usuario creado", modulo: "Usuarios", ip: "192.168.1.10" },
            { fecha: "21/03/2026 16:45", usuario: "Admin Sistema", accion: "Parámetro editado", modulo: "Configuración", ip: "192.168.1.10" },
            { fecha: "21/03/2026 14:10", usuario: "Ing. Rojas", accion: "Solicitud rechazada", modulo: "Solicitudes", ip: "192.168.1.22" }
        ];

        const gridDiv = document.querySelector('#gridAuditoria');
        agGrid.createGrid(gridDiv, {
            columnDefs: colDefs, rowData: data, rowSelection: 'single', rowHeight: 45,
            defaultColDef: { sortable: true, filter: true }, pagination: true, paginationPageSize: 10,
            onGridReady: p => { self.gridApi = p.api; }
        });
    };
}

$(document).ready(() => { let v = new AuditoriaGrid(); v.InitView(); });
