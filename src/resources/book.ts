import type { SpinesClient } from '../client.js';

export const bookResource = {
  uriTemplate: 'spines://book/{id}',
  name: 'Book',
  description: 'Full book metadata (title, author, ISBN, cover, editions)',
  mimeType: 'application/json',
};

export async function readBook(client: SpinesClient, id: string) {
  return client.get(`/books/${id}`);
}
