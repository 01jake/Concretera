using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Concretera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Decimal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 1,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 23, 20, 56, 1, 97, DateTimeKind.Utc).AddTicks(3380));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 2,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 23, 20, 56, 1, 97, DateTimeKind.Utc).AddTicks(4912));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 3,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 23, 20, 56, 1, 97, DateTimeKind.Utc).AddTicks(4917));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 4,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 23, 20, 56, 1, 97, DateTimeKind.Utc).AddTicks(4918));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 5,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 23, 20, 56, 1, 97, DateTimeKind.Utc).AddTicks(4919));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 6,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 23, 20, 56, 1, 97, DateTimeKind.Utc).AddTicks(4921));

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$VlmHybDp6a8iP34siTQ2feG75GX9tx.jDVzS6h.UpZ2SScs3WWPBC");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 1,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 23, 0, 36, 17, 9, DateTimeKind.Utc).AddTicks(4054));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 2,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 23, 0, 36, 17, 9, DateTimeKind.Utc).AddTicks(4057));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 3,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 23, 0, 36, 17, 9, DateTimeKind.Utc).AddTicks(4058));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 4,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 23, 0, 36, 17, 9, DateTimeKind.Utc).AddTicks(4059));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 5,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 23, 0, 36, 17, 9, DateTimeKind.Utc).AddTicks(4061));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 6,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 23, 0, 36, 17, 9, DateTimeKind.Utc).AddTicks(4062));

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$6LwhiNVNz2FQoOZnVuL7AOcB3FRKOlwyz34yc6uVW2uGYtl0YqCSG");
        }
    }
}
