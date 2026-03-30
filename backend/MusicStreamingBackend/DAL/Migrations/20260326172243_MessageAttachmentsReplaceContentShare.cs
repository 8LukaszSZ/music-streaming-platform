using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DAL.Migrations
{
    /// <inheritdoc />
    public partial class MessageAttachmentsReplaceContentShare : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContentShares");

            migrationBuilder.AddColumn<Guid>(
                name: "SharedContentId",
                table: "Messages",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SharedContentType",
                table: "Messages",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SharedContentId",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "SharedContentType",
                table: "Messages");

            migrationBuilder.CreateTable(
                name: "ContentShares",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SharedToUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    SharerId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContentId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContentType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Message = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContentShares", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContentShares_Users_SharedToUserId",
                        column: x => x.SharedToUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ContentShares_Users_SharerId",
                        column: x => x.SharerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContentShares_ContentId_ContentType",
                table: "ContentShares",
                columns: new[] { "ContentId", "ContentType" });

            migrationBuilder.CreateIndex(
                name: "IX_ContentShares_SharedToUserId",
                table: "ContentShares",
                column: "SharedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ContentShares_SharerId",
                table: "ContentShares",
                column: "SharerId");
        }
    }
}
