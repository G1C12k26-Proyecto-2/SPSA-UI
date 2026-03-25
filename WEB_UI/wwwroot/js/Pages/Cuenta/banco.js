function ActualizarBanco() {
    this.InitView = () => {
        $('#btnGuardar').click(() => this.Submit());
    };
    this.Submit = () => {
        let banco = $('#ddBanco').val();
        let cuenta = $('#txtCuenta').val();
        let confirmar = $('#txtConfirmar').val();
        if (!banco || !cuenta) { ShowError('Campos requeridos', 'Seleccione banco e ingrese número de cuenta.'); return; }
        if (cuenta !== confirmar) { ShowError('Cuentas no coinciden', 'El número de cuenta y la confirmación no coinciden.'); return; }


        ShowConfirm('Guardar datos bancarios', '¿Confirma que los datos son correctos? Los pagos se depositarán en esta cuenta.', () => {
            ShowSuccess('Datos guardados', 'Su cuenta bancaria fue registrada exitosamente.');
        });
    };
}
$(document).ready(() => { let v = new ActualizarBanco(); v.InitView(); });
