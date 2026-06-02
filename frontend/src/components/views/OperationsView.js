import { memo, useEffect, useMemo, useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useClubActions } from '../../context/clubActions';
import { APP_ROLES, CLUB_MEMBER_ROLES } from '../../domain/roles';
import { SectionCard } from '../common/SectionCard';
import { ClubDrawer } from '../common/ClubDrawer';

const emptyAnnouncement = { title: '', body: '' };
const emptyEvent = { title: '', date: '', location: '' };
const emptyClubProposal = { name: '', category: '', mission: '' };

// ── Admin: redirect to Clubs (everything is managed there) ─────────────────
function AdminRedirect() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch({ type: 'NAVIGATE', payload: 'clubs' });
  }, [dispatch]);
  return null;
}

// ── Club Leader ────────────────────────────────────────────────────────────
function LeaderManage({ clubs, selectedClub, membershipRequests, announcements, events, currentUser }) {
  const dispatch = useAppDispatch();
  const {
    approveMembershipRecord,
    publishAnnouncementRecord,
    rejectMembershipRecord,
    scheduleEventRecord,
    submitClubProposalRecord,
  } = useClubActions();
  const { clubsSaving } = useAppState();

  const [activeTab, setActiveTab] = useState('requests');

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
      .filter((e) => e.clubId === activeClubId && new Date(e.date) >= new Date(today))
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [events, activeClubId, today]
  );

  if (!activeClub) {
    return <p className="empty-state">No club is available to manage yet.</p>;
  }

  const tabs = [
    { id: 'requests', label: 'Requests', count: clubRequests.length },
    { id: 'announcements', label: 'Announcements' },
    { id: 'events', label: 'Events' },
    { id: 'propose', label: 'Propose Club' },
  ];

  return (
    <div className="page-stack">
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
                  <p>{req.program}</p>
                  {req.reason ? <span>{req.reason}</span> : null}
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
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </div>
                  <span>{item.date}</span>
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
              <label>
                Title
                <input
                  value={announcementDraft.title}
                  onChange={(e) => setAnnouncementDraft((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="What's the update?"
                  required
                />
              </label>
              <label>
                Message
                <textarea
                  rows="5"
                  value={announcementDraft.body}
                  onChange={(e) => setAnnouncementDraft((prev) => ({ ...prev, body: e.target.value }))}
                  placeholder="Write your announcement here..."
                  required
                />
              </label>
              <button type="submit" className="primary-button" disabled={clubsSaving}>
                {clubsSaving ? 'Publishing...' : 'Publish announcement'}
              </button>
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
                  <div>
                    <strong>{event.title}</strong>
                    <p>{event.location}</p>
                  </div>
                  <span>{event.date}</span>
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
            <label>
              Category
              <input
                value={clubDraft.category}
                onChange={(e) => setClubDraft((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="e.g. Technology, Arts, Sport..."
                required
              />
            </label>
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
            <button type="submit" className="primary-button" disabled={clubsSaving}>
              {clubsSaving ? 'Submitting...' : 'Submit for approval'}
            </button>
          </form>
        </SectionCard>
      )}
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
    { id: 'proposals', label: 'My Proposals', count: myProposals.length },
    { id: 'start', label: 'Start a Club' },
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
                You have not submitted any club proposals yet. Switch to Start a Club to create one.
              </p>
            ) : null}
            {myProposals.map((req) => (
              <article key={req.id} className="action-row">
                <div>
                  <strong>{req.name}</strong>
                  <p>{req.category}</p>
                  {req.mission ? <span>{req.mission}</span> : null}
                </div>
                <span className="status-pending">Pending approval</span>
              </article>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Start a Club tab */}
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
            <label>
              Category
              <input
                value={clubDraft.category}
                onChange={(e) => setClubDraft((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="e.g. Technology, Arts, Sport..."
                required
              />
            </label>
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
