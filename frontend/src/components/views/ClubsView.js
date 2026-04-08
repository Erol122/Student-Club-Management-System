import React from 'react';
import { SectionCard } from '../common/SectionCard';

export function ClubsView({
  activeRole,
  clubs,
  currentUser,
  selectedClub,
  selectedClubAnnouncements,
  selectedClubEvents,
  membershipState,
  onJoinRequest,
  onSelectClub,
}) {
  return (
    <div className="page-stack">
      <div className="directory-layout">
        <SectionCard
          title="Club directory"
          subtitle="Students can browse clubs, follow updates, and request membership."
        >
          <div className="directory-grid">
            {clubs.map((club) => {
              const isMember = membershipState.memberClubIds.includes(club.id);
              const isPending = membershipState.pendingClubIds.includes(club.id);

              return (
                <article
                  key={club.id}
                  className={`directory-card ${selectedClub.id === club.id ? 'selected' : ''}`}
                  style={{ '--card-accent': club.accent }}
                >
                  <div className="directory-card-top">
                    <span className="directory-category">{club.category}</span>
                    <button type="button" className="ghost-button" onClick={() => onSelectClub(club.id)}>
                      Open
                    </button>
                  </div>
                  <h4>{club.name}</h4>
                  <p>{club.summary}</p>
                  <div className="directory-card-meta">
                    <span>{club.members.length} members</span>
                    <span>{club.leader}</span>
                  </div>
                  <button
                    type="button"
                    className={`primary-button ${isMember || isPending ? 'is-muted' : ''}`}
                    onClick={() => onJoinRequest(club.id)}
                    disabled={isMember || isPending || activeRole !== 'Member'}
                  >
                    {isMember
                      ? 'Already a member'
                      : isPending
                      ? 'Request pending'
                      : activeRole === 'Member'
                      ? 'Request to join'
                      : `${activeRole} view`}
                  </button>
                </article>
              );
            })}
          </div>
        </SectionCard>

        <div className="detail-stack">
          <section className="club-focus-card" style={{ '--card-accent': selectedClub.accent }}>
            <span className="eyebrow">Selected club dashboard</span>
            <h2>{selectedClub.name}</h2>
            <p>{selectedClub.summary}</p>
            <div className="hero-tags">
              <span>Leader: {selectedClub.leader}</span>
              <span>{selectedClub.members.length} roster members</span>
              <span>{selectedClub.nextEvent}</span>
            </div>
          </section>

          <SectionCard
            title="Member roster"
            subtitle={`Role assignment snapshot for ${selectedClub.name}.`}
          >
            <div className="member-list">
              {selectedClub.members.map((member) => (
                <article key={member.id} className="member-row">
                  <div className="member-avatar">
                    {member.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <strong>{member.name}</strong>
                    <p>{member.program}</p>
                  </div>
                  <span className="role-pill">{member.role}</span>
                </article>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="dashboard-grid">
        <SectionCard
          title="Announcements"
          subtitle={`Updates published for ${selectedClub.name}.`}
        >
          <div className="feed-list">
            {selectedClubAnnouncements.map((announcement) => (
              <article key={announcement.id} className="feed-item">
                <div>
                  <strong>{announcement.title}</strong>
                  <p>{announcement.body}</p>
                </div>
                <span>{announcement.date}</span>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Events and activity"
          subtitle="Members can respond to activities and check meeting plans."
        >
          <div className="feed-list">
            {selectedClubEvents.map((event) => (
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

      <div className="member-note">
        <strong>{currentUser}</strong> can switch to <strong>Member</strong> role in the top bar to request membership for clubs from this directory.
      </div>
    </div>
  );
}
