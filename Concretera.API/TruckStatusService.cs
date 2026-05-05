using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Concretera.Infrastructure.Data;
using Concretera.Core.Models;
using Concretera.API.Hubs;

namespace Concretera.API.Services;

public class TruckStatusService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly IHubContext<DespachoHub> _hub;
    private readonly ILogger<TruckStatusService> _log;

    public TruckStatusService(
        IServiceProvider services,
        IHubContext<DespachoHub> hub,
        ILogger<TruckStatusService> log)
    {
        _services = services;
        _hub = hub;
        _log = log;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            await CheckAndUpdateTrucks();
            await Task.Delay(TimeSpan.FromSeconds(10), ct);
        }
    }

    private async Task CheckAndUpdateTrucks()
{
    using var scope = _services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var now = DateTime.UtcNow;
    var changed = false;

    var camiones = await db.Camiones
        .Where(c => c.Status != CamionStatus.LIBRE &&
                   c.Status != CamionStatus.MANTENIMIENTO)
        .ToListAsync();

    foreach (var c in camiones)
    {
        var prev = c.Status;

        if (c.Status == CamionStatus.CARGANDO && c.CargaFin.HasValue && now >= c.CargaFin)
        {
            c.Status = CamionStatus.EN_RUTA;
        }
        else if (c.Status == CamionStatus.EN_RUTA && c.LlegadaEstimada.HasValue && now >= c.LlegadaEstimada)
        {
            c.Status = CamionStatus.DESCARGANDO;
            c.DescargaFin = now.AddMinutes(c.DescargaMinutos);
        }
        else if (c.Status == CamionStatus.DESCARGANDO && c.DescargaFin.HasValue && now >= c.DescargaFin)
        {
            c.Status = CamionStatus.REGRESANDO;
            c.RegresoFin = now.AddMinutes(c.TravelMinutos);

            // ← NUEVO: marcar pedido como ENTREGADO
            var pedidoEntregado = await db.Pedidos
                .Where(p => p.CamionId == c.Id && p.Status == PedidoStatus.ASIGNADO)
                .OrderByDescending(p => p.FechaAsignada)
                .FirstOrDefaultAsync();

            if (pedidoEntregado != null)
            {
                pedidoEntregado.Status = PedidoStatus.ENTREGADO;
                pedidoEntregado.FechaEntrega = now;
            }
        }
        else if (c.Status == CamionStatus.REGRESANDO && c.RegresoFin.HasValue && now >= c.RegresoFin)
        {
            var pedidoPendiente = await db.Pedidos
                .Include(p => p.Cliente)
                .Where(p => p.Status == PedidoStatus.PENDIENTE)
                .OrderBy(p => p.FechaSolicitada)
                .FirstOrDefaultAsync();

            if (pedidoPendiente != null)
            {
                c.Status = CamionStatus.CARGANDO;
                c.DestinoNombre = pedidoPendiente.Cliente?.Nombre ?? pedidoPendiente.Direccion;
                c.DestinoDireccion = pedidoPendiente.Direccion;
                c.DestinoLat = pedidoPendiente.Lat;
                c.DestinoLng = pedidoPendiente.Lng;
                c.TravelMinutos = pedidoPendiente.TravelMinutos;
                c.DescargaMinutos = pedidoPendiente.DescargaMinutos;
                c.CargaInicio = now;
                c.CargaFin = now.AddMinutes(10);
                c.LlegadaEstimada = c.CargaFin.Value.AddMinutes(pedidoPendiente.TravelMinutos);
                c.DescargaFin = c.LlegadaEstimada.Value.AddMinutes(pedidoPendiente.DescargaMinutos);
                c.RegresoFin = c.DescargaFin.Value.AddMinutes(pedidoPendiente.TravelMinutos);

                pedidoPendiente.Status = PedidoStatus.ASIGNADO;
                pedidoPendiente.CamionId = c.Id;
                pedidoPendiente.FechaAsignada = now;

                _log.LogInformation("Camión {Id} tomó pedido de cola: {Dest}", c.Id, pedidoPendiente.Direccion);
            }
            else
            {
                c.Status = CamionStatus.LIBRE;
                c.DestinoNombre = null;
                c.DestinoDireccion = null;
                c.DestinoLat = null;
                c.DestinoLng = null;
                c.CargaInicio = null;
                c.CargaFin = null;
                c.LlegadaEstimada = null;
                c.DescargaFin = null;
                c.RegresoFin = null;
                c.TravelMinutos = 0;
            }
        }

        if (c.Status != prev)
        {
            c.UltimaActualizacion = now;
            changed = true;
            _log.LogInformation("Camión {Id} cambió de {Prev} a {New}", c.Id, prev, c.Status);
        }
    }

    if (changed)
    {
        await db.SaveChangesAsync();
        var todos = await db.Camiones.ToListAsync();
        await _hub.Clients.All.SendAsync("ActualizarCamiones", todos);
    }
}
}