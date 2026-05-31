export type UserRole = 'back_office' | 'call_centre' | 'line_man' | 'top_management'
export type OfficeType = 'circle' | 'division' | 'sub_division'
export type ComplaintStatus = 'open' | 'assigned' | 'in_progress' | 'closed' | 'rejected'
export type NotificationChannel = 'sms' | 'whatsapp' | 'email' | 'push'
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'skipped'

export type Organization = {
  id: string
  name: string
  short_name: string
  code: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  support_email: string | null
  support_phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
export type OrganizationInsert = Omit<Organization, 'created_at' | 'updated_at'> & { id?: string }
export type OrganizationUpdate = Partial<OrganizationInsert>

export type Office = {
  id: string
  organization_id: string
  parent_id: string | null
  office_type: OfficeType
  name: string
  code: string
  address: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
export type OfficeInsert = Omit<Office, 'created_at' | 'updated_at'> & { id?: string }
export type OfficeUpdate = Partial<OfficeInsert>

export type AppUser = {
  id: string
  organization_id: string
  sub_division_id: string | null
  role: UserRole
  full_name: string
  employee_id: string | null
  mobile_number: string | null
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}
export type AppUserInsert = Omit<AppUser, 'created_at' | 'updated_at'> & {
  id?: string
  last_login_at?: string | null
}
export type AppUserUpdate = Partial<AppUserInsert>

export type Complaint = {
  id: string
  organization_id: string
  sub_division_id: string
  raw_complaint_number: string
  complaint_number: string | null   // set by BEFORE INSERT trigger: org_code-subdivision_code-raw
  consumer_name: string
  consumer_mobile: string
  nature_of_complaint: string
  complaint_remarks: string | null
  status: ComplaintStatus
  created_by: string
  assigned_to: string | null
  attend_remarks: string | null
  created_at: string
  assigned_at: string | null
  in_progress_at: string | null
  closed_at: string | null
  updated_at: string
}
export type ComplaintInsert = Omit<
  Complaint,
  'id' | 'complaint_number' | 'created_at' | 'updated_at' | 'assigned_at' | 'in_progress_at' | 'closed_at'
>
export type ComplaintUpdate = Partial<
  Omit<Complaint, 'id' | 'organization_id' | 'created_by' | 'created_at' | 'complaint_number'>
>

export type ComplaintLog = {
  id: string
  complaint_id: string
  old_status: ComplaintStatus | null
  new_status: ComplaintStatus
  remarks: string | null
  changed_by: string
  metadata: Record<string, unknown> | null
  logged_at: string
}

export type NotificationLog = {
  id: string
  complaint_id: string | null
  channel: NotificationChannel
  recipient: string
  message_body: string | null
  status: NotificationStatus
  provider_message_id: string | null
  error_message: string | null
  triggered_by: string | null
  sent_at: string | null
  created_at: string
}

export type SystemSetting = {
  id: string
  organization_id: string | null
  key: string
  value: string
  description: string | null
  is_sensitive: boolean
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: Organization
        Insert: OrganizationInsert
        Update: OrganizationUpdate
        Relationships: []
      }
      offices: {
        Row: Office
        Insert: OfficeInsert
        Update: OfficeUpdate
        Relationships: []
      }
      users: {
        Row: AppUser
        Insert: AppUserInsert
        Update: AppUserUpdate
        Relationships: []
      }
      complaints: {
        Row: Complaint
        Insert: ComplaintInsert
        Update: ComplaintUpdate
        Relationships: []
      }
      complaint_logs: {
        Row: ComplaintLog
        Insert: Omit<ComplaintLog, 'id' | 'logged_at'>
        Update: Partial<ComplaintLog>
        Relationships: []
      }
      notification_logs: {
        Row: NotificationLog
        Insert: Omit<NotificationLog, 'id' | 'created_at'>
        Update: Partial<NotificationLog>
        Relationships: []
      }
      system_settings: {
        Row: SystemSetting
        Insert: Omit<SystemSetting, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<SystemSetting>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      office_type: OfficeType
      complaint_status: ComplaintStatus
      notification_channel: NotificationChannel
      notification_status: NotificationStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
