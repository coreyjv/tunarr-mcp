import { z } from 'zod'
import { ShowItemSchema } from '../schemas.js'

const OutputSchema = z.object({
  total: z.number(),
  shows: z.array(ShowItemSchema),
  size: z.number()
})

const InputSchema = z.object({
  id: z.string().describe('Channel Id'),
  limit: z.number().optional().default(50).describe('How many movies to return'),
  offset: z.number().optional().default(0).describe('Offset to start returning items')
})

export const name = 'list_shows_in_channel'

export const config = {
  title: 'List Shows In Channel',
  description: 'Get shows in channel',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  annotations: {
    readOnlyHint: true
  }
}

export async function listShowsInChannel({
  server,
  id,
  offset,
  limit
}: z.infer<typeof InputSchema> & { server: string }): Promise<z.infer<typeof OutputSchema>> {
  console.error('listShowsInChannel', { server, id, offset, limit })
  const response = await fetch(`${server}/api/channels/${id}/shows?offset=${offset}&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    //TODO Log appropriately.
    throw new Error('Unable to list channels')
  }

  const json = await response.json()

  return OutputSchema.parse({ total: json.total, shows: json.result, size: json.size })
}
