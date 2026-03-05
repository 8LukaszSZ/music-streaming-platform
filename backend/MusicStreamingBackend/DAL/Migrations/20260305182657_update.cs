using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DAL.Migrations
{
    /// <inheritdoc />
    public partial class update : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProfileImagePath",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlaylistImagePath",
                table: "Playlists",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FilePath",
                table: "LocalTracks",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TrackImagePath",
                table: "LocalTracks",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProfileImagePath",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PlaylistImagePath",
                table: "Playlists");

            migrationBuilder.DropColumn(
                name: "FilePath",
                table: "LocalTracks");

            migrationBuilder.DropColumn(
                name: "TrackImagePath",
                table: "LocalTracks");

            migrationBuilder.AddColumn<byte[]>(
                name: "ProfileImage",
                table: "Users",
                type: "bytea",
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "PlaylistImage",
                table: "Playlists",
                type: "bytea",
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "File",
                table: "LocalTracks",
                type: "bytea",
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<byte[]>(
                name: "TrackImage",
                table: "LocalTracks",
                type: "bytea",
                nullable: true);
        }
    }
}
