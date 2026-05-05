using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Concretera.Infrastructure.Data;
using Concretera.Core.Models;
using Concretera.API.Hubs;
using System.Security.Claims;

namespace Concretera.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHubContext<DespachoHub> _hub;

    public ChatController(AppDbContext db, IHubContext<DespachoHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    // GET api/chat/conversaciones — lista de conductores con último mensaje
    [HttpGet("conversaciones")]
    public async Task<IActionResult> GetConversaciones()
    {
        var conductores = await _db.Usuarios
            .Where(u => u.Rol == UserRole.CONDUCTOR && u.Activo)
            .Select(u => new {
                u.Id,
                u.Nombre,
                u.Email,
                u.FotoUrl,
                ultimoMensaje = _db.Mensajes
                    .Where(m => (m.RemitenteId == u.Id || m.DestinatarioId == u.Id))
                    .OrderByDescending(m => m.FechaEnvio)
                    .Select(m => new { m.Texto, m.FechaEnvio, m.Leido, m.RemitenteId })
                    .FirstOrDefault(),
                noLeidos = _db.Mensajes
                    .Count(m => m.RemitenteId == u.Id && !m.Leido)
            })
            .ToListAsync();

        return Ok(conductores);
    }

    // GET api/chat/mensajes/5 — historial con un conductor
    [HttpGet("mensajes/{conductorId}")]
    public async Task<IActionResult> GetMensajes(int conductorId, [FromQuery] int page = 1)
    {
        var userId = GetUserId();
        var mensajes = await _db.Mensajes
            .Include(m => m.Remitente)
            .Where(m =>
                (m.RemitenteId == userId && m.DestinatarioId == conductorId) ||
                (m.RemitenteId == conductorId && m.DestinatarioId == userId))
            .OrderByDescending(m => m.FechaEnvio)
            .Take(50)
            .OrderBy(m => m.FechaEnvio)
            .Select(m => new {
                m.Id,
                m.Texto,
                m.FotoUrl,
                m.FechaEnvio,
                m.Leido,
                m.RemitenteId,
                remitente = new { m.Remitente!.Nombre, m.Remitente.FotoUrl }
            })
            .ToListAsync();

        // Marcar como leídos
        var noLeidos = await _db.Mensajes
            .Where(m => m.RemitenteId == conductorId && m.DestinatarioId == userId && !m.Leido)
            .ToListAsync();

        noLeidos.ForEach(m => m.Leido = true);
        await _db.SaveChangesAsync();

        return Ok(mensajes);
    }

    // POST api/chat/enviar
    [HttpPost("enviar")]
    public async Task<IActionResult> Enviar([FromBody] EnviarMensajeDto dto)
    {
        var userId = GetUserId();
        var remitente = await _db.Usuarios.FindAsync(userId);
        if (remitente == null) return NotFound();

        var mensaje = new Mensaje
        {
            RemitenteId = userId,
            DestinatarioId = dto.DestinatarioId,
            Texto = dto.Texto,
            FotoUrl = dto.FotoUrl,
            FechaEnvio = DateTime.UtcNow,
            Leido = false
        };

        _db.Mensajes.Add(mensaje);
        await _db.SaveChangesAsync();

        // Notificar por SignalR
        await _hub.Clients.All.SendAsync("NuevoMensaje", new
        {
            mensaje.Id,
            mensaje.Texto,
            mensaje.FotoUrl,
            mensaje.FechaEnvio,
            mensaje.RemitenteId,
            mensaje.DestinatarioId,
            remitente = new { remitente.Nombre, remitente.FotoUrl }
        });

        return Ok(mensaje);
    }

    // PUT api/chat/leer/5
    [HttpPut("leer/{remitenteId}")]
    public async Task<IActionResult> MarcarLeidos(int remitenteId)
    {
        var userId = GetUserId();
        var mensajes = await _db.Mensajes
            .Where(m => m.RemitenteId == remitenteId && m.DestinatarioId == userId && !m.Leido)
            .ToListAsync();

        mensajes.ForEach(m => m.Leido = true);
        await _db.SaveChangesAsync();
        return Ok(new { marcados = mensajes.Count });
    }

    [HttpGet("admin")]
    public async Task<IActionResult> GetAdmin()
    {
        var admin = await _db.Usuarios
            .Where(u => u.Rol == UserRole.ADMIN && u.Activo)
            .Select(u => new { u.Id, u.Nombre, u.FotoUrl })
            .FirstOrDefaultAsync();
        return Ok(admin);
    }
}

public class EnviarMensajeDto
{
    public int DestinatarioId { get; set; }
    public string Texto { get; set; } = string.Empty;
    public string? FotoUrl { get; set; }
}