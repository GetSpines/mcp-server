import { z } from 'zod';
import type { SpinesClient } from '../client.js';

export const getBookPairingsSchema = z.object({
  book_id: z.string().describe('The book ID to find pairings for'),
  limit: z.number().min(1).max(50).default(10).describe('Maximum results (default 10)'),
});

export const getBookPairingsAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

export async function getBookPairings(client: SpinesClient, args: z.infer<typeof getBookPairingsSchema>) {
  return client.get(`/books/${args.book_id}/pairings`, { limit: args.limit.toString() });
}
