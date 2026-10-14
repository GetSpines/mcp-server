import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildRecognizeBody,
  recognizeBookshelf,
  recognizeBookshelfSchema,
  RECOGNIZE_POST_TIMEOUT_MS,
} from '../src/tools/recognize-bookshelf.js';
import { SpinesClient, SpinesApiError } from '../src/client.js';

const config = { apiKey: 'gtspn_test_abc123', apiUrl: 'https://getspines.com/api/v1', debug: false };

describe('buildRecognizeBody', () => {
  it('sends a single image_url as before (1.0.x callers keep working)', () => {
    expect(buildRecognizeBody({ image_url: 'https://x.test/a.jpg', title: 'Mine' })).toEqual({
      image_url: 'https://x.test/a.jpg',
      title: 'Mine',
    });
  });

  it('sends images[] and cover_index, and no singular fields', () => {
    const body = buildRecognizeBody({
      images: [{ image_url: 'https://x.test/a.jpg' }, { image_base64: 'QUJD' }],
      cover_index: 1,
    });
    expect(body).toEqual({
      images: [{ image_url: 'https://x.test/a.jpg' }, { image_base64: 'QUJD' }],
      cover_index: 1,
    });
    expect(body).not.toHaveProperty('image_url');
    expect(body).not.toHaveProperty('image_base64');
  });

  it('omits cover_index when not given (the API defaults to the first photo)', () => {
    expect(buildRecognizeBody({ images: [{ image_url: 'https://x.test/a.jpg' }] })).toEqual({
      images: [{ image_url: 'https://x.test/a.jpg' }],
    });
  });

  it('passes mixed singular + images through so the API reports the conflict', () => {
    const body = buildRecognizeBody({ image_url: 'https://x.test/a.jpg', images: [{ image_url: 'https://x.test/b.jpg' }] });
    expect(body).toHaveProperty('image_url');
    expect(body).toHaveProperty('images');
  });
});

describe('recognizeBookshelfSchema', () => {
  it('accepts images with cover_index', () => {
    const parsed = recognizeBookshelfSchema.parse({
      images: [{ image_url: 'https://x.test/a.jpg' }, { image_url: 'https://x.test/b.jpg' }],
      cover_index: 1,
    });
    expect(parsed.images).toHaveLength(2);
    expect(parsed.cover_index).toBe(1);
  });

  it('rejects a non-integer cover_index', () => {
    expect(() => recognizeBookshelfSchema.parse({ images: [{ image_url: 'https://x.test/a.jpg' }], cover_index: 0.5 })).toThrow();
  });
});

describe('recognizeBookshelf', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('POSTs images[] to /recognize with the long timeout and returns a complete result', async () => {
    const client = new SpinesClient(config);
    const spy = vi.spyOn(client, 'postWithHeaders').mockResolvedValue({ status: 'complete', collection_id: 'c1' });

    const result = await recognizeBookshelf(client, config, {
      images: [{ image_url: 'https://x.test/a.jpg' }, { image_url: 'https://x.test/b.jpg' }],
      cover_index: 1,
    });

    expect(result).toEqual({ status: 'complete', collection_id: 'c1' });
    expect(spy).toHaveBeenCalledWith(
      '/recognize',
      { images: [{ image_url: 'https://x.test/a.jpg' }, { image_url: 'https://x.test/b.jpg' }], cover_index: 1 },
      {},
      { timeoutMs: RECOGNIZE_POST_TIMEOUT_MS },
    );
  });

  it('keeps polling through a failed poll and returns the finished job', async () => {
    vi.useFakeTimers();
    try {
      const client = new SpinesClient(config);
      vi.spyOn(client, 'postWithHeaders').mockResolvedValue({ job_id: 'j1', status: 'processing' });
      const get = vi.spyOn(client, 'get')
        .mockRejectedValueOnce(new SpinesApiError(500, 'UNKNOWN', 'Internal Server Error'))
        .mockResolvedValueOnce({ job_id: 'j1', status: 'complete', collection_id: 'j1' });

      const pending = recognizeBookshelf(client, config, { image_url: 'https://x.test/a.jpg' });
      await vi.advanceTimersByTimeAsync(5000);

      expect(await pending).toEqual({ job_id: 'j1', status: 'complete', collection_id: 'j1' });
      expect(get).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('when status cannot be read at all, still returns the job_id instead of an error', async () => {
    vi.useFakeTimers();
    try {
      const client = new SpinesClient(config);
      vi.spyOn(client, 'postWithHeaders').mockResolvedValue({ job_id: 'j1', status: 'processing', poll_url: '/api/v1/recognize/j1' });
      vi.spyOn(client, 'get').mockRejectedValue(new SpinesApiError(500, 'UNKNOWN', 'Internal Server Error'));

      const pending = recognizeBookshelf(client, config, { image_url: 'https://x.test/a.jpg' });
      await vi.advanceTimersByTimeAsync(130_000);
      const result = (await pending) as Record<string, unknown>;

      expect(result.job_id).toBe('j1');
      expect(result.status).toBe('processing');
      expect(String(result.last_poll_error)).toContain('Internal Server Error');
    } finally {
      vi.useRealTimers();
    }
  });

  it('on a POST timeout, warns that the collection may still appear instead of inviting a paid retry', async () => {
    const client = new SpinesClient(config);
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('timed out', 'TimeoutError'));

    const err = await recognizeBookshelf(client, config, { image_url: 'https://x.test/a.jpg' }).catch((e) => e);

    expect(err.code).toBe('TIMEOUT');
    expect(err.message).toContain('check list_collections before trying again');
  });
});
