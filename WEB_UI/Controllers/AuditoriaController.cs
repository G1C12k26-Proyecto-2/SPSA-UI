using Microsoft.AspNetCore.Mvc;

namespace WebApplication1.Controllers
{
    public class AuditoriaController : Controller
    {
        public IActionResult Index() => View();
        public IActionResult Detalle() => View();
    }
}