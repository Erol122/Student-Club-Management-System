using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SCMS.Domain.Entities;

namespace SCMS.Infrastructure.Persistence.Configurations;

public sealed class EventResponseConfiguration : IEntityTypeConfiguration<EventResponse>
{
    public void Configure(EntityTypeBuilder<EventResponse> builder)
    {
        builder.ToTable("EventResponses");

        builder.HasKey(x => x.Id);

        builder.HasIndex(x => new { x.EventId, x.UserId })
            .IsUnique();

        builder.HasOne(x => x.Event)
            .WithMany(x => x.Responses)
            .HasForeignKey(x => x.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.User)
            .WithMany(x => x.EventResponses)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
