using Microsoft.AspNetCore.Mvc;

namespace WebUI.Controllers
{
    public class FincasController : Controller
    {
        public IActionResult Index()
        {
            ViewData["Title"] = "Mis Fincas";
            ViewData["Breadcrumb"] = "Mis Fincas";
            return View();
        }

        public IActionResult Crear()
        {
            ViewData["Title"] = "Registrar Finca";
            ViewData["Breadcrumb"] = "Registrar Finca";
            return View();
        }

        public IActionResult Detalle(int? id)
        {
            ViewData["Title"] = "Detalle Finca";
            ViewData["Breadcrumb"] = "Finca La Catarata";
            return View();
        }

        public IActionResult Editar(int? id)
        {
            ViewData["Title"] = "Editar Finca";
            ViewData["Breadcrumb"] = "Editar Finca";
            return View();
        }
    }
}
