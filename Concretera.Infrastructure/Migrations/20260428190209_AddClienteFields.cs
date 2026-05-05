using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Concretera.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddClienteFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContactoObra",
                table: "Clientes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notas",
                table: "Clientes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Saldo",
                table: "Clientes",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "TelefonoObra",
                table: "Clientes",
                type: "nvarchar(max)",
                nullable: true);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContactoObra",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "Notas",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "Saldo",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "TelefonoObra",
                table: "Clientes");

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 1,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 23, 21, 3, 11, 635, DateTimeKind.Utc).AddTicks(4812));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 2,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 23, 21, 3, 11, 635, DateTimeKind.Utc).AddTicks(5978));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 3,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 23, 21, 3, 11, 635, DateTimeKind.Utc).AddTicks(5982));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 4,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 23, 21, 3, 11, 635, DateTimeKind.Utc).AddTicks(5983));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 5,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 23, 21, 3, 11, 635, DateTimeKind.Utc).AddTicks(5984));

            migrationBuilder.UpdateData(
                table: "Camiones",
                keyColumn: "Id",
                keyValue: 6,
                column: "UltimaActualizacion",
                value: new DateTime(2026, 4, 23, 21, 3, 11, 635, DateTimeKind.Utc).AddTicks(5985));

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$Jv3/QLFrn5ddWFSBwT5GrupCPd2km8BvKyofXIC.dH69iT.TXGsEW");
        }
    }
}
