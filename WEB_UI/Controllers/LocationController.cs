using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using WEB_UI.Config;

namespace WEB_UI.Controllers
{
    public class LocationController : Controller
    {
        private readonly GoogleMapsOptions _googleMapsOptions;

        public LocationController(IOptions<GoogleMapsOptions> googleMapsOptions)
        {
            _googleMapsOptions = googleMapsOptions.Value;
        }

        public IActionResult LocationTest()
        {
            ViewBag.GoogleMapsApiKey = _googleMapsOptions.JsApiKey;
            return View();
        }
    }
}