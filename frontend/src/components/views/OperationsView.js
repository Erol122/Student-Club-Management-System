import { memo, useEffect, useMemo, useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useClubActions } from '../../context/clubActions';
import { APP_ROLES, CLUB_MEMBER_ROLES } from '../../domain/roles';
import { clubProposalImages, clubProposalImageByKey } from '../../data/clubProposalImages';
import { ClubCategoryField } from '../common/ClubCategoryField';
import { ClubDrawer } from '../common/ClubDrawer';
import { ClubThumbnail } from '../common/ClubMedia';
import { SectionCard } from '../common/SectionCard';

const emptyAnnouncement = { title: '', body: '' };
const emptyEvent = { title: '', date: '', time: '', location: '' };
const emptyClubProposal = { name: '', category: '', mission: '', imageKey: '' };

function ProposalImagePicker({ value, onChange }) {
  return (
    <fieldset className="proposal-image-picker">
      <legend>Image</legend>
      <div className="proposal-image-options">
        <button
          type="button"
          className={`proposal-image-option proposal-image-none ${!value ? 'selected' : ''}`.trim()}
          onClick={() => onChange('')}
        >
          No image
        </button>
        {clubProposalImages.map((image) => (
          <button
            key={image.key}
            type="button"
            className={`proposal-image-option ${value === image.key ? 'selected' : ''}`.trim()}
            onClick={() => onChange(image.key)}
          >
            <img src={image.src} alt="" loading="lazy" />
            <span>{image.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ProposalThumbnail({ imageKey }) {
  const image = clubProposalImageByKey.get(imageKey);
  if (!image) return null;

  return <img className="proposal-list-image" src={image.src} alt="" loading="lazy" />;
}

// ── Admin: redirect to Clubs (everything is managed there) ─────────────────
function AdminRedirect() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch({ type: 'NAVIGATE', payload: 'clubs' });
  }, [dispatch]);
  return null;
}

// ── Club Leader ────────────────────────────────────────────────────────────
function LeaderManage({ clubs, clubRequests: allClubRequests, selectedClub, membershipRequests, announcements, events, clubDetailTab, currentUser }) {
  const dispatch = useAppDispatch();
  const {
    approveMembershipRecord,
    publishAnnouncementRecord,
    rejectMembershipRecord,
    scheduleEventRecord,
    submitClubProposalRecord,
    updateClubRecord,
    updateAnnouncementRecord,
    deleteAnnouncementRecord,
    updateEventRecord,
    deleteEventRecord,
  } = useClubActions();
  const { clubsSaving } = useAppState();

  const [activeTab, setActiveTab] = useState('requests');
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClubId, setDrawerClubId] = useState(null);
  const [seenRequestsTab, setSeenRequestsTab] = useState(false);

  const leaderClubs = useMemo(
    () => clubs.filter((club) =>
      club.members.some((m) =>
        (m.email === currentUser?.email || m.name === currentUser?.name) &&
        m.role === CLUB_MEMBER_ROLES.President
      )
    ),
    [clubs, currentUser?.email, currentUser?.name]
  );

  const activeClub = useMemo(
    () => leaderClubs.find((c) => c.id === selectedClub?.id) ?? leaderClubs[0] ?? null,
    [leaderClubs, selectedClub?.id]
  );
  const [announcementDraft, setAnnouncementDraft] = useState(emptyAnnouncement);
  const [eventDraft, setEventDraft] = useState(emptyEvent);
  const [clubDraft, setClubDraft] = useState(emptyClubProposal);

  const activeClubId = activeClub?.id ?? null;
  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const clubRequests = useMemo(
    () => membershipRequests.filter((req) => req.clubId === activeClubId),
    [membershipRequests, activeClubId]
  );
  const clubAnnouncements = useMemo(
    () => [...announcements.filter((a) => a.clubId === activeClubId)]
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [announcements, activeClubId]
  );
  const clubEvents = useMemo(
    () => events
      .filter((e) => e.clubId === activeClubId && new Date(e.startAt) >= new Date(today))
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt)),
    [events, activeClubId, today]
  );

  const drawerClub = useMemo(
    () => leaderClubs.find((c) => c.id === drawerClubId) ?? null,
    [leaderClubs, drawerClubId]
  );

  const myProposals = useMemo(
    () => (allClubRequests ?? []).filter(
      (req) => req.proposedByEmail === currentUser?.email || req.proposedBy === currentUser?.name
    ),
    [allClubRequests, currentUser?.email, currentUser?.name]
  );

  const myJoinRequests = useMemo(
    () => membershipRequests.filter(
      (req) => req.email === currentUser?.email || req.student === currentUser?.name
    ),
    [membershipRequests, currentUser?.email, currentUser?.name]
  );

  if (!activeClub) {
    return <p className="empty-state">No club is available to manage yet.</p>;
  }

  const tabs = [
    { id: 'requests', label: 'Requests', count: clubRequests.length },
    { id: 'announcements', label: 'Announcements' },
    { id: 'events', label: 'Events' },
    { id: 'my-proposals', label: 'My Proposals', count: myProposals.filter((p) => !p.status || p.status === 'Pending').length },
    { id: 'my-requests', label: 'My Join Requests', count: seenRequestsTab ? 0 : myJoinRequests.length },
    { id: 'propose', label: 'Propose a Club' },
  ];

  return (
    <div className="page-stack">
      {/* Club directory — click to manage */}
      <SectionCard
        title="My clubs"
        subtitle={`${leaderClubs.length} club${leaderClubs.length === 1 ? '' : 's'} you manage — click to open`}
      >
        <div className="club-list">
          {leaderClubs.map((club) => (
            <button
              key={club.id}
              type="button"
              className={`club-list-row ${drawerOpen && drawerClubId === club.id ? 'selected' : ''}`.trim()}
              onClick={() => { setDrawerClubId(club.id); setDrawerOpen(true); }}
            >
              <ClubThumbnail imageKey={club.imageKey} name={club.name} />
              <span className="club-list-main">
                <strong>{club.name}</strong>
                <span>{club.summary}</span>
              </span>
              <span className="club-list-meta">
                <span>{club.category}</span>
                <span>{club.members.length} members</span>
              </span>
            </button>
          ))}
        </div>
      </SectionCard>

      {drawerOpen && drawerClub ? (
        <ClubDrawer
          key={drawerClub.id}
          selectedClub={drawerClub}
          clubDetailTab={clubDetailTab}
          announcements={announcements}
          events={events}
          onClose={() => setDrawerOpen(false)}
          onSave={(draft) => updateClubRecord(drawerClub.id, draft)}
          isSaving={clubsSaving}
        />
      ) : null}

      {/* Club header */}
      <section className="manage-club-header">
        {leaderClubs.length > 1 ? (
          <div className="club-switcher">
            <span className="club-switcher-label">Managing</span>
            <select
              className="club-switcher-select"
              value={activeClub.id}
              onChange={(e) => dispatch({ type: 'SELECT_CLUB', payload: e.target.value })}
            >
              {leaderClubs.map((club) => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </select>
          </div>
        ) : null}
        <span className="directory-category">{activeClub.category}</span>
        <h2>{activeClub.name}</h2>
        <p>{activeClub.summary}</p>
        <div className="dash-stats">
          <article className="dash-stat">
            <strong>{activeClub.members.length}</strong>
            <span>Members</span>
          </article>
          <article className={`dash-stat ${clubRequests.length > 0 ? 'dash-stat--urgent' : ''}`}>
            <strong>{clubRequests.length}</strong>
            <span>Pending requests</span>
          </article>
          <article className="dash-stat">
            <strong>{clubEvents.length}</strong>
            <span>Upcoming events</span>
          </article>
          <article className="dash-stat">
            <strong>{clubAnnouncements.length}</strong>
            <span>Announcements</span>
          </article>
        </div>
      </section>

      {/* Tab navigation */}
      <div className="tab-bar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`.trim()}
            onClick={() => { setActiveTab(tab.id); if (tab.id === 'my-requests') setSeenRequestsTab(true); }}
          >
            {tab.label}
            {tab.count > 0 ? <span className="tab-badge">{tab.count}</span> : null}
          </button>
        ))}
      </div>

      {/* Requests tab */}
      {activeTab === 'requests' && (
        <SectionCard
          title="Membership requests"
          subtitle={
            clubRequests.length === 0
              ? 'All caught up — no pending requests'
              : `${clubRequests.length} student${clubRequests.length === 1 ? '' : 's'} waiting for a decision`
          }
        >
          <div className="action-list">
            {clubRequests.length === 0 ? (
              <p className="empty-state">No pending membership requests right now.</p>
            ) : null}
            {clubRequests.map((req) => (
              <article key={req.id} className="action-row">
                <div>
                  <strong>{req.student}</strong>
                  <p>{req.program}{req.reason ? ` · ${req.reason}` : ''}</p>
                </div>
                <div className="inline-actions">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => rejectMembershipRecord(req.id)}
                    disabled={clubsSaving}
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => approveMembershipRecord(req.id)}
                    disabled={clubsSaving}
                  >
                    Approve
                  </button>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Announcements tab */}
      {activeTab === 'announcements' && (
        <div className="dashboard-grid">
          <SectionCard
            title="Recent announcements"
            subtitle={`${clubAnnouncements.length} post${clubAnnouncements.length === 1 ? '' : 's'} shared`}
          >
            <div className="feed-list">
              {clubAnnouncements.length === 0 ? (
                <p className="empty-state">No announcements posted yet.</p>
              ) : null}
              {clubAnnouncements.map((item) => (
                <article key={item.id} className="feed-item">
                  <div className="feed-item-content">
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </div>
                  <div className="feed-item-actions">
                    <span className="feed-item-date">{item.date}</span>
                    <button type="button" className="ghost-button btn-sm" onClick={() => setEditingAnnouncement({ id: item.id, title: item.title, body: item.body })} disabled={clubsSaving}>Edit</button>
                    <button type="button" className="danger-button btn-sm" onClick={() => deleteAnnouncementRecord(item.id)} disabled={clubsSaving}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Post new announcement" subtitle="Share a quick update with your members">
            <form
              className="stack-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const published = await publishAnnouncementRecord(activeClub.id, announcementDraft);
                if (published) setAnnouncementDraft(emptyAnnouncement);
              }}
            >
              <label>Title<input value={announcementDraft.title} onChange={(e) => setAnnouncementDraft((prev) => ({ ...prev, title: e.target.value }))} placeholder="What's the update?" required /></label>
              <label>Message<textarea rows="5" value={announcementDraft.body} onChange={(e) => setAnnouncementDraft((prev) => ({ ...prev, body: e.target.value }))} placeholder="Write your announcement here..." required /></label>
              <button type="submit" className="primary-button" disabled={clubsSaving}>{clubsSaving ? 'Publishing...' : 'Publish announcement'}</button>
            </form>
          </SectionCard>
        </div>
      )}

      {/* Events tab */}
      {activeTab === 'events' && (
        <div className="dashboard-grid">
          <SectionCard
            title="Upcoming events"
            subtitle={`${clubEvents.length} event${clubEvents.length === 1 ? '' : 's'} scheduled`}
          >
            <div className="feed-list">
              {clubEvents.length === 0 ? (
                <p className="empty-state">No upcoming events. Schedule one to keep members engaged.</p>
              ) : null}
              {clubEvents.map((event) => (
                <article key={event.id} className="feed-item">
                  <div className="feed-item-content">
                    <strong>{event.title}</strong>
                    <p>{event.location}</p>
                  </div>
                  <div className="feed-item-actions">
                    <span className="feed-item-date">{event.time ? `${event.date} · ${event.time}` : event.date}</span>
                    <button type="button" className="ghost-button btn-sm" onClick={() => setEditingEvent({ id: event.id, title: event.title, date: event.date, time: event.time || '', location: event.location || '' })} disabled={clubsSaving}>Edit</button>
                    <button type="button" className="danger-button btn-sm" onClick={() => deleteEventRecord(event.id)} disabled={clubsSaving}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Schedule new event" subtitle="Keep your club calendar active">
            <form
              className="stack-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (eventDraft.date < today) return;
                const scheduled = await scheduleEventRecord(activeClub.id, eventDraft);
                if (scheduled) setEventDraft(emptyEvent);
              }}
            >
              <label>
                Event title
                <input
                  value={eventDraft.title}
                  onChange={(e) => setEventDraft((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Weekly meetup"
                  required
                />
              </label>
              <label>
                Date
                <input
                  type="date"
                  min={today}
                  value={eventDraft.date}
                  onChange={(e) => setEventDraft((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
              </label>
              <label>
                Time
                <input
                  type="time"
                  value={eventDraft.time}
                  onChange={(e) => setEventDraft((prev) => ({ ...prev, time: e.target.value }))}
                  required
                />
              </label>
              <label>
                Location
                <input
                  value={eventDraft.location}
                  onChange={(e) => setEventDraft((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. Room B204 or Online"
                  required
                />
              </label>
              <button type="submit" className="primary-button" disabled={clubsSaving}>
                {clubsSaving ? 'Scheduling...' : 'Schedule event'}
              </button>
            </form>
          </SectionCard>
        </div>
      )}

      {/* My Proposals tab */}
      {activeTab === 'my-proposals' && (
        <SectionCard
          title="My club proposals"
          subtitle={`${myProposals.length} proposal${myProposals.length === 1 ? '' : 's'} submitted`}
        >
          <div className="action-list">
            {myProposals.length === 0 ? (
              <p className="empty-state">You have not submitted any proposals yet.</p>
            ) : null}
            {myProposals.map((req) => (
              <article key={req.id} className="proposal-list-card">
                <ProposalThumbnail imageKey={req.imageKey} />
                <div className="proposal-list-copy">
                  <div className="proposal-list-top">
                    <strong>{req.name}</strong>
                    <span className={req.status === 'Approved' ? 'status-approved' : req.status === 'Rejected' ? 'status-rejected' : 'status-pending'}>
                      {req.status ?? 'Pending'}
                    </span>
                  </div>
                  <p className="proposal-list-meta">{req.category}</p>
                  {req.mission ? <p className="proposal-list-mission">{req.mission}</p> : null}
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      )}

      {/* My Join Requests tab */}
      {activeTab === 'my-requests' && (
        <SectionCard
          title="My join requests"
          subtitle={`${myJoinRequests.length} pending request${myJoinRequests.length === 1 ? '' : 's'}`}
        >
          <div className="action-list">
            {myJoinRequests.length === 0 ? (
              <p className="empty-state">No pending join requests.</p>
            ) : null}
            {myJoinRequests.map((req) => {
              const club = clubs.find((c) => c.id === req.clubId);
              return (
                <article key={req.id} className="action-row">
                  <div>
                    <strong>{club?.name ?? req.clubId}</strong>
                    <p>{club?.category ?? ''}</p>
                  </div>
                  <span className="status-pending">Pending review</span>
                </article>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Propose Club tab */}
      {activeTab === 'propose' && (
        <SectionCard
          title="Propose a new club"
          subtitle="Start another student initiative at IUS"
        >
          <div className="info-callout">
            <strong>You'll become the leader</strong>
            <p>
              Once an admin approves your proposal, you'll be automatically assigned as the
              leader of the new club — right alongside this one.
            </p>
          </div>
          <form
            className="stack-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const saved = await submitClubProposalRecord({
                ...clubDraft,
                proposedBy: currentUser?.name ?? '',
              });
              if (saved) setClubDraft(emptyClubProposal);
            }}
          >
            <label>
              Club name
              <input
                value={clubDraft.name}
                onChange={(e) => setClubDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Robotics Club"
                required
              />
            </label>
            <ClubCategoryField
              value={clubDraft.category}
              onChange={(category) => setClubDraft((prev) => ({ ...prev, category }))}
            />
            <label>
              Mission
              <textarea
                rows="4"
                value={clubDraft.mission}
                onChange={(e) => setClubDraft((prev) => ({ ...prev, mission: e.target.value }))}
                placeholder="What will this club do and who is it for?"
                required
              />
            </label>
            <ProposalImagePicker
              value={clubDraft.imageKey}
              onChange={(imageKey) => setClubDraft((prev) => ({ ...prev, imageKey }))}
            />
            <button type="submit" className="primary-button" disabled={clubsSaving}>
              {clubsSaving ? 'Submitting...' : 'Submit for approval'}
            </button>
          </form>
        </SectionCard>
      )}

      {editingAnnouncement ? (
        <>
          <div className="modal-backdrop" onClick={() => setEditingAnnouncement(null)} />
          <div className="modal-card" role="dialog" aria-modal="true">
            <div className="modal-card-header">
              <h3 className="modal-title">Edit announcement</h3>
              <button type="button" className="modal-close-button" onClick={() => setEditingAnnouncement(null)}>&times;</button>
            </div>
            <form className="stack-form" onSubmit={async (e) => {
              e.preventDefault();
              const ok = await updateAnnouncementRecord(editingAnnouncement.id, editingAnnouncement);
              if (ok) setEditingAnnouncement(null);
            }}>
              <label>Title<input value={editingAnnouncement.title} onChange={(e) => setEditingAnnouncement((p) => ({ ...p, title: e.target.value }))} required /></label>
              <label>Message<textarea rows="5" value={editingAnnouncement.body} onChange={(e) => setEditingAnnouncement((p) => ({ ...p, body: e.target.value }))} required /></label>
              <div className="inline-actions form-actions">
                <button type="submit" className="primary-button" disabled={clubsSaving}>{clubsSaving ? 'Saving...' : 'Save changes'}</button>
                <button type="button" className="ghost-button" onClick={() => setEditingAnnouncement(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </>
      ) : null}

      {editingEvent ? (
        <>
          <div className="modal-backdrop" onClick={() => setEditingEvent(null)} />
          <div className="modal-card" role="dialog" aria-modal="true">
            <div className="modal-card-header">
              <h3 className="modal-title">Edit event</h3>
              <button type="button" className="modal-close-button" onClick={() => setEditingEvent(null)}>&times;</button>
            </div>
            <form className="stack-form" onSubmit={async (e) => {
              e.preventDefault();
              const ok = await updateEventRecord(editingEvent.id, editingEvent);
              if (ok) setEditingEvent(null);
            }}>
              <label>Title<input value={editingEvent.title} onChange={(e) => setEditingEvent((p) => ({ ...p, title: e.target.value }))} required /></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label>Date<input type="date" value={editingEvent.date} onChange={(e) => setEditingEvent((p) => ({ ...p, date: e.target.value }))} required /></label>
                <label>Time<input type="time" value={editingEvent.time} onChange={(e) => setEditingEvent((p) => ({ ...p, time: e.target.value }))} required /></label>
              </div>
              <label>Location<input value={editingEvent.location} onChange={(e) => setEditingEvent((p) => ({ ...p, location: e.target.value }))} placeholder="Room or address" /></label>
              <div className="inline-actions form-actions">
                <button type="submit" className="primary-button" disabled={clubsSaving}>{clubsSaving ? 'Saving...' : 'Save changes'}</button>
                <button type="button" className="ghost-button" onClick={() => setEditingEvent(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ── Member ─────────────────────────────────────────────────────────────────
function MemberManage({ clubs, clubRequests, membershipRequests, currentUser }) {
  const { submitClubProposalRecord } = useClubActions();
  const { clubsSaving } = useAppState();
  const [activeTab, setActiveTab] = useState('requests');
  const [clubDraft, setClubDraft] = useState(emptyClubProposal);

  const myRequests = useMemo(
    () => membershipRequests.filter(
      (req) => req.email === currentUser?.email || req.student === currentUser?.name
    ),
    [membershipRequests, currentUser?.email, currentUser?.name]
  );
  const myProposals = useMemo(
    () => (clubRequests ?? []).filter(
      (req) => req.proposedByEmail === currentUser?.email || req.proposedBy === currentUser?.name
    ),
    [clubRequests, currentUser?.email, currentUser?.name]
  );

  const tabs = [
    { id: 'requests', label: 'Join Requests', count: myRequests.length },
    { id: 'proposals', label: 'My Proposals', count: myProposals.filter((p) => !p.status || p.status === 'Pending').length },
    { id: 'start', label: 'Propose a Club' },
  ];

  return (
    <div className="page-stack">
      {/* Stats — single row */}
      <div className="dash-stats" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <article className={`dash-stat ${myRequests.length > 0 ? 'dash-stat--urgent' : ''}`}>
          <strong>{myRequests.length}</strong>
          <span>Pending join requests</span>
        </article>
        <article className={`dash-stat ${myProposals.length > 0 ? 'dash-stat--urgent' : ''}`}>
          <strong>{myProposals.length}</strong>
          <span>Club proposals submitted</span>
        </article>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`.trim()}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count > 0 ? <span className="tab-badge">{tab.count}</span> : null}
          </button>
        ))}
      </div>

      {/* Requests tab */}
      {activeTab === 'requests' && (
        <SectionCard
          title="Pending join requests"
          subtitle={
            myRequests.length === 0
              ? 'No pending requests'
              : `${myRequests.length} request${myRequests.length === 1 ? '' : 's'} awaiting club review`
          }
        >
          <div className="action-list">
            {myRequests.length === 0 ? (
              <p className="empty-state">
                You have no pending join requests. Head to Clubs → Discover to find and request a club.
              </p>
            ) : null}
            {myRequests.map((req) => {
              const club = clubs.find((c) => c.id === req.clubId);
              return (
                <article key={req.id} className="action-row">
                  <div>
                    <strong>{club?.name ?? req.clubId}</strong>
                    <p>{club?.category ?? ''}</p>
                  </div>
                  <span className="status-pending">Pending review</span>
                </article>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Proposals tab */}
      {activeTab === 'proposals' && (
        <SectionCard
          title="My club proposals"
          subtitle={
            myProposals.length === 0
              ? 'No proposals submitted yet'
              : `${myProposals.length} proposal${myProposals.length === 1 ? '' : 's'} waiting for admin approval`
          }
        >
          <div className="action-list">
            {myProposals.length === 0 ? (
              <p className="empty-state">
                You have not submitted any club proposals yet. Switch to Propose a Club to create one.
              </p>
            ) : null}
            {myProposals.map((req) => (
              <article key={req.id} className="proposal-list-card">
                <ProposalThumbnail imageKey={req.imageKey} />
                <div className="proposal-list-copy">
                  <div className="proposal-list-top">
                    <strong>{req.name}</strong>
                    <span className={req.status === 'Approved' ? 'status-approved' : req.status === 'Rejected' ? 'status-rejected' : 'status-pending'}>
                      {req.status ?? 'Pending'}
                    </span>
                  </div>
                  <p className="proposal-list-meta">{req.category}</p>
                  {req.mission ? <p className="proposal-list-mission">{req.mission}</p> : null}
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Propose a Club tab */}
      {activeTab === 'start' && (
        <SectionCard
          title="Start a new club"
          subtitle="Submit a proposal — admin will review and approve it"
        >
          <div className="info-callout">
            <strong>You'll be promoted to club leader</strong>
            <p>
              Once an admin approves your proposal, your account will be upgraded to Club Leader
              for the new club — giving you full management access.
            </p>
          </div>
          <form
            className="stack-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const saved = await submitClubProposalRecord({
                ...clubDraft,
                proposedBy: currentUser?.name ?? '',
              });
              if (saved) {
                setClubDraft(emptyClubProposal);
                setActiveTab('proposals');
              }
            }}
          >
            <label>
              Club name
              <input
                value={clubDraft.name}
                onChange={(e) => setClubDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Chess Club"
                required
              />
            </label>
            <ClubCategoryField
              value={clubDraft.category}
              onChange={(category) => setClubDraft((prev) => ({ ...prev, category }))}
            />
            <label>
              Mission
              <textarea
                rows="4"
                value={clubDraft.mission}
                onChange={(e) => setClubDraft((prev) => ({ ...prev, mission: e.target.value }))}
                placeholder="What will this club do and who is it for?"
                required
              />
            </label>
            <ProposalImagePicker
              value={clubDraft.imageKey}
              onChange={(imageKey) => setClubDraft((prev) => ({ ...prev, imageKey }))}
            />
            <button type="submit" className="primary-button" disabled={clubsSaving}>
              {clubsSaving ? 'Submitting...' : 'Submit for approval'}
            </button>
          </form>
        </SectionCard>
      )}
    </div>
  );
}

export const OperationsView = memo(function OperationsView(props) {
  if (props.activeRole === APP_ROLES.Admin) return <AdminRedirect />;
  if (props.activeRole === APP_ROLES.ClubLeader) return <LeaderManage {...props} />;
  return <MemberManage {...props} />;
});
