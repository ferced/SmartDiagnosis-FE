import axios from 'axios';

// ----------------------------------------------------------------------

// Turns whatever a failed request threw into one sentence a clinician can act
// on. Screens used to show `JSON.stringify(err.response.data)`, i.e. raw
// `{"error":"...","description":"pq: ..."}` blobs with driver internals in
// them, and "Network Error" for a dropped connection.
//
// The API answers errors as `{ error, description }` (RespondWithHTTPError);
// the rate limiter answers `{ error, message }`. `description` carries the Go
// error string, so it is only surfaced for 400s — the input-validation case,
// where it is the useful part — and never for 5xx.

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';

export const DAILY_LIMIT_MESSAGE =
  'Daily limit reached. You can run more analyses tomorrow, or ask an administrator to raise your limit.';

export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.';

export const LOGIN_THROTTLED_MESSAGE =
  'Too many sign-in attempts. Please wait a few minutes and try again.';

type ErrorBody = {
  error?: unknown;
  message?: unknown;
  description?: unknown;
};

function pickString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  // An HTML error page (proxy / gateway) is not a message.
  if (!trimmed || trimmed.startsWith('<')) return null;
  return trimmed;
}

function messageFromBody(body: unknown): string | null {
  if (!body) return null;
  if (typeof body === 'string') return pickString(body);
  if (typeof body === 'object') {
    const { message, error } = body as ErrorBody;
    return pickString(message) || pickString(error);
  }
  return null;
}

export function isRequestCancelled(err: unknown): boolean {
  if (axios.isCancel(err)) return true;
  const name = (err as { name?: string } | null)?.name;
  return name === 'AbortError' || name === 'CanceledError';
}

function messageForStatus(status: number, data: unknown, fallback: string): string {
  if (status === 429) return DAILY_LIMIT_MESSAGE;
  if (status === 401) return SESSION_EXPIRED_MESSAGE;
  if (status === 403) return 'You do not have permission to do this.';

  const bodyMessage = messageFromBody(data);

  if (status === 400) {
    const description = pickString((data as ErrorBody | undefined)?.description);
    if (bodyMessage && description) return `${bodyMessage}: ${description}`;
    return bodyMessage || description || 'The request was rejected. Please review the input.';
  }

  if (status >= 500) {
    return bodyMessage
      ? `${bodyMessage}. Please try again in a moment.`
      : 'The server ran into a problem. Please try again in a moment.';
  }

  return bodyMessage || fallback;
}

export function getErrorStatus(err: unknown): number | null {
  if (axios.isAxiosError(err)) return err.response?.status ?? null;
  const status = (err as { status?: unknown } | null)?.status;
  return typeof status === 'number' ? status : null;
}

// Retry-After is either a number of seconds or an HTTP date.
function parseRetryAfter(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value !== 'string' || !value.trim()) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return seconds > 0 ? seconds : null;
  const date = Date.parse(value);
  if (Number.isNaN(date)) return null;
  const fromDate = Math.ceil((date - Date.now()) / 1000);
  return fromDate > 0 ? fromDate : null;
}

// Seconds to wait before retrying a throttled (429) request: the body's
// `retryAfterSeconds` (POST /auth/login sends it), else the Retry-After
// header. Null when the response says neither.
export function getRetryAfterSeconds(err: unknown): number | null {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as { retryAfterSeconds?: unknown } | undefined;
    return (
      parseRetryAfter(body?.retryAfterSeconds) ??
      parseRetryAfter(err.response?.headers?.['retry-after'])
    );
  }
  const body = err as { retryAfterSeconds?: unknown; retryAfter?: unknown } | null;
  return parseRetryAfter(body?.retryAfterSeconds) ?? parseRetryAfter(body?.retryAfter);
}

// The sign-in throttle's 429 (too many attempts from this address or on this
// account). Every other 429 is the daily analysis limit — see
// messageForStatus — so this is only for the login screen.
export function loginThrottledMessage(err: unknown): string {
  const seconds = getRetryAfterSeconds(err);
  if (!seconds) return LOGIN_THROTTLED_MESSAGE;
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `Too many sign-in attempts. Try again in ${minutes} ${
    minutes === 1 ? 'minute' : 'minutes'
  }.`;
}

export function getErrorMessage(err: unknown, fallback: string = DEFAULT_MESSAGE): string {
  if (isRequestCancelled(err)) {
    return 'The request was cancelled.';
  }

  if (axios.isAxiosError(err)) {
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return 'The request timed out. The server may be busy — please try again.';
    }

    if (!err.response) {
      return 'Could not reach the server. Check your connection and try again.';
    }

    return messageForStatus(err.response.status, err.response.data, fallback);
  }

  // `src/utils/axios` rejects with the response body itself, tagged with the
  // HTTP status (or a plain string when there was no response).
  const status = (err as { status?: unknown } | null)?.status;
  if (typeof status === 'number') {
    return messageForStatus(status, err, fallback);
  }

  const bodyMessage = messageFromBody(err);
  if (bodyMessage) return bodyMessage;

  if (err instanceof Error && err.message) return err.message;

  return fallback;
}
