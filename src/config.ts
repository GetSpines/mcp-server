/**
 * Environment configuration for the SPINES MCP server
 */

export interface Config {
  apiKey: string;
  apiUrl: string;
  debug: boolean;
  llmProvider?: string;
  llmApiKey?: string;
}

export function loadConfig(): Config {
  const apiKey = process.env.SPINES_API_KEY;
  if (!apiKey) {
    throw new Error(
      'SPINES_API_KEY is required. Get one at https://spins.app/settings/developer'
    );
  }

  return {
    apiKey,
    apiUrl: process.env.SPINES_API_URL ?? 'https://spins.app/api/v1',
    debug: process.env.SPINES_DEBUG === 'true',
    llmProvider: process.env.SPINES_LLM_PROVIDER,
    llmApiKey: process.env.SPINES_LLM_API_KEY,
  };
}
