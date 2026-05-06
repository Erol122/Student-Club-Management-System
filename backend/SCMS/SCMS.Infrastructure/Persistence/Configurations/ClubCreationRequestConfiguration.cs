using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SCMS.Domain.Entities;

namespace SCMS.Infrastructure.Persistence.Configurations;

public sealed class ClubCreationRequestConfiguration : IEntityTypeConfiguration<ClubCreationRequest>
{
    public void Configure(EntityTypeBuilder<ClubCreationRequest> builder)
    {
        builder.ToTable("ClubCreationRequests");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ClubName)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(x => x.ClubDescription)
            .HasMaxLength(2000);

        builder.Property(x => x.ClubCategory)
            .HasMaxLength(100);

        builder.Property(x => x.Message)
            .HasMaxLength(1000);

        builder.Property(x => x.ReviewNote)
            .HasMaxLength(1000);

        builder.HasIndex(x => new { x.RequestedByUserId, x.Status });

        builder.HasOne(x => x.RequestedByUser)
            .WithMany()
            .HasForeignKey(x => x.RequestedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.ReviewedByUser)
            .WithMany()
            .HasForeignKey(x => x.ReviewedByUserId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(x => x.CreatedClub)
            .WithMany()
            .HasForeignKey(x => x.CreatedClubId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
