using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Concretera.Infrastructure.Data;
using Concretera.Core.Models;
using Concretera.API.Hubs;

namespace Concretera.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IncidenciasController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHubContext<DespachoHub> _hub;

    public IncidenciasController(AppDbContext db, IHubContext<DespachoHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    // GET api/incidencias
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? camionId,
        [FromQuery] string? estado,
        [FromQuery] string? severidad)
    {
        var query = _db.Incidencias
            .Include(i => i.Camion)
            .Include(i => i.ReportadoPor)
            .AsQueryable();

        if (camionId.HasValue)
            query = query.Where(i => i.CamionId == camionId.Value);

        if (!string.IsNullOrEmpty(estado) && Enum.TryParse<EstadoIncidencia>(estado, out var e))
            query = query.Where(i => i.Estado == e);

        if (!string.IsNullOrEmpty(severidad) && Enum.TryParse<SeveridadIncidencia>(severidad, out var s))
            query = query.Where(i => i.Severidad == s);

        var result = await query
            .OrderByDescending(i => i.FechaReporte)
            .Select(i => new
            {
                i.Id,
                i.Tipo,
                i.Severidad,
                i.Estado,
                i.Descripcion,
                i.FotoUrl,
                i.Resolucion,
                i.FechaReporte,
                i.FechaResolucion,
                i.Lat,
                i.Lng,
                camion = i.Camion == null ? null : new { i.Camion.Id, i.Camion.Nombre, i.Camion.Placas },
                reportadoPor = i.ReportadoPor == null ? null : new { i.ReportadoPor.Id, i.ReportadoPor.Nombre }
            })
            .ToListAsync();

        return Ok(result);
    }

    // POST api/incidencias
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] IncidenciaDto dto)
    {
        var incidencia = new Incidencia
        {
            CamionId = dto.CamionId,
            ReportadoPorId = dto.ReportadoPorId,
            Tipo = Enum.Parse<TipoIncidencia>(dto.Tipo),
            Severidad = Enum.Parse<SeveridadIncidencia>(dto.Severidad),
            Descripcion = dto.Descripcion,
            FotoUrl = dto.FotoUrl,
            Lat = dto.Lat,
            Lng = dto.Lng,
            FechaReporte = DateTime.UtcNow,
            Estado = EstadoIncidencia.ABIERTA
        };

        _db.Incidencias.Add(incidencia);

        // Camión a mantenimiento si es crítica o falla grave
        if (dto.Severidad == "CRITICA" ||
            dto.Tipo == "FALLA_MECANICA" ||
            dto.Tipo == "ACCIDENTE")
        {
            var camion = await _db.Camiones.FindAsync(dto.CamionId);
            if (camion != null)
            {
                camion.Status = CamionStatus.MANTENIMIENTO;
                camion.UltimaActualizacion = DateTime.UtcNow;
            }
        }

        await _db.SaveChangesAsync();

        // ← Notificar SIEMPRE por SignalR, no solo críticas
        await _hub.Clients.All.SendAsync("IncidenciaCritica", new
        {
            incidencia.Id,
            incidencia.Tipo,
            incidencia.Severidad,
            incidencia.Descripcion,
            incidencia.CamionId,
            incidencia.FechaReporte
        });

        // Actualizar flota si cambió el camión
        if (dto.Severidad == "CRITICA" ||
            dto.Tipo == "FALLA_MECANICA" ||
            dto.Tipo == "ACCIDENTE")
        {
            var camiones = await _db.Camiones.ToListAsync();
            await _hub.Clients.All.SendAsync("ActualizarCamiones", camiones);
        }

        return Ok(incidencia);
    }

    // PUT api/incidencias/5/resolver
    [HttpPut("{id}/resolver")]
    public async Task<IActionResult> Resolver(int id, [FromBody] ResolverDto dto)
    {
        var inc = await _db.Incidencias
            .Include(i => i.Camion)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (inc == null) return NotFound();

        inc.Estado = EstadoIncidencia.RESUELTA;
        inc.Resolucion = dto.Resolucion;
        inc.FechaResolucion = DateTime.UtcNow;

        // Liberar camión si estaba en mantenimiento
        if (dto.LiberarCamion && inc.Camion != null &&
            inc.Camion.Status == CamionStatus.MANTENIMIENTO)
        {
            inc.Camion.Status = CamionStatus.LIBRE;
            inc.Camion.UltimaActualizacion = DateTime.UtcNow;

            var camiones = await _db.Camiones.ToListAsync();
            await _hub.Clients.All.SendAsync("ActualizarCamiones", camiones);
        }

        await _db.SaveChangesAsync();
        return Ok(inc);
    }

    // PUT api/incidencias/5/estado
    [HttpPut("{id}/estado")]
    public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoDto dto)
    {
        var inc = await _db.Incidencias.FindAsync(id);
        if (inc == null) return NotFound();

        inc.Estado = dto.Estado;
        await _db.SaveChangesAsync();
        return Ok(inc);
    }

    // DELETE api/incidencias/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var inc = await _db.Incidencias.FindAsync(id);
        if (inc == null) return NotFound();
        _db.Incidencias.Remove(inc);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Incidencia eliminada" });
    }
}

public class IncidenciaDto
{
    public int CamionId { get; set; }
    public int? ReportadoPorId { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Severidad { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string? FotoUrl { get; set; }
    public double? Lat { get; set; }
    public double? Lng { get; set; }
}

public class ResolverDto
{
    public string Resolucion { get; set; } = string.Empty;
    public bool LiberarCamion { get; set; } = false;
}

public class CambiarEstadoDto
{
    public EstadoIncidencia Estado { get; set; }
}