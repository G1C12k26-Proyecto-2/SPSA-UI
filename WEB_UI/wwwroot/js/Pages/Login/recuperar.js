const API_URL = "https://spsaapi.azurewebsites.net";

async function enviarLink() {
    const correo = document.getElementById('txtCorreo').value.trim();
    const errorMsg = document.getElementById('errorMsg');
    const errorText = document.getElementById('errorText');
    const successMsg = document.getElementById('successMsg');
    const successText = document.getElementById('successText');
    const btn = document.getElementById('btnEnviar');

    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';

    if (!correo) {
        errorText.textContent = 'Por favor ingresá tu correo.';
        errorMsg.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    try {
        const response = await fetch(`${API_URL}/api/Auth/ForgotPassword`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: correo })
        });

        const data = await response.json();

        if (data.result === 'ok') {
            successText.textContent = 'Te enviamos un enlace a tu correo. Revisá tu bandeja de entrada.';
            successMsg.style.display = 'block';
            document.getElementById('txtCorreo').disabled = true;
            btn.style.display = 'none';
        } else {
            errorText.textContent = data.message || 'No se pudo enviar el enlace.';
            errorMsg.style.display = 'block';
        }
    } catch (e) {
        errorText.textContent = 'No se pudo conectar con el servidor.';
        errorMsg.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Enlace';
    }
}