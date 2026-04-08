import { memo } from 'react';

export const Sidebar = memo(function Sidebar({ activeView, items, pendingCount, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">SC</div>
        <div>
          <p className="brand-title">Student Clubs</p>
          <span className="brand-subtitle">Management Platform</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => {
          const showBadge = item.showBadge && pendingCount > 0;
          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-link ${activeView === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="sidebar-link-badge">{item.short}</span>
              <span>{item.label}</span>
              {showBadge && <span className="nav-badge">{pendingCount}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <strong>Club lifecycle</strong>
        <p>Create clubs, approve leaders, manage members, schedule events, and publish updates.</p>
      </div>
    </aside>
  );
});
