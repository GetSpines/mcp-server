import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws when SPINES_API_KEY is missing', () => {
    delete process.env.SPINES_API_KEY;
    expect(() => loadConfig()).toThrow('SPINES_API_KEY is required');
  });

  it('returns config with defaults when only API key set', () => {
    process.env.SPINES_API_KEY = 'gtspn_live_test123';
    const config = loadConfig();
    expect(config.apiKey).toBe('gtspn_live_test123');
    expect(config.apiUrl).toBe('https://spins.app/api/v1');
    expect(config.debug).toBe(false);
  });

  it('uses custom API URL when set', () => {
    process.env.SPINES_API_KEY = 'gtspn_live_test123';
    process.env.SPINES_API_URL = 'http://localhost:3000/api/v1';
    const config = loadConfig();
    expect(config.apiUrl).toBe('http://localhost:3000/api/v1');
  });

  it('enables debug when SPINES_DEBUG is true', () => {
    process.env.SPINES_API_KEY = 'gtspn_live_test123';
    process.env.SPINES_DEBUG = 'true';
    const config = loadConfig();
    expect(config.debug).toBe(true);
  });
});
