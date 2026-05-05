using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Concretera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMensajes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Mensajes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RemitenteId = table.Column<int>(type: "int", nullable: false),
                    DestinatarioId = table.Column<int>(type: "int", nullable: false),
                    Texto = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FotoUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Leido = table.Column<bool>(type: "bit", nullable: false),
                    FechaEnvio = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Mensajes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Mensajes_Usuarios_DestinatarioId",
                        column: x => x.DestinatarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Mensajes_Usuarios_RemitenteId",
                        column: x => x.RemitenteId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 1,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 5, 1, 3, 44, 4, 900, DateTimeKind.Utc).AddTicks(6749));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 2,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 5, 1, 3, 44, 4, 900, DateTimeKind.Utc).AddTicks(7950));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 3,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 5, 1, 3, 44, 4, 900, DateTimeKind.Utc).AddTicks(7954));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 4,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 5, 1, 3, 44, 4, 900, DateTimeKind.Utc).AddTicks(7955));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 5,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 5, 1, 3, 44, 4, 900, DateTimeKind.Utc).AddTicks(7957));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 6,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 5, 1, 3, 44, 4, 900, DateTimeKind.Utc).AddTicks(7958));

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "FechaIngreso", "PasswordHash" },
                values: new object[] { new DateTime(2026, 5, 1, 3, 44, 4, 901, DateTimeKind.Utc).AddTicks(3539), "$2a$11$GNfat5qk9mFqz7UJ0pg8teZV821B5VqLfs7s1d81nFjchIGf7hT0." });

            migrationBuilder.CreateIndex(
                name: "IX_Mensajes_DestinatarioId",
                table: "Mensajes",
                column: "DestinatarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Mensajes_RemitenteId",
                table: "Mensajes",
                column: "RemitenteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Mensajes");

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 1,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 30, 20, 33, 8, 215, DateTimeKind.Utc).AddTicks(9077));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 2,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 30, 20, 33, 8, 216, DateTimeKind.Utc).AddTicks(282));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 3,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 30, 20, 33, 8, 216, DateTimeKind.Utc).AddTicks(286));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 4,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 30, 20, 33, 8, 216, DateTimeKind.Utc).AddTicks(287));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 5,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 30, 20, 33, 8, 216, DateTimeKind.Utc).AddTicks(289));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 6,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 30, 20, 33, 8, 216, DateTimeKind.Utc).AddTicks(290));

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "FechaIngreso", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 30, 20, 33, 8, 216, DateTimeKind.Utc).AddTicks(6171), "$2a$11$SGTrf7AsODMOiSnTgvOkwemamTOq5vJi8iMuITwq.mgwH9BpR5VHS" });
        }
    }
}
