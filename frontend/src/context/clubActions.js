import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMsal } from '@azure/msal-react';
import {
  approveClubProposal,
  approveJoinRequest,
  createAnnouncement,
  createClub,
  createEvent,
  deleteClub,
  fetchAnnouncements,
  fetchClubProposals,
  fetchClubs,
  fetchEvents,
  fetchJoinRequests,
  leaveClub,
  rejectClubProposal,
  rejectJoinRequest,
  submitClubProposal,
  submitJoinRequest,
  updateClub,
} from '../services/clubApi';
import {
  buildFieldError,
  mapUiAnnouncementToRequest,
  mapUiClubToCreateRequest,
  mapUiClubToUpdateRequest,
  mapUiEventToRequest,
  mapUiProposalToRequest,
} from './appMappers';
import { useAppDispatch, useAppState } from './AppContext';

// ── localStorage helpers for member proposal persistence ──────────────────
function storageKey(userId) {
  return `scms_proposals_${userId}`;
}
function getStoredProposals(userId) {
  if (!userId) return [];
  try { return JSON.parse(localStorage.getItem(storageKey(userId)) ?? '[]'); }
  catch { return []; }
}
function saveStoredProposals(userId, proposals) {
  if (!userId) return;
  try { localStorage.setItem(storageKey(userId), JSON.stringify(proposals)); }
  catch {}
}
function addStoredProposal(userId, dto) {
  const current = getStoredProposals(userId);
  saveStoredProposals(userId, [dto, ...current.filter(p => p.id !== dto.id)]);
}
// ─────────────────────────────────────────────────────────────────────────

