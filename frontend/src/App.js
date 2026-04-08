import React, { useMemo, useState } from 'react';
import './App.css';
import { MetricCard } from './components/common/MetricCard';
import { DashboardView } from './components/views/DashboardView';
import { ClubsView } from './components/views/ClubsView';
import { OperationsView } from './components/views/OperationsView';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import {
  initialAnnouncements,
  initialClubRequests,
  initialClubs,
  initialEvents,
  initialMembershipRequests,
  navItems,
  roleOptions,
} from './data/mockData';

const currentUser = 'Demo Student';

const formatDisplayDate = (value) =>
  new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [activeRole, setActiveRole] = useState('Admin');
  const [selectedClubId, setSelectedClubId] = useState(initialClubs[0]?.id ?? '');
  const [clubs, setClubs] = useState(initialClubs);
  const [clubRequests, setClubRequests] = useState(initialClubRequests);
  const [membershipRequests, setMembershipRequests] = useState(initialMembershipRequests);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [events, setEvents] = useState(initialEvents);

  const selectedClub =
    clubs.find((club) => club.id === selectedClubId) ?? clubs[0] ?? null;

  const dashboardMetrics = useMemo(() => {
    const totalMembers = clubs.reduce((sum, club) => sum + club.members.length, 0);
    const pendingApprovals = clubRequests.length + membershipRequests.length;
    const upcomingEvents = events.filter((event) => new Date(event.date) >= new Date('2026-04-08')).length;

    return [
      {
        label: 'Active Clubs',
        value: clubs.length,
        detail: 'Approved and visible to students',
      },
      {
        label: 'Community Members',
        value: totalMembers,
        detail: 'Across all club rosters',
      },
      {
        label: 'Pending Approvals',
        value: pendingApprovals,
        detail: 'Club creation + membership requests',
      },
      {
        label: 'Upcoming Events',
        value: upcomingEvents,
        detail: 'Scheduled in the calendar',
      },
    ];
  }, [clubRequests.length, clubs, events, membershipRequests.length]);

  const membershipState = useMemo(() => {
    const memberClubIds = clubs
      .filter((club) => club.members.some((member) => member.name === currentUser))
      .map((club) => club.id);

    const pendingClubIds = membershipRequests
      .filter((request) => request.student === currentUser)
      .map((request) => request.clubId);

    return { memberClubIds, pendingClubIds };
  }, [clubs, membershipRequests]);

  const handleClubRequestSubmit = (draft) => {
    setClubRequests((current) => [
      {
        id: `club-request-${Date.now()}`,
        proposedBy: draft.proposedBy,
        name: draft.name,
        category: draft.category,
        mission: draft.mission,
      },
      ...current,
    ]);
  };

  const handleApproveClub = (requestId) => {
    const approvedRequest = clubRequests.find((request) => request.id === requestId);
    if (!approvedRequest) return;

    const newClub = {
      id: approvedRequest.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: approvedRequest.name,
      category: approvedRequest.category,
      summary: approvedRequest.mission,
      leader: approvedRequest.proposedBy,
      accent: '#5b8def',
      members: [
        { id: `${requestId}-leader`, name: approvedRequest.proposedBy, role: 'Club Leader', program: 'Club Founder' },
      ],
      health: 'Growing',
      nextEvent: 'Planning session pending',
      announcementsCount: 0,
    };

    setClubs((current) => [newClub, ...current]);
    setClubRequests((current) => current.filter((request) => request.id !== requestId));
    setSelectedClubId(newClub.id);
  };

  const handleRejectClub = (requestId) => {
    setClubRequests((current) => current.filter((request) => request.id !== requestId));
  };

  const handleMembershipRequest = (clubId) => {
    const alreadyMember = membershipState.memberClubIds.includes(clubId);
    const alreadyPending = membershipState.pendingClubIds.includes(clubId);
    if (alreadyMember || alreadyPending) return;

    setMembershipRequests((current) => [
      {
        id: `membership-${Date.now()}`,
        clubId,
        student: currentUser,
        program: 'Computer Science',
        reason: 'Interested in contributing to workshops and weekly activities.',
      },
      ...current,
    ]);
  };

  const handleApproveMembership = (requestId) => {
    const request = membershipRequests.find((item) => item.id === requestId);
    if (!request) return;

    setClubs((current) =>
      current.map((club) =>
        club.id === request.clubId
          ? {
              ...club,
              members: [
                ...club.members,
                {
                  id: `${request.id}-member`,
                  name: request.student,
                  role: 'Member',
                  program: request.program,
                },
              ],
            }
          : club
      )
    );

    setMembershipRequests((current) => current.filter((item) => item.id !== requestId));
  };

  const handleDeclineMembership = (requestId) => {
    setMembershipRequests((current) => current.filter((item) => item.id !== requestId));
  };

  const handleAnnouncementPublish = (draft) => {
    setAnnouncements((current) => [
      {
        id: `announcement-${Date.now()}`,
        clubId: draft.clubId,
        title: draft.title,
        body: draft.body,
        author: activeRole === 'Admin' ? 'Platform Admin' : selectedClub?.leader ?? 'Club Leader',
        audience: draft.audience,
        date: formatDisplayDate('2026-04-08'),
      },
      ...current,
    ]);
  };

  const handleScheduleEvent = (draft) => {
    setEvents((current) => [
      {
        id: `event-${Date.now()}`,
        clubId: draft.clubId,
        title: draft.title,
        date: draft.date,
        location: draft.location,
        attendance: [],
      },
      ...current,
    ]);
  };

  const handleToggleAttendance = (eventId, memberName) => {
    setEvents((current) =>
      current.map((event) =>
        event.id === eventId
          ? {
              ...event,
              attendance: event.attendance.includes(memberName)
                ? event.attendance.filter((name) => name !== memberName)
                : [...event.attendance, memberName],
            }
          : event
      )
    );
  };

  const handleRoleUpdate = (clubId, memberId, nextRole) => {
    setClubs((current) =>
      current.map((club) =>
        club.id === clubId
          ? {
              ...club,
              members: club.members.map((member) =>
                member.id === memberId ? { ...member, role: nextRole } : member
              ),
            }
          : club
      )
    );
  };

  const selectedClubAnnouncements = announcements.filter(
    (announcement) => announcement.clubId === selectedClub?.id
  );

  const selectedClubEvents = events.filter((event) => event.clubId === selectedClub?.id);

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <div className="platform-frame">
        <Sidebar activeView={activeView} items={navItems} onNavigate={setActiveView} />

        <main className="platform-main">
          <Topbar
            activeRole={activeRole}
            currentUser={currentUser}
            onRoleChange={setActiveRole}
            roleOptions={roleOptions}
            selectedClubId={selectedClubId}
            clubs={clubs}
            onClubChange={setSelectedClubId}
          />

          <section className="metrics-grid">
            {dashboardMetrics.map((metric) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                detail={metric.detail}
              />
            ))}
          </section>

          {activeView === 'dashboard' && (
            <DashboardView
              activeRole={activeRole}
              clubs={clubs}
              clubRequests={clubRequests}
              membershipRequests={membershipRequests}
              announcements={announcements}
              events={events}
              selectedClub={selectedClub}
            />
          )}

          {activeView === 'clubs' && selectedClub && (
            <ClubsView
              activeRole={activeRole}
              clubs={clubs}
              currentUser={currentUser}
              selectedClub={selectedClub}
              selectedClubAnnouncements={selectedClubAnnouncements}
              selectedClubEvents={selectedClubEvents}
              membershipState={membershipState}
              onJoinRequest={handleMembershipRequest}
              onSelectClub={setSelectedClubId}
            />
          )}

          {activeView === 'operations' && selectedClub && (
            <OperationsView
              activeRole={activeRole}
              clubs={clubs}
              clubRequests={clubRequests}
              membershipRequests={membershipRequests}
              selectedClub={selectedClub}
              selectedClubEvents={selectedClubEvents}
              selectedClubAnnouncements={selectedClubAnnouncements}
              onApproveClub={handleApproveClub}
              onRejectClub={handleRejectClub}
              onSubmitClubRequest={handleClubRequestSubmit}
              onApproveMembership={handleApproveMembership}
              onDeclineMembership={handleDeclineMembership}
              onPublishAnnouncement={handleAnnouncementPublish}
              onScheduleEvent={handleScheduleEvent}
              onToggleAttendance={handleToggleAttendance}
              onRoleUpdate={handleRoleUpdate}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
