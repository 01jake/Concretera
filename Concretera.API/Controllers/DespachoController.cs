using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Concretera.Infrastructure.Data;
using Concretera.Core.Models;
using Concretera.Core.DTOs;
using Concretera.API.Hubs;

namespace Concretera.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DespachoController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHubContext<DespachoHub> _hub;

    public DespachoController(AppDbContext db, IHubContext<DespachoHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    // POST api/despacho/despachar
    [HttpPost("despachar")]
    public async Task<IActionResult> Despachar([FromBody] DespacharDto dto)
    {
        if (dto == null) return BadRequest("DTO nulo");
        if (string.IsNullOrEmpty(dto.Direccion)) return BadRequest("Falta dirección");
        if (dto.TravelMinutos <= 0) return BadRequest("Falta tiempo de viaje");
        if (dto.ClienteId <= 0) return BadRequest("Falta clienteId");

        // Encontrar camión disponible
        Camion? camion;
        if (dto.CamionId.HasValue)
            camion = await _db.Camiones.FindAsync(dto.CamionId.Value);
        else
            camion = await _db.Camiones
                .Where(c => c.Status == CamionStatus.LIBRE)
                .FirstOrDefaultAsync();

        if (camion == null)
            return BadRequest("No hay camiones disponibles");
        if (camion.Status != CamionStatus.LIBRE)
            return BadRequest($"El camión {camion.Nombre} no está libre");

        var pedido = new Pedido
        {
            ClienteId = dto.ClienteId,
            Direccion = dto.Direccion,
            Lat = dto.Lat,
            Lng = dto.Lng,
            M3Solicitados = dto.M3Solicitados,
            TravelMinutos = dto.TravelMinutos,
            DescargaMinutos = dto.DescargaMinutos,
            Notas = dto.Notas,
            Status = PedidoStatus.ASIGNADO,
            CamionId = camion.Id,
            FechaAsignada = DateTime.UtcNow
        };
        _db.Pedidos.Add(pedido);

        var now = DateTime.UtcNow;
        var cliente = await _db.Clientes.FindAsync(dto.ClienteId);
        camion.Status = CamionStatus.CARGANDO;
        camion.DestinoNombre = cliente?.Nombre ?? dto.Direccion.Split(',')[0];
        camion.DestinoDireccion = dto.Direccion;
        camion.DestinoLat = dto.Lat;
        camion.DestinoLng = dto.Lng;
        camion.TravelMinutos = dto.TravelMinutos;
        camion.DescargaMinutos = dto.DescargaMinutos;
        camion.CargaInicio = now;
        camion.CargaFin = now.AddMinutes(10);
        camion.LlegadaEstimada = camion.CargaFin.Value.AddMinutes(dto.TravelMinutos);
        camion.DescargaFin = camion.LlegadaEstimada.Value.AddMinutes(dto.DescargaMinutos);
        camion.RegresoFin = camion.DescargaFin.Value.AddMinutes(dto.TravelMinutos);
        camion.UltimaActualizacion = now;

        await _db.SaveChangesAsync();
        await _hub.Clients.All.SendAsync("ActualizarCamion", camion);

        return Ok(pedido);
    }

    // POST api/despacho/cola
    [HttpPost("cola")]
    public async Task<IActionResult> AgregarCola([FromBody] CrearPedidoDto dto)
    {
        var pedido = new Pedido
        {
            ClienteId = dto.ClienteId,
            Direccion = dto.Direccion,
            Lat = dto.Lat,
            Lng = dto.Lng,
            M3Solicitados = dto.M3Solicitados,
            TravelMinutos = dto.TravelMinutos,
            DescargaMinutos = dto.DescargaMinutos,
            Notas = dto.Notas,
            Status = PedidoStatus.PENDIENTE
        };
        _db.Pedidos.Add(pedido);
        await _db.SaveChangesAsync();

        var pedidoConCliente = await _db.Pedidos
            .Include(p => p.Cliente)
            .FirstAsync(p => p.Id == pedido.Id);

        // Notificar a todos que hay nuevo pedido en cola
        await _hub.Clients.All.SendAsync("NuevoPedido", pedidoConCliente);

        return Ok(pedidoConCliente);
    }

    // GET api/despacho/cola
    [HttpGet("cola")]
    public async Task<IActionResult> GetCola()
    {
        var cola = await _db.Pedidos
            .Where(p => p.Status == PedidoStatus.PENDIENTE)
            .Include(p => p.Cliente)
            .OrderBy(p => p.FechaSolicitada)
            .ToListAsync();
        return Ok(cola);
    }

    // POST api/despacho/cola/5/asignar
    [HttpPost("cola/{pedidoId}/asignar")]
    public async Task<IActionResult> AsignarDeCola(int pedidoId, [FromBody] AsignarDeCola dto)
    {
        var pedido = await _db.Pedidos.Include(p => p.Cliente).FirstOrDefaultAsync(p => p.Id == pedidoId);
        if (pedido == null) return NotFound();

        var camion = await _db.Camiones.FindAsync(dto.CamionId);
        if (camion == null || camion.Status != CamionStatus.LIBRE)
            return BadRequest("Camión no disponible");

        var now = DateTime.UtcNow;
        camion.Status = CamionStatus.CARGANDO;
        camion.DestinoNombre = pedido.Cliente.Nombre;
        camion.DestinoDireccion = pedido.Direccion;
        camion.DestinoLat = pedido.Lat;
        camion.DestinoLng = pedido.Lng;
        camion.TravelMinutos = pedido.TravelMinutos;
        camion.DescargaMinutos = pedido.DescargaMinutos;
        camion.CargaInicio = now;
        camion.CargaFin = now.AddMinutes(10);
        camion.LlegadaEstimada = camion.CargaFin.Value.AddMinutes(pedido.TravelMinutos);
        camion.DescargaFin = camion.LlegadaEstimada.Value.AddMinutes(pedido.DescargaMinutos);
        camion.RegresoFin = camion.DescargaFin.Value.AddMinutes(pedido.TravelMinutos);
        camion.UltimaActualizacion = now;

        pedido.Status = PedidoStatus.ASIGNADO;
        pedido.CamionId = dto.CamionId;
        pedido.FechaAsignada = now;

        await _db.SaveChangesAsync();
        await _hub.Clients.All.SendAsync("ActualizarCamion", camion);

        return Ok(pedido);
    }

    // PATCH api/despacho/5/cancelar
    [HttpPatch("{id}/cancelar")]
    public async Task<IActionResult> Cancelar(int id)
    {
        var pedido = await _db.Pedidos.FindAsync(id);
        if (pedido == null) return NotFound();
        pedido.Status = PedidoStatus.CANCELADO;
        await _db.SaveChangesAsync();
        return Ok(pedido);
    }

    // GET api/despacho/historial
    [HttpGet("historial")]
    public async Task<IActionResult> GetHistorial(
     [FromQuery] DateTime? desde,
     [FromQuery] DateTime? hasta,
     [FromQuery] int? camionId,
     [FromQuery] int? clienteId,
     [FromQuery] string? status)
    {
        var query = _db.Pedidos
            .Include(p => p.Cliente)
            .Include(p => p.Camion)
            .AsQueryable();

        if (desde.HasValue) query = query.Where(p => p.FechaSolicitada >= desde.Value);
        if (hasta.HasValue) query = query.Where(p => p.FechaSolicitada <= hasta.Value);
        if (camionId.HasValue) query = query.Where(p => p.CamionId == camionId.Value);
        if (clienteId.HasValue) query = query.Where(p => p.ClienteId == clienteId.Value);
        if (!string.IsNullOrEmpty(status)) query = query.Where(p => p.Status.ToString() == status);

        var result = await query
            .OrderByDescending(p => p.FechaSolicitada)
            .ToListAsync();

        return Ok(result);
    }

    [HttpPost("confirmar-entrega")]
    public async Task<IActionResult> ConfirmarEntrega([FromBody] ConfirmarEntregaDto dto)
    {
        var pedido = await _db.Pedidos
            .Include(p => p.Cliente)
            .Include(p => p.Camion)
            .FirstOrDefaultAsync(p => p.Id == dto.PedidoId);

        if (pedido == null) return NotFound();

        var now = DateTime.UtcNow;

        pedido.Status = PedidoStatus.ENTREGADO;
        pedido.FotoEntregaUrl = dto.FotoUrl;
        pedido.FirmaDigitalUrl = dto.FirmaUrl;
        pedido.FechaEntrega = now;

        // ← Agregar esto: actualizar el camión igual que en ConductorViewController
        if (pedido.Camion != null)
        {
            pedido.Camion.Status = CamionStatus.REGRESANDO;
            pedido.Camion.UltimaActualizacion = now;
            pedido.Camion.RegresoFin = now.AddMinutes(pedido.Camion.TravelMinutos);
        }

        await _db.SaveChangesAsync();

        // Notificar camiones actualizados
        var camiones = await _db.Camiones
            .Include(c => c.Conductor)
            .ToListAsync();
        await _hub.Clients.All.SendAsync("ActualizarCamiones", camiones);
        await _hub.Clients.All.SendAsync("EntregaConfirmada", new
        {
            pedido.Id,
            pedido.Direccion,
            camion = pedido.Camion?.Nombre,
            cliente = pedido.Cliente?.Nombre,
            pedido.FechaEntrega
        });

        return Ok(pedido);
    }
    [HttpGet("en-proceso")]
    public async Task<IActionResult> GetEnProceso()
    {
        var pedidos = await _db.Pedidos
            .Include(p => p.Cliente)
            .Include(p => p.Camion)
            .Where(p => p.Status == PedidoStatus.ASIGNADO)
            .OrderByDescending(p => p.FechaAsignada)
            .ToListAsync();

        return Ok(pedidos);
    }
    public class ConfirmarEntregaDto
    {
        public int PedidoId { get; set; }
        public string? FotoUrl { get; set; }
        public string? FirmaUrl { get; set; }
        public string? Notas { get; set; }
    }

}