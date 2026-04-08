import { memo, useMemo } from 'react';
import { useAppDispatch } from '../../context/AppContext';
import { SectionCard } from '../common/SectionCard';

function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60_000) return 'just now';
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
}

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

function AdminHome({ clubs, clubRequests, membershipRequests, events, activityLog }) {
  const dispatch = useAppDispatch();
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const upcoming = useMemo(
    () =>
      events
        .filter((e) => new Date(e.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5),
    [events, today]
  );

  const totalMembers = useMemo(() => clubs.reduce((sum, club) => sum + club.members.length, 0), [clubs]);
  const pendingCount = clubRequests.length + membershipRequests.length;

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-content">
          <span className="eyebrow">Admin workspace</span>
          <h2>Run all clubs from one place</h2>
          <p>
            Review requests quickly, keep communication consistent, and help student leaders launch
            clubs without friction.
          </p>
          <div className="hero-tags">
            <span>{clubs.length} Active clubs</span>
            <span>{pendingCount} Pending items</span>
            <span>{upcoming.length} Upcoming events</span>
          </div>
        </div>
      </section>

      <StatGrid
        items={[
          { label: 'Total clubs', value: clubs.length },
          { label: 'Total students', value: totalMembers },
          { label: 'Pending approvals', value: pendingCount, urgent: pendingCount > 0 },
          { label: 'Upcoming events', value: upcoming.length },
        ]}
      />

      <div className="dashboard-grid">
        <SectionCard
          title="Approvals waiting"
          subtitle="Fast actions for proposals and membership requests."
          actions={<button type="button" className="ghost-button" onClick={() => dispatch({ type: 'NAVIGATE', payload: 'manage' })}>Open manage</button>}
        >
          <div className="action-list">
            {pendingCount === 0 ? <p className="empty-state">Nothing pending right now.</p> : null}
            {clubRequests.slice(0, 3).map((req) => (
              <article key={req.id} className="action-row">
                <div>
                  <strong>{req.name}</strong>
                  <p>{req.category} proposal by {req.proposedBy}</p>
                </div>
              </article>
            ))}
            {membershipRequests.slice(0, 3).map((req) => (
              <article key={req.id} className="action-row">
                <div>
                  <strong>{req.student}</strong>
                  <p>Membership request</p>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Latest platform activity" subtitle="Recent student and club actions.">
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
    </div>
  );
}

function LeaderHome({ selectedClub, membershipRequests, announcements, events }) {
  const dispatch = useAppDispatch();
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const clubRequests = useMemo(
    () => membershipRequests.filter((r) => r.clubId === selectedClub?.id),
    [membershipRequests, selectedClub?.id]
  );
  const clubEvents = useMemo(
    () =>
      events
        .filter((e) => e.clubId === selectedClub?.id && new Date(e.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5),
    [events, selectedClub?.id, today]
  );
  const clubAnnouncements = useMemo(
    () => announcements.filter((a) => a.clubId === selectedClub?.id).slice(0, 5),
    [announcements, selectedClub?.id]
  );

  if (!selectedClub) return <p className="empty-state">No club selected.</p>;

  return (
    <div className="page-stack">
      <section className="hero-panel" style={{ borderTop: `4px solid ${selectedClub.accent}` }}>
        <div className="hero-content">
          <span className="eyebrow">Club leader</span>
          <h2>{selectedClub.name}</h2>
          <p>{selectedClub.summary}</p>
          <div className="hero-tags">
            <span>{selectedClub.members.length} Members</span>
            <span>{clubRequests.length} Pending requests</span>
            <span>{clubEvents.length} Upcoming events</span>
          </div>
        </div>
      </section>

      <StatGrid
        items={[
          { label: 'Members', value: selectedClub.members.length },
          { label: 'Requests', value: clubRequests.length, urgent: clubRequests.length > 0 },
          { label: 'Events', value: clubEvents.length },
          { label: 'Announcements', value: clubAnnouncements.length },
        ]}
      />

      <div className="dashboard-grid">
        <SectionCard
          title="Requests that need review"
          subtitle="Approve or decline from the Manage page."
          actions={
            <button
              type="button"
              className="ghost-button"
              onClick={() => dispatch({ type: 'NAVIGATE', payload: 'manage' })}
            >
              Open manage
            </button>
          }
        >
          <div className="action-list">
            {clubRequests.length === 0 ? (
              <p className="empty-state">No membership requests right now.</p>
            ) : (
              clubRequests.map((req) => (
                <article key={req.id} className="action-row">
                  <div>
                    <strong>{req.student}</strong>
                    <p>{req.program}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Upcoming events" subtitle="Keep your members informed and engaged.">
          <div className="feed-list">
            {clubEvents.length === 0 ? <p className="empty-state">No upcoming events scheduled.</p> : null}
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
      </div>
    </div>
  );
}

function MemberHome({ clubs, membershipRequests, announcements, events, currentUser }) {
  const dispatch = useAppDispatch();
  const userName = currentUser?.name;

  const myClubs = useMemo(
    () => clubs.filter((club) => club.members.some((m) => m.name === userName)),
    [clubs, userName]
  );

  const myClubIds = useMemo(() => myClubs.map((club) => club.id), [myClubs]);
  const myRequests = useMemo(
    () => membershipRequests.filter((r) => r.student === userName),
    [membershipRequests, userName]
  );
  const myEvents = useMemo(
    () => events.filter((e) => myClubIds.includes(e.clubId)).slice(0, 5),
    [events, myClubIds]
  );
  const myAnnouncements = useMemo(
    () => announcements.filter((a) => myClubIds.includes(a.clubId)).slice(0, 5),
    [announcements, myClubIds]
  );

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-content">
          <span className="eyebrow">Student home</span>
          <h2>Your clubs and opportunities</h2>
          <p>
            Track your memberships, RSVP to events, and stay aligned with club updates without
            digging through menus.
          </p>
          <div className="hero-tags">
            <span>{myClubs.length} My clubs</span>
            <span>{myEvents.length} Upcoming events</span>
            <span>{myRequests.length} Pending requests</span>
          </div>
        </div>
      </section>

      <StatGrid
        items={[
          { label: 'My clubs', value: myClubs.length },
          { label: 'Upcoming events', value: myEvents.length },
          { label: 'Announcements', value: myAnnouncements.length },
          { label: 'Pending requests', value: myRequests.length, urgent: myRequests.length > 0 },
        ]}
      />

      <div className="dashboard-grid">
        <SectionCard
          title="My club memberships"
          subtitle="Open Clubs to discover and join more communities."
          actions={
            <button
              type="button"
              className="ghost-button"
              onClick={() => dispatch({ type: 'NAVIGATE', payload: 'clubs' })}
            >
              Browse clubs
            </button>
          }
        >
          <div className="action-list">
            {myClubs.length === 0 ? <p className="empty-state">You have not joined any clubs yet.</p> : null}
            {myClubs.map((club) => (
              <article key={club.id} className="action-row">
                <div>
                  <strong>{club.name}</strong>
                  <p>{club.category}</p>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Latest announcements" subtitle="Recent updates from your clubs.">
          <div className="feed-list">
            {myAnnouncements.length === 0 ? <p className="empty-state">No updates from your clubs yet.</p> : null}
            {myAnnouncements.map((item) => (
              <article key={item.id} className="feed-item">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.author}</p>
                </div>
                <span>{item.date}</span>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export const DashboardView = memo(function DashboardView(props) {
  if (props.activeRole === 'Admin') return <AdminHome {...props} />;
  if (props.activeRole === 'Club Leader') return <LeaderHome {...props} />;
  return <MemberHome {...props} />;
});
