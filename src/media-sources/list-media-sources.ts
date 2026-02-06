import { z } from 'zod'
import { SourceTypeSchema } from '../schemas.js'

const MediaTypeSchema = z.enum(['movies', 'shows', 'music_videos', 'other_videos', 'tracks'])

const LibrarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  mediaType: MediaTypeSchema,
  lastScannedAt: z.number().optional(),
  externalKey: z.string(),
  type: SourceTypeSchema,
  enabled: z.boolean(),
  isLocked: z.boolean()
})

const PathReplacementSchema = z.object({
  serverPath: z.string(),
  localPath: z.string()
})

const BaseMediaSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  libraries: z.array(LibrarySchema),
  pathReplacements: z.array(PathReplacementSchema)
})

const RemoteMediaSourceSchema = BaseMediaSourceSchema.extend({
  uri: z.string(),
  accessToken: z.string(),
  userId: z.string().nullable(),
  username: z.string().nullable()
})

const PlexMediaSourceSchema = RemoteMediaSourceSchema.extend({
  type: z.literal('plex'),
  sendGuideUpdates: z.boolean(),
  index: z.number(),
  clientIdentifier: z.string().optional()
})

const JellyfinMediaSourceSchema = RemoteMediaSourceSchema.extend({
  type: z.literal('jellyfin')
})

const EmbyMediaSourceSchema = RemoteMediaSourceSchema.extend({
  type: z.literal('emby')
})

const LocalMediaSourceSchema = BaseMediaSourceSchema.extend({
  type: z.literal('local'),
  mediaType: MediaTypeSchema,
  paths: z.array(z.string().min(1)).min(1)
})

const MediaSourceSchema = z.discriminatedUnion('type', [
  PlexMediaSourceSchema,
  JellyfinMediaSourceSchema,
  EmbyMediaSourceSchema,
  LocalMediaSourceSchema
])

const OutputSchema = z.object({
  mediaSources: z.array(MediaSourceSchema)
})

export const name = 'list_media_sources'

export const config = {
  title: 'List Media Sources',
  description: 'Get configured media sources (Plex, Jellyfin, Emby, Local)',
  inputSchema: undefined,
  outputSchema: OutputSchema,
  annotations: {
    readOnlyHint: true
  }
}

export async function listMediaSources({ server }: { server: string }): Promise<z.infer<typeof OutputSchema>> {
  const response = await fetch(`${server}/api/media-sources`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error('Unable to list media sources')
  }

  const json = await response.json()

  return OutputSchema.parse({ mediaSources: json })
}
