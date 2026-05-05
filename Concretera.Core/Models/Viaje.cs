using System.ComponentModel.DataAnnotations;

namespace Concretera.Core.Models;

public class Viaje
{
    [Key]
    public int Id { get; set; }

    public int CamionId { get; set; }
    public Camion Camion { get; set; } = null!;

    public int ConductorId { get; set; }
    public Usuario Conductor { get; set; } = null!;

    public int ClienteId { get; set; }
    public Cliente Cliente { get; set; } = null!;

    public int PedidoId { get; set; }
    public Pedido Pedido { get; set; } = null!;

    public string DireccionDestino { get; set; } = string.Empty;
    public double Lat { get; set; }
    public double Lng { get; set; }

    public double M3Entregados { get; set; }
    public double DistanciaKm { get; set; }

    public int TravelMinutosIda { get; set; }
    public int TravelMinutosVuelta { get; set; }
    public int DescargaMinutos { get; set; }
    public int CargaMinutos { get; set; } = 10;
    public int TiempoTotalMinutos { get; set; }

    public DateTime FechaInicio { get; set; } = DateTime.UtcNow;
    public DateTime? FechaFin { get; set; }

    // Costos
    public decimal CostoCombustible { get; set; }
    public decimal CostoTotal { get; set; }
    public decimal TarifaM3 { get; set; }
    public decimal Ingresos { get; set; }
    public decimal Utilidad { get; set; }

    public string? FirmaDigitalUrl { get; set; }
    public string? FotoEntregaUrl { get; set; }
    public string? Notas { get; set; }
}
