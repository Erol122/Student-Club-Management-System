import { memo, useMemo } from 'react';
import { useAppDispatch } from '../../context/AppContext';
import { SectionCard } from '../common/SectionCard';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'members', label: 'Members' },
  { id: 'events', label: 'Events' },
  { id: 'announcements', label: 'Announcements' },
];

function ClubDetails({
  selectedClub,
  clubDetailTab,
  announcements,
  events,
  currentUser,
  activeRole,
  membershipRequests,
}) {
  const dispatch = useAppDispatch();
  const clubAnnouncements = useMemo(
    () => announcements.filter((a) => a.clubId === selectedClub.id),
    [announcements, selectedClub.id]
  );
  const clubEvents = useMemo(
    () =>
      events
        .filter((e) => e.clubId === selectedClub.id)
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [events, selectedClub.id]
  );

  const isMember = selectedClub.members.some((m) => m.name === currentUser?.name);
  const pending = membershipRequests.some(
    (r) => r.student === currentUser?.name && r.clubId === selectedClub.id
  );

  return (
    <SectionCard
      className="club-detail-card"
      title={selectedClub.name}
      subtitle={`${selectedClub.category} · Led by ${selectedClub.leader}`}
      actions={
        selectedClub.groupLink ? (
          <a
            className="ghost-button link-button"
            href={selectedClub.groupLink}
            target="_blank"
            rel="noreferrer"
          >
            Join {selectedClub.groupPlatform || 'Group'}
          </a>
        ) : (
          <span className="group-link-muted">No group link yet</span>
        )
      }
    >
      <p className="club-summary">{selectedClub.summary}</p>
      <div className="hero-tags">
        <span>{selectedClub.members.length} members</span>
        <span>{selectedClub.health}</span>
        <span>Next: {selectedClub.nextEvent}</span>
        <span>{selectedClub.groupPlatform || 'Group'}</span>
      </div>

      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-btn ${clubDetailTab === tab.id ? 'active' : ''}`.trim()}
            onClick={() => dispatch({ type: 'SET_CLUB_TAB', payload: tab.id })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {clubDetailTab === 'overview' && (
        <div className="detail-grid">
          <article className="mini-card">
            <strong>Club health</strong>
            <p>{selectedClub.health}</p>
          </article>
          <article className="mini-card">
            <strong>Members</strong>
            <p>{selectedClub.members.length} active students</p>
          </article>
          <article className="mini-card">
            <strong>Announcements</strong>
            <p>{clubAnnouncements.length} posts shared</p>
          </article>
        </div>
      )}

      {clubDetailTab === 'members' && (
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
      )}

      {clubDetailTab === 'events' && (
        <div className="feed-list">
          {clubEvents.length === 0 ? <p className="empty-state">No events scheduled yet.</p> : null}
          {clubEvents.map((event) => (
            <article key={event.id} className="feed-item">
              <div>
                <strong>{event.title}</strong>
                <p>{event.location}</p>
              </div>
              <span>{event.date}</span>
            </article>
          ))}
        </div>
      )}

      {clubDetailTab === 'announcements' && (
        <div className="feed-list">
          {clubAnnouncements.length === 0 ? <p className="empty-state">No announcements yet.</p> : null}
          {clubAnnouncements.map((announcement) => (
            <article key={announcement.id} className="feed-item">
              <div>
                <strong>{announcement.title}</strong>
                <p>{announcement.body}</p>
              </div>
              <span>{announcement.date}</span>
            </article>
          ))}
        </div>
      )}

      {activeRole === 'Member' && (
        <div className="member-note">
          {isMember
            ? 'You are already a member of this club.'
            : pending
            ? 'Your join request is pending review.'
            : 'Want to join? Use the request button on the club card.'}
        </div>
      )}
    </SectionCard>
  );
}

export const ClubsView = memo(function ClubsView({
  activeRole,
  currentUser,
  clubs,
  selectedClub,
  selectedClubId,
  clubDetailTab,
  announcements,
  events,
  membershipRequests,
  searchQuery,
  categoryFilter,
}) {
  const dispatch = useAppDispatch();
  const categories = useMemo(() => ['All', ...new Set(clubs.map((club) => club.category))], [clubs]);

  const filteredClubs = useMemo(() => {
    let result = clubs;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (club) =>
          club.name.toLowerCase().includes(q) ||
          club.category.toLowerCase().includes(q) ||
          club.leader.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'All') {
      result = result.filter((club) => club.category === categoryFilter);
    }
    return result;
  }, [clubs, searchQuery, categoryFilter]);

  const memberClubIds = useMemo(
    () => clubs.filter((club) => club.members.some((member) => member.name === currentUser?.name)).map((club) => club.id),
    [clubs, currentUser?.name]
  );

  const pendingClubIds = useMemo(
    () => membershipRequests.filter((req) => req.student === currentUser?.name).map((req) => req.clubId),
    [membershipRequests, currentUser?.name]
  );

  return (
    <div className="page-stack">
      <section className="search-row">
        <input
          className="search-input"
          placeholder="Search clubs by name, category, or leader..."
          value={searchQuery}
          onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
        />
      </section>

      <div className="filter-chips">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`filter-chip ${categoryFilter === category ? 'active' : ''}`.trim()}
            onClick={() => dispatch({ type: 'SET_CATEGORY', payload: category })}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="directory-layout">
        <SectionCard
          title="Club directory"
          subtitle={`${filteredClubs.length} club${filteredClubs.length === 1 ? '' : 's'} shown`}
        >
          <div className="directory-grid">
            {filteredClubs.map((club) => {
              const isSelected = selectedClubId === club.id;
              const isMember = memberClubIds.includes(club.id);
              const isPending = pendingClubIds.includes(club.id);

              return (
                <article
                  key={club.id}
                  className={`directory-card ${isSelected ? 'selected' : ''}`.trim()}
                  role="button"
                  tabIndex={0}
                  onClick={() => dispatch({ type: 'SELECT_CLUB', payload: club.id })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      dispatch({ type: 'SELECT_CLUB', payload: club.id });
                    }
                  }}
                >
                  <div className="directory-card-top">
                    <span className="directory-category">{club.category}</span>
                    <span className="directory-open-hint">{isSelected ? 'Viewing now' : 'Click to view'}</span>
                  </div>
                  <h4>{club.name}</h4>
                  <p>{club.summary}</p>
                  <div className="directory-card-meta">
                    <span>{club.members.length} members</span>
                    <span>{club.leader}</span>
                  </div>

                  {activeRole === 'Member' ? (
                    <button
                      type="button"
                      className={`primary-button ${isMember || isPending ? 'is-muted' : ''}`.trim()}
                      disabled={isMember || isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: 'REQUEST_MEMBERSHIP', payload: club.id });
                      }}
                    >
                      {isMember ? 'Already a member' : isPending ? 'Request pending' : 'Request to join'}
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>
        </SectionCard>

        <ClubDetails
          selectedClub={selectedClub}
          clubDetailTab={clubDetailTab}
          announcements={announcements}
          events={events}
          membershipRequests={membershipRequests}
          currentUser={currentUser}
          activeRole={activeRole}
        />
      </div>
    </div>
  );
});
