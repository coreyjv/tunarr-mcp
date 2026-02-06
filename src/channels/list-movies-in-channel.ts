import { z } from 'zod'
import { MovieItemSchema } from '../schemas.js'

const OutputSchema = z.object({
  total: z.number(),
  movies: z.array(MovieItemSchema),
  size: z.number()
})

const InputSchema = z.object({
  id: z.string().describe('Channel Id'),
  limit: z.number().optional().default(50).describe('How many movies to return'),
  offset: z.number().optional().default(0).describe('Offset to start returning items')
})

export const name = 'list_movies_in_channel'

export const config = {
  title: 'List Movies In Channel',
  description: 'Get movies in channel',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  annotations: {
    readOnlyHint: true
  }
}

export async function listMoviesInChannel({
  server,
  id,
  offset,
  limit
}: z.infer<typeof InputSchema> & { server: string }): Promise<z.infer<typeof OutputSchema>> {
  const response = await fetch(`${server}/api/channels/${id}/programs?type=movie&offset=${offset}&limit=${limit}`, {
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

  return OutputSchema.parse({ total: json.total, movies: json.result, size: json.size })
}
