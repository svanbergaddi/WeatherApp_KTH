import { AppError } from '@/Shared/Types';

const DEFAULT_TIMEOUT_MS = 10_000;

// Fetches a URL and returns the raw JSON. Does NOT parse it into our model.
// Every failure is turned into an AppError, so callers only handle one error type.
// `signal` lets the caller cancel the request (used when a newer search starts, W-20).
export async function API_FetchJson(
  url: string,
  signal?: AbortSignal,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<unknown> {
  const controller = new AbortController();
  let didTimeOut = false;

  const timer = setTimeout(() => {
    didTimeOut = true;
    controller.abort();
  }, timeoutMs);

  // Forward a cancel from the caller to our own controller.
  const onCallerAbort = () => controller.abort();
  signal?.addEventListener('abort', onCallerAbort);

  try {
    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch {
      if (didTimeOut) throw new AppError('timeout', 'The server took too long to answer.');
      if (signal?.aborted) throw new AppError('cancelled', 'The request was cancelled.');
      throw new AppError('network', 'Could not reach the server.');
    }

    // Network worked, but the server said no (e.g. 401 bad key, 429 too many requests, 500).
    if (!response.ok) {
      throw new AppError('http', `The server answered with status ${response.status}.`, response.status);
    }

    try {
      return await response.json();
    } catch {
      throw new AppError('parse', 'The server did not send valid JSON.');
    }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  }
}
