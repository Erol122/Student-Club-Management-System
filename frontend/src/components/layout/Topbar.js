import { memo } from 'react';
import { useAppDispatch } from '../../context/AppContext';

const VIEW_LABELS = {
  dashboard:  { title: 'Dashboard',        sub: 'Overview of clubs, members, and pending actions.' },
  clubs:      { title: 'Club Directory',   sub: 'Browse clubs, view details, and manage memberships.' },
  operations: { title: 'Operations',       sub: 'Manage approvals, announcements, events, and roles.' },
};

export const Topbar = memo(function Topbar({ activeView, currentUser, selectedClub }) {
  const dispatch = useAppDispatch();
  const { title, sub } = VIEW_LABELS[activeView] ?? VIEW_LABELS.dashboard;
  const initials = currentUser?.avatar ?? currentUser?.name?.split(' ').map((p) => p[0]).join('').slice(0, 2) ?? '?';

  return (
    <header className="topbar">
      <div className="topbar-copy">
        <span className="eyebrow">IUS student organizations</span>
        <h1 className="topbar-title">{title}</h1>
        <p className="topbar-sub">{sub}</p>
      </div>

      <div className="topbar-controls">
        {currentUser?.role === 'Club Leader' && selectedClub && (
          <div className="control-card topbar-club-badge">
            <span>Active club</span>
            <strong>{selectedClub.name}</strong>
          </div>
        )}

        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div>
            <strong>{currentUser?.name}</strong>
            <span>{currentUser?.role}</span>
          </div>
        </div>

        <button
          type="button"
          className="logout-btn"
          onClick={() => dispatch({ type: 'LOGOUT' })}
          title="Sign out"
        >
          Sign out
        </button>
      </div>
    </header>
  );
});
