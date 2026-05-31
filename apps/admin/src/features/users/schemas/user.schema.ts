import { z } from 'zod'

export const createUserSchema = z
  .object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().email('Valid email address required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['back_office', 'call_centre', 'line_man', 'top_management']),
    employee_id: z.string().max(20).optional().or(z.literal('')),
    mobile_number: z
      .string()
      .regex(/^[6-9][0-9]{9}$/, 'Enter a valid 10-digit Indian mobile number')
      .optional()
      .or(z.literal('')),
    sub_division_id: z.string().uuid().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (['call_centre', 'line_man'].includes(data.role) && !data.sub_division_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Sub Division is required for this role',
        path: ['sub_division_id'],
      })
    }
  })

export const updateUserSchema = z
  .object({
    full_name: z.string().min(2).max(100).optional(),
    role: z.enum(['back_office', 'call_centre', 'line_man', 'top_management']).optional(),
    employee_id: z.string().max(20).optional().or(z.literal('')),
    mobile_number: z
      .string()
      .regex(/^[6-9][0-9]{9}$/)
      .optional()
      .or(z.literal('')),
    sub_division_id: z.string().uuid().optional().or(z.literal('')),
    is_active: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role && ['call_centre', 'line_man'].includes(data.role) && !data.sub_division_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Sub Division is required for this role',
        path: ['sub_division_id'],
      })
    }
  })

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
