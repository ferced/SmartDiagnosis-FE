import axios from 'src/utils/axios';
import { scheduleSessionExpiry, clearSessionExpiryTimer } from 'src/utils/session-expiry';

// ----------------------------------------------------------------------

function jwtDecode(token: string) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split('')
      .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join('')
  );

  return JSON.parse(jsonPayload);
}

// ----------------------------------------------------------------------

export const isValidToken = (accessToken: string) => {
  if (!accessToken) {
    return false;
  }

  const decoded = jwtDecode(accessToken);

  const currentTime = Date.now() / 1000;

  return decoded.exp > currentTime;
};

// ----------------------------------------------------------------------

export const tokenExpired = (exp: number) => {
  // Replaces any timer from a previous login; see src/utils/session-expiry.
  scheduleSessionExpiry(exp);
};

// ----------------------------------------------------------------------

export const setSession = (accessToken: string | null) => {
  if (accessToken) {
    sessionStorage.setItem('accessToken', accessToken);

    axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

    // This function below will handle when token is expired
    const { exp } = jwtDecode(accessToken); // ~3 days by minimals server
    tokenExpired(exp);
  } else {
    clearSessionExpiryTimer();

    sessionStorage.removeItem('accessToken');

    delete axios.defaults.headers.common.Authorization;
  }
};
