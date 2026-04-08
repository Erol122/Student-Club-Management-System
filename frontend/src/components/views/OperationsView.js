import { memo, useMemo, useState } from 'react';
import { useAppDispatch } from '../../context/AppContext';

// ── Shared helpers ────────────────────────────────────────────────────────────

function TabBar({ tabs, active, onChange }) {
  return (
    <div className="ops-tab-bar">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`ops-tab-btn ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count > 0 && <span className="ops-tab-badge">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

function EmptySlate({ text }) {
  return <div className="empty-state" style={{ padding: '28px 18px', textAlign: 'center' }}>{text}</div>;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

function AdminOps({ clubs, clubRequests, membershipRequests }) {
  const dispatch = useAppDispatch();

  const TABS = [
    { id: 'clubs',       label: 'Club Requests',    count: clubRequests.length },
    { id: 'memberships', label: 'Memberships',       count: membershipRequests.length },
    { id: 'platform',    label: 'Platform Overview', count: 0 },
  ];

  const [tab, setTab] = useState('clubs');

  return (
    <div className="ops-layout">
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'clubs' && (
        <div className="ops-content">
          {clubRequests.length === 0 ? (
            <EmptySlate text="No pending club proposals — the queue is clear." />
          ) : (
            <div className="action-list">
              {clubRequests.map((req) => (
                <article key={req.id} className="action-row">
                  <div>
                    <strong>{req.name}</strong>
                    <p>{req.category} · Proposed by {req.proposedBy}</p>
                    <span>{req.mission}</span>
                  </div>
                  <div className="inline-actions">
                    <button type="button" className="ghost-button" onClick={() => dispatch({ type: 'REJECT_CLUB', payload: req.id })}>Reject</button>
                    <button type="button" className="primary-button" onClick={() => dispatch({ type: 'APPROVE_CLUB', payload: req.id })}>Approve</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'memberships' && (
        <div className="ops-content">
          {membershipRequests.length === 0 ? (
            <EmptySlate text="No pending membership requests across any club." />
          ) : (
            <div className="action-list">
              {membershipRequests.map((req) => {
                const club = clubs.find((c) => c.id === req.clubId);
                return (
                  <article key={req.id} className="action-row">
                    <div>
                      <strong>{req.student}</strong>
                      <p>{req.program} · applying to <strong>{club?.name}</strong></p>
                      <span>{req.reason}</span>
                    </div>
                    <div className="inline-actions">
                      <button type="button" className="ghost-button" onClick={() => dispatch({ type: 'DECLINE_MEMBERSHIP', payload: req.id })}>Decline</button>
                      <button type="button" className="primary-button" onClick={() => dispatch({ type: 'APPROVE_MEMBERSHIP', payload: req.id })}>Approve</button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'platform' && (
        <div className="ops-content">
          <div className="mini-club-grid">
            {clubs.map((club) => (
              <article key={club.id} className="mini-club-card" style={{ '--card-accent': club.accent }}>
                <div>
                  <strong>{club.name}</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.82rem' }}>{club.category} · {club.health}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ display: 'block', fontWeight: 800, fontSize: '1.2rem' }}>{club.members.length}</span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.76rem' }}>members</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Club Leader ───────────────────────────────────────────────────────────────

const emptyAnn  = { title: '', body: '', audience: 'All members' };
const emptyEvt  = { title: '', date: '', location: '' };
const emptyClub = { name: '', category: '', proposedBy: '', mission: '' };

function LeaderOps({ selectedClub, membershipRequests, announcements, events }) {
  const dispatch = useAppDispatch();

  const clubReqs  = useMemo(() => membershipRequests.filter((r) => r.clubId === selectedClub.id), [membershipRequests, selectedClub.id]);
  const clubAnns  = useMemo(() => announcements.filter((a) => a.clubId === selectedClub.id), [announcements, selectedClub.id]);
  const clubEvts  = useMemo(() => events.filter((e) => e.clubId === selectedClub.id), [events, selectedClub.id]);

  const TABS = [
    { id: 'requests',      label: 'Requests',      count: clubReqs.length },
    { id: 'announcements', label: 'Announcements',  count: 0 },
    { id: 'events',        label: 'Events',         count: 0 },
    { id: 'roles',         label: 'Roles',          count: 0 },
    { id: 'new-club',      label: 'Propose Club',   count: 0 },
  ];

  const [tab, setTab]        = useState('requests');
  const [annDraft, setAnn]   = useState(emptyAnn);
  const [evtDraft, setEvt]   = useState(emptyEvt);
  const [clubDraft, setClub] = useState(emptyClub);
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const submitAnn = (e) => {
    e.preventDefault();
    dispatch({ type: 'PUBLISH_ANNOUNCEMENT', payload: { ...annDraft, clubId: selectedClub.id, author: selectedClub.leader } });
    setAnn(emptyAnn);
  };

  const submitEvt = (e) => {
    e.preventDefault();
    dispatch({ type: 'SCHEDULE_EVENT', payload: { ...evtDraft, clubId: selectedClub.id } });
    setEvt(emptyEvt);
  };

  const submitClub = (e) => {
    e.preventDefault();
    dispatch({ type: 'SUBMIT_CLUB_REQUEST', payload: clubDraft });
    setClub(emptyClub);
  };

  return (
    <div className="ops-layout">
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'requests' && (
        <div className="ops-content">
          {clubReqs.length === 0 ? (
            <EmptySlate text={`No pending membership requests for ${selectedClub.name}.`} />
          ) : (
            <div className="action-list">
              {clubReqs.map((req) => (
                <article key={req.id} className="action-row">
                  <div>
                    <strong>{req.student}</strong>
                    <p>{req.program}</p>
                    <span>{req.reason}</span>
                  </div>
                  <div className="inline-actions">
                    <button type="button" className="ghost-button" onClick={() => dispatch({ type: 'DECLINE_MEMBERSHIP', payload: req.id })}>Decline</button>
                    <button type="button" className="primary-button" onClick={() => dispatch({ type: 'APPROVE_MEMBERSHIP', payload: req.id })}>Approve</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'announcements' && (
        <div className="ops-content ops-two-col">
          <div>
            <p className="ops-section-label">New announcement</p>
            <form className="stack-form" onSubmit={submitAnn}>
              <label>Title<input value={annDraft.title} onChange={(e) => setAnn((d) => ({ ...d, title: e.target.value }))} required /></label>
              <label>
                Audience
                <select value={annDraft.audience} onChange={(e) => setAnn((d) => ({ ...d, audience: e.target.value }))}>
                  <option>All members</option>
                  <option>Leadership team</option>
                  <option>Open to campus</option>
                </select>
              </label>
              <label>Body<textarea rows="4" value={annDraft.body} onChange={(e) => setAnn((d) => ({ ...d, body: e.target.value }))} required /></label>
              <button type="submit" className="primary-button">Publish announcement</button>
            </form>
          </div>
          <div>
            <p className="ops-section-label">Published ({clubAnns.length})</p>
            <div className="feed-list">
              {clubAnns.length === 0
                ? <EmptySlate text="No announcements yet." />
                : clubAnns.map((a) => (
                    <article key={a.id} className="feed-item">
                      <div><strong>{a.title}</strong><p>{a.author} · {a.audience}</p></div>
                      <span>{a.date}</span>
                    </article>
                  ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'events' && (
        <div className="ops-content ops-two-col">
          <div>
            <p className="ops-section-label">Schedule event</p>
            <form className="stack-form" onSubmit={submitEvt}>
              <label>Event title<input value={evtDraft.title} onChange={(e) => setEvt((d) => ({ ...d, title: e.target.value }))} required /></label>
              <label>Date<input type="date" value={evtDraft.date} min={today} onChange={(e) => setEvt((d) => ({ ...d, date: e.target.value }))} required /></label>
              <label>Location<input value={evtDraft.location} onChange={(e) => setEvt((d) => ({ ...d, location: e.target.value }))} required /></label>
              <button type="submit" className="primary-button">Schedule event</button>
            </form>
          </div>
          <div>
            <p className="ops-section-label">RSVP status</p>
            <div className="event-stack">
              {clubEvts.length === 0
                ? <EmptySlate text="No events scheduled yet." />
                : clubEvts.map((evt) => (
                    <article key={evt.id} className="event-card">
                      <div className="event-card-header">
                        <div>
                          <strong>{evt.title}</strong>
                          <p>{evt.date} · {evt.location}</p>
                        </div>
                        <span className="rsvp-count">{evt.rsvp.length} going</span>
                      </div>
                      {evt.rsvp.length > 0 && (
                        <div className="attendance-chip-row" style={{ marginTop: 12 }}>
                          {evt.rsvp.map((name) => (
                            <span key={name} className="attendance-chip checked">{name}</span>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'roles' && (
        <div className="ops-content">
          <p className="ops-section-label">Role assignment — {selectedClub.name}</p>
          <div className="role-grid">
            {selectedClub.members.map((m) => (
              <article key={m.id} className="role-card">
                <div>
                  <strong>{m.name}</strong>
                  <p>{m.program}</p>
                </div>
                <select
                  value={m.role}
                  onChange={(e) => dispatch({ type: 'UPDATE_ROLE', payload: { clubId: selectedClub.id, memberId: m.id, role: e.target.value } })}
                >
                  <option>Club Leader</option>
                  <option>Vice Leader</option>
                  <option>Moderator</option>
                  <option>Content Lead</option>
                  <option>Member</option>
                </select>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === 'new-club' && (
        <div className="ops-content ops-narrow">
          <p className="ops-section-label">Propose a new club</p>
          <form className="stack-form" onSubmit={submitClub}>
            <div className="input-grid">
              <label>Club name<input value={clubDraft.name} onChange={(e) => setClub((d) => ({ ...d, name: e.target.value }))} required /></label>
              <label>Category<input value={clubDraft.category} onChange={(e) => setClub((d) => ({ ...d, category: e.target.value }))} required /></label>
              <label>Proposed by<input value={clubDraft.proposedBy} onChange={(e) => setClub((d) => ({ ...d, proposedBy: e.target.value }))} required /></label>
            </div>
            <label>Mission<textarea rows="4" value={clubDraft.mission} onChange={(e) => setClub((d) => ({ ...d, mission: e.target.value }))} required /></label>
            <button type="submit" className="primary-button">Submit for admin review</button>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Member ────────────────────────────────────────────────────────────────────

function MemberOps({ clubs, membershipRequests, currentUser }) {
  const userName   = currentUser?.name;
  const myClubs    = useMemo(() => clubs.filter((c) => c.members.some((m) => m.name === userName)), [clubs, userName]);
  const myRequests = useMemo(() => membershipRequests.filter((r) => r.student === userName), [membershipRequests, userName]);

  const TABS = [
    { id: 'clubs',    label: 'My Clubs',    count: 0 },
    { id: 'requests', label: 'My Requests', count: myRequests.length },
  ];

  const [tab, setTab] = useState('clubs');

  return (
    <div className="ops-layout">
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'clubs' && (
        <div className="ops-content">
          {myClubs.length === 0 ? (
            <EmptySlate text="You're not in any clubs yet. Head to Club Directory to join one." />
          ) : (
            <div className="action-list">
              {myClubs.map((club) => {
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
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div className="ops-content">
          {myRequests.length === 0 ? (
            <EmptySlate text="No pending requests. Browse Club Directory to apply to clubs." />
          ) : (
            <div className="action-list">
              {myRequests.map((req) => {
                const club = clubs.find((c) => c.id === req.clubId);
                return (
                  <article key={req.id} className="action-row">
                    <div>
                      <strong>{club?.name ?? req.clubId}</strong>
                      <p className="muted-text">Awaiting leadership review</p>
                    </div>
                    <span className="status-pending">Pending</span>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export const OperationsView = memo(function OperationsView(props) {
  if (props.activeRole === 'Admin')       return <AdminOps  {...props} />;
  if (props.activeRole === 'Club Leader') return <LeaderOps {...props} />;
  return <MemberOps {...props} />;
});
