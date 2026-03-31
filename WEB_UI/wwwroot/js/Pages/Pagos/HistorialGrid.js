function PagosHistorialGrid() {
    this.InitView = () => {
        this.LoadGrid();
    };

    this.LoadGrid = () => {
        const self = this;
        const colDefs = [
            { field: "finca", headerName: "Finca", flex: 1 },
            { field: "propietario", headerName: "Propietario", flex: 1 },
            { field: "periodo", headerName: "Período", flex: 0.8 },
            {
                field: "monto", headerName: "Monto", flex: 0.8,
                cellRenderer: p => p.value ? `<span style="font-weight:600;font-family:'Fraunces',serif;">${p.value}</span>` : '—'
            },
            { field: "fecha", headerName: "Fecha", flex: 0.8 },
            {
                field: "estado", headerName: "Estado",
                cellRenderer: p => {
                    const c = p.value === 'Ejecutado' ? 'green' : 'gold';
                    return `<span class="psa-badge psa-badge-${c}">${p.value}</span>`;
                }
            }
        ];

        const data = [
            { finca: "Finca La Catarata", propietario: "Carlos Fonseca", periodo: "Mar 2026", monto: "₡3,800,000", fecha: "10/03/2026", estado: "Ejecutado" },
            { finca: "Finca La Catarata", propietario: "Carlos Fonseca", periodo: "Feb 2026", monto: "₡3,800,000", fecha: "10/02/2026", estado: "Ejecutado" },
            { finca: "Finca Las Palmas", propietario: "Ana Solano", periodo: "Ene–Mar 2026", monto: "₡3,100,000", fecha: "—", estado: "Pendiente" }
        ];

        const gridDiv = document.querySelector('#gridPagosHistorial');
        agGrid.createGrid(gridDiv, {
            columnDefs: colDefs, rowData: data, rowSelection: 'single', rowHeight: 45,
            defaultColDef: { sortable: true, filter: true }, pagination: true, paginationPageSize: 10,
            onGridReady: p => { self.gridApi = p.api; }
        });
    };
}

$(document).ready(() => { let v = new PagosHistorialGrid(); v.InitView(); });
