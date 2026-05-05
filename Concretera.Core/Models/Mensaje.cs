using System.ComponentModel.DataAnnotations;

namespace Concretera.Core.Models;

public class Mensaje
{
    [Key]
    public int Id { get; set; }

    public int RemitenteId { get; set; }
    public Usuario? Remitente { get; set; }

    public int DestinatarioId { get; set; }
    public Usuario? Destinatario { get; set; }

    [Required]
    public string Texto { get; set; } = string.Empty;

    public string? FotoUrl { get; set; }
    public bool Leido { get; set; } = false;
    public DateTime FechaEnvio { get; set; } = DateTime.UtcNow;
}