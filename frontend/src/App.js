import { lazy, memo, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionStatus } from '@azure/msal-browser';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import './App.css';
import { AppProvider, useAppDispatch, useAppState } from './context/AppContext';
import { useClubActions } from './context/clubActions';
import { apiFetch } from './api/client';
import { Toast } from './components/common/Toast';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { LoginView } from './components/views/LoginView';
import { navItems } from './data/navigation';
import { APP_ROLES } from './domain/roles';

const DashboardView = lazy(() => import('./components/views/DashboardView').then((m) => ({ default: m.DashboardView })));
const ClubsView = lazy(() => import('./components/views/ClubsView').then((m) => ({ default: m.ClubsView })));
const OperationsView = lazy(() => import('./components/views/OperationsView').then((m) => ({ default: m.OperationsView })));

const AuthenticatedShell = memo(function AuthenticatedShell({ currentUser }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { reloadWorkspace } = useClubActions();
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

  const pendingCount = useMemo(() => {
    if (activeRole === APP_ROLES.Admin) {
      return clubRequests.length + membershipRequests.length;
    }
    if (activeRole === APP_ROLES.ClubLeader) {
      const myClubIds = new Set(
        clubs
          .filter((c) => c.members.some((m) =>
            (m.email === currentUser?.email || m.name === currentUser?.name) &&
            m.role === 'Club Leader'
          ))
          .map((c) => c.id)
      );
      return membershipRequests.filter((r) => myClubIds.has(r.clubId)).length;
    }
    return 0;
  }, [activeRole, clubRequests, membershipRequests, clubs, currentUser]);

  const visibleNavItems = useMemo(
    () => activeRole === APP_ROLES.Admin ? navItems.filter((item) => item.id !== 'manage') : navItems,
    [activeRole]
  );

  useEffect(() => {
    reloadWorkspace();
  }, [currentUser.id, reloadWorkspace]);

  return (
    <div className="app-shell">
      <Sidebar
        activeView={activeView}
        items={visibleNavItems}
        pendingCount={pendingCount}
        currentUser={currentUser}
        onNavigate={(view) => dispatch({ type: 'NAVIGATE', payload: view })}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <button
        className={`sidebar-edge-btn${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen((o) => !o)}
        aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {sidebarOpen ? (
            <polyline points="15 18 9 12 15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          ) : (
            <polyline points="9 18 15 12 9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          )}
        </svg>
      </button>

      <main className="platform-main">
        <Topbar activeView={activeView} />

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
              clubDetailTab={clubDetailTab}
            />
          )}

          {activeView === 'clubs' && (
            <ClubsView
              activeRole={activeRole}
              currentUser={currentUser}
              clubs={clubs}
              clubRequests={clubRequests}
              selectedClub={selectedClub}
              selectedClubId={selectedClub?.id ?? ''}
              clubDetailTab={clubDetailTab}
              announcements={announcements}
              events={events}
              membershipRequests={membershipRequests}
              searchQuery={searchQuery}
              categoryFilter={categoryFilter}
            />
          )}

          {activeView === 'manage' && (
            <OperationsView
              activeRole={activeRole}
              currentUser={currentUser}
              clubs={clubs}
              clubRequests={clubRequests}
              membershipRequests={membershipRequests}
              selectedClub={selectedClub}
              announcements={announcements}
              events={events}
              clubDetailTab={clubDetailTab}
            />
          )}

        </Suspense>
      </main>

      <Toast />
    </div>
  );
});

const AppShell = memo(function AppShell() {
  const dispatch = useAppDispatch();
  const { currentUser } = useAppState();
  const { accounts, inProgress, instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [profileState, setProfileState] = useState({ loading: false, error: null });
  const [profileRetryKey, setProfileRetryKey] = useState(0);
  const loadedProfileAccountId = useRef(null);

  const activeAccount = useMemo(
    () => instance.getActiveAccount() ?? accounts[0] ?? null,
    [accounts, instance]
  );
  const activeAccountId = activeAccount?.homeAccountId ?? activeAccount?.localAccountId ?? null;

  useEffect(() => {
    if (!activeAccount) return;
    instance.setActiveAccount(activeAccount);
  }, [activeAccount, activeAccountId, instance]);

  useEffect(() => {
    if (!isAuthenticated || !activeAccount || !activeAccountId) return;
    const profileLoadKey = `${activeAccountId}:${profileRetryKey}`;
    if (loadedProfileAccountId.current === profileLoadKey) return;

    let cancelled = false;
    loadedProfileAccountId.current = profileLoadKey;
    setProfileState({ loading: true, error: null });

    apiFetch(instance, activeAccount, '/api/me')
      .then(async (response) => {
        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(
            `GET /api/me failed with ${response.status} ${response.statusText}${
              errorBody ? `: ${errorBody}` : ''
            }`
          );
        }

        return response.json();
      })
      .then((profile) => {
        if (cancelled) return;

        const nextUser = {
          id: profile.id,
          entraObjectId: profile.entraObjectId,
          name: profile.displayName,
          email: profile.email,
          role: profile.role,
          avatar: profile.displayName
            ?.split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
          program: 'Student',
        };

        dispatch({ type: 'LOGIN', payload: nextUser });
        setProfileState({ loading: false, error: null });
      })
      .catch((error) => {
        if (cancelled) return;
        loadedProfileAccountId.current = null;
        setProfileState({ loading: false, error: error.message });
      });

    return () => {
      cancelled = true;
    };
  }, [activeAccount, activeAccountId, dispatch, instance, isAuthenticated, profileRetryKey]);

  useEffect(() => {
    if (isAuthenticated || inProgress !== InteractionStatus.None || !currentUser) return;
    dispatch({ type: 'LOGOUT' });
  }, [currentUser, dispatch, inProgress, isAuthenticated]);

  if (inProgress !== InteractionStatus.None) {
    return <div className="auth-loading">Completing sign in...</div>;
  }

  if (isAuthenticated && profileState.loading && !currentUser) {
    return <div className="auth-loading">Loading your profile...</div>;
  }

  if (isAuthenticated && profileState.error && !currentUser) {
    return (
      <div className="auth-loading auth-error">
        <strong>Could not load your profile.</strong>
        <span>{profileState.error}</span>
        <button type="button" className="login-card-btn" onClick={() => setProfileRetryKey((key) => key + 1)}>
          Retry
        </button>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) return <LoginView />;
  return <AuthenticatedShell currentUser={currentUser} />;
});

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
