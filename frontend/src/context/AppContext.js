import { createContext, useContext, useEffect, useReducer } from 'react';
import {
  initialAnnouncements,
  initialClubRequests,
  initialClubs,
  initialEvents,
  initialMembershipRequests,
} from '../data/mockData';

const fmtDate = (ts) =>
  new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(ts)
  );

function logEntry(message, type = 'info') {
  return { id: `al-${Date.now()}-${Math.random().toString(36).slice(2)}`, type, message, ts: Date.now() };
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqueClubId(name, existingClubs, currentId = null) {
  const base = slugify(name) || `club-${Date.now()}`;
  let candidate = base;
  let index = 2;

  while (existingClubs.some((club) => club.id !== currentId && club.id === candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  return candidate;
}

const NOW = Date.now();

const initialState = {
  currentUser: null,
  activeView: 'home',
  activeRole: 'Admin',
  selectedClubId: initialClubs[0]?.id ?? '',
  clubDetailTab: 'overview',
  clubs: initialClubs,
  clubRequests: initialClubRequests,
  membershipRequests: initialMembershipRequests,
  announcements: initialAnnouncements,
  events: initialEvents,
  activityLog: [
    { id: 'al-seed-1', type: 'event',        message: 'Policy Debate Night scheduled for Apr 16',      ts: NOW - 3_600_000 },
    { id: 'al-seed-2', type: 'member',       message: 'Arman requested to join Debate Society', ts: NOW - 7_200_000 },
    { id: 'al-seed-3', type: 'announcement', message: 'Public speaking workshop announcement published', ts: NOW - 14_400_000 },
    { id: 'al-seed-4', type: 'club',         message: 'Entrepreneurship Circle proposal submitted',     ts: NOW - 86_400_000 },
    { id: 'al-seed-5', type: 'member',       message: 'Tara requested to join Creative Media Lab', ts: NOW - 90_000_000 },
  ],
  searchQuery: '',
  categoryFilter: 'All',
  toast: null,
};

function reducer(state, action) {
  switch (action.type) {

    // ── Auth ──────────────────────────────────────────────────────
    case 'LOGIN': {
      const user = action.payload;
      return {
        ...initialState,
        currentUser: user,
        activeRole: user.role,
        selectedClubId: user.clubId ?? initialState.selectedClubId,
      };
    }

    case 'LOGOUT':
      return { ...initialState };

    // ── Navigation ────────────────────────────────────────────────
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

    // ── Club creation ──────────────────────────────────────────────
    case 'SUBMIT_CLUB_REQUEST': {
      const req = { id: `cr-${Date.now()}`, ...action.payload };
      return {
        ...state,
        clubRequests: [req, ...state.clubRequests],
        activityLog: [logEntry(`Club proposal submitted: "${req.name}"`, 'club'), ...state.activityLog],
        toast: { message: `"${req.name}" sent to admin for review`, type: 'success' },
      };
    }

    case 'APPROVE_CLUB': {
      const req = state.clubRequests.find((r) => r.id === action.payload);
      if (!req) return state;
      const clubId = uniqueClubId(req.name, state.clubs);
      const newClub = {
        id: clubId,
        name: req.name,
        category: req.category,
        summary: req.mission,
        leader: req.proposedBy,
        accent: '#5b8def',
        health: 'Growing',
        nextEvent: 'Planning session pending',
        groupPlatform: 'WhatsApp',
        groupLink: '',
        announcementsCount: 0,
        members: [
          { id: `${clubId}-leader`, name: req.proposedBy, role: 'Club Leader', program: 'Club Founder' },
        ],
      };
      return {
        ...state,
        clubs: [newClub, ...state.clubs],
        clubRequests: state.clubRequests.filter((r) => r.id !== action.payload),
        selectedClubId: newClub.id,
        activityLog: [logEntry(`Club approved: "${req.name}"`, 'club'), ...state.activityLog],
        toast: { message: `${req.name} is now live on the platform`, type: 'success' },
      };
    }

    case 'REJECT_CLUB': {
      const req = state.clubRequests.find((r) => r.id === action.payload);
      return {
        ...state,
        clubRequests: state.clubRequests.filter((r) => r.id !== action.payload),
        activityLog: [logEntry(`Club proposal rejected: "${req?.name}"`, 'info'), ...state.activityLog],
        toast: { message: 'Club proposal rejected', type: 'info' },
      };
    }

    case 'CREATE_CLUB': {
      const draft = action.payload;
      const clubId = uniqueClubId(draft.name, state.clubs);
      const newClub = {
        id: clubId,
        name: draft.name.trim(),
        category: draft.category.trim(),
        summary: draft.summary.trim(),
        leader: draft.leader.trim(),
        accent: '#5b8def',
        health: draft.health,
        nextEvent: draft.nextEvent.trim() || 'Planning session pending',
        groupPlatform: draft.groupPlatform.trim() || 'WhatsApp',
        groupLink: draft.groupLink.trim(),
        announcementsCount: 0,
        members: [
          {
            id: `${clubId}-leader`,
            name: draft.leader.trim(),
            role: 'Club Leader',
            program: 'Club Leadership',
          },
        ],
      };

      return {
        ...state,
        clubs: [newClub, ...state.clubs],
        selectedClubId: newClub.id,
        activityLog: [logEntry(`Club created: "${newClub.name}"`, 'club'), ...state.activityLog],
        toast: { message: `${newClub.name} created`, type: 'success' },
      };
    }

    case 'UPDATE_CLUB': {
      const draft = action.payload;
      const currentClub = state.clubs.find((club) => club.id === draft.id);
      if (!currentClub) return state;

      const nextId = uniqueClubId(draft.name, state.clubs, draft.id);
      const updatedClub = {
        ...currentClub,
        id: nextId,
        name: draft.name.trim(),
        category: draft.category.trim(),
        summary: draft.summary.trim(),
        leader: draft.leader.trim(),
        health: draft.health,
        nextEvent: draft.nextEvent.trim() || 'Planning session pending',
        groupPlatform: draft.groupPlatform.trim() || 'WhatsApp',
        groupLink: draft.groupLink.trim(),
        members: currentClub.members.map((member) =>
          member.id === `${currentClub.id}-leader` || member.role === 'Club Leader'
            ? { ...member, id: `${nextId}-leader`, name: draft.leader.trim() }
            : member
        ),
      };

      return {
        ...state,
        clubs: state.clubs.map((club) => (club.id === draft.id ? updatedClub : club)),
        selectedClubId: state.selectedClubId === draft.id ? nextId : state.selectedClubId,
        announcements: state.announcements.map((item) =>
          item.clubId === draft.id ? { ...item, clubId: nextId } : item
        ),
        events: state.events.map((item) =>
          item.clubId === draft.id ? { ...item, clubId: nextId } : item
        ),
        membershipRequests: state.membershipRequests.map((req) =>
          req.clubId === draft.id ? { ...req, clubId: nextId } : req
        ),
        activityLog: [logEntry(`Club updated: "${updatedClub.name}"`, 'club'), ...state.activityLog],
        toast: { message: `${updatedClub.name} updated`, type: 'success' },
      };
    }

    case 'DELETE_CLUB': {
      const club = state.clubs.find((item) => item.id === action.payload);
      if (!club) return state;
      const remainingClubs = state.clubs.filter((item) => item.id !== action.payload);

      return {
        ...state,
        clubs: remainingClubs,
        selectedClubId:
          state.selectedClubId === action.payload
            ? remainingClubs[0]?.id ?? ''
            : state.selectedClubId,
        announcements: state.announcements.filter((item) => item.clubId !== action.payload),
        events: state.events.filter((item) => item.clubId !== action.payload),
        membershipRequests: state.membershipRequests.filter((req) => req.clubId !== action.payload),
        activityLog: [logEntry(`Club deleted: "${club.name}"`, 'club'), ...state.activityLog],
        toast: { message: `${club.name} deleted`, type: 'info' },
      };
    }

    // ── Membership ────────────────────────────────────────────────
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

    // ── Announcements ─────────────────────────────────────────────
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

    // ── Events ────────────────────────────────────────────────────
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

    // ── Roles ─────────────────────────────────────────────────────
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

const StateCtx    = createContext(null);
const DispatchCtx = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (!state.toast) return;
    const id = setTimeout(() => dispatch({ type: 'DISMISS_TOAST' }), 3200);
    return () => clearTimeout(id);
  }, [state.toast]);

  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>
        {children}
      </DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useAppState()    { return useContext(StateCtx); }
export function useAppDispatch() { return useContext(DispatchCtx); }
