import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { listShowsInChannel, name, config } from './list-shows-in-channel.js'

const mockShow = {
  uuid: 'show-uuid-1',
  canonicalId: 'canonical-1',
  sourceType: 'plex',
  externalId: 'ext-1',
  type: 'show',
  identifiers: [{ id: 'tt1234567', type: 'imdb' }],
  title: 'Test Show',
  sortTitle: 'Test Show',
  tags: ['drama', 'thriller'],
  mediaSourceId: 'source-1',
  libraryId: 'library-1',
  summary: 'A test show summary',
  plot: 'A test show plot',
  tagline: 'Best test show ever',
  rating: 'TV-14',
  releaseDate: 1672531200000,
  releaseDateString: '2023-01-01',
  year: 2023,
  childCount: 3,
  grandchildCount: 24
}

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('list_shows_in_channel tool', () => {
  it('exports a tool name', () => {
    expect(name).toBe('list_shows_in_channel')
  })

  it('exports a valid config object', () => {
    expect(config).toMatchObject({
      title: 'List Shows In Channel',
      description: 'Get shows in channel',
      annotations: {
        readOnlyHint: true
      }
    })
    expect(config.inputSchema).toBeDefined()
    expect(config.outputSchema).toBeDefined()
  })
})

describe('listShowsInChannel', () => {
  const testServer = 'http://test-server:8000'
  const channelId = 'channel-1'

  it('returns shows on successful response', async () => {
    server.use(
      http.get(`${testServer}/api/channels/${channelId}/shows`, () => {
        return HttpResponse.json({
          total: 1,
          result: [mockShow],
          size: 1
        })
      })
    )

    const result = await listShowsInChannel({
      server: testServer,
      id: channelId,
      offset: 0,
      limit: 50
    })

    expect(result.total).toBe(1)
    expect(result.shows).toHaveLength(1)
    expect(result.shows[0].title).toBe('Test Show')
    expect(result.shows[0].type).toBe('show')
    expect(result.size).toBe(1)
  })

  it('returns empty array when no shows exist', async () => {
    server.use(
      http.get(`${testServer}/api/channels/${channelId}/shows`, () => {
        return HttpResponse.json({
          total: 0,
          result: [],
          size: 0
        })
      })
    )

    const result = await listShowsInChannel({
      server: testServer,
      id: channelId,
      offset: 0,
      limit: 50
    })

    expect(result.total).toBe(0)
    expect(result.shows).toHaveLength(0)
    expect(result.size).toBe(0)
  })

  it('respects offset and limit parameters', async () => {
    server.use(
      http.get(`${testServer}/api/channels/${channelId}/shows`, ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('offset')).toBe('10')
        expect(url.searchParams.get('limit')).toBe('25')
        return HttpResponse.json({
          total: 100,
          result: [mockShow],
          size: 1
        })
      })
    )

    const result = await listShowsInChannel({
      server: testServer,
      id: channelId,
      offset: 10,
      limit: 25
    })

    expect(result.total).toBe(100)
    expect(result.size).toBe(1)
  })

  it('throws error when response is not ok', async () => {
    server.use(
      http.get(`${testServer}/api/channels/${channelId}/shows`, () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    await expect(
      listShowsInChannel({
        server: testServer,
        id: channelId,
        offset: 0,
        limit: 50
      })
    ).rejects.toThrow('Unable to list channels')
  })

  it('throws error when response is 404', async () => {
    server.use(
      http.get(`${testServer}/api/channels/${channelId}/shows`, () => {
        return new HttpResponse(null, { status: 404 })
      })
    )

    await expect(
      listShowsInChannel({
        server: testServer,
        id: channelId,
        offset: 0,
        limit: 50
      })
    ).rejects.toThrow('Unable to list channels')
  })

  it('throws validation error for invalid show data', async () => {
    server.use(
      http.get(`${testServer}/api/channels/${channelId}/shows`, () => {
        return HttpResponse.json({
          total: 1,
          result: [{ invalid: 'data' }],
          size: 1
        })
      })
    )

    await expect(
      listShowsInChannel({
        server: testServer,
        id: channelId,
        offset: 0,
        limit: 50
      })
    ).rejects.toThrow()
  })

  it('throws ZodError when show is missing required fields', async () => {
    const incompleteShow = {
      uuid: 'show-uuid-1',
      title: 'Test Show'
      // missing required fields
    }

    server.use(
      http.get(`${testServer}/api/channels/${channelId}/shows`, () => {
        return HttpResponse.json({
          total: 1,
          result: [incompleteShow],
          size: 1
        })
      })
    )

    await expect(
      listShowsInChannel({
        server: testServer,
        id: channelId,
        offset: 0,
        limit: 50
      })
    ).rejects.toThrow()
  })
})
