import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { listChannels, name, config } from './list-channels.js'

const mockChannel = {
  disableFillerOverlay: false,
  duration: 3600000,
  groupTitle: 'Movies',
  guideMinimumDuration: 300000,
  icon: {
    path: '/icon.png',
    width: 100,
    duration: 0,
    position: 'bottom-right'
  },
  id: 'channel-1',
  name: 'Test Channel',
  number: 1,
  offline: {
    mode: 'pic'
  },
  startTime: 0,
  stealth: false,
  onDemand: {
    enabled: true
  },
  programCount: 10,
  streamMode: 'hls',
  transcodeConfigId: 'default',
  subtitlesEnabled: false
}

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('list_channels tool', () => {
  it('exports a tool name', () => {
    expect(name).toBe('list_channels')
  })

  it('exports a valid config object', () => {
    expect(config).toMatchObject({
      title: 'List Channels',
      description: 'Get channels',
      inputSchema: undefined,
      annotations: {
        readOnlyHint: true
      }
    })
    expect(config.outputSchema).toBeDefined()
  })
})

describe('listChannels', () => {
  const testServer = 'http://test-server:8000'

  it('returns channels on successful response', async () => {
    server.use(
      http.get(`${testServer}/api/channels`, () => {
        return HttpResponse.json([mockChannel])
      })
    )

    const result = await listChannels({ server: testServer })

    expect(result.channels).toHaveLength(1)
    expect(result.channels[0].id).toBe('channel-1')
    expect(result.channels[0].name).toBe('Test Channel')
    expect(result.channels[0].number).toBe(1)
  })

  it('returns empty array when no channels exist', async () => {
    server.use(
      http.get(`${testServer}/api/channels`, () => {
        return HttpResponse.json([])
      })
    )

    const result = await listChannels({ server: testServer })

    expect(result.channels).toHaveLength(0)
  })

  it('throws error when response is not ok', async () => {
    server.use(
      http.get(`${testServer}/api/channels`, () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    await expect(listChannels({ server: testServer })).rejects.toThrow('Unable to list channels')
  })

  it('throws error when response is 404', async () => {
    server.use(
      http.get(`${testServer}/api/channels`, () => {
        return new HttpResponse(null, { status: 404 })
      })
    )

    await expect(listChannels({ server: testServer })).rejects.toThrow('Unable to list channels')
  })

  it('throws validation error for invalid channel data', async () => {
    server.use(
      http.get(`${testServer}/api/channels`, () => {
        return HttpResponse.json([{ invalid: 'data' }])
      })
    )

    await expect(listChannels({ server: testServer })).rejects.toThrow()
  })

  it('throws ZodError when channel is missing required fields', async () => {
    const incompleteChannel = {
      id: 'channel-1',
      name: 'Test Channel',
      number: 1
      // missing required fields: duration, groupTitle, icon, offline, etc.
    }

    server.use(
      http.get(`${testServer}/api/channels`, () => {
        return HttpResponse.json([incompleteChannel])
      })
    )

    await expect(listChannels({ server: testServer })).rejects.toThrow()
  })
})
