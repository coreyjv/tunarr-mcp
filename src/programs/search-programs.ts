import { z } from 'zod'

const IdentifierSchema = z.object({
  id: z.string(),
  sourceId: z.string().optional(),
  type: z.enum(['plex', 'plex-guid', 'imdb', 'tmdb', 'tvdb', 'jellyfin', 'emby'])
})

const BaseItemSchema = z.object({
  uuid: z.string().uuid(),
  canonicalId: z.string(),
  sourceType: z.enum(['plex', 'jellyfin', 'emby', 'local']),
  externalId: z.string(),
  identifiers: z.array(IdentifierSchema),
  title: z.string(),
  sortTitle: z.string(),
  tags: z.array(z.string()),
  mediaSourceId: z.string(),
  libraryId: z.string()
})

const MovieItemSchema = BaseItemSchema.extend({
  type: z.literal('movie'),
  originalTitle: z.string().nullable(),
  year: z.number().positive().nullable(),
  releaseDate: z.number().nullable(),
  releaseDateString: z.string().nullable(),
  duration: z.number(),
  summary: z.string().nullable().optional(),
  plot: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  rating: z.string().nullable().optional()
})

const ShowItemSchema = BaseItemSchema.extend({
  type: z.literal('show'),
  summary: z.string().nullable().optional(),
  plot: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  rating: z.string().nullable().optional(),
  releaseDate: z.number().nullable().optional(),
  releaseDateString: z.string().nullable().optional(),
  year: z.number().positive().nullable().optional(),
  childCount: z.number().nonnegative().optional(),
  grandchildCount: z.number().nonnegative().optional()
})

const SeasonItemSchema = BaseItemSchema.extend({
  type: z.literal('season'),
  summary: z.string().nullable().optional(),
  plot: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  index: z.number().nonnegative(),
  year: z.number().positive().nullable().optional(),
  releaseDate: z.number().nullable().optional(),
  releaseDateString: z.string().nullable().optional(),
  childCount: z.number().nonnegative().optional()
})

const EpisodeItemSchema = BaseItemSchema.extend({
  type: z.literal('episode'),
  originalTitle: z.string().nullable().optional(),
  year: z.number().positive().nullable().optional(),
  releaseDate: z.number().nullable().optional(),
  releaseDateString: z.string().nullable().optional(),
  duration: z.number(),
  episodeNumber: z.number().nonnegative(),
  summary: z.string().nullable().optional()
})

const MusicArtistItemSchema = BaseItemSchema.extend({
  type: z.literal('artist'),
  summary: z.string().nullable().optional(),
  childCount: z.number().nonnegative().optional()
})

const MusicAlbumItemSchema = BaseItemSchema.extend({
  type: z.literal('album'),
  summary: z.string().nullable().optional(),
  year: z.number().positive().nullable().optional(),
  childCount: z.number().nonnegative().optional()
})

const MusicTrackItemSchema = BaseItemSchema.extend({
  type: z.literal('track'),
  duration: z.number(),
  index: z.number().nonnegative().optional()
})

const ProgramItemSchema = z.discriminatedUnion('type', [
  MovieItemSchema,
  ShowItemSchema,
  SeasonItemSchema,
  EpisodeItemSchema,
  MusicArtistItemSchema,
  MusicAlbumItemSchema,
  MusicTrackItemSchema
])

// Filter schemas for advanced filtering
const StringFilterOpSchema = z.enum(['=', '!=', 'contains', 'starts with', 'in', 'not in'])
const NumericFilterOpSchema = z.enum(['=', '!=', '<', '>', '<=', '>=', 'to'])

const StringFieldSpecSchema = z.object({
  key: z.string(),
  name: z.string(),
  type: z.literal('string'),
  op: StringFilterOpSchema,
  value: z.array(z.string())
})

const FacetedStringFieldSpecSchema = z.object({
  key: z.string(),
  name: z.string(),
  type: z.literal('facted_string'),
  op: StringFilterOpSchema,
  value: z.array(z.string())
})

const NumericFieldSpecSchema = z.object({
  key: z.string(),
  name: z.string(),
  type: z.literal('numeric'),
  op: NumericFilterOpSchema,
  value: z.union([z.number(), z.tuple([z.number(), z.number()])])
})

const DateFieldSpecSchema = z.object({
  key: z.string(),
  name: z.string(),
  type: z.literal('date'),
  op: NumericFilterOpSchema,
  value: z.union([z.number(), z.tuple([z.number(), z.number()])])
})

const FieldSpecSchema = z.union([
  StringFieldSpecSchema,
  FacetedStringFieldSpecSchema,
  NumericFieldSpecSchema,
  DateFieldSpecSchema
])

// Recursive filter type - using z.lazy for self-reference
const SearchFilterInputSchema: z.ZodType<SearchFilterInput> = z.lazy(() =>
  z.union([
    z.object({
      type: z.literal('op'),
      op: z.enum(['or', 'and']),
      children: z.array(SearchFilterInputSchema)
    }),
    z.object({
      type: z.literal('value'),
      fieldSpec: FieldSpecSchema
    })
  ])
)

type SearchFilterInput =
  | { type: 'op'; op: 'or' | 'and'; children: SearchFilterInput[] }
  | { type: 'value'; fieldSpec: z.infer<typeof FieldSpecSchema> }

const SortSchema = z.object({
  field: z.string().describe('Field to sort by'),
  direction: z.enum(['asc', 'desc']).describe('Sort direction')
})

const QueryObjectSchema = z.object({
  query: z.string().nullable().optional().describe('Search text'),
  restrictSearchTo: z.array(z.string()).optional().describe('Restrict search to specific fields'),
  filter: SearchFilterInputSchema.nullable().optional().describe('Advanced filter conditions'),
  sort: SortSchema.nullable().optional().describe('Sort configuration')
})

const InputSchema = z.object({
  query: QueryObjectSchema.describe('Search query object containing search text, filters, and sort options'),
  mediaSourceId: z.string().optional().describe('Filter by media source ID'),
  libraryId: z.string().optional().describe('Filter by library ID'),
  page: z.number().optional().default(1).describe('Page number'),
  limit: z.number().optional().default(50).describe('Number of results per page')
})

const OutputSchema = z.object({
  results: z.array(ProgramItemSchema)
})

export const name = 'search_programs'

export const config = {
  title: 'Search Programs',
  description: 'Search for programs (movies, shows, episodes, music) across media sources',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  annotations: {
    readOnlyHint: true
  }
}

export async function searchPrograms({
  server,
  query,
  mediaSourceId,
  libraryId,
  page,
  limit
}: z.infer<typeof InputSchema> & { server: string }): Promise<z.infer<typeof OutputSchema>> {
  const body: Record<string, unknown> = {
    query,
    page,
    limit
  }

  if (mediaSourceId) {
    body.mediaSourceId = mediaSourceId
  }

  if (libraryId) {
    body.libraryId = libraryId
  }

  console.error(JSON.stringify(body, null, 2))

  const response = await fetch(`${server}/api/programs/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error('Unable to search programs')
  }

  const json = await response.json()

  return OutputSchema.parse({ results: json.results })
}
