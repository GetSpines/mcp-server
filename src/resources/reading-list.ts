import type { SpinesClient } from '../client.js';

export const readingListResource = {
  uriTemplate: 'spines://reading-lists',
  name: 'Reading Lists',
  description: "The user's reading lists with book details",
  mimeType: 'application/json',
};

export async function readReadingLists(client: SpinesClient) {
  return client.get('/reading-lists');
}
