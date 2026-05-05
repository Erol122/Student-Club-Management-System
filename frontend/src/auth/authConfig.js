import { BrowserCacheLocation } from '@azure/msal-browser';

export const apiScope = 'api://562c6df4-0ce8-4165-8969-f300f4c1842a/api_access';

export const loginRequest = {
  scopes: [apiScope],
};

export const msalConfig = {
  auth: {
    clientId: '562c6df4-0ce8-4165-8969-f300f4c1842a',
    authority: 'https://login.microsoftonline.com/2f2dcb5d-f3e1-4f33-8584-dcacd25d604d',
    redirectUri: `${window.location.origin}/auth`,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: BrowserCacheLocation.SessionStorage,
    storeAuthStateInCookie: false,
  },
};
