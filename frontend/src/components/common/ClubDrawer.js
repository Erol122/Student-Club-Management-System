import { useMemo, useState } from 'react';
import { useAppDispatch } from '../../context/AppContext';
import { ConfirmModal } from './ConfirmModal';

const TABS = [
  { id: 'overview',      label: 'Overview' },
  { id: 'members',       label: 'Members' },
  { id: 'events',        label: 'Events' },
  { id: 'announcements', label: 'Announcements' },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function parseDateBadge(dateStr) {
  if (!dateStr) return { day: '?', month: '???' };
  const parts = dateStr.split('-');
  if (parts.length < 3) return { day: dateStr, month: '' };
  return {
    day: parseInt(parts[2], 10),
    month: MONTHS[parseInt(parts[1], 10) - 1] ?? parts[1],
  };
}

function EventsList({ events }) {
  if (events.length === 0) {
    return <p className="empty-state">No events scheduled yet.</p>;
  }
  return (
    <div style={{ marginTop: '4px' }}>
      {events.map((event) => {
        const { day, month } = parseDateBadge(event.date);
        return (
          <article key={event.id} className="event-card">
            <div className="event-date-badge">
              <span className="event-date-day">{day}</span>
              <span className="event-date-month">{month}</span>
            </div>
            <div className="event-card-body">
              <strong>{event.title}</strong>
              <p>{event.location}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function AnnouncementsList({ announcements, clubName }) {
  if (announcements.length === 0) {
    return <p className="empty-state">No announcements yet.</p>;
  }
  return (
    <div style={{ marginTop: '4px' }}>
      {announcements.map((ann) => (
        <article key={ann.id} className="announcement-card">
          <div className="announcement-card-header">
            <strong>{ann.title}</strong>
            <span>{ann.date}</span>
          </div>
          {ann.body ? <p className="announcement-card-body">{ann.body}</p> : null}
          <div className="announcement-card-footer">
            {clubName ? <span className="directory-category" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>{clubName}</span> : null}
            {ann.author ? <span className="announcement-card-author">— {ann.author}</span> : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function ClubDetailBody({ selectedClub, clubDetailTab, announcements, events }) {
  const dispatch = useAppDispatch();
  const selectedClubId = selectedClub?.id ?? null;

  const clubAnnouncements = useMemo(
    () => [...announcements.filter((a) => a.clubId === selectedClubId)]
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [announcements, selectedClubId]
  );
  const clubEvents = useMemo(
    () => events
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
          {selectedClub.members.length === 0 ? (
            <p className="empty-state">No members yet.</p>
          ) : null}
          {selectedClub.members.map((member) => (
            <article key={member.id} className="member-row">
              <div className="member-avatar">
                {member.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
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

      {clubDetailTab === 'events' && <EventsList events={clubEvents} />}

      {clubDetailTab === 'announcements' && (
        <AnnouncementsList announcements={clubAnnouncements} clubName={selectedClub.name} />
      )}
    </>
  );
}

function EditForm({ club, onSave, onCancel, isSaving }) {
  const [draft, setDraft] = useState({
    name: club.name,
    category: club.category,
    summary: club.summary,
    health: club.health,
    groupPlatform: club.groupPlatform || 'WhatsApp',
    groupLink: club.groupLink || '',
  });

  return (
    <form
      className="stack-form"
      style={{ marginTop: '16px' }}
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
    >
      <label>
        Club name
        <input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} maxLength="150" required />
      </label>
      <label>
        Category
        <input value={draft.category} onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))} required />
      </label>
      <label>
        Summary
        <textarea rows="3" value={draft.summary} onChange={(e) => setDraft((p) => ({ ...p, summary: e.target.value }))} required />
      </label>
      <label>
        Group platform
        <input value={draft.groupPlatform} onChange={(e) => setDraft((p) => ({ ...p, groupPlatform: e.target.value }))} />
      </label>
      <label>
        Group link
        <input value={draft.groupLink} onChange={(e) => setDraft((p) => ({ ...p, groupLink: e.target.value }))} placeholder="https://..." />
      </label>
      <div className="inline-actions form-actions">
        <button type="submit" className="primary-button" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save changes'}</button>
        <button type="button" className="ghost-button" onClick={onCancel} disabled={isSaving}>Cancel</button>
      </div>
    </form>
  );
}

export function ClubDrawer({
  selectedClub,
  clubDetailTab,
  announcements,
  events,
  onClose,
  onDelete,
  onSave,
  onLeave,
  isSaving,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  if (!selectedClub) return null;

  const handleSave = async (draft) => {
    const saved = await onSave(draft);
    if (saved) setIsEditing(false);
  };

  return (
    <>
      <button type="button" className="club-drawer-scrim" aria-label="Close club details" onClick={onClose} />

      <aside className="club-drawer" aria-label={`${selectedClub.name} details`}>
        <header className="club-drawer-header">
          <div>
            <span className="directory-category">{selectedClub.category}</span>
            <h3>{selectedClub.name}</h3>
            <p>Led by {selectedClub.leader}</p>
          </div>
          <div className="drawer-header-actions">
            {onLeave && !isEditing ? (
              <button type="button" className="ghost-button" onClick={() => setShowLeaveConfirm(true)} disabled={isSaving}>
                Leave
              </button>
            ) : null}
            {onSave && !isEditing ? (
              <button type="button" className="ghost-button" onClick={() => setIsEditing(true)} disabled={isSaving}>
                Edit
              </button>
            ) : null}
            {onDelete && !isEditing ? (
              <button type="button" className="danger-button" onClick={() => setShowDeleteConfirm(true)} disabled={isSaving}>
                Delete
              </button>
            ) : null}
            <button type="button" className="drawer-close-button" onClick={onClose} aria-label="Close details">
              Close
            </button>
          </div>
        </header>

        {!isEditing ? (
          <>
            <div className="club-drawer-actions">
              {selectedClub.groupLink ? (
                <a className="ghost-button link-button" href={selectedClub.groupLink} target="_blank" rel="noreferrer">
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
          </>
        ) : (
          <EditForm club={selectedClub} onSave={handleSave} onCancel={() => setIsEditing(false)} isSaving={isSaving} />
        )}
      </aside>

      {showDeleteConfirm ? (
        <ConfirmModal
          title={`Delete "${selectedClub.name}"?`}
          message="This will permanently remove the club along with all its events, announcements, and join requests. This action cannot be undone."
          confirmLabel="Delete club"
          isDangerous
          onConfirm={() => { setShowDeleteConfirm(false); onDelete(selectedClub.id); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      ) : null}

      {showLeaveConfirm ? (
        <ConfirmModal
          title={`Leave "${selectedClub.name}"?`}
          message="You will lose access to this club's announcements and events. You can always request to re-join later."
          confirmLabel="Leave club"
          isDangerous
          onConfirm={() => { setShowLeaveConfirm(false); onLeave(selectedClub.id); }}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      ) : null}
    </>
  );
}
