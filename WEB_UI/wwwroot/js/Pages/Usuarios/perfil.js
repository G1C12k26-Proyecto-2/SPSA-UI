const API_URL = "https://spsaapi.azurewebsites.net";

function PerfilView() {

    this.usuarioActual = null;

    this.InitView = () => {
        this.CargarPerfil();

        $("#btnGuardarPerfil").click(() => {
            this.ActualizarPerfil();
        });
    };

    this.ObtenerUsuarioId = () => {

        let userId = sessionStorage.getItem("userId");

        if (!userId) {
            const userStr = sessionStorage.getItem("user");

            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    userId = user.id;
                } catch (e) {
                    console.error("Error parseando usuario:", e);
                }
            }
        }

        return userId || null;
    };

    this.CargarPerfil = () => {

        const userId = this.ObtenerUsuarioId();

        if (!userId) {
            this.MostrarError("Sesión inválida. Inicie sesión nuevamente.");
            return;
        }

        $.ajax({
            url: API_URL + "/api/Auth/GetUserById/" + userId,
            method: "GET",
            dataType: "json",
            contentType: "application/json;charset=utf-8"
        }).done((response) => {

            if (response.result === "ok") {

                const user = response.data;
                this.usuarioActual = user;

                $("#txtIdUsuario").val(user.id);
                $("#perfilId").text("USR-" + String(user.id).padStart(5, "0"));
                $("#txtUserName").val(user.userName || "");
                $("#txtFullName").val(user.fullName || "");
                $("#txtEmail").val(user.email || "");
                $("#perfilRol").text(user.rol || "Sin rol");

            } else {
                this.MostrarError(response.message || "No se pudo cargar el perfil.");
            }

        }).fail((xhr) => {
            console.error("Error AJAX:", xhr);
            this.MostrarError("Error de conexión con el servidor.");
        });
    };

    this.ActualizarPerfil = () => {

        if (!this.usuarioActual) {
            this.MostrarError("No se ha cargado la información del usuario.");
            return;
        }

        const id = $("#txtIdUsuario").val();
        const userName = $("#txtUserName").val().trim();
        const fullName = $("#txtFullName").val().trim();
        const email = $("#txtEmail").val().trim();

        if (!userName || !fullName || !email) {
            this.MostrarError("Debe completar nombre de usuario, nombre completo y correo.");
            return;
        }

        const usuario = {
            id: parseInt(id),
            active: this.usuarioActual.active,
            userName: userName,
            fullName: fullName,
            email: email,

            // Importante:
            // Se manda el mismo rol actual, no uno editado por el usuario.
            rol: this.usuarioActual.rol
        };

        $("#btnGuardarPerfil").prop("disabled", true);
        $("#btnGuardarPerfil").html('<i class="fas fa-spinner fa-spin"></i> Guardando...');

        $.ajax({
            url: API_URL + "/api/Auth/UpdateUser",
            method: "PUT",
            dataType: "json",
            contentType: "application/json;charset=utf-8",
            data: JSON.stringify(usuario)
        }).done((response) => {

            if (response.result === "ok") {

                this.usuarioActual.userName = userName;
                this.usuarioActual.fullName = fullName;
                this.usuarioActual.email = email;

                sessionStorage.setItem("userId", id);

                const userStr = sessionStorage.getItem("user");
                if (userStr) {
                    try {
                        const userSession = JSON.parse(userStr);
                        userSession.userName = userName;
                        userSession.fullName = fullName;
                        userSession.email = email;
                        sessionStorage.setItem("user", JSON.stringify(userSession));
                    } catch (e) {
                        console.error("Error actualizando sessionStorage:", e);
                    }
                }

                Swal.fire({
                    icon: "success",
                    title: "Perfil actualizado",
                    text: "Sus datos fueron actualizados correctamente.",
                    timer: 2000
                });

            } else {
                this.MostrarError(response.message || "No se pudo actualizar el perfil.");
            }

        }).fail((xhr) => {
            console.error("Error AJAX:", xhr);
            this.MostrarError("Error de conexión con el servidor.");

        }).always(() => {
            $("#btnGuardarPerfil").prop("disabled", false);
            $("#btnGuardarPerfil").html('<i class="fas fa-save"></i> Guardar Cambios');
        });
    };

    this.MostrarError = (mensaje) => {
        Swal.fire({
            icon: "error",
            title: "Error",
            text: mensaje
        });
    };
}

$(document).ready(function () {
    const view = new PerfilView();
    view.InitView();
});