using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Concretera.Infrastructure.Data;
using Concretera.Core.Models;
using Concretera.Core.DTOs;

namespace Concretera.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CamionesController : ControllerBase
{
    private readonly AppDbContext _db;

    public CamionesController(AppDbContext db) => _db = db;

    // GET api/camiones
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var camiones = await _db.Camiones
            .Include(c => c.Conductor)
            .OrderBy(c => c.Id)
            .ToListAsync();
        return Ok(camiones);
    }

    // GET api/camiones/libres
    [HttpGet("libres")]
    public async Task<IActionResult> GetLibres()
    {
        var libres = await _db.Camiones
            .Where(c => c.Status == CamionStatus.LIBRE)
            .ToListAsync();
        return Ok(libres);
    }

    // GET api/camiones/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var camion = await _db.Camiones
            .Include(c => c.Conductor)
            .FirstOrDefaultAsync(c => c.Id == id);
        return camion == null ? NotFound() : Ok(camion);
    }

    // PATCH api/camiones/5/status
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] ActualizarStatusDto dto)
    {
        var camion = await _db.Camiones.FindAsync(id);
        if (camion == null) return NotFound();

        if (!Enum.TryParse<CamionStatus>(dto.Status, out var newStatus))
            return BadRequest("Status inválido");

        camion.Status = newStatus;
        camion.UltimaActualizacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(camion);
    }

    // POST api/camiones/5/liberar
    [HttpPost("{id}/liberar")]
    public async Task<IActionResult> Liberar(int id)
    {
        var camion = await _db.Camiones.FindAsync(id);
        if (camion == null) return NotFound();

        camion.Status = CamionStatus.LIBRE;
        camion.DestinoNombre = null;
        camion.DestinoDireccion = null;
        camion.DestinoLat = null;
        camion.DestinoLng = null;
        camion.CargaInicio = null;
        camion.CargaFin = null;
        camion.LlegadaEstimada = null;
        camion.DescargaFin = null;
        camion.RegresoFin = null;
        camion.TravelMinutos = 0;
        camion.UltimaActualizacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(camion);
    }
}
