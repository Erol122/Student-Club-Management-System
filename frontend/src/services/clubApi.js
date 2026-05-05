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

function toJsonRequest(body, method = 'POST') {
  return {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

export async function fetchClubs({ search, category } = {}) {
  const params = new URLSearchParams();
  if (search?.trim()) params.set('search', search.trim());
  if (category?.trim() && category !== 'All') params.set('category', category.trim());

  const query = params.toString();
  const response = await fetch(query ? `${CLUBS_API_PATH}?${query}` : CLUBS_API_PATH);
  return parseResponse(response);
}

export async function createClub(payload) {
  const response = await fetch(CLUBS_API_PATH, toJsonRequest(payload, 'POST'));
  return parseResponse(response);
}

export async function updateClub(id, payload) {
  const response = await fetch(`${CLUBS_API_PATH}/${id}`, toJsonRequest(payload, 'PUT'));
  return parseResponse(response);
}

export async function deleteClub(id) {
  const response = await fetch(`${CLUBS_API_PATH}/${id}`, { method: 'DELETE' });
  return parseResponse(response);
}
