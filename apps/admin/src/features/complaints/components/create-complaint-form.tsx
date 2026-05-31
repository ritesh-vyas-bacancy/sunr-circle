'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import { createComplaintSchema, type CreateComplaintInput } from '@/features/complaints/schemas/complaint.schema'
import { createComplaint } from '@/features/complaints/actions/complaint.actions'
import { createClient } from '@/lib/supabase/client'

interface Office {
  id: string
  name: string
  code: string
  office_type: string
  parent_id: string | null
}

interface CreateComplaintFormProps {
  allOffices: Office[]
}

type NumberStatus = 'idle' | 'checking' | 'available' | 'taken'

export function CreateComplaintForm({ allOffices }: CreateComplaintFormProps) {
  const router = useRouter()

  const [selectedCircleId, setSelectedCircleId] = useState<string>('')
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('')
  const [numberStatus, setNumberStatus] = useState<NumberStatus>('idle')

  const circles = allOffices.filter((o) => o.office_type === 'circle')
  const filteredDivisions = allOffices.filter(
    (o) => o.office_type === 'division' && (!selectedCircleId || o.parent_id === selectedCircleId),
  )
  const filteredSubDivisions = allOffices.filter(
    (o) =>
      o.office_type === 'sub_division' &&
      (!selectedDivisionId || o.parent_id === selectedDivisionId),
  )

  const form = useForm<CreateComplaintInput>({
    resolver: zodResolver(createComplaintSchema),
    defaultValues: {
      consumer_name: '',
      consumer_mobile: '',
      nature_of_complaint: '',
      complaint_remarks: '',
      sub_division_id: '',
      raw_complaint_number: '',
    },
  })

  const watchedSubDivId = form.watch('sub_division_id')
  const watchedRawNumber = form.watch('raw_complaint_number')

  function handleCircleChange(value: string) {
    setSelectedCircleId(value)
    setSelectedDivisionId('')
    form.setValue('sub_division_id', '')
    setNumberStatus('idle')
  }

  function handleDivisionChange(value: string) {
    setSelectedDivisionId(value)
    form.setValue('sub_division_id', '')
    setNumberStatus('idle')
  }

  async function handleRawNumberBlur() {
    const rawNum = watchedRawNumber?.trim()
    if (!rawNum || !watchedSubDivId) {
      setNumberStatus('idle')
      return
    }

    setNumberStatus('checking')

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('complaints')
        .select('id')
        .eq('sub_division_id', watchedSubDivId)
        .ilike('raw_complaint_number', rawNum)

      if (error) {
        setNumberStatus('idle')
        return
      }

      setNumberStatus(data && data.length > 0 ? 'taken' : 'available')
    } catch {
      setNumberStatus('idle')
    }
  }

  async function onSubmit(data: CreateComplaintInput) {
    try {
      const result = await createComplaint(data)
      if (result.success) {
        toast.success(`Complaint created — ${result.data.complaint_number}`)
        router.push(`/complaints/${result.data.id}`)
      } else {
        form.setError('root', { message: result.error })
      }
    } catch (err) {
      form.setError('root', {
        message: err instanceof Error ? err.message : 'An unexpected error occurred.',
      })
    }
  }

  const rootError = form.formState.errors.root?.message
  const isSubmitting = form.formState.isSubmitting

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Complaint</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Consumer Name + Mobile */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="consumer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consumer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Ramesh Kumar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="consumer_mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consumer Mobile</FormLabel>
                    <FormControl>
                      <Input placeholder="10-digit mobile number" maxLength={10} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Nature of Complaint */}
            <FormField
              control={form.control}
              name="nature_of_complaint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nature of Complaint</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the nature of the complaint..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Complaint Remarks */}
            <FormField
              control={form.control}
              name="complaint_remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Complaint Remarks{' '}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional remarks..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Location
            </p>

            {/* Circle / Division / Sub Division */}
            <div className="grid grid-cols-3 gap-4">
              {/* Circle */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Circle</label>
                <Select value={selectedCircleId} onValueChange={handleCircleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Circle" />
                  </SelectTrigger>
                  <SelectContent>
                    {circles.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Division */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Division</label>
                <Select
                  value={selectedDivisionId}
                  onValueChange={handleDivisionChange}
                  disabled={!selectedCircleId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Division" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDivisions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sub Division */}
              <FormField
                control={form.control}
                name="sub_division_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub Division</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v)
                          setNumberStatus('idle')
                        }}
                        disabled={!selectedDivisionId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Sub Division" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredSubDivisions.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Complaint Reference Number */}
            <FormField
              control={form.control}
              name="raw_complaint_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complaint Reference Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. FC12345"
                      {...field}
                      onBlur={() => {
                        field.onBlur()
                        handleRawNumberBlur()
                      }}
                    />
                  </FormControl>

                  {/* Availability indicator */}
                  {numberStatus !== 'idle' && (
                    <div className="flex items-center gap-1.5 text-xs">
                      {numberStatus === 'checking' && (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Checking...
                        </span>
                      )}
                      {numberStatus === 'available' && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Available
                        </span>
                      )}
                      {numberStatus === 'taken' && (
                        <span className="flex items-center gap-1 text-destructive">
                          <XCircle className="h-3 w-3" />
                          Already taken in this Sub Division
                        </span>
                      )}
                    </div>
                  )}

                  <FormDescription>
                    e.g. FC12345 — system generates full number SUNR-XXXXXX-FC12345
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Root / server error */}
            {rootError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{rootError}</AlertDescription>
              </Alert>
            )}

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Complaint
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
