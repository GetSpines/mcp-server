import { z } from 'zod';
import type { SpinesClient } from '../client.js';

export const searchBooksSchema = z.object({
  query: z.string().describe('Search query (title, author name, or ISBN)'),
  limit: z.number().min(1).max(50).default(10).describe('Maximum results to return'),
});

export const searchBooksAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

export async function searchBooks(client: SpinesClient, args: z.infer<typeof searchBooksSchema>) {
  return client.get('/books/search', {
    q: args.query,
    limit: args.limit.toString(),
  });
}
