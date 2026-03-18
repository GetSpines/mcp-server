import { z } from 'zod';
import type { SpinesClient } from '../client.js';

export const listCategoriesSchema = z.object({});

export const listCategoriesAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

export async function listCategories(client: SpinesClient) {
  return client.get('/categories');
}
