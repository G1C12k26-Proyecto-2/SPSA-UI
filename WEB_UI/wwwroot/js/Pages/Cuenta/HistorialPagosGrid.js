function HistorialPagosGrid() {
    this.InitView = () => {
        this.LoadGrid();
    };

    this.LoadGrid = () => {
        const self = this;
        const colDefs = [
            { field: "periodo", headerName: "Período", flex: 0.8 },
            {
                field: "finca", headerName: "Finca", flex: 1.2,
                cellRenderer: p => `<div><div style="font-weight:500;">${p.data.finca}</div><div style="font-size:0.68rem;color:var(--psa-muted);">${p.data.provincia}</div></div>`
            },
            { field: "hectareas", headerName: "Hectáreas", flex: 0.8 },
            {
                field: "montoBase", headerName: "Monto Base", flex: 0.9,
                cellRenderer: p => `<span style="font-family:'Fraunces',serif;">${p.value}</span>`
            },
            { field: "ajustes", headerName: "Ajustes", flex: 0.8 },
            {
                field: "total", headerName: "Total", flex: 0.9,
                cellRenderer: p => `<strong style="font-family:'Fraunces',serif;">${p.value}</strong>`
            },
            { field: "fecha", headerName: "Fecha", flex: 0.8 },
            {
                field: "estado", headerName: "Estado",
                cellRenderer: p => {
                    const c = p.value === 'Ejecutado' ? 'green' : 'muted';
                    return `<span class="psa-badge psa-badge-${c}">${p.value}</span>`;
                }
            },
            {
                headerName: "", width: 100, minWidth: 100, sortable: false, filter: false,
                cellRenderer: p => `<button class="btn btn-psa btn-sm" style="font-size:0.68rem;padding:1px 8px;">Factura</button>`
            }
        ];

        const data = [
            { periodo: "Mar 2026", finca: "Finca La Catarata", provincia: "Guanacaste", hectareas: "62 ha", montoBase: "₡3,100,000", ajustes: "+40%", total: "₡3,800,000", fecha: "10/03/2026", estado: "Ejecutado" },
            { periodo: "Feb 2026", finca: "Finca La Catarata", provincia: "Guanacaste", hectareas: "62 ha", montoBase: "₡3,100,000", ajustes: "+40%", total: "₡3,800,000", fecha: "10/02/2026", estado: "Ejecutado" },
            { periodo: "Ene 2026", finca: "Finca La Catarata", provincia: "Guanacaste", hectareas: "62 ha", montoBase: "₡3,100,000", ajustes: "+40%", total: "₡3,800,000", fecha: "10/01/2026", estado: "Ejecutado" },
            { periodo: "Dic 2025", finca: "Finca La Catarata", provincia: "Guanacaste", hectareas: "62 ha", montoBase: "₡3,100,000", ajustes: "+30%", total: "₡3,500,000", fecha: "10/12/2025", estado: "Ejecutado" },
            { periodo: "Nov 2025", finca: "Finca La Catarata", provincia: "Guanacaste", hectareas: "62 ha", montoBase: "₡3,100,000", ajustes: "+30%", total: "₡3,500,000", fecha: "10/11/2025", estado: "Ejecutado" },
            { periodo: "Oct 2025", finca: "Finca La Catarata", provincia: "Guanacaste", hectareas: "62 ha", montoBase: "₡3,100,000", ajustes: "+30%", total: "₡3,500,000", fecha: "10/10/2025", estado: "Ejecutado" }
        ];

        const gridDiv = document.querySelector('#gridHistorialPagos');
        agGrid.createGrid(gridDiv, {
            columnDefs: colDefs, rowData: data, rowSelection: 'single', rowHeight: 50,
            defaultColDef: { sortable: true, filter: true }, pagination: true, paginationPageSize: 10,
            onGridReady: p => { self.gridApi = p.api; }
        });
    };
}

$(document).ready(() => { let v = new HistorialPagosGrid(); v.InitView(); });
