/**
 * REST API client for the SPINES Public API
 * Thin wrapper around fetch with auth and error handling.
 */

import type { Config } from './config.js';

const VERSION = '1.0.0-beta.1';

export class SpinesApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(`SPINES API Error [${code}]: ${message}`);
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

    this.log('GET', path);
    const res = await fetch(url.toString(), { headers: this.headers() });
    return this.handleResponse<T>(res, path);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    this.log('POST', path);
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(res, path);
  }

  async postWithHeaders<T>(path: string, body: unknown, extraHeaders: Record<string, string>): Promise<T> {
    this.log('POST', path);
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { ...this.headers(), ...extraHeaders },
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(res, path);
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    this.log('PATCH', path);
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(res, path);
  }

  async delete<T>(path: string): Promise<T> {
    this.log('DELETE', path);
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
    return this.handleResponse<T>(res, path);
  }
}
