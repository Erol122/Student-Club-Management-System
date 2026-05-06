import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { useMsal } from '@azure/msal-react';
import { createClub, deleteClub, fetchClubs, updateClub } from '../services/clubApi';
import {
  approveClubCreationRequest,
  fetchAllClubCreationRequests,
  fetchMyClubCreationRequests,
  rejectClubCreationRequest,
  submitClubCreationRequest,
} from '../services/clubCreationRequestApi';

const fmtDate = (ts) =>
  new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(ts)
  );

const STATUS_LABELS = {
  1: 'Draft',
  2: 'Active',
  3: 'Archived',
  Draft: 'Draft',
  Active: 'Active',
  Archived: 'Archived',
};

const STATUS_VALUES = {
  Draft: 1,
  Active: 2,
  Archived: 3,
};

const DEFAULT_ACCENT = '#5b8def';
const DEFAULT_GROUP_PLATFORM = 'WhatsApp';
const DEFAULT_NEXT_EVENT = 'No event scheduled';
const DEFAULT_LEADER = 'Club admin';

function logEntry(message, type = 'info') {
  return {
    id: `al-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    message,
    ts: Date.now(),
  };
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeClubStatus(status) {
  return STATUS_LABELS[status] ?? 'Draft';
}

function getClubFallback(dto, existingClub) {
  return existingClub ?? null;
}

function mapApiClubToUi(dto, existingClub = null) {
  const fallback = getClubFallback(dto, existingClub);

  return {
    id: dto.id,
    name: dto.name,
    category: dto.category ?? fallback?.category ?? 'General',
    summary: dto.description ?? fallback?.summary ?? 'No description yet.',
    leader: dto.createdByUserDisplayName ?? fallback?.leader ?? DEFAULT_LEADER,
    leaderEmail: dto.createdByUserEmail ?? fallback?.leaderEmail ?? null,
    accent: fallback?.accent ?? DEFAULT_ACCENT,
    health: normalizeClubStatus(dto.status),
    nextEvent: fallback?.nextEvent ?? DEFAULT_NEXT_EVENT,
    groupPlatform: fallback?.groupPlatform ?? DEFAULT_GROUP_PLATFORM,
    groupLink: fallback?.groupLink ?? '',
    announcementsCount: fallback?.announcementsCount ?? 0,
    members: fallback?.members ?? [],
    slug: dto.slug,
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function mapApiProposalToUi(dto) {
  return {
    id: dto.id,
    name: dto.clubName,
    category: dto.clubCategory ?? 'General',
    proposedBy: dto.requestedByUserDisplayName,
    mission: dto.message ?? dto.clubDescription ?? '',
    status: dto.status,
  };
}

function mapUiClubToCreateRequest(draft) {
  return {
    name: draft.name.trim(),
    slug: slugify(draft.name),
    description: draft.summary.trim(),
    category: draft.category.trim(),
    status: STATUS_VALUES[draft.health] ?? STATUS_VALUES.Active,
  };
}

function mapUiClubToUpdateRequest(draft, currentClub) {
  return {
    name: draft.name.trim(),
    slug: slugify(draft.name),
    description: draft.summary.trim(),
    category: draft.category.trim(),
    status: STATUS_VALUES[draft.health] ?? STATUS_VALUES[currentClub?.health] ?? STATUS_VALUES.Active,
    createdByUserId: null,
  };
}

function buildFieldError(problemBody) {
  if (!problemBody || typeof problemBody !== 'object') {
    return 'Could not save the club.';
  }

  if (problemBody.errors && typeof problemBody.errors === 'object') {
    const messages = Object.values(problemBody.errors).flat().filter(Boolean);
    if (messages.length > 0) {
      return messages.join(' ');
    }
  }

  return problemBody.detail || problemBody.title || 'Could not save the club.';
}

function syncSelectedClubId(selectedClubId, clubs) {
  if (clubs.length === 0) return '';
  return clubs.some((club) => club.id === selectedClubId) ? selectedClubId : clubs[0].id;
}

const initialState = {
  currentUser: null,
  activeView: 'home',
  activeRole: 'Admin',
  selectedClubId: '',
  clubDetailTab: 'overview',
  clubs: [],
  clubsLoading: false,
  clubsSaving: false,
  clubsError: null,
  clubRequests: [],
  myProposals: [],
  proposalsSaving: false,
  membershipRequests: [],
  announcements: [],
  events: [],
  activityLog: [],
  searchQuery: '',
  categoryFilter: 'All',
  toast: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN': {
      const user = action.payload;
      return {
        ...state,
        currentUser: user,
        activeRole: user.role,
        activeView: 'home',
        selectedClubId: syncSelectedClubId(user.clubId ?? state.selectedClubId, state.clubs),
      };
    }

    case 'LOGOUT':
      return {
        ...state,
        currentUser: null,
        activeView: 'home',
        activeRole: 'Admin',
        selectedClubId: syncSelectedClubId('', state.clubs),
        clubRequests: [],
        myProposals: [],
        toast: null,
      };

    case 'NAVIGATE':
      return { ...state, activeView: action.payload };

    case 'SELECT_CLUB':
      return { ...state, selectedClubId: action.payload, clubDetailTab: 'overview' };

    case 'SET_CLUB_TAB':
      return { ...state, clubDetailTab: action.payload };

    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };

    case 'SET_CATEGORY':
      return { ...state, categoryFilter: action.payload };

    case 'DISMISS_TOAST':
      return { ...state, toast: null };

    case 'LOAD_CLUBS_START':
      return { ...state, clubsLoading: true, clubsError: null };

    case 'LOAD_CLUBS_SUCCESS': {
      const previousClubsById = new Map(state.clubs.map((club) => [club.id, club]));
      const clubs = action.payload.map((clubDto) =>
        mapApiClubToUi(clubDto, previousClubsById.get(clubDto.id) ?? null)
      );

      return {
        ...state,
        clubs,
        clubsLoading: false,
        clubsError: null,
        selectedClubId: syncSelectedClubId(state.selectedClubId, clubs),
      };
    }

    case 'LOAD_CLUBS_FAILURE':
      return {
        ...state,
        clubsLoading: false,
        clubsError: action.payload,
        toast: { message: action.payload, type: 'info' },
      };

    case 'SAVE_CLUB_START':
      return { ...state, clubsSaving: true, clubsError: null };

    case 'CREATE_CLUB_SUCCESS': {
      const newClub = mapApiClubToUi(action.payload);
      const clubs = [newClub, ...state.clubs];

      return {
        ...state,
        clubs,
        clubsSaving: false,
        selectedClubId: newClub.id,
        activityLog: [logEntry(`Club created: "${newClub.name}"`, 'club'), ...state.activityLog],
        toast: { message: `${newClub.name} created`, type: 'success' },
      };
    }

    case 'UPDATE_CLUB_SUCCESS': {
      const currentClub = state.clubs.find((club) => club.id === action.payload.id) ?? null;
      const updatedClub = mapApiClubToUi(action.payload, currentClub);

      return {
        ...state,
        clubs: state.clubs.map((club) => (club.id === updatedClub.id ? updatedClub : club)),
        clubsSaving: false,
        selectedClubId: state.selectedClubId === updatedClub.id ? updatedClub.id : state.selectedClubId,
        activityLog: [logEntry(`Club updated: "${updatedClub.name}"`, 'club'), ...state.activityLog],
        toast: { message: `${updatedClub.name} updated`, type: 'success' },
      };
    }

    case 'DELETE_CLUB_SUCCESS': {
      const deletedClub = state.clubs.find((club) => club.id === action.payload);
      const clubs = state.clubs.filter((club) => club.id !== action.payload);

      return {
        ...state,
        clubs,
        clubsSaving: false,
        selectedClubId: syncSelectedClubId(
          state.selectedClubId === action.payload ? '' : state.selectedClubId,
          clubs
        ),
        announcements: state.announcements.filter((item) => item.clubId !== action.payload),
        events: state.events.filter((item) => item.clubId !== action.payload),
        membershipRequests: state.membershipRequests.filter((req) => req.clubId !== action.payload),
        activityLog: deletedClub
          ? [logEntry(`Club deleted: "${deletedClub.name}"`, 'club'), ...state.activityLog]
          : state.activityLog,
        toast: {
          message: deletedClub ? `${deletedClub.name} deleted` : 'Club deleted',
          type: 'info',
        },
      };
    }

    case 'SAVE_CLUB_FAILURE':
      return {
        ...state,
        clubsSaving: false,
        clubsError: action.payload,
        toast: { message: action.payload, type: 'info' },
      };

    case 'LOAD_PROPOSALS_SUCCESS':
      return { ...state, clubRequests: action.payload };

    case 'LOAD_MY_PROPOSALS_SUCCESS':
      return { ...state, myProposals: action.payload };

    case 'PROPOSAL_SAVING':
      return { ...state, proposalsSaving: action.payload };

    case 'SUBMIT_PROPOSAL_SUCCESS': {
      const proposal = action.payload;
      return {
        ...state,
        proposalsSaving: false,
        myProposals: [proposal, ...state.myProposals],
        activityLog: [logEntry(`Club proposal submitted: "${proposal.name}"`, 'club'), ...state.activityLog],
        toast: { message: `"${proposal.name}" sent to admin for review`, type: 'success' },
      };
    }

    case 'SUBMIT_PROPOSAL_FAILURE':
      return {
        ...state,
        proposalsSaving: false,
        toast: { message: action.payload, type: 'info' },
      };

    case 'APPROVE_PROPOSAL_SUCCESS': {
      const req = state.clubRequests.find((r) => r.id === action.payload);
      return {
        ...state,
        proposalsSaving: false,
        clubRequests: state.clubRequests.filter((r) => r.id !== action.payload),
        activityLog: [logEntry(`Club approved: "${req?.name}"`, 'club'), ...state.activityLog],
        toast: { message: `${req?.name ?? 'Club'} approved`, type: 'success' },
      };
    }

    case 'REJECT_PROPOSAL_SUCCESS': {
      const req = state.clubRequests.find((r) => r.id === action.payload);
      return {
        ...state,
        proposalsSaving: false,
        clubRequests: state.clubRequests.filter((r) => r.id !== action.payload),
        activityLog: [logEntry(`Club proposal rejected: "${req?.name}"`, 'info'), ...state.activityLog],
        toast: { message: 'Club proposal rejected', type: 'info' },
      };
    }

    case 'PROPOSAL_ACTION_FAILURE':
      return {
        ...state,
        proposalsSaving: false,
        toast: { message: action.payload, type: 'info' },
      };

    case 'REQUEST_MEMBERSHIP': {
      const userName = state.currentUser?.name;
      const club = state.clubs.find((c) => c.id === action.payload);
      const alreadyPending = state.membershipRequests.some(
        (r) => r.clubId === action.payload && r.student === userName
      );
      const isMember = club?.members.some((m) => m.name === userName);
      if (alreadyPending || isMember) return state;
      const req = {
        id: `mr-${Date.now()}`,
        clubId: action.payload,
        student: userName,
        program: state.currentUser?.program ?? 'Student',
        reason: 'Interested in contributing to workshops and weekly activities.',
      };
      return {
        ...state,
        membershipRequests: [req, ...state.membershipRequests],
        toast: { message: `Request sent to ${club?.name}`, type: 'success' },
      };
    }

    case 'APPROVE_MEMBERSHIP': {
      const req = state.membershipRequests.find((r) => r.id === action.payload);
      if (!req) return state;
      const club = state.clubs.find((c) => c.id === req.clubId);
      return {
        ...state,
        clubs: state.clubs.map((c) =>
          c.id === req.clubId
            ? {
                ...c,
                members: [
                  ...c.members,
                  { id: `${req.id}-m`, name: req.student, role: 'Member', program: req.program },
                ],
              }
            : c
        ),
        membershipRequests: state.membershipRequests.filter((r) => r.id !== action.payload),
        activityLog: [
          logEntry(`${req.student} approved into ${club?.name}`, 'member'),
          ...state.activityLog,
        ],
        toast: { message: `${req.student} is now a member of ${club?.name}`, type: 'success' },
      };
    }

    case 'DECLINE_MEMBERSHIP': {
      const req = state.membershipRequests.find((r) => r.id === action.payload);
      return {
        ...state,
        membershipRequests: state.membershipRequests.filter((r) => r.id !== action.payload),
        toast: { message: `${req?.student}'s request declined`, type: 'info' },
      };
    }

    case 'PUBLISH_ANNOUNCEMENT': {
      const ann = {
        id: `ann-${Date.now()}`,
        clubId: action.payload.clubId,
        title: action.payload.title,
        body: action.payload.body,
        audience: action.payload.audience,
        author: action.payload.author,
        date: fmtDate(Date.now()),
        ts: Date.now(),
      };
      return {
        ...state,
        announcements: [ann, ...state.announcements],
        activityLog: [
          logEntry(`Announcement published: "${ann.title}"`, 'announcement'),
          ...state.activityLog,
        ],
        toast: { message: 'Announcement published to members', type: 'success' },
      };
    }

    case 'SCHEDULE_EVENT': {
      const evt = {
        id: `evt-${Date.now()}`,
        clubId: action.payload.clubId,
        title: action.payload.title,
        date: action.payload.date,
        location: action.payload.location,
        rsvp: [],
      };
      return {
        ...state,
        events: [evt, ...state.events],
        activityLog: [
          logEntry(`Event scheduled: "${evt.title}" on ${evt.date}`, 'event'),
          ...state.activityLog,
        ],
        toast: { message: `"${evt.title}" added to the calendar`, type: 'success' },
      };
    }

    case 'RSVP_EVENT': {
      const userName = state.currentUser?.name;
      return {
        ...state,
        events: state.events.map((evt) =>
          evt.id === action.payload.eventId
            ? {
                ...evt,
                rsvp: evt.rsvp.includes(userName)
                  ? evt.rsvp.filter((n) => n !== userName)
                  : [...evt.rsvp, userName],
              }
            : evt
        ),
      };
    }

    case 'UPDATE_ROLE': {
      return {
        ...state,
        clubs: state.clubs.map((club) =>
          club.id === action.payload.clubId
            ? {
                ...club,
                members: club.members.map((m) =>
                  m.id === action.payload.memberId ? { ...m, role: action.payload.role } : m
                ),
              }
            : club
        ),
        toast: { message: `Role updated to ${action.payload.role}`, type: 'success' },
      };
    }

    default:
      return state;
  }
}

