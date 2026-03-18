#!/usr/bin/env node

/**
 * SPINES MCP Server
 * Access book collections, reading lists, and bookshelf data from AI assistants.
 *
 * Usage:
 *   SPINES_API_KEY=gtspn_live_xxx npx @spines/mcp-server
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config.js';
import { SpinesClient, SpinesApiError } from './client.js';

// Tools
import { searchBooksSchema, searchBooksAnnotations, searchBooks } from './tools/search-books.js';
import { getBookDetailsSchema, getBookDetailsAnnotations, getBookDetails } from './tools/get-book-details.js';
import { getCollectionSchema, getCollectionAnnotations, getCollection } from './tools/get-collection.js';
import { listCollectionsSchema, listCollectionsAnnotations, listCollections } from './tools/list-collections.js';
import { listCategoriesSchema, listCategoriesAnnotations, listCategories } from './tools/list-categories.js';
import { getPersonaSchema, getPersonaAnnotations, getPersona } from './tools/get-persona.js';
import { addToReadingListSchema, addToReadingListAnnotations, addToReadingList } from './tools/add-to-reading-list.js';
import { removeFromReadingListSchema, removeFromReadingListAnnotations, removeFromReadingList } from './tools/remove-from-reading-list.js';
import { checkCreditsSchema, checkCreditsAnnotations, checkCredits } from './tools/check-credits.js';
import { getBookPairingsSchema, getBookPairingsAnnotations, getBookPairings } from './tools/get-book-pairings.js';
import { recognizeBookshelfSchema, recognizeBookshelfAnnotations, recognizeBookshelf } from './tools/recognize-bookshelf.js';

// Resources
import { collectionResource, readCollection } from './resources/collection.js';
import { bookResource, readBook } from './resources/book.js';
import { personaResource, readPersona } from './resources/persona.js';
import { readingListResource, readReadingLists } from './resources/reading-list.js';

// Prompts
import { z } from 'zod';
import { buildAnalyzeShelfMessages } from './prompts/analyze-shelf.js';
import { buildRecommendBooksMessages } from './prompts/recommend-books.js';
import { buildCompareCollectionsMessages } from './prompts/compare-collections.js';

// --- Bootstrap ---

const config = loadConfig();
const client = new SpinesClient(config);

const server = new McpServer({
  name: 'spines',
  version: '1.0.0-beta.1',
});

// --- Helper: wrap tool handler with error handling ---

function handleApiError(err: unknown): { content: Array<{ type: 'text'; text: string }>; isError: true } {
  if (err instanceof SpinesApiError) {
    return {
      content: [{ type: 'text', text: `Error [${err.code}]: ${err.message}` }],
      isError: true,
    };
  }
  const msg = err instanceof Error ? err.message : String(err);
  return {
    content: [{ type: 'text', text: `Unexpected error: ${msg}` }],
    isError: true,
  };
}

function jsonResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

// --- Register Tools ---

server.tool('search_books', 'Search for books by title, author, or ISBN', searchBooksSchema.shape, searchBooksAnnotations, async (args) => {
  try {
    return jsonResult(await searchBooks(client, args));
  } catch (err) { return handleApiError(err); }
});

server.tool('get_book_details', 'Get full details for a specific book', getBookDetailsSchema.shape, getBookDetailsAnnotations, async (args) => {
  try {
    return jsonResult(await getBookDetails(client, args));
  } catch (err) { return handleApiError(err); }
});

server.tool('get_collection', 'Get a book collection with all its books', getCollectionSchema.shape, getCollectionAnnotations, async (args) => {
  try {
    return jsonResult(await getCollection(client, args));
  } catch (err) { return handleApiError(err); }
});

server.tool('list_collections', "List the user's collections with optional filters", listCollectionsSchema.shape, listCollectionsAnnotations, async (args) => {
  try {
    return jsonResult(await listCollections(client, args));
  } catch (err) { return handleApiError(err); }
});

server.tool('list_categories', 'List all approved book categories', listCategoriesSchema.shape, listCategoriesAnnotations, async () => {
  try {
    return jsonResult(await listCategories(client));
  } catch (err) { return handleApiError(err); }
});

server.tool('get_persona', 'Get details about a persona (bookshelf owner)', getPersonaSchema.shape, getPersonaAnnotations, async (args) => {
  try {
    return jsonResult(await getPersona(client, args));
  } catch (err) { return handleApiError(err); }
});

server.tool('add_to_reading_list', 'Add a book to a reading list', addToReadingListSchema.shape, addToReadingListAnnotations, async (args) => {
  try {
    return jsonResult(await addToReadingList(client, args));
  } catch (err) { return handleApiError(err); }
});

server.tool('remove_from_reading_list', 'Remove a book from a reading list', removeFromReadingListSchema.shape, removeFromReadingListAnnotations, async (args) => {
  try {
    return jsonResult(await removeFromReadingList(client, args));
  } catch (err) { return handleApiError(err); }
});

server.tool('check_credits', 'Check your daily recognition credit balance', checkCreditsSchema.shape, checkCreditsAnnotations, async () => {
  try {
    return jsonResult(await checkCredits(client));
  } catch (err) { return handleApiError(err); }
});

server.tool('get_book_pairings', 'Find books commonly co-shelved with a specific book (Shelfology)', getBookPairingsSchema.shape, getBookPairingsAnnotations, async (args) => {
  try {
    return jsonResult(await getBookPairings(client, args));
  } catch (err) { return handleApiError(err); }
});

server.tool('recognize_bookshelf', 'Recognize books from a bookshelf image (uses daily credits or BYOK)', recognizeBookshelfSchema.shape, recognizeBookshelfAnnotations, async (args) => {
  try {
    return jsonResult(await recognizeBookshelf(client, config, args));
  } catch (err) { return handleApiError(err); }
});

// --- Register Resources ---

server.resource(collectionResource.name, collectionResource.uriTemplate, { description: collectionResource.description, mimeType: collectionResource.mimeType }, async (uri) => {
  const id = uri.pathname.split('/').pop()!;
  const data = await readCollection(client, id);
  return { contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
});

server.resource(bookResource.name, bookResource.uriTemplate, { description: bookResource.description, mimeType: bookResource.mimeType }, async (uri) => {
  const id = uri.pathname.split('/').pop()!;
  const data = await readBook(client, id);
  return { contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
});

server.resource(personaResource.name, personaResource.uriTemplate, { description: personaResource.description, mimeType: personaResource.mimeType }, async (uri) => {
  const id = uri.pathname.split('/').pop()!;
  const data = await readPersona(client, id);
  return { contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
});

server.resource(readingListResource.name, readingListResource.uriTemplate, { description: readingListResource.description, mimeType: readingListResource.mimeType }, async (uri) => {
  const data = await readReadingLists(client);
  return { contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
});

// --- Register Prompts ---

server.prompt('analyze_shelf', { collection_id: z.string().describe('The collection ID to analyze') }, ({ collection_id }) => {
  return { messages: buildAnalyzeShelfMessages(collection_id) };
});

server.prompt('recommend_books', { based_on: z.string().describe('Reading list name or collection ID') }, ({ based_on }) => {
  return { messages: buildRecommendBooksMessages(based_on) };
});

server.prompt('compare_collections', { collection_a: z.string().describe('First collection ID'), collection_b: z.string().describe('Second collection ID') }, ({ collection_a, collection_b }) => {
  return { messages: buildCompareCollectionsMessages(collection_a, collection_b) };
});

// --- Start ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[SPINES MCP] Server started');
}

main().catch((err) => {
  console.error('[SPINES MCP] Fatal error:', err);
  process.exit(1);
});
