using System.Reflection.Emit;
using Concretera.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace Concretera.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Camion> Camiones => Set<Camion>();
    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Viaje> Viajes => Set<Viaje>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Incidencia> Incidencias { get; set; }
    public DbSet<InventarioPlanta> Inventario { get; set; }
    public DbSet<MovimientoInventario> MovimientosInventario { get; set; }
    public DbSet<Mantenimiento> Mantenimientos { get; set; }
    public DbSet<Mensaje> Mensajes { get; set; }
    public DbSet<Factura> Facturas { get; set; }
    public DbSet<FacturaConcepto> FacturaConceptos { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.ConfigureWarnings(w =>
            w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
    }
    protected override void OnModelCreating(ModelBuilder mb)
    {
        base.OnModelCreating(mb);
        mb.Entity<Mensaje>()
      .HasOne(m => m.Remitente)
      .WithMany()
      .HasForeignKey(m => m.RemitenteId)
      .OnDelete(DeleteBehavior.NoAction);

        mb.Entity<Mensaje>()
            .HasOne(m => m.Destinatario)
            .WithMany()
            .HasForeignKey(m => m.DestinatarioId)
            .OnDelete(DeleteBehavior.NoAction);
        // Camion
        mb.Entity<Camion>(e =>
        {
            e.Property(c => c.Status).HasConversion<string>();
            e.HasOne(c => c.Conductor)
             .WithMany()
             .HasForeignKey(c => c.ConductorId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // Pedido
        mb.Entity<Pedido>(e =>
        {
            e.Property(p => p.Status).HasConversion<string>();
            e.HasOne(p => p.Cliente)
             .WithMany(c => c.Pedidos)
             .HasForeignKey(p => p.ClienteId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(p => p.Camion)
             .WithMany()
             .HasForeignKey(p => p.CamionId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // Viaje
        mb.Entity<Viaje>(e =>
        {
            e.HasOne(v => v.Camion)
             .WithMany(c => c.Viajes)
             .HasForeignKey(v => v.CamionId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(v => v.Pedido)
             .WithOne(p => p.Viaje)
             .HasForeignKey<Viaje>(v => v.PedidoId)
             .OnDelete(DeleteBehavior.Restrict);
        });
        mb.Entity<Viaje>(e =>
        {
            e.Property(v => v.CostoCombustible).HasPrecision(18, 2);
            e.Property(v => v.CostoTotal).HasPrecision(18, 2);
            e.Property(v => v.TarifaM3).HasPrecision(18, 2);
            e.Property(v => v.Ingresos).HasPrecision(18, 2);
            e.Property(v => v.Utilidad).HasPrecision(18, 2);
        });
        // Usuario
        mb.Entity<Usuario>(e =>
        {
            e.Property(u => u.Rol).HasConversion<string>();
            e.HasIndex(u => u.Email).IsUnique();
        });

        // Seed: 6 camiones iniciales
        mb.Entity<Camion>().HasData(
            new Camion { Id=1, Nombre="Camión 1", Placas="ABC-001", Color="#f0a030", CapacidadM3=7 },
            new Camion { Id=2, Nombre="Camión 2", Placas="ABC-002", Color="#e05599", CapacidadM3=7 },
            new Camion { Id=3, Nombre="Camión 3", Placas="ABC-003", Color="#4b9ef5", CapacidadM3=7 },
            new Camion { Id=4, Nombre="Camión 4", Placas="ABC-004", Color="#4caf7d", CapacidadM3=7 },
            new Camion { Id=5, Nombre="Camión 5", Placas="ABC-005", Color="#e05555", CapacidadM3=7 },
            new Camion { Id=6, Nombre="Camión 6", Placas="ABC-006", Color="#9b72f5", CapacidadM3=7 }
        );

        // Seed: admin inicial
        mb.Entity<Usuario>().HasData(
            new Usuario
            {
                Id = 1,
                Nombre = "Administrador",
                Email = "admin@concretera.com",
                // Hash de "Admin1234!" — cámbialo en producción
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin1234!"),
                Rol = UserRole.ADMIN,
                Activo = true
            }
        );
        mb.Entity<Factura>()
    .HasOne(f => f.Cliente)
    .WithMany()
    .HasForeignKey(f => f.ClienteId)
    .OnDelete(DeleteBehavior.Restrict);

        mb.Entity<FacturaConcepto>()
            .HasOne(fc => fc.Factura)
            .WithMany(f => f.Conceptos)
            .HasForeignKey(fc => fc.FacturaId)
            .OnDelete(DeleteBehavior.Cascade);

        mb.Entity<FacturaConcepto>()
            .HasOne(fc => fc.Pedido)
            .WithMany()
            .HasForeignKey(fc => fc.PedidoId)
            .OnDelete(DeleteBehavior.SetNull);

        mb.Entity<Factura>()
            .Property(f => f.Subtotal).HasPrecision(18, 2);
        mb.Entity<Factura>()
            .Property(f => f.Iva).HasPrecision(18, 2);
        mb.Entity<Factura>()
            .Property(f => f.Total).HasPrecision(18, 2);
        mb.Entity<FacturaConcepto>()
            .Property(fc => fc.PrecioUnitario).HasPrecision(18, 2);
        mb.Entity<FacturaConcepto>()
            .Property(fc => fc.Importe).HasPrecision(18, 2);
    }
}
