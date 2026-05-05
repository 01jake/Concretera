using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Concretera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInventario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Inventario",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    M3Disponibles = table.Column<double>(type: "float", nullable: false),
                    CapacidadMaxima = table.Column<double>(type: "float", nullable: false),
                    AlertaMinima = table.Column<double>(type: "float", nullable: false),
                    UltimaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Inventario", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MovimientosInventario",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Tipo = table.Column<int>(type: "int", nullable: false),
                    M3 = table.Column<double>(type: "float", nullable: false),
                    M3Anterior = table.Column<double>(type: "float", nullable: false),
                    M3Posterior = table.Column<double>(type: "float", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PedidoId = table.Column<int>(type: "int", nullable: true),
                    UsuarioId = table.Column<int>(type: "int", nullable: true),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovimientosInventario", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MovimientosInventario_Pedidos_PedidoId",
                        column: x => x.PedidoId,
                        principalTable: "Pedidos",
                        principalColumn: "Id");
                });

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 1,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 29, 6, 5, 21, 523, DateTimeKind.Utc).AddTicks(8532));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 2,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 29, 6, 5, 21, 523, DateTimeKind.Utc).AddTicks(9929));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 3,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 29, 6, 5, 21, 523, DateTimeKind.Utc).AddTicks(9934));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 4,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 29, 6, 5, 21, 523, DateTimeKind.Utc).AddTicks(9936));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 5,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 29, 6, 5, 21, 523, DateTimeKind.Utc).AddTicks(9937));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 6,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 29, 6, 5, 21, 523, DateTimeKind.Utc).AddTicks(9939));

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "FechaIngreso", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 29, 6, 5, 21, 524, DateTimeKind.Utc).AddTicks(6457), "$2a$11$brWHr96sIyWxD4rVtGqFJep0RCwIVe0h.JgMx/Q7rhBFJqsFOsO9." });

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosInventario_PedidoId",
                table: "MovimientosInventario",
                column: "PedidoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Inventario");

            migrationBuilder.DropTable(
                name: "MovimientosInventario");

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 1,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 29, 1, 50, 46, 399, DateTimeKind.Utc).AddTicks(725));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 2,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 29, 1, 50, 46, 399, DateTimeKind.Utc).AddTicks(1830));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 3,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 29, 1, 50, 46, 399, DateTimeKind.Utc).AddTicks(1834));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 4,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 29, 1, 50, 46, 399, DateTimeKind.Utc).AddTicks(1835));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 5,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 29, 1, 50, 46, 399, DateTimeKind.Utc).AddTicks(1836));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 6,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 29, 1, 50, 46, 399, DateTimeKind.Utc).AddTicks(1837));

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "FechaIngreso", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 29, 1, 50, 46, 399, DateTimeKind.Utc).AddTicks(6550), "$2a$11$zz2XFljCmeH5b.WBZ0ZuAuclFyXOdCJR5Y4N0C6x10frnyaLeEqxe" });
        }
    }
}
