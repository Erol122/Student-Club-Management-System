import { lazy, memo, Suspense, useMemo } from 'react';
import './App.css';
import { AppProvider, useAppDispatch, useAppState } from './context/AppContext';
import { Toast } from './components/common/Toast';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { LoginView } from './components/views/LoginView';
import { navItems } from './data/mockData';

const DashboardView  = lazy(() => import('./components/views/DashboardView').then((m) => ({ default: m.DashboardView })));
const ClubsView      = lazy(() => import('./components/views/ClubsView').then((m) => ({ default: m.ClubsView })));
const OperationsView = lazy(() => import('./components/views/OperationsView').then((m) => ({ default: m.OperationsView })));

// ── Authenticated shell ──────────────────────────────────────────────────────
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
    messages,
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
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <div className="platform-frame">
        <Sidebar
          activeView={activeView}
          items={navItems}
          pendingCount={pendingCount}
          onNavigate={(view) => dispatch({ type: 'NAVIGATE', payload: view })}
        />

        <main className="platform-main">
          <Topbar
            activeView={activeView}
            currentUser={currentUser}
            selectedClub={selectedClub}
          />

          <Suspense fallback={<div className="view-loading" />}>
            {activeView === 'dashboard' && (
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
                messages={messages}
                membershipRequests={membershipRequests}
                searchQuery={searchQuery}
                categoryFilter={categoryFilter}
              />
            )}

            {activeView === 'operations' && selectedClub && (
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
      </div>

      <Toast />
    </div>
  );
});

// ── Root shell (decides login vs. app) ──────────────────────────────────────
const AppShell = memo(function AppShell() {
  const { currentUser } = useAppState();
  if (!currentUser) return <LoginView />;
  return <AuthenticatedShell currentUser={currentUser} />;
});

// ── Root ────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
