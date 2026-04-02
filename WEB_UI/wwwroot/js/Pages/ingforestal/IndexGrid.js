function IngForestalIndexGrid() {
    this.InitView = () => {
        this.LoadGrid();
    };

    this.LoadGrid = () => {
        const self = this;
        const colDefs = [
            {
                field: "finca", headerName: "Finca / Propietario", flex: 2,
                cellRenderer: p => `<div><div style="color:var(--psa-ink);">${p.data.finca}</div><div style="font-size:0.75rem;color:var(--psa-muted);">${p.data.propietario}</div></div>`
            },
            { field: "ubicacion", headerName: "Ubicación", flex: 1 },
            { field: "hectareas", headerName: "Hectáreas" },
            { field: "vegetacion", headerName: "Tipo de Vegetación", flex: 1 },
            {
                field: "estado", headerName: "Estado",
                cellRenderer: p => {
                    const c = { 'Pendiente': 'gold', 'En Proceso': 'blue', 'Aprobada': 'green', 'Rechazada': 'red' }[p.value] || 'muted';
                    return `<span class="psa-badge psa-badge-${c}">${p.value}</span>`;
                }
            },
            { field: "fechaSolicitud", headerName: "Fecha Solicitud" },
            {
                headerName: "", width: 100, minWidth: 100, sortable: false, filter: false,
                cellRenderer: p => `<a href="/IngForestal/Detalle" class="btn btn-psa btn-sm" style="font-size:0.68rem;padding:1px 8px;">Ver</a>`
            }
        ];

        const data = [
            { finca: "Finca Los Robles", propietario: "José Ángel Mora", ubicacion: "Turrialba, Cartago", hectareas: "12.50 ha", vegetacion: "Bosque Secundario", estado: "Pendiente", fechaSolicitud: "18/03/2026" },
            { finca: "Hacienda Verde", propietario: "María Solano Vega", ubicacion: "Sarapiquí, Heredia", hectareas: "28.00 ha", vegetacion: "Bosque Primario", estado: "Pendiente", fechaSolicitud: "15/03/2026" },
            { finca: "Finca El Cedro", propietario: "Roberto Chaves", ubicacion: "Pérez Zeledón, San José", hectareas: "9.75 ha", vegetacion: "Plantación Forestal", estado: "En Proceso", fechaSolicitud: "10/03/2026" },
            { finca: "Lote Montañés", propietario: "Ana Chinchilla", ubicacion: "Tarrazú, San José", hectareas: "45.00 ha", vegetacion: "Bosque Primario", estado: "Aprobada", fechaSolicitud: "05/03/2026" },
            { finca: "Finca San Marcos", propietario: "Luis Blanco", ubicacion: "Alajuela, Alajuela", hectareas: "5.00 ha", vegetacion: "Pasto", estado: "Rechazada", fechaSolicitud: "28/02/2026" }
        ];

        const gridDiv = document.querySelector('#gridIngForestalIndex');
        agGrid.createGrid(gridDiv, {
            columnDefs: colDefs, rowData: data, rowSelection: 'single', rowHeight: 50,
            defaultColDef: { sortable: true, filter: true }, pagination: true, paginationPageSize: 10,
            onGridReady: p => { self.gridApi = p.api; }
        });
    };
}

$(document).ready(() => { let v = new IngForestalIndexGrid(); v.InitView(); });
