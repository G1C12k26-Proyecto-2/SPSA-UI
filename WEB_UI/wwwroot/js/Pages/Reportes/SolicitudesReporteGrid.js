function SolicitudesReporteGrid() {
    this.InitView = () => {
        this.LoadGrid();
    };

    this.LoadGrid = () => {
        const self = this;
        const colDefs = [
            {
                field: "finca", headerName: "Finca", flex: 1.5,
                cellRenderer: p => `<div><div style="font-weight:500;">${p.data.finca}</div><div style="font-size:0.75rem;color:var(--psa-muted);">${p.data.hectareas}</div></div>`
            },
            { field: "propietario", headerName: "Propietario", flex: 1 },
            { field: "fecha", headerName: "Fecha", flex: 0.8 },
            { field: "tecnico", headerName: "Técnico", flex: 1 },
            {
                field: "estado", headerName: "Estado",
                cellRenderer: p => {
                    const c = { 'En evaluación': 'gold', 'En revisión': 'blue', 'Aprobada': 'green' }[p.value] || 'muted';
                    return `<span class="psa-badge psa-badge-${c}">${p.value}</span>`;
                }
            }
        ];

        const data = [
            { finca: "Finca El Roble", hectareas: "120 ha · Alajuela", propietario: "Carlos Fonseca", fecha: "15/03/2026", tecnico: "Ing. María López", estado: "En evaluación" },
            { finca: "Finca Las Palmas", hectareas: "85 ha · San Carlos", propietario: "Ana Rodríguez", fecha: "01/03/2026", tecnico: "Ing. Carlos Rojas", estado: "En revisión" }
        ];

        const gridDiv = document.querySelector('#gridReporteSolicitudes');
        agGrid.createGrid(gridDiv, {
            columnDefs: colDefs, rowData: data, rowSelection: 'single', rowHeight: 50,
            defaultColDef: { sortable: true, filter: true }, pagination: true, paginationPageSize: 10,
            onGridReady: p => { self.gridApi = p.api; }
        });
    };
}

$(document).ready(() => { let v = new SolicitudesReporteGrid(); v.InitView(); });
