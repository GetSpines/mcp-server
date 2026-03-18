import type { SpinesClient } from '../client.js';

export const collectionResource = {
  uriTemplate: 'spines://collection/{id}',
  name: 'Collection',
  description: 'A book collection with its books and metadata',
  mimeType: 'application/json',
};

export async function readCollection(client: SpinesClient, id: string) {
  return client.get(`/collections/${id}`);
}
