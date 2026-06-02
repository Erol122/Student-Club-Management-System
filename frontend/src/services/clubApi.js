import { apiFetch } from '../api/client';

const CLUBS_API_PATH = '/api/clubs';
const CLUB_PROPOSALS_API_PATH = '/api/club-proposals';
const JOIN_REQUESTS_API_PATH = '/api/join-requests';
const ANNOUNCEMENTS_API_PATH = '/api/announcements';
const EVENTS_API_PATH = '/api/events';

export async function parseResponse(response) {
  const contentType = response.headers.get('content-type') ?? '';
  const hasBody = response.status !== 204;
  const body = hasBody
    ? contentType.includes('application/json') || contentType.includes('+json')
      ? await response.json()
      : await response.text()
    : null;

  if (response.ok) {
    return body;
  }

  const error = new Error(
    typeof body === 'string'
      ? body || 'Request failed.'
      : body?.detail || body?.title || 'Request failed.'
  );
  error.status = response.status;
  error.body = body;
  throw error;
}

function toJsonRequest(body, method = 'POST') {
  return {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

export async function fetchClubs(auth, { search, category } = {}) {
  const params = new URLSearchParams();
  if (search?.trim()) params.set('search', search.trim());
  if (category?.trim() && category !== 'All') params.set('category', category.trim());

  const query = params.toString();
  const response = await apiFetch(
    auth.instance,
    auth.account,
    query ? `${CLUBS_API_PATH}?${query}` : CLUBS_API_PATH
  );
  return parseResponse(response);
}

export async function createClub(auth, payload) {
  const response = await apiFetch(auth.instance, auth.account, CLUBS_API_PATH, toJsonRequest(payload, 'POST'));
  return parseResponse(response);
}

export async function updateClub(auth, id, payload) {
  const response = await apiFetch(auth.instance, auth.account, `${CLUBS_API_PATH}/${id}`, toJsonRequest(payload, 'PUT'));
  return parseResponse(response);
}

export async function deleteClub(auth, id) {
  const response = await apiFetch(auth.instance, auth.account, `${CLUBS_API_PATH}/${id}`, { method: 'DELETE' });
  return parseResponse(response);
}

export async function fetchClubProposals(auth) {
  const response = await apiFetch(auth.instance, auth.account, `${CLUB_PROPOSALS_API_PATH}/pending`);
  return parseResponse(response);
}

export async function submitClubProposal(auth, payload) {
  const response = await apiFetch(auth.instance, auth.account, CLUB_PROPOSALS_API_PATH, toJsonRequest(payload, 'POST'));
  return parseResponse(response);
}

export async function approveClubProposal(auth, id) {
  const response = await apiFetch(auth.instance, auth.account, `${CLUB_PROPOSALS_API_PATH}/${id}/approve`, {
    method: 'POST',
  });
  return parseResponse(response);
}

export async function rejectClubProposal(auth, id) {
  const response = await apiFetch(auth.instance, auth.account, `${CLUB_PROPOSALS_API_PATH}/${id}/reject`, {
    method: 'POST',
  });
  return parseResponse(response);
}

export async function fetchJoinRequests(auth) {
  const response = await apiFetch(auth.instance, auth.account, `${JOIN_REQUESTS_API_PATH}/pending`);
  return parseResponse(response);
}

export async function fetchAnnouncements(auth) {
  const response = await apiFetch(auth.instance, auth.account, ANNOUNCEMENTS_API_PATH);
  return parseResponse(response);
}

export async function fetchEvents(auth) {
  const response = await apiFetch(auth.instance, auth.account, EVENTS_API_PATH);
  return parseResponse(response);
}

export async function submitJoinRequest(auth, clubId, message) {
  const response = await apiFetch(
    auth.instance,
    auth.account,
    `${CLUBS_API_PATH}/${clubId}/join-requests`,
    toJsonRequest({ message }, 'POST')
  );
  return parseResponse(response);
}

export async function createAnnouncement(auth, clubId, payload) {
  const response = await apiFetch(
    auth.instance,
    auth.account,
    `${CLUBS_API_PATH}/${clubId}/announcements`,
    toJsonRequest(payload, 'POST')
  );
  return parseResponse(response);
}

export async function createEvent(auth, clubId, payload) {
  const response = await apiFetch(
    auth.instance,
    auth.account,
    `${CLUBS_API_PATH}/${clubId}/events`,
    toJsonRequest(payload, 'POST')
  );
  return parseResponse(response);
}

export async function updateAnnouncement(auth, id, payload) {
  const response = await apiFetch(
    auth.instance, auth.account,
    `${ANNOUNCEMENTS_API_PATH}/${id}`,
    toJsonRequest(payload, 'PUT')
  );
  return parseResponse(response);
}

export async function deleteAnnouncement(auth, id) {
  const response = await apiFetch(
    auth.instance, auth.account,
    `${ANNOUNCEMENTS_API_PATH}/${id}`,
    { method: 'DELETE' }
  );
  return parseResponse(response);
}

export async function updateEvent(auth, id, payload) {
  const response = await apiFetch(
    auth.instance, auth.account,
    `${EVENTS_API_PATH}/${id}`,
    toJsonRequest(payload, 'PUT')
  );
  return parseResponse(response);
}

export async function deleteEvent(auth, id) {
  const response = await apiFetch(
    auth.instance, auth.account,
    `${EVENTS_API_PATH}/${id}`,
    { method: 'DELETE' }
  );
  return parseResponse(response);
}

export async function leaveClub(auth, clubId) {
  const response = await apiFetch(
    auth.instance,
    auth.account,
    `${CLUBS_API_PATH}/${clubId}/members/me`,
    { method: 'DELETE' }
  );
  return parseResponse(response);
}

export async function approveJoinRequest(auth, id) {
  const response = await apiFetch(auth.instance, auth.account, `${JOIN_REQUESTS_API_PATH}/${id}/approve`, {
    method: 'POST',
  });
  return parseResponse(response);
}

export async function rejectJoinRequest(auth, id) {
  const response = await apiFetch(auth.instance, auth.account, `${JOIN_REQUESTS_API_PATH}/${id}/reject`, {
    method: 'POST',
  });
  return parseResponse(response);
}
