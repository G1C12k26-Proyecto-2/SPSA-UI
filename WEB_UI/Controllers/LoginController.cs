using Microsoft.AspNetCore.Mvc;

namespace WEB_UI.Controllers
{
    public class LoginController : Controller
    {
        public IActionResult Login() => View();
        public IActionResult Registro() => View();
        public IActionResult RecuperarContrasena() => View();
        public IActionResult ResetPassword() => View();
    }
}