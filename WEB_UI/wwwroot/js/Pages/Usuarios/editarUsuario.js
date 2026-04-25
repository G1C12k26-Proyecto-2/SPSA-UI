const API_URL = "https://spsaapi.azurewebsites.net";

function EditarUsuarioView() {

    this.usuarioActual = null;

    this.InitView = () => {
        this.CargarUsuario();
        $('#btnGuardar').click(() => this.GuardarCambios());
        $('#btnToggleEstado').click(() => this.ToggleEstado());
    };

    this.ObtenerIdDesdUrl = () => {
        const partes = window.location.pathname.split('/');
        const id = parseInt(partes[partes.length - 1]);
        return isNaN(id) ? null : id;
    };

    this.CargarUsuario = () => {
        const id = this.ObtenerIdDesdUrl();

        if (!id) {
            ShowError('Error', 'No se encontró el ID del usuario en la URL.');
            return;
        }

        $.ajax({
            url: API_URL + "/api/Auth/GetUserById/" + id,
            method: "GET",
            dataType: "json"
        }).done((response) => {
            if (response.result === "ok") {
                const u = response.data;
                this.usuarioActual = u;

                $('#txtId').val(u.id);
                $('#txtNombre').val(u.fullName);
                $('#txtEmail').val(u.email);
                $('#txtUsuario').val(u.userName);
                $('#ddRol').val(u.rol);
                $('#ddEstado').val(u.active ? 'true' : 'false');

                const badge = $('#badgeEstado');
                if (u.active) {
                    badge.text('Activo').removeClass('psa-badge-muted').addClass('psa-badge-blue');
                    $('#btnToggleEstado').text('Desactivar usuario').removeClass('btn-psa').addClass('btn-outline-psa');
                } else {
                    badge.text('Inactivo').removeClass('psa-badge-blue').addClass('psa-badge-muted');
                    $('#btnToggleEstado').text('Activar usuario').removeClass('btn-outline-psa').addClass('btn-psa');
                }

            } else {
                ShowError('Error', response.message || 'No se pudo cargar el usuario.');
            }
        }).fail(() => {
            ShowError('Error de conexión', 'No se pudo conectar con el servidor.');
        });
    };

    this.GuardarCambios = () => {
        const id = parseInt($('#txtId').val());
        const nombre = $('#txtNombre').val().trim();
        const email = $('#txtEmail').val().trim();
        const usuario = $('#txtUsuario').val().trim();
        const rol = $('#ddRol').val();
        const activo = $('#ddEstado').val() === 'true';

        if (!nombre || !email || !usuario || !rol) {
            ShowError('Campos incompletos', 'Por favor completá todos los campos.');
            return;
        }

        const payload = {
            id: id,
            userName: usuario,
            fullName: nombre,
            email: email,
            active: activo,
            rol: rol
        };

        $('#btnGuardar').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Guardando...');

        $.ajax({
            url: API_URL + "/api/Auth/UpdateUser",
            method: "PUT",
            dataType: "json",
            contentType: "application/json;charset=utf-8",
            data: JSON.stringify(payload)
        }).done((response) => {
            if (response.result === "ok") {
                ShowSuccess('Guardado', 'Los cambios fueron guardados correctamente.');
                setTimeout(() => window.location.href = '/Usuarios/Index', 2000);
            } else {
                ShowError('Error', response.message || 'No se pudo actualizar el usuario.');
            }
        }).fail(() => {
            ShowError('Error de conexión', 'No se pudo conectar con el servidor.');
        }).always(() => {
            $('#btnGuardar').prop('disabled', false).html('<i class="fas fa-save"></i> Guardar Cambios');
        });
    };

    this.ToggleEstado = () => {
        if (!this.usuarioActual) return;

        const activar = !this.usuarioActual.active;
        const accion = activar ? 'activar' : 'desactivar';

        Swal.fire({
            title: `¿${activar ? 'Activar' : 'Desactivar'} usuario?`,
            text: `¿Estás seguro de que querés ${accion} este usuario?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar'
        }).then(result => {
            if (!result.isConfirmed) return;

            const endpoint = activar
                ? `/api/Auth/ActivateUser/${this.usuarioActual.id}`
                : `/api/Auth/DeactivateUser/${this.usuarioActual.id}`;

            $.ajax({
                url: API_URL + endpoint,
                method: "PUT",
                dataType: "json"
            }).done((response) => {
                if (response.result === "ok") {
                    ShowSuccess('Listo', `Usuario ${activar ? 'activado' : 'desactivado'} correctamente.`);
                    setTimeout(() => location.reload(), 1500);
                } else {
                    ShowError('Error', response.message || 'No se pudo completar la acción.');
                }
            }).fail(() => {
                ShowError('Error de conexión', 'No se pudo conectar con el servidor.');
            });
        });
    };
}

$(document).ready(function () {
    const view = new EditarUsuarioView();
    view.InitView();
});