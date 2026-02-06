import { z } from 'zod'
import { ChannelSchema } from './schemas.js'

const OutputSchema = z.object({
  channels: z.array(ChannelSchema)
})

export const name = 'list_channels'

export const config = {
  title: 'List Channels',
  description: 'Get channels',
  inputSchema: undefined,
  outputSchema: OutputSchema,
  annotations: {
    readOnlyHint: true
  }
}

export async function listChannels({ server }: { server: string }): Promise<z.infer<typeof OutputSchema>> {
  const response = await fetch(`${server}/api/channels`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error('Unable to list channels')
  }

  const json = await response.json()

  return OutputSchema.parse({ channels: json })
}
