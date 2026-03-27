using Microsoft.AspNetCore.Mvc;

namespace WebApplication1.Controllers
{
    public class UsuariosController : Controller
    {
        public IActionResult Index() => View();
        public IActionResult Crear() => View();
        public IActionResult Editar() => View();
    }
}