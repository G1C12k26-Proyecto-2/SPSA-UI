function DetalleFinca() {
    const self = this;

    this.InitView = () => {
        const id = window.location.pathname.split('/').pop();
        self.LoadData(id);
    };

    this.LoadData = (id) => {
        $.ajax({
            url: `${API_URL_BASE}/api/Solicitudes/GetById/${id}`,
            type: 'GET',
            success: (res) => {
                if (res.result === 'ok') {
                    const d = res.data;
                    $('#detNombre').text(d.nombreFinca || '—');
                    $('#detEstado').text(d.estado || '—');
                    $('#detProvincia').text(d.provincia || '—');
                    $('#detCanton').text(d.canton || '—');
                    $('#detDistrito').text(d.distrito || '—');
                    $('#detHectareas').text(d.hectareasOriginal ?? '—');
                    $('#detVegetacion').text(d.tipoVegetacionOriginal || '—');
                    $('#detPendiente').text(d.pendienteOriginal || '—');
                    $('#detHidrico').text(d.tieneRiosQuebradasOriginal ? 'Sí' : 'No');
                    $('#detNacientes').text(d.cantidadNacientesOriginal ?? '—');
                    $('#detUsoSuelo').text(d.usoSueloOriginal || '—');
                    $('#detFecha').text(d.fechaSolicitud ? new Date(d.fechaSolicitud).toLocaleDateString('es-CR') : '—');
                    $('#detPago').text(d.pagoMensual != null ? `₡${d.pagoMensual.toLocaleString('es-CR')}` : '—');
                    $('#detPropietario').text(d.propietario || '—');
                } else {
                    Swal.fire('Error', res.message || 'No se pudo cargar la finca.', 'error');
                }
            },
            error: () => Swal.fire('Error', 'No se pudo conectar con el servidor.', 'error')
        });
    };
}

$(document).ready(() => { let v = new DetalleFinca(); v.InitView(); });
