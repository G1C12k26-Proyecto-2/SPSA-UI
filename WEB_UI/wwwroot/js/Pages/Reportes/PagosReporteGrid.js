function PagosReporteGrid() {
    this.InitView = () => {
        this.LoadGrid();
    };

    this.LoadGrid = () => {
        const self = this;
        const colDefs = [
            { field: "finca", headerName: "Finca", flex: 1 },
            { field: "propietario", headerName: "Propietario", flex: 1 },
            { field: "provincia", headerName: "Provincia", flex: 0.8 },
            { field: "canton", headerName: "Cantón", flex: 0.8 },
            { field: "periodo", headerName: "Período", flex: 0.8 },
            {
                field: "monto", headerName: "Monto", flex: 0.8,
                cellRenderer: p => p.value ? `<span style="font-weight:600;font-family:'Fraunces',serif;">${p.value}</span>` : '—'
            },
            {
                field: "estado", headerName: "Estado",
                cellRenderer: p => {
                    const c = p.value === 'Ejecutado' ? 'green' : 'gold';
                    return `<span class="psa-badge psa-badge-${c}">${p.value}</span>`;
                }
            }
        ];

        const data = [
            { finca: "Finca La Catarata", propietario: "Carlos Fonseca", provincia: "Guanacaste", canton: "Hojancha", periodo: "Mar 2026", monto: "₡3,800,000", estado: "Ejecutado" },
            { finca: "Finca El Roble", propietario: "Carlos Fonseca", provincia: "Alajuela", canton: "San Carlos", periodo: "Mar 2026", monto: "₡4,200,000", estado: "Pendiente" },
            { finca: "Finca Las Palmas", propietario: "Ana Solano", provincia: "Heredia", canton: "Sarapiquí", periodo: "Mar 2026", monto: "₡3,100,000", estado: "Pendiente" }
        ];

        const gridDiv = document.querySelector('#gridReportePagos');
        agGrid.createGrid(gridDiv, {
            columnDefs: colDefs, rowData: data, rowSelection: 'single', rowHeight: 45,
            defaultColDef: { sortable: true, filter: true }, pagination: true, paginationPageSize: 10,
            onGridReady: p => { self.gridApi = p.api; }
        });
    };
}

$(document).ready(() => { let v = new PagosReporteGrid(); v.InitView(); });
