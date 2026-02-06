import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { searchPrograms, name, config } from './search-programs.js'

const mockMovie = {
  uuid: '550e8400-e29b-41d4-a716-446655440000',
  canonicalId: 'canonical-1',
  sourceType: 'plex',
  externalId: 'ext-1',
  type: 'movie',
  identifiers: [{ id: 'tt1234567', type: 'imdb' }],
  title: 'The Matrix',
  sortTitle: 'Matrix',
  tags: ['action', 'sci-fi'],
  mediaSourceId: 'source-1',
  libraryId: 'library-1',
  originalTitle: 'The Matrix',
  year: 1999,
  releaseDate: 922060800000,
  releaseDateString: '1999-03-31',
  duration: 8160000,
  summary: 'A computer hacker learns about the true nature of reality',
  rating: 'R'
}

const mockShow = {
  uuid: '550e8400-e29b-41d4-a716-446655440001',
  canonicalId: 'canonical-2',
  sourceType: 'jellyfin',
  externalId: 'ext-2',
  type: 'show',
  identifiers: [{ id: 'tt0944947', type: 'imdb' }],
  title: 'Game of Thrones',
  sortTitle: 'Game of Thrones',
  tags: ['drama', 'fantasy'],
  mediaSourceId: 'source-1',
  libraryId: 'library-2',
  summary: 'Nine noble families fight for control of Westeros',
  rating: 'TV-MA',
  year: 2011,
  childCount: 8,
  grandchildCount: 73
}

const mockEpisode = {
  uuid: '550e8400-e29b-41d4-a716-446655440002',
  canonicalId: 'canonical-3',
  sourceType: 'plex',
  externalId: 'ext-3',
  type: 'episode',
  identifiers: [],
  title: 'Winter Is Coming',
  sortTitle: 'Winter Is Coming',
  tags: [],
  mediaSourceId: 'source-1',
  libraryId: 'library-2',
  duration: 3600000,
  episodeNumber: 1,
  summary: 'The first episode of Game of Thrones'
}

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('search_programs tool', () => {
  it('exports a tool name', () => {
    expect(name).toBe('search_programs')
  })

  it('exports a valid config object', () => {
    expect(config).toMatchObject({
      title: 'Search Programs',
      description: 'Search for programs (movies, shows, episodes, music) across media sources',
      annotations: {
        readOnlyHint: true
      }
    })
    expect(config.inputSchema).toBeDefined()
    expect(config.outputSchema).toBeDefined()
  })
})

describe('searchPrograms', () => {
  const testServer = 'http://test-server:8000'

  it('returns results on successful search', async () => {
    server.use(
      http.post(`${testServer}/api/programs/search`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        expect(body.query).toEqual({ query: 'matrix' })
        return HttpResponse.json({
          results: [mockMovie]
        })
      })
    )

    const result = await searchPrograms({
      server: testServer,
      query: { query: 'matrix' },
      page: 1,
      limit: 50
    })

    expect(result.results).toHaveLength(1)
    expect(result.results[0].type).toBe('movie')
    expect(result.results[0].title).toBe('The Matrix')
  })

  it('returns empty array when no results found', async () => {
    server.use(
      http.post(`${testServer}/api/programs/search`, () => {
        return HttpResponse.json({
          results: []
        })
      })
    )

    const result = await searchPrograms({
      server: testServer,
      query: { query: 'nonexistent' },
      page: 1,
      limit: 50
    })

    expect(result.results).toHaveLength(0)
  })

  it('returns multiple result types', async () => {
    server.use(
      http.post(`${testServer}/api/programs/search`, () => {
        return HttpResponse.json({
          results: [mockMovie, mockShow, mockEpisode]
        })
      })
    )

    const result = await searchPrograms({
      server: testServer,
      query: { query: 'game' },
      page: 1,
      limit: 50
    })

    expect(result.results).toHaveLength(3)
    expect(result.results[0].type).toBe('movie')
    expect(result.results[1].type).toBe('show')
    expect(result.results[2].type).toBe('episode')
  })

  it('sends query object with sort configuration', async () => {
    server.use(
      http.post(`${testServer}/api/programs/search`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        expect(body.query).toEqual({
          query: 'matrix',
          sort: { field: 'year', direction: 'desc' }
        })
        return HttpResponse.json({
          results: [mockMovie]
        })
      })
    )

    await searchPrograms({
      server: testServer,
      query: {
        query: 'matrix',
        sort: { field: 'year', direction: 'desc' }
      },
      page: 1,
      limit: 50
    })
  })

  it('sends query object with filter configuration', async () => {
    server.use(
      http.post(`${testServer}/api/programs/search`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        const query = body.query as Record<string, unknown>
        expect(query.filter).toEqual({
          type: 'value',
          fieldSpec: {
            key: 'year',
            name: 'Year',
            type: 'numeric',
            op: '>=',
            value: 2000
          }
        })
        return HttpResponse.json({
          results: [mockMovie]
        })
      })
    )

    await searchPrograms({
      server: testServer,
      query: {
        query: 'action',
        filter: {
          type: 'value',
          fieldSpec: {
            key: 'year',
            name: 'Year',
            type: 'numeric',
            op: '>=',
            value: 2000
          }
        }
      },
      page: 1,
      limit: 50
    })
  })

  it('includes mediaSourceId in request when provided', async () => {
    server.use(
      http.post(`${testServer}/api/programs/search`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        expect(body.mediaSourceId).toBe('source-1')
        return HttpResponse.json({
          results: [mockMovie]
        })
      })
    )

    await searchPrograms({
      server: testServer,
      query: { query: 'matrix' },
      mediaSourceId: 'source-1',
      page: 1,
      limit: 50
    })
  })

  it('includes libraryId in request when provided', async () => {
    server.use(
      http.post(`${testServer}/api/programs/search`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        expect(body.libraryId).toBe('library-1')
        return HttpResponse.json({
          results: [mockMovie]
        })
      })
    )

    await searchPrograms({
      server: testServer,
      query: { query: 'matrix' },
      libraryId: 'library-1',
      page: 1,
      limit: 50
    })
  })

  it('includes page and limit in request', async () => {
    server.use(
      http.post(`${testServer}/api/programs/search`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        expect(body.page).toBe(2)
        expect(body.limit).toBe(25)
        return HttpResponse.json({
          results: []
        })
      })
    )

    await searchPrograms({
      server: testServer,
      query: { query: 'test' },
      page: 2,
      limit: 25
    })
  })

  it('throws error when response is not ok', async () => {
    server.use(
      http.post(`${testServer}/api/programs/search`, () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    await expect(
      searchPrograms({
        server: testServer,
        query: { query: 'test' },
        page: 1,
        limit: 50
      })
    ).rejects.toThrow('Unable to search programs')
  })

  it('throws error when response is 404', async () => {
    server.use(
      http.post(`${testServer}/api/programs/search`, () => {
        return new HttpResponse(null, { status: 404 })
      })
    )

    await expect(
      searchPrograms({
        server: testServer,
        query: { query: 'test' },
        page: 1,
        limit: 50
      })
    ).rejects.toThrow('Unable to search programs')
  })

  it('throws validation error for invalid result data', async () => {
    server.use(
      http.post(`${testServer}/api/programs/search`, () => {
        return HttpResponse.json({
          results: [{ invalid: 'data' }]
        })
      })
    )

    await expect(
      searchPrograms({
        server: testServer,
        query: { query: 'test' },
        page: 1,
        limit: 50
      })
    ).rejects.toThrow()
  })
})
