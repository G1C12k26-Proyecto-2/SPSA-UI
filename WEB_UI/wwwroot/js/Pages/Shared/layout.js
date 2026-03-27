function cerrarSesion() {
    sessionStorage.removeItem('user');
    window.location.href = '/Login/Login';
}