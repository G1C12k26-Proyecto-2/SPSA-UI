using Microsoft.AspNetCore.Mvc;

namespace WebUI.Controllers
{
    public class CuentaController : Controller
    {
        public IActionResult Perfil()
        {
            ViewData["Title"] = "Mi Perfil";
            ViewData["Breadcrumb"] = "Mi Perfil";
            return View();
        }

        public IActionResult DatosBanco()
        {
            ViewData["Title"] = "Datos Bancarios";
            ViewData["Breadcrumb"] = "Datos Bancarios";
            return View();
        }

        public IActionResult ActualizarBanco()
        {
            ViewData["Title"] = "Actualizar Datos Bancarios";
            ViewData["Breadcrumb"] = "Actualizar Datos Bancarios";
            return View();
        }

        public IActionResult HistorialPagos()
        {
            ViewData["Title"] = "Historial de Pagos";
            ViewData["Breadcrumb"] = "Historial de Pagos";
            return View();
        }
    }
}
