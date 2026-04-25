const API_URL = "https://awakatech-bzb3evdgapcdchc5.canadacentral-01.azurewebsites.net";

let gridApiAuditoria = null;
let todosLosRegistros = [];

function AuditoriaGrid() {
    this.InitView = () => {
        this.LoadGrid();
    };

    this.LoadGrid = () => {
        const colDefs = [
            { field: "fechaCambio", headerName: "Fecha", flex: 1 },
            { field: "usuarioNombre", headerName: "Usuario", flex: 1 },
            {
                field: "accion", headerName: "Acción", flex: 1.2,
                cellRenderer: p => {
                    const c = { 'Pago ejecutado': 'green', 'Usuario creado': 'blue', 'Parámetro editado': 'gold', 'Solicitud rechazada': 'red', 'Solicitud aprobada': 'green', 'Inicio sesión': 'blue' }[p.value] || 'muted';
                    return `<span class="psa-badge psa-badge-${c}">${p.value}</span>`;
                }
            },
            { field: "modulo", headerName: "Módulo", flex: 1 },
            { field: "descripcion", headerName: "Descripción", flex: 1.5 }
        ];

        $.ajax({
            url: `${API_URL}/api/Auditoria/GetAll`,
            type: 'GET',
            success: function (json) {
                if (json.result === "ok") todosLosRegistros = json.data;

                const gridDiv = document.querySelector('#gridAuditoria');
                agGrid.createGrid(gridDiv, {
                    columnDefs: colDefs,
                    rowData: todosLosRegistros,
                    rowSelection: 'single',
                    rowHeight: 45,
                    defaultColDef: { sortable: true, filter: true },
                    pagination: true,
                    paginationPageSize: 10,
                    onGridReady: p => { gridApiAuditoria = p.api; }
                });

                function aplicarFiltros() {
                    const texto = document.getElementById('auditoriaSearch').value.toLowerCase();
                    const modulo = document.getElementById('auditoriaModulo').value;
                    const accion = document.getElementById('auditoriaAccion').value;
                    const fecha = document.getElementById('auditoriaFecha').value;

                    const filtrado = todosLosRegistros.filter(r => {
                        const matchTexto = texto === '' ||
                            (r.usuarioNombre ?? '').toLowerCase().includes(texto) ||
                            (r.accion ?? '').toLowerCase().includes(texto);
                        const matchModulo = modulo === '' || r.modulo === modulo;
                        const matchAccion = accion === '' || r.accion === accion;
                        const matchFecha = fecha === '' || (r.fechaCambio ?? '').startsWith(fecha);
                        return matchTexto && matchModulo && matchAccion && matchFecha;
                    });
                    gridApiAuditoria.setGridOption('rowData', filtrado);
                }

                document.getElementById('auditoriaSearch').addEventListener('input', aplicarFiltros);
                document.getElementById('auditoriaModulo').addEventListener('change', aplicarFiltros);
                document.getElementById('auditoriaAccion').addEventListener('change', aplicarFiltros);
                document.getElementById('auditoriaFecha').addEventListener('change', aplicarFiltros);
            },
            error: function (e) {
                console.error("Error cargando auditoría", e);
            }
        });
    };
}

$(document).ready(() => { let v = new AuditoriaGrid(); v.InitView(); });