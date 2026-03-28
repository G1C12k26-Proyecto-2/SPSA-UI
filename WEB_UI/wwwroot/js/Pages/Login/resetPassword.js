const API_URL = "https://spsaapi.azurewebsites.net";

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (!token) {
    document.querySelector('.right').innerHTML = `
        <h2>Enlace inválido</h2>
        <p>Este enlace no es válido o ya expiró.</p>
        <a href="/Login/RecuperarContrasena" style="color:#2d8653;">Solicitar nuevo enlace</a>
    `;
}

async function cambiarContrasena() {
    const nueva = document.getElementById('txtNueva').value;
    const confirmar = document.getElementById('txtConfirmar').value;
    const errorMsg = document.getElementById('errorMsg');
    const errorText = document.getElementById('errorText');
    const successMsg = document.getElementById('successMsg');
    const btn = document.getElementById('btnGuardar');

    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';

    if (!nueva || !confirmar) {
        errorText.textContent = 'Por favor completá ambos campos.';
        errorMsg.style.display = 'block';
        return;
    }

    if (nueva !== confirmar) {
        errorText.textContent = 'Las contraseñas no coinciden.';
        errorMsg.style.display = 'block';
        return;
    }

    if (nueva.length < 6) {
        errorText.textContent = 'La contraseña debe tener al menos 6 caracteres.';
        errorMsg.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const response = await fetch(`${API_URL}/api/Auth/ResetPassword`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token, newPassword: nueva })
        });

        const data = await response.json();

        if (data.result === 'ok') {
            successMsg.style.display = 'block';
            setTimeout(() => window.location.href = '/Login/Login', 2000);
        } else {
            errorText.textContent = data.message || 'No se pudo actualizar la contraseña.';
            errorMsg.style.display = 'block';
        }
    } catch (e) {
        errorText.textContent = 'No se pudo conectar con el servidor.';
        errorMsg.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-lock"></i> Guardar Nueva Contraseña';
    }
}