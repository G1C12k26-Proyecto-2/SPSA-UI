const API_URL = "https://spsaapi.azurewebsites.net";

async function crearUsuario() {
    const nombre = document.getElementById('txtNombre').value.trim();
    const email = document.getElementById('txtEmail').value.trim();
    const usuario = document.getElementById('txtUsuario').value.trim();
    const password = document.getElementById('txtPassword').value;
    const confirmar = document.getElementById('txtConfirmar').value;
    const rol = document.getElementById('ddRol').value;
    const activo = document.getElementById('ddEstado').value === 'true';
    const btn = document.getElementById('btnCrear');

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

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';

    try {
        const response = await fetch(`${API_URL}/api/Auth/CreateUserWithRole`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userName: usuario,
                password: password,
                fullName: nombre,
                email: email,
                active: activo,
                rol: rol
            })
        });

        const data = await response.json();

        if (data.result === 'ok') {
            ShowSuccess('Usuario creado', 'El usuario fue creado exitosamente.');
            setTimeout(() => window.location.href = '/Usuarios/Index', 2000);
        } else {
            ShowError('Error', data.message || 'No se pudo crear el usuario.');
        }
    } catch (e) {
        ShowError('Error de conexión', 'No se pudo conectar con el servidor.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Crear Usuario';
    }
}