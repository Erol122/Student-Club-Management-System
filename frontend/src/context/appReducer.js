import {
  logEntry,
  mapAnnouncementToUi,
  mapApiClubToUi,
  mapEventToUi,
  mapJoinRequestToUi,
  mapProposalToUi,
  syncSelectedClubId,
} from './appMappers';
import { APP_ROLES, CLUB_MEMBER_ROLES } from '../domain/roles';

export const initialState = {
  currentUser: null,
  activeView: 'home',
  activeRole: APP_ROLES.Admin,
  selectedClubId: '',
  clubDetailTab: 'overview',
  clubs: [],
  clubsLoading: false,
  clubsSaving: false,
  clubsError: null,
  clubRequests: [],
  membershipRequests: [],
  announcements: [],
  events: [],
  activityLog: [],
  searchQuery: '',
  categoryFilter: 'All',
  toast: null,
};

export function reducer(state, action) {
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
        activeRole: APP_ROLES.Admin,
        selectedClubId: syncSelectedClubId('', state.clubs),
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
        clubs: [],
        selectedClubId: '',
        clubRequests: [],
        membershipRequests: [],
        toast: { message: action.payload, type: 'info' },
      };

    case 'LOAD_WORKFLOW_SUCCESS':
      return {
        ...state,
        clubRequests: action.payload.clubRequests.map(mapProposalToUi),
        membershipRequests: action.payload.membershipRequests.map(mapJoinRequestToUi),
      };

    case 'LOAD_CONTENT_SUCCESS':
      return {
        ...state,
        announcements: action.payload.announcements.map(mapAnnouncementToUi),
        events: action.payload.events.map(mapEventToUi),
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

    case 'SUBMIT_CLUB_REQUEST': {
      const req = mapProposalToUi(action.payload);
      return {
        ...state,
        clubsSaving: false,
        clubRequests: [req, ...state.clubRequests],
        activityLog: [logEntry(`Club proposal submitted: "${req.name}"`, 'club'), ...state.activityLog],
        toast: { message: `"${req.name}" sent to admin for review`, type: 'success' },
      };
    }

    case 'APPROVE_CLUB': {
      const req = state.clubRequests.find((r) => r.id === action.payload);
      if (!req) return { ...state, clubsSaving: false };
      return {
        ...state,
        clubsSaving: false,
        clubRequests: state.clubRequests.filter((r) => r.id !== action.payload),
        activityLog: [logEntry(`Club approved: "${req.name}"`, 'club'), ...state.activityLog],
        toast: { message: `${req.name} approved`, type: 'success' },
      };
    }

    case 'REJECT_CLUB': {
      const req = state.clubRequests.find((r) => r.id === action.payload);
      return {
        ...state,
        clubsSaving: false,
        clubRequests: state.clubRequests.filter((r) => r.id !== action.payload),
        activityLog: [logEntry(`Club proposal rejected: "${req?.name}"`, 'info'), ...state.activityLog],
        toast: { message: 'Club proposal rejected', type: 'info' },
      };
    }

    case 'REQUEST_MEMBERSHIP': {
      const userName = state.currentUser?.name;
      const userEmail = state.currentUser?.email;
      const club = state.clubs.find((c) => c.id === action.payload);
      const alreadyPending = state.membershipRequests.some(
        (r) => r.clubId === action.payload && (r.email === userEmail || r.student === userName)
      );
      const isMember = club?.members.some((m) => m.email === userEmail || m.name === userName);
      if (alreadyPending || isMember) return { ...state, clubsSaving: false };
      const req = mapJoinRequestToUi(action.meta);
      return {
        ...state,
        clubsSaving: false,
        membershipRequests: [req, ...state.membershipRequests],
        toast: { message: `Request sent to ${club?.name}`, type: 'success' },
      };
    }

    case 'APPROVE_MEMBERSHIP': {
      const req = state.membershipRequests.find((r) => r.id === action.payload);
      if (!req) return { ...state, clubsSaving: false };
      const club = state.clubs.find((c) => c.id === req.clubId);
      return {
        ...state,
        clubsSaving: false,
        clubs: state.clubs.map((c) =>
          c.id === req.clubId
            ? {
                ...c,
                members: [
                  ...c.members,
                  {
                    id: `${req.id}-m`,
                    name: req.student,
                    role: CLUB_MEMBER_ROLES.Member,
                    program: req.program,
                  },
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
        clubsSaving: false,
        membershipRequests: state.membershipRequests.filter((r) => r.id !== action.payload),
        toast: { message: `${req?.student}'s request declined`, type: 'info' },
      };
    }

    case 'PUBLISH_ANNOUNCEMENT_SUCCESS': {
      const ann = mapAnnouncementToUi(action.payload);
      return {
        ...state,
        clubsSaving: false,
        announcements: [ann, ...state.announcements],
        activityLog: [
          logEntry(`Announcement published: "${ann.title}"`, 'announcement'),
          ...state.activityLog,
        ],
        toast: { message: 'Announcement published to members', type: 'success' },
      };
    }

    case 'SCHEDULE_EVENT_SUCCESS': {
      const evt = mapEventToUi(action.payload);
      return {
        ...state,
        clubsSaving: false,
        events: [...state.events, evt].sort((a, b) => new Date(a.date) - new Date(b.date)),
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

    default:
      return state;
  }
}
