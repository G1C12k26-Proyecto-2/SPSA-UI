using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using WEB_UI.Config;

namespace WebUI.Controllers
{
    public class FincasController : Controller
    {
        private readonly GoogleMapsOptions _googleMapsOptions;

        public FincasController(IOptions<GoogleMapsOptions> googleMapsOptions)
        {
            _googleMapsOptions = googleMapsOptions.Value;
        }
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
            ViewBag.GoogleMapsApiKey = _googleMapsOptions.JsApiKey;
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
