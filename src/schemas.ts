import { z } from 'zod'

// Common source types used across the API
export const SourceTypeSchema = z.enum(['plex', 'jellyfin', 'emby', 'local'])

// External ID types for identifying content across platforms
export const ExternalIdType = ['plex', 'plex-guid', 'imdb', 'tmdb', 'tvdb', 'jellyfin', 'emby'] as const
export const ExternalIdSourceType = z.enum(ExternalIdType)

// Identifier schema for external references
export const IdentifierSchema = z.object({
  id: z.string(),
  sourceId: z.string().optional(),
  type: ExternalIdSourceType
})

// Base fields shared by all items with a media source
export const HasMediaSourceAndLibraryId = z.object({
  mediaSourceId: z.string(),
  libraryId: z.string()
})

// Filter operation types for search
export const StringFilterOpSchema = z.enum(['=', '!=', 'contains', 'starts with', 'in', 'not in'])
export const NumericFilterOpSchema = z.enum(['=', '!=', '<', '>', '<=', '>=', 'to'])

// Field specification schemas for search filters
export const StringFieldSpecSchema = z.object({
  key: z.string(),
  name: z.string(),
  type: z.literal('string'),
  op: StringFilterOpSchema,
  value: z.array(z.string())
})

export const FacetedStringFieldSpecSchema = z.object({
  key: z.string(),
  name: z.string(),
  type: z.literal('facted_string'),
  op: StringFilterOpSchema,
  value: z.array(z.string())
})

export const NumericFieldSpecSchema = z.object({
  key: z.string(),
  name: z.string(),
  type: z.literal('numeric'),
  op: NumericFilterOpSchema,
  value: z.union([z.number(), z.tuple([z.number(), z.number()])])
})

export const DateFieldSpecSchema = z.object({
  key: z.string(),
  name: z.string(),
  type: z.literal('date'),
  op: NumericFilterOpSchema,
  value: z.union([z.number(), z.tuple([z.number(), z.number()])])
})

export const FieldSpecSchema = z.union([
  StringFieldSpecSchema,
  FacetedStringFieldSpecSchema,
  NumericFieldSpecSchema,
  DateFieldSpecSchema
])
export type FieldSpec = z.infer<typeof FieldSpecSchema>

// Recursive filter type for search
export type SearchFilterInput =
  | { type: 'op'; op: 'or' | 'and'; children: SearchFilterInput[] }
  | { type: 'value'; fieldSpec: FieldSpec }

export const SearchFilterInputSchema: z.ZodType<SearchFilterInput> = z.lazy(() =>
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

// Sort configuration for search
export const SortSchema = z.object({
  field: z.string().describe('Field to sort by'),
  direction: z.enum(['asc', 'desc']).describe('Sort direction')
})

// Base item schema shared by program items
export const BaseProgramItemSchema = z.object({
  uuid: z.string().uuid(),
  canonicalId: z.string(),
  sourceType: SourceTypeSchema,
  externalId: z.string(),
  identifiers: z.array(IdentifierSchema),
  title: z.string(),
  sortTitle: z.string(),
  tags: z.array(z.string()),
  mediaSourceId: z.string(),
  libraryId: z.string()
})

// Program item schemas for search results
export const MovieItemSchema = BaseProgramItemSchema.extend({
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

export const ShowItemSchema = BaseProgramItemSchema.extend({
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

export const SeasonItemSchema = BaseProgramItemSchema.extend({
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

export const EpisodeItemSchema = BaseProgramItemSchema.extend({
  type: z.literal('episode'),
  originalTitle: z.string().nullable().optional(),
  year: z.number().positive().nullable().optional(),
  releaseDate: z.number().nullable().optional(),
  releaseDateString: z.string().nullable().optional(),
  duration: z.number(),
  episodeNumber: z.number().nonnegative(),
  summary: z.string().nullable().optional()
})

export const MusicArtistItemSchema = BaseProgramItemSchema.extend({
  type: z.literal('artist'),
  summary: z.string().nullable().optional(),
  childCount: z.number().nonnegative().optional()
})

export const MusicAlbumItemSchema = BaseProgramItemSchema.extend({
  type: z.literal('album'),
  summary: z.string().nullable().optional(),
  year: z.number().positive().nullable().optional(),
  childCount: z.number().nonnegative().optional()
})

export const MusicTrackItemSchema = BaseProgramItemSchema.extend({
  type: z.literal('track'),
  duration: z.number(),
  index: z.number().nonnegative().optional()
})

export const ProgramItemSchema = z.discriminatedUnion('type', [
  MovieItemSchema,
  ShowItemSchema,
  SeasonItemSchema,
  EpisodeItemSchema,
  MusicArtistItemSchema,
  MusicAlbumItemSchema,
  MusicTrackItemSchema
])
