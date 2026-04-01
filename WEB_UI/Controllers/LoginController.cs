using Microsoft.AspNetCore.Mvc;

namespace WEB_UI.Controllers
{
    public class LoginController : Controller
    {
        public IActionResult Login() => View();// Codigo .net para llamar al api. SOLO EL LOGIN
        public IActionResult Registro() => View();
        public IActionResult RecuperarContrasena() => View();
        public IActionResult ResetPassword() => View();
    }
}