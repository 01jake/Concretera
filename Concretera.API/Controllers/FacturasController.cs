using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Concretera.Infrastructure.Data;
using Concretera.Core.Models;

namespace Concretera.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FacturasController : ControllerBase
{
    private readonly AppDbContext _db;

    public FacturasController(AppDbContext db) => _db = db;

    // GET api/facturas
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? clienteId,
        [FromQuery] string? status)
    {
        var query = _db.Facturas
            .Include(f => f.Cliente)
            .Include(f => f.Conceptos)
            .AsQueryable();

        if (clienteId.HasValue)
            query = query.Where(f => f.ClienteId == clienteId.Value);

        if (!string.IsNullOrEmpty(status) &&
            Enum.TryParse<FacturaStatus>(status, out var s))
            query = query.Where(f => f.Status == s);

        var facturas = await query
            .OrderByDescending(f => f.FechaEmision)
            .Select(f => new {
                f.Id,
                f.Folio,
                f.FolioFormateado,
                f.Status,
                f.FechaEmision,
                f.FechaPago,
                f.FechaVencimiento,
                f.Subtotal,
                f.Iva,
                f.Total,
                f.Notas,
                f.RfcCliente,
                cliente = f.Cliente == null ? null : new
                {
                    f.Cliente.Id,
                    f.Cliente.Nombre,
                    f.Cliente.Email
                },
                conceptos = f.Conceptos.Select(c => new {
                    c.Id,
                    c.Descripcion,
                    c.CantidadM3,
                    c.PrecioUnitario,
                    c.Importe,
                    c.PedidoId
                })
            })
            .ToListAsync();

        return Ok(facturas);
    }

    // GET api/facturas/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var f = await _db.Facturas
            .Include(f => f.Cliente)
            .Include(f => f.Conceptos)
                .ThenInclude(c => c.Pedido)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (f == null) return NotFound();

        return Ok(new
        {
            f.Id,
            f.Folio,
            f.FolioFormateado,
            f.Status,
            f.FechaEmision,
            f.FechaPago,
            f.FechaVencimiento,
            f.Subtotal,
            f.Iva,
            f.Total,
            f.Notas,
            f.RfcCliente,
            cliente = f.Cliente == null ? null : new
            {
                f.Cliente.Id,
                f.Cliente.Nombre,
                f.Cliente.Email,
                f.Cliente.Telefono
            },
            conceptos = f.Conceptos.Select(c => new {
                c.Id,
                c.Descripcion,
                c.CantidadM3,
                c.PrecioUnitario,
                c.Importe,
                c.PedidoId,
                pedido = c.Pedido == null ? null : new
                {
                    c.Pedido.Id,
                    c.Pedido.Direccion,
                    c.Pedido.FechaEntrega
                }
            })
        });
    }

    // POST api/facturas — crear por pedido o por cliente
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] FacturaDto dto)
    {
        // Obtener siguiente folio
        var ultimoFolio = await _db.Facturas
            .MaxAsync(f => (int?)f.Folio) ?? 0;

        var factura = new Factura
        {
            Folio = ultimoFolio + 1,
            ClienteId = dto.ClienteId,
            RfcCliente = dto.RfcCliente,
            Notas = dto.Notas,
            FechaEmision = DateTime.UtcNow,
            FechaVencimiento = dto.FechaVencimiento.HasValue
                ? dto.FechaVencimiento.Value.ToUniversalTime()
                : DateTime.UtcNow.AddDays(30),
            Status = FacturaStatus.PENDIENTE
        };

        // Si viene lista de pedidoIds, generar conceptos automáticamente
        if (dto.PedidoIds?.Count > 0)
        {
            var pedidos = await _db.Pedidos
                .Where(p => dto.PedidoIds.Contains(p.Id) &&
                            p.ClienteId == dto.ClienteId &&
                            p.Status == PedidoStatus.ENTREGADO)
                .ToListAsync();

            foreach (var p in pedidos)
            {
                var importe = (decimal)p.M3Solicitados * dto.PrecioM3;
                factura.Conceptos.Add(new FacturaConcepto
                {
                    PedidoId = p.Id,
                    Descripcion = $"Concreto premezclado — {p.Direccion}",
                    CantidadM3 = p.M3Solicitados,
                    PrecioUnitario = dto.PrecioM3,
                    Importe = importe
                });
            }
        }
        // Si viene lista manual de conceptos
        else if (dto.Conceptos?.Count > 0)
        {
            foreach (var c in dto.Conceptos)
            {
                factura.Conceptos.Add(new FacturaConcepto
                {
                    Descripcion = c.Descripcion,
                    CantidadM3 = c.CantidadM3,
                    PrecioUnitario = c.PrecioUnitario,
                    Importe = (decimal)c.CantidadM3 * c.PrecioUnitario
                });
            }
        }

        // Calcular totales
        factura.Subtotal = factura.Conceptos.Sum(c => c.Importe);
        factura.Iva = Math.Round(factura.Subtotal * 0.16m, 2);
        factura.Total = factura.Subtotal + factura.Iva;

        _db.Facturas.Add(factura);
        await _db.SaveChangesAsync();

        return Ok(new { factura.Id, factura.Folio, factura.FolioFormateado, factura.Total });
    }

    // PUT api/facturas/5/pagar
    [HttpPut("{id}/pagar")]
    public async Task<IActionResult> Pagar(int id)
    {
        var f = await _db.Facturas.FindAsync(id);
        if (f == null) return NotFound();

        f.Status = FacturaStatus.PAGADA;
        f.FechaPago = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(f);
    }

    // PUT api/facturas/5/cancelar
    [HttpPut("{id}/cancelar")]
    public async Task<IActionResult> Cancelar(int id)
    {
        var f = await _db.Facturas.FindAsync(id);
        if (f == null) return NotFound();

        f.Status = FacturaStatus.CANCELADA;
        await _db.SaveChangesAsync();
        return Ok(f);
    }

    // DELETE api/facturas/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var f = await _db.Facturas.FindAsync(id);
        if (f == null) return NotFound();
        _db.Facturas.Remove(f);
        await _db.SaveChangesAsync();
        return Ok();
    }

    // GET api/facturas/pedidos-sin-facturar?clienteId=1
    [HttpGet("pedidos-sin-facturar")]
    public async Task<IActionResult> GetPedidosSinFacturar([FromQuery] int clienteId)
    {
        var pedidosFacturados = await _db.FacturaConceptos
            .Where(fc => fc.PedidoId.HasValue)
            .Select(fc => fc.PedidoId!.Value)
            .ToListAsync();

        var pedidos = await _db.Pedidos
            .Where(p => p.ClienteId == clienteId &&
                        p.Status == PedidoStatus.ENTREGADO &&
                        !pedidosFacturados.Contains(p.Id))
            .OrderByDescending(p => p.FechaEntrega)
            .Select(p => new {
                p.Id,
                p.Direccion,
                p.M3Solicitados,
                p.FechaEntrega,
                p.FechaSolicitada
            })
            .ToListAsync();

        return Ok(pedidos);
    }
}

public class FacturaDto
{
    public int ClienteId { get; set; }
    public string? RfcCliente { get; set; }
    public string? Notas { get; set; }
    public DateTime? FechaVencimiento { get; set; }
    public decimal PrecioM3 { get; set; } = 1800;
    public List<int>? PedidoIds { get; set; }
    public List<ConceptoDto>? Conceptos { get; set; }
}

public class ConceptoDto
{
    public string Descripcion { get; set; } = string.Empty;
    public double CantidadM3 { get; set; }
    public decimal PrecioUnitario { get; set; }
}