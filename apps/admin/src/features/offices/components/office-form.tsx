'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  circleSchema,
  divisionSchema,
  subDivisionSchema,
  type CircleInput,
  type DivisionInput,
  type SubDivisionInput,
} from '../schemas/office.schema'
import { createOffice, updateOffice } from '../actions/office.actions'
import type { Office, OfficeType } from '@/types'

type ParentOption = { id: string; name: string; code: string }

interface OfficeFormProps {
  type: OfficeType
  office?: Office & { parent?: ParentOption }
  parentOptions?: ParentOption[]
  onSuccess?: (office: Office) => void
}

type FormValues = CircleInput | DivisionInput | SubDivisionInput

function getSchema(type: OfficeType) {
  if (type === 'circle') return circleSchema
  if (type === 'division') return divisionSchema
  return subDivisionSchema
}

function getParentLabel(type: OfficeType): string {
  if (type === 'division') return 'Circle (Parent)'
  return 'Division (Parent)'
}

function getParentPlaceholder(type: OfficeType): string {
  if (type === 'division') return 'Select a circle'
  return 'Select a division'
}

export function OfficeForm({ type, office, parentOptions, onSuccess }: OfficeFormProps) {
  const isEditing = !!office
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const schema = getSchema(type)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: office?.name ?? '',
      code: office?.code ?? '',
      address: office?.address ?? '',
      ...(type !== 'circle' && {
        parent_id: office?.parent_id ?? '',
      }),
    } as FormValues,
  })

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = isEditing
        ? await updateOffice(office!.id, values)
        : await createOffice(type, values)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(
        isEditing
          ? `Office "${result.data.name}" updated successfully.`
          : `Office "${result.data.name}" created successfully.`
      )

      if (onSuccess) {
        onSuccess(result.data)
      } else {
        const redirectPath =
          type === 'circle'
            ? '/offices/circles'
            : type === 'division'
              ? '/offices/divisions'
              : '/offices/sub-divisions'
        router.push(redirectPath)
        router.refresh()
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        {type !== 'circle' && (
          <FormField
            control={form.control}
            name={'parent_id' as keyof FormValues}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{getParentLabel(type)}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value as string}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={getParentPlaceholder(type)} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(parentOptions ?? []).map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.code} — {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Northern Circle"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. NC"
                  disabled={isPending}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Office address"
                  rows={3}
                  disabled={isPending}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? isEditing
                ? 'Saving...'
                : 'Creating...'
              : isEditing
                ? 'Save Changes'
                : 'Create Office'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
