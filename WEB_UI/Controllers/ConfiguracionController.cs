using Microsoft.AspNetCore.Mvc;
namespace WebApplication1.Controllers
{
    public class ConfiguracionController : Controller
    {
        public IActionResult General() => View();
    }
}