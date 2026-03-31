function ListaSolicitudadesGrid() {
    this.InitView = () => {
        this.LoadGrid();
        $('#vi-buscador').on('input', () => {
            if (this.gridApi) this.gridApi.setGridOption('quickFilterText', $('#vi-buscador').val());
        });
    };

    this.LoadGrid = () => {
        const self = this;
        const colDefs = [
            {
                field: "finca", headerName: "Finca / Propietario", flex: 2,
                cellRenderer: p => `<div><div style="font-weight:600;color:var(--psa-forest);">${p.data.finca}</div><div style="font-size:0.75rem;color:var(--psa-muted);">${p.data.propietario}</div></div>`
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
            { field: "fechaSolicitud", headerName: "Fecha de Visita" },
            {
                headerName: "", width: 80, sortable: false, filter: false,
                cellRenderer: p => `<a href="/IngForestal/Detalle" class="psa-card-action">Ver →</a>`
            }
        ];

        const data = [
            { finca: "Finca Los Robles", propietario: "José Ángel Mora", ubicacion: "Turrialba, Cartago", hectareas: "12.50 ha", vegetacion: "Bosque Secundario", estado: "Pendiente", fechaSolicitud: "23/03/2026" },
            { finca: "Hacienda Verde", propietario: "María Solano Vega", ubicacion: "Sarapiquí, Heredia", hectareas: "28.00 ha", vegetacion: "Bosque Primario", estado: "Pendiente", fechaSolicitud: "25/03/2026" },
            { finca: "Finca El Cedro", propietario: "Roberto Chaves", ubicacion: "Pérez Zeledón, San José", hectareas: "9.75 ha", vegetacion: "Plantación Forestal", estado: "En Proceso", fechaSolicitud: "28/03/2026" },
            { finca: "Lote Montañés", propietario: "Ana Chinchilla", ubicacion: "Tarrazú, San José", hectareas: "45.00 ha", vegetacion: "Bosque Primario", estado: "Aprobada", fechaSolicitud: "05/03/2026" },
            { finca: "Finca San Marcos", propietario: "Luis Blanco", ubicacion: "Alajuela, Alajuela", hectareas: "5.00 ha", vegetacion: "Pasto", estado: "Rechazada", fechaSolicitud: "28/02/2026" },
            { finca: "Finca La Esperanza", propietario: "Carmen Ulate", ubicacion: "Acosta, San José", hectareas: "18.30 ha", vegetacion: "Bosque Secundario", estado: "Pendiente", fechaSolicitud: "22/03/2026" }
        ];

        const gridDiv = document.querySelector('#gridListaSolicitudes');
        agGrid.createGrid(gridDiv, {
            columnDefs: colDefs, rowData: data, rowSelection: 'single', rowHeight: 50,
            defaultColDef: { sortable: true, filter: true }, pagination: true, paginationPageSize: 10,
            onGridReady: p => { self.gridApi = p.api; }
        });
    };
}

$(document).ready(() => { let v = new ListaSolicitudadesGrid(); v.InitView(); });
