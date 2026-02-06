# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that provides tools for querying a Tunarr backend. Tunarr is a TV channel/streaming platform. The server exposes three read-only tools: `list_channels`, `list_channel_movies`, and `list_channel_shows`.

## Commands

```bash
npm run build       # Compile TypeScript and make output executable
npm test            # Run tests once
npm run test:watch  # Run tests in watch mode
```

## Architecture

**Entry Point:** `src/index.ts` - Creates the MCP server instance and registers tools using `@modelcontextprotocol/sdk`. Uses stdio transport for communication with MCP clients.

**API Client:** `src/channels.ts` - Contains functions that make HTTP requests to the Tunarr REST API. The base URL defaults to `http://192.168.0.198:8000/api`.

**Tool Registration Pattern:**

- Each tool is registered with `server.registerTool()`
- Input/output schemas use Zod for validation
- Tools return both text content and structured content
- All tools are annotated with `readOnlyHint: true`

## Key Dependencies

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `zod` - Schema validation for tool inputs/outputs

## Runtime

Node.js v22.12.0 (specified in `.nvmrc`)
