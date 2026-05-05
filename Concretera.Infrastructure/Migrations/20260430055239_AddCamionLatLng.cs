using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Concretera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCamionLatLng : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Lat",
                table: "Camiones",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Lng",
                table: "Camiones",
                type: "float",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Lat", "Lng", "UltimaActualizacion" },
                values: new object[] { null, null, new DateTime(2026, 4, 30, 5, 52, 38, 787, DateTimeKind.Utc).AddTicks(7498) });

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Lat", "Lng", "UltimaActualizacion" },
                values: new object[] { null, null, new DateTime(2026, 4, 30, 5, 52, 38, 787, DateTimeKind.Utc).AddTicks(8672) });

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Lat", "Lng", "UltimaActualizacion" },
                values: new object[] { null, null, new DateTime(2026, 4, 30, 5, 52, 38, 787, DateTimeKind.Utc).AddTicks(8676) });

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Lat", "Lng", "UltimaActualizacion" },
                values: new object[] { null, null, new DateTime(2026, 4, 30, 5, 52, 38, 787, DateTimeKind.Utc).AddTicks(8678) });

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Lat", "Lng", "UltimaActualizacion" },
                values: new object[] { null, null, new DateTime(2026, 4, 30, 5, 52, 38, 787, DateTimeKind.Utc).AddTicks(8679) });

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "Lat", "Lng", "UltimaActualizacion" },
                values: new object[] { null, null, new DateTime(2026, 4, 30, 5, 52, 38, 787, DateTimeKind.Utc).AddTicks(8680) });

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "FechaIngreso", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 30, 5, 52, 38, 788, DateTimeKind.Utc).AddTicks(4166), "$2a$11$a0joX2VEj62bhTx150T3b.N9mas6j5mXt6G8QXQ.P51vYDqrWjt1O" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Lat",
                table: "Camiones");

            migrationBuilder.DropColumn(
                name: "Lng",
                table: "Camiones");

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
        }
    }
}
