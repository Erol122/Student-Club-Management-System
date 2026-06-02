import { memo, useMemo, useState } from 'react';
import { useAppDispatch, useAppState } from '../../context/AppContext';
import { useClubActions } from '../../context/clubActions';
import { APP_ROLES, CLUB_MEMBER_ROLES } from '../../domain/roles';
import { SectionCard } from '../common/SectionCard';
import { ClubDrawer } from '../common/ClubDrawer';
import { ClubThumbnail } from '../common/ClubMedia';

// ── Icons ────────────────────────────────────────────────────────────────────
const IconMegaphone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l19-9-9 19-2-8-8-2z"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconCompass = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>
);
const IconManage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);
const IconStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

// ── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function parseDateBadge(dateStr) {
  if (!dateStr) return { day: '?', month: '???' };
  const parts = dateStr.split('-');
  if (parts.length < 3) return { day: dateStr, month: '' };
  return { day: parseInt(parts[2], 10), month: MONTHS[parseInt(parts[1], 10) - 1] ?? parts[1] };
}
function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60_000) return 'just now';
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
}

// ── Shared components ─────────────────────────────────────────────────────────
function StatGrid({ items }) {
  return (
    <div className="dash-stats">
      {items.map((item) => (
        <article key={item.label} className={`dash-stat ${item.urgent ? 'dash-stat--urgent' : ''}`.trim()}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </article>
      ))}
    </div>
  );
}

function Greeting({ name, subtitle }) {
  const hour = new Date().getHours();
  const g = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = name?.split(' ')[0] ?? 'there';
  return (
    <div className="greeting-block">
      <h2>{g}, {firstName}!</h2>
      <p>{subtitle ?? "Here's a snapshot of what's happening today."}</p>
    </div>
  );
}

function QuickActions({ actions }) {
  return (
    <div className="quick-actions">
      {actions.map(({ label, description, Icon, onClick }) => (
        <button key={label} type="button" className="quick-action-card" onClick={onClick}>
          <span className="quick-action-icon"><Icon /></span>
          <div className="quick-action-text">
            <strong>{label}</strong>
            {description ? <p>{description}</p> : null}
          </div>
        </button>
      ))}
    </div>
  );
}

function EventsStrip({ events, clubs }) {
  if (events.length === 0) return null;
  return (
    <SectionCard
      title="Upcoming events"
      subtitle={`${events.length} event${events.length === 1 ? '' : 's'} coming up`}
    >
      <div className="events-strip">
        {events.map((event) => {
          const { day, month } = parseDateBadge(event.date);
          const club = clubs.find((c) => c.id === event.clubId);
          return (
            <article key={event.id} className="events-strip-card">
              <div className="events-strip-card-date">
                <span className="events-strip-card-day">{day}</span>
                <span className="events-strip-card-month">{month}</span>
              </div>
              <div className="events-strip-card-body">
                <strong>{event.title}</strong>
                {event.location ? <p>{event.location}{event.time ? ` · ${event.time}` : ''}</p> : null}
                {club ? <span className="event-club-pill" style={{ marginTop: 2 }}>{club.name}</span> : null}
              </div>
            </article>
          );
        })}
      </div>
    </SectionCard>
  );
}

function AnnouncementsFeed({ announcements, clubs }) {
  return (
    <SectionCard
      title="Latest announcements"
      subtitle={`${announcements.length} recent post${announcements.length === 1 ? '' : 's'}`}
    >
      {announcements.length === 0 ? (
        <p className="empty-state">No announcements yet.</p>
      ) : null}
      {announcements.map((ann) => {
        const club = clubs.find((c) => c.id === ann.clubId);
        return (
          <article key={ann.id} className="ann-feed-item">
            <div className="ann-feed-header">
              {club ? <span className="event-club-pill">{club.name}</span> : null}
              <span className="ann-feed-date">{ann.date}</span>
            </div>
            <strong>{ann.title}</strong>
            {ann.body ? <p className="ann-feed-body">{ann.body}</p> : null}
          </article>
        );
      })}
    </SectionCard>
  );
}

