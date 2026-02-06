import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { listMoviesInChannel, name, config } from './list-movies-in-channel.js'

const mockMovie = {
  uuid: 'movie-uuid-1',
  canonicalId: 'canonical-1',
  sourceType: 'plex',
  externalId: 'ext-1',
  type: 'movie',
  identifiers: [{ id: 'tt1234567', type: 'imdb' }],
  title: 'Test Movie',
  sortTitle: 'Test Movie',
  tags: ['action', 'comedy'],
  mediaSourceId: 'source-1',
  libraryId: 'library-1',
  originalTitle: 'Test Movie Original',
  year: 2023,
  releaseDate: 1672531200000,
  releaseDateString: '2023-01-01',
  duration: 7200000,
  summary: 'A test movie summary',
  plot: 'A test movie plot',
  tagline: 'Best test movie ever',
  rating: 'PG-13'
}

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('list_movies_in_channel tool', () => {
  it('exports a tool name', () => {
    expect(name).toBe('list_movies_in_channel')
  })

  it('exports a valid config object', () => {
    expect(config).toMatchObject({
      title: 'List Movies In Channel',
      description: 'Get movies in channel',
      annotations: {
        readOnlyHint: true
      }
    })
    expect(config.inputSchema).toBeDefined()
    expect(config.outputSchema).toBeDefined()
  })
})

describe('listMoviesInChannel', () => {
  const testServer = 'http://test-server:8000'
  const channelId = 'channel-1'

  it('returns movies on successful response', async () => {
    server.use(
      http.get(`${testServer}/api/channels/${channelId}/programs`, ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('type')).toBe('movie')
        return HttpResponse.json({
          total: 1,
          result: [mockMovie],
          size: 1
        })
      })
    )

    const result = await listMoviesInChannel({
      server: testServer,
      id: channelId,
      offset: 0,
      limit: 50
    })

    expect(result.total).toBe(1)
    expect(result.movies).toHaveLength(1)
    expect(result.movies[0].title).toBe('Test Movie')
    expect(result.movies[0].type).toBe('movie')
    expect(result.size).toBe(1)
  })

  it('returns empty array when no movies exist', async () => {
    server.use(
      http.get(`${testServer}/api/channels/${channelId}/programs`, () => {
        return HttpResponse.json({
          total: 0,
          result: [],
          size: 0
        })
      })
    )

    const result = await listMoviesInChannel({
      server: testServer,
      id: channelId,
      offset: 0,
      limit: 50
    })

    expect(result.total).toBe(0)
    expect(result.movies).toHaveLength(0)
    expect(result.size).toBe(0)
  })

  it('respects offset and limit parameters', async () => {
    server.use(
      http.get(`${testServer}/api/channels/${channelId}/programs`, ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('offset')).toBe('10')
        expect(url.searchParams.get('limit')).toBe('25')
        return HttpResponse.json({
          total: 100,
          result: [mockMovie],
          size: 1
        })
      })
    )

    const result = await listMoviesInChannel({
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
      http.get(`${testServer}/api/channels/${channelId}/programs`, () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    await expect(
      listMoviesInChannel({
        server: testServer,
        id: channelId,
        offset: 0,
        limit: 50
      })
    ).rejects.toThrow('Unable to list channels')
  })

  it('throws error when response is 404', async () => {
    server.use(
      http.get(`${testServer}/api/channels/${channelId}/programs`, () => {
        return new HttpResponse(null, { status: 404 })
      })
    )

    await expect(
      listMoviesInChannel({
        server: testServer,
        id: channelId,
        offset: 0,
        limit: 50
      })
    ).rejects.toThrow('Unable to list channels')
  })

  it('throws validation error for invalid movie data', async () => {
    server.use(
      http.get(`${testServer}/api/channels/${channelId}/programs`, () => {
        return HttpResponse.json({
          total: 1,
          result: [{ invalid: 'data' }],
          size: 1
        })
      })
    )

    await expect(
      listMoviesInChannel({
        server: testServer,
        id: channelId,
        offset: 0,
        limit: 50
      })
    ).rejects.toThrow()
  })

  it('throws ZodError when movie is missing required fields', async () => {
    const incompleteMovie = {
      uuid: 'movie-uuid-1',
      title: 'Test Movie'
      // missing required fields
    }

    server.use(
      http.get(`${testServer}/api/channels/${channelId}/programs`, () => {
        return HttpResponse.json({
          total: 1,
          result: [incompleteMovie],
          size: 1
        })
      })
    )

    await expect(
      listMoviesInChannel({
        server: testServer,
        id: channelId,
        offset: 0,
        limit: 50
      })
    ).rejects.toThrow()
  })
})
