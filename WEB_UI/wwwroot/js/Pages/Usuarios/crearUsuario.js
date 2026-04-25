const API_URL = "https://spsaapi.azurewebsites.net";


function crearUsuario() {
    const nombre = $('#txtNombre').val().trim();
    const email = $('#txtEmail').val().trim();
    const usuario = $('#txtUsuario').val().trim();
    const password = $('#txtPassword').val();
    const confirmar = $('#txtConfirmar').val();
    const rol = $('#ddRol').val();
    const activo = $('#ddEstado').val() === 'true';
    const btn = $('#btnCrear');

    if (!nombre || !email || !usuario || !password || !confirmar || !rol) {
        ShowError('Campos incompletos', 'Por favor completá todos los campos.');
        return;
    }

    if (password !== confirmar) {
        ShowError('Error', 'Las contraseñas no coinciden.');
        return;
    }

    if (password.length < 6) {
        ShowError('Error', 'La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    btn.prop('disabled', true);
    btn.html('<i class="fas fa-spinner fa-spin"></i> Creando...');

    const user = {
        userName: usuario,
        password: password,
        fullName: nombre,
        email: email,
        active: activo,
        rol: rol
    };

    $.ajax({
        url: API_URL + "/api/Auth/CreateUserWithRole",
        method: "POST",
        dataType: "json",
        contentType: "application/json;charset=utf-8",
        data: JSON.stringify(user)
    }).done(function (data) {

        if (data.result === "ok") {
            ShowSuccess('Usuario creado', 'El usuario fue creado exitosamente.');

            setTimeout(function () {
                window.location.href = '/Usuarios/Index';
            }, 2000);

        } else {
            ShowError('Error', data.message || 'No se pudo crear el usuario.');
        }

    }).fail(function (xhr) {
        console.error("Error AJAX:", xhr);
        ShowError('Error de conexión', 'No se pudo conectar con el servidor.');

    }).always(function () {
        btn.prop('disabled', false);
        btn.html('<i class="fas fa-save"></i> Crear Usuario');
    });
}