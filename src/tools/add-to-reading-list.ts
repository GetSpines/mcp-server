import { z } from 'zod';
import type { SpinesClient } from '../client.js';

export const addToReadingListSchema = z.object({
  book_id: z.string().describe('The book ID to add'),
  list_name: z.string().default('want_to_read').describe('Reading list name (default: "want_to_read"). Use list_reading_lists to see available lists.'),
});

export const addToReadingListAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

export async function addToReadingList(client: SpinesClient, args: z.infer<typeof addToReadingListSchema>) {
  return client.post('/reading-lists', {
    book_id: args.book_id,
    list_name: args.list_name,
  });
}
