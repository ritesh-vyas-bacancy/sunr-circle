'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { organisationThemeSchema, type OrganisationThemeInput } from '../schemas/organisation.schema'
import { updateOrganisationTheme } from '../actions/organisation.actions'
import type { Organization } from '@/types'

interface ThemeFormProps {
  organisation: Organization
  readOnly?: boolean
}

export function ThemeForm({ organisation, readOnly = false }: ThemeFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<OrganisationThemeInput>({
    resolver: zodResolver(organisationThemeSchema),
    defaultValues: {
      primary_color: organisation.primary_color ?? '#1a3d7c',
      secondary_color: organisation.secondary_color ?? '#f97316',
    },
  })

  const primaryColor = form.watch('primary_color')
  const secondaryColor = form.watch('secondary_color')

  const isPrimaryValid = /^#[0-9A-Fa-f]{6}$/.test(primaryColor)
  const isSecondaryValid = /^#[0-9A-Fa-f]{6}$/.test(secondaryColor)

  function onSubmit(values: OrganisationThemeInput) {
    startTransition(async () => {
      const result = await updateOrganisationTheme(values)
      if (result.success) {
        toast.success('Theme updated successfully.')
      } else {
        toast.error(result.error ?? 'Failed to update theme.')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Theme</CardTitle>
        <CardDescription>
          Set the primary and secondary brand colours used across the admin panel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="primary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Color</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        {/* Native colour picker for UX convenience */}
                        <input
                          type="color"
                          value={isPrimaryValid ? field.value : '#1a3d7c'}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          disabled={readOnly || isPending}
                          className="h-10 w-10 cursor-pointer rounded-md border border-input bg-background p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Pick primary colour"
                        />
                        <Input
                          placeholder="#1a3d7c"
                          disabled={readOnly || isPending}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secondary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Color</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={isSecondaryValid ? field.value : '#f97316'}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          disabled={readOnly || isPending}
                          className="h-10 w-10 cursor-pointer rounded-md border border-input bg-background p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Pick secondary colour"
                        />
                        <Input
                          placeholder="#f97316"
                          disabled={readOnly || isPending}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Live palette preview */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Preview</p>
              <div className="flex h-10 overflow-hidden rounded-md border border-border">
                <div
                  className="flex-1 transition-colors duration-200"
                  style={{ backgroundColor: isPrimaryValid ? primaryColor : '#1a3d7c' }}
                  title={`Primary: ${primaryColor}`}
                />
                <div
                  className="flex-1 transition-colors duration-200"
                  style={{ backgroundColor: isSecondaryValid ? secondaryColor : '#f97316' }}
                  title={`Secondary: ${secondaryColor}`}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Primary: {primaryColor}</span>
                <span>Secondary: {secondaryColor}</span>
              </div>
            </div>

            {!readOnly && (
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Theme'}
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
