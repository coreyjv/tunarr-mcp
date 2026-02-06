import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

import * as listChannelsTool from './channels/list-channels.js'
import * as listMoviesInChannelTool from './channels/list-movies-in-channel.js'
import * as listShowsInChannelTool from './channels/list-shows-in-channel.js'
import * as listMediaSourcesTool from './media-sources/list-media-sources.js'

// Create server instance
const server = new McpServer({
  name: 'tunarr',
  version: '0.0.1'
})

const TUNARR_HOST = z.string().parse(process.env.TUNARR_HOST)

server.registerTool(listChannelsTool.name, listChannelsTool.config, async () => {
  console.error(`Calling list with host: ${TUNARR_HOST}`)
  const result = await listChannelsTool.listChannels({ server: TUNARR_HOST })
  console.error(JSON.stringify(result, null, 2))
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }
    ],
    structuredContent: result
  }
})

server.registerTool(listMoviesInChannelTool.name, listMoviesInChannelTool.config, async ctx => {
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
})

server.registerTool(listShowsInChannelTool.name, listShowsInChannelTool.config, async ctx => {
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
})

server.registerTool(listMediaSourcesTool.name, listMediaSourcesTool.config, async () => {
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
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('High-level Output Schema Example Server running on stdio')
}

try {
  await main()
} catch (error) {
  console.error('Server error:', error)
  process.exit(1)
}