function CategoryBreakdown({ clubs }) {
  const byCategory = useMemo(() => {
    const counts = {};
    clubs.forEach((club) => { counts[club.category] = (counts[club.category] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [clubs]);
  const max = Math.max(1, ...byCategory.map(([, c]) => c));

  return (
    <SectionCard title="Clubs by category" subtitle="Distribution across all categories">
      <div className="category-breakdown">
        {byCategory.map(([cat, count]) => (
          <div key={cat} className="category-bar-row">
            <span className="category-bar-label">{cat}</span>
            <div className="category-bar-track">
              <div className="category-bar-fill" style={{ width: `${(count / max) * 100}%` }} />
            </div>
            <span className="category-bar-count">{count}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ClubActivityCards({ clubs, announcements, events, membershipRequests }) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  return (
    <SectionCard title="Club overview" subtitle={`All ${clubs.length} clubs at a glance`}>
      <div className="club-activity-grid">
        {clubs.slice(0, 6).map((club) => {
          const pending = membershipRequests.filter((r) => r.clubId === club.id).length;
          const upcoming = events.filter((e) => e.clubId === club.id && new Date(e.startAt) >= today).length;
          const posts = announcements.filter((a) => a.clubId === club.id).length;
          return (
            <article key={club.id} className="club-activity-card">
              <div className="club-activity-card-top">
                <ClubThumbnail imageKey={club.imageKey} name={club.name} />
                <div>
                  <strong>{club.name}</strong>
                  <span className="directory-category" style={{ fontSize: '0.68rem', padding: '2px 7px', marginTop: 4, display: 'inline-block' }}>{club.category}</span>
                </div>
              </div>
              <div className="club-activity-stats">
                <span className="club-activity-stat">{club.members.length} members</span>
                <span className="club-activity-stat">{upcoming} events</span>
                <span className={`club-activity-stat${pending > 0 ? ' club-activity-stat--urgent' : ''}`}>{pending} pending</span>
                <span className="club-activity-stat">{posts} posts</span>
              </div>
            </article>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ── Admin ─────────────────────────────────────────────────────────────────────
function AdminHome({ clubs, clubRequests, membershipRequests, events, activityLog, currentUser }) {
  const dispatch = useAppDispatch();
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const upcoming = useMemo(
    () => events.filter((e) => new Date(e.startAt) >= today).sort((a, b) => new Date(a.startAt) - new Date(b.startAt)).slice(0, 8),
    [events, today]
  );
  const totalMembers = useMemo(() => clubs.reduce((sum, c) => sum + c.members.length, 0), [clubs]);
  const pendingCount = clubRequests.length + membershipRequests.length;

  return (
    <div className="page-stack">
      <Greeting name={currentUser?.name} subtitle="Manage clubs, review requests, and keep everything running." />

      <StatGrid items={[
        { label: 'Total clubs', value: clubs.length },
        { label: 'Total students', value: totalMembers },
        { label: 'Pending approvals', value: pendingCount, urgent: pendingCount > 0 },
        { label: 'Upcoming events', value: upcoming.length },
      ]} />

      <QuickActions actions={[
        { label: 'Review proposals', description: 'Club requests waiting', Icon: IconManage, onClick: () => dispatch({ type: 'NAVIGATE', payload: 'clubs' }) },
        { label: 'Browse clubs', description: 'Full club directory', Icon: IconCompass, onClick: () => dispatch({ type: 'NAVIGATE', payload: 'clubs' }) },
        { label: 'Pending requests', description: `${pendingCount} need attention`, Icon: IconUsers, onClick: () => dispatch({ type: 'NAVIGATE', payload: 'clubs' }) },
      ]} />

      <EventsStrip events={upcoming} clubs={clubs} />

      <div className="dashboard-grid">
        <CategoryBreakdown clubs={clubs} />
        <SectionCard title="Approvals waiting" subtitle="Recent proposals and membership requests"
          actions={<button type="button" className="ghost-button" onClick={() => dispatch({ type: 'NAVIGATE', payload: 'clubs' })}>Open clubs</button>}
        >
          <div className="action-list">
            {pendingCount === 0 ? <p className="empty-state">Nothing pending right now.</p> : null}
            {clubRequests.slice(0, 3).map((req) => (
              <article key={req.id} className="action-row">
                <div><strong>{req.name}</strong><p>{req.category} proposal · {req.proposedBy}</p></div>
              </article>
            ))}
            {membershipRequests.slice(0, 3).map((req) => (
              <article key={req.id} className="action-row">
                <div><strong>{req.student}</strong><p>Membership request</p></div>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>

      <ClubActivityCards clubs={clubs} announcements={[]} events={events} membershipRequests={membershipRequests} />

      <SectionCard title="Latest platform activity" subtitle="Recent student and club actions">
        <div className="activity-log">
          {activityLog.slice(0, 8).map((item) => (
            <article key={item.id} className="activity-item">
              <span className={`activity-dot ${item.type}`} />
              <p>{item.message}</p>
              <span className="activity-time">{timeAgo(item.ts)}</span>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ── Club Leader ───────────────────────────────────────────────────────────────
function LeaderHome({ clubs, selectedClub, membershipRequests, announcements, events, currentUser }) {
  const dispatch = useAppDispatch();
  const leaderClubs = useMemo(
    () => (clubs ?? []).filter((club) =>
      club.members.some((m) =>
        (m.email === currentUser?.email || m.name === currentUser?.name) && m.role === CLUB_MEMBER_ROLES.President
      )
    ),
    [clubs, currentUser?.email, currentUser?.name]
  );
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  const clubRequests = useMemo(
    () => membershipRequests.filter((r) => r.clubId === selectedClub?.id),
    [membershipRequests, selectedClub?.id]
  );
  const clubEvents = useMemo(
    () => events
      .filter((e) => e.clubId === selectedClub?.id && new Date(e.startAt) >= today)
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
      .slice(0, 8),
    [events, selectedClub?.id, today]
  );
  const clubAnnouncements = useMemo(
    () => [...announcements.filter((a) => a.clubId === selectedClub?.id)]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5),
    [announcements, selectedClub?.id]
  );

  if (!selectedClub) return <p className="empty-state">No club selected.</p>;

  const myClubsForStrip = leaderClubs.length > 0
    ? events
        .filter((e) => leaderClubs.some((c) => c.id === e.clubId) && new Date(e.startAt) >= today)
        .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
        .slice(0, 8)
    : clubEvents;

  return (
    <div className="page-stack">
      <Greeting name={currentUser?.name} subtitle={`Managing ${selectedClub.name} and keeping your members engaged.`} />

      <StatGrid items={[
        { label: 'Members', value: selectedClub.members.length },
        { label: 'Pending requests', value: clubRequests.length, urgent: clubRequests.length > 0 },
        { label: 'Upcoming events', value: clubEvents.length },
        { label: 'Announcements', value: clubAnnouncements.length },
      ]} />

      <QuickActions actions={[
        { label: 'Post announcement', description: 'Reach your members', Icon: IconMegaphone, onClick: () => dispatch({ type: 'NAVIGATE', payload: 'manage' }) },
        { label: 'Schedule event', description: 'Keep the calendar full', Icon: IconCalendar, onClick: () => dispatch({ type: 'NAVIGATE', payload: 'manage' }) },
        { label: 'Review requests', description: `${clubRequests.length} pending`, Icon: IconUsers, onClick: () => dispatch({ type: 'NAVIGATE', payload: 'manage' }) },
        { label: 'My clubs', description: 'Edit club details', Icon: IconStar, onClick: () => dispatch({ type: 'NAVIGATE', payload: 'manage' }) },
      ]} />

      <EventsStrip events={myClubsForStrip} clubs={clubs} />

      <div className="dashboard-grid">
        <AnnouncementsFeed announcements={clubAnnouncements} clubs={clubs} />

        <SectionCard title="Members" subtitle={`${selectedClub.members.length} active in ${selectedClub.name}`}>
          <div className="member-list">
            {selectedClub.members.length === 0 ? <p className="empty-state">No members yet.</p> : null}
            {[...selectedClub.members]
              .sort((a, b) => {
                if (a.role === CLUB_MEMBER_ROLES.President) return -1;
                if (b.role === CLUB_MEMBER_ROLES.President) return 1;
                return a.name.localeCompare(b.name);
              })
              .slice(0, 6)
              .map((m) => (
                <article key={m.id} className={`member-row ${m.role === CLUB_MEMBER_ROLES.President ? 'member-row-president' : ''}`.trim()}>
                  <div className="member-avatar">{m.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}</div>
                  <div><strong>{m.name}</strong><p>{m.program}</p></div>
                  <span className="role-pill">{m.role}</span>
                </article>
              ))}
            {selectedClub.members.length > 6 ? (
              <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.84rem', marginTop: 8 }}>
                +{selectedClub.members.length - 6} more members
              </p>
            ) : null}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ── Member ────────────────────────────────────────────────────────────────────
function MemberHome({ clubs, membershipRequests, announcements, events, currentUser, selectedClub, clubDetailTab }) {
  const dispatch = useAppDispatch();
  const { clubsSaving } = useAppState();
  const { leaveClubRecord } = useClubActions();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const userName = currentUser?.name;

  const myClubs = useMemo(
    () => clubs.filter((club) => club.members.some((m) => m.name === userName || m.email === currentUser?.email)),
    [clubs, userName, currentUser?.email]
  );
  const myClubIds = useMemo(() => myClubs.map((c) => c.id), [myClubs]);
  const myRequests = useMemo(
    () => membershipRequests.filter((r) => r.student === userName || r.email === currentUser?.email),
    [membershipRequests, userName, currentUser?.email]
  );
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const myEvents = useMemo(
    () => events
      .filter((e) => myClubIds.includes(e.clubId) && new Date(e.startAt) >= today)
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
      .slice(0, 8),
    [events, myClubIds, today]
  );
  const myAnnouncements = useMemo(
    () => [...announcements.filter((a) => myClubIds.includes(a.clubId))]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5),
    [announcements, myClubIds]
  );

  return (
    <div className="page-stack">
      <Greeting name={currentUser?.name} subtitle="Your clubs, events, and announcements in one place." />

      <StatGrid items={[
        { label: 'My clubs', value: myClubs.length },
        { label: 'Upcoming events', value: myEvents.length },
        { label: 'Announcements', value: myAnnouncements.length },
        { label: 'Pending requests', value: myRequests.length, urgent: myRequests.length > 0 },
      ]} />

      <QuickActions actions={[
        { label: 'Browse clubs', description: 'Discover something new', Icon: IconCompass, onClick: () => dispatch({ type: 'NAVIGATE', payload: 'clubs' }) },
        { label: 'Join a club', description: 'Request membership', Icon: IconUsers, onClick: () => dispatch({ type: 'NAVIGATE', payload: 'clubs' }) },
        { label: 'My clubs', description: `${myClubs.length} clubs joined`, Icon: IconStar, onClick: () => dispatch({ type: 'NAVIGATE', payload: 'clubs' }) },
      ]} />

      <EventsStrip events={myEvents} clubs={clubs} />

      <div className="dashboard-grid">
        <SectionCard
          title="My clubs"
          subtitle={`${myClubs.length} club${myClubs.length === 1 ? '' : 's'} you belong to`}
          actions={<button type="button" className="ghost-button" onClick={() => dispatch({ type: 'NAVIGATE', payload: 'clubs' })}>Browse clubs</button>}
        >
          <div className="action-list">
            {myClubs.length === 0 ? <p className="empty-state">You haven't joined any clubs yet.</p> : null}
            {myClubs.map((club) => (
              <article key={club.id} className="action-row">
                <button
                  type="button"
                  className="club-action-button"
                  onClick={() => { dispatch({ type: 'SELECT_CLUB', payload: club.id }); setDrawerOpen(true); }}
                >
                  <ClubThumbnail imageKey={club.imageKey} name={club.name} />
                  <span className="club-list-main">
                    <strong>{club.name}</strong>
                    <span>{club.category}</span>
                  </span>
                </button>
              </article>
            ))}
          </div>
        </SectionCard>

        <AnnouncementsFeed announcements={myAnnouncements} clubs={clubs} />
      </div>

      {isDrawerOpen ? (
        <ClubDrawer
          key={selectedClub?.id}
          selectedClub={selectedClub}
          clubDetailTab={clubDetailTab}
          announcements={announcements}
          events={events}
          onClose={() => setDrawerOpen(false)}
          onLeave={async (clubId) => { const left = await leaveClubRecord(clubId); if (left) setDrawerOpen(false); }}
          isSaving={clubsSaving}
        />
      ) : null}
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export const DashboardView = memo(function DashboardView(props) {
  if (props.activeRole === APP_ROLES.Admin) return <AdminHome {...props} />;
  if (props.activeRole === APP_ROLES.ClubLeader) return <LeaderHome {...props} />;
  return <MemberHome {...props} />;
});
