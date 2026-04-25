function DatosBancarios() {
    const self = this;
    const API = API_URL_BASE;

    this.InitView = () => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        self.LoadData(user.id);
        $('#btnEditar').on('click', () => self.MostrarModal());
        $('#btnGuardar').on('click', () => self.Guardar());
    };

    this.LoadData = (usuarioId) => {
        $.ajax({
            url: `${API}/api/DatosBancarios/GetByUsuario/${usuarioId}`,
            method: 'GET',
            success: (res) => {
                if (res.result === 'ok') {
                    const d = res.data;
                    $('#txtTitular').text(d.nombreTitular);
                    $('#txtCedula').text(d.cedulaTitular);
                    $('#txtBanco').text(d.banco);
                    $('#txtTipoCuenta').text(d.tipoCuenta);
                    $('#txtCuenta').text(d.numeroCuenta.slice(0, -4) + '****');
                    $('#txtFechaRegistro').text(new Date(d.fechaRegistro).toLocaleDateString('es-CR'));
                    $('#sinDatos').hide();
                    $('#conDatos').show();
                    $('#btnEditarTexto').text('Editar Información Bancaria');
                } else {
                    $('#sinDatos').show();
                    $('#conDatos').hide();
                    $('#btnEditarTexto').text('Registrar Datos Bancarios');
                }
            },
            error: () => {
                $('#sinDatos').show();
                $('#conDatos').hide();
            }
        });
    };

    this.MostrarModal = () => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        $.ajax({
            url: `${API}/api/DatosBancarios/GetByUsuario/${user.id}`,
            method: 'GET',
            success: (res) => {
                if (res.result === 'ok') {
                    const d = res.data;
                    $('#modalTitular').val(d.nombreTitular);
                    $('#modalCedula').val(d.cedulaTitular);
                    $('#modalBanco').val(d.banco);
                    $('#modalTipoCuenta').val(d.tipoCuenta);
                    $('#modalCuenta').val(d.numeroCuenta);
                }
            }
        });
        $('#modalDatosBancarios').modal('show');
    };

    this.Guardar = () => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        const payload = {
            usuarioId: user.id,
            nombreTitular: $('#modalTitular').val(),
            cedulaTitular: $('#modalCedula').val(),
            banco: $('#modalBanco').val(),
            tipoCuenta: $('#modalTipoCuenta').val(),
            numeroCuenta: $('#modalCuenta').val()
        };

        if (!payload.nombreTitular || !payload.cedulaTitular || !payload.banco || !payload.tipoCuenta || !payload.numeroCuenta) {
            Swal.fire('Campos requeridos', 'Por favor completá todos los campos.', 'warning');
            return;
        }

        $.ajax({
            url: `${API}/api/DatosBancarios/Upsert`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: (res) => {
                if (res.result === 'ok') {
                    $('#modalDatosBancarios').modal('hide');
                    Swal.fire('Guardado', res.message, 'success').then(() => self.LoadData(user.id));
                } else {
                    Swal.fire('Error', res.message, 'error');
                }
            },
            error: () => Swal.fire('Error', 'No se pudo conectar con el servidor.', 'error')
        });
    };
}

const datosBancarios = new DatosBancarios();
datosBancarios.InitView();
