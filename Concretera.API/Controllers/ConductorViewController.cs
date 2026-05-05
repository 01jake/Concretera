using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Concretera.Infrastructure.Data;
using Concretera.Core.Models;
using Concretera.API.Hubs;
using System.Security.Claims;

namespace Concretera.API.Controllers;

[ApiController]
[Route("api/conductor")]
[Authorize]
public class ConductorViewController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHubContext<DespachoHub> _hub;

    public ConductorViewController(AppDbContext db, IHubContext<DespachoHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    // GET api/conductor/mi-camion
    [HttpGet("mi-camion")]
    public async Task<IActionResult> GetMiCamion()
    {
        var userId = GetUserId();
        var usuario = await _db.Usuarios
            .Include(u => u.CamionAsignado)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (usuario?.CamionAsignado == null)
            return NotFound("No tienes un camión asignado");

        var camion = usuario.CamionAsignado;

        // Pedido activo del camión
        var pedidoActivo = await _db.Pedidos
            .Include(p => p.Cliente)
            .Where(p => p.CamionId == camion.Id &&
                   (p.Status == PedidoStatus.ASIGNADO || p.Status == PedidoStatus.EN_PROCESO))
            .OrderByDescending(p => p.FechaAsignada)
            .FirstOrDefaultAsync();

        // Historial reciente
        var historial = await _db.Pedidos
            .Include(p => p.Cliente)
            .Where(p => p.CamionId == camion.Id && p.Status == PedidoStatus.ENTREGADO)
            .OrderByDescending(p => p.FechaEntrega)
            .Take(10)
            .Select(p => new {
                p.Id,
                p.Direccion,
                p.M3Solicitados,
                p.FechaSolicitada,
                p.FechaEntrega,
                cliente = p.Cliente == null ? null : new { p.Cliente.Nombre }
            })
            .ToListAsync();

        return Ok(new
        {
            camion = new
            {
                camion.Id,
                camion.Nombre,
                camion.Placas,
                camion.Status,
                camion.CapacidadM3,
                camion.UltimaActualizacion,
                camion.TravelMinutos,
                camion.DescargaMinutos,
                camion.Lat,
                camion.Lng,
                camion.DestinoNombre,
                camion.DestinoDireccion,
                camion.DestinoLat,
                camion.DestinoLng,
                faseInicio = camion.CargaInicio  // ← usa CargaInicio en lugar de FaseInicio
            },
            pedidoActivo = pedidoActivo == null ? null : new
            {
                pedidoActivo.Id,
                pedidoActivo.Direccion,
                pedidoActivo.M3Solicitados,
                pedidoActivo.Status,
                pedidoActivo.Lat,
                pedidoActivo.Lng,
                pedidoActivo.TravelMinutos,
                pedidoActivo.DescargaMinutos,
                pedidoActivo.FechaAsignada,
                pedidoActivo.Notas,
                cliente = pedidoActivo.Cliente == null ? null : new
                {
                    pedidoActivo.Cliente.Nombre,
                    pedidoActivo.Cliente.Telefono,
                    pedidoActivo.Cliente.TelefonoObra,
                    pedidoActivo.Cliente.ContactoObra
                }
            },
            historial
        });
    }

    // POST api/conductor/ubicacion
    [HttpPost("ubicacion")]
    public async Task<IActionResult> EnviarUbicacion([FromBody] UbicacionDto dto)
    {
        var userId = GetUserId();
        var usuario = await _db.Usuarios
            .Include(u => u.CamionAsignado)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (usuario?.CamionAsignado == null) return NotFound();

        // Actualizar ubicación del camión
        var camion = usuario.CamionAsignado;
        camion.Lat = dto.Lat;
        camion.Lng = dto.Lng;
        camion.UltimaActualizacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Notificar al admin por SignalR
        await _hub.Clients.All.SendAsync("UbicacionConductor", new
        {
            camionId = camion.Id,
            nombre = camion.Nombre,
            dto.Lat,
            dto.Lng,
            fecha = DateTime.UtcNow
        });

        return Ok(new { message = "Ubicación actualizada" });
    }

    // POST api/conductor/confirmar-carga
    [HttpPost("confirmar-carga")]
    public async Task<IActionResult> ConfirmarCarga([FromBody] AccionDto dto)
    {
        var userId = GetUserId();
        var usuario = await _db.Usuarios
            .Include(u => u.CamionAsignado)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (usuario?.CamionAsignado == null) return NotFound();

        var camion = usuario.CamionAsignado;
        var now = DateTime.UtcNow;

        camion.Status = CamionStatus.EN_RUTA;
        camion.CargaFin = now;
        camion.UltimaActualizacion = now;
        camion.LlegadaEstimada = now.AddMinutes(camion.TravelMinutos);
        camion.DescargaFin = camion.LlegadaEstimada.Value.AddMinutes(camion.DescargaMinutos);
        camion.RegresoFin = camion.DescargaFin.Value.AddMinutes(camion.TravelMinutos);

        await _db.SaveChangesAsync();

        var camiones = await _db.Camiones
            .Include(c => c.Conductor)
            .ToListAsync();
        await _hub.Clients.All.SendAsync("ActualizarCamiones", camiones);

        return Ok(new { message = "Carga confirmada — en ruta" });
    }

    // POST api/conductor/confirmar-entrega
    [HttpPost("confirmar-entrega")]
    public async Task<IActionResult> ConfirmarEntrega([FromBody] EntregaConductorDto dto)
    {
        var userId = GetUserId();
        var usuario = await _db.Usuarios
            .Include(u => u.CamionAsignado)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (usuario?.CamionAsignado == null) return NotFound();

        var pedido = await _db.Pedidos
            .Include(p => p.Cliente)
            .Include(p => p.Camion)
            .FirstOrDefaultAsync(p => p.Id == dto.PedidoId);

        if (pedido == null) return NotFound();

        var now = DateTime.UtcNow;

        pedido.Status = PedidoStatus.ENTREGADO;
        pedido.FechaEntrega = now;
        pedido.FotoEntregaUrl = dto.FotoUrl;
        pedido.FirmaDigitalUrl = dto.FirmaUrl;

        // ← Camión pasa a REGRESANDO con timer correcto
        var camion = usuario.CamionAsignado;
        camion.Status = CamionStatus.REGRESANDO;
        camion.UltimaActualizacion = now;
        camion.RegresoFin = now.AddMinutes(camion.TravelMinutos);

        await _db.SaveChangesAsync();

        var camiones = await _db.Camiones
            .Include(c => c.Conductor)
            .ToListAsync();
        await _hub.Clients.All.SendAsync("ActualizarCamiones", camiones);
        await _hub.Clients.All.SendAsync("EntregaConfirmada", new
        {
            pedido.Id,
            cliente = pedido.Cliente?.Nombre,
            camion = pedido.Camion?.Nombre,
            pedido.FechaEntrega
        });

        return Ok(new { message = "Entrega confirmada" });
    }
}

public class UbicacionDto
{
    public double Lat { get; set; }
    public double Lng { get; set; }
}

public class AccionDto
{
    public int? PedidoId { get; set; }
}

public class EntregaConductorDto
{
    public int PedidoId { get; set; }
    public string? FotoUrl { get; set; }
    public string? FirmaUrl { get; set; }
}