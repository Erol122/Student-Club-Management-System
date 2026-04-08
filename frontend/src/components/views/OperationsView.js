import React, { useState } from 'react';
import { SectionCard } from '../common/SectionCard';

const defaultClubDraft = {
  name: '',
  category: '',
  proposedBy: '',
  mission: '',
};

const defaultAnnouncementDraft = {
  title: '',
  body: '',
  audience: 'All members',
};

const defaultEventDraft = {
  title: '',
  date: '2026-04-18',
  location: '',
};

export function OperationsView({
  activeRole,
  clubs,
  clubRequests,
  membershipRequests,
  selectedClub,
  selectedClubEvents,
  selectedClubAnnouncements,
  onApproveClub,
  onRejectClub,
  onSubmitClubRequest,
  onApproveMembership,
  onDeclineMembership,
  onPublishAnnouncement,
  onScheduleEvent,
  onToggleAttendance,
  onRoleUpdate,
}) {
  const [clubDraft, setClubDraft] = useState(defaultClubDraft);
  const [announcementDraft, setAnnouncementDraft] = useState(defaultAnnouncementDraft);
  const [eventDraft, setEventDraft] = useState(defaultEventDraft);

  const submitClubDraft = (event) => {
    event.preventDefault();
    onSubmitClubRequest(clubDraft);
    setClubDraft(defaultClubDraft);
  };

  const submitAnnouncement = (event) => {
    event.preventDefault();
    onPublishAnnouncement({ ...announcementDraft, clubId: selectedClub.id });
    setAnnouncementDraft(defaultAnnouncementDraft);
  };

  const submitEvent = (event) => {
    event.preventDefault();
    onScheduleEvent({ ...eventDraft, clubId: selectedClub.id });
    setEventDraft(defaultEventDraft);
  };

  const selectedClubMembershipRequests = membershipRequests.filter(
    (request) => request.clubId === selectedClub.id
  );

  return (
    <div className="page-stack">
      <div className="dashboard-grid">
        <SectionCard
          title="Club creation and approval"
          subtitle="Admins can approve new clubs, while leaders can submit proposals."
        >
          <form className="stack-form" onSubmit={submitClubDraft}>
            <div className="input-grid">
              <label>
                Club name
                <input
                  value={clubDraft.name}
                  onChange={(event) => setClubDraft({ ...clubDraft, name: event.target.value })}
                  required
                />
              </label>
              <label>
                Category
                <input
                  value={clubDraft.category}
                  onChange={(event) => setClubDraft({ ...clubDraft, category: event.target.value })}
                  required
                />
              </label>
              <label>
                Proposed by
                <input
                  value={clubDraft.proposedBy}
                  onChange={(event) => setClubDraft({ ...clubDraft, proposedBy: event.target.value })}
                  required
                />
              </label>
            </div>

            <label>
              Mission
              <textarea
                rows="4"
                value={clubDraft.mission}
                onChange={(event) => setClubDraft({ ...clubDraft, mission: event.target.value })}
                required
              />
            </label>

            <button type="submit" className="primary-button">
              Submit club proposal
            </button>
          </form>

          <div className="action-list">
            {clubRequests.map((request) => (
              <article key={request.id} className="action-row">
                <div>
                  <strong>{request.name}</strong>
                  <p>
                    {request.category} by {request.proposedBy}
                  </p>
                  <span>{request.mission}</span>
                </div>
                <div className="inline-actions">
                  <button type="button" className="ghost-button" onClick={() => onRejectClub(request.id)}>
                    Reject
                  </button>
                  <button type="button" className="primary-button" onClick={() => onApproveClub(request.id)}>
                    Approve
                  </button>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Membership requests"
          subtitle={`Approve or decline applications for ${selectedClub.name}.`}
        >
          <div className="action-list">
            {selectedClubMembershipRequests.length === 0 ? (
              <div className="empty-state">No pending membership requests for this club.</div>
            ) : (
              selectedClubMembershipRequests.map((request) => (
                <article key={request.id} className="action-row">
                  <div>
                    <strong>{request.student}</strong>
                    <p>{request.program}</p>
                    <span>{request.reason}</span>
                  </div>
                  <div className="inline-actions">
                    <button type="button" className="ghost-button" onClick={() => onDeclineMembership(request.id)}>
                      Decline
                    </button>
                    <button type="button" className="primary-button" onClick={() => onApproveMembership(request.id)}>
                      Approve
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Announcements"
          subtitle={`Publish updates for ${selectedClub.name}.`}
        >
          <form className="stack-form" onSubmit={submitAnnouncement}>
            <div className="input-grid">
              <label>
                Title
                <input
                  value={announcementDraft.title}
                  onChange={(event) =>
                    setAnnouncementDraft({ ...announcementDraft, title: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Audience
                <select
                  value={announcementDraft.audience}
                  onChange={(event) =>
                    setAnnouncementDraft({ ...announcementDraft, audience: event.target.value })
                  }
                >
                  <option>All members</option>
                  <option>Leadership team</option>
                  <option>Open to campus</option>
                </select>
              </label>
            </div>

            <label>
              Announcement body
              <textarea
                rows="4"
                value={announcementDraft.body}
                onChange={(event) =>
                  setAnnouncementDraft({ ...announcementDraft, body: event.target.value })
                }
                required
              />
            </label>

            <button type="submit" className="primary-button">
              Publish update
            </button>
          </form>

          <div className="feed-list compact">
            {selectedClubAnnouncements.map((announcement) => (
              <article key={announcement.id} className="feed-item">
                <div>
                  <strong>{announcement.title}</strong>
                  <p>{announcement.author}</p>
                </div>
                <span>{announcement.date}</span>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Event scheduling and attendance"
          subtitle="Schedule meetings, workshops, and track attendance."
        >
          <form className="stack-form" onSubmit={submitEvent}>
            <div className="input-grid">
              <label>
                Event title
                <input
                  value={eventDraft.title}
                  onChange={(event) => setEventDraft({ ...eventDraft, title: event.target.value })}
                  required
                />
              </label>
              <label>
                Date
                <input
                  type="date"
                  value={eventDraft.date}
                  onChange={(event) => setEventDraft({ ...eventDraft, date: event.target.value })}
                  required
                />
              </label>
              <label>
                Location
                <input
                  value={eventDraft.location}
                  onChange={(event) => setEventDraft({ ...eventDraft, location: event.target.value })}
                  required
                />
              </label>
            </div>

            <button type="submit" className="primary-button">
              Schedule event
            </button>
          </form>

          <div className="event-stack">
            {selectedClubEvents.map((event) => (
              <article key={event.id} className="event-card">
                <div className="event-card-header">
                  <div>
                    <strong>{event.title}</strong>
                    <p>
                      {event.date} · {event.location}
                    </p>
                  </div>
                  <span>{event.attendance.length} attending</span>
                </div>

                <div className="attendance-chip-row">
                  {selectedClub.members.map((member) => {
                    const checked = event.attendance.includes(member.name);
                    return (
                      <button
                        key={`${event.id}-${member.id}`}
                        type="button"
                        className={`attendance-chip ${checked ? 'checked' : ''}`}
                        onClick={() => onToggleAttendance(event.id, member.name)}
                      >
                        {member.name}
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Role assignment within club"
        subtitle={`Manage permissions and responsibilities for ${selectedClub.name}.`}
      >
        <div className="role-grid">
          {selectedClub.members.map((member) => (
            <article key={member.id} className="role-card">
              <div>
                <strong>{member.name}</strong>
                <p>{member.program}</p>
              </div>
              <select
                value={member.role}
                onChange={(event) => onRoleUpdate(selectedClub.id, member.id, event.target.value)}
                disabled={activeRole === 'Member'}
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

      <SectionCard
        title="Platform overview"
        subtitle="Reusable club entities currently managed in the system."
      >
        <div className="mini-club-grid">
          {clubs.map((club) => (
            <article key={club.id} className="mini-club-card">
              <strong>{club.name}</strong>
              <span>{club.members.length} members</span>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
