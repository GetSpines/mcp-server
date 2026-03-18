import { z } from 'zod';
import type { SpinesClient } from '../client.js';

export const getBookDetailsSchema = z.object({
  book_id: z.string().describe("The book's unique ID"),
});

export const getBookDetailsAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

export async function getBookDetails(client: SpinesClient, args: z.infer<typeof getBookDetailsSchema>) {
  return client.get(`/books/${args.book_id}`);
}
