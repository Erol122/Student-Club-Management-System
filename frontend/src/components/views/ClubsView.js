import { memo, useCallback, useMemo, useState } from 'react';
import { useAppDispatch, useAppState } from '../../context/AppContext';
import { useClubActions } from '../../context/clubActions';
import { APP_ROLES } from '../../domain/roles';
import { CLUB_CATEGORY_OPTIONS } from '../../data/clubCategories';
import { clubProposalImageByKey } from '../../data/clubProposalImages';
import { ClubThumbnail } from '../common/ClubMedia';
import { SectionCard } from '../common/SectionCard';
import { ClubDrawer } from '../common/ClubDrawer';

function FilterBar({ searchQuery, categoryFilter, categories, sortBy, onSearch, onCategory, onSort }) {
  return (
    <div className="filter-sort-bar">
      <input
        className="search-input"
        placeholder="Search clubs..."
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
      />
      <select
        className="filter-select"
        value={categoryFilter}
        onChange={(e) => onCategory(e.target.value)}
        aria-label="Filter by category"
      >
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat === 'All' ? 'All categories' : cat}</option>
        ))}
      </select>
      <select
        className="filter-select"
        value={sortBy}
        onChange={(e) => onSort(e.target.value)}
        aria-label="Sort clubs"
      >
        <option value="name">Name A–Z</option>
        <option value="members">Most members</option>
        <option value="created">Recently created</option>
      </select>
    </div>
  );
}

