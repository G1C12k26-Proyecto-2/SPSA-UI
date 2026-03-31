function UsuariosListaGrid() {
    this.InitView = () => {
        this.LoadGrid();
    };

    this.LoadGrid = () => {
        const self = this;
        const colDefs = [
            { field: "usuario", headerName: "Usuario", flex: 1 },
            { field: "correo", headerName: "Correo", flex: 1.5 },
            {
                field: "rol", headerName: "Rol", flex: 1,
                cellRenderer: p => {
                    const c = { 'Administrador': 'green', 'Ingeniero': 'gold', 'Dueño': 'blue' }[p.value] || 'muted';
                    return `<span class="psa-badge psa-badge-${c}">${p.value}</span>`;
                }
            },
            { field: "permisos", headerName: "Permisos", flex: 1 },
            {
                field: "estado", headerName: "Estado", flex: 0.8,
                cellRenderer: p => {
                    const c = p.value === 'Activo' ? 'blue' : 'muted';
                    return `<span class="psa-badge psa-badge-${c}">${p.value}</span>`;
                }
            },
            {
                headerName: "", width: 80, sortable: false, filter: false,
                cellRenderer: p => `<a href="/Usuarios/Editar/${p.data.id}" class="psa-card-action">Editar →</a>`
            }
        ];

        const data = [
            { usuario: "María González", correo: "maria.gonzalez@psa.cr", rol: "Administrador", permisos: "Acceso total", estado: "Activo", id: 1 },
            { usuario: "Juan Pérez", correo: "juan.perez@psa.cr", rol: "Ingeniero", permisos: "Evaluación, reportes", estado: "Activo", id: 2 },
            { usuario: "Ana Rodríguez", correo: "ana.rodriguez@psa.cr", rol: "Dueño", permisos: "Ver fincas y pagos propios", estado: "Inactivo", id: 3 }
        ];

        const gridDiv = document.querySelector('#gridUsuarios');
        agGrid.createGrid(gridDiv, {
            columnDefs: colDefs, rowData: data, rowSelection: 'single', rowHeight: 45,
            defaultColDef: { sortable: true, filter: true }, pagination: true, paginationPageSize: 10,
            onGridReady: p => { self.gridApi = p.api; }
        });
    };
}

$(document).ready(() => { let v = new UsuariosListaGrid(); v.InitView(); });
