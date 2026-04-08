import React from 'react';
import { SectionCard } from '../common/SectionCard';

export function DashboardView({
  activeRole,
  clubs,
  clubRequests,
  membershipRequests,
  announcements,
  events,
  selectedClub,
}) {
  const recentAnnouncements = announcements.slice(0, 3);
  const upcomingEvents = [...events]
    .sort((left, right) => new Date(left.date) - new Date(right.date))
    .slice(0, 4);

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-content">
          <span className="eyebrow">Club dashboard</span>
          <h2>{selectedClub?.name}</h2>
          <p>
            Monitor approvals, follow upcoming activities, assign internal roles,
            and keep club communication visible to every student role.
          </p>

          <div className="hero-tags">
            <span>{activeRole} mode</span>
            <span>{selectedClub?.members.length ?? 0} members</span>
            <span>{selectedClub?.health ?? 'Healthy'} engagement</span>
          </div>
        </div>

        <div className="hero-summary-card">
          <span>Immediate focus</span>
          <strong>{clubRequests.length + membershipRequests.length} items awaiting action</strong>
          <p>
            Club proposals, membership approvals, attendance updates, and announcements are all surfaced in one place.
          </p>
        </div>
      </section>

      <div className="dashboard-grid">
        <SectionCard
          title="Club portfolio"
          subtitle="High-level health of organizations on the platform."
        >
          <div className="club-portfolio-grid">
            {clubs.map((club) => (
              <article
                key={club.id}
                className="portfolio-card"
                style={{ '--card-accent': club.accent }}
              >
                <div className="portfolio-card-top">
                  <span className="portfolio-category">{club.category}</span>
                  <span className="portfolio-status">{club.health}</span>
                </div>
                <h4>{club.name}</h4>
                <p>{club.summary}</p>
                <div className="portfolio-meta">
                  <span>{club.members.length} members</span>
                  <span>{club.nextEvent}</span>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Pending workflow"
          subtitle="Requests that need admin or club leader attention."
        >
          <div className="workflow-list">
            <div className="workflow-item">
              <strong>{clubRequests.length}</strong>
              <span>Club creation requests</span>
            </div>
            <div className="workflow-item">
              <strong>{membershipRequests.length}</strong>
              <span>Membership applications</span>
            </div>
            <div className="workflow-item">
              <strong>{selectedClub?.announcementsCount ?? 0}</strong>
              <span>Published updates this cycle</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Recent announcements"
          subtitle="Latest communication visible to members and followers."
        >
          <div className="feed-list">
            {recentAnnouncements.map((item) => (
              <article key={item.id} className="feed-item">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
                <span>{item.date}</span>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Upcoming events"
          subtitle="Scheduling and attendance checkpoints."
        >
          <div className="feed-list">
            {upcomingEvents.map((event) => (
              <article key={event.id} className="feed-item">
                <div>
                  <strong>{event.title}</strong>
                  <p>{event.location}</p>
                </div>
                <span>{event.date}</span>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
