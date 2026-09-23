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
