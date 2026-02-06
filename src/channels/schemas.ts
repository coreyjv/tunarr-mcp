import { z } from 'zod'
import { SourceTypeSchema } from '../schemas.js'

const ProgramTypeSchema = z.union([
  z.literal('movie'),
  z.literal('episode'),
  z.literal('track'),
  z.literal('redirect'),
  z.literal('custom'),
  z.literal('flex')
])

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
