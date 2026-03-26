import { z } from 'zod'

export const SummaryProviderSchema = z.enum(['CLAUDE', 'OPENAI', 'GEMINI'])
export type SummaryProvider = z.infer<typeof SummaryProviderSchema>

export const SummaryCategorySchema = z.enum([
  'TECH', 'ECONOMY', 'ENTERTAINMENT', 'EDUCATION', 'OTHER'
])

export const SummaryStatusSchema = z.enum([
  'PENDING', 'PROCESSING', 'DONE', 'ERROR'
])

export const SummarySchema = z.object({
  id:        z.string().uuid(),
  url:       z.string().url(),
  title:     z.string(),
  summary:   z.string(),
  memo:      z.string(),
  category:  SummaryCategorySchema,
  status:    SummaryStatusSchema,
  provider:  SummaryProviderSchema,
  errorMsg:  z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const CreateSummarySchema = z.object({
  url:      z.string().url({ message: '유효한 유튜브 URL을 입력해주세요' }),
  category: SummaryCategorySchema.default('OTHER'),
  provider: SummaryProviderSchema.default('CLAUDE'),
})

export const UpdateSummarySchema = z.object({
  memo: z.string(),
})

export type Summary = z.infer<typeof SummarySchema>
export type CreateSummary = z.infer<typeof CreateSummarySchema>
export type UpdateSummary = z.infer<typeof UpdateSummarySchema>
export type SummaryCategory = z.infer<typeof SummaryCategorySchema>
export type SummaryStatus = z.infer<typeof SummaryStatusSchema>
