function FincaList() {
    this.gridApi = null;
    this.allData = [];
    this.InitView = () => {
        this.LoadGrid();
        $('#txtSearch').on('input', () => {
            if (this.gridApi) this.gridApi.setGridOption('quickFilterText', $('#txtSearch').val());
        });
        $('#selectEstado').on('change', () => this.ApplyFilters());
        $('#selectProvincia').on('change', () => this.ApplyFilters());
    };
    this.ApplyFilters = () => {
        const estado = $('#selectEstado').val();
        const provincia = $('#selectProvincia').val();
        let filtered = this.allData;
        if (estado) filtered = filtered.filter(f => f.estado === estado);
        if (provincia) filtered = filtered.filter(f => f.provincia === provincia);
        if (this.gridApi) this.gridApi.setGridOption('rowData', filtered);
    };
    this.LoadGrid = () => {
        const self = this;
        const colDefs = [
            {
                headerName: 'Finca', field: 'nombreFinca', flex: 2,
                cellRenderer: p => {
                    const fecha = p.data.fechaSolicitud ? new Date(p.data.fechaSolicitud).toLocaleDateString('es-CR') : '—';
                    return `<div><div style="font-weight:500;">${p.value || '—'}</div><div style="font-size:0.68rem;color:#5c6b60;">Registrada: ${fecha}</div></div>`;
                }
            },
            {
                headerName: 'Ubicación', flex: 1,
                cellRenderer: p => `<div><div style="font-weight:500;">${p.data.provincia || '—'}</div><div style="font-size:0.68rem;color:#5c6b60;">${p.data.canton || ''}</div></div>`
            },
            { headerName: 'Hectáreas', field: 'hectareasOriginal', flex: 1 },
            { headerName: 'Vegetación', field: 'tipoVegetacionOriginal', flex: 1 },
            {
                headerName: 'Estado', field: 'estado', flex: 1,
                cellRenderer: p => {
                    const c = { 'Pendiente': 'gold', 'En Evaluación': 'purple', 'Aprobada': 'green', 'Rechazada': 'red', 'PSA Activo': 'green' }[p.value] || 'muted';
                    return `<span class="psa-badge psa-badge-${c}">${p.value || '—'}</span>`;
                }
            },
            {
                headerName: 'Pago Mensual', field: 'pagoMensual', flex: 1,
                cellRenderer: p => p.value ? `<span style="font-weight:600;font-family:'Fraunces',serif;">₡${Number(p.value).toLocaleString('es-CR')}</span>` : '<span style="color:#5c6b60;">—</span>'
            },
            {
                headerName: '', width: 130, sortable: false, filter: false,
                cellRenderer: p => {
                    const editable = ['Pendiente', 'En Evaluación'].includes(p.data.estado);
                    const editBtn = editable ? `<a href="/Fincas/Editar/${p.data.idSolicitud}" class="btn btn-outline-psa btn-sm" style="font-size:0.68rem;padding:1px 8px;">Editar</a>` : '';
                    return `<a href="/Fincas/Detalle/${p.data.idSolicitud}" class="btn btn-psa btn-sm me-1" style="font-size:0.68rem;padding:1px 8px;">Ver</a>${editBtn}`;
                }
            }
        ];
        agGrid.createGrid(document.querySelector('#gridFincas'), {
            columnDefs: colDefs,
            rowData: [],
            rowHeight: 55,
            defaultColDef: { sortable: true, filter: true },
            pagination: true,
            paginationPageSize: 10,
            onGridReady: p => {
                self.gridApi = p.api;
                const user = JSON.parse(sessionStorage.getItem('user'));
                self.FetchData(user.id);
            }
        });
    };

    this.FetchData = (usuarioId) => {
        const self = this;
        $.ajax({
            url: `${API_URL_BASE}/api/Solicitudes?usuarioId=${usuarioId}`,
            type: 'GET',
            success: res => {
                if (res.result === 'ok') {
                    self.allData = (res.data || []).filter(f => f.estado !== 'Borrador');
                    self.gridApi.setGridOption('rowData', self.allData);
                    self.UpdateStatCards(self.allData);
                } else {
                    Swal.fire('Error', res.message || 'No se pudieron cargar las fincas.', 'error');
                }
            },
            error: () => Swal.fire('Error', 'No se pudo conectar con el servidor.', 'error')
        });
    };

    this.UpdateStatCards = (data) => {
        const total = data.length;
        const activas = data.filter(f => f.estado === 'Activo' || f.estado === 'Aprobado').length;
        const enProceso = data.filter(f => f.estado === 'Pendiente' || f.estado === 'EnProceso').length;
        const hectareas = data.reduce((sum, f) => sum + (f.hectareasOriginal || 0), 0);
        $('#statTotalFincas').text(total);
        $('#statActivas').text(activas);
        $('#statEnProceso').text(enProceso);
        $('#statHectareas').text(Math.round(hectareas * 10) / 10);
    };
}
$(document).ready(() => { let v = new FincaList(); v.InitView(); });
