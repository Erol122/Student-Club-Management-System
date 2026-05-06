import { apiFetch } from '../api/client';

const BASE = '/api/club-creation-requests';

async function parseResponse(res) {
  const contentType = res.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await res.json() : await res.text();
  if (res.ok) return body;
  const error = new Error(
    typeof body === 'string'
      ? body || 'Request failed.'
      : body?.detail || body?.title || 'Request failed.'
  );
  error.status = res.status;
  error.body = body;
  throw error;
}

export async function fetchAllClubCreationRequests({ instance, account, status } = {}) {
  const params = status != null ? `?status=${status}` : '';
  const res = await apiFetch(instance, account, `${BASE}${params}`);
  return parseResponse(res);
}

export async function fetchMyClubCreationRequests({ instance, account } = {}) {
  const res = await apiFetch(instance, account, `${BASE}/mine`);
  return parseResponse(res);
}

export async function submitClubCreationRequest({ instance, account, payload }) {
  const res = await apiFetch(instance, account, BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function approveClubCreationRequest({ instance, account, requestId, reviewNote }) {
  const res = await apiFetch(instance, account, `${BASE}/${requestId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ reviewNote: reviewNote ?? null }),
  });
  return parseResponse(res);
}

export async function rejectClubCreationRequest({ instance, account, requestId, reviewNote }) {
  const res = await apiFetch(instance, account, `${BASE}/${requestId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reviewNote: reviewNote ?? null }),
  });
  return parseResponse(res);
}
