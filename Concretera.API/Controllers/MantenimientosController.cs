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
public class MantenimientosController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHubContext<DespachoHub> _hub;

    public MantenimientosController(AppDbContext db, IHubContext<DespachoHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? camionId, [FromQuery] string? estado)
    {
        var query = _db.Mantenimientos
            .Include(m => m.Camion)
            .AsQueryable();

        if (camionId.HasValue) query = query.Where(m => m.CamionId == camionId.Value);
        if (!string.IsNullOrEmpty(estado) && Enum.TryParse<EstadoMantenimiento>(estado, out var e))
            query = query.Where(m => m.Estado == e);

        var items = await query
            .OrderBy(m => m.FechaProgramada)
            .Select(m => new {
                m.Id,
                m.Tipo,
                m.Estado,
                m.Descripcion,
                m.FechaProgramada,
                m.FechaRealizada,
                m.IntervaloDias,
                m.KmActual,
                m.KmProximo,
                m.KmIntervalo,
                m.Costo,
                m.Notas,
                m.TallerNombre,
                m.FechaCreacion,
                camion = m.Camion == null ? null : new { m.Camion.Id, m.Camion.Nombre, m.Camion.Placas },
                diasRestantes = m.FechaProgramada.HasValue
                    ? (int)(m.FechaProgramada.Value - DateTime.UtcNow).TotalDays
                    : (int?)null
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MantenimientoDto dto)
    {
        var m = new Mantenimiento
        {
            CamionId = dto.CamionId,
            Tipo = Enum.Parse<TipoMantenimiento>(dto.Tipo),
            Descripcion = dto.Descripcion,
            FechaProgramada = dto.FechaProgramada,
            IntervaloDias = dto.IntervaloDias,
            KmActual = dto.KmActual,
            KmProximo = dto.KmProximo,
            KmIntervalo = dto.KmIntervalo,
            Costo = dto.Costo,
            Notas = dto.Notas,
            TallerNombre = dto.TallerNombre,
            Estado = EstadoMantenimiento.PROGRAMADO,
            FechaCreacion = DateTime.UtcNow
        };

        _db.Mantenimientos.Add(m);
        await _db.SaveChangesAsync();
        // Notificar nuevo mantenimiento programado
        await _hub.Clients.All.SendAsync("NuevoMantenimiento", new
        {
            m.Id,
            m.Tipo,
            m.Descripcion,
            camion = (await _db.Camiones.FindAsync(dto.CamionId))?.Nombre,
            m.FechaProgramada
        });
        return Ok(m);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] MantenimientoDto dto)
    {
        var m = await _db.Mantenimientos.FindAsync(id);
        if (m == null) return NotFound();

        m.Tipo = Enum.Parse<TipoMantenimiento>(dto.Tipo);
        m.Descripcion = dto.Descripcion;
        m.FechaProgramada = dto.FechaProgramada;
        m.IntervaloDias = dto.IntervaloDias;
        m.KmActual = dto.KmActual;
        m.KmProximo = dto.KmProximo;
        m.KmIntervalo = dto.KmIntervalo;
        m.Costo = dto.Costo;
        m.Notas = dto.Notas;
        m.TallerNombre = dto.TallerNombre;

        await _db.SaveChangesAsync();
        return Ok(m);
    }

    [HttpPut("{id}/completar")]
    public async Task<IActionResult> Completar(int id, [FromBody] CompletarDto dto)
    {
        var m = await _db.Mantenimientos
            .Include(x => x.Camion)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (m == null) return NotFound();

        m.Estado = EstadoMantenimiento.COMPLETADO;
        m.FechaRealizada = DateTime.UtcNow;
        m.Costo = dto.Costo ?? m.Costo;
        m.Notas = dto.Notas ?? m.Notas;

        // Liberar camión si estaba en mantenimiento
        if (m.Camion != null && m.Camion.Status == CamionStatus.MANTENIMIENTO)
        {
            m.Camion.Status = CamionStatus.LIBRE;
            m.Camion.UltimaActualizacion = DateTime.UtcNow;
            var camiones = await _db.Camiones.ToListAsync();
            await _hub.Clients.All.SendAsync("ActualizarCamiones", camiones);
        }

        // Crear próximo mantenimiento automáticamente si tiene intervalo
        if (m.IntervaloDias.HasValue && m.IntervaloDias.Value > 0)
        {
            // Verificar que no exista ya uno programado del mismo tipo para ese camión
            var yaExiste = await _db.Mantenimientos.AnyAsync(x =>
                x.CamionId == m.CamionId &&
                x.Tipo == m.Tipo &&
                x.Estado == EstadoMantenimiento.PROGRAMADO);

            if (!yaExiste)
            {
                var siguiente = new Mantenimiento
                {
                    CamionId = m.CamionId,
                    Tipo = m.Tipo,
                    Descripcion = m.Descripcion,
                    FechaProgramada = DateTime.UtcNow.AddDays(m.IntervaloDias.Value),
                    IntervaloDias = m.IntervaloDias,
                    KmIntervalo = m.KmIntervalo,
                    Estado = EstadoMantenimiento.PROGRAMADO,
                    FechaCreacion = DateTime.UtcNow
                };
                _db.Mantenimientos.Add(siguiente);
            }
        }

        await _db.SaveChangesAsync();

        await _hub.Clients.All.SendAsync("MantenimientoCompletado", new
        {
            m.Id,
            camionId = m.CamionId,
            camion = m.Camion?.Nombre,
            tipo = m.Tipo,
            descripcion = m.Descripcion,
            costo = m.Costo
        });

        return Ok(m);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var m = await _db.Mantenimientos.FindAsync(id);
        if (m == null) return NotFound();
        _db.Mantenimientos.Remove(m);
        await _db.SaveChangesAsync();
        return Ok();
    }

    // GET api/mantenimientos/alertas
    [HttpGet("alertas")]
    public async Task<IActionResult> GetAlertas()
    {
        var hoy = DateTime.UtcNow.Date;
        var en7 = hoy.AddDays(7);

        var alertas = await _db.Mantenimientos
            .Include(m => m.Camion)
            .Where(m => m.Estado == EstadoMantenimiento.PROGRAMADO &&
                        m.FechaProgramada.HasValue &&
                        m.FechaProgramada.Value.Date <= en7)
            .OrderBy(m => m.FechaProgramada)
            .Select(m => new {
                m.Id,
                m.Tipo,
                m.Descripcion,
                m.FechaProgramada,
                diasRestantes = (int)(m.FechaProgramada!.Value - DateTime.UtcNow).TotalDays,
                camion = m.Camion == null ? null : new { m.Camion.Id, m.Camion.Nombre }
            })
            .ToListAsync();

        return Ok(alertas);
    }
}

public class MantenimientoDto
{
    public int CamionId { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public DateTime? FechaProgramada { get; set; }
    public int? IntervaloDias { get; set; }
    public double? KmActual { get; set; }
    public double? KmProximo { get; set; }
    public double? KmIntervalo { get; set; }
    public decimal? Costo { get; set; }
    public string? Notas { get; set; }
    public string? TallerNombre { get; set; }
}

public class CompletarDto
{
    public decimal? Costo { get; set; }
    public string? Notas { get; set; }
}