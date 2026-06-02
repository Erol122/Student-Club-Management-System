import { memo } from 'react';

const VIEW_LABELS = {
  home:   { title: 'Home' },
  clubs:  { title: 'Clubs' },
  manage: { title: 'Manage' },
};

export const Topbar = memo(function Topbar({ activeView }) {
  const { title } = VIEW_LABELS[activeView] ?? VIEW_LABELS.home;

  return (
    <header className="topbar">
      <div className="topbar-content">
        <span className="eyebrow">Student Club Management</span>
        <span className="topbar-dot" aria-hidden="true">·</span>
        <h1 className="topbar-title">{title}</h1>
      </div>
    </header>
  );
});
