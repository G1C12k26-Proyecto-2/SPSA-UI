using Microsoft.AspNetCore.Mvc;

namespace WebApplication1.Controllers
{
    public class UsuariosController : Controller
    {
        public IActionResult Perfil()
        {
            return View();
        }
        public IActionResult Index() => View();
        public IActionResult Crear() => View();
        public IActionResult Editar(int id) => View();


    }
}