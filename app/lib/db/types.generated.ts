export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      artist_booking_inquiries: {
        Row: {
          artist_id: string | null
          converted_booking_id: string | null
          created_at: string
          email: string
          event_date: string | null
          event_location: string | null
          id: string
          name: string
          notes: string | null
          organisation: string | null
          phone: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          updated_at: string
        }
        Insert: {
          artist_id?: string | null
          converted_booking_id?: string | null
          created_at?: string
          email: string
          event_date?: string | null
          event_location?: string | null
          id?: string
          name: string
          notes?: string | null
          organisation?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
        }
        Update: {
          artist_id?: string | null
          converted_booking_id?: string | null
          created_at?: string
          email?: string
          event_date?: string | null
          event_location?: string | null
          id?: string
          name?: string
          notes?: string | null
          organisation?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_booking_inquiries_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_booking_inquiries_converted_booking_id_fkey"
            columns: ["converted_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          active: boolean
          bio: string | null
          created_at: string
          display_order: number
          external_booking_url: string | null
          genre: string | null
          id: string
          photo_url: string | null
          profile_id: string | null
          slug: string
          stage_name: string
        }
        Insert: {
          active?: boolean
          bio?: string | null
          created_at?: string
          display_order?: number
          external_booking_url?: string | null
          genre?: string | null
          id?: string
          photo_url?: string | null
          profile_id?: string | null
          slug: string
          stage_name: string
        }
        Update: {
          active?: boolean
          bio?: string | null
          created_at?: string
          display_order?: number
          external_booking_url?: string | null
          genre?: string | null
          id?: string
          photo_url?: string | null
          profile_id?: string | null
          slug?: string
          stage_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "artists_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          booking_id: string
          notification_channel: Database["public"]["Enums"]["notification_channel"]
          notified_at: string | null
          role_on_job: string | null
          staff_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          booking_id: string
          notification_channel?: Database["public"]["Enums"]["notification_channel"]
          notified_at?: string | null
          role_on_job?: string | null
          staff_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          booking_id?: string
          notification_channel?: Database["public"]["Enums"]["notification_channel"]
          notified_at?: string | null
          role_on_job?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_assignments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_notes: {
        Row: {
          author_id: string | null
          body: string
          booking_id: string
          created_at: string
          id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          booking_id: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          booking_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_notes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          artist_id: string | null
          artwinlive_id: string | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string
          created_by: string | null
          decided_at: string | null
          decided_by: string | null
          decline_reason: string | null
          event_date: string | null
          event_end: string | null
          event_location: string | null
          event_start: string | null
          fee_cents: number | null
          google_event_id: string | null
          id: string
          notes: string | null
          source: Database["public"]["Enums"]["booking_source"]
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          artist_id?: string | null
          artwinlive_id?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decline_reason?: string | null
          event_date?: string | null
          event_end?: string | null
          event_location?: string | null
          event_start?: string | null
          fee_cents?: number | null
          google_event_id?: string | null
          id?: string
          notes?: string | null
          source: Database["public"]["Enums"]["booking_source"]
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          artist_id?: string | null
          artwinlive_id?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decline_reason?: string | null
          event_date?: string | null
          event_end?: string | null
          event_location?: string | null
          event_start?: string | null
          fee_cents?: number | null
          google_event_id?: string | null
          id?: string
          notes?: string | null
          source?: Database["public"]["Enums"]["booking_source"]
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          first_booking_at: string | null
          id: string
          last_booking_at: string | null
          name: string | null
          notes: string | null
          phone: string | null
          total_bookings: number
          total_value_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_booking_at?: string | null
          id?: string
          last_booking_at?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          total_bookings?: number
          total_value_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_booking_at?: string | null
          id?: string
          last_booking_at?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          total_bookings?: number
          total_value_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      contact_inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["contact_inquiry_status"]
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["contact_inquiry_status"]
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["contact_inquiry_status"]
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crew_availability: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          kind: Database["public"]["Enums"]["availability_kind"]
          note: string | null
          staff_id: string
          start_date: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          kind?: Database["public"]["Enums"]["availability_kind"]
          note?: string | null
          staff_id: string
          start_date: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          kind?: Database["public"]["Enums"]["availability_kind"]
          note?: string | null
          staff_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_availability_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disco_inquiries: {
        Row: {
          converted_booking_id: string | null
          created_at: string
          email: string
          event_date: string | null
          guest_count: number | null
          id: string
          location: string | null
          name: string
          notes: string | null
          organisation: string | null
          package_id: string | null
          phone: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          updated_at: string
        }
        Insert: {
          converted_booking_id?: string | null
          created_at?: string
          email: string
          event_date?: string | null
          guest_count?: number | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          organisation?: string | null
          package_id?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
        }
        Update: {
          converted_booking_id?: string | null
          created_at?: string
          email?: string
          event_date?: string | null
          guest_count?: number | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          organisation?: string | null
          package_id?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disco_inquiries_converted_booking_id_fkey"
            columns: ["converted_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disco_inquiries_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "disco_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      disco_packages: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          display_order: number
          features: Json
          guest_capacity_max: number | null
          guest_capacity_min: number | null
          hero_image_url: string | null
          id: string
          is_popular: boolean
          name: string
          price_from_cents: number
          slug: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          features?: Json
          guest_capacity_max?: number | null
          guest_capacity_min?: number | null
          hero_image_url?: string | null
          id?: string
          is_popular?: boolean
          name: string
          price_from_cents: number
          slug: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          features?: Json
          guest_capacity_max?: number | null
          guest_capacity_min?: number | null
          hero_image_url?: string | null
          id?: string
          is_popular?: boolean
          name?: string
          price_from_cents?: number
          slug?: string
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      integration_credentials: {
        Row: {
          access_token: string | null
          expires_at: string | null
          extra: Json | null
          provider: string
          refresh_token: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          access_token?: string | null
          expires_at?: string | null
          extra?: Json | null
          provider: string
          refresh_token?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          access_token?: string | null
          expires_at?: string | null
          extra?: Json | null
          provider?: string
          refresh_token?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_credentials_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      klus_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          klus_id: string
          notification_channel: Database["public"]["Enums"]["notification_channel"]
          notified_at: string | null
          role_on_job: string | null
          staff_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          klus_id: string
          notification_channel?: Database["public"]["Enums"]["notification_channel"]
          notified_at?: string | null
          role_on_job?: string | null
          staff_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          klus_id?: string
          notification_channel?: Database["public"]["Enums"]["notification_channel"]
          notified_at?: string | null
          role_on_job?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "klus_assignments_klus_id_fkey"
            columns: ["klus_id"]
            isOneToOne: false
            referencedRelation: "klussen"
            referencedColumns: ["id"]
          },
        ]
      }
      klus_types: {
        Row: {
          active: boolean
          created_at: string
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          label: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      klussen: {
        Row: {
          booking_id: string | null
          created_at: string
          created_by: string | null
          event_date: string
          event_end: string | null
          event_start: string | null
          id: string
          kind: string
          location: string | null
          notes: string | null
          title: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          event_date: string
          event_end?: string | null
          event_start?: string | null
          id?: string
          kind?: string
          location?: string | null
          notes?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          event_date?: string
          event_end?: string | null
          event_start?: string | null
          id?: string
          kind?: string
          location?: string | null
          notes?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "klussen_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          calendar_feed_token: string | null
          created_at: string
          email: string | null
          full_name: string | null
          has_password: boolean
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          calendar_feed_token?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          has_password?: boolean
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          calendar_feed_token?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          has_password?: boolean
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_artist_id: { Args: never; Returns: string }
      dashboard_stats: {
        Args: never
        Returns: {
          last_week: number
          open: number
          staff_planned: number
          this_week: number
          weekend: number
        }[]
      }
      ensure_calendar_feed_token: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_artist: { Args: never; Returns: boolean }
    }
    Enums: {
      availability_kind: "vrij" | "vakantie"
      booking_source: "artist" | "client" | "artwinlive"
      booking_status: "pending" | "accepted" | "declined" | "done" | "cancelled"
      contact_inquiry_status: "new" | "replied" | "closed"
      inquiry_status: "new" | "contacted" | "quoted" | "booked" | "closed"
      klus_kind: "opbouw" | "afbreken" | "ophalen" | "overig"
      notification_channel: "email" | "whatsapp" | "sms"
      user_role: "admin" | "artist" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      availability_kind: ["vrij", "vakantie"],
      booking_source: ["artist", "client", "artwinlive"],
      booking_status: ["pending", "accepted", "declined", "done", "cancelled"],
      contact_inquiry_status: ["new", "replied", "closed"],
      inquiry_status: ["new", "contacted", "quoted", "booked", "closed"],
      klus_kind: ["opbouw", "afbreken", "ophalen", "overig"],
      notification_channel: ["email", "whatsapp", "sms"],
      user_role: ["admin", "artist", "staff"],
    },
  },
} as const
