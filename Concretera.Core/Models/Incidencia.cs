using System.ComponentModel.DataAnnotations;

namespace Concretera.Core.Models;

public enum TipoIncidencia
{
    LLANTA_PONCHADA,
    ACCIDENTE,
    DEMORA_EN_OBRA,
    FALLA_MECANICA,
    PROBLEMA_CLIENTE,
    OTRO
}

public enum SeveridadIncidencia
{
    BAJA,
    MEDIA,
    ALTA,
    CRITICA
}

public enum EstadoIncidencia
{
    ABIERTA,
    EN_PROCESO,
    RESUELTA
}

public class Incidencia
{
    [Key]
    public int Id { get; set; }

    public int CamionId { get; set; }
    public Camion? Camion { get; set; }

    public int? ReportadoPorId { get; set; }
    public Usuario? ReportadoPor { get; set; }

    public TipoIncidencia Tipo { get; set; }
    public SeveridadIncidencia Severidad { get; set; }
    public EstadoIncidencia Estado { get; set; } = EstadoIncidencia.ABIERTA;

    [Required]
    public string Descripcion { get; set; } = string.Empty;

    public string? FotoUrl { get; set; }
    public string? Resolucion { get; set; }

    public DateTime FechaReporte { get; set; } = DateTime.UtcNow;
    public DateTime? FechaResolucion { get; set; }

    public double? Lat { get; set; }
    public double? Lng { get; set; }
}