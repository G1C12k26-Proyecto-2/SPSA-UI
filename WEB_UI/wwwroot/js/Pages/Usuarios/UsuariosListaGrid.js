const API_URL = "https://spsaapi.azurewebsites.net";

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
                    const colores = {
                        'Admin': 'green',
                        'Funcionario': 'gold',
                        'Propietario': 'blue'
                    };
                    const etiquetas = {
                        'Admin': 'Administrador',
                        'Funcionario': 'Ing. Forestal',
                        'Propietario': 'Dueño de Finca'
                    };
                    const c = colores[p.value] || 'muted';
                    const label = etiquetas[p.value] || p.value;
                    return `<span class="psa-badge psa-badge-${c}">${label}</span>`;
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
                headerName: "Acciones", width: 160, minWidth: 160, sortable: false, filter: false,
                cellRenderer: p => {
                    const esActivo = p.data.activo;
                    const btnEstado = esActivo
                        ? `<button onclick="toggleEstado(${p.data.id}, false)" class="btn btn-outline-psa btn-sm" style="font-size:0.65rem;padding:1px 6px;margin-left:4px;">Desactivar</button>`
                        : `<button onclick="toggleEstado(${p.data.id}, true)" class="btn btn-psa btn-sm" style="font-size:0.65rem;padding:1px 6px;margin-left:4px;">Activar</button>`;
                    return `<a href="/Usuarios/Editar/${p.data.id}" class="btn btn-psa btn-sm" style="font-size:0.65rem;padding:1px 8px;">Ver</a>${btnEstado}`;
                }
            }
        ];

        const gridDiv = document.querySelector('#gridUsuarios');
        const gridInstance = agGrid.createGrid(gridDiv, {
            columnDefs: colDefs,
            rowData: [],
            rowSelection: 'single',
            rowHeight: 45,
            defaultColDef: { sortable: true, filter: true },
            pagination: true,
            paginationPageSize: 10,
            overlayLoadingTemplate: '<span class="ag-overlay-loading-center">Cargando usuarios...</span>',
            onGridReady: p => {
                self.gridApi = p.api;
                self.gridApi.showLoadingOverlay();
                self.FetchUsuarios();
            }
        });
    };

    this.FetchUsuarios = () => {
        const self = this;

        $.ajax({
            url: API_URL + "/api/Auth/GetAllUsers",
            method: "GET",
            dataType: "json"
        }).done(function (response) {
            if (response.result === "ok") {
                const data = response.data.map(u => ({
                    id: u.id,
                    activo: u.active,
                    usuario: u.fullName,
                    correo: u.email,
                    rol: u.rol,
                    permisos: u.rol === 'Admin' ? 'Acceso total' :
                        u.rol === 'Funcionario' ? 'Evaluación, reportes' :
                            'Ver fincas y pagos propios',
                    estado: u.active ? 'Activo' : 'Inactivo'
                }));
                self.gridApi.setGridOption('rowData', data);
            } else {
                ShowError('Error', response.message || 'No se pudieron cargar los usuarios.');
            }
        }).fail(function () {
            ShowError('Error de conexión', 'No se pudo conectar con el servidor.');
        });
    };
}

function toggleEstado(id, activar) {
    const accion = activar ? 'activar' : 'desactivar';
    Swal.fire({
        title: `¿${activar ? 'Activar' : 'Desactivar'} usuario?`,
        text: `¿Estás seguro de que querés ${accion} este usuario?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, continuar',
        cancelButtonText: 'Cancelar'
    }).then(result => {
        if (!result.isConfirmed) return;

        const endpoint = activar ? `/api/Auth/ActivateUser/${id}` : `/api/Auth/DeactivateUser/${id}`;

        $.ajax({
            url: API_URL + endpoint,
            method: "PUT",
            dataType: "json"
        }).done(function (response) {
            if (response.result === "ok") {
                ShowSuccess('Listo', `Usuario ${activar ? 'activado' : 'desactivado'} correctamente.`);
                setTimeout(() => location.reload(), 1500);
            } else {
                ShowError('Error', response.message || 'No se pudo completar la acción.');
            }
        }).fail(function () {
            ShowError('Error de conexión', 'No se pudo conectar con el servidor.');
        });
    });
}

$(document).ready(() => { let v = new UsuariosListaGrid(); v.InitView(); });