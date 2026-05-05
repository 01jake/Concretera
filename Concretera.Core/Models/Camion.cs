using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Concretera.Core.Models;

public enum CamionStatus
{
    LIBRE,
    CARGANDO,
    EN_RUTA,
    DESCARGANDO,
    REGRESANDO,
    MANTENIMIENTO
}

public class Camion
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string Nombre { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Placas { get; set; } = string.Empty;

    public CamionStatus Status { get; set; } = CamionStatus.LIBRE;

    public int? ConductorId { get; set; }
    public Usuario? Conductor { get; set; }

    public string? DestinoNombre { get; set; }
    public string? DestinoDireccion { get; set; }
    public double? DestinoLat { get; set; }
    public double? DestinoLng { get; set; }

    public int TravelMinutos { get; set; } = 0;
    public int DescargaMinutos { get; set; } = 15;

    public DateTime? CargaInicio { get; set; }
    public DateTime? CargaFin { get; set; }
    public DateTime? LlegadaEstimada { get; set; }
    public DateTime? DescargaFin { get; set; }
    public DateTime? RegresoFin { get; set; }
    public double? Lat { get; set; }
    public double? Lng { get; set; }

    [Required]
    public string Color { get; set; } = "#4b9ef5";

    public double CapacidadM3 { get; set; } = 7;
    public DateTime UltimaActualizacion { get; set; } = DateTime.UtcNow;

    // Navegación
    public ICollection<Viaje> Viajes { get; set; } = new List<Viaje>();
}
