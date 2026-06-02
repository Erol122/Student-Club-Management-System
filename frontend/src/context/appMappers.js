import { CLUB_MEMBER_ROLES } from '../domain/roles';
import { normalizeClubCategory } from '../data/clubCategories';

const fmtDate = (ts) =>
  new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(ts)
  );

const fmtTime = (ts) =>
  new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(new Date(ts));

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
const PROPOSAL_STATUS_LABELS = {
  1: 'Pending',
  2: 'Approved',
  3: 'Rejected',
  Draft: 'Pending',
  Active: 'Approved',
  Archived: 'Rejected',
};

const DEFAULT_ACCENT = '#5b8def';
const DEFAULT_NEXT_EVENT = 'No event scheduled';
const DEFAULT_LEADER = 'Club admin';
const ROLE_LABELS = {
  1: CLUB_MEMBER_ROLES.Member,
  2: CLUB_MEMBER_ROLES.Officer,
  3: CLUB_MEMBER_ROLES.VicePresident,
  4: CLUB_MEMBER_ROLES.President,
  Member: CLUB_MEMBER_ROLES.Member,
  Officer: CLUB_MEMBER_ROLES.Officer,
  VicePresident: CLUB_MEMBER_ROLES.VicePresident,
  President: CLUB_MEMBER_ROLES.President,
};

export function logEntry(message, type = 'info') {
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

export function mapApiClubToUi(dto, existingClub = null) {
  const members = (dto.members ?? existingClub?.members ?? []).map((member) => ({
    id: member.id,
    userId: member.userId,
    name: member.name,
    email: member.email,
    role: ROLE_LABELS[member.role] ?? member.role ?? CLUB_MEMBER_ROLES.Member,
    program: member.program ?? 'Student',
  }));
  const owner = members.find((member) => member.role === CLUB_MEMBER_ROLES.President);

  return {
    id: dto.id,
    name: dto.name,
    category: normalizeClubCategory(dto.category ?? existingClub?.category),
    summary: dto.description ?? existingClub?.summary ?? 'No description yet.',
    imageKey: dto.imageKey ?? existingClub?.imageKey ?? '',
    leader: owner?.name ?? existingClub?.leader ?? DEFAULT_LEADER,
    accent: existingClub?.accent ?? DEFAULT_ACCENT,
    health: normalizeClubStatus(dto.status),
    nextEvent: existingClub?.nextEvent ?? DEFAULT_NEXT_EVENT,
    groupPlatform: dto.groupPlatform ?? existingClub?.groupPlatform ?? '',
    groupLink: dto.groupLink ?? existingClub?.groupLink ?? '',
    announcementsCount: existingClub?.announcementsCount ?? 0,
    members,
    slug: dto.slug,
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapProposalToUi(dto) {
  return {
    id: dto.id,
    name: dto.name,
    category: normalizeClubCategory(dto.category),
    proposedBy: dto.proposedBy,
    proposedByEmail: dto.proposedByEmail,
    mission: dto.mission,
    status: PROPOSAL_STATUS_LABELS[dto.status] ?? dto.status ?? 'Pending',
    imageKey: dto.imageKey ?? '',
    submittedAt: dto.submittedAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapJoinRequestToUi(dto) {
  return {
    id: dto.id,
    clubId: dto.clubId,
    student: dto.student,
    email: dto.email,
    program: dto.program ?? 'Student',
    reason: dto.reason ?? 'Interested in joining this club.',
    status: dto.status,
  };
}

export function mapAnnouncementToUi(dto) {
  const publishedAt = dto.publishedAt ?? dto.createdAt;
  return {
    id: dto.id,
    clubId: dto.clubId,
    title: dto.title,
    body: dto.body,
    audience: dto.audience ?? 'All members',
    author: dto.author ?? 'Club admin',
    date: fmtDate(publishedAt),
    ts: publishedAt ? new Date(publishedAt).getTime() : Date.now(),
  };
}

export function mapEventToUi(dto) {
  const startAt = dto.startAt ?? dto.date;
  return {
    id: dto.id,
    clubId: dto.clubId,
    title: dto.title,
    description: dto.description ?? '',
    date: startAt ? startAt.slice(0, 10) : '',
    time: startAt ? fmtTime(startAt) : '',
    location: dto.location ?? 'TBA',
    startAt,
    endAt: dto.endAt,
    rsvp: [],
  };
}

export function mapUiProposalToRequest(draft) {
  return {
    name: draft.name.trim(),
    category: normalizeClubCategory(draft.category),
    mission: draft.mission.trim(),
    imageKey: draft.imageKey || null,
  };
}

export function mapUiClubToCreateRequest(draft) {
  return {
    name: draft.name.trim(),
    slug: slugify(draft.name),
    description: draft.summary.trim(),
    category: normalizeClubCategory(draft.category),
    status: STATUS_VALUES[draft.health] ?? STATUS_VALUES.Active,
    imageKey: draft.imageKey || null,
    groupPlatform: null,
    groupLink: null,
  };
}

export function mapUiClubToUpdateRequest(draft, currentClub) {
  return {
    name: draft.name.trim(),
    slug: slugify(draft.name),
    description: draft.summary.trim(),
    category: normalizeClubCategory(draft.category),
    status: STATUS_VALUES[draft.health] ?? STATUS_VALUES[currentClub?.health] ?? STATUS_VALUES.Active,
    createdByUserId: null,
    imageKey: draft.imageKey || currentClub?.imageKey || null,
    groupPlatform: Object.prototype.hasOwnProperty.call(draft, 'groupLink')
      ? draft.groupLink?.trim()
        ? 'WhatsApp'
        : null
      : currentClub?.groupPlatform ?? null,
    groupLink: Object.prototype.hasOwnProperty.call(draft, 'groupLink')
      ? draft.groupLink?.trim() || null
      : currentClub?.groupLink ?? null,
  };
}

export function mapUiAnnouncementToRequest(draft) {
  return {
    title: draft.title.trim(),
    body: draft.body.trim(),
    audience: 'All members',
  };
}

export function mapUiEventToRequest(draft) {
  const start = new Date(`${draft.date}T${draft.time}:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  return {
    title: draft.title.trim(),
    description: null,
    location: draft.location.trim(),
    startAt: start.toISOString(),
    endAt: end.toISOString(),
  };
}

export function buildFieldError(problemBody) {
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

export function syncSelectedClubId(selectedClubId, clubs) {
  if (clubs.length === 0) return '';
  return clubs.some((club) => club.id === selectedClubId) ? selectedClubId : clubs[0].id;
}
