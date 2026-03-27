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
                "Admin" => RedirectToAction("Dashboard", "Admin"),
                "Funcionario" => RedirectToAction("Index", "IngForestal"),
                "Propietario" => RedirectToAction("Index", "Fincas"),
                _ => View()
            };
        }
    }
}
