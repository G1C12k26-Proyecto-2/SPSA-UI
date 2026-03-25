using Microsoft.AspNetCore.Mvc;

namespace WebUI.Controllers
{
    public class CuentaController : Controller
    {
        public IActionResult ActualizarBanco()
        {
            ViewData["Title"] = "Datos Bancarios";
            ViewData["Breadcrumb"] = "Datos Bancarios";
            return View();
        }
    }
}
