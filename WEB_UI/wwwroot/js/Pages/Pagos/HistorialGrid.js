const API_URL = "https://spsaapi.azurewebsites.net";

let gridApi = null;
let todosLosDatos = [];

function PagosHistorialGrid() {
    this.InitView = () => {
        this.LoadGrid();
    };

    this.LoadGrid = () => {
        const colDefs = [
            { field: "nombreFinca", headerName: "Finca", flex: 1 },
            { field: "propietario", headerName: "Propietario", flex: 1 },
            { field: "fechaSolicitud", headerName: "Fecha", flex: 0.8 },
            {
                field: "pagoMensual", headerName: "Monto", flex: 0.8,
                cellRenderer: p => p.value ? `<span style="font-weight:600;">₡${Number(p.value).toLocaleString()}</span>` : '—'
            },
            { field: "provincia", headerName: "Provincia", flex: 0.8 },
            {
                field: "estado", headerName: "Estado",
                cellRenderer: p => {
                    const c = p.value === 'Pagada' ? 'green' : 'gold';
                    return `<span class="psa-badge psa-badge-${c}">${p.value}</span>`;
                }
            }
        ];

        $.ajax({
            url: `${API_URL}/api/Pago/GetAll`,
            type: 'GET',
            success: function (json) {
                if (json.result === "ok") todosLosDatos = json.data;

                const gridDiv = document.querySelector('#gridPagosHistorial');
                agGrid.createGrid(gridDiv, {
                    columnDefs: colDefs,
                    rowData: todosLosDatos,
                    rowSelection: 'single',
                    rowHeight: 45,
                    defaultColDef: { sortable: true, filter: true },
                    pagination: true,
                    paginationPageSize: 10,
                    onGridReady: p => { gridApi = p.api; }
                });

                document.getElementById('pagosEstado').addEventListener('change', function () {
                    const estado = this.value;
                    if (estado === '') {
                        gridApi.setGridOption('rowData', todosLosDatos);
                    } else {
                        gridApi.setGridOption('rowData', todosLosDatos.filter(r => r.estado === estado));
                    }
                });

                document.getElementById('pagosSearch').addEventListener('input', function () {
                    const texto = this.value.toLowerCase();
                    const filtrado = todosLosDatos.filter(r =>
                        (r.nombreFinca ?? '').toLowerCase().includes(texto) ||
                        (r.propietario ?? '').toLowerCase().includes(texto)
                    );
                    gridApi.setGridOption('rowData', filtrado);
                });

                document.getElementById('btnExportar').addEventListener('click', function () {
                    const filas = [['Finca', 'Propietario', 'Fecha', 'Monto', 'Provincia', 'Estado']];
                    todosLosDatos.forEach(r => {
                        filas.push([
                            r.nombreFinca ?? '',
                            r.propietario ?? '',
                            r.fechaSolicitud ?? '',
                            r.pagoMensual ?? '',
                            r.provincia ?? '',
                            r.estado ?? ''
                        ]);
                    });
                    const csv = filas.map(f => f.join(',')).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'historial_pagos.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                });
            },
            error: function (e) {
                console.error("Error cargando historial", e);
            }
        });
    };
}

$(document).ready(() => { let v = new PagosHistorialGrid(); v.InitView(); });