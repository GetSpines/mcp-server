import { z } from 'zod';
import type { SpinesClient } from '../client.js';
import type { Config } from '../config.js';

export const recognizeBookshelfSchema = z.object({
  title: z.string().optional().describe('Optional title for the new collection'),
  image_url: z.string().optional().describe('URL of the bookshelf image'),
  image_base64: z.string().optional().describe('Base64-encoded image data (provide this OR image_url)'),
});

export const recognizeBookshelfAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
};

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120000;

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
  const result = await client.postWithHeaders<Record<string, unknown>>('/recognize', {
    image_url: args.image_url,
    image_base64: args.image_base64,
    title: args.title,
  }, extraHeaders);

  // If already complete (fast path), return immediately
  if (result.status === 'complete') {
    return result;
  }

  // Poll for completion
  const jobId = result.job_id as string;
  const startTime = Date.now();

  while (Date.now() - startTime < POLL_TIMEOUT_MS) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

    const status = await client.get<Record<string, unknown>>(`/recognize/${jobId}`);

    if (status.status === 'complete' || status.status === 'failed') {
      return status;
    }
  }

  // Timeout — return last known status
  return client.get(`/recognize/${jobId}`);
}
