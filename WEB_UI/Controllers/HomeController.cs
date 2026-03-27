using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using WEB_UI.Models;

namespace WEB_UI.Controllers
{
    public class HomeController : Controller
    {
     //   [Authorize]
        public IActionResult Index()
        {
            var rol = User.Claims.FirstOrDefault(c => c.Type == "Rol")?.Value;

            return rol?.ToLower() switch
            {
                "administrador" or "admin" => RedirectToAction("Dashboard", "Admin"),
                "ingenieroforestal" or "ingeniero" or "ingforestal" => RedirectToAction("Index", "IngForestal"),
                "dueño" or "propietario" or "owner" => RedirectToAction("Index", "Fincas"),
                _ => View()
            };
        }
    }
}