const StateCtx = createContext(null);
const DispatchCtx = createContext(null);
const AuthCtx = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { instance, accounts } = useMsal();
  const activeAccount = useMemo(
    () => instance.getActiveAccount() ?? accounts[0] ?? null,
    [accounts, instance]
  );

  // Load clubs whenever auth is available
  useEffect(() => {
    if (!activeAccount) return;
    let ignore = false;

    async function load() {
      dispatch({ type: 'LOAD_CLUBS_START' });
      try {
        const clubs = await fetchClubs({ instance, account: activeAccount });
        if (!ignore) dispatch({ type: 'LOAD_CLUBS_SUCCESS', payload: clubs });
      } catch (error) {
        if (!ignore) {
          dispatch({
            type: 'LOAD_CLUBS_FAILURE',
            payload: `Could not load clubs from the backend. ${error.message}`,
          });
        }
      }
    }

    load();
    return () => { ignore = true; };
  }, [activeAccount, instance]);

  // Load proposals based on role whenever user changes
  useEffect(() => {
    if (!activeAccount || !state.currentUser) return;
    let ignore = false;

    async function loadProposals() {
      try {
        if (state.activeRole === 'Admin') {
          // Admin sees all pending proposals
          const all = await fetchAllClubCreationRequests({ instance, account: activeAccount, status: 1 });
          if (!ignore) dispatch({ type: 'LOAD_PROPOSALS_SUCCESS', payload: all.map(mapApiProposalToUi) });
        } else {
          // Members see their own proposals
          const mine = await fetchMyClubCreationRequests({ instance, account: activeAccount });
          if (!ignore) dispatch({ type: 'LOAD_MY_PROPOSALS_SUCCESS', payload: mine.map(mapApiProposalToUi) });
        }
      } catch {
        // silently fail — state keeps previous data
      }
    }

    loadProposals();
    return () => { ignore = true; };
  }, [activeAccount, instance, state.currentUser?.id, state.activeRole]);

  useEffect(() => {
    if (!state.toast) return;
    const id = setTimeout(() => dispatch({ type: 'DISMISS_TOAST' }), 3200);
    return () => clearTimeout(id);
  }, [state.toast]);

  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>
        <AuthCtx.Provider value={{ instance, account: activeAccount }}>
          {children}
        </AuthCtx.Provider>
      </DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useAppState() {
  return useContext(StateCtx);
}

