const API_URL = "https://spsaapi.azurewebsites.net";

let gridApiPagos = null;
let todosLosPagos = [];

function PagosReporteGrid() {
    this.InitView = () => {
        this.LoadGrid();
    };

    this.LoadGrid = () => {
        const self = this;
        const colDefs = [
            { field: "nombreFinca", headerName: "Finca", flex: 1 },
            { field: "propietario", headerName: "Propietario", flex: 1 },
            { field: "provincia", headerName: "Provincia", flex: 0.8 },
            { field: "canton", headerName: "Cantón", flex: 0.8 },
            { field: "fechaSolicitud", headerName: "Fecha", flex: 0.8 },
            {
                field: "pagoMensual", headerName: "Monto", flex: 0.8,
                cellRenderer: p => p.value ? `<span style="font-weight:600;">₡${Number(p.value).toLocaleString()}</span>` : '—'
            },
            {
                field: "estado", headerName: "Estado",
                cellRenderer: p => {
                    const c = { 'Aprobada': 'green', 'Pagada': 'blue', 'Pendiente': 'gold', 'En Proceso': 'gold', 'Rechazada': 'red' }[p.value] || 'muted';
                    return `<span class="psa-badge psa-badge-${c}">${p.value}</span>`;
                }
            }
        ];

        $.ajax({
            url: `${API_URL}/api/Pago/GetAll`,
            type: 'GET',
            success: function (json) {
                if (json.result === "ok") todosLosPagos = json.data;

                const totalPagado = todosLosPagos.reduce((sum, r) => sum + (r.pagoMensual ?? 0), 0);
                const totalAprobados = todosLosPagos.filter(r => r.estado === 'Aprobada').length;
                const totalProcesados = todosLosPagos.filter(r => r.estado === 'Pagada').length;

                document.getElementById('totalPagado').textContent = `₡${Number(totalPagado).toLocaleString()}`;
                document.getElementById('totalAprobados').textContent = totalAprobados;
                document.getElementById('totalProcesados').textContent = totalProcesados;

                const cantones = [...new Set(todosLosPagos.map(r => r.canton).filter(c => c))];
                const selectCanton = document.getElementById('filtroCantonReporte');
                cantones.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c;
                    opt.textContent = c;
                    selectCanton.appendChild(opt);
                });

                const gridDiv = document.querySelector('#gridReportePagos');
                agGrid.createGrid(gridDiv, {
                    columnDefs: colDefs,
                    rowData: todosLosPagos,
                    rowSelection: 'single',
                    rowHeight: 45,
                    defaultColDef: { sortable: true, filter: true },
                    pagination: true,
                    paginationPageSize: 10,
                    onGridReady: p => { gridApiPagos = p.api; }
                });

                function aplicarFiltros() {
                    const provincia = document.getElementById('filtroProvinciaReporte').value;
                    const canton = document.getElementById('filtroCantonReporte').value;
                    const estado = document.getElementById('filtroEstadoReporte').value;
                    const filtrado = todosLosPagos.filter(r =>
                        (provincia === '' || r.provincia === provincia) &&
                        (canton === '' || r.canton === canton) &&
                        (estado === '' || r.estado === estado)
                    );
                    gridApiPagos.setGridOption('rowData', filtrado);
                }

                document.getElementById('filtroProvinciaReporte').addEventListener('change', aplicarFiltros);
                document.getElementById('filtroCantonReporte').addEventListener('change', aplicarFiltros);
                document.getElementById('filtroEstadoReporte').addEventListener('change', aplicarFiltros);

                document.getElementById('btnExportarPagos').addEventListener('click', function () {
                    const filas = [['Finca', 'Propietario', 'Provincia', 'Canton', 'Fecha', 'Monto', 'Estado']];
                    todosLosPagos.forEach(r => {
                        filas.push([
                            r.nombreFinca ?? '',
                            r.propietario ?? '',
                            r.provincia ?? '',
                            r.canton ?? '',
                            r.fechaSolicitud ?? '',
                            r.pagoMensual ?? '',
                            r.estado ?? ''
                        ]);
                    });
                    const csv = filas.map(f => f.join(',')).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'reporte_pagos.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                });
            },
            error: function (e) {
                console.error("Error cargando pagos", e);
            }
        });
    };
}

$(document).ready(() => { let v = new PagosReporteGrid(); v.InitView(); });