# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-10-14

### Added
- `recognize_bookshelf` accepts `images` (several photos of one bookshelf, saved as one collection) and `cover_index` (which photo is the cover). `image_url` / `image_base64` keep working for one photo. Needs the SPINES API from 2026-10-14 (developer changelog v1.3.0).
- Every API request has a deadline: 30 s by default, 5 minutes for the `recognize_bookshelf` submission, which waits until the server has read every photo. A timeout returns error code `TIMEOUT`; for recognition it says to check `list_collections` before resending, because a retry is charged again.
- README documents the five tools that were missing from it: `recognize_bookshelf`, `check_credits`, `get_book_pairings`, `get_persona`, `list_categories`, and the `SPINES_LLM_PROVIDER` / `SPINES_LLM_API_KEY` variables.

### Fixed
- `recognize_bookshelf` threw on the first failed status poll, so the assistant got an error and no `job_id` for a collection that had been created and charged. It now keeps polling through failed polls and, at the 2-minute deadline, returns the job's last known status with `last_poll_error`.
- API error `details` were dropped. Errors now include them, e.g. `RECOGNIZE_IMAGE_DUPLICATE` names `duplicate_image_index` and `original_collection_id`.
- The User-Agent and the MCP handshake reported version `1.0.0-beta.1`; both now report the package version (a test keeps `package.json`, `server.json` and the code in step).

## [1.0.3] - 2026-10-14

### Security
- Default `SPINES_API_URL` was `https://spins.app/api/v1`, a domain SPINES does not own. Without the variable set, every request sent the API key as a Bearer token to that host. The default is now `https://getspines.com/api/v1`. **If you ran 1.0.2 or earlier without `SPINES_API_URL`, revoke your key and create a new one at https://getspines.com/settings/developer.**

### Fixed
- README and the missing-key error message linked to `spins.app`; they now link to `getspines.com`.

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
