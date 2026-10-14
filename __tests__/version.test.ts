import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { VERSION } from '../src/version.js';

const read = (f: string) => JSON.parse(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'));

describe('VERSION', () => {
  // The User-Agent and the MCP handshake said 1.0.0-beta.1 through 1.0.3.
  it('matches package.json and both server.json version fields', () => {
    const pkg = read('package.json');
    const server = read('server.json');
    expect(VERSION).toBe(pkg.version);
    expect(server.version).toBe(pkg.version);
    expect(server.packages[0].version).toBe(pkg.version);
  });
});
