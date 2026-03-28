using Microsoft.AspNetCore.Mvc;

namespace WEB_UI.Controllers
{
    public class IngForestalController : Controller
    {
        public IActionResult Index()
        {
            ViewData["Title"] = "Dashboard";
            return View();
        }
        public IActionResult ListaSolicitudes()
        {
            ViewData["Title"] = "Todas las solicitudes";
            ViewData["Breadcrumb"] = "Todas las solicitudes";
            return View();
        }
        public IActionResult Agenda()
        {
            ViewData["Title"] = "Agenda";
            ViewData["Breadcrumb"] = "Agenda";
            return View();
        }
        public IActionResult Programar()
        {
            ViewData["Title"] = "Programar visita";
            ViewData["Breadcrumb"] = "Programar Visita";
            return View();
        }
        public IActionResult Detalle()
        {
            ViewData["Title"] = "Evaluación técnica";
            ViewData["Breadcrumb"] = "Evaluación técnica";
            return View();
        }
        public IActionResult Realizar()
        {
            ViewData["Title"] = "Evaluación técnica";
            ViewData["Breadcrumb"] = "Evaluación técnica";
            return View();
        }
        public IActionResult Perfil()
        {
            ViewData["Title"] = "Perfil";
            ViewData["Breadcrumb"] = "Perfil";
            return View();
        }

    }
}
