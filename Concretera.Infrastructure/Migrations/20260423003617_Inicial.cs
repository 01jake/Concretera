using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Concretera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Inicial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Clientes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Telefono = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DireccionPrincipal = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Lat = table.Column<double>(type: "float", nullable: false),
                    Lng = table.Column<double>(type: "float", nullable: false),
                    TravelMinutosDefault = table.Column<int>(type: "int", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clientes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Rol = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CamionAsignadoId = table.Column<int>(type: "int", nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Camiones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Placas = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConductorId = table.Column<int>(type: "int", nullable: true),
                    DestinoNombre = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DestinoDireccion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DestinoLat = table.Column<double>(type: "float", nullable: true),
                    DestinoLng = table.Column<double>(type: "float", nullable: true),
                    TravelMinutos = table.Column<int>(type: "int", nullable: false),
                    DescargaMinutos = table.Column<int>(type: "int", nullable: false),
                    CargaInicio = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CargaFin = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LlegadaEstimada = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DescargaFin = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RegresoFin = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Color = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CapacidadM3 = table.Column<double>(type: "float", nullable: false),
                    UltimaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Camiones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Camiones_Usuarios_ConductorId",
                        column: x => x.ConductorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Pedidos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClienteId = table.Column<int>(type: "int", nullable: false),
                    Direccion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Lat = table.Column<double>(type: "float", nullable: false),
                    Lng = table.Column<double>(type: "float", nullable: false),
                    M3Solicitados = table.Column<double>(type: "float", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CamionId = table.Column<int>(type: "int", nullable: true),
                    TravelMinutos = table.Column<int>(type: "int", nullable: false),
                    DescargaMinutos = table.Column<int>(type: "int", nullable: false),
                    FechaSolicitada = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaAsignada = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaEntrega = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Notas = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FirmaDigitalUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FotoEntregaUrl = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pedidos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Pedidos_Camiones_CamionId",
                        column: x => x.CamionId,
                        principalTable: "Camiones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Pedidos_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Viajes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CamionId = table.Column<int>(type: "int", nullable: false),
                    ConductorId = table.Column<int>(type: "int", nullable: false),
                    ClienteId = table.Column<int>(type: "int", nullable: false),
                    PedidoId = table.Column<int>(type: "int", nullable: false),
                    DireccionDestino = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Lat = table.Column<double>(type: "float", nullable: false),
                    Lng = table.Column<double>(type: "float", nullable: false),
                    M3Entregados = table.Column<double>(type: "float", nullable: false),
                    DistanciaKm = table.Column<double>(type: "float", nullable: false),
                    TravelMinutosIda = table.Column<int>(type: "int", nullable: false),
                    TravelMinutosVuelta = table.Column<int>(type: "int", nullable: false),
                    DescargaMinutos = table.Column<int>(type: "int", nullable: false),
                    CargaMinutos = table.Column<int>(type: "int", nullable: false),
                    TiempoTotalMinutos = table.Column<int>(type: "int", nullable: false),
                    FechaInicio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaFin = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CostoCombustible = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CostoTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TarifaM3 = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Ingresos = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Utilidad = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FirmaDigitalUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FotoEntregaUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Notas = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Viajes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Viajes_Camiones_CamionId",
                        column: x => x.CamionId,
                        principalTable: "Camiones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Viajes_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Viajes_Pedidos_PedidoId",
                        column: x => x.PedidoId,
                        principalTable: "Pedidos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Viajes_Usuarios_ConductorId",
                        column: x => x.ConductorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Camiones",
                columns: new[] { "Id", "CapacidadM3", "CargaFin", "CargaInicio", "Color", "ConductorId", "DescargaFin", "DescargaMinutos", "DestinoDireccion", "DestinoLat", "DestinoLng", "DestinoNombre", "LlegadaEstimada", "Nombre", "Placas", "RegresoFin", "Status", "TravelMinutos", "UltimaActualizacion" },
                values: new object[,]
                {
                    { 1, 7.0, null, null, "#f0a030", null, null, 15, null, null, null, null, null, "Camión 1", "ABC-001", null, "LIBRE", 0, new DateTime(2026, 4, 23, 0, 36, 17, 9, DateTimeKind.Utc).AddTicks(4054) },
                    { 2, 7.0, null, null, "#e05599", null, null, 15, null, null, null, null, null, "Camión 2", "ABC-002", null, "LIBRE", 0, new DateTime(2026, 4, 23, 0, 36, 17, 9, DateTimeKind.Utc).AddTicks(4057) },
                    { 3, 7.0, null, null, "#4b9ef5", null, null, 15, null, null, null, null, null, "Camión 3", "ABC-003", null, "LIBRE", 0, new DateTime(2026, 4, 23, 0, 36, 17, 9, DateTimeKind.Utc).AddTicks(4058) },
                    { 4, 7.0, null, null, "#4caf7d", null, null, 15, null, null, null, null, null, "Camión 4", "ABC-004", null, "LIBRE", 0, new DateTime(2026, 4, 23, 0, 36, 17, 9, DateTimeKind.Utc).AddTicks(4059) },
                    { 5, 7.0, null, null, "#e05555", null, null, 15, null, null, null, null, null, "Camión 5", "ABC-005", null, "LIBRE", 0, new DateTime(2026, 4, 23, 0, 36, 17, 9, DateTimeKind.Utc).AddTicks(4061) },
                    { 6, 7.0, null, null, "#9b72f5", null, null, 15, null, null, null, null, null, "Camión 6", "ABC-006", null, "LIBRE", 0, new DateTime(2026, 4, 23, 0, 36, 17, 9, DateTimeKind.Utc).AddTicks(4062) }
                });

            migrationBuilder.InsertData(
                table: "Usuarios",
                columns: new[] { "Id", "Activo", "CamionAsignadoId", "Email", "Nombre", "PasswordHash", "Rol" },
                values: new object[] { 1, true, null, "admin@concretera.com", "Administrador", "$2a$11$6LwhiNVNz2FQoOZnVuL7AOcB3FRKOlwyz34yc6uVW2uGYtl0YqCSG", "ADMIN" });

            migrationBuilder.CreateIndex(
                name: "IX_Camiones_ConductorId",
                table: "Camiones",
                column: "ConductorId");

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_CamionId",
                table: "Pedidos",
                column: "CamionId");

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_ClienteId",
                table: "Pedidos",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Email",
                table: "Usuarios",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Viajes_CamionId",
                table: "Viajes",
                column: "CamionId");

            migrationBuilder.CreateIndex(
                name: "IX_Viajes_ClienteId",
                table: "Viajes",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Viajes_ConductorId",
                table: "Viajes",
                column: "ConductorId");

            migrationBuilder.CreateIndex(
                name: "IX_Viajes_PedidoId",
                table: "Viajes",
                column: "PedidoId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Viajes");

            migrationBuilder.DropTable(
                name: "Pedidos");

            migrationBuilder.DropTable(
                name: "Camiones");

            migrationBuilder.DropTable(
                name: "Clientes");

            migrationBuilder.DropTable(
                name: "Usuarios");
        }
    }
}
