import { memo, useMemo, useState, useRef, useEffect } from 'react';
import { useAppDispatch } from '../../context/AppContext';
import { SectionCard } from '../common/SectionCard';

const TABS = [
  { id: 'overview',      label: 'Overview' },
  { id: 'members',       label: 'Members' },
  { id: 'events',        label: 'Events' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'messages',      label: 'Messages' },
];

function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60_000)     return 'just now';
  if (d < 3_600_000)  return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
}

function ClubDetail({ club, tab, announcements, events, messages, currentUser, onTabChange }) {
  const dispatch     = useAppDispatch();
  const msgEndRef    = useRef(null);
  const [draft, setDraft] = useState('');

  const clubAnns   = useMemo(() => announcements.filter((a) => a.clubId === club.id), [announcements, club.id]);
  const clubEvents = useMemo(
    () => events.filter((e) => e.clubId === club.id).sort((a, b) => new Date(a.date) - new Date(b.date)),
    [events, club.id]
  );
  const clubMsgs = useMemo(
    () => messages.filter((m) => m.clubId === club.id).sort((a, b) => a.ts - b.ts),
    [messages, club.id]
  );

  const isMember = club.members.some((m) => m.name === currentUser?.name);
  const userName = currentUser?.name;

  // Auto-scroll messages to bottom when tab opens or new messages arrive
  useEffect(() => {
    if (tab === 'messages') {
      msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [tab, clubMsgs.length]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    dispatch({ type: 'POST_MESSAGE', payload: { clubId: club.id, text: draft.trim() } });
    setDraft('');
  };

  const toggleRsvp = (eventId) => {
    dispatch({ type: 'RSVP_EVENT', payload: { eventId } });
  };

  return (
    <div className="detail-stack">
      {/* Club header card */}
      <section className="club-focus-card" style={{ '--card-accent': club.accent }}>
        <span className="eyebrow">Selected club</span>
        <h2>{club.name}</h2>
        <p>{club.summary}</p>
        <div className="hero-tags">
          <span>{club.category}</span>
          <span>Leader: {club.leader}</span>
          <span>{club.health}</span>
        </div>
      </section>

      {/* Tabs panel */}
      <div className="detail-panel-card">
        <div className="detail-panel-tabs">
          <div className="tab-bar" style={{ background: 'transparent', padding: 0 }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`tab-btn ${tab === t.id ? 'active' : ''}`}
                onClick={() => onTabChange(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="detail-panel-body">
          {tab === 'overview' && (
            <div className="stack-form" style={{ gap: 10 }}>
              <div className="workflow-item">
                <strong>{club.members.length}</strong>
                <span>Roster members</span>
              </div>
              <div className="workflow-item">
                <strong>{clubEvents.length}</strong>
                <span>Events scheduled</span>
              </div>
              <div className="workflow-item">
                <strong>{clubAnns.length}</strong>
                <span>Announcements published</span>
              </div>
              <div className="workflow-item">
                <span style={{ color: 'var(--muted)' }}>Next: {club.nextEvent}</span>
              </div>
            </div>
          )}

          {tab === 'members' && (
            <div className="member-list">
              {club.members.length === 0
                ? <div className="empty-state">No members yet.</div>
                : club.members.map((m) => (
                    <article key={m.id} className="member-row">
                      <div className="member-avatar">
                        {m.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong>{m.name}</strong>
                        <p>{m.program}</p>
                      </div>
                      <span className="role-pill">{m.role}</span>
                    </article>
                  ))}
            </div>
          )}

          {tab === 'events' && (
            <div className="feed-list">
              {clubEvents.length === 0
                ? <div className="empty-state">No events for this club yet.</div>
                : clubEvents.map((e) => {
                    const going = e.rsvp.includes(userName);
                    return (
                      <article key={e.id} className="event-rsvp-item">
                        <div className="event-rsvp-info">
                          <strong>{e.title}</strong>
                          <p>{e.location} · {e.date}</p>
                          <span className="rsvp-count">{e.rsvp.length} going</span>
                        </div>
                        {isMember && (
                          <button
                            type="button"
                            className={`rsvp-btn ${going ? 'rsvp-going' : ''}`}
                            onClick={() => toggleRsvp(e.id)}
                          >
                            {going ? '✓ Going' : 'RSVP'}
                          </button>
                        )}
                      </article>
                    );
                  })}
            </div>
          )}

          {tab === 'announcements' && (
            <div className="feed-list">
              {clubAnns.length === 0
                ? <div className="empty-state">No announcements yet.</div>
                : clubAnns.map((a) => (
                    <article key={a.id} className="feed-item">
                      <div>
                        <strong>{a.title}</strong>
                        <p>{a.body}</p>
                      </div>
                      <span>{a.date}</span>
                    </article>
                  ))}
            </div>
          )}

          {tab === 'messages' && (
            <div className="message-board">
              <div className="message-list">
                {clubMsgs.length === 0
                  ? <div className="empty-state">No messages yet. Start the conversation.</div>
                  : clubMsgs.map((msg) => {
                      const isOwn = msg.author === userName;
                      return (
                        <div key={msg.id} className={`message-row ${isOwn ? 'own' : ''}`}>
                          {!isOwn && (
                            <div className="message-avatar">
                              {msg.author.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                            </div>
                          )}
                          <div className="message-bubble-wrap">
                            {!isOwn && <span className="message-author">{msg.author}</span>}
                            <div className="message-bubble">{msg.text}</div>
                            <span className="message-time">{timeAgo(msg.ts)}</span>
                          </div>
                        </div>
                      );
                    })}
                <div ref={msgEndRef} />
              </div>

              <form className="message-compose" onSubmit={sendMessage}>
                <input
                  className="message-input"
                  placeholder={isMember ? 'Write a message…' : 'Join the club to participate in chat.'}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={!isMember}
                />
                <button type="submit" className="primary-button" disabled={!isMember || !draft.trim()}>
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const ClubsView = memo(function ClubsView({
  activeRole,
  currentUser,
  clubs,
  selectedClub,
  clubDetailTab,
  announcements,
  events,
  messages,
  membershipRequests,
  searchQuery,
  categoryFilter,
}) {
  const dispatch = useAppDispatch();

  const categories = useMemo(() => {
    const cats = [...new Set(clubs.map((c) => c.category))].sort();
    return ['All', ...cats];
  }, [clubs]);

  const filtered = useMemo(() => {
    let result = clubs;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.leader.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'All') {
      result = result.filter((c) => c.category === categoryFilter);
    }
    return result;
  }, [clubs, searchQuery, categoryFilter]);

  const memberClubIds = useMemo(
    () => clubs.filter((c) => c.members.some((m) => m.name === currentUser?.name)).map((c) => c.id),
    [clubs, currentUser]
  );
  const pendingClubIds = useMemo(
    () => membershipRequests.filter((r) => r.student === currentUser?.name).map((r) => r.clubId),
    [membershipRequests, currentUser]
  );

  return (
    <div className="page-stack">
      {/* Search bar */}
      <div className="search-row">
        <input
          className="search-input"
          placeholder="Search by name, category, or leader…"
          value={searchQuery}
          onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
        />
        {searchQuery && (
          <button
            type="button"
            className="ghost-button"
            onClick={() => dispatch({ type: 'SET_SEARCH', payload: '' })}
          >
            Clear
          </button>
        )}
      </div>

      {/* Category filter chips */}
      <div className="filter-chips">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`filter-chip ${categoryFilter === cat ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_CATEGORY', payload: cat })}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main layout: club grid + detail panel */}
      <div className="directory-layout">
        <SectionCard
          title="Club directory"
          subtitle={
            filtered.length === clubs.length
              ? `${clubs.length} clubs on the platform.`
              : `${filtered.length} of ${clubs.length} clubs match your filter.`
          }
        >
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              No clubs match your search.
            </div>
          ) : (
            <div className="directory-grid">
              {filtered.map((club) => {
                const isMember  = memberClubIds.includes(club.id);
                const isPending = pendingClubIds.includes(club.id);
                const isSelected = selectedClub.id === club.id;

                return (
                  <article
                    key={club.id}
                    className={`directory-card ${isSelected ? 'selected' : ''}`}
                    style={{ '--card-accent': club.accent }}
                  >
                    <div className="directory-card-top">
                      <span className="directory-category">{club.category}</span>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => dispatch({ type: 'SELECT_CLUB', payload: club.id })}
                      >
                        {isSelected ? 'Viewing' : 'Open'}
                      </button>
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
                        className={`primary-button ${isMember || isPending ? 'is-muted' : ''}`}
                        disabled={isMember || isPending}
                        onClick={() => dispatch({ type: 'REQUEST_MEMBERSHIP', payload: club.id })}
                      >
                        {isMember ? 'Already a member' : isPending ? 'Request pending' : 'Request to join'}
                      </button>
                    ) : (
                      <span className="muted-text" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {activeRole} · {club.health}
                      </span>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </SectionCard>

        <ClubDetail
          club={selectedClub}
          tab={clubDetailTab}
          announcements={announcements}
          events={events}
          messages={messages}
          currentUser={currentUser}
          onTabChange={(tab) => dispatch({ type: 'SET_CLUB_TAB', payload: tab })}
        />
      </div>

      {activeRole === 'Member' && (
        <div className="member-note">
          Showing clubs as <strong>Member</strong>. Use the <strong>Request to join</strong> button on any club card to apply for membership.
        </div>
      )}
    </div>
  );
});
