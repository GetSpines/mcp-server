import { z } from 'zod';
import type { SpinesClient } from '../client.js';

export const listCollectionsSchema = z.object({
  limit: z.number().min(1).max(50).default(20).describe('Maximum results (1-50, default 20)'),
  cursor: z.string().optional().describe('Pagination cursor from previous response'),
  persona_id: z.string().optional().describe('Filter by persona ID'),
  category_id: z.string().optional().describe('Filter by category ID'),
});

export const listCollectionsAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

export async function listCollections(client: SpinesClient, args: z.infer<typeof listCollectionsSchema>) {
  const params: Record<string, string> = { limit: args.limit.toString() };
  if (args.cursor) params.cursor = args.cursor;
  if (args.persona_id) params.persona_id = args.persona_id;
  if (args.category_id) params.category_id = args.category_id;
  return client.get('/collections', params);
}
