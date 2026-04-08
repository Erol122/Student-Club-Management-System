import { lazy, memo, Suspense, useMemo } from 'react';
import './App.css';
import { AppProvider, useAppDispatch, useAppState } from './context/AppContext';
import { Toast } from './components/common/Toast';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { LoginView } from './components/views/LoginView';
import { navItems } from './data/mockData';

const DashboardView = lazy(() => import('./components/views/DashboardView').then((m) => ({ default: m.DashboardView })));
const ClubsView = lazy(() => import('./components/views/ClubsView').then((m) => ({ default: m.ClubsView })));
const OperationsView = lazy(() => import('./components/views/OperationsView').then((m) => ({ default: m.OperationsView })));

const AuthenticatedShell = memo(function AuthenticatedShell({ currentUser }) {
  const dispatch = useAppDispatch();
  const {
    activeView,
    activeRole,
    selectedClubId,
    clubs,
    clubRequests,
    membershipRequests,
    announcements,
    events,
    activityLog,
    searchQuery,
    categoryFilter,
    clubDetailTab,
  } = useAppState();

  const selectedClub = useMemo(
    () => clubs.find((c) => c.id === selectedClubId) ?? clubs[0] ?? null,
    [clubs, selectedClubId]
  );

  const pendingCount = clubRequests.length + membershipRequests.length;

  return (
    <div className="app-shell">
      <Sidebar
        activeView={activeView}
        items={navItems}
        pendingCount={pendingCount}
        currentUser={currentUser}
        onNavigate={(view) => dispatch({ type: 'NAVIGATE', payload: view })}
      />

      <main className="platform-main">
        <Topbar
          activeView={activeView}
          currentUser={currentUser}
          clubs={clubs}
          selectedClubId={selectedClubId}
          selectedClub={selectedClub}
          onSelectClub={(clubId) => dispatch({ type: 'SELECT_CLUB', payload: clubId })}
        />

        <Suspense fallback={<div className="view-loading">Loading workspace...</div>}>
          {activeView === 'home' && (
            <DashboardView
              activeRole={activeRole}
              currentUser={currentUser}
              clubs={clubs}
              clubRequests={clubRequests}
              membershipRequests={membershipRequests}
              announcements={announcements}
              events={events}
              activityLog={activityLog}
              selectedClub={selectedClub}
            />
          )}

          {activeView === 'clubs' && selectedClub && (
            <ClubsView
              activeRole={activeRole}
              currentUser={currentUser}
              clubs={clubs}
              selectedClub={selectedClub}
              selectedClubId={selectedClubId}
              clubDetailTab={clubDetailTab}
              announcements={announcements}
              events={events}
              membershipRequests={membershipRequests}
              searchQuery={searchQuery}
              categoryFilter={categoryFilter}
            />
          )}

          {activeView === 'manage' && selectedClub && (
            <OperationsView
              activeRole={activeRole}
              currentUser={currentUser}
              clubs={clubs}
              clubRequests={clubRequests}
              membershipRequests={membershipRequests}
              selectedClub={selectedClub}
              announcements={announcements}
              events={events}
            />
          )}

        </Suspense>
      </main>

      <Toast />
    </div>
  );
});

const AppShell = memo(function AppShell() {
  const { currentUser } = useAppState();
  if (!currentUser) return <LoginView />;
  return <AuthenticatedShell currentUser={currentUser} />;
});

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
