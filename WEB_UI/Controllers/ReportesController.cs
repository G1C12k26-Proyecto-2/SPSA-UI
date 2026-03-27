using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.ViewEngines;

namespace WebApplication1.Controllers
{
    public class ReportesController : Controller
    {
        public IActionResult Index() => View();
        public IActionResult Pagos() => View();
        public IActionResult Solicitudes() => View();
    }
}
