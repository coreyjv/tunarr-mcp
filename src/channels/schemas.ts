import { z } from 'zod'

const ProgramTypeSchema = z.union([
  z.literal('movie'),
  z.literal('episode'),
  z.literal('track'),
  z.literal('redirect'),
  z.literal('custom'),
  z.literal('flex')
])

const SourceTypeSchema = z.enum(['plex', 'jellyfin', 'emby', 'local'])

export const ProgramSchema = z.object({
  artistName: z.string().optional(),
  albumName: z.string().optional(),
  channel: z.string().optional(), // Redirect
  customOrder: z.number().optional(),
  customShowId: z.string().optional(),
  customShowName: z.string().optional(),
  date: z.string().optional(),
  duration: z.number(),
  episode: z.number().optional(),
  episodeIcon: z.string().optional(),
  file: z.string().optional(),
  id: z.string(),
  icon: z.string().optional(),
  // Deprecated
  key: z.string().optional(),
  plexFile: z.string().optional(), // Not present on offline type
  rating: z.string().optional(),
  // e.g. for Plex items, this is the rating key value
  externalKey: z.string().optional(),
  season: z.number().optional(),
  seasonIcon: z.string().optional(),
  serverKey: z.string().optional(),
  showIcon: z.string().optional(),
  showTitle: z.string().optional(), // Unclear if this is necessary
  sourceType: SourceTypeSchema,
  summary: z.string().optional(), // Not present on offline type
  title: z.string().optional(),
  type: ProgramTypeSchema,
  year: z.number().optional()
})

const ChannelIconSchema = z.object({
  path: z.string().catch(''),
  width: z.number().nonnegative().catch(0),
  duration: z.number().catch(0),
  position: z
    .union([z.literal('top-left'), z.literal('top-right'), z.literal('bottom-left'), z.literal('bottom-right')])
    .catch('bottom-right')
})

export const ChannelOfflineSchema = z.object({
  picture: z.string().optional(),
  soundtrack: z.string().optional(),
  mode: z.union([z.literal('pic'), z.literal('clip')])
})

const ResolutionSchema = z.object({
  widthPx: z.number(),
  heightPx: z.number()
})

const ChannelTranscodingOptionsSchema = z.object({
  targetResolution: ResolutionSchema.optional(),
  videoBitrate: z.number().optional(),
  videoBufferSize: z.number().optional()
})

const ContentProgramTypeSchema = z.enum(['movie', 'episode', 'track', 'music_video', 'other_video'])

const WatermarkSchema = z.object({
  url: z.string().optional(),
  enabled: z.boolean(),
  position: z
    .union([z.literal('top-left'), z.literal('top-right'), z.literal('bottom-left'), z.literal('bottom-right')])
    .default('bottom-right'),
  width: z.number().positive(),
  verticalMargin: z.number().min(0).max(100),
  horizontalMargin: z.number().min(0).max(100),
  duration: z.number().min(0).default(0),
  fixedSize: z.boolean().optional(),
  animated: z.boolean().optional(),
  opacity: z.number().min(0).max(100).int().optional().catch(100).default(100),
  fadeConfig: z
    .array(
      z.object({
        programType: ContentProgramTypeSchema.optional().catch(undefined),
        // Encodes on/off period of displaying the watermark in mins.
        // e.g. a 5m period fades in the watermark every 5th min and displays it
        // for 5 mins.
        periodMins: z.number().positive().min(1),
        // If true, the watermark will fade in immediately on channel stream start.
        // If false, the watermark will start not visible and fade in after periodMins.
        leadingEdge: z.boolean().optional().catch(true)
      })
    )
    .optional()
})

const SubtitleFilterSchema = z.enum(['none', 'forced', 'default', 'any'])

const SubtitlePreference = z.object({
  langugeCode: z.string(),
  priority: z.number().nonnegative(),
  allowImageBased: z.boolean(),
  allowExternal: z.boolean(),
  filter: SubtitleFilterSchema.default('any')
})

const HlsChannelStreamMode = 'hls'
const HlsConcatChannelStreamMode = 'hls_concat'
const HlsSlowerChannelStreamMode = 'hls_slower'
const HlsSlowerConcatChannelStreamMode = 'hls_slower_concat'
const MpegTsChannelStreamMode = 'mpegts'
const MpegTsConcatChannelStreamMode = 'mpegts_concat'
const HlsSDirectStreamMode = 'hls_direct'
const HlsSDirectConcatStreamMode = 'hls_direct_concat'

