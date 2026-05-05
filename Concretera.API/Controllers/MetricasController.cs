using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Concretera.Infrastructure.Data;
using Concretera.Core.Models;

namespace Concretera.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MetricasController : ControllerBase
{
    private readonly AppDbContext _db;
    public MetricasController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetMetricas([FromQuery] string periodo = "semana")
    {
        var ahora = DateTime.UtcNow;
        DateTime desde = periodo switch
        {
            "hoy" => ahora.Date,
            "mes" => new DateTime(ahora.Year, ahora.Month, 1),
            _ => ahora.Date.AddDays(-(int)ahora.DayOfWeek)
        };

        var pedidos = await _db.Pedidos
            .Include(p => p.Camion)
            .Include(p => p.Cliente)
            .Where(p => p.FechaSolicitada >= desde)
            .ToListAsync();

        var todos = await _db.Pedidos
            .Include(p => p.Camion)
            .Include(p => p.Cliente)
            .ToListAsync();

        // Viajes por día
        var viajesPorDia = pedidos
            .GroupBy(p => p.FechaSolicitada.Date)
            .OrderBy(g => g.Key)
            .Select(g => new {
                fecha = g.Key.ToString("dd/MM"),
                viajes = g.Count(),
                m3 = g.Sum(p => p.M3Solicitados)
            }).ToList();

        // Camión más activo
        var porCamion = todos
            .Where(p => p.Camion != null)
            .GroupBy(p => p.Camion!.Nombre)
            .Select(g => new {
                camion = g.Key,
                viajes = g.Count(),
                m3 = g.Sum(p => p.M3Solicitados)
            })
            .OrderByDescending(x => x.viajes)
            .ToList();

        // Horas pico
        var horasPico = pedidos
            .GroupBy(p => p.FechaSolicitada.Hour)
            .Select(g => new { hora = g.Key, viajes = g.Count() })
            .OrderBy(x => x.hora)
            .ToList();

        // Por cliente
        var porCliente = todos
            .Where(p => p.Cliente != null)
            .GroupBy(p => p.Cliente!.Nombre)
            .Select(g => new {
                cliente = g.Key,
                viajes = g.Count(),
                m3 = g.Sum(p => p.M3Solicitados)
            })
            .OrderByDescending(x => x.m3)
            .Take(5)
            .ToList();

        // KPIs
        var entregados = pedidos.Count(p => p.Status == PedidoStatus.ENTREGADO);
        var pendientes = pedidos.Count(p => p.Status == PedidoStatus.PENDIENTE);
        var m3Total = pedidos.Sum(p => p.M3Solicitados);
        var cicloPromedio = pedidos.Any()
            ? pedidos.Average(p => p.TravelMinutos * 2 + p.DescargaMinutos + 10)
            : 0;

        return Ok(new
        {
            kpis = new
            {
                totalViajes = pedidos.Count,
                entregados,
                pendientes,
                m3Total,
                cicloPromedio = Math.Round(cicloPromedio, 0)
            },
            viajesPorDia,
            porCamion,
            horasPico,
            porCliente
        });
    }
}