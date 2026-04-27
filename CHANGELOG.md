# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-04-27

### Added
- `@types/node` to devDependencies so `tsc` can resolve the `process` global (CI build was failing).
- `mcpName` field in `package.json` (`io.github.SuperAgentic/spines`).

### Changed
- Migrated `server.json` to the MCP registry `2025-12-11` schema (new `packages` array with `registryType`/`identifier`/`transport`/`environmentVariables`).
- CI Inspector step now launches the server via `node dist/index.js` to avoid `EACCES` when the build artifact lacks the executable bit.

## [1.0.0] - 2026-03-18

### Added
- 8 tools: search_books, get_book_details, get_collection, list_collections, list_categories, get_persona, add_to_reading_list, remove_from_reading_list
- 4 resources: collection, book, persona, reading-lists
- 3 prompts: analyze_shelf, recommend_books, compare_collections
- Authentication via SPINES API key
- Debug mode with verbose logging
- Configurable API URL

[1.0.2]: https://github.com/GetSpines/mcp-server/releases/tag/v1.0.2
[1.0.0]: https://github.com/GetSpines/mcp-server/releases/tag/v1.0.0