const ChannelStreamMode = {
  Hls: HlsChannelStreamMode,
  HlsSlower: HlsSlowerChannelStreamMode,
  MpegTs: MpegTsChannelStreamMode,
  HlsDirect: HlsSDirectStreamMode
} as const

const ChannelConcatStreamMode = {
  Hls: HlsConcatChannelStreamMode,
  HlsSlower: HlsSlowerConcatChannelStreamMode,
  MpegTs: MpegTsConcatChannelStreamMode,
  HlsDirect: HlsSDirectConcatStreamMode
} as const

const ChannelConcatStreamModes = [
  ChannelConcatStreamMode.Hls,
  ChannelConcatStreamMode.HlsSlower,
  ChannelConcatStreamMode.MpegTs,
  ChannelConcatStreamMode.HlsDirect
] as const

const ChannelStreamModes = [
  ChannelStreamMode.Hls,
  ChannelStreamMode.HlsSlower,
  ChannelStreamMode.MpegTs,
  ChannelStreamMode.HlsDirect
] as const

const StreamConnectionDetailsSchema = z.object({
  // TODO -- Not as strict as the source code
  ip: z.string(),
  userAgent: z.string().optional(),
  lastHeartbeat: z.number().nonnegative().optional()
})

const ChannelSessionSchema = z.object({
  type: z.enum([...ChannelStreamModes, ...ChannelConcatStreamModes]),
  state: z.string(),
  numConnections: z.number().nonnegative(),
  connections: z.array(StreamConnectionDetailsSchema)
})

const FillerCollectionSchema = z.object({
  id: z.string(),
  weight: z.number(),
  cooldownSeconds: z.number()
})

const ChannelStreamModeSchema = z.enum([
  ChannelStreamMode.Hls,
  ChannelStreamMode.HlsSlower,
  ChannelStreamMode.MpegTs,
  ChannelStreamMode.HlsDirect
])

export const ChannelSchema = z.object({
  disableFillerOverlay: z.boolean(),
  duration: z.number(),
  fallback: z.array(ProgramSchema).optional(),
  fillerCollections: z.array(FillerCollectionSchema).optional(),
  fillerRepeatCooldown: z.number().optional(),
  groupTitle: z.string(),
  guideFlexTitle: z.string().optional(),
  guideMinimumDuration: z.number(),
  icon: ChannelIconSchema,
  id: z.string(),
  name: z.string(),
  number: z.number(),
  offline: ChannelOfflineSchema,
  startTime: z.number(),
  stealth: z.boolean(),
  transcoding: ChannelTranscodingOptionsSchema.optional(),
  watermark: WatermarkSchema.optional(),
  onDemand: z.object({
    enabled: z.boolean()
  }),
  programCount: z.number(),
  streamMode: ChannelStreamModeSchema,
  transcodeConfigId: z.string(),
  sessions: z.array(ChannelSessionSchema).optional(),
  subtitlesEnabled: z.boolean(),
  subtitlePreferences: z.array(SubtitlePreference).nonempty().optional()
})

const MediaSourceType = z.enum(['plex', 'jellyfin', 'emby', 'local'])

const BaseMediaLocation = z.object({
  path: z.string()
})

const LocalMediaLocation = BaseMediaLocation.extend({
  type: z.literal('local')
})

const MediaSourceMediaLocation = BaseMediaLocation.extend({
  type: z.literal('remote'),
  sourceType: MediaSourceType,
  externalKey: z.string()
})

export const MediaChapter = z.object({
  index: z.number().nonnegative(),
  startTime: z.number().nonnegative(),
  endTime: z.number().nonnegative(),
  title: z.string().nullish(),
  chapterType: z.enum(['chapter', 'intro', 'outro']).default('chapter')
})

export const MediaLocation = LocalMediaLocation.or(MediaSourceMediaLocation)

export const MediaStreamType = z.enum(['video', 'audio', 'subtitles', 'attachment', 'external_subtitles'])

export const MediaStream = z.object({
  index: z.number(),
  codec: z.string(),
  profile: z.string().nullish(),
  streamType: MediaStreamType,
  title: z.string().nullish(),
  hasAttachedPicture: z.boolean().nullish(),
  fileName: z.string().nullish(),
  mimeType: z.string().nullish(),

  // Video
  frameRate: z.string().or(z.number()).nullish(),
  pixelFormat: z.string().nullish(),
  bitDepth: z.number().nullish(),
  colorRange: z.string().nullish(),
  colorSpace: z.string().nullish(),
  colorTransfer: z.string().nullish(),
  colorPrimaries: z.string().nullish(),

  // Audio
  // TODO: consider breaking stream out to a union for each subtype
  channels: z.number().nullish(),

  // Subtitles
  sdh: z.boolean().nullish(),

  // Audio or Subtitles
  languageCodeISO6392: z.string().nullish(),
  selected: z.boolean().nullish(),
  default: z.boolean().nullish(),
  forced: z.boolean().nullish()
})

