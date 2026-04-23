function CrearFinca() {
    this.InitView = () => {
        // Chip selection
        $(document).on('click', '.psa-chip', function () {
            const group = $(this).closest('.psa-chip-group');
            if (group.data('multi') === true) {
                $(this).toggleClass('selected');
            } else {
                group.find('.psa-chip').removeClass('selected');
                $(this).addClass('selected');
            }
        });

        $('#btnEnviar').click(() => this.Submit());
        $('#btnBorrador').click(() => { ShowSuccess('Borrador guardado', 'Se guardó como borrador.'); });
    };
    this.Submit = () => {
        let nombre = $('#txtNombre').val();
        let hectareas = $('#txtHectareas').val();
        if (!nombre || !hectareas) { ShowError('Campos requeridos', 'Nombre y hectáreas son obligatorios.'); return; }
        // TODO: $.ajax({ url: API_URL_BASE + "/api/Fincas/Create", method:"POST", ... })
        ShowConfirm('Enviar solicitud', '¿Está seguro de enviar la solicitud? Una vez enviada, pasará a revisión.', () => {
            ShowSuccess('Solicitud enviada', 'Su finca fue registrada y está pendiente de revisión.');
            setTimeout(() => { window.location = '/Fincas'; }, 2000);
        });
    };
}
$(document).ready(() => { let v = new CrearFinca(); v.InitView(); });
