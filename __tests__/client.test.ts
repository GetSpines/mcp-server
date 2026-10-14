import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpinesClient, SpinesApiError } from '../src/client.js';
import { VERSION } from '../src/version.js';

const mockConfig = {
  apiKey: 'gtspn_test_abc123',
  apiUrl: 'https://getspines.com/api/v1',
  debug: false,
};

describe('SpinesClient', () => {
  let client: SpinesClient;

  beforeEach(() => {
    client = new SpinesClient(mockConfig);
    vi.restoreAllMocks();
  });

  describe('get', () => {
    it('sends GET with auth header and returns data', async () => {
      const mockResponse = { data: { id: '1', title: 'Test Book' }, meta: {} };
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await client.get('/books/1');

      expect(fetch).toHaveBeenCalledWith(
        'https://getspines.com/api/v1/books/1',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer gtspn_test_abc123',
          }),
        })
      );
      expect(result).toEqual({ id: '1', title: 'Test Book' });
    });

    it('appends query params', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ data: [] }), { status: 200 })
      );

      await client.get('/books/search', { q: 'test', limit: '10' });

      const calledUrl = (fetch as any).mock.calls[0][0];
      expect(calledUrl).toContain('q=test');
      expect(calledUrl).toContain('limit=10');
    });

    it('throws SpinesApiError on non-200 response', async () => {
      const errorBody = JSON.stringify({ error: { code: 'BOOK_NOT_FOUND', message: 'Book not found' } });
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(errorBody, { status: 404 })
      );

      try {
        await client.get('/books/missing');
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(SpinesApiError);
        expect((err as SpinesApiError).status).toBe(404);
        expect((err as SpinesApiError).code).toBe('BOOK_NOT_FOUND');
      }
    });
  });

  describe('post', () => {
    it('sends POST with JSON body and returns data', async () => {
      const mockResponse = { data: { id: '1', added: true }, meta: {} };
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockResponse), { status: 201 })
      );

      const result = await client.post('/reading-lists', { book_id: 'b1', list_name: 'want_to_read' });

      expect(fetch).toHaveBeenCalledWith(
        'https://getspines.com/api/v1/reading-lists',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ book_id: 'b1', list_name: 'want_to_read' }),
        })
      );
      expect(result).toEqual({ id: '1', added: true });
    });
  });

  describe('error details', () => {
    it('keeps the API error details and shows them in the message', async () => {
      const body = {
        error: {
          code: 'RECOGNIZE_IMAGE_DUPLICATE',
          message: 'This image has already been uploaded',
          details: { original_collection_id: 'c-orig', duplicate_image_index: 1 },
        },
      };
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status: 409 }));

      const err = await client.post('/recognize', {}).catch((e) => e);

      expect(err).toBeInstanceOf(SpinesApiError);
      expect(err.details).toEqual({ original_collection_id: 'c-orig', duplicate_image_index: 1 });
      expect(err.message).toContain('"duplicate_image_index":1');
      expect(err.message).toContain('c-orig');
    });
  });

  describe('timeouts', () => {
    it('gives every request an abort signal and the current version in User-Agent', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ data: {} }), { status: 200 })
      );

      await client.get('/me/credits');

      const init = (fetch as any).mock.calls[0][1];
      expect(init.signal).toBeInstanceOf(AbortSignal);
      expect(init.headers['User-Agent']).toBe(`@spines/mcp-server/${VERSION}`);
    });

    it('turns a timed-out request into a TIMEOUT SpinesApiError', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(
        new DOMException('The operation was aborted due to timeout', 'TimeoutError')
      );

      const err = await client.postWithHeaders('/recognize', {}, {}, { timeoutMs: 1000 }).catch((e) => e);

      expect(err).toBeInstanceOf(SpinesApiError);
      expect(err.code).toBe('TIMEOUT');
      expect(err.message).toContain('/recognize');
    });

    it('rethrows network errors that are not timeouts', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));
      await expect(client.get('/books/1')).rejects.toThrow('fetch failed');
    });
  });

  describe('delete', () => {
    it('sends DELETE and returns data', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ data: { id: '1', deleted: true }, meta: {} }), { status: 200 })
      );

      const result = await client.delete('/reading-lists/1');
      expect(result).toEqual({ id: '1', deleted: true });
    });
  });
});

describe('SpinesApiError', () => {
  it('includes status, code, and message', () => {
    const err = new SpinesApiError(404, 'BOOK_NOT_FOUND', 'Book not found');
    expect(err.status).toBe(404);
    expect(err.code).toBe('BOOK_NOT_FOUND');
    expect(err.message).toContain('BOOK_NOT_FOUND');
    expect(err.message).toContain('Book not found');
    expect(err.name).toBe('SpinesApiError');
  });
});