const MediaItem = z.object({
  streams: z.array(MediaStream),
  duration: z.number().nonnegative(),
  sampleAspectRatio: z.string().nullish(),
  displayAspectRatio: z.string().nullish(),
  frameRate: z.number().or(z.string()).nullish(),
  resolution: ResolutionSchema.nullish(),
  locations: z.array(MediaLocation),
  chapters: z.array(MediaChapter).nullish(),
  scanKind: z.enum(['unknown', 'progressive', 'interlaced']).nullish()
})

const ExternalIdType = ['plex', 'plex-guid', 'imdb', 'tmdb', 'tvdb', 'jellyfin', 'emby'] as const

const ExternalIdSourceType = z.enum(ExternalIdType)

const IdentifierSchema = z.object({
  id: z.string(),
  sourceId: z.string().optional(),
  type: ExternalIdSourceType
})

const HasMediaSourceAndLibraryId = z.object({
  mediaSourceId: z.string(),
  libraryId: z.string()
})

const BaseItem = z.object({
  // TODO Not aligned with source type
  uuid: z.string(),
  canonicalId: z.string(),
  sourceType: SourceTypeSchema,
  // externalLibraryId: z.string(),
  externalId: z.string().describe('Unique identifier for this item in the external media source'),
  // TODO: break out gropuing types to separate schema
  type: z.enum([...ContentProgramTypeSchema.options, 'show', 'season', 'album', 'artist']),
  identifiers: z.array(IdentifierSchema),
  title: z.string(),
  sortTitle: z.string(),
  tags: z.array(z.string()),
  ...HasMediaSourceAndLibraryId.shape
})

const BaseProgram = z.object({
  ...BaseItem.shape,
  type: ContentProgramTypeSchema,
  title: z.string(),
  originalTitle: z.string().nullable(),
  year: z.number().positive().nullable(),
  releaseDate: z.number().nullable().describe('Epoch timestamp'),
  releaseDateString: z.string().nullable(),
  mediaItem: MediaItem.optional(),
  duration: z.number()
})

const WithSummaryMetadata = z.object({
  summary: z.string().nullable(),
  plot: z.string().nullable(),
  tagline: z.string().nullable()
})

export const Movie = z.object({
  ...BaseProgram.shape,
  ...WithSummaryMetadata.shape,
  type: z.literal('movie'),
  rating: z.string().nullable()
})

const BaseProgramGrouping = z.object({
  ...BaseItem.shape,
  ...WithSummaryMetadata.shape,
  // genres: z.array(Genre).optional(),
  // e.g. for shows => seasons, seasons => episodes
  childCount: z.number().nonnegative().optional(),
  // e.g. for shows, this is episodes
  grandchildCount: z.number().nonnegative().optional()
  // artwork: MediaArtwork.array(),
})

const BaseSeason = z.object({
  ...BaseProgramGrouping.shape,
  type: z.literal('season'),
  // studios: z.array(Studio),
  index: z.number().nonnegative(),
  year: z.number().positive().nullable(),
  releaseDate: z.number().nullable(),
  releaseDateString: z.string().nullable()
})

const BaseEpisode = z.object({
  ...BaseProgram.shape,
  type: z.literal('episode'),
  episodeNumber: z.number().nonnegative(),
  releaseDate: z.number().nullable(),
  releaseDateString: z.string().nullable(),
  summary: z.string().nullable()
})

export const Season = z.object({
  ...BaseProgramGrouping.shape,
  ...BaseSeason.shape,
  get show(): z.ZodOptional<typeof Show> {
    return z.optional(Show)
  },
  get episodes(): z.ZodOptional<z.ZodArray<typeof BaseEpisode>> {
    return z.optional(z.array(BaseEpisode))
  }
})

export const Show = z.object({
  ...BaseProgramGrouping.shape,
  type: z.literal('show'),
  rating: z.string().nullable(),
  releaseDate: z.number().nullable(),
  releaseDateString: z.string().nullable(),
  year: z.number().positive().nullable(),
  get seasons(): z.ZodOptional<z.ZodArray<typeof BaseSeason>> {
    return z.array(Season).optional()
  }
})
