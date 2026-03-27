using Microsoft.AspNetCore.Mvc;

namespace SPSA_Login.Controllers
{
    public class LoginController : Controller
    {
        public IActionResult Login() => View();
        public IActionResult Registro() => View();
        public IActionResult RecuperarContrasena() => View();
    }
}