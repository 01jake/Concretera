namespace Concretera.Core.DTOs;

// ── AUTH ─────────────────────────────────────────────────────────
public record LoginDto(string Email, string Password);

public record AuthResponseDto(string Token, UserDto User, DateTime Expira);

public record UserDto(int Id, string Nombre, string Email, string Rol, int? CamionAsignadoId);

// ── CAMIONES ─────────────────────────────────────────────────────
public record CamionDto(
    int Id, string Nombre, string Placas, string Status,
    string? ConductorNombre, string? DestinoNombre, string? DestinoDireccion,
    double? DestinoLat, double? DestinoLng,
    int TravelMinutos, int DescargaMinutos,
    DateTime? CargaInicio, DateTime? CargaFin,
    DateTime? LlegadaEstimada, DateTime? DescargaFin, DateTime? RegresoFin,
    string Color, double CapacidadM3, DateTime UltimaActualizacion
);

public record ActualizarStatusDto(string Status);

// ── PEDIDOS ──────────────────────────────────────────────────────
public record CrearPedidoDto(
    int ClienteId,
    string Direccion,
    double Lat,
    double Lng,
    double M3Solicitados,
    int TravelMinutos,
    int DescargaMinutos,
    string? Notas,
    int? CamionId
);

public record DespacharDto(
    int ClienteId,
    string Direccion,
    double Lat,
    double Lng,
    double M3Solicitados,
    int TravelMinutos,
    int DescargaMinutos,
    string? Notas,
    int? CamionId
);

public record AsignarDeCola(int CamionId);

// ── CLIENTES ─────────────────────────────────────────────────────
public record CrearClienteDto(
    string Nombre,
    string Telefono,
    string? Email,
    string DireccionPrincipal,
    double Lat,
    double Lng,
    int TravelMinutosDefault
);

// ── MAPS ─────────────────────────────────────────────────────────
public record RouteInfoDto(
    int TravelMinutos,
    double DistanciaKm,
    string Direccion,
    double Lat,
    double Lng
);

// ── REPORTES ─────────────────────────────────────────────────────
public record ResumenDto(
    int TotalViajes,
    double TotalM3,
    double TotalKm,
    double TiempoPromedioMin,
    decimal IngresosTotales,
    decimal CostosTotales,
    decimal UtilidadTotal
);
