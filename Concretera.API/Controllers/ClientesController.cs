using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Concretera.Infrastructure.Data;
using Concretera.Core.Models;

namespace Concretera.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClientesController : ControllerBase
{
    private readonly AppDbContext _db;
    public ClientesController(AppDbContext db) => _db = db;

    // GET api/clientes
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var clientes = await _db.Clientes
            .Include(c => c.Pedidos)
            .OrderBy(c => c.Nombre)
            .ToListAsync();
        return Ok(clientes);
    }

    // GET api/clientes/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var cliente = await _db.Clientes
            .Include(c => c.Pedidos)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (cliente == null) return NotFound();
        return Ok(cliente);
    }

    // POST api/clientes
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Cliente dto)
    {
        dto.FechaRegistro = DateTime.UtcNow;
        _db.Clientes.Add(dto);
        await _db.SaveChangesAsync();
        return Ok(dto);
    }

    // PUT api/clientes/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Cliente dto)
    {
        var cliente = await _db.Clientes.FindAsync(id);
        if (cliente == null) return NotFound();

        cliente.Nombre = dto.Nombre;
        cliente.Telefono = dto.Telefono;
        cliente.Email = dto.Email;
        cliente.DireccionPrincipal = dto.DireccionPrincipal;
        cliente.Lat = dto.Lat;
        cliente.Lng = dto.Lng;
        cliente.TravelMinutosDefault = dto.TravelMinutosDefault;
        cliente.Activo = dto.Activo;
        cliente.Saldo = dto.Saldo;
        cliente.Notas = dto.Notas;
        cliente.ContactoObra = dto.ContactoObra;
        cliente.TelefonoObra = dto.TelefonoObra;

        await _db.SaveChangesAsync();
        return Ok(cliente);
    }

    // DELETE api/clientes/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var cliente = await _db.Clientes.FindAsync(id);
        if (cliente == null) return NotFound();

        // Soft delete — solo desactivar
        cliente.Activo = false;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Cliente desactivado" });
    }
}