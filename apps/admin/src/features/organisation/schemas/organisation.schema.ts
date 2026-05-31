import { z } from 'zod'

export const organisationInfoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  short_name: z.string().min(2, 'Short name required').max(50),
  support_email: z.string().email('Valid email required').optional().or(z.literal('')),
  support_phone: z.string().max(20).optional().or(z.literal('')),
})

export const organisationThemeSchema = z.object({
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Enter a valid hex color (e.g. #1a3d7c)'),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Enter a valid hex color'),
})

export type OrganisationInfoInput = z.infer<typeof organisationInfoSchema>
export type OrganisationThemeInput = z.infer<typeof organisationThemeSchema>
