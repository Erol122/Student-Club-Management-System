using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SCMS.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddClubGroupInfo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GroupLink",
                table: "Clubs",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GroupPlatform",
                table: "Clubs",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GroupLink",
                table: "Clubs");

            migrationBuilder.DropColumn(
                name: "GroupPlatform",
                table: "Clubs");
        }
    }
}
