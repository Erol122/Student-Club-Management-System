import { useMemo, useState } from 'react';
import { useAppDispatch } from '../../context/AppContext';
import { CLUB_MEMBER_ROLES } from '../../domain/roles';
import { ClubCategoryField } from './ClubCategoryField';
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
              <p>{event.location}{event.time ? ` · ${event.time}` : ''}</p>
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
  const orderedMembers = useMemo(
    () => [...selectedClub.members].sort((a, b) => {
      if (a.role === CLUB_MEMBER_ROLES.President && b.role !== CLUB_MEMBER_ROLES.President) return -1;
      if (a.role !== CLUB_MEMBER_ROLES.President && b.role === CLUB_MEMBER_ROLES.President) return 1;
      return a.name.localeCompare(b.name);
    }),
    [selectedClub.members]
  );

  const clubAnnouncements = useMemo(
    () => [...announcements.filter((a) => a.clubId === selectedClubId)]
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [announcements, selectedClubId]
  );
  const clubEvents = useMemo(
    () => events
      .filter((e) => e.clubId === selectedClubId)
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt)),
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
          {orderedMembers.map((member) => {
            const isPresident = member.role === CLUB_MEMBER_ROLES.President;

            return (
              <article key={member.id} className={`member-row ${isPresident ? 'member-row-president' : ''}`.trim()}>
                <div className="member-avatar">
                  {member.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <strong>{member.name}</strong>
                  <p>{isPresident ? 'President' : member.program}</p>
                </div>
                <span className="role-pill">{member.role}</span>
              </article>
            );
          })}
        </div>
      )}

      {clubDetailTab === 'events' && <EventsList events={clubEvents} />}

      {clubDetailTab === 'announcements' && (
        <AnnouncementsList announcements={clubAnnouncements} clubName={selectedClub.name} />
      )}
    </>
  );
}

function EditForm({ club, onSave, onCancel, isSaving, mode = 'details' }) {
  const [draft, setDraft] = useState({
    name: club.name,
    category: club.category,
    summary: club.summary,
    health: club.health,
    groupLink: club.groupLink || '',
  });
  const isLinkOnly = mode === 'whatsapp';

  return (
    <form
      className="stack-form"
      style={{ marginTop: '16px' }}
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
    >
      {!isLinkOnly ? (
        <>
          <label>
            Club name
            <input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} maxLength="150" required />
          </label>
          <ClubCategoryField
            value={draft.category}
            onChange={(category) => setDraft((p) => ({ ...p, category }))}
          />
          <label>
            Summary
            <textarea rows="3" value={draft.summary} onChange={(e) => setDraft((p) => ({ ...p, summary: e.target.value }))} required />
          </label>
        </>
      ) : null}
      <label>
        Group chat link
        <input
          type="url"
          value={draft.groupLink}
          onChange={(e) => setDraft((p) => ({ ...p, groupLink: e.target.value }))}
          placeholder="https://chat.whatsapp.com/, discord.gg/..."
          maxLength="500"
        />
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
  editMode = 'details',
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  if (!selectedClub) return null;

  const handleSave = async (draft) => {
    const saved = await onSave(draft);
    if (saved) setIsEditing(false);
  };

  const canEditLink = editMode === 'whatsapp' || Boolean(onDelete) || Boolean(onSave);
  const showLinkSection = Boolean(onLeave || canEditLink) && Boolean(selectedClub.groupLink || canEditLink);

  function platformLabel(link, stored) {
    if (stored && stored !== 'Chat group') return stored;
    if (!link) return 'Group chat';
    if (link.includes('whatsapp.com')) return 'WhatsApp';
    if (link.includes('discord.gg') || link.includes('discord.com')) return 'Discord';
    if (link.includes('t.me') || link.includes('telegram')) return 'Telegram';
    if (link.includes('teams.microsoft.com')) return 'Microsoft Teams';
    return stored || 'Group chat';
  }
  const chatLabel = platformLabel(selectedClub.groupLink, selectedClub.groupPlatform);

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
            {onSave && editMode !== 'whatsapp' && !isEditing ? (
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
            <ClubDetailBody
              selectedClub={selectedClub}
              clubDetailTab={clubDetailTab}
              announcements={announcements}
              events={events}
            />
            {showLinkSection ? (
              <section className="whatsapp-card" aria-label="Group chat">
                <div className="whatsapp-card-copy">
                  <strong>{chatLabel}</strong>
                  <p>
                    {selectedClub.groupLink
                      ? 'Members can use this invite to join the club chat.'
                      : 'Add the invite link once the club chat is ready.'}
                  </p>
                  {selectedClub.groupLink ? (
                    <span className="whatsapp-link-preview">{selectedClub.groupLink}</span>
                  ) : null}
                </div>
                <div className="whatsapp-card-actions">
                  {selectedClub.groupLink ? (
                    <a className="primary-button link-button" href={selectedClub.groupLink} target="_blank" rel="noreferrer">
                      Join {chatLabel}
                    </a>
                  ) : null}
                  {canEditLink ? (
                    <button type="button" className="ghost-button" onClick={() => setIsEditing(true)} disabled={isSaving}>
                      {selectedClub.groupLink ? 'Edit link' : 'Add link'}
                    </button>
                  ) : null}
                  {canEditLink && selectedClub.groupLink ? (
                    <button
                      type="button"
                      className="danger-button"
                      disabled={isSaving}
                      onClick={() => onSave({ ...selectedClub, groupLink: '' })}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <EditForm
            club={selectedClub}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            isSaving={isSaving}
            mode={editMode}
          />
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
