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
import { organisationInfoSchema, type OrganisationInfoInput } from '../schemas/organisation.schema'
import { updateOrganisationInfo } from '../actions/organisation.actions'
import type { Organization } from '@/types'

interface OrganisationFormProps {
  organisation: Organization
  readOnly?: boolean
}

export function OrganisationForm({ organisation, readOnly = false }: OrganisationFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<OrganisationInfoInput>({
    resolver: zodResolver(organisationInfoSchema),
    defaultValues: {
      name: organisation.name,
      short_name: organisation.short_name,
      support_email: organisation.support_email ?? '',
      support_phone: organisation.support_phone ?? '',
    },
  })

  function onSubmit(values: OrganisationInfoInput) {
    startTransition(async () => {
      const result = await updateOrganisationInfo(values)
      if (result.success) {
        toast.success('Organisation info updated successfully.')
      } else {
        toast.error(result.error ?? 'Failed to update organisation info.')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Information</CardTitle>
        <CardDescription>Update your organisation name and contact details.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organisation Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. SUNR Circle Electricity"
                      disabled={readOnly || isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="short_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. SUNR"
                      disabled={readOnly || isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="support_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Support Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="support@example.com"
                      disabled={readOnly || isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="support_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Support Phone</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+91 98765 43210"
                      disabled={readOnly || isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!readOnly && (
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
