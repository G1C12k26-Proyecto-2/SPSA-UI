function EditarFinca() {
    this.InitView = () => {
        $('#btnGuardar').click(() => {
            ShowConfirm('Guardar cambios', '¿Desea guardar los cambios en la finca?', () => {
                // TODO: $.ajax({ url: API_URL_BASE + "/api/Fincas/Update", method:"PUT", ... })
                ShowSuccess('Guardado', 'Los cambios fueron guardados.');
                setTimeout(() => { window.location = '/Fincas'; }, 1500);
            });
        });
    };
}
$(document).ready(() => { let v = new EditarFinca(); v.InitView(); });
