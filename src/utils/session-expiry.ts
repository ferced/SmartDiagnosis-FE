import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

// Single place that ends an expired session: the JWT expiry timer and the
// axios 401 interceptor both land here. Kept free of axios imports so that
// src/utils/axios and src/auth/context/jwt/utils can both depend on it.

const STORAGE_KEY = 'accessToken';

// setTimeout stores its delay as a signed 32-bit int: anything above ~24.8
// days overflows and fires immediately, which would log the user out on
// sign-in. Such a token is left to the 401 interceptor instead.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

// Module-level on purpose: the timer used to be a local variable inside
// tokenExpired(), so clearTimeout() always cleared `undefined` and every
// login / reload stacked another timer that survived logout.
let expiryTimer: ReturnType<typeof setTimeout> | undefined;

let redirecting = false;

export function clearSessionExpiryTimer() {
  if (expiryTimer !== undefined) {
    clearTimeout(expiryTimer);
    expiryTimer = undefined;
  }
}

export function handleSessionExpired() {
  clearSessionExpiryTimer();

  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* non-fatal */
  }

  const { pathname, search } = window.location;

  // Public pages (landing, demo, the login screen itself) don't need a
  // session: drop the token and stay. Inside the app, go to the login and
  // come back to where the clinician was. The patient-form draft survives in
  // sessionStorage, so an interrupted case is still there after re-login.
  if (redirecting || !pathname.startsWith(paths.dashboard.root)) return;

  redirecting = true;

  const params = new URLSearchParams({ returnTo: `${pathname}${search}`, expired: '1' });

  window.location.href = `${paths.auth.jwt.login}?${params.toString()}`;
}

export function scheduleSessionExpiry(expSeconds: number) {
  clearSessionExpiryTimer();

  const timeLeft = expSeconds * 1000 - Date.now();

  if (timeLeft <= 0) {
    handleSessionExpired();
    return;
  }

  if (timeLeft > MAX_TIMEOUT_MS) return;

  expiryTimer = setTimeout(handleSessionExpired, timeLeft);
}
