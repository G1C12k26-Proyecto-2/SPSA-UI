const API_URL = "https://spsaapi.azurewebsites.net";

async function doRegistro() {
    const nombre = document.getElementById('txtNombre').value.trim();
    const usuario = document.getElementById('txtUsuario').value.trim();
    const password = document.getElementById('txtPassword').value;
    const confirmar = document.getElementById('txtConfirmar').value;
    const errorMsg = document.getElementById('errorMsg');
    const errorText = document.getElementById('errorText');
    const successMsg = document.getElementById('successMsg');
    const btn = document.getElementById('btnRegistro');

    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';

    if (!nombre || !usuario || !password || !confirmar) {
        errorText.textContent = 'Por favor completá todos los campos.';
        errorMsg.style.display = 'block';
        return;
    }

    if (password !== confirmar) {
        errorText.textContent = 'Las contraseñas no coinciden.';
        errorMsg.style.display = 'block';
        return;
    }

    if (password.length < 6) {
        errorText.textContent = 'La contraseña debe tener al menos 6 caracteres.';
        errorMsg.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';

    try {
        const response = await fetch(`${API_URL}/api/Auth/CreatePropietario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userName: usuario,
                password: password,
                fullName: nombre,
                email: usuario,
                active: true,
                rol: 'Propietario'
            })
        });

        const data = await response.json();

        if (data.result === 'ok') {
            successMsg.style.display = 'block';
            setTimeout(() => {
                window.location.href = '/Login/Login';
            }, 2000);
        } else {
            errorText.innerHTML = 'No se pudo crear la cuenta.<br><br>El correo existe en nuestra base de datos';
            errorMsg.style.display = 'block';
        }
    } catch (e) {
        errorText.textContent = 'No se pudo conectar con el servidor.';
        errorMsg.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Crear Cuenta';
    }
}