const formatSubmittedDate = (value) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

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
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const categories = useMemo(() => {
    const customCategories = clubs
      .map((club) => club.category)
      .filter((category) => category && !CLUB_CATEGORY_OPTIONS.includes(category));

    return ['All', ...CLUB_CATEGORY_OPTIONS, ...new Set(customCategories)];
  }, [clubs]);

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
    return [...result].sort((a, b) => {
      if (sortBy === 'members') return b.members.length - a.members.length;
      if (sortBy === 'created') return new Date(b.createdAt) - new Date(a.createdAt);
      return a.name.localeCompare(b.name);
    });
  }, [categoryFilter, searchQuery, sortBy]);

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

  const closeProposalModal = useCallback(() => setSelectedProposal(null), []);

  const handleApproveProposal = useCallback(async (proposalId) => {
    const approved = await approveClubProposalRecord(proposalId);
    if (approved) closeProposalModal();
  }, [approveClubProposalRecord, closeProposalModal]);

  const handleRejectProposal = useCallback(async (proposalId) => {
    const rejected = await rejectClubProposalRecord(proposalId);
    if (rejected) closeProposalModal();
  }, [rejectClubProposalRecord, closeProposalModal]);

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
              {clubRequests.map((req) => {
                const proposalImage = clubProposalImageByKey.get(req.imageKey);

                return (
                  <article key={req.id} className="proposal-admin-card">
                    <button
                      type="button"
                      className="proposal-summary-button"
                      onClick={() => setSelectedProposal(req)}
                      aria-label={`View ${req.name} proposal details`}
                    >
                      {proposalImage ? (
                        <img className="proposal-row-image" src={proposalImage.src} alt="" loading="lazy" />
                      ) : null}
                      <span className="proposal-row-copy">
                        <strong>{req.name}</strong>
                        <p className="proposal-row-meta">{req.category}</p>
                        {req.mission ? <p className="proposal-row-mission">{req.mission}</p> : null}
                      </span>
                    </button>
                    <div className="inline-actions proposal-admin-actions">
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => handleRejectProposal(req.id)}
                        disabled={clubsSaving}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => handleApproveProposal(req.id)}
                        disabled={clubsSaving}
                      >
                        Approve
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </SectionCard>
        ) : null}

        <FilterBar
          searchQuery={searchQuery}
          categoryFilter={categoryFilter}
          categories={categories}
          sortBy={sortBy}
          onSearch={(v) => dispatch({ type: 'SET_SEARCH', payload: v })}
          onCategory={(v) => dispatch({ type: 'SET_CATEGORY', payload: v })}
          onSort={setSortBy}
        />

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
                <ClubThumbnail imageKey={club.imageKey} name={club.name} />
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

        {selectedProposal ? (
          <ProposalDetailsModal
            proposal={selectedProposal}
            isSaving={clubsSaving}
            onClose={closeProposalModal}
            onApprove={handleApproveProposal}
            onReject={handleRejectProposal}
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
                  <ClubThumbnail imageKey={club.imageKey} name={club.name} />
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
            <FilterBar
              searchQuery={searchQuery}
              categoryFilter={categoryFilter}
              categories={categories}
              sortBy={sortBy}
              onSearch={(v) => dispatch({ type: 'SET_SEARCH', payload: v })}
              onCategory={(v) => dispatch({ type: 'SET_CATEGORY', payload: v })}
              onSort={setSortBy}
            />

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
                      <ClubThumbnail imageKey={club.imageKey} name={club.name} className="directory-card-image" />
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

  // ── Club Leader — same browse/join experience as members ──────────────────
  const showMyClubsLeader = memberView === 'my-clubs';
  return (
    <div className="page-stack">
      <div className="club-view-tabs">
        <button
          type="button"
          className={`tab-btn ${showMyClubsLeader ? 'active' : ''}`.trim()}
          onClick={() => setMemberView('my-clubs')}
        >
          My clubs
        </button>
        <button
          type="button"
          className={`tab-btn ${!showMyClubsLeader ? 'active' : ''}`.trim()}
          onClick={() => setMemberView('join-clubs')}
        >
          Join clubs
        </button>
      </div>

      {showMyClubsLeader ? (
        <SectionCard
          title="My clubs"
          subtitle={`${memberClubs.length} club${memberClubs.length === 1 ? '' : 's'} you belong to`}
        >
          <div className="directory-grid">
            {memberClubs.length === 0 ? (
              <p className="empty-state">You are not a member of any clubs yet.</p>
            ) : null}
            {memberClubs.map((club) => (
              <article key={club.id} className="directory-card">
                <ClubThumbnail imageKey={club.imageKey} name={club.name} className="directory-card-image" />
                <div className="directory-card-top">
                  <span className="directory-category">{club.category}</span>
                </div>
                <h4>{club.name}</h4>
                <p>{club.summary}</p>
                <div className="directory-card-meta">
                  <span>{club.leader}</span>
                  <span>{club.members.length} members</span>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      ) : (
        <>
          <FilterBar
            searchQuery={searchQuery}
            categoryFilter={categoryFilter}
            categories={categories}
            sortBy={sortBy}
            onSearch={(v) => dispatch({ type: 'SET_SEARCH', payload: v })}
            onCategory={(v) => dispatch({ type: 'SET_CATEGORY', payload: v })}
            onSort={setSortBy}
          />
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
                    <ClubThumbnail imageKey={club.imageKey} name={club.name} className="directory-card-image" />
                    <div className="directory-card-top">
                      <span className="directory-category">{club.category}</span>
                    </div>
                    <h4>{club.name}</h4>
                    <p>{club.summary}</p>
                    <div className="directory-card-meta"><span>{club.leader}</span></div>
                    <button
                      type="button"
                      className={`primary-button ${isPending ? 'is-muted' : ''}`.trim()}
                      disabled={isPending}
                      onClick={(e) => { e.stopPropagation(); requestMembershipRecord(club.id); }}
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

    </div>
  );
});

function ProposalDetailsModal({ proposal, isSaving, onClose, onApprove, onReject }) {
  const studentName = proposal.proposedBy || proposal.student || 'Unknown student';
  const studentEmail = proposal.proposedByEmail || proposal.email || 'No email provided';
  const proposalImage = clubProposalImageByKey.get(proposal.imageKey);

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card proposal-modal-card" role="dialog" aria-modal="true" aria-labelledby="proposal-modal-title">
        {proposalImage ? (
          <img className="proposal-modal-image" src={proposalImage.src} alt="" loading="lazy" />
        ) : null}
        <div className="proposal-modal-header">
          <div>
            <p className="proposal-modal-kicker">Club proposal</p>
            <h3 className="modal-title" id="proposal-modal-title">{proposal.name}</h3>
          </div>
          <button type="button" className="modal-close-button" onClick={onClose} aria-label="Close proposal details">
            &times;
          </button>
        </div>

        <div className="proposal-modal-body">
          <div className="proposal-detail-grid">
            <div className="proposal-detail-item">
              <span>Submitted by</span>
              <strong>{studentName}</strong>
            </div>
            <div className="proposal-detail-item">
              <span>Email</span>
              <strong>{studentEmail}</strong>
            </div>
            <div className="proposal-detail-item">
              <span>Category</span>
              <strong>{proposal.category || 'General'}</strong>
            </div>
            <div className="proposal-detail-item">
              <span>Status</span>
              <strong>{proposal.status || 'Pending'}</strong>
            </div>
            <div className="proposal-detail-item proposal-detail-wide">
              <span>Submitted</span>
              <strong>{formatSubmittedDate(proposal.submittedAt)}</strong>
            </div>
          </div>

          <section className="proposal-mission-panel">
            <span>Mission</span>
            <p>{proposal.mission || 'No mission provided.'}</p>
          </section>
        </div>

        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={() => onReject(proposal.id)} disabled={isSaving}>
            Reject
          </button>
          <button type="button" className="primary-button" onClick={() => onApprove(proposal.id)} disabled={isSaving}>
            Approve
          </button>
        </div>
      </div>
    </>
  );
}