export function useAppDispatch() {
  return useContext(DispatchCtx);
}

function useAuth() {
  return useContext(AuthCtx);
}

export function useClubActions() {
  const dispatch = useAppDispatch();
  const { clubs } = useAppState();
  const { instance, account } = useAuth();

  return {
    async reloadClubs() {
      dispatch({ type: 'LOAD_CLUBS_START' });
      try {
        const clubList = await fetchClubs({ instance, account });
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
        const savedClub = await createClub({ instance, account, payload: mapUiClubToCreateRequest(draft) });
        dispatch({ type: 'CREATE_CLUB_SUCCESS', payload: savedClub });
        return true;
      } catch (error) {
        dispatch({
          type: 'SAVE_CLUB_FAILURE',
          payload: buildFieldError(error.body) || error.message,
        });
        return false;
      }
    },

    async updateClubRecord(id, draft) {
      dispatch({ type: 'SAVE_CLUB_START' });
      try {
        const currentClub = clubs.find((club) => club.id === id) ?? null;
        const savedClub = await updateClub({ instance, account, id, payload: mapUiClubToUpdateRequest(draft, currentClub) });
        dispatch({ type: 'UPDATE_CLUB_SUCCESS', payload: savedClub });
        return true;
      } catch (error) {
        dispatch({
          type: 'SAVE_CLUB_FAILURE',
          payload: buildFieldError(error.body) || error.message,
        });
        return false;
      }
    },

    async deleteClubRecord(id) {
      dispatch({ type: 'SAVE_CLUB_START' });
      try {
        await deleteClub({ instance, account, id });
        dispatch({ type: 'DELETE_CLUB_SUCCESS', payload: id });
        return true;
      } catch (error) {
        dispatch({
          type: 'SAVE_CLUB_FAILURE',
          payload: buildFieldError(error.body) || error.message,
        });
        return false;
      }
    },
  };
}

