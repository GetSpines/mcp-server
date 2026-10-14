# SPINES MCP Server

Access [SPINES](https://getspines.com) book collections, reading lists, and bookshelf data from AI assistants via the [Model Context Protocol](https://modelcontextprotocol.io).

## Features

- Recognize books from photos of a bookshelf; several photos of one shelf become one collection
- Search books by title, author, or ISBN
- Browse and filter book collections
- Manage reading lists (add and remove books)
- Explore personas, categories, and books commonly shelved together
- AI prompts for shelf analysis and book recommendations

## Quick Start

### Prerequisites

- Node.js 18+
- A SPINES API key ([get one here](https://getspines.com/settings/developer))

### Installation

```bash
npm install -g @spines/mcp-server
```

### Configuration

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "spines": {
      "command": "npx",
      "args": ["-y", "@spines/mcp-server"],
      "env": {
        "SPINES_API_KEY": "gtspn_live_your_key_here"
      }
    }
  }
}
```

#### VS Code / Cursor

Add to your MCP settings:

```json
{
  "spines": {
    "command": "npx",
    "args": ["-y", "@spines/mcp-server"],
    "env": {
      "SPINES_API_KEY": "gtspn_live_your_key_here"
    }
  }
}
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SPINES_API_KEY` | Yes | - | Your API key |
| `SPINES_API_URL` | No | `https://getspines.com/api/v1` | API base URL |
| `SPINES_DEBUG` | No | `false` | Verbose logging to stderr |
| `SPINES_LLM_PROVIDER` | No | - | Bring your own LLM key for `recognize_bookshelf`; only `gemini` is accepted. Set together with `SPINES_LLM_API_KEY` |
| `SPINES_LLM_API_KEY` | No | - | Your provider API key. With both set, recognition uses your key and no SPINES credits |

## Tools

### Read Tools

| Tool | Description |
|------|-------------|
| `search_books` | Search for books by title, author, or ISBN |
| `get_book_details` | Get full details for a specific book |
| `get_collection` | Get a book collection with all its books |
| `list_collections` | List your collections with optional filters |
| `list_categories` | List all approved book categories |
| `get_persona` | Get details about a persona |
| `get_book_pairings` | Find books commonly shelved together with a book (Shelfology) |
| `check_credits` | Check your daily recognition credit balance |

### Write Tools

| Tool | Description |
|------|-------------|
| `add_to_reading_list` | Add a book to a reading list |
| `remove_from_reading_list` | Remove a book from a reading list |
| `recognize_bookshelf` | Recognize books from one or more bookshelf photos and save them as a collection (uses credits) |

### Tool Details

#### `search_books`
```
query: string    - Search query (title, author, or ISBN)
limit?: number   - Max results (1-50, default 10)
```

#### `get_book_details`
```
book_id: string  - The book's unique ID
```

#### `get_collection`
```
collection_id: string  - The collection's unique ID
```

#### `list_collections`
```
limit?: number        - Max results (1-50, default 20)
cursor?: string       - Pagination cursor
persona_id?: string   - Filter by persona
category_id?: string  - Filter by category
```

#### `list_categories`
```
(no arguments)
```

#### `get_persona`
```
persona_id: string  - The persona's unique ID
```

#### `get_book_pairings`
```
book_id: string  - The book to find pairings for
limit?: number   - Max results (1-50, default 10)
```

#### `check_credits`
```
(no arguments)
```

#### `add_to_reading_list`
```
book_id: string      - The book to add
list_name?: string   - List name (default: "want_to_read")
```

#### `remove_from_reading_list`
```
entry_id: string     - The reading list entry ID to remove
```

#### `recognize_bookshelf`
```
image_url?: string     - URL of a single photo
image_base64?: string  - Base64-encoded single photo
images?: array         - Several photos of one bookshelf, saved as ONE collection;
                         each entry is { image_url } or { image_base64 }
cover_index?: number   - Zero-based index into images of the cover photo (default 0)
title?: string         - Title for the new collection
```

Send either `image_url` / `image_base64` **or** `images`, not both. Example:

```json
{
  "images": [
    { "image_url": "https://example.com/shelf-left.jpg" },
    { "image_url": "https://example.com/shelf-right.jpg" }
  ],
  "cover_index": 1,
  "title": "Living room"
}
```

- **Photo limit:** 4 per request with a regular key. A book that appears on two photos is kept once.
- **Credits:** each photo uses one credit; the request needs at least one to start. With `SPINES_LLM_PROVIDER` / `SPINES_LLM_API_KEY` set, no credits are used.
- **Prefer URLs.** Base64 photos over 4 MB in total do not fit in one request.
- **Duplicates:** a photo already in SPINES fails the whole request (`RECOGNIZE_IMAGE_DUPLICATE`, with the index of that photo).
- **Timing:** the tool waits while the server reads every photo, then polls until book matching finishes (up to 2 minutes). It returns the finished collection, or the job's current status (with its `job_id`) if matching is still running or its status could not be read. If the first step times out (5 minutes), the collection may still be created: check `list_collections` before trying again, since a retry uses credits again.

## Resources

| URI | Description |
|-----|-------------|
| `spines://collection/{id}` | A book collection with metadata |
| `spines://book/{id}` | Full book details |
| `spines://persona/{id}` | Persona profile and collections |
| `spines://reading-lists` | User's reading lists |

## Prompts

| Prompt | Description |
|--------|-------------|
| `analyze_shelf` | Analyze a collection for themes and reading patterns |
| `recommend_books` | Get recommendations based on your library |
| `compare_collections` | Compare two collections for similarities |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "SPINES_API_KEY is required" | Set the env var in your MCP client config |
| 401 errors | Check your API key is valid and not expired |
| 403 errors | Your key may lack required scopes |
| 429 errors | Rate limited — wait and retry |
| `TIMEOUT` from `recognize_bookshelf` | The server may still be working; check `list_collections` before resending |
| Tools not appearing | Restart your MCP client |

## Development

```bash
git clone https://github.com/GetSpines/mcp-server
cd mcp-server
npm install
npm run build
npm test
```

## License

MIT
