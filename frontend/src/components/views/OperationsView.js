import { memo, useMemo, useState } from 'react';
import { useAppDispatch } from '../../context/AppContext';
import { SectionCard } from '../common/SectionCard';

const emptyAnnouncement = { title: '', body: '', audience: 'All members' };
const emptyEvent = { title: '', date: '', location: '' };
const emptyClub = { name: '', category: '', proposedBy: '', mission: '' };
const emptyClubRecord = {
  name: '',
  category: '',
  summary: '',
  leader: '',
  health: 'Growing',
  nextEvent: '',
  groupPlatform: 'WhatsApp',
  groupLink: '',
};

function AdminManage({ clubs, clubRequests, membershipRequests }) {
  const dispatch = useAppDispatch();
  const [clubDraft, setClubDraft] = useState(emptyClubRecord);
  const [editingClubId, setEditingClubId] = useState(null);

  const resetClubForm = () => {
    setClubDraft(emptyClubRecord);
    setEditingClubId(null);
  };

  const startEditingClub = (club) => {
    setEditingClubId(club.id);
    setClubDraft({
      name: club.name,
      category: club.category,
      summary: club.summary,
      leader: club.leader,
      health: club.health,
      nextEvent: club.nextEvent,
      groupPlatform: club.groupPlatform || 'WhatsApp',
      groupLink: club.groupLink || '',
    });
  };

  const deleteClub = (club) => {
    const confirmed = window.confirm(`Delete ${club.name}? This also removes its local events, announcements, and join requests.`);
    if (!confirmed) return;
    dispatch({ type: 'DELETE_CLUB', payload: club.id });
    if (editingClubId === club.id) resetClubForm();
  };

  return (
    <div className="page-stack">
      <div className="dashboard-grid">
        <SectionCard title="Club records" subtitle="Create, update, and remove live clubs.">
          <div className="action-list">
            {clubs.map((club) => (
              <article key={club.id} className="action-row">
                <div>
                  <strong>{club.name}</strong>
                  <p>{club.category} · led by {club.leader}</p>
                  <span>{club.summary}</span>
                </div>
                <div className="inline-actions">
                  <button type="button" className="ghost-button" onClick={() => startEditingClub(club)}>
                    Edit
                  </button>
                  <button type="button" className="danger-button" onClick={() => deleteClub(club)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title={editingClubId ? 'Edit club' : 'Create club'}
          subtitle={editingClubId ? 'Update the selected club record.' : 'Add a club directly to the directory.'}
        >
          <form
            className="stack-form"
            onSubmit={(e) => {
              e.preventDefault();
              dispatch({
                type: editingClubId ? 'UPDATE_CLUB' : 'CREATE_CLUB',
                payload: editingClubId ? { id: editingClubId, ...clubDraft } : clubDraft,
              });
              resetClubForm();
            }}
          >
            <label>
              Club name
              <input
                value={clubDraft.name}
                onChange={(e) => setClubDraft((prev) => ({ ...prev, name: e.target.value }))}
                maxLength="150"
                required
              />
            </label>
            <label>
              Category
              <input
                value={clubDraft.category}
                onChange={(e) => setClubDraft((prev) => ({ ...prev, category: e.target.value }))}
                required
              />
            </label>
            <label>
              Leader
              <input
                value={clubDraft.leader}
                onChange={(e) => setClubDraft((prev) => ({ ...prev, leader: e.target.value }))}
                required
              />
            </label>
            <label>
              Health
              <select
                value={clubDraft.health}
                onChange={(e) => setClubDraft((prev) => ({ ...prev, health: e.target.value }))}
              >
                <option>Excellent</option>
                <option>Active</option>
                <option>Growing</option>
                <option>Needs attention</option>
              </select>
            </label>
            <label>
              Summary
              <textarea
                rows="3"
                value={clubDraft.summary}
                onChange={(e) => setClubDraft((prev) => ({ ...prev, summary: e.target.value }))}
                required
              />
            </label>
            <label>
              Next event
              <input
                value={clubDraft.nextEvent}
                onChange={(e) => setClubDraft((prev) => ({ ...prev, nextEvent: e.target.value }))}
                placeholder="Planning session pending"
              />
            </label>
            <label>
              Group platform
              <input
                value={clubDraft.groupPlatform}
                onChange={(e) => setClubDraft((prev) => ({ ...prev, groupPlatform: e.target.value }))}
              />
            </label>
            <label>
              Group link
              <input
                value={clubDraft.groupLink}
                onChange={(e) => setClubDraft((prev) => ({ ...prev, groupLink: e.target.value }))}
                placeholder="https://..."
              />
            </label>
            <div className="inline-actions form-actions">
              <button type="submit" className="primary-button">
                {editingClubId ? 'Save club' : 'Create club'}
              </button>
              {editingClubId ? (
                <button type="button" className="ghost-button" onClick={resetClubForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </SectionCard>
      </div>

      <div className="dashboard-grid">
        <SectionCard title="Club proposals" subtitle="Approve new student club ideas.">
          <div className="action-list">
            {clubRequests.length === 0 ? <p className="empty-state">No club proposals pending.</p> : null}
            {clubRequests.map((req) => (
              <article key={req.id} className="action-row">
                <div>
                  <strong>{req.name}</strong>
                  <p>{req.category} · proposed by {req.proposedBy}</p>
                  <span>{req.mission}</span>
                </div>
                <div className="inline-actions">
                  <button type="button" className="ghost-button" onClick={() => dispatch({ type: 'REJECT_CLUB', payload: req.id })}>
                    Reject
                  </button>
                  <button type="button" className="primary-button" onClick={() => dispatch({ type: 'APPROVE_CLUB', payload: req.id })}>
                    Approve
                  </button>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Membership approvals" subtitle="Review student join requests.">
          <div className="action-list">
            {membershipRequests.length === 0 ? <p className="empty-state">No membership requests pending.</p> : null}
            {membershipRequests.map((req) => {
              const club = clubs.find((c) => c.id === req.clubId);
              return (
                <article key={req.id} className="action-row">
                  <div>
                    <strong>{req.student}</strong>
                    <p>{req.program} · {club?.name ?? req.clubId}</p>
                    <span>{req.reason}</span>
                  </div>
                  <div className="inline-actions">
                    <button type="button" className="ghost-button" onClick={() => dispatch({ type: 'DECLINE_MEMBERSHIP', payload: req.id })}>
                      Decline
                    </button>
                    <button type="button" className="primary-button" onClick={() => dispatch({ type: 'APPROVE_MEMBERSHIP', payload: req.id })}>
                      Approve
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function LeaderManage({ selectedClub, membershipRequests, announcements, events }) {
  const dispatch = useAppDispatch();
  const [announcementDraft, setAnnouncementDraft] = useState(emptyAnnouncement);
  const [eventDraft, setEventDraft] = useState(emptyEvent);
  const [clubDraft, setClubDraft] = useState(emptyClub);

  const clubRequests = useMemo(
    () => membershipRequests.filter((req) => req.clubId === selectedClub.id),
    [membershipRequests, selectedClub.id]
  );
  const clubAnnouncements = useMemo(
    () => announcements.filter((item) => item.clubId === selectedClub.id),
    [announcements, selectedClub.id]
  );
  const clubEvents = useMemo(
    () => events.filter((item) => item.clubId === selectedClub.id),
    [events, selectedClub.id]
  );

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  return (
    <div className="page-stack">
      <div className="dashboard-grid">
        <SectionCard title="Membership requests" subtitle={`Requests for ${selectedClub.name}.`}>
          <div className="action-list">
            {clubRequests.length === 0 ? <p className="empty-state">No pending requests.</p> : null}
            {clubRequests.map((req) => (
              <article key={req.id} className="action-row">
                <div>
                  <strong>{req.student}</strong>
                  <p>{req.program}</p>
                  <span>{req.reason}</span>
                </div>
                <div className="inline-actions">
                  <button type="button" className="ghost-button" onClick={() => dispatch({ type: 'DECLINE_MEMBERSHIP', payload: req.id })}>
                    Decline
                  </button>
                  <button type="button" className="primary-button" onClick={() => dispatch({ type: 'APPROVE_MEMBERSHIP', payload: req.id })}>
                    Approve
                  </button>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Post announcement" subtitle="Share quick updates with members.">
          <form
            className="stack-form"
            onSubmit={(e) => {
              e.preventDefault();
              dispatch({
                type: 'PUBLISH_ANNOUNCEMENT',
                payload: {
                  ...announcementDraft,
                  clubId: selectedClub.id,
                  author: selectedClub.leader,
                },
              });
              setAnnouncementDraft(emptyAnnouncement);
            }}
          >
            <label>
              Title
              <input
                value={announcementDraft.title}
                onChange={(e) => setAnnouncementDraft((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </label>
            <label>
              Audience
              <select
                value={announcementDraft.audience}
                onChange={(e) => setAnnouncementDraft((prev) => ({ ...prev, audience: e.target.value }))}
              >
                <option>All members</option>
                <option>Leadership team</option>
                <option>Open to campus</option>
              </select>
            </label>
            <label>
              Message
              <textarea
                rows="4"
                value={announcementDraft.body}
                onChange={(e) => setAnnouncementDraft((prev) => ({ ...prev, body: e.target.value }))}
                required
              />
            </label>
            <button type="submit" className="primary-button">Publish announcement</button>
          </form>
        </SectionCard>
      </div>

      <div className="dashboard-grid">
        <SectionCard title="Schedule event" subtitle="Keep your club calendar active.">
          <form
            className="stack-form"
            onSubmit={(e) => {
              e.preventDefault();
              dispatch({
                type: 'SCHEDULE_EVENT',
                payload: {
                  ...eventDraft,
                  clubId: selectedClub.id,
                },
              });
              setEventDraft(emptyEvent);
            }}
          >
            <label>
              Event title
              <input
                value={eventDraft.title}
                onChange={(e) => setEventDraft((prev) => ({ ...prev, title: e.target.value }))}
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
                required
              />
            </label>
            <button type="submit" className="primary-button">Schedule event</button>
          </form>
        </SectionCard>

        <SectionCard title="Member roles" subtitle="Assign responsibilities clearly.">
          <div className="role-grid">
            {selectedClub.members.map((member) => (
              <article key={member.id} className="role-card">
                <div>
                  <strong>{member.name}</strong>
                  <p>{member.program}</p>
                </div>
                <select
                  value={member.role}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_ROLE',
                      payload: {
                        clubId: selectedClub.id,
                        memberId: member.id,
                        role: e.target.value,
                      },
                    })
                  }
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
        </SectionCard>
      </div>

      <div className="dashboard-grid">
        <SectionCard title="Recent posts and events" subtitle="Quick visibility for what your members see.">
          <div className="feed-list">
            {clubAnnouncements.slice(0, 3).map((item) => (
              <article key={item.id} className="feed-item">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.audience}</p>
                </div>
                <span>{item.date}</span>
              </article>
            ))}
            {clubEvents.slice(0, 3).map((item) => (
              <article key={item.id} className="feed-item">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.location}</p>
                </div>
                <span>{item.date}</span>
              </article>
            ))}
            {clubAnnouncements.length === 0 && clubEvents.length === 0 ? (
              <p className="empty-state">No announcements or events yet.</p>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard title="Propose a new club" subtitle="Start another student initiative.">
          <form
            className="stack-form"
            onSubmit={(e) => {
              e.preventDefault();
              dispatch({ type: 'SUBMIT_CLUB_REQUEST', payload: clubDraft });
              setClubDraft(emptyClub);
            }}
          >
            <label>
              Club name
              <input
                value={clubDraft.name}
                onChange={(e) => setClubDraft((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </label>
            <label>
              Category
              <input
                value={clubDraft.category}
                onChange={(e) => setClubDraft((prev) => ({ ...prev, category: e.target.value }))}
                required
              />
            </label>
            <label>
              Proposed by
              <input
                value={clubDraft.proposedBy}
                onChange={(e) => setClubDraft((prev) => ({ ...prev, proposedBy: e.target.value }))}
                required
              />
            </label>
            <label>
              Mission
              <textarea
                rows="3"
                value={clubDraft.mission}
                onChange={(e) => setClubDraft((prev) => ({ ...prev, mission: e.target.value }))}
                required
              />
            </label>
            <button type="submit" className="primary-button">Submit proposal</button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}

function MemberManage({ clubs, membershipRequests, currentUser }) {
  const dispatch = useAppDispatch();
  const [clubDraft, setClubDraft] = useState(emptyClub);
  const myClubs = useMemo(
    () => clubs.filter((club) => club.members.some((member) => member.name === currentUser?.name)),
    [clubs, currentUser?.name]
  );
  const myRequests = useMemo(
    () => membershipRequests.filter((req) => req.student === currentUser?.name),
    [membershipRequests, currentUser?.name]
  );

  return (
    <div className="page-stack">
      <div className="dashboard-grid">
        <SectionCard title="My memberships" subtitle="Your current club participation.">
          <div className="action-list">
            {myClubs.length === 0 ? <p className="empty-state">You are not a member of any club yet.</p> : null}
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

        <SectionCard title="My pending join requests" subtitle="Requests waiting for club review.">
          <div className="action-list">
            {myRequests.length === 0 ? <p className="empty-state">No pending requests.</p> : null}
            {myRequests.map((req) => {
              const club = clubs.find((clubItem) => clubItem.id === req.clubId);
              return (
                <article key={req.id} className="action-row">
                  <div>
                    <strong>{club?.name ?? req.clubId}</strong>
                    <p>Awaiting review</p>
                  </div>
                  <span className="status-pending">Pending</span>
                </article>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Create a new club" subtitle="If your idea does not exist yet, submit a proposal.">
        <form
          className="stack-form"
          onSubmit={(e) => {
            e.preventDefault();
            dispatch({ type: 'SUBMIT_CLUB_REQUEST', payload: clubDraft });
            setClubDraft(emptyClub);
          }}
        >
          <label>
            Club name
            <input
              value={clubDraft.name}
              onChange={(e) => setClubDraft((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </label>
          <label>
            Category
            <input
              value={clubDraft.category}
              onChange={(e) => setClubDraft((prev) => ({ ...prev, category: e.target.value }))}
              required
            />
          </label>
          <label>
            Proposed by
            <input
              value={clubDraft.proposedBy}
              onChange={(e) => setClubDraft((prev) => ({ ...prev, proposedBy: e.target.value }))}
              required
            />
          </label>
          <label>
            Mission
            <textarea
              rows="4"
              value={clubDraft.mission}
              onChange={(e) => setClubDraft((prev) => ({ ...prev, mission: e.target.value }))}
              required
            />
          </label>
          <button type="submit" className="primary-button">Submit proposal for approval</button>
        </form>
      </SectionCard>
    </div>
  );
}

export const OperationsView = memo(function OperationsView(props) {
  if (props.activeRole === 'Admin') return <AdminManage {...props} />;
  if (props.activeRole === 'Club Leader') return <LeaderManage {...props} />;
  return <MemberManage {...props} />;
});
