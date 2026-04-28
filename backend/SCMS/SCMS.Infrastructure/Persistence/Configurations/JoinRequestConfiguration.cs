using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SCMS.Domain.Entities;

namespace SCMS.Infrastructure.Persistence.Configurations;

public sealed class JoinRequestConfiguration : IEntityTypeConfiguration<JoinRequest>
{
    public void Configure(EntityTypeBuilder<JoinRequest> builder)
    {
        builder.ToTable("JoinRequests");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Message)
            .HasMaxLength(1000);

        builder.HasIndex(x => new { x.ClubId, x.UserId, x.Status });

        builder.HasOne(x => x.Club)
            .WithMany(x => x.JoinRequests)
            .HasForeignKey(x => x.ClubId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.User)
            .WithMany(x => x.JoinRequests)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.ReviewedByUser)
            .WithMany(x => x.ReviewedJoinRequests)
            .HasForeignKey(x => x.ReviewedByUserId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
