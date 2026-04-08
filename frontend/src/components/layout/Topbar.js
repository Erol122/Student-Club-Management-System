import React from 'react';

export function Topbar({
  activeRole,
  currentUser,
  onRoleChange,
  roleOptions,
  selectedClubId,
  clubs,
  onClubChange,
}) {
  return (
    <header className="topbar">
      <div className="topbar-copy">
        <span className="eyebrow">IUS student organizations</span>
        <h1>Club management system with role-based workflows.</h1>
        <p>
          Switch between admin, club leader, and member perspectives while managing
          clubs from one reusable platform.
        </p>
      </div>

      <div className="topbar-controls">
        <label className="control-card">
          <span>Role view</span>
          <select value={activeRole} onChange={(event) => onRoleChange(event.target.value)}>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <label className="control-card">
          <span>Active club</span>
          <select value={selectedClubId} onChange={(event) => onClubChange(event.target.value)}>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </label>

        <div className="user-chip">
          <div className="user-avatar">DS</div>
          <div>
            <strong>{currentUser}</strong>
            <span>Signed in</span>
          </div>
        </div>
      </div>
    </header>
  );
}
