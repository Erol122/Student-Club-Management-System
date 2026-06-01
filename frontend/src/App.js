import { lazy, memo, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionStatus } from '@azure/msal-browser';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import './App.css';
import { AppProvider, useAppDispatch, useAppState, useClubActions } from './context/AppContext';
import { apiFetch } from './api/client';
import { Toast } from './components/common/Toast';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { LoginView } from './components/views/LoginView';
import { navItems } from './data/mockData';

const DashboardView = lazy(() => import('./components/views/DashboardView').then((m) => ({ default: m.DashboardView })));
const ClubsView = lazy(() => import('./components/views/ClubsView').then((m) => ({ default: m.ClubsView })));
const OperationsView = lazy(() => import('./components/views/OperationsView').then((m) => ({ default: m.OperationsView })));

function isClubLedByUser(club, user) {
  if (!club || !user) return false;

  return club.members.some(
    (member) =>
      (member.role === 'President' || member.role === 'Club Leader') &&
      (member.userId === user.id || member.email === user.email || member.name === user.name)
  );
}

const AuthenticatedShell = memo(function AuthenticatedShell({ currentUser }) {
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

  const visibleClubs = useMemo(
    () =>
      activeRole === 'Club Leader'
        ? clubs.filter((club) => isClubLedByUser(club, currentUser))
        : clubs,
    [activeRole, clubs, currentUser]
  );

  const visibleClubIds = useMemo(
    () => new Set(visibleClubs.map((club) => club.id)),
    [visibleClubs]
  );

  const visibleMembershipRequests = useMemo(
    () =>
      activeRole === 'Club Leader'
        ? membershipRequests.filter((request) => visibleClubIds.has(request.clubId))
        : membershipRequests,
    [activeRole, membershipRequests, visibleClubIds]
  );

  const selectedClub = useMemo(
    () => visibleClubs.find((c) => c.id === selectedClubId) ?? visibleClubs[0] ?? null,
    [visibleClubs, selectedClubId]
  );

  const pendingCount =
    activeRole === 'Club Leader'
      ? visibleMembershipRequests.length
      : clubRequests.length + membershipRequests.length;

  useEffect(() => {
    reloadWorkspace();
  }, [currentUser.id]);

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
        />

        <Suspense fallback={<div className="view-loading">Loading workspace...</div>}>
          {activeView === 'home' && (
            <DashboardView
              activeRole={activeRole}
              currentUser={currentUser}
              clubs={visibleClubs}
              clubRequests={clubRequests}
              membershipRequests={visibleMembershipRequests}
              announcements={announcements}
              events={events}
              activityLog={activityLog}
              selectedClub={selectedClub}
            />
          )}

          {activeView === 'clubs' && (
            <ClubsView
              activeRole={activeRole}
              currentUser={currentUser}
              clubs={visibleClubs}
              selectedClub={selectedClub}
              selectedClubId={selectedClub?.id ?? ''}
              clubDetailTab={clubDetailTab}
              announcements={announcements}
              events={events}
              membershipRequests={visibleMembershipRequests}
              searchQuery={searchQuery}
              categoryFilter={categoryFilter}
            />
          )}

          {activeView === 'manage' && (
            <OperationsView
              activeRole={activeRole}
              currentUser={currentUser}
              clubs={visibleClubs}
              clubRequests={clubRequests}
              membershipRequests={visibleMembershipRequests}
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
