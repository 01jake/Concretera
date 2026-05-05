using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Concretera.Core.DTOs;
using System.Text.Json;

namespace Concretera.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MapsController : ControllerBase
{
    private readonly IConfiguration _cfg;
    private readonly HttpClient _http;

    public MapsController(IConfiguration cfg, IHttpClientFactory factory)
    {
        _cfg = cfg;
        _http = factory.CreateClient();
    }

    // GET api/maps/ruta?lat=29.07&lng=-110.95
    [HttpGet("ruta")]
    public async Task<IActionResult> GetRuta([FromQuery] double lat, [FromQuery] double lng)
    {
        var key = _cfg["GoogleMaps:ApiKey"];
        var plantaLat = _cfg["Planta:Lat"] ?? "29.0729";
        var plantaLng = _cfg["Planta:Lng"] ?? "-110.9559";

        var url = $"https://maps.googleapis.com/maps/api/directions/json" +
                  $"?origin={plantaLat},{plantaLng}" +
                  $"&destination={lat},{lng}" +
                  $"&mode=driving&language=es&key={key}";

        var response = await _http.GetStringAsync(url);
        var json = JsonDocument.Parse(response);
        var root = json.RootElement;

        if (root.GetProperty("status").GetString() != "OK")
            return BadRequest("No se pudo calcular la ruta");

        var leg = root
            .GetProperty("routes")[0]
            .GetProperty("legs")[0];

        var duracionSeg = leg.GetProperty("duration").GetProperty("value").GetInt32();
        var distanciaM = leg.GetProperty("distance").GetProperty("value").GetInt32();
        var direccion = leg.GetProperty("end_address").GetString() ?? $"{lat},{lng}";

        return Ok(new RouteInfoDto(
            TravelMinutos: (int)Math.Ceiling(duracionSeg / 60.0),
            DistanciaKm: Math.Round(distanciaM / 1000.0, 1),
            Direccion: direccion,
            Lat: lat,
            Lng: lng
        ));
    }

    // GET api/maps/geocode?direccion=Blvd Kino Hermosillo
    [HttpGet("geocode")]
    public async Task<IActionResult> Geocode([FromQuery] string direccion)
    {
        var key = _cfg["GoogleMaps:ApiKey"];
        var encoded = Uri.EscapeDataString(direccion);
        var url = $"https://maps.googleapis.com/maps/api/geocode/json?address={encoded}&key={key}";

        var response = await _http.GetStringAsync(url);
        var json = JsonDocument.Parse(response);

        if (json.RootElement.GetProperty("status").GetString() != "OK")
            return BadRequest("Dirección no encontrada");

        var location = json.RootElement
            .GetProperty("results")[0]
            .GetProperty("geometry")
            .GetProperty("location");

        return Ok(new
        {
            lat = location.GetProperty("lat").GetDouble(),
            lng = location.GetProperty("lng").GetDouble(),
            direccionFormateada = json.RootElement
                .GetProperty("results")[0]
                .GetProperty("formatted_address").GetString()
        });
    }

    // GET api/maps/reverse-geocode?lat=29.07&lng=-110.95
    [HttpGet("reverse-geocode")]
    public async Task<IActionResult> ReverseGeocode([FromQuery] double lat, [FromQuery] double lng)
    {
        var key = _cfg["GoogleMaps:ApiKey"];
        var url = $"https://maps.googleapis.com/maps/api/geocode/json" +
                  $"?latlng={lat},{lng}&language=es&key={key}";

        var response = await _http.GetStringAsync(url);
        var json = JsonDocument.Parse(response);

        if (json.RootElement.GetProperty("status").GetString() != "OK")
            return BadRequest("No se pudo geocodificar");

        var address = json.RootElement
            .GetProperty("results")[0]
            .GetProperty("formatted_address").GetString();

        return Ok(new { direccion = address });
    }
}