export function useClubActions() {
  const dispatch = useAppDispatch();
  const { clubs, currentUser } = useAppState();
  const { instance, accounts } = useMsal();
  const clubsRef = useRef(clubs);
  const currentUserRef = useRef(currentUser);

  useEffect(() => { clubsRef.current = clubs; }, [clubs]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  const getAuth = useCallback(() => {
    const account = instance.getActiveAccount() ?? accounts[0];
    if (!account) {
      throw new Error('You need to sign in before using club actions.');
    }
    return { instance, account };
  }, [accounts, instance]);

  return useMemo(() => ({
    async reloadWorkspace() {
      dispatch({ type: 'LOAD_CLUBS_START' });

      try {
        const auth = getAuth();
        const userId = currentUserRef.current?.id;

        // Fetch clubs first — critical data, must succeed
        const clubList = await fetchClubs(auth);
        dispatch({ type: 'LOAD_CLUBS_SUCCESS', payload: clubList });

        // Proposals endpoint may be admin-only — don't let it crash everything
        let clubRequests = [];
        try {
          clubRequests = await fetchClubProposals(auth);
        } catch (_) {
          // Restricted for non-admin users — fall through to localStorage below
        }

        // Merge locally stored member proposals (survive page refresh)
        const stored = getStoredProposals(userId);
        if (stored.length > 0) {
          // Remove proposals whose club is now live (admin approved them)
          const liveNames = new Set(clubList.map(c => (c.name ?? '').toLowerCase()));
          const stillPending = stored.filter(p => !liveNames.has((p.name ?? '').toLowerCase()));
          if (stillPending.length !== stored.length) saveStoredProposals(userId, stillPending);

          const apiIds = new Set(clubRequests.map(r => r.id));
          clubRequests = [...clubRequests, ...stillPending.filter(p => !apiIds.has(p.id))];
        }

        // Fetch remaining data — each failure handled individually
        const [membershipRequests, announcements, events] = await Promise.all([
          fetchJoinRequests(auth),
          fetchAnnouncements(auth),
          fetchEvents(auth),
        ]);

        dispatch({ type: 'LOAD_WORKFLOW_SUCCESS', payload: { clubRequests, membershipRequests } });
        dispatch({ type: 'LOAD_CONTENT_SUCCESS', payload: { announcements, events } });
      } catch (error) {
        dispatch({
          type: 'LOAD_CLUBS_FAILURE',
          payload: `Could not load clubs from the backend. ${error.message}`,
        });
      }
    },

    async reloadClubs() {
      dispatch({ type: 'LOAD_CLUBS_START' });
      try {
        const clubList = await fetchClubs(getAuth());
        dispatch({ type: 'LOAD_CLUBS_SUCCESS', payload: clubList });
      } catch (error) {
        dispatch({
          type: 'LOAD_CLUBS_FAILURE',
          payload: `Could not load clubs from the backend. ${error.message}`,
        });
      }
    },

    async createClubRecord(draft) {
      dispatch({ type: 'SAVE_CLUB_START' });
      try {
        const savedClub = await createClub(getAuth(), mapUiClubToCreateRequest(draft));
        dispatch({ type: 'CREATE_CLUB_SUCCESS', payload: savedClub });
        return true;
      } catch (error) {
        dispatch({ type: 'SAVE_CLUB_FAILURE', payload: buildFieldError(error.body) || error.message });
        return false;
      }
    },

    async updateClubRecord(id, draft) {
      dispatch({ type: 'SAVE_CLUB_START' });
      try {
        const currentClub = clubsRef.current.find((club) => club.id === id) ?? null;
        const savedClub = await updateClub(getAuth(), id, mapUiClubToUpdateRequest(draft, currentClub));
        dispatch({ type: 'UPDATE_CLUB_SUCCESS', payload: savedClub });
        return true;
      } catch (error) {
        dispatch({ type: 'SAVE_CLUB_FAILURE', payload: buildFieldError(error.body) || error.message });
        return false;
      }
    },

    async deleteClubRecord(id) {
      dispatch({ type: 'SAVE_CLUB_START' });
      try {
        await deleteClub(getAuth(), id);
        dispatch({ type: 'DELETE_CLUB_SUCCESS', payload: id });
        return true;
      } catch (error) {
        dispatch({ type: 'SAVE_CLUB_FAILURE', payload: buildFieldError(error.body) || error.message });
        return false;
      }
    },

    async submitClubProposalRecord(draft) {
      dispatch({ type: 'SAVE_CLUB_START' });
      try {
        const proposal = await submitClubProposal(getAuth(), mapUiProposalToRequest(draft));
        // Persist so it survives page refresh for members (endpoint is admin-only)
        addStoredProposal(currentUserRef.current?.id, proposal);
        dispatch({ type: 'SUBMIT_CLUB_REQUEST', payload: proposal });
        return true;
      } catch (error) {
        dispatch({ type: 'SAVE_CLUB_FAILURE', payload: buildFieldError(error.body) || error.message });
        return false;
      }
    },

    async approveClubProposalRecord(id) {
      dispatch({ type: 'SAVE_CLUB_START' });
      try {
        await approveClubProposal(getAuth(), id);
        dispatch({ type: 'APPROVE_CLUB', payload: id });
        const clubList = await fetchClubs(getAuth());
        dispatch({ type: 'LOAD_CLUBS_SUCCESS', payload: clubList });
        return true;
      } catch (error) {
        dispatch({ type: 'SAVE_CLUB_FAILURE', payload: buildFieldError(error.body) || error.message });
        return false;
      }
    },

    async rejectClubProposalRecord(id) {
      dispatch({ type: 'SAVE_CLUB_START' });
      try {
        await rejectClubProposal(getAuth(), id);
        dispatch({ type: 'REJECT_CLUB', payload: id });
        return true;
      } catch (error) {
        dispatch({ type: 'SAVE_CLUB_FAILURE', payload: buildFieldError(error.body) || error.message });
        return false;
      }
    },

    async requestMembershipRecord(clubId) {
      dispatch({ type: 'SAVE_CLUB_START' });
      try {
        const request = await submitJoinRequest(
          getAuth(),
          clubId,
          'Interested in contributing to workshops and weekly activities.'
        );
        dispatch({ type: 'REQUEST_MEMBERSHIP', payload: clubId, meta: request });
        return true;
      } catch (error) {
        dispatch({ type: 'SAVE_CLUB_FAILURE', payload: buildFieldError(error.body) || error.message });
        return false;
      }
    },

    async leaveClubRecord(clubId) {
      dispatch({ type: 'SAVE_CLUB_START' });
      try {
        await leaveClub(getAuth(), clubId);
        const clubList = await fetchClubs(getAuth());
        dispatch({ type: 'LOAD_CLUBS_SUCCESS', payload: clubList });
        return true;
      } catch (error) {
        dispatch({ type: 'SAVE_CLUB_FAILURE', payload: buildFieldError(error.body) || error.message });
        return false;
      }
    },

    async publishAnnouncementRecord(clubId, draft) {
      dispatch({ type: 'SAVE_CLUB_START' });
      try {
        const announcement = await createAnnouncement(getAuth(), clubId, mapUiAnnouncementToRequest(draft));
        dispatch({ type: 'PUBLISH_ANNOUNCEMENT_SUCCESS', payload: announcement });
        return true;
      } catch (error) {
        dispatch({ type: 'SAVE_CLUB_FAILURE', payload: buildFieldError(error.body) || error.message });
        return false;
      }
    },

    async scheduleEventRecord(clubId, draft) {
      dispatch({ type: 'SAVE_CLUB_START' });
      try {
        const event = await createEvent(getAuth(), clubId, mapUiEventToRequest(draft));
        dispatch({ type: 'SCHEDULE_EVENT_SUCCESS', payload: event });
        return true;
      } catch (error) {
        dispatch({ type: 'SAVE_CLUB_FAILURE', payload: buildFieldError(error.body) || error.message });
        return false;
      }
    },

    async approveMembershipRecord(id) {
      dispatch({ type: 'SAVE_CLUB_START' });
      try {
        await approveJoinRequest(getAuth(), id);
        dispatch({ type: 'APPROVE_MEMBERSHIP', payload: id });
        const clubList = await fetchClubs(getAuth());
        dispatch({ type: 'LOAD_CLUBS_SUCCESS', payload: clubList });
        return true;
      } catch (error) {
        dispatch({ type: 'SAVE_CLUB_FAILURE', payload: buildFieldError(error.body) || error.message });
        return false;
      }
    },

    async rejectMembershipRecord(id) {
      dispatch({ type: 'SAVE_CLUB_START' });
      try {
        await rejectJoinRequest(getAuth(), id);
        dispatch({ type: 'DECLINE_MEMBERSHIP', payload: id });
        return true;
      } catch (error) {
        dispatch({ type: 'SAVE_CLUB_FAILURE', payload: buildFieldError(error.body) || error.message });
        return false;
      }
    },
  }), [dispatch, getAuth]);
}
