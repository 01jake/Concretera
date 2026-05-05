using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Concretera.Infrastructure.Data;
using Concretera.Core.Models;
using BCrypt.Net;

namespace Concretera.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConductoresController : ControllerBase
{
    private readonly AppDbContext _db;
    public ConductoresController(AppDbContext db) => _db = db;

    // GET api/conductores
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var conductores = await _db.Usuarios
            .Include(u => u.CamionAsignado)
            .Where(u => u.Rol == UserRole.CONDUCTOR)
            .OrderBy(u => u.Nombre)
            .Select(u => new {
                u.Id,
                u.Nombre,
                u.Email,
                u.Telefono,
                u.FotoUrl,
                u.NumeroLicencia,
                u.LicenciaVencimiento,
                u.FechaIngreso,
                u.Activo,
                u.Notas,
                u.CamionAsignadoId,
                camion = u.CamionAsignado == null ? null : new
                {
                    u.CamionAsignado.Id,
                    u.CamionAsignado.Nombre,
                    u.CamionAsignado.Placas
                },
                totalViajes = _db.Pedidos.Count(p => p.CamionId == u.CamionAsignadoId),
                m3Total = _db.Pedidos
                    .Where(p => p.CamionId == u.CamionAsignadoId && p.Status == PedidoStatus.ENTREGADO)
                    .Sum(p => (double?)p.M3Solicitados) ?? 0
            })
            .ToListAsync();

        return Ok(conductores);
    }

    // GET api/conductores/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var u = await _db.Usuarios
            .Include(u => u.CamionAsignado)
            .FirstOrDefaultAsync(u => u.Id == id && u.Rol == UserRole.CONDUCTOR);
        if (u == null) return NotFound();
        return Ok(u);
    }

    // POST api/conductores
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ConductorDto dto)
    {
        var usuario = new Usuario
        {
            Nombre = dto.Nombre,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password ?? "Conductor123!"),
            Rol = UserRole.CONDUCTOR,
            Telefono = dto.Telefono,
            FotoUrl = dto.FotoUrl,
            NumeroLicencia = dto.NumeroLicencia,
            LicenciaVencimiento = dto.LicenciaVencimiento,
            CamionAsignadoId = dto.CamionAsignadoId,
            Activo = true,
            Notas = dto.Notas,
            FechaIngreso = DateTime.UtcNow
        };
        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync();
        return Ok(usuario);
    }

    // PUT api/conductores/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ConductorDto dto)
    {
        var u = await _db.Usuarios.FindAsync(id);
        if (u == null) return NotFound();

        u.Nombre = dto.Nombre;
        u.Email = dto.Email;
        u.Telefono = dto.Telefono;
        u.FotoUrl = dto.FotoUrl;
        u.NumeroLicencia = dto.NumeroLicencia;
        u.LicenciaVencimiento = dto.LicenciaVencimiento;
        u.CamionAsignadoId = dto.CamionAsignadoId;
        u.Activo = dto.Activo;
        u.Notas = dto.Notas;

        if (!string.IsNullOrEmpty(dto.Password))
            u.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

        await _db.SaveChangesAsync();
        return Ok(u);
    }

    // DELETE api/conductores/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var u = await _db.Usuarios.FindAsync(id);
        if (u == null) return NotFound();
        u.Activo = false;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Conductor desactivado" });
    }
}

public class ConductorDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Password { get; set; }
    public string? Telefono { get; set; }
    public string? FotoUrl { get; set; }
    public string? NumeroLicencia { get; set; }
    public DateTime? LicenciaVencimiento { get; set; }
    public int? CamionAsignadoId { get; set; }
    public bool Activo { get; set; } = true;
    public string? Notas { get; set; }
}