/**
 * REST API client for the SPINES Public API
 * Thin wrapper around fetch with auth and error handling.
 */

import type { Config } from './config.js';
import { VERSION } from './version.js';

/** Every request gets a deadline; a bare fetch could hang a tool call forever. */
export const DEFAULT_TIMEOUT_MS = 30_000;

export interface RequestOptions {
  /** Overrides DEFAULT_TIMEOUT_MS for one slow call (recognition). */
  timeoutMs?: number;
}

export class SpinesApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    /** The API's error.details, e.g. which photo of a request was a duplicate. Shown in the message so the assistant sees it. */
    public details?: Record<string, unknown>,
  ) {
    super(`SPINES API Error [${code}]: ${message}${details ? ` ${JSON.stringify(details)}` : ''}`);
    this.name = 'SpinesApiError';
  }
}

export class SpinesClient {
  private baseUrl: string;
  private apiKey: string;
  private debug: boolean;

  constructor(config: Config) {
    this.baseUrl = config.apiUrl;
    this.apiKey = config.apiKey;
    this.debug = config.debug;
  }

  private headers(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': `@spines/mcp-server/${VERSION}`,
    };
  }

  private log(method: string, path: string, status?: number) {
    if (this.debug) {
      const msg = status
        ? `[SPINES] ${method} ${path} → ${status}`
        : `[SPINES] ${method} ${path}`;
      console.error(msg);
    }
  }

  /** fetch with a deadline; a timeout becomes SpinesApiError TIMEOUT, other network errors pass through. */
  private async send(method: string, path: string, url: string, init: RequestInit, opts?: RequestOptions): Promise<Response> {
    this.log(method, path);
    const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    try {
      return await fetch(url, { ...init, method, signal: AbortSignal.timeout(timeoutMs) });
    } catch (err) {
      if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        throw new SpinesApiError(0, 'TIMEOUT', `${method} ${path} got no response within ${Math.round(timeoutMs / 1000)} s`);
      }
      throw err;
    }
  }

  private async handleResponse<T>(res: Response, path: string): Promise<T> {
    this.log(res.ok ? 'OK' : 'ERR', path, res.status);

    if (!res.ok) {
      const body = await res.json().catch(() => ({
        error: { code: 'UNKNOWN', message: res.statusText },
      }));
      throw new SpinesApiError(
        res.status,
        body.error?.code ?? 'UNKNOWN',
        body.error?.message ?? res.statusText,
        body.error?.details,
      );
    }

    const json = await res.json();
    return json.data as T;
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '') url.searchParams.set(k, v);
      }
    }

    const res = await this.send('GET', path, url.toString(), { headers: this.headers() });
    return this.handleResponse<T>(res, path);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await this.send('POST', path, `${this.baseUrl}${path}`, {
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(res, path);
  }

  async postWithHeaders<T>(path: string, body: unknown, extraHeaders: Record<string, string>, opts?: RequestOptions): Promise<T> {
    const res = await this.send('POST', path, `${this.baseUrl}${path}`, {
      headers: { ...this.headers(), ...extraHeaders },
      body: JSON.stringify(body),
    }, opts);
    return this.handleResponse<T>(res, path);
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    const res = await this.send('PATCH', path, `${this.baseUrl}${path}`, {
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(res, path);
  }

  async delete<T>(path: string): Promise<T> {
    const res = await this.send('DELETE', path, `${this.baseUrl}${path}`, {
      headers: this.headers(),
    });
    return this.handleResponse<T>(res, path);
  }
}
