using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Concretera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMantenimientos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Mantenimientos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CamionId = table.Column<int>(type: "int", nullable: false),
                    Tipo = table.Column<int>(type: "int", nullable: false),
                    Estado = table.Column<int>(type: "int", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaProgramada = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaRealizada = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IntervaloDias = table.Column<int>(type: "int", nullable: true),
                    KmActual = table.Column<double>(type: "float", nullable: true),
                    KmProximo = table.Column<double>(type: "float", nullable: true),
                    KmIntervalo = table.Column<double>(type: "float", nullable: true),
                    Costo = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Notas = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TallerNombre = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Mantenimientos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Mantenimientos_Camiones_CamionId",
                        column: x => x.CamionId,
                        principalTable: "Camiones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

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

            migrationBuilder.CreateIndex(
                name: "IX_Mantenimientos_CamionId",
                table: "Mantenimientos",
                column: "CamionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Mantenimientos");

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 1,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 30, 5, 52, 38, 787, DateTimeKind.Utc).AddTicks(7498));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 2,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 30, 5, 52, 38, 787, DateTimeKind.Utc).AddTicks(8672));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 3,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 30, 5, 52, 38, 787, DateTimeKind.Utc).AddTicks(8676));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 4,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 30, 5, 52, 38, 787, DateTimeKind.Utc).AddTicks(8678));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 5,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 30, 5, 52, 38, 787, DateTimeKind.Utc).AddTicks(8679));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 6,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 30, 5, 52, 38, 787, DateTimeKind.Utc).AddTicks(8680));

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "FechaIngreso", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 30, 5, 52, 38, 788, DateTimeKind.Utc).AddTicks(4166), "$2a$11$a0joX2VEj62bhTx150T3b.N9mas6j5mXt6G8QXQ.P51vYDqrWjt1O" });
        }
    }
}
