using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Concretera.Infrastructure.Data;
using Concretera.Core.Models;
using System.Security.Claims;

namespace Concretera.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PerfilController : ControllerBase
{
    private readonly AppDbContext _db;

    public PerfilController(AppDbContext db) => _db = db;

    private int GetUserId() =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    // GET api/perfil
    [HttpGet]
    public async Task<IActionResult> GetPerfil()
    {
        var id = GetUserId();
        var u = await _db.Usuarios
            .Include(u => u.CamionAsignado)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (u == null) return NotFound();

        var totalPedidos = await _db.Pedidos
            .CountAsync(p => p.CamionId == u.CamionAsignadoId);

        var ultimosPedidos = await _db.Pedidos
            .Include(p => p.Cliente)
            .Where(p => p.CamionId == u.CamionAsignadoId)
            .OrderByDescending(p => p.FechaSolicitada)
            .Take(5)
            .Select(p => new {
                p.Id,
                p.Direccion,
                p.Status,
                p.FechaSolicitada,
                p.M3Solicitados,
                cliente = p.Cliente == null ? null : new { p.Cliente.Nombre }
            })
            .ToListAsync();

        return Ok(new
        {
            u.Id,
            u.Nombre,
            u.Email,
            u.Rol,
            u.Telefono,
            u.FotoUrl,
            u.Activo,
            u.FechaIngreso,
            u.Notas,
            camion = u.CamionAsignado == null ? null : new
            {
                u.CamionAsignado.Id,
                u.CamionAsignado.Nombre,
                u.CamionAsignado.Placas
            },
            estadisticas = new { totalPedidos },
            ultimosPedidos
        });
    }

    // PUT api/perfil
    [HttpPut]
    public async Task<IActionResult> UpdatePerfil([FromBody] UpdatePerfilDto dto)
    {
        var id = GetUserId();
        var u = await _db.Usuarios.FindAsync(id);
        if (u == null) return NotFound();

        u.Nombre = dto.Nombre;
        u.Email = dto.Email;
        u.Telefono = dto.Telefono;
        u.FotoUrl = dto.FotoUrl;

        await _db.SaveChangesAsync();
        return Ok(new { u.Id, u.Nombre, u.Email, u.Telefono, u.FotoUrl, u.Rol });
    }

    // PUT api/perfil/password
    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var id = GetUserId();
        var u = await _db.Usuarios.FindAsync(id);
        if (u == null) return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(dto.PasswordActual, u.PasswordHash))
            return BadRequest("La contraseña actual es incorrecta");

        u.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NuevoPassword);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Contraseña actualizada" });
    }
}

public class UpdatePerfilDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? FotoUrl { get; set; }
}

public class ChangePasswordDto
{
    public string PasswordActual { get; set; } = string.Empty;
    public string NuevoPassword { get; set; } = string.Empty;
}