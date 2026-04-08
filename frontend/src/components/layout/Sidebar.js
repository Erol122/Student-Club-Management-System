import React from 'react';

export function Sidebar({ activeView, items, onNavigate }) {
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
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar-link ${activeView === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="sidebar-link-badge">{item.short}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <strong>Club lifecycle</strong>
        <p>Create clubs, approve leaders, manage members, schedule events, and publish updates.</p>
      </div>
    </aside>
  );
}
