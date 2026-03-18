import { z } from 'zod';
import type { SpinesClient } from '../client.js';

export const getCollectionSchema = z.object({
  collection_id: z.string().describe("The collection's unique ID"),
});

export const getCollectionAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

export async function getCollection(client: SpinesClient, args: z.infer<typeof getCollectionSchema>) {
  return client.get(`/collections/${args.collection_id}`);
}
