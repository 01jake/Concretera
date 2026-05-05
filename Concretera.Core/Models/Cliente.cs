using System.ComponentModel.DataAnnotations;

namespace Concretera.Core.Models;

public class Cliente
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Telefono { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Email { get; set; }

    [Required]
    public string DireccionPrincipal { get; set; } = string.Empty;
    public double Lat { get; set; }
    public double Lng { get; set; }

    public int TravelMinutosDefault { get; set; } = 20;
    public bool Activo { get; set; } = true;
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    // ← NUEVOS
    public decimal Saldo { get; set; } = 0;
    public string? Notas { get; set; }
    public string? ContactoObra { get; set; }
    public string? TelefonoObra { get; set; }

    public ICollection<Pedido> Pedidos { get; set; } = new List<Pedido>();
}