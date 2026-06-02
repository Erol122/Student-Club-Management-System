import { memo, useCallback, useMemo, useState } from 'react';
import { useAppDispatch, useAppState } from '../../context/AppContext';
import { useClubActions } from '../../context/clubActions';
import { APP_ROLES } from '../../domain/roles';
import { SectionCard } from '../common/SectionCard';
import { ClubDrawer } from '../common/ClubDrawer';

export const ClubsView = memo(function ClubsView({
  activeRole,
  currentUser,
  clubs,
  clubRequests,
  selectedClub,
  selectedClubId,
  clubDetailTab,
  announcements,
  events,
  membershipRequests,
  searchQuery,
  categoryFilter,
}) {
  const dispatch = useAppDispatch();
  const { clubsSaving } = useAppState();
  const {
    approveClubProposalRecord,
    rejectClubProposalRecord,
    deleteClubRecord,
    updateClubRecord,
    requestMembershipRecord,
    leaveClubRecord,
  } = useClubActions();

  const [memberView, setMemberView] = useState('my-clubs');
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const categories = useMemo(() => ['All', ...new Set(clubs.map((club) => club.category))], [clubs]);

  const filterClubs = useCallback((clubList) => {
    let result = clubList;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (club) =>
          club.name.toLowerCase().includes(q) ||
          club.category.toLowerCase().includes(q) ||
          club.leader.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'All') {
      result = result.filter((club) => club.category === categoryFilter);
    }
    return result;
  }, [categoryFilter, searchQuery]);

  const filteredClubs = useMemo(
    () => filterClubs(clubs),
    [clubs, filterClubs]
  );

  const memberClubIds = useMemo(
    () => clubs.filter((club) =>
      club.members.some((member) => member.email === currentUser?.email || member.name === currentUser?.name)
    ).map((club) => club.id),
    [clubs, currentUser?.email, currentUser?.name]
  );

  const memberClubs = useMemo(
    () => clubs.filter((club) => memberClubIds.includes(club.id)),
    [clubs, memberClubIds]
  );

  const pendingClubIds = useMemo(
    () => membershipRequests
      .filter((req) => req.email === currentUser?.email || req.student === currentUser?.name)
      .map((req) => req.clubId),
    [membershipRequests, currentUser?.email, currentUser?.name]
  );

  const joinableClubs = useMemo(
    () => filterClubs(clubs.filter((club) => !memberClubIds.includes(club.id))),
    [clubs, filterClubs, memberClubIds]
  );

  const openDrawer = useCallback((clubId) => {
    dispatch({ type: 'SELECT_CLUB', payload: clubId });
    setDrawerOpen(true);
  }, [dispatch]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const handleDeleteClub = useCallback(async (clubId) => {
    const deleted = await deleteClubRecord(clubId);
    if (deleted) closeDrawer();
  }, [deleteClubRecord, closeDrawer]);

  const handleSaveClub = useCallback(async (draft) => {
    return updateClubRecord(selectedClub?.id, draft);
  }, [updateClubRecord, selectedClub?.id]);

  const handleLeaveClub = useCallback(async (clubId) => {
    const left = await leaveClubRecord(clubId);
    if (left) closeDrawer();
  }, [leaveClubRecord, closeDrawer]);

  // ── Admin ──────────────────────────────────────────────────────────────────
  if (activeRole === APP_ROLES.Admin) {
    return (
      <div className="page-stack">
        {clubRequests.length > 0 ? (
          <SectionCard
            title="Club proposals"
            subtitle={`${clubRequests.length} pending — review and approve or reject`}
          >
            <div className="action-list">
              {clubRequests.map((req) => (
                <article key={req.id} className="action-row">
                  <div>
                    <strong>{req.name}</strong>
                    <p>{req.category} · {req.mission}</p>
                  </div>
                  <div className="inline-actions">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => rejectClubProposalRecord(req.id)}
                      disabled={clubsSaving}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => approveClubProposalRecord(req.id)}
                      disabled={clubsSaving}
                    >
                      Approve
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>
        ) : null}

        <section className="search-row">
          <input
            className="search-input"
            placeholder="Search clubs by name, category, or leader..."
            value={searchQuery}
            onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
          />
        </section>

        <div className="filter-chips">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`filter-chip ${categoryFilter === category ? 'active' : ''}`.trim()}
              onClick={() => dispatch({ type: 'SET_CATEGORY', payload: category })}
            >
              {category}
            </button>
          ))}
        </div>

        <SectionCard
          className="club-list-card"
          title="Club directory"
          subtitle={`${filteredClubs.length} club${filteredClubs.length === 1 ? '' : 's'} — click to view, edit or delete`}
        >
          <div className="club-list">
            {filteredClubs.length === 0 ? <p className="empty-state">No clubs match the current filters.</p> : null}
            {filteredClubs.map((club) => (
              <button
                key={club.id}
                type="button"
                className={`club-list-row ${isDrawerOpen && selectedClubId === club.id ? 'selected' : ''}`.trim()}
                onClick={() => openDrawer(club.id)}
              >
                <span className="club-list-main">
                  <strong>{club.name}</strong>
                  <span>{club.summary}</span>
                </span>
                <span className="club-list-meta">
                  <span>{club.category}</span>
                  <span>{club.leader}</span>
                </span>
              </button>
            ))}
          </div>
        </SectionCard>

        {isDrawerOpen ? (
          <ClubDrawer
            key={selectedClub?.id}
            selectedClub={selectedClub}
            clubDetailTab={clubDetailTab}
            announcements={announcements}
            events={events}
            onClose={closeDrawer}
            onDelete={handleDeleteClub}
            onSave={handleSaveClub}
            isSaving={clubsSaving}
          />
        ) : null}
      </div>
    );
  }

  // ── Member ─────────────────────────────────────────────────────────────────
  if (activeRole === APP_ROLES.Member) {
    const showMyClubs = memberView === 'my-clubs';

    return (
      <div className="page-stack">
        <div className="club-view-tabs">
          <button
            type="button"
            className={`tab-btn ${showMyClubs ? 'active' : ''}`.trim()}
            onClick={() => setMemberView('my-clubs')}
          >
            My clubs
          </button>
          <button
            type="button"
            className={`tab-btn ${!showMyClubs ? 'active' : ''}`.trim()}
            onClick={() => setMemberView('join-clubs')}
          >
            Join clubs
          </button>
        </div>

        {showMyClubs ? (
          <SectionCard
            title="My clubs"
            subtitle={`${memberClubs.length} club${memberClubs.length === 1 ? '' : 's'} you belong to`}
          >
            <div className="club-list">
              {memberClubs.length === 0 ? (
                <p className="empty-state">You are not a member of any clubs yet.</p>
              ) : null}
              {memberClubs.map((club) => (
                <button
                  key={club.id}
                  type="button"
                  className={`club-list-row ${isDrawerOpen && selectedClubId === club.id ? 'selected' : ''}`.trim()}
                  onClick={() => openDrawer(club.id)}
                >
                  <span className="club-list-main">
                    <strong>{club.name}</strong>
                    <span>{club.summary}</span>
                  </span>
                  <span className="club-list-meta">
                    <span>{club.category}</span>
                    <span>{club.leader}</span>
                  </span>
                </button>
              ))}
            </div>
          </SectionCard>
        ) : (
          <>
            <section className="search-row">
              <input
                className="search-input"
                placeholder="Search clubs by name, category, or leader..."
                value={searchQuery}
                onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
              />
            </section>

            <div className="filter-chips">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`filter-chip ${categoryFilter === category ? 'active' : ''}`.trim()}
                  onClick={() => dispatch({ type: 'SET_CATEGORY', payload: category })}
                >
                  {category}
                </button>
              ))}
            </div>

            <SectionCard
              title="Join clubs"
              subtitle={`${joinableClubs.length} club${joinableClubs.length === 1 ? '' : 's'} available`}
            >
              <div className="directory-grid member-join-grid">
                {joinableClubs.length === 0 ? <p className="empty-state">No clubs available to join right now.</p> : null}
                {joinableClubs.map((club) => {
                  const isPending = pendingClubIds.includes(club.id);
                  const isSelected = isDrawerOpen && selectedClubId === club.id;

                  return (
                    <article
                      key={club.id}
                      className={`directory-card ${isSelected ? 'selected' : ''}`.trim()}
                      style={{ cursor: 'pointer' }}
                      onClick={() => openDrawer(club.id)}
                    >
                      <div className="directory-card-top">
                        <span className="directory-category">{club.category}</span>
                      </div>
                      <h4>{club.name}</h4>
                      <p>{club.summary}</p>
                      <div className="directory-card-meta">
                        <span>{club.leader}</span>
                      </div>
                      <button
                        type="button"
                        className={`primary-button ${isPending ? 'is-muted' : ''}`.trim()}
                        disabled={isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          requestMembershipRecord(club.id);
                        }}
                      >
                        {isPending ? 'Request pending' : 'Request to join'}
                      </button>
                    </article>
                  );
                })}
              </div>
            </SectionCard>
          </>
        )}

        {isDrawerOpen ? (
          <ClubDrawer
            key={selectedClub?.id}
            selectedClub={selectedClub}
            clubDetailTab={clubDetailTab}
            announcements={announcements}
            events={events}
            onClose={closeDrawer}
            onLeave={memberView === 'my-clubs' ? handleLeaveClub : undefined}
            isSaving={clubsSaving}
          />
        ) : null}
      </div>
    );
  }

  // ── Club Leader ────────────────────────────────────────────────────────────
  return (
    <div className="page-stack">
      <section className="search-row">
        <input
          className="search-input"
          placeholder="Search clubs by name, category, or leader..."
          value={searchQuery}
          onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
        />
      </section>

      <div className="filter-chips">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`filter-chip ${categoryFilter === category ? 'active' : ''}`.trim()}
            onClick={() => dispatch({ type: 'SET_CATEGORY', payload: category })}
          >
            {category}
          </button>
        ))}
      </div>

      <SectionCard
        className="club-list-card"
        title="Club directory"
        subtitle={`${filteredClubs.length} club${filteredClubs.length === 1 ? '' : 's'} shown`}
      >
        <div className="club-list">
          {filteredClubs.length === 0 ? <p className="empty-state">No clubs match the current filters.</p> : null}
          {filteredClubs.map((club) => (
            <button
              key={club.id}
              type="button"
              className={`club-list-row ${isDrawerOpen && selectedClubId === club.id ? 'selected' : ''}`.trim()}
              onClick={() => openDrawer(club.id)}
            >
              <span className="club-list-main">
                <strong>{club.name}</strong>
                <span>{club.summary}</span>
              </span>
              <span className="club-list-meta">
                <span>{club.category}</span>
                <span>{club.leader}</span>
              </span>
            </button>
          ))}
        </div>
      </SectionCard>

      {isDrawerOpen ? (
        <ClubDrawer
          key={selectedClub?.id}
          selectedClub={selectedClub}
          clubDetailTab={clubDetailTab}
          announcements={announcements}
          events={events}
          onClose={closeDrawer}
        />
      ) : null}
    </div>
  );
});
