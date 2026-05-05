using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using Concretera.Infrastructure.Data;
using Concretera.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace Concretera.API.Hubs;

[Authorize]
public class DespachoHub : Hub
{
    private readonly AppDbContext _db;
    private readonly ILogger<DespachoHub> _log;

    public DespachoHub(AppDbContext db, ILogger<DespachoHub> log)
    {
        _db = db;
        _log = log;
    }

    public override async Task OnConnectedAsync()
    {
        var camiones = await _db.Camiones
            .Include(c => c.Conductor)
            .ToListAsync();
        await Clients.Caller.SendAsync("ActualizarCamiones", camiones);

        var cola = await _db.Pedidos
            .Where(p => p.Status == PedidoStatus.PENDIENTE)
            .Include(p => p.Cliente)
            .ToListAsync();
        await Clients.Caller.SendAsync("ActualizarCola", cola);

        await base.OnConnectedAsync();
    }

    public async Task DespacharCamion(int camionId, int pedidoId)
    {
        var camion = await _db.Camiones
            .Include(c => c.Conductor)
            .FirstOrDefaultAsync(c => c.Id == camionId);
        var pedido = await _db.Pedidos
            .Include(p => p.Cliente)
            .FirstOrDefaultAsync(p => p.Id == pedidoId);

        if (camion == null || pedido == null) return;
        if (camion.Status != CamionStatus.LIBRE) return;

        var now = DateTime.UtcNow;
        camion.Status = CamionStatus.CARGANDO;
        camion.DestinoNombre = pedido.Cliente?.Nombre;
        camion.DestinoDireccion = pedido.Direccion;
        camion.DestinoLat = pedido.Lat;
        camion.DestinoLng = pedido.Lng;
        camion.TravelMinutos = pedido.TravelMinutos;
        camion.DescargaMinutos = pedido.DescargaMinutos;
        camion.CargaInicio = now;
        camion.CargaFin = now.AddMinutes(10);
        camion.LlegadaEstimada = now.AddMinutes(10 + pedido.TravelMinutos);
        camion.DescargaFin = now.AddMinutes(10 + pedido.TravelMinutos + pedido.DescargaMinutos);
        camion.RegresoFin = now.AddMinutes(10 + pedido.TravelMinutos * 2 + pedido.DescargaMinutos);
        camion.UltimaActualizacion = now;

        pedido.Status = PedidoStatus.ASIGNADO;
        pedido.CamionId = camionId;
        pedido.FechaAsignada = now;

        await _db.SaveChangesAsync();

        await Clients.All.SendAsync("ActualizarCamion", camion);

        // Notificar al conductor que tiene nueva ruta
        await Clients.All.SendAsync("NuevaRutaAsignada", new
        {
            camionId,
            direccion = pedido.Direccion,
            lat = pedido.Lat,
            lng = pedido.Lng,
            travelMinutos = pedido.TravelMinutos,
            descargaMinutos = pedido.DescargaMinutos,
            cliente = pedido.Cliente?.Nombre
        });

        _log.LogInformation("Camión {Id} despachado a {Dest}", camionId, pedido.Direccion);
    }

    // Conductor envía su ubicación GPS en tiempo real
    public async Task EnviarUbicacion(int camionId, double lat, double lng)
    {
        var camion = await _db.Camiones.FindAsync(camionId);
        if (camion == null) return;

        camion.Lat = lat;
        camion.Lng = lng;
        camion.UltimaActualizacion = DateTime.UtcNow;

        // Recalcular ETA si está en ruta
        if (camion.Status == CamionStatus.EN_RUTA && camion.DestinoLat.HasValue && camion.DestinoLng.HasValue)
        {
            var distanciaKm = CalcularDistancia(lat, lng, camion.DestinoLat.Value, camion.DestinoLng.Value);
            var velocidadKmH = 40.0; // velocidad promedio ciudad
            var minutosRestantes = (int)Math.Ceiling((distanciaKm / velocidadKmH) * 60);
            camion.LlegadaEstimada = DateTime.UtcNow.AddMinutes(minutosRestantes);
            camion.TravelMinutos = minutosRestantes;
        }

        await _db.SaveChangesAsync();

        // Notificar a todos la nueva ubicación
        await Clients.All.SendAsync("UbicacionConductor", new
        {
            camionId,
            nombre = camion.Nombre,
            lat,
            lng,
            eta = camion.LlegadaEstimada,
            travelMinutosRestantes = camion.TravelMinutos,
            status = camion.Status
        });
    }

    public async Task LiberarCamion(int camionId)
    {
        var camion = await _db.Camiones.FindAsync(camionId);
        if (camion == null) return;

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
        camion.Lat = null;
        camion.Lng = null;
        camion.UltimaActualizacion = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await Clients.All.SendAsync("ActualizarCamion", camion);
    }

    // Fórmula Haversine para distancia entre dos puntos GPS
    private static double CalcularDistancia(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLng = (lng2 - lng1) * Math.PI / 180;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }
}