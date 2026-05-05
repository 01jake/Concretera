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
public class InventarioController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHubContext<DespachoHub> _hub;

    public InventarioController(AppDbContext db, IHubContext<DespachoHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    // GET api/inventario
    [HttpGet]
    public async Task<IActionResult> GetInventario()
    {
        var inv = await _db.Inventario.FirstOrDefaultAsync();
        if (inv == null) return NotFound();

        // Calcular reservas por pedidos pendientes
        var reservas = await _db.Pedidos
            .Where(p => p.Status == PedidoStatus.ASIGNADO || p.Status == PedidoStatus.PENDIENTE)
            .SumAsync(p => (double?)p.M3Solicitados) ?? 0;

        // Proyección de agotamiento basada en promedio diario
        var hace7Dias = DateTime.UtcNow.AddDays(-7);
        var consumo7Dias = await _db.MovimientosInventario
            .Where(m => m.Tipo == TipoMovimiento.DESPACHO && m.Fecha >= hace7Dias)
            .SumAsync(m => (double?)m.M3) ?? 0;

        var promedioDiario = consumo7Dias / 7;
        var diasRestantes = promedioDiario > 0
            ? (inv.M3Disponibles - reservas) / promedioDiario
            : 999;

        return Ok(new
        {
            inv.Id,
            inv.M3Disponibles,
            inv.CapacidadMaxima,
            inv.AlertaMinima,
            inv.UltimaActualizacion,
            reservas,
            m3Neto = inv.M3Disponibles - reservas,
            pctOcupado = (inv.M3Disponibles / inv.CapacidadMaxima) * 100,
            alertaBaja = inv.M3Disponibles <= inv.AlertaMinima,
            diasRestantes = Math.Round(diasRestantes, 1),
            promedioDiario = Math.Round(promedioDiario, 1)
        });
    }

    // GET api/inventario/movimientos
    [HttpGet("movimientos")]
    public async Task<IActionResult> GetMovimientos([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var total = await _db.MovimientosInventario.CountAsync();
        var movimientos = await _db.MovimientosInventario
            .Include(m => m.Pedido)
            .OrderByDescending(m => m.Fecha)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new {
                m.Id,
                m.Tipo,
                m.M3,
                m.M3Anterior,
                m.M3Posterior,
                m.Descripcion,
                m.Fecha,
                m.PedidoId
            })
            .ToListAsync();

        return Ok(new { total, movimientos });
    }

    // POST api/inventario/produccion
    [HttpPost("produccion")]
    public async Task<IActionResult> AgregarProduccion([FromBody] MovimientoDto dto)
    {
        var inv = await _db.Inventario.FirstOrDefaultAsync();
        if (inv == null) return NotFound();

        var anterior = inv.M3Disponibles;
        inv.M3Disponibles = Math.Min(inv.CapacidadMaxima, inv.M3Disponibles + dto.M3);
        inv.UltimaActualizacion = DateTime.UtcNow;

        var mov = new MovimientoInventario
        {
            Tipo = TipoMovimiento.PRODUCCION,
            M3 = dto.M3,
            M3Anterior = anterior,
            M3Posterior = inv.M3Disponibles,
            Descripcion = dto.Descripcion ?? $"Producción: +{dto.M3} m³",
            UsuarioId = dto.UsuarioId,
            Fecha = DateTime.UtcNow
        };

        _db.MovimientosInventario.Add(mov);
        await _db.SaveChangesAsync();

        await _hub.Clients.All.SendAsync("ActualizarInventario", new { inv.M3Disponibles });
        return Ok(inv);
    }

    // POST api/inventario/ajuste
    [HttpPost("ajuste")]
    public async Task<IActionResult> Ajuste([FromBody] MovimientoDto dto)
    {
        var inv = await _db.Inventario.FirstOrDefaultAsync();
        if (inv == null) return NotFound();

        var anterior = inv.M3Disponibles;
        inv.M3Disponibles = Math.Max(0, Math.Min(inv.CapacidadMaxima, dto.M3));
        inv.UltimaActualizacion = DateTime.UtcNow;

        var mov = new MovimientoInventario
        {
            Tipo = TipoMovimiento.AJUSTE,
            M3 = dto.M3 - anterior,
            M3Anterior = anterior,
            M3Posterior = inv.M3Disponibles,
            Descripcion = dto.Descripcion ?? $"Ajuste manual: {dto.M3} m³",
            UsuarioId = dto.UsuarioId,
            Fecha = DateTime.UtcNow
        };

        _db.MovimientosInventario.Add(mov);
        await _db.SaveChangesAsync();

        await _hub.Clients.All.SendAsync("ActualizarInventario", new { inv.M3Disponibles });
        return Ok(inv);
    }

    // POST api/inventario/descontar
    [HttpPost("descontar")]
    public async Task<IActionResult> Descontar([FromBody] MovimientoDto dto)
    {
        var inv = await _db.Inventario.FirstOrDefaultAsync();
        if (inv == null) return NotFound();

        if (inv.M3Disponibles < dto.M3)
            return BadRequest($"Stock insuficiente. Disponible: {inv.M3Disponibles} m³");

        var anterior = inv.M3Disponibles;
        inv.M3Disponibles -= dto.M3;
        inv.UltimaActualizacion = DateTime.UtcNow;

        var mov = new MovimientoInventario
        {
            Tipo = TipoMovimiento.DESPACHO,
            M3 = dto.M3,
            M3Anterior = anterior,
            M3Posterior = inv.M3Disponibles,
            Descripcion = dto.Descripcion ?? $"Despacho: -{dto.M3} m³",
            PedidoId = dto.PedidoId,
            UsuarioId = dto.UsuarioId,
            Fecha = DateTime.UtcNow
        };

        _db.MovimientosInventario.Add(mov);
        await _db.SaveChangesAsync();

        // Alerta si stock bajo
        if (inv.M3Disponibles <= inv.AlertaMinima)
            await _hub.Clients.All.SendAsync("AlertaStockBajo", new { inv.M3Disponibles, inv.AlertaMinima });

        await _hub.Clients.All.SendAsync("ActualizarInventario", new { inv.M3Disponibles });
        return Ok(inv);
    }

    // PUT api/inventario/configurar
    [HttpPut("configurar")]
    public async Task<IActionResult> Configurar([FromBody] ConfigurarDto dto)
    {
        var inv = await _db.Inventario.FirstOrDefaultAsync();
        if (inv == null) return NotFound();

        inv.CapacidadMaxima = dto.CapacidadMaxima;
        inv.AlertaMinima = dto.AlertaMinima;
        inv.UltimaActualizacion = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(inv);
    }
}

public class MovimientoDto
{
    public double M3 { get; set; }
    public string? Descripcion { get; set; }
    public int? PedidoId { get; set; }
    public int? UsuarioId { get; set; }
}

public class ConfigurarDto
{
    public double CapacidadMaxima { get; set; }
    public double AlertaMinima { get; set; }
}