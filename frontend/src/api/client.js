import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { apiScope } from '../auth/authConfig';

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:5205';

export async function getAccessToken(instance, account) {
  const request = {
    account,
    scopes: [apiScope],
  };

  try {
    const response = await instance.acquireTokenSilent(request);
    return response.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      const response = await instance.acquireTokenPopup(request);
      return response.accessToken;
    }

    throw error;
  }
}

export async function apiFetch(instance, account, path, options = {}) {
  const token = await getAccessToken(instance, account);
  const headers = new Headers(options.headers);

  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  });
}