export function useClubCreationRequestActions() {
  const dispatch = useAppDispatch();
  const { instance, account } = useAuth();

  return {
    async submitProposal(draft) {
      dispatch({ type: 'PROPOSAL_SAVING', payload: true });
      try {
        const dto = await submitClubCreationRequest({
          instance,
          account,
          payload: {
            clubName: draft.name?.trim(),
            clubDescription: draft.mission?.trim() || null,
            clubCategory: draft.category?.trim() || null,
            message: draft.mission?.trim() || null,
          },
        });
        dispatch({ type: 'SUBMIT_PROPOSAL_SUCCESS', payload: mapApiProposalToUi(dto) });
        return true;
      } catch (error) {
        dispatch({
          type: 'SUBMIT_PROPOSAL_FAILURE',
          payload: error.body?.detail || error.message || 'Could not submit proposal.',
        });
        return false;
      }
    },

    async approveProposal(requestId) {
      dispatch({ type: 'PROPOSAL_SAVING', payload: true });
      try {
        await approveClubCreationRequest({ instance, account, requestId, reviewNote: null });
        dispatch({ type: 'APPROVE_PROPOSAL_SUCCESS', payload: requestId });
        return true;
      } catch (error) {
        dispatch({
          type: 'PROPOSAL_ACTION_FAILURE',
          payload: error.body?.detail || error.message || 'Could not approve proposal.',
        });
        return false;
      }
    },

    async rejectProposal(requestId) {
      dispatch({ type: 'PROPOSAL_SAVING', payload: true });
      try {
        await rejectClubCreationRequest({ instance, account, requestId, reviewNote: null });
        dispatch({ type: 'REJECT_PROPOSAL_SUCCESS', payload: requestId });
        return true;
      } catch (error) {
        dispatch({
          type: 'PROPOSAL_ACTION_FAILURE',
          payload: error.body?.detail || error.message || 'Could not reject proposal.',
        });
        return false;
      }
    },

    async reloadProposals(role) {
      try {
        if (role === 'Admin') {
          const all = await fetchAllClubCreationRequests({ instance, account, status: 1 });
          dispatch({ type: 'LOAD_PROPOSALS_SUCCESS', payload: all.map(mapApiProposalToUi) });
        } else {
          const mine = await fetchMyClubCreationRequests({ instance, account });
          dispatch({ type: 'LOAD_MY_PROPOSALS_SUCCESS', payload: mine.map(mapApiProposalToUi) });
        }
      } catch {
        // silently fail
      }
    },
  };
}
