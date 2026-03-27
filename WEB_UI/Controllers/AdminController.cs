using Microsoft.AspNetCore.Mvc;

namespace WebApplication1.Controllers
{
    public class AdminController : Controller
    {
        public IActionResult AdminDashboard()
        {
            return View();
        }
    }
}