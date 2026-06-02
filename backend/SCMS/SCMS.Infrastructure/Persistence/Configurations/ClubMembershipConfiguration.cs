using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SCMS.Domain.Entities;

namespace SCMS.Infrastructure.Persistence.Configurations;

public sealed class ClubMembershipConfiguration : IEntityTypeConfiguration<ClubMembership>
{
    public void Configure(EntityTypeBuilder<ClubMembership> builder)
    {
        builder.ToTable("ClubMemberships");

        builder.HasKey(x => x.Id);

        builder.HasIndex(x => new { x.ClubId, x.UserId })
            .IsUnique();

        builder.HasIndex(x => new { x.ClubId, x.Status });

        builder.HasOne(x => x.Club)
            .WithMany(x => x.Memberships)
            .HasForeignKey(x => x.ClubId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.User)
            .WithMany(x => x.ClubMemberships)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.ApprovedByUser)
            .WithMany(x => x.ApprovedMemberships)
            .HasForeignKey(x => x.ApprovedByUserId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
