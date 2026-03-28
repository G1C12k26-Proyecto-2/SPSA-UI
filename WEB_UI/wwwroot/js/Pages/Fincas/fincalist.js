function FincaList() {
    this.InitView = () => {
        this.LoadGrid();
        $('#txtSearch').on('input', () => {
            if (this.gridApi) this.gridApi.setGridOption('quickFilterText', $('#txtSearch').val());
        });
    };
    this.LoadGrid = () => {
        const self = this;
        const colDefs = [
            {
                field: "nombre", headerName: "Finca", flex: 2,
                cellRenderer: p => `<div><div style="font-weight:500;">${p.data.nombre}</div><div style="font-size:0.68rem;color:#5c6b60;">Registrada: ${p.data.registro}</div></div>`
            },
            {
                field: "ubicacion", headerName: "Ubicación", flex: 1,
                cellRenderer: p => `<div><div style="font-weight:500;">${p.data.provincia}</div><div style="font-size:0.68rem;color:#5c6b60;">${p.data.ubicacion}</div></div>`
            },
            { field: "hectareas", headerName: "Hectáreas" },
            { field: "vegetacion", headerName: "Vegetación", flex: 1 },
            {
                field: "estado", headerName: "Estado", flex: 1,
                cellRenderer: p => {
                    const c = { 'PSA Activo': 'green', 'En Evaluación': 'purple', 'En Revisión': 'gold', 'Visita Prog.': 'blue', 'Rechazada': 'red' }[p.value] || 'muted';
                    return `<span class="psa-badge psa-badge-${c}">${p.value}</span>`;
                }
            },
            {
                field: "pago", headerName: "Pago Mensual",
                cellRenderer: p => p.value !== '—' ? `<span style="font-weight:600;font-family:'Fraunces',serif;">${p.value}</span>` : '<span style="color:#5c6b60;">—</span>'
            },
            {
                headerName: "", width: 130, sortable: false, filter: false,
                cellRenderer: p => `<a href="/Fincas/Detalle/${p.data.id}" class="btn btn-psa btn-sm me-1" style="font-size:0.68rem;padding:1px 8px;">Ver</a>${p.data.estado !== 'Rechazada' && p.data.estado !== 'PSA Activo' ? `<a href="/Fincas/Editar/${p.data.id}" class="btn btn-outline-psa btn-sm" style="font-size:0.68rem;padding:1px 8px;">Editar</a>` : ''}`
            }
        ];
        // TODO: $.ajax({ url: API_URL_BASE + "/api/Fincas/GetByOwner", ... })
        const data = [
            { id: 1, nombre: "Finca La Catarata", registro: "05 jun 2023", provincia: "Guanacaste", ubicacion: "Hojancha, Nandayure", hectareas: "62 ha", vegetacion: "Bosque Primario", estado: "PSA Activo", pago: "₡3.8M" },
            { id: 2, nombre: "Finca El Roble", registro: "08 mar 2026", provincia: "Alajuela", ubicacion: "San Carlos, Fortuna", hectareas: "120 ha", vegetacion: "Bosque Primario", estado: "En Evaluación", pago: "—" },
            { id: 3, nombre: "Finca Las Palmas", registro: "15 feb 2026", provincia: "Heredia", ubicacion: "Sarapiquí, Puerto Viejo", hectareas: "78 ha", vegetacion: "Bosque Secundario", estado: "En Revisión", pago: "—" },
            { id: 4, nombre: "Finca Cerro Verde", registro: "22 ene 2026", provincia: "Cartago", ubicacion: "Turrialba, Santa Cruz", hectareas: "50 ha", vegetacion: "Plantación Forestal", estado: "Visita Prog.", pago: "—" },
            { id: 5, nombre: "Finca Los Cedros", registro: "18 oct 2025", provincia: "Puntarenas", ubicacion: "Osa, Drake", hectareas: "34 ha", vegetacion: "Bosque Primario", estado: "Rechazada", pago: "—" }
        ];
        const gridDiv = document.querySelector('#gridFincas');
        agGrid.createGrid(gridDiv, {
            columnDefs: colDefs, rowData: data, rowSelection: 'single', rowHeight: 50,
            defaultColDef: { sortable: true, filter: true }, pagination: true, paginationPageSize: 10,
            onGridReady: p => { self.gridApi = p.api; }
        });
    };
}
$(document).ready(() => { let v = new FincaList(); v.InitView(); });
