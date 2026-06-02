import { memo } from 'react';

const VIEW_LABELS = {
  home: { title: 'Home', sub: 'Your day at a glance: actions, deadlines, and updates.' },
  clubs: { title: 'Clubs', sub: 'Discover, join, and track every student club in one place.' },
  manage: { title: 'Manage', sub: 'Run operations with clear workflows and fewer clicks.' },
};

export const Topbar = memo(function Topbar({
  activeView,
}) {
  const { title, sub } = VIEW_LABELS[activeView] ?? VIEW_LABELS.home;

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Student Club Management</p>
        <h1 className="topbar-title">{title}</h1>
        <p className="topbar-sub">{sub}</p>
      </div>
    </header>
  );
});
