using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Concretera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIncidencias : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Incidencias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CamionId = table.Column<int>(type: "int", nullable: false),
                    ReportadoPorId = table.Column<int>(type: "int", nullable: true),
                    Tipo = table.Column<int>(type: "int", nullable: false),
                    Severidad = table.Column<int>(type: "int", nullable: false),
                    Estado = table.Column<int>(type: "int", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FotoUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Resolucion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FechaReporte = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaResolucion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Lat = table.Column<double>(type: "float", nullable: true),
                    Lng = table.Column<double>(type: "float", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Incidencias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Incidencias_Camiones_CamionId",
                        column: x => x.CamionId,
                        principalTable: "Camiones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Incidencias_Usuarios_ReportadoPorId",
                        column: x => x.ReportadoPorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

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

            migrationBuilder.CreateIndex(
                name: "IX_Incidencias_CamionId",
                table: "Incidencias",
                column: "CamionId");

            migrationBuilder.CreateIndex(
                name: "IX_Incidencias_ReportadoPorId",
                table: "Incidencias",
                column: "ReportadoPorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Incidencias");

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 1,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 29, 0, 59, 27, 957, DateTimeKind.Utc).AddTicks(6405));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 2,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 29, 0, 59, 27, 957, DateTimeKind.Utc).AddTicks(7492));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 3,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 29, 0, 59, 27, 957, DateTimeKind.Utc).AddTicks(7496));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 4,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 29, 0, 59, 27, 957, DateTimeKind.Utc).AddTicks(7497));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 5,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 29, 0, 59, 27, 957, DateTimeKind.Utc).AddTicks(7498));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 6,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 29, 0, 59, 27, 957, DateTimeKind.Utc).AddTicks(7499));

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "FechaIngreso", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 29, 0, 59, 27, 958, DateTimeKind.Utc).AddTicks(3104), "$2a$11$Ra2gzyPttvSDpP7GgLOf2eFKAIzpaUJCgbiupq9bYwJ81cnLIrCv2" });
        }
    }
}
