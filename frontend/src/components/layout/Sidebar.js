import { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

function AccountPopup({ currentUser, anchorRef, onClose, onSignOut }) {
  const popupRef = useRef(null);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ bottom: window.innerHeight - rect.top + 8, left: rect.left });
    }
  }, [anchorRef]);

  useEffect(() => {
    const handle = (e) => {
      if (!popupRef.current?.contains(e.target) && !anchorRef.current?.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose, anchorRef]);

  if (!pos) return null;

  return createPortal(
    <div ref={popupRef} className="account-popup" style={{ bottom: pos.bottom, left: pos.left }}>
      <div className="account-popup-header">
        <div className="sidebar-user-avatar">{currentUser?.avatar ?? '?'}</div>
        <div className="account-popup-info">
          <strong>{currentUser?.name}</strong>
          <span className="sidebar-role-tag">{currentUser?.role}</span>
        </div>
      </div>
      <button type="button" className="account-popup-signout" onClick={onSignOut}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Sign out
      </button>
    </div>,
    document.body
  );
}

export const Sidebar = memo(function Sidebar({ activeView, items, pendingCount, currentUser, onNavigate, isOpen, onClose }) {
  const dispatch = useAppDispatch();
  const { instance } = useMsal();
  const [popupOpen, setPopupOpen] = useState(false);
  const avatarRef = useRef(null);

  const handleSignOut = () => {
    setPopupOpen(false);
    dispatch({ type: 'LOGOUT' });
    instance.logoutRedirect();
  };

  return (
    <>
      <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
        <div className="brand-block">
          <img className="brand-logo-image" src={iusLogo} alt="IUS logo" />
          <div className="brand-text">
            <p className="brand-title">Student Clubs Hub</p>
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
          <button
            type="button"
            ref={avatarRef}
            className="sidebar-account-card"
            onClick={() => setPopupOpen((o) => !o)}
            title="Account options"
          >
            <div className="sidebar-user-avatar">{currentUser?.avatar ?? '?'}</div>
            <div className="sidebar-user-info">
              <strong>{currentUser?.name}</strong>
              <span className="sidebar-role-tag">{currentUser?.role}</span>
            </div>
          </button>
        </div>
      </aside>

      {popupOpen && (
        <AccountPopup
          currentUser={currentUser}
          anchorRef={avatarRef}
          onClose={() => setPopupOpen(false)}
          onSignOut={handleSignOut}
        />
      )}

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
