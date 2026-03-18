import { z } from 'zod';
import type { SpinesClient } from '../client.js';

export const removeFromReadingListSchema = z.object({
  entry_id: z.string().describe('The reading list entry ID to remove. Use list_reading_lists to find entry IDs.'),
});

export const removeFromReadingListAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: false,
};

export async function removeFromReadingList(client: SpinesClient, args: z.infer<typeof removeFromReadingListSchema>) {
  return client.delete(`/reading-lists/${args.entry_id}`);
}
