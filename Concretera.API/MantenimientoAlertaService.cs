using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Concretera.Infrastructure.Data;
using Concretera.Core.Models;
using Concretera.API.Hubs;

namespace Concretera.API.Services;

public class MantenimientoAlertaService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly IHubContext<DespachoHub> _hub;

    public MantenimientoAlertaService(IServiceProvider services, IHubContext<DespachoHub> hub)
    {
        _services = services;
        _hub = hub;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await VerificarAlertas();
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    private async Task VerificarAlertas()
    {
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hoy = DateTime.UtcNow.Date;
        var en7 = hoy.AddDays(7);

        var proximos = await db.Mantenimientos
            .Include(m => m.Camion)
            .Where(m => m.Estado == EstadoMantenimiento.PROGRAMADO &&
                        m.FechaProgramada.HasValue &&
                        m.FechaProgramada.Value.Date <= en7)
            .ToListAsync();

        foreach (var m in proximos)
        {
            var dias = (int)(m.FechaProgramada!.Value - DateTime.UtcNow).TotalDays;
            if (dias <= 0 || dias == 3 || dias == 7)
            {
                await _hub.Clients.All.SendAsync("AlertaMantenimiento", new
                {
                    m.Id,
                    m.Tipo,
                    m.Descripcion,
                    camion = m.Camion?.Nombre,
                    diasRestantes = dias,
                    m.FechaProgramada
                });
            }
        }
    }
}