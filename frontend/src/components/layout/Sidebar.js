import { memo } from 'react';
import { useMsal } from '@azure/msal-react';
import { useAppDispatch } from '../../context/AppContext';
import iusLogo from '../../data/IUS_Official_Logo.png';

function NavButton({ item, activeView, pendingCount, onNavigate, compact = false }) {
  const isActive = activeView === item.id;
  const showBadge = item.showBadge && pendingCount > 0;
  const Icon = item.icon ?? null;

  return (
    <button
      type="button"
      className={`nav-link ${isActive ? 'active' : ''} ${compact ? 'compact' : ''}`.trim()}
      onClick={() => onNavigate(item.id)}
    >
      <span className="nav-link-short">
        {Icon ? <Icon /> : null}
      </span>
      <span className="nav-link-label">{item.label}</span>
      {showBadge ? <span className="nav-badge">{pendingCount}</span> : null}
    </button>
  );
}

export const Sidebar = memo(function Sidebar({ activeView, items, pendingCount, currentUser, onNavigate }) {
  const dispatch = useAppDispatch();
  const { instance } = useMsal();

  return (
    <>
      <aside className="sidebar">
        <div className="brand-block">
          <img className="brand-logo-image" src={iusLogo} alt="IUS logo" />
          <div>
            <p className="brand-title">Student Clubs Hub</p>
            <span className="brand-subtitle">Simple tools for student teams</span>
          </div>
        </div>

        <div className="sidebar-section-title">Workspace</div>
        <nav className="sidebar-nav">
          {items.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              activeView={activeView}
              pendingCount={pendingCount}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        <div className="sidebar-account">
          <div className="user-chip sidebar-user-chip">
            <div>
              <strong>{currentUser?.name}</strong>
              <span>{currentUser?.role}</span>
            </div>
          </div>

          <button
            type="button"
            className="logout-btn sidebar-logout-btn"
            onClick={() => {
              dispatch({ type: 'LOGOUT' });
              instance.logoutRedirect();
            }}
            title="Sign out"
          >
            Sign out
          </button>
        </div>
      </aside>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {items.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            activeView={activeView}
            pendingCount={pendingCount}
            onNavigate={onNavigate}
            compact
          />
        ))}
      </nav>
    </>
  );
});
