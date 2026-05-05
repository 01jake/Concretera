using System.ComponentModel.DataAnnotations;

namespace Concretera.Core.Models;

public enum PedidoStatus
{
    PENDIENTE,
    ASIGNADO,
    EN_PROCESO,
    ENTREGADO,
    CANCELADO
}

public class Pedido
{
    [Key]
    public int Id { get; set; }

    public int ClienteId { get; set; }
    public Cliente Cliente { get; set; } = null!;

    [Required]
    public string Direccion { get; set; } = string.Empty;
    public double Lat { get; set; }
    public double Lng { get; set; }

    public double M3Solicitados { get; set; } = 6;

    public PedidoStatus Status { get; set; } = PedidoStatus.PENDIENTE;

    public int? CamionId { get; set; }
    public Camion? Camion { get; set; }

    public int TravelMinutos { get; set; }
    public int DescargaMinutos { get; set; } = 15;

    public DateTime FechaSolicitada { get; set; } = DateTime.UtcNow;
    public DateTime? FechaAsignada { get; set; }
    public DateTime? FechaEntrega { get; set; }

    public string? Notas { get; set; }
    public string? FirmaDigitalUrl { get; set; }
    public string? FotoEntregaUrl { get; set; }

    public Viaje? Viaje { get; set; }
}
