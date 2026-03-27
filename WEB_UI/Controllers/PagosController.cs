using Microsoft.AspNetCore.Mvc;

namespace WebApplication1.Controllers
{
    public class PagosController : Controller
    {
        public IActionResult Procesar() => View();
        public IActionResult Calcular() => View();
        public IActionResult Historial() => View();
    }
}