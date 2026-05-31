import { z } from 'zod'

export const circleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  code: z.string().min(1, 'Code is required').max(10).transform(v => v.toUpperCase()),
  address: z.string().max(500).optional().or(z.literal('')),
})

export const divisionSchema = circleSchema.extend({
  parent_id: z.string().uuid('Please select a Circle'),
})

export const subDivisionSchema = circleSchema.extend({
  parent_id: z.string().uuid('Please select a Division'),
})

export type CircleInput = z.infer<typeof circleSchema>
export type DivisionInput = z.infer<typeof divisionSchema>
export type SubDivisionInput = z.infer<typeof subDivisionSchema>
