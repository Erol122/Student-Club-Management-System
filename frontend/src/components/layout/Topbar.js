import { memo } from 'react';
import { useAppDispatch } from '../../context/AppContext';

const VIEW_LABELS = {
  home: { title: 'Home', sub: 'Your day at a glance: actions, deadlines, and updates.' },
  clubs: { title: 'Clubs', sub: 'Discover, join, and track every student club in one place.' },
  manage: { title: 'Manage', sub: 'Run operations with clear workflows and fewer clicks.' },
};

export const Topbar = memo(function Topbar({
  activeView,
  currentUser,
  clubs,
  selectedClub,
  selectedClubId,
  onSelectClub,
}) {
  const dispatch = useAppDispatch();
  const { title, sub } = VIEW_LABELS[activeView] ?? VIEW_LABELS.home;
  const initials =
    currentUser?.avatar ??
    currentUser?.name
      ?.split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2) ??
    '?';

  const canSwitchClub = clubs.length > 1 && currentUser?.role !== 'Member';

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Student Club Management</p>
        <h1 className="topbar-title">{title}</h1>
        <p className="topbar-sub">{sub}</p>
      </div>

      <div className="topbar-controls">
        {canSwitchClub ? (
          <label className="control-card">
            Active club
            <select value={selectedClubId} onChange={(e) => onSelectClub(e.target.value)}>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </label>
        ) : selectedClub ? (
          <div className="control-card">
            Active club
            <strong>{selectedClub.name}</strong>
          </div>
        ) : null}

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
