import { z } from 'zod';
import type { SpinesClient } from '../client.js';

export const getPersonaSchema = z.object({
  persona_id: z.string().describe("The persona's unique ID"),
});

export const getPersonaAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

export async function getPersona(client: SpinesClient, args: z.infer<typeof getPersonaSchema>) {
  return client.get(`/personas/${args.persona_id}`);
}
