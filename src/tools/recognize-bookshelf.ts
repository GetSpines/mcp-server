import { z } from 'zod';
import { SpinesApiError, type SpinesClient } from '../client.js';
import type { Config } from '../config.js';

const photoSchema = z.object({
  image_url: z.string().optional().describe('URL of this photo'),
  image_base64: z.string().optional().describe('Base64-encoded photo (provide this OR image_url)'),
});

export const recognizeBookshelfSchema = z.object({
  title: z.string().optional().describe('Optional title for the new collection'),
  image_url: z.string().optional().describe('URL of a single bookshelf photo'),
  image_base64: z.string().optional().describe('Base64-encoded single photo (provide this OR image_url)'),
  images: z.array(photoSchema).optional().describe(
    'Several photos of one bookshelf, saved as ONE collection (up to 4 with a user key). '
    + 'Each entry has image_url or image_base64. Use instead of image_url / image_base64, not with them. '
    + 'Prefer URLs: base64 photos over 4 MB in total do not fit in one request. Each photo uses one credit.',
  ),
  cover_index: z.number().int().min(0).optional().describe(
    'Zero-based index into images of the photo to use as the collection cover (default 0)',
  ),
});

export const recognizeBookshelfAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
};

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120000;
/**
 * The POST returns only after the server has read every photo (one LLM call
 * each, in parallel), so it waits for the slowest. The route allows 800 s;
 * five minutes covers a normal multi-photo request with room to spare.
 */
export const RECOGNIZE_POST_TIMEOUT_MS = 300_000;

/** The JSON body for POST /recognize. Fields the caller did not give are left out; the API validates the rest. */
export function buildRecognizeBody(args: z.infer<typeof recognizeBookshelfSchema>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (args.image_url !== undefined) body.image_url = args.image_url;
  if (args.image_base64 !== undefined) body.image_base64 = args.image_base64;
  if (args.images !== undefined) body.images = args.images;
  if (args.cover_index !== undefined) body.cover_index = args.cover_index;
  if (args.title !== undefined) body.title = args.title;
  return body;
}

export async function recognizeBookshelf(
  client: SpinesClient,
  config: Config,
  args: z.infer<typeof recognizeBookshelfSchema>
) {
  // Build BYOK headers if configured
  const extraHeaders: Record<string, string> = {};
  if (config.llmProvider && config.llmApiKey) {
    extraHeaders['X-LLM-Provider'] = config.llmProvider;
    extraHeaders['X-LLM-API-Key'] = config.llmApiKey;
  }

  // Submit recognition job
  let result: Record<string, unknown>;
  try {
    result = await client.postWithHeaders<Record<string, unknown>>(
      '/recognize', buildRecognizeBody(args), extraHeaders, { timeoutMs: RECOGNIZE_POST_TIMEOUT_MS },
    );
  } catch (err) {
    if (err instanceof SpinesApiError && err.code === 'TIMEOUT') {
      // The server may still finish and create the collection; resending would charge again.
      throw new SpinesApiError(0, 'TIMEOUT', `${err.message}. The collection may still be created: check list_collections before trying again.`);
    }
    throw err;
  }

  // If already complete (fast path), return immediately
  if (result.status === 'complete') {
    return result;
  }

  // Poll for completion. From here the collection exists and is charged, so a
  // failed poll must never end the call without its job_id: keep polling, and
  // at the deadline return what is known.
  const jobId = result.job_id as string;
  const startTime = Date.now();
  let last: Record<string, unknown> = result;
  let lastError: string | undefined;

  while (Date.now() - startTime < POLL_TIMEOUT_MS) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

    try {
      const status = await client.get<Record<string, unknown>>(`/recognize/${jobId}`);
      last = status;
      lastError = undefined;
      if (status.status === 'complete' || status.status === 'failed') {
        return status;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  // Deadline: book matching may still be running on the server.
  return lastError ? { ...last, last_poll_error: lastError } : last;
}
