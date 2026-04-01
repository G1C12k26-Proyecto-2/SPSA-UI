
    const API_URL = "https://spsaapi.azurewebsites.net";

    async function doLogin() {
            const usuario   = document.getElementById('txtUsuario').value.trim();
    const password  = document.getElementById('txtPassword').value;
    const errorMsg  = document.getElementById('errorMsg');
    const errorText = document.getElementById('errorText');
    const btn       = document.getElementById('btnLogin');

    errorMsg.style.display = 'none';

    if (!usuario || !password) {
        errorText.textContent = 'Por favor completá todos los campos.';
    errorMsg.style.display = 'block';
    return;
            }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando...';

    try {
                const response = await fetch(`${API_URL}/api/Auth/Login`, {
        method: 'POST',
    headers: {'Content-Type': 'application/json' },
    body: JSON.stringify({userName: usuario, password: password })
                });

    const data = await response.json();

    if (data.result === 'ok') {
        sessionStorage.setItem('user', JSON.stringify(data.data)); /// Usar el de .net no el de JAVA
    const user = data.data;

    if (user.rol === 'Admin') {
        window.location.href = '/Admin/AdminDashboard';
                    } else if (user.rol === 'Funcionario') {
        window.location.href = '/IngForestal/Index';
                    } else if (user.rol === 'Propietario') {
        window.location.href = '/Fincas/Index';
                    } else {
        window.location.href = '/Login/Login';
                    }
                } else {
        errorText.textContent = 'Usuario o contraseña incorrectos.';
    errorMsg.style.display = 'block';
                }
            } catch (e) {
        errorText.textContent = 'No se pudo conectar con el servidor.';
    errorMsg.style.display = 'block';
            } finally {
        btn.disabled = false;
    btn.innerHTML = 'Iniciar Sesión';
            }
        }
