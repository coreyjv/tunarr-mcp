import { z } from 'zod'
import { ProgramItemSchema, SearchFilterInputSchema, SortSchema } from '../schemas.js'

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
