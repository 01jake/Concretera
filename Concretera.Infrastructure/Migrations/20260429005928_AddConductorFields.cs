using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Concretera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddConductorFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FechaIngreso",
                table: "Usuarios",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "FotoUrl",
                table: "Usuarios",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LicenciaVencimiento",
                table: "Usuarios",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notas",
                table: "Usuarios",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NumeroLicencia",
                table: "Usuarios",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Telefono",
                table: "Usuarios",
                type: "nvarchar(max)",
                nullable: true);

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
                columns: new[] { "FechaIngreso", "FotoUrl", "LicenciaVencimiento", "Notas", "NumeroLicencia", "PasswordHash", "Telefono" },
                values: new object[] { new DateTime(2026, 4, 29, 0, 59, 27, 958, DateTimeKind.Utc).AddTicks(3104), null, null, null, null, "$2a$11$Ra2gzyPttvSDpP7GgLOf2eFKAIzpaUJCgbiupq9bYwJ81cnLIrCv2", null });

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_CamionAsignadoId",
                table: "Usuarios",
                column: "CamionAsignadoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Usuarios_Camiones_CamionAsignadoId",
                table: "Usuarios",
                column: "CamionAsignadoId",
                principalTable: "Camiones",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Usuarios_Camiones_CamionAsignadoId",
                table: "Usuarios");

            migrationBuilder.DropIndex(
                name: "IX_Usuarios_CamionAsignadoId",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "FechaIngreso",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "FotoUrl",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "LicenciaVencimiento",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "Notas",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "NumeroLicencia",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "Telefono",
                table: "Usuarios");

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 1,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 28, 19, 2, 8, 65, DateTimeKind.Utc).AddTicks(6148));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 2,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 28, 19, 2, 8, 65, DateTimeKind.Utc).AddTicks(9542));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 3,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 28, 19, 2, 8, 65, DateTimeKind.Utc).AddTicks(9550));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 4,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 28, 19, 2, 8, 65, DateTimeKind.Utc).AddTicks(9553));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 5,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 28, 19, 2, 8, 65, DateTimeKind.Utc).AddTicks(9555));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 6,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 28, 19, 2, 8, 65, DateTimeKind.Utc).AddTicks(9556));

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$dzwSwLGfhB/YfhpaODAY7OaWUxpyWqPTBrir.9pL/0tjUxgJu2zsu");
        }
    }
}
