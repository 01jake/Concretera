using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Concretera.Core.Models;

public enum UserRole { ADMIN, DESPACHADOR, CONDUCTOR }

public class Usuario
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public UserRole Rol { get; set; } = UserRole.DESPACHADOR;

    public int? CamionAsignadoId { get; set; }

    [ForeignKey("CamionAsignadoId")]
    public Camion? CamionAsignado { get; set; }

    public bool Activo { get; set; } = true;

    // ← NUEVOS campos de conductor
    public string? Telefono { get; set; }
    public string? FotoUrl { get; set; }
    public string? NumeroLicencia { get; set; }
    public DateTime? LicenciaVencimiento { get; set; }
    public DateTime FechaIngreso { get; set; } = DateTime.UtcNow;
    public string? Notas { get; set; }
}