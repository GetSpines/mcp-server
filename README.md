# SPINES MCP Server

Access [SPINES](https://spins.app) book collections, reading lists, and bookshelf data from AI assistants via the [Model Context Protocol](https://modelcontextprotocol.io).

## Features

- Search books by title, author, or ISBN
- Browse and filter book collections
- Manage reading lists (add and remove books)
- Explore personas and categories
- AI prompts for shelf analysis and book recommendations

## Quick Start

### Prerequisites

- Node.js 18+
- A SPINES API key ([get one here](https://spins.app/settings/developer))

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
| `SPINES_API_URL` | No | `https://spins.app/api/v1` | API base URL |
| `SPINES_DEBUG` | No | `false` | Verbose logging to stderr |

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

### Write Tools

| Tool | Description |
|------|-------------|
| `add_to_reading_list` | Add a book to a reading list |
| `remove_from_reading_list` | Remove a book from a reading list |

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

#### `add_to_reading_list`
```
book_id: string      - The book to add
list_name?: string   - List name (default: "want_to_read")
```

#### `remove_from_reading_list`
```
entry_id: string     - The reading list entry ID to remove
```

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
