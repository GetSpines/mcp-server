import { z } from 'zod';
import type { SpinesClient } from '../client.js';

export const checkCreditsSchema = z.object({});

export const checkCreditsAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

export async function checkCredits(client: SpinesClient) {
  return client.get('/me/credits');
}
