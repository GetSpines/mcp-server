import type { SpinesClient } from '../client.js';

export const personaResource = {
  uriTemplate: 'spines://persona/{id}',
  name: 'Persona',
  description: "A persona's profile and their collections",
  mimeType: 'application/json',
};

export async function readPersona(client: SpinesClient, id: string) {
  return client.get(`/personas/${id}`);
}
