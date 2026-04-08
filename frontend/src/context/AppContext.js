import { createContext, useContext, useEffect, useReducer } from 'react';
import {
  initialAnnouncements,
  initialClubRequests,
  initialClubs,
  initialEvents,
  initialMembershipRequests,
  initialMessages,
} from '../data/mockData';

const fmtDate = (ts) =>
  new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(ts)
  );

function logEntry(message, type = 'info') {
  return { id: `al-${Date.now()}-${Math.random().toString(36).slice(2)}`, type, message, ts: Date.now() };
}

const NOW = Date.now();

const initialState = {
  currentUser: null,
  activeView: 'dashboard',
  activeRole: 'Admin',
  selectedClubId: initialClubs[0]?.id ?? '',
  clubDetailTab: 'overview',
  clubs: initialClubs,
  clubRequests: initialClubRequests,
  membershipRequests: initialMembershipRequests,
  announcements: initialAnnouncements,
  events: initialEvents,
  messages: initialMessages,
  activityLog: [
    { id: 'al-seed-1', type: 'event',        message: 'Policy Debate Night scheduled for Apr 16',      ts: NOW - 3_600_000 },
    { id: 'al-seed-2', type: 'member',       message: 'Adnan Begovic requested to join Debate Society', ts: NOW - 7_200_000 },
    { id: 'al-seed-3', type: 'announcement', message: 'Public speaking workshop announcement published', ts: NOW - 14_400_000 },
    { id: 'al-seed-4', type: 'club',         message: 'Entrepreneurship Circle proposal submitted',     ts: NOW - 86_400_000 },
    { id: 'al-seed-5', type: 'member',       message: 'Lamija Kurtic requested to join Creative Media Lab', ts: NOW - 90_000_000 },
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
      const newClub = {
        id: req.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: req.name,
        category: req.category,
        summary: req.mission,
        leader: req.proposedBy,
        accent: '#5b8def',
        health: 'Growing',
        nextEvent: 'Planning session pending',
        announcementsCount: 0,
        members: [
          { id: `${action.payload}-leader`, name: req.proposedBy, role: 'Club Leader', program: 'Club Founder' },
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

    // ── Messages ──────────────────────────────────────────────────
    case 'POST_MESSAGE': {
      const msg = {
        id: `msg-${Date.now()}`,
        clubId: action.payload.clubId,
        author: state.currentUser?.name,
        text: action.payload.text,
        ts: Date.now(),
      };
      return { ...state, messages: [...state.messages, msg] };
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
