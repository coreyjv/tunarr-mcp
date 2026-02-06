import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { listMediaSources, name, config } from './list-media-sources.js'

const mockPlexSource = {
  id: 'plex-1',
  name: 'My Plex Server',
  uri: 'http://plex.local:32400',
  accessToken: 'token-123',
  userId: 'user-1',
  username: 'testuser',
  libraries: [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Movies',
      mediaType: 'movies',
      lastScannedAt: 1672531200000,
      externalKey: 'library-1',
      type: 'plex',
      enabled: true,
      isLocked: false
    }
  ],
  pathReplacements: [],
  type: 'plex',
  sendGuideUpdates: true,
  index: 0
}

const mockJellyfinSource = {
  id: 'jellyfin-1',
  name: 'My Jellyfin Server',
  uri: 'http://jellyfin.local:8096',
  accessToken: 'token-456',
  userId: null,
  username: null,
  libraries: [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'TV Shows',
      mediaType: 'shows',
      externalKey: 'library-2',
      type: 'jellyfin',
      enabled: true,
      isLocked: false
    }
  ],
  pathReplacements: [{ serverPath: '/media', localPath: '/mnt/media' }],
  type: 'jellyfin'
}

const mockLocalSource = {
  id: 'local-1',
  name: 'Local Movies',
  libraries: [
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Local Library',
      mediaType: 'movies',
      externalKey: 'local-lib',
      type: 'local',
      enabled: true,
      isLocked: false
    }
  ],
  pathReplacements: [],
  type: 'local',
  mediaType: 'movies',
  paths: ['/mnt/movies']
}

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('list_media_sources tool', () => {
  it('exports a tool name', () => {
    expect(name).toBe('list_media_sources')
  })

  it('exports a valid config object', () => {
    expect(config).toMatchObject({
      title: 'List Media Sources',
      description: 'Get configured media sources (Plex, Jellyfin, Emby, Local)',
      inputSchema: undefined,
      annotations: {
        readOnlyHint: true
      }
    })
    expect(config.outputSchema).toBeDefined()
  })
})

describe('listMediaSources', () => {
  const testServer = 'http://test-server:8000'

  it('returns media sources on successful response', async () => {
    server.use(
      http.get(`${testServer}/api/media-sources`, () => {
        return HttpResponse.json([mockPlexSource, mockJellyfinSource])
      })
    )

    const result = await listMediaSources({ server: testServer })

    expect(result.mediaSources).toHaveLength(2)
    expect(result.mediaSources[0].type).toBe('plex')
    expect(result.mediaSources[0].name).toBe('My Plex Server')
    expect(result.mediaSources[1].type).toBe('jellyfin')
  })

  it('returns empty array when no media sources exist', async () => {
    server.use(
      http.get(`${testServer}/api/media-sources`, () => {
        return HttpResponse.json([])
      })
    )

    const result = await listMediaSources({ server: testServer })

    expect(result.mediaSources).toHaveLength(0)
  })

  it('handles plex media source with all fields', async () => {
    server.use(
      http.get(`${testServer}/api/media-sources`, () => {
        return HttpResponse.json([mockPlexSource])
      })
    )

    const result = await listMediaSources({ server: testServer })
    const plex = result.mediaSources[0] as typeof mockPlexSource

    expect(plex.type).toBe('plex')
    expect(plex.sendGuideUpdates).toBe(true)
    expect(plex.index).toBe(0)
    expect(plex.uri).toBe('http://plex.local:32400')
  })

  it('handles local media source', async () => {
    server.use(
      http.get(`${testServer}/api/media-sources`, () => {
        return HttpResponse.json([mockLocalSource])
      })
    )

    const result = await listMediaSources({ server: testServer })
    const local = result.mediaSources[0] as typeof mockLocalSource

    expect(local.type).toBe('local')
    expect(local.mediaType).toBe('movies')
    expect(local.paths).toEqual(['/mnt/movies'])
  })

  it('throws error when response is not ok', async () => {
    server.use(
      http.get(`${testServer}/api/media-sources`, () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    await expect(listMediaSources({ server: testServer })).rejects.toThrow('Unable to list media sources')
  })

  it('throws error when response is 404', async () => {
    server.use(
      http.get(`${testServer}/api/media-sources`, () => {
        return new HttpResponse(null, { status: 404 })
      })
    )

    await expect(listMediaSources({ server: testServer })).rejects.toThrow('Unable to list media sources')
  })

  it('throws validation error for invalid media source data', async () => {
    server.use(
      http.get(`${testServer}/api/media-sources`, () => {
        return HttpResponse.json([{ invalid: 'data' }])
      })
    )

    await expect(listMediaSources({ server: testServer })).rejects.toThrow()
  })

  it('throws ZodError when media source is missing required fields', async () => {
    const incompleteSource = {
      id: 'source-1',
      name: 'Incomplete Source',
      type: 'plex'
      // missing required fields
    }

    server.use(
      http.get(`${testServer}/api/media-sources`, () => {
        return HttpResponse.json([incompleteSource])
      })
    )

    await expect(listMediaSources({ server: testServer })).rejects.toThrow()
  })
})
