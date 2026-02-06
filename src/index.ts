import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { LoggingLevel } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'

import * as listChannelsTool from './channels/list-channels.js'
import * as listMoviesInChannelTool from './channels/list-movies-in-channel.js'
import * as listShowsInChannelTool from './channels/list-shows-in-channel.js'
import * as listMediaSourcesTool from './media-sources/list-media-sources.js'
import * as searchProgramsTool from './programs/search-programs.js'

// Create server instance with logging capability
const server = new McpServer(
  {
    name: 'tunarr',
    version: '0.0.1'
  },
  {
    capabilities: {
      logging: {}
    }
  }
)

// Logging helper (fire-and-forget, errors are silently ignored)
function log(level: LoggingLevel, message: string, data?: Record<string, unknown>) {
  void server.server.sendLoggingMessage({
    level,
    logger: 'tunarr',
    data: data ? { message, ...data } : message
  })
}

const TUNARR_HOST = z.string().parse(process.env.TUNARR_HOST)

server.registerTool(listChannelsTool.name, listChannelsTool.config, async () => {
  log('debug', 'list_channels called', { host: TUNARR_HOST })

  try {
    const result = await listChannelsTool.listChannels({ server: TUNARR_HOST })
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ],
      structuredContent: result
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log('error', 'list_channels failed', { error: message })
    throw error
  }
})

server.registerTool(listMoviesInChannelTool.name, listMoviesInChannelTool.config, async ctx => {
  log('debug', 'list_movies_in_channel called', { id: ctx.id, limit: ctx.limit, offset: ctx.offset })

  try {
    const result = await listMoviesInChannelTool.listMoviesInChannel({
      id: ctx.id,
      limit: ctx.limit,
      offset: ctx.offset,
      server: TUNARR_HOST
    })

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ],
      structuredContent: result
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log('error', 'list_movies_in_channel failed', { error: message, id: ctx.id })
    throw error
  }
})

server.registerTool(listShowsInChannelTool.name, listShowsInChannelTool.config, async ctx => {
  log('debug', 'list_shows_in_channel called', { id: ctx.id, limit: ctx.limit, offset: ctx.offset })

  try {
    const result = await listShowsInChannelTool.listShowsInChannel({
      id: ctx.id,
      limit: ctx.limit,
      offset: ctx.offset,
      server: TUNARR_HOST
    })

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ],
      structuredContent: result
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log('error', 'list_shows_in_channel failed', { error: message, id: ctx.id })
    throw error
  }
})

server.registerTool(listMediaSourcesTool.name, listMediaSourcesTool.config, async () => {
  log('debug', 'list_media_sources called', { host: TUNARR_HOST })

  try {
    const result = await listMediaSourcesTool.listMediaSources({ server: TUNARR_HOST })

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ],
      structuredContent: result
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log('error', 'list_media_sources failed', { error: message })
    throw error
  }
})

server.registerTool(searchProgramsTool.name, searchProgramsTool.config, async ctx => {
  log('debug', 'search_programs called', {
    query: ctx.query,
    mediaSourceId: ctx.mediaSourceId,
    libraryId: ctx.libraryId,
    page: ctx.page,
    limit: ctx.limit
  })

  try {
    const result = await searchProgramsTool.searchPrograms({
      query: ctx.query,
      mediaSourceId: ctx.mediaSourceId,
      libraryId: ctx.libraryId,
      page: ctx.page,
      limit: ctx.limit,
      server: TUNARR_HOST
    })

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ],
      structuredContent: result
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log('error', 'search_programs failed', { error: message })
    throw error
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  log('info', 'Tunarr MCP server started', { host: TUNARR_HOST })
}

try {
  await main()
} catch (error) {
  console.error('Server error:', error)
  process.exit(1)
}
