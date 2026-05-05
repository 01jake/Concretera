using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Concretera.Core.DTOs;
using Concretera.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Concretera.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _cfg;

    public AuthController(AppDbContext db, IConfiguration cfg)
    {
        _db = db;
        _cfg = cfg;
    }

    // POST api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Email == dto.Email && u.Activo);

        if (usuario == null || !BCrypt.Net.BCrypt.Verify(dto.Password, usuario.PasswordHash))
            return Unauthorized("Credenciales incorrectas");

        var token = GenerarToken(usuario);
        var expira = DateTime.UtcNow.AddHours(8);

        // En AuthController.cs el login debe devolver:
        return Ok(new
        {
            token,
            user = new
            {
                id = usuario.Id,  // ← este campo es crítico
                nombre = usuario.Nombre,
                email = usuario.Email,
                rol = usuario.Rol.ToString()
            }
        });
    }



    // SOLO PARA DESARROLLO — quitar en producción
    [HttpGet("hash")]
    [AllowAnonymous]
    public IActionResult GenerarHash([FromQuery] string password)
    {
        return Ok(new { hash = BCrypt.Net.BCrypt.HashPassword(password) });
    }


    private string GenerarToken(Core.Models.Usuario usuario)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_cfg["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
   {
    new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
    new Claim(ClaimTypes.Name, usuario.Nombre),
    new Claim(ClaimTypes.Email, usuario.Email),
    new Claim(ClaimTypes.Role, usuario.Rol.ToString())
};

        var token = new JwtSecurityToken(
            issuer: _cfg["Jwt:Issuer"],
            audience: _cfg["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
