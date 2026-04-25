function EditarFinca() {
    const self = this;

    this.InitView = () => {
        const id = window.location.pathname.split('/').pop();
        self.LoadData(id);
        $('#btnGuardar').on('click', () => self.GuardarCambios(id));
    };

    this.LoadData = (id) => {
        $.ajax({
            url: `${API_URL_BASE}/api/Solicitudes/GetById/${id}`,
            type: 'GET',
            success: (res) => {
                if (res.result === 'ok') {
                    const d = res.data;
                    $('#txtNombre').val(d.nombreFinca);
                    $('#txtHectareas').val(d.hectareasOriginal);
                    $('#txtNacientes').val(d.cantidadNacientesOriginal);
                    $('#txtUsoSuelo').val(d.usoSueloOriginal);

                    // Chips de selección
                    self.SetChip('vegetacion', d.tipoVegetacionOriginal);
                    self.SetChip('pendiente', d.pendienteOriginal);
                    self.SetChip('hidrico', d.tieneRiosQuebradasOriginal === true ? 'true' : 'false');

                    // Provincia/Cantón/Distrito (solo texto por ahora)
                    $('#txtProvincia').val(d.provincia);
                    $('#txtCanton').val(d.canton);
                    $('#txtDistrito').val(d.distrito);
                } else {
                    Swal.fire('Error', res.message || 'No se pudo cargar la finca.', 'error');
                }
            },
            error: () => Swal.fire('Error', 'No se pudo conectar con el servidor.', 'error')
        });
    };

    this.SetChip = (grupo, valor) => {
        $(`.chip-option[data-grupo="${grupo}"]`).removeClass('selected');
        $(`.chip-option[data-grupo="${grupo}"][data-valor="${valor}"]`).addClass('selected');
    };

    this.GuardarCambios = (id) => {
        Swal.fire({
            title: '¿Guardar cambios?',
            text: 'Se actualizará la información de la finca.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, guardar',
            cancelButtonText: 'Cancelar'
        }).then(result => {
            if (!result.isConfirmed) return;

            const payload = {
                idSolicitud: parseInt(id),
                nombreFinca: $('#txtNombre').val(),
                hectareasOriginal: parseFloat($('#txtHectareas').val()) || null,
                cantidadNacientesOriginal: parseInt($('#txtNacientes').val()) || null,
                usoSueloOriginal: $('#txtUsoSuelo').val(),
                tipoVegetacionOriginal: $(`.chip-option[data-grupo="vegetacion"].selected`).data('valor') || null,
                pendienteOriginal: $(`.chip-option[data-grupo="pendiente"].selected`).data('valor') || null,
                tieneRiosQuebradasOriginal: $(`.chip-option[data-grupo="hidrico"].selected`).data('valor') === 'true'
            };

            $.ajax({
                url: `${API_URL_BASE}/api/Solicitudes/Update`,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(payload),
                success: (res) => {
                    if (res.result === 'ok') {
                        Swal.fire('Éxito', 'Finca actualizada correctamente.', 'success')
                            .then(() => window.location.href = '/Fincas');
                    } else {
                        Swal.fire('Error', res.message || 'No se pudo actualizar.', 'error');
                    }
                },
                error: () => Swal.fire('Error', 'No se pudo conectar con el servidor.', 'error')
            });
        });
    };
}

$(document).ready(() => { let v = new EditarFinca(); v.InitView(); });
