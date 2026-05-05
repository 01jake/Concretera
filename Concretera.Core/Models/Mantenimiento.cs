using System.ComponentModel.DataAnnotations;

namespace Concretera.Core.Models;

public enum TipoMantenimiento
{
    CAMBIO_ACEITE,
    REVISION_FRENOS,
    CAMBIO_LLANTAS,
    REVISION_GENERAL,
    SERVICIO_MAYOR,
    OTRO
}

public enum EstadoMantenimiento
{
    PROGRAMADO,
    EN_PROCESO,
    COMPLETADO,
    VENCIDO
}

public class Mantenimiento
{
    [Key]
    public int Id { get; set; }

    public int CamionId { get; set; }
    public Camion? Camion { get; set; }

    public TipoMantenimiento Tipo { get; set; }
    public EstadoMantenimiento Estado { get; set; } = EstadoMantenimiento.PROGRAMADO;

    [Required]
    public string Descripcion { get; set; } = string.Empty;

    // Por fecha
    public DateTime? FechaProgramada { get; set; }
    public DateTime? FechaRealizada { get; set; }
    public int? IntervaloDias { get; set; }

    // Por kilómetros
    public double? KmActual { get; set; }
    public double? KmProximo { get; set; }
    public double? KmIntervalo { get; set; }

    public decimal? Costo { get; set; }
    public string? Notas { get; set; }
    public string? TallerNombre { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
}