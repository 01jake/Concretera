using System.ComponentModel.DataAnnotations;

namespace Concretera.Core.Models;

public enum TipoMovimiento
{
    PRODUCCION,
    DESPACHO,
    AJUSTE,
    MERMA
}

public class InventarioPlanta
{
    [Key]
    public int Id { get; set; }
    public double M3Disponibles { get; set; } = 0;
    public double CapacidadMaxima { get; set; } = 500;
    public double AlertaMinima { get; set; } = 50;
    public DateTime UltimaActualizacion { get; set; } = DateTime.UtcNow;
}

public class MovimientoInventario
{
    [Key]
    public int Id { get; set; }
    public TipoMovimiento Tipo { get; set; }
    public double M3 { get; set; }
    public double M3Anterior { get; set; }
    public double M3Posterior { get; set; }
    public string? Descripcion { get; set; }
    public int? PedidoId { get; set; }
    public Pedido? Pedido { get; set; }
    public int? UsuarioId { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
}