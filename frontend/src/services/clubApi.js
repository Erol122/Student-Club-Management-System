import { apiFetch } from '../api/client';

const CLUBS_API_PATH = '/api/clubs';

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await response.json() : await response.text();

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

export async function fetchClubs({ instance, account, search, category } = {}) {
  const params = new URLSearchParams();
  if (search?.trim()) params.set('search', search.trim());
  if (category?.trim() && category !== 'All') params.set('category', category.trim());

  const query = params.toString();
  const path = query ? `${CLUBS_API_PATH}?${query}` : CLUBS_API_PATH;
  const response = await apiFetch(instance, account, path);
  return parseResponse(response);
}

export async function createClub({ instance, account, payload }) {
  const response = await apiFetch(instance, account, CLUBS_API_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function updateClub({ instance, account, id, payload }) {
  const response = await apiFetch(instance, account, `${CLUBS_API_PATH}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function deleteClub({ instance, account, id }) {
  const response = await apiFetch(instance, account, `${CLUBS_API_PATH}/${id}`, {
    method: 'DELETE',
  });
  return parseResponse(response);
}
