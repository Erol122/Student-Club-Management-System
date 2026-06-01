import { memo, useCallback, useMemo, useState } from 'react';
import { useAppDispatch, useClubActions } from '../../context/AppContext';
import { SectionCard } from '../common/SectionCard';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'members', label: 'Members' },
  { id: 'events', label: 'Events' },
  { id: 'announcements', label: 'Announcements' },
];

function ClubDetailBody({
  selectedClub,
  clubDetailTab,
  announcements,
  events,
}) {
  const dispatch = useAppDispatch();
  const selectedClubId = selectedClub?.id ?? null;
  const clubAnnouncements = useMemo(
    () => announcements.filter((a) => a.clubId === selectedClubId),
    [announcements, selectedClubId]
  );
  const clubEvents = useMemo(
    () =>
      events
        .filter((e) => e.clubId === selectedClubId)
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [events, selectedClubId]
  );

  return (
    <>
      <p className="club-summary">{selectedClub.summary}</p>

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

    </>
  );
}

function ClubDetails(props) {
  const { selectedClub } = props;

  if (!selectedClub) {
    return (
      <SectionCard
        className="club-detail-card"
        title="Club details"
        subtitle="Select a club once one is available from the backend."
      >
        <p className="empty-state">No club is selected right now.</p>
      </SectionCard>
    );
  }

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
      <ClubDetailBody {...props} />
    </SectionCard>
  );
}

function ClubDrawer({ selectedClub, clubDetailTab, announcements, events, onClose }) {
  if (!selectedClub) return null;

  return (
    <>
      <button
        type="button"
        className="club-drawer-scrim"
        aria-label="Close club details"
        onClick={onClose}
      />
      <aside className="club-drawer" aria-label={`${selectedClub.name} details`}>
        <header className="club-drawer-header">
          <div>
            <span className="directory-category">{selectedClub.category}</span>
            <h3>{selectedClub.name}</h3>
            <p>Led by {selectedClub.leader}</p>
          </div>
          <button type="button" className="drawer-close-button" onClick={onClose} aria-label="Close details">
            Close
          </button>
        </header>

        <div className="club-drawer-actions">
          {selectedClub.groupLink ? (
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
          )}
        </div>

        <ClubDetailBody
          selectedClub={selectedClub}
          clubDetailTab={clubDetailTab}
          announcements={announcements}
          events={events}
        />
      </aside>
    </>
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
  const { requestMembershipRecord } = useClubActions();
  const [memberView, setMemberView] = useState('my-clubs');
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const categories = useMemo(() => ['All', ...new Set(clubs.map((club) => club.category))], [clubs]);

  const filterClubs = useCallback((clubList) => {
    let result = clubList;
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
  }, [categoryFilter, searchQuery]);

  const filteredClubs = useMemo(
    () => filterClubs(clubs),
    [clubs, filterClubs]
  );

  const memberClubIds = useMemo(
    () => clubs.filter((club) =>
      club.members.some((member) => member.email === currentUser?.email || member.name === currentUser?.name)
    ).map((club) => club.id),
    [clubs, currentUser?.email, currentUser?.name]
  );

  const memberClubs = useMemo(
    () => clubs.filter((club) => memberClubIds.includes(club.id)),
    [clubs, memberClubIds]
  );

  const selectedMemberClub = useMemo(
    () => memberClubs.find((club) => club.id === selectedClubId) ?? memberClubs[0] ?? null,
    [memberClubs, selectedClubId]
  );

  const pendingClubIds = useMemo(
    () => membershipRequests
      .filter((req) => req.email === currentUser?.email || req.student === currentUser?.name)
      .map((req) => req.clubId),
    [membershipRequests, currentUser?.email, currentUser?.name]
  );

  const joinableClubs = useMemo(
    () => filterClubs(clubs.filter((club) => !memberClubIds.includes(club.id))),
    [clubs, filterClubs, memberClubIds]
  );

  if (activeRole === 'Member') {
    const showMyClubs = memberView === 'my-clubs';

    return (
      <div className="page-stack">
        <div className="club-view-tabs">
          <button
            type="button"
            className={`tab-btn ${showMyClubs ? 'active' : ''}`.trim()}
            onClick={() => setMemberView('my-clubs')}
          >
            My clubs
          </button>
          <button
            type="button"
            className={`tab-btn ${!showMyClubs ? 'active' : ''}`.trim()}
            onClick={() => setMemberView('join-clubs')}
          >
            Join clubs
          </button>
        </div>

        {showMyClubs ? (
          <>
            {memberClubs.length > 1 ? (
              <label className="member-club-picker">
                Current club
                <select
                  value={selectedMemberClub?.id ?? ''}
                  onChange={(e) => dispatch({ type: 'SELECT_CLUB', payload: e.target.value })}
                >
                  {memberClubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {selectedMemberClub ? (
              <ClubDetails
                selectedClub={selectedMemberClub}
                clubDetailTab={clubDetailTab}
                announcements={announcements}
                events={events}
              />
            ) : (
              <SectionCard title="My clubs" subtitle="Clubs you belong to will appear here.">
                <p className="empty-state">You are not a member of any clubs yet.</p>
              </SectionCard>
            )}
          </>
        ) : (
          <>
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

            <SectionCard
              title="Join clubs"
              subtitle={`${joinableClubs.length} club${joinableClubs.length === 1 ? '' : 's'} available`}
            >
              <div className="directory-grid member-join-grid">
                {joinableClubs.length === 0 ? <p className="empty-state">No clubs available to join right now.</p> : null}
                {joinableClubs.map((club) => {
                  const isPending = pendingClubIds.includes(club.id);

                  return (
                    <article key={club.id} className="directory-card">
                      <div className="directory-card-top">
                        <span className="directory-category">{club.category}</span>
                      </div>
                      <h4>{club.name}</h4>
                      <p>{club.summary}</p>
                      <div className="directory-card-meta">
                        <span>{club.leader}</span>
                      </div>
                      <button
                        type="button"
                        className={`primary-button ${isPending ? 'is-muted' : ''}`.trim()}
                        disabled={isPending}
                        onClick={() => requestMembershipRecord(club.id)}
                      >
                        {isPending ? 'Request pending' : 'Request to join'}
                      </button>
                    </article>
                  );
                })}
              </div>
            </SectionCard>
          </>
        )}
      </div>
    );
  }

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

      <SectionCard
        className="club-list-card"
        title="Club directory"
        subtitle={`${filteredClubs.length} club${filteredClubs.length === 1 ? '' : 's'} shown`}
      >
        <div className="club-list">
          {filteredClubs.length === 0 ? <p className="empty-state">No clubs match the current filters.</p> : null}
          {filteredClubs.map((club) => {
            const isSelected = selectedClubId === club.id;

            return (
              <button
                key={club.id}
                type="button"
                className={`club-list-row ${isSelected ? 'selected' : ''}`.trim()}
                onClick={() => {
                  dispatch({ type: 'SELECT_CLUB', payload: club.id });
                  setDrawerOpen(true);
                }}
              >
                <span className="club-list-main">
                  <strong>{club.name}</strong>
                  <span>{club.summary}</span>
                </span>
                <span className="club-list-meta">
                  <span>{club.category}</span>
                  <span>{club.leader}</span>
                </span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {isDrawerOpen ? (
        <ClubDrawer
          selectedClub={selectedClub}
          clubDetailTab={clubDetailTab}
          announcements={announcements}
          events={events}
          onClose={() => setDrawerOpen(false)}
        />
      ) : null}
    </div>
  );
});
