using System.ComponentModel.DataAnnotations;

namespace Concretera.Core.Models;

public enum FacturaStatus
{
    PENDIENTE,
    PAGADA,
    CANCELADA
}

public class Factura
{
    [Key]
    public int Id { get; set; }

    public int Folio { get; set; }
    public string FolioFormateado => $"FAC-{Folio:D5}";

    public int ClienteId { get; set; }
    public Cliente? Cliente { get; set; }

    public FacturaStatus Status { get; set; } = FacturaStatus.PENDIENTE;

    public DateTime FechaEmision { get; set; } = DateTime.UtcNow;
    public DateTime? FechaPago { get; set; }
    public DateTime? FechaVencimiento { get; set; }

    public decimal Subtotal { get; set; }
    public decimal Iva { get; set; }
    public decimal Total { get; set; }

    public string? Notas { get; set; }
    public string? RfcCliente { get; set; }

    public List<FacturaConcepto> Conceptos { get; set; } = new();
}

public class FacturaConcepto
{
    [Key]
    public int Id { get; set; }

    public int FacturaId { get; set; }
    public Factura? Factura { get; set; }

    public int? PedidoId { get; set; }
    public Pedido? Pedido { get; set; }

    public string Descripcion { get; set; } = string.Empty;
    public double CantidadM3 { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Importe { get; set; }
}