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

                    $('#txtProvincia').val(d.provincia).data('id', d.idProvincia);
                    $('#txtCanton').val(d.canton).data('id', d.idCanton);
                    $('#txtDistrito').val(d.distrito).data('id', d.idDistrito);
                    self.LoadDocumentos(d);
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

    this.LoadDocumentos = (d) => {
        const fotos = d.fotosUrls || [];
        const docs = d.documentosUrls || [];
        if (fotos.length === 0 && docs.length === 0) {
            $('#sinArchivos').show();
            return;
        }
        if (fotos.length > 0) {
            let html = '<p class="fw-medium mb-2"><i class="fas fa-images me-1"></i> Fotografías</p><div class="d-flex flex-wrap gap-2 mb-3">';
            fotos.forEach((url, i) => {
                html += `<a href="${url}" target="_blank"><img src="${url}" alt="Foto ${i+1}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;border:1px solid #dee2e6;"></a>`;
            });
            html += '</div>';
            $('#listaFotos').html(html);
        }
        if (docs.length > 0) {
            let html = '';
            docs.forEach((url) => {
                const nombre = decodeURIComponent(url.split('/').pop().split('?')[0]);
                html += `<div class="d-flex align-items-center gap-3 p-2 bg-light rounded mb-2">
                <i class="fas fa-file-pdf text-danger fs-5"></i>
                <div class="flex-grow-1">
                    <div style="font-size:0.82rem;font-weight:500;">${nombre}</div>
                </div>
                <a href="${url}" target="_blank" class="btn btn-outline-psa btn-sm"><i class="fas fa-download"></i></a>
            </div>`;
            });
            $('#listaDocumentos').html(html);
        }
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

            const hidrico = $(`.chip-option[data-grupo="hidrico"].selected`).data('valor');
            const payload = {
                idSolicitud: parseInt(id),
                nombreFinca: $('#txtNombre').val(),
                idProvincia: parseInt($('#txtProvincia').data('id')) || null,
                idCanton: parseInt($('#txtCanton').data('id')) || null,
                idDistrito: parseInt($('#txtDistrito').data('id')) || null,
                hectareasOriginal: parseFloat($('#txtHectareas').val()) || null,
                cantidadNacientesOriginal: parseInt($('#txtNacientes').val()) || null,
                usoSueloOriginal: $('#txtUsoSuelo').val(),
                tipoVegetacionOriginal: $(`.chip-option[data-grupo="vegetacion"].selected`).data('valor') || null,
                pendienteOriginal: $(`.chip-option[data-grupo="pendiente"].selected`).data('valor') || null,
                tieneRiosQuebradasOriginal: hidrico === undefined ? null : hidrico === 'true'
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
