import { memo, useMemo } from 'react';
import { useAppDispatch } from '../../context/AppContext';
import { SectionCard } from '../common/SectionCard';

function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60_000)     return 'just now';
  if (d < 3_600_000)  return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
}

function FeedItem({ title, sub, right }) {
  return (
    <article className="feed-item">
      <div><strong>{title}</strong><p>{sub}</p></div>
      <span>{right}</span>
    </article>
  );
}

// ── Admin ─────────────────────────────────────────────────────────────────────

function AdminDashboard({ clubs, clubRequests, membershipRequests, events, activityLog }) {
  const dispatch = useAppDispatch();
  const today    = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const upcoming = useMemo(() => events.filter((e) => new Date(e.date) >= today).sort((a,b) => new Date(a.date) - new Date(b.date)).slice(0,4), [events, today]);

  const totalMembers = useMemo(() => clubs.reduce((s,c) => s + c.members.length, 0), [clubs]);
  const pendingTotal = clubRequests.length + membershipRequests.length;

  return (
    <div className="page-stack">
      <div className="dash-stats">
        <div className="dash-stat"><strong>{clubs.length}</strong><span>Clubs</span></div>
        <div className="dash-stat"><strong>{totalMembers}</strong><span>Members</span></div>
        <div className={`dash-stat ${pendingTotal > 0 ? 'dash-stat--urgent' : ''}`}><strong>{pendingTotal}</strong><span>Pending</span></div>
        <div className="dash-stat"><strong>{upcoming.length}</strong><span>Upcoming events</span></div>
      </div>

      <div className="dashboard-grid dashboard-grid-3">
        <SectionCard
          title="Approval queue"
          subtitle="Club proposals and membership applications."
          actions={pendingTotal > 0 ? <span className="inline-badge">{pendingTotal}</span> : null}
        >
          <div className="action-list">
            {pendingTotal === 0 && <div className="empty-state">All clear — no pending items.</div>}

            {clubRequests.map((req) => (
              <article key={req.id} className="action-row">
                <div>
                  <strong>{req.name}</strong>
                  <p>Club · {req.category} · by {req.proposedBy}</p>
                </div>
                <div className="inline-actions">
                  <button type="button" className="ghost-button" onClick={() => dispatch({ type: 'REJECT_CLUB', payload: req.id })}>Reject</button>
                  <button type="button" className="primary-button" onClick={() => dispatch({ type: 'APPROVE_CLUB', payload: req.id })}>Approve</button>
                </div>
              </article>
            ))}

            {membershipRequests.map((req) => {
              const club = clubs.find((c) => c.id === req.clubId);
              return (
                <article key={req.id} className="action-row">
                  <div>
                    <strong>{req.student}</strong>
                    <p>Membership · {club?.name}</p>
                  </div>
                  <div className="inline-actions">
                    <button type="button" className="ghost-button" onClick={() => dispatch({ type: 'DECLINE_MEMBERSHIP', payload: req.id })}>Decline</button>
                    <button type="button" className="primary-button" onClick={() => dispatch({ type: 'APPROVE_MEMBERSHIP', payload: req.id })}>Approve</button>
                  </div>
                </article>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Activity log" subtitle="Recent platform events.">
          <div className="activity-log">
            {activityLog.slice(0, 8).map((e) => (
              <div key={e.id} className="activity-item">
                <span className={`activity-dot ${e.type}`} />
                <span>{e.message}</span>
                <span className="activity-time">{timeAgo(e.ts)}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Upcoming events" subtitle="Next scheduled activities.">
          <div className="feed-list">
            {upcoming.length === 0
              ? <div className="empty-state">No upcoming events.</div>
              : upcoming.map((e) => {
                  const club = clubs.find((c) => c.id === e.clubId);
                  return <FeedItem key={e.id} title={e.title} sub={`${club?.name} · ${e.location}`} right={e.date} />;
                })}
          </div>
        </SectionCard>

      </div>

      <SectionCard title="Club portfolio" subtitle="Platform health at a glance.">
        <div className="club-portfolio-grid">
          {clubs.map((club) => (
            <article key={club.id} className="portfolio-card" style={{ '--card-accent': club.accent }}>
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
    </div>
  );
}

// ── Club Leader ───────────────────────────────────────────────────────────────

function LeaderDashboard({ membershipRequests, announcements, events, selectedClub }) {
  const dispatch = useAppDispatch();
  const today    = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  const clubReqs   = useMemo(() => membershipRequests.filter((r) => r.clubId === selectedClub?.id), [membershipRequests, selectedClub?.id]);
  const clubEvts   = useMemo(() => events.filter((e) => e.clubId === selectedClub?.id && new Date(e.date) >= today).sort((a,b) => new Date(a.date) - new Date(b.date)).slice(0,4), [events, selectedClub?.id, today]);
  const clubAnns   = useMemo(() => announcements.filter((a) => a.clubId === selectedClub?.id).slice(0,4), [announcements, selectedClub?.id]);

  if (!selectedClub) return <div className="empty-state">No club selected.</div>;

  return (
    <div className="page-stack">
      <div className="dash-hero-compact" style={{ '--card-accent': selectedClub.accent }}>
        <div>
          <span className="eyebrow">Your club</span>
          <h2>{selectedClub.name}</h2>
          <p>{selectedClub.summary}</p>
        </div>
        <div className="dash-stats">
          <div className="dash-stat"><strong>{selectedClub.members.length}</strong><span>Members</span></div>
          <div className={`dash-stat ${clubReqs.length > 0 ? 'dash-stat--urgent' : ''}`}><strong>{clubReqs.length}</strong><span>Requests</span></div>
          <div className="dash-stat"><strong>{clubEvts.length}</strong><span>Events</span></div>
          <div className="dash-stat"><strong>{clubAnns.length}</strong><span>Posts</span></div>
        </div>
      </div>

      <div className="dashboard-grid">
        <SectionCard
          title="Membership requests"
          subtitle={`Students applying to join ${selectedClub.name}.`}
          actions={clubReqs.length > 0 ? <span className="inline-badge">{clubReqs.length}</span> : null}
        >
          <div className="action-list">
            {clubReqs.length === 0
              ? <div className="empty-state">No pending requests.</div>
              : clubReqs.map((req) => (
                  <article key={req.id} className="action-row">
                    <div>
                      <strong>{req.student}</strong>
                      <p>{req.program}</p>
                    </div>
                    <div className="inline-actions">
                      <button type="button" className="ghost-button" onClick={() => dispatch({ type: 'DECLINE_MEMBERSHIP', payload: req.id })}>Decline</button>
                      <button type="button" className="primary-button" onClick={() => dispatch({ type: 'APPROVE_MEMBERSHIP', payload: req.id })}>Approve</button>
                    </div>
                  </article>
                ))}
          </div>
        </SectionCard>

        <SectionCard title="Member roster" subtitle={`${selectedClub.name} team.`}>
          <div className="member-list">
            {selectedClub.members.map((m) => (
              <article key={m.id} className="member-row">
                <div className="member-avatar">{m.name.split(' ').map((p) => p[0]).join('').slice(0,2)}</div>
                <div style={{ flex: 1 }}><strong>{m.name}</strong><p>{m.program}</p></div>
                <span className="role-pill">{m.role}</span>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Upcoming events" subtitle="Next scheduled activities for your club.">
          <div className="feed-list">
            {clubEvts.length === 0
              ? <div className="empty-state">No upcoming events. Schedule one in Operations.</div>
              : clubEvts.map((e) => (
                  <article key={e.id} className="feed-item">
                    <div><strong>{e.title}</strong><p>{e.location}</p></div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block' }}>{e.date}</span>
                      <span className="rsvp-count">{e.rsvp.length} going</span>
                    </div>
                  </article>
                ))}
          </div>
        </SectionCard>

        <SectionCard title="Recent announcements" subtitle="Posts you've published.">
          <div className="feed-list">
            {clubAnns.length === 0
              ? <div className="empty-state">Nothing published yet.</div>
              : clubAnns.map((a) => <FeedItem key={a.id} title={a.title} sub={`${a.audience} · ${a.author}`} right={a.date} />)}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ── Member ────────────────────────────────────────────────────────────────────

function MemberDashboard({ clubs, membershipRequests, announcements, events, currentUser }) {
  const dispatch   = useAppDispatch();
  const today      = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const userName   = currentUser?.name;

  const myClubs    = useMemo(() => clubs.filter((c) => c.members.some((m) => m.name === userName)), [clubs, userName]);
  const myClubIds  = useMemo(() => myClubs.map((c) => c.id), [myClubs]);
  const myRequests = useMemo(() => membershipRequests.filter((r) => r.student === userName), [membershipRequests, userName]);

  const myEvents = useMemo(() =>
    events.filter((e) => myClubIds.includes(e.clubId) && new Date(e.date) >= today)
      .sort((a,b) => new Date(a.date) - new Date(b.date))
      .slice(0,4),
    [events, myClubIds, today]
  );

  const myAnns = useMemo(() =>
    announcements.filter((a) => myClubIds.includes(a.clubId)).slice(0,5),
    [announcements, myClubIds]
  );

  return (
    <div className="page-stack">
      <div className="dash-stats">
        <div className="dash-stat"><strong>{myClubs.length}</strong><span>My clubs</span></div>
        <div className="dash-stat"><strong>{myEvents.length}</strong><span>Upcoming events</span></div>
        <div className="dash-stat"><strong>{myAnns.length}</strong><span>New updates</span></div>
        <div className={`dash-stat ${myRequests.length > 0 ? 'dash-stat--info' : ''}`}><strong>{myRequests.length}</strong><span>Pending requests</span></div>
      </div>

      <div className="dashboard-grid">
        <SectionCard title="My clubs" subtitle="Organizations you're enrolled in.">
          <div className="action-list">
            {myClubs.length === 0
              ? <div className="empty-state">You haven't joined any clubs yet. Head to Club Directory.</div>
              : myClubs.map((club) => {
                  const role = club.members.find((m) => m.name === userName)?.role ?? 'Member';
                  return (
                    <article key={club.id} className="action-row" style={{ '--card-accent': club.accent }}>
                      <div>
                        <strong>{club.name}</strong>
                        <p>{club.category} · {club.members.length} members</p>
                      </div>
                      <span className="role-pill">{role}</span>
                    </article>
                  );
                })}
          </div>
        </SectionCard>

        <SectionCard title="Upcoming events" subtitle="From your enrolled clubs.">
          <div className="feed-list">
            {myEvents.length === 0
              ? <div className="empty-state">No upcoming events from your clubs.</div>
              : myEvents.map((e) => {
                  const club  = clubs.find((c) => c.id === e.clubId);
                  const going = e.rsvp.includes(userName);
                  return (
                    <article key={e.id} className="event-rsvp-item">
                      <div className="event-rsvp-info">
                        <strong>{e.title}</strong>
                        <p>{club?.name} · {e.location}</p>
                        <span className="rsvp-count">{e.rsvp.length} going</span>
                      </div>
                      <button
                        type="button"
                        className={`rsvp-btn ${going ? 'rsvp-going' : ''}`}
                        onClick={() => dispatch({ type: 'RSVP_EVENT', payload: { eventId: e.id } })}
                      >
                        {going ? '✓ Going' : 'RSVP'}
                      </button>
                    </article>
                  );
                })}
          </div>
        </SectionCard>

        <SectionCard title="Recent announcements" subtitle="Updates from your clubs.">
          <div className="feed-list">
            {myAnns.length === 0
              ? <div className="empty-state">No announcements from your clubs.</div>
              : myAnns.map((a) => <FeedItem key={a.id} title={a.title} sub={a.author} right={a.date} />)}
          </div>
        </SectionCard>

        <SectionCard title="Pending requests" subtitle="Applications you've submitted.">
          <div className="action-list">
            {myRequests.length === 0
              ? <div className="empty-state">No pending requests.</div>
              : myRequests.map((req) => {
                  const club = clubs.find((c) => c.id === req.clubId);
                  return (
                    <article key={req.id} className="action-row">
                      <div><strong>{club?.name ?? req.clubId}</strong><p className="muted-text">Awaiting review</p></div>
                      <span className="status-pending">Pending</span>
                    </article>
                  );
                })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export const DashboardView = memo(function DashboardView(props) {
  if (props.activeRole === 'Admin')       return <AdminDashboard  {...props} />;
  if (props.activeRole === 'Club Leader') return <LeaderDashboard {...props} />;
  return <MemberDashboard {...props} />;
});
