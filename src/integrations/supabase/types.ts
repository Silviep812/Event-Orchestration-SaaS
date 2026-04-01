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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      amenity_types: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      Authorization: {
        Row: {
          created_at: string
          magic_link_enabled: boolean | null
          magic_link_expires_at: string | null
          magic_link_request_count: number | null
          magic_link_requested_ip: string | null
          magic_link_sent_at: string | null
          magic_link_token: string | null
          magic_link_used: boolean | null
          magic_link_used_at: string | null
          sign_in: string
          sign_out: string | null
        }
        Insert: {
          created_at?: string
          magic_link_enabled?: boolean | null
          magic_link_expires_at?: string | null
          magic_link_request_count?: number | null
          magic_link_requested_ip?: string | null
          magic_link_sent_at?: string | null
          magic_link_token?: string | null
          magic_link_used?: boolean | null
          magic_link_used_at?: string | null
          sign_in: string
          sign_out?: string | null
        }
        Update: {
          created_at?: string
          magic_link_enabled?: boolean | null
          magic_link_expires_at?: string | null
          magic_link_request_count?: number | null
          magic_link_requested_ip?: string | null
          magic_link_sent_at?: string | null
          magic_link_token?: string | null
          magic_link_used?: boolean | null
          magic_link_used_at?: string | null
          sign_in?: string
          sign_out?: string | null
        }
        Relationships: []
      }
      "Bookings Directory": {
        Row: {
          book_id: string
          confirmation: boolean | null
          created_at: string
          QR_Code: boolean | null
          registry: string[] | null
          reservation: boolean | null
          rsvp: boolean | null
          user_id: string | null
        }
        Insert: {
          book_id: string
          confirmation?: boolean | null
          created_at?: string
          QR_Code?: boolean | null
          registry?: string[] | null
          reservation?: boolean | null
          rsvp?: boolean | null
          user_id?: string | null
        }
        Update: {
          book_id?: string
          confirmation?: boolean | null
          created_at?: string
          QR_Code?: boolean | null
          registry?: string[] | null
          reservation?: boolean | null
          rsvp?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      budget_items: {
        Row: {
          actual_cost: number | null
          archived: boolean
          budget_credit: number | null
          category: Database["public"]["Enums"]["budget_category"]
          created_at: string
          created_by: string
          description: string | null
          estimated_cost: number | null
          event_id: string
          id: string
          item_name: string
          original_amount: number | null
          payment_due_date: string | null
          payment_status: string | null
          status: string | null
          updated_at: string
          vendor_contact: string | null
          vendor_name: string | null
        }
        Insert: {
          actual_cost?: number | null
          archived?: boolean
          budget_credit?: number | null
          category: Database["public"]["Enums"]["budget_category"]
          created_at?: string
          created_by: string
          description?: string | null
          estimated_cost?: number | null
          event_id: string
          id?: string
          item_name: string
          original_amount?: number | null
          payment_due_date?: string | null
          payment_status?: string | null
          status?: string | null
          updated_at?: string
          vendor_contact?: string | null
          vendor_name?: string | null
        }
        Update: {
          actual_cost?: number | null
          archived?: boolean
          budget_credit?: number | null
          category?: Database["public"]["Enums"]["budget_category"]
          created_at?: string
          created_by?: string
          description?: string | null
          estimated_cost?: number | null
          event_id?: string
          id?: string
          item_name?: string
          original_amount?: number | null
          payment_due_date?: string | null
          payment_status?: string | null
          status?: string | null
          updated_at?: string
          vendor_contact?: string | null
          vendor_name?: string | null
        }
        Relationships: []
      }
      change_logs: {
        Row: {
          action: string
          change_description: string | null
          changed_by: string
          created_at: string
          entity_id: string
          entity_type: string
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          action: string
          change_description?: string | null
          changed_by: string
          created_at?: string
          entity_id: string
          entity_type: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          action?: string
          change_description?: string | null
          changed_by?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: []
      }
      change_requests: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          approved_at: string | null
          approved_by: string | null
          change_type: Database["public"]["Enums"]["change_type"] | null
          created_at: string
          description: string | null
          event_id: string | null
          field_changes: Json | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          rejection_reason: string | null
          requested_by: string | null
          status: Database["public"]["Enums"]["change_status"]
          task_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          approved_at?: string | null
          approved_by?: string | null
          change_type?: Database["public"]["Enums"]["change_type"] | null
          created_at?: string
          description?: string | null
          event_id?: string | null
          field_changes?: Json | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          rejection_reason?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["change_status"]
          task_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          approved_at?: string | null
          approved_by?: string | null
          change_type?: Database["public"]["Enums"]["change_type"] | null
          created_at?: string
          description?: string | null
          event_id?: string | null
          field_changes?: Json | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          rejection_reason?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["change_status"]
          task_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "event_task_timeline_view"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "change_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      "Check Lists": {
        Row: {
          assigned_to: string | null
          category: string | null
          checked: boolean | null
          completed_at: string | null
          created_at: string
          due_date: string | null
          entity_id: string
          entity_type: string
          id: string
          label: string
          notes: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          checked?: boolean | null
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          entity_id: string
          entity_type: string
          id?: string
          label: string
          notes?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          checked?: boolean | null
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          label?: string
          notes?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      checklist_templates: {
        Row: {
          category_name: string
          created_at: string
          id: number
          label: string
          sort_order: number
        }
        Insert: {
          category_name: string
          created_at?: string
          id?: number
          label: string
          sort_order?: number
        }
        Update: {
          category_name?: string
          created_at?: string
          id?: number
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      cm_activity: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          event_id: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          event_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          event_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "cm_activity_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "due_soon_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cm_activity_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_kpi_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "cm_activity_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cm_activity_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_category_counts"
            referencedColumns: ["event_id"]
          },
        ]
      }
      cm_audit_events: {
        Row: {
          created_at: string
          description: string | null
          event_id: string | null
          id: string
          payload: Json | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          payload?: Json | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          payload?: Json | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      cm_change_logs: {
        Row: {
          action: string
          change_description: string | null
          changed_by: string
          created_at: string
          entity_id: string
          entity_type: string
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          action: string
          change_description?: string | null
          changed_by: string
          created_at?: string
          entity_id: string
          entity_type: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          action?: string
          change_description?: string | null
          changed_by?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: []
      }
      cm_change_requests: {
        Row: {
          created_at: string
          description: string | null
          event_id: string | null
          field_changed: string | null
          id: string
          new_value: string | null
          old_value: string | null
          priority_tag: string | null
          requested_by: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          task_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id?: string | null
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          priority_tag?: string | null
          requested_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          task_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string | null
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          priority_tag?: string | null
          requested_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          task_id?: string | null
        }
        Relationships: []
      }
      cm_event_members: {
        Row: {
          event_id: string
          role: string
          user_id: string
        }
        Insert: {
          event_id: string
          role?: string
          user_id: string
        }
        Update: {
          event_id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      cm_locations: {
        Row: {
          address: string | null
          event_id: string | null
          id: string
          name: string | null
        }
        Insert: {
          address?: string | null
          event_id?: string | null
          id?: string
          name?: string | null
        }
        Update: {
          address?: string | null
          event_id?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      cm_resources: {
        Row: {
          availability: Json | null
          event_id: string | null
          id: string
          location_id: string | null
          name: string | null
          role: string | null
        }
        Insert: {
          availability?: Json | null
          event_id?: string | null
          id?: string
          location_id?: string | null
          name?: string | null
          role?: string | null
        }
        Update: {
          availability?: Json | null
          event_id?: string | null
          id?: string
          location_id?: string | null
          name?: string | null
          role?: string | null
        }
        Relationships: []
      }
      cm_tasks: {
        Row: {
          depends_on: string | null
          end_date: string | null
          event_id: string | null
          id: string
          locked: boolean | null
          name: string | null
          start_date: string | null
          status: string | null
        }
        Insert: {
          depends_on?: string | null
          end_date?: string | null
          event_id?: string | null
          id?: string
          locked?: boolean | null
          name?: string | null
          start_date?: string | null
          status?: string | null
        }
        Update: {
          depends_on?: string | null
          end_date?: string | null
          event_id?: string | null
          id?: string
          locked?: boolean | null
          name?: string | null
          start_date?: string | null
          status?: string | null
        }
        Relationships: []
      }
      collaborator_configurations: {
        Row: {
          assigned_user_id: string | null
          collaborator_types: string[]
          created_at: string | null
          id: string
          is_coordinator: boolean | null
          is_viewer: boolean | null
          notes: string | null
          permission_level_text: string | null
          role: string
          roles: string[] | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_user_id?: string | null
          collaborator_types: string[]
          created_at?: string | null
          id?: string
          is_coordinator?: boolean | null
          is_viewer?: boolean | null
          notes?: string | null
          permission_level_text?: string | null
          role: string
          roles?: string[] | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_user_id?: string | null
          collaborator_types?: string[]
          created_at?: string | null
          id?: string
          is_coordinator?: boolean | null
          is_viewer?: boolean | null
          notes?: string | null
          permission_level_text?: string | null
          role?: string
          roles?: string[] | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaborator_configurations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      Collaborators: {
        Row: {
          booking_assign_to: string | null
          collab_type: string
          created_at: string
          entertainment_assign_to: string | null
          external_vendor_assign_to_text: string | null
          hospitality_assign_to: string | null
          marketing_assign_to_text: string | null
          service_rental_buy_assign_to_text: string | null
          services_assign_to: string | null
          suppliers_assign_to: string | null
          transportation_assign_to: string | null
          vendors_assign_to: string | null
          venue_assign_to: string | null
        }
        Insert: {
          booking_assign_to?: string | null
          collab_type: string
          created_at?: string
          entertainment_assign_to?: string | null
          external_vendor_assign_to_text?: string | null
          hospitality_assign_to?: string | null
          marketing_assign_to_text?: string | null
          service_rental_buy_assign_to_text?: string | null
          services_assign_to?: string | null
          suppliers_assign_to?: string | null
          transportation_assign_to?: string | null
          vendors_assign_to?: string | null
          venue_assign_to?: string | null
        }
        Update: {
          booking_assign_to?: string | null
          collab_type?: string
          created_at?: string
          entertainment_assign_to?: string | null
          external_vendor_assign_to_text?: string | null
          hospitality_assign_to?: string | null
          marketing_assign_to_text?: string | null
          service_rental_buy_assign_to_text?: string | null
          services_assign_to?: string | null
          suppliers_assign_to?: string | null
          transportation_assign_to?: string | null
          vendors_assign_to?: string | null
          venue_assign_to?: string | null
        }
        Relationships: []
      }
      Comments: {
        Row: {
          comment: string
          created_at: string
          creator: string[] | null
          subject: string | null
        }
        Insert: {
          comment: string
          created_at?: string
          creator?: string[] | null
          subject?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          creator?: string[] | null
          subject?: string | null
        }
        Relationships: []
      }
      confirmation_submissions: {
        Row: {
          book_id: string
          confirmation_number: string
          created_at: string
          email: string
          event_id: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          book_id: string
          confirmation_number: string
          created_at?: string
          email: string
          event_id?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          book_id?: string
          confirmation_number?: string
          created_at?: string
          email?: string
          event_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "confirmation_submissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "Create Event"
            referencedColumns: ["userid"]
          },
          {
            foreignKeyName: "confirmation_submissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "create_event_safe"
            referencedColumns: ["userid"]
          },
        ]
      }
      "Create Event": {
        Row: {
          booking_type: string[] | null
          contact_name: string | null
          contact_phone_nbr: number | null
          created_at: string
          email: string | null
          entertainment_type: string[] | null
          event_budget: number | null
          event_collaborators: string[] | null
          event_description: string | null
          event_end_date: string | null
          event_end_time: string | null
          event_location: string[] | null
          event_start_date: string | null
          event_start_time: string | null
          event_theme: string[] | null
          Hospitality_Location: number | null
          hospitality_type_arr: string[] | null
          is_booking_available: boolean | null
          is_service_rental_available: boolean | null
          is_service_type_availabe: boolean | null
          is_service_vendor: boolean | null
          is_supply_available: boolean | null
          is_transportation_available: boolean | null
          is_venue_available: boolean | null
          marketing_type_arr: string[] | null
          notification: string | null
          priority: string[] | null
          resource_cost: number | null
          resources: string[] | null
          service_rental_type: string | null
          supplier_type: string[] | null
          transportation_type: string | null
          transportation_type_arr: string[] | null
          userid: string
          Venue_Location: string[] | null
          venue_type: string[] | null
        }
        Insert: {
          booking_type?: string[] | null
          contact_name?: string | null
          contact_phone_nbr?: number | null
          created_at?: string
          email?: string | null
          entertainment_type?: string[] | null
          event_budget?: number | null
          event_collaborators?: string[] | null
          event_description?: string | null
          event_end_date?: string | null
          event_end_time?: string | null
          event_location?: string[] | null
          event_start_date?: string | null
          event_start_time?: string | null
          event_theme?: string[] | null
          Hospitality_Location?: number | null
          hospitality_type_arr?: string[] | null
          is_booking_available?: boolean | null
          is_service_rental_available?: boolean | null
          is_service_type_availabe?: boolean | null
          is_service_vendor?: boolean | null
          is_supply_available?: boolean | null
          is_transportation_available?: boolean | null
          is_venue_available?: boolean | null
          marketing_type_arr?: string[] | null
          notification?: string | null
          priority?: string[] | null
          resource_cost?: number | null
          resources?: string[] | null
          service_rental_type?: string | null
          supplier_type?: string[] | null
          transportation_type?: string | null
          transportation_type_arr?: string[] | null
          userid: string
          Venue_Location?: string[] | null
          venue_type?: string[] | null
        }
        Update: {
          booking_type?: string[] | null
          contact_name?: string | null
          contact_phone_nbr?: number | null
          created_at?: string
          email?: string | null
          entertainment_type?: string[] | null
          event_budget?: number | null
          event_collaborators?: string[] | null
          event_description?: string | null
          event_end_date?: string | null
          event_end_time?: string | null
          event_location?: string[] | null
          event_start_date?: string | null
          event_start_time?: string | null
          event_theme?: string[] | null
          Hospitality_Location?: number | null
          hospitality_type_arr?: string[] | null
          is_booking_available?: boolean | null
          is_service_rental_available?: boolean | null
          is_service_type_availabe?: boolean | null
          is_service_vendor?: boolean | null
          is_supply_available?: boolean | null
          is_transportation_available?: boolean | null
          is_venue_available?: boolean | null
          marketing_type_arr?: string[] | null
          notification?: string | null
          priority?: string[] | null
          resource_cost?: number | null
          resources?: string[] | null
          service_rental_type?: string | null
          supplier_type?: string[] | null
          transportation_type?: string | null
          transportation_type_arr?: string[] | null
          userid?: string
          Venue_Location?: string[] | null
          venue_type?: string[] | null
        }
        Relationships: []
      }
      email_events: {
        Row: {
          created_at: string
          error: string | null
          event_id: string | null
          id: string
          metadata: Json | null
          provider: string | null
          recipient: string
          status: string
          template: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_id?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          recipient: string
          status?: string
          template: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          event_id?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          recipient?: string
          status?: string
          template?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "due_soon_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_kpi_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "email_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_category_counts"
            referencedColumns: ["event_id"]
          },
        ]
      }
      "Entertainment Directory": {
        Row: {
          created_at: string
          "DJ Music": string | null
          id: number
          Musicians: string | null
          Other: string | null
          Performer: string | null
          Speaker: string | null
          Stage_Production: string | null
          "Standup Comic": string | null
        }
        Insert: {
          created_at?: string
          "DJ Music"?: string | null
          id?: number
          Musicians?: string | null
          Other?: string | null
          Performer?: string | null
          Speaker?: string | null
          Stage_Production?: string | null
          "Standup Comic"?: string | null
        }
        Update: {
          created_at?: string
          "DJ Music"?: string | null
          id?: number
          Musicians?: string | null
          Other?: string | null
          Performer?: string | null
          Speaker?: string | null
          Stage_Production?: string | null
          "Standup Comic"?: string | null
        }
        Relationships: []
      }
      "Entertainment Profile": {
        Row: {
          Available_Dates: string | null
          Business_Location: string | null
          Business_Name: string | null
          Contact_Name: string | null
          Contact_Ph_Nbr: number | null
          created_at: string
          Email: string | null
          Genre: string | null
          id: number
          Price: number | null
          type_id: string | null
        }
        Insert: {
          Available_Dates?: string | null
          Business_Location?: string | null
          Business_Name?: string | null
          Contact_Name?: string | null
          Contact_Ph_Nbr?: number | null
          created_at?: string
          Email?: string | null
          Genre?: string | null
          id?: number
          Price?: number | null
          type_id?: string | null
        }
        Update: {
          Available_Dates?: string | null
          Business_Location?: string | null
          Business_Name?: string | null
          Contact_Name?: string | null
          Contact_Ph_Nbr?: number | null
          created_at?: string
          Email?: string | null
          Genre?: string | null
          id?: number
          Price?: number | null
          type_id?: string | null
        }
        Relationships: []
      }
      entertainment_types: {
        Row: {
          created_at: string
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      entertainments: {
        Row: {
          business_name: string
          checklist: Json | null
          checklist_completed_count: number | null
          city: string | null
          contact_name: string | null
          created_at: string
          description: string | null
          email: string | null
          ent_type_id: number | null
          entertainment_directory_id: number | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          phone_number: string | null
          price: number | null
          rating: number | null
          state: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          business_name: string
          checklist?: Json | null
          checklist_completed_count?: number | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          ent_type_id?: number | null
          entertainment_directory_id?: number | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          phone_number?: string | null
          price?: number | null
          rating?: number | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          business_name?: string
          checklist?: Json | null
          checklist_completed_count?: number | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          ent_type_id?: number | null
          entertainment_directory_id?: number | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          phone_number?: string | null
          price?: number | null
          rating?: number | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entertainments_directory_id_fkey"
            columns: ["entertainment_directory_id"]
            isOneToOne: false
            referencedRelation: "Entertainment Directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entertainments_ent_type_id_fkey"
            columns: ["ent_type_id"]
            isOneToOne: false
            referencedRelation: "entertainment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      "Event Analytics": {
        Row: {
          avg_task_duration: number | null
          created_at: string
          event_count_update: number | null
          event_freq_by_location: string | null
          event_id: number
          lead_conversion_rate: number | null
          resource_util_percent: number | null
          task_completion_rate: number | null
        }
        Insert: {
          avg_task_duration?: number | null
          created_at?: string
          event_count_update?: number | null
          event_freq_by_location?: string | null
          event_id: number
          lead_conversion_rate?: number | null
          resource_util_percent?: number | null
          task_completion_rate?: number | null
        }
        Update: {
          avg_task_duration?: number | null
          created_at?: string
          event_count_update?: number | null
          event_freq_by_location?: string | null
          event_id?: number
          lead_conversion_rate?: number | null
          resource_util_percent?: number | null
          task_completion_rate?: number | null
        }
        Relationships: []
      }
      "Event Plan Report": {
        Row: {
          created_at: string
          event_attendee_count: number | null
          event_budget: number | null
          event_collaborators_name: string | null
          event_comments: string | null
          event_description: string | null
          event_end_date: string | null
          event_end_time: string | null
          event_entertain_biz_name: string | null
          event_entertain_collab_name: string | null
          event_entertain_contact_name: string | null
          event_entertain_contact_nbr: number | null
          event_entertain_cost: number | null
          event_entertain_email: string | null
          event_entertain_end_date: string | null
          event_entertain_location: string | null
          event_entertain_start_date: string | null
          event_entertain_type: string | null
          event_ext_vendor_biz_name: string | null
          event_ext_vendor_collab_name: string | null
          event_ext_vendor_contact_name: string | null
          event_ext_vendor_contact_nbr: number | null
          event_ext_vendor_cost: number | null
          event_ext_vendor_email: string | null
          event_ext_vendor_type: string | null
          event_hosp_biz_name: string | null
          event_hosp_check_in_date: string | null
          event_hosp_check_out_date: string | null
          event_hosp_contact_name: string | null
          event_hosp_contact_nbr: number | null
          event_hosp_cost: number | null
          event_hosp_location: string | null
          event_hosp_type: string | null
          event_location: string | null
          event_market_biz_name: string | null
          event_market_collab_name: string | null
          event_market_contact_name: string | null
          event_market_contact_nbr: number | null
          event_market_cost: number | null
          event_market_email: string | null
          event_market_type: string | null
          event_priority: string | null
          event_start_date: string | null
          event_start_time: string | null
          event_status: string | null
          event_theme: string | null
          event_total_cost: number | null
          event_transport_biz_name: string | null
          event_transport_collab_name: string | null
          event_transport_contact_name: string | null
          event_transport_contact_nbr: number | null
          event_transport_cost: number | null
          event_transport_email: string | null
          event_transport_end_date: string | null
          event_transport_location: string | null
          event_transport_start_date: string | null
          event_transport_type: string | null
          event_type: string | null
          event_vend_biz_name: string | null
          event_vend_collab_name: string | null
          event_vend_contact_name: string | null
          event_vend_contact_nbr: number | null
          event_vend_cost: Database["public"]["Enums"]["budget_category"] | null
          event_vend_email: string | null
          event_vend_end_date: string | null
          event_vend_location: string | null
          event_vend_start_date: string | null
          event_vend_type: string | null
          event_venue_biz_name: string | null
          event_venue_check_in_date: string | null
          event_venue_check_out_date: string | null
          event_venue_collab_name: string | null
          event_venue_contact_name: string | null
          event_venue_contact_nbr: number | null
          event_venue_cost: number | null
          event_venue_location: string | null
          event_venue_type: string | null
          hosp_email: string | null
          user_contact_name: string | null
          user_contact_nbr: number | null
          user_name: string | null
          userid: string
          venue_email: string | null
        }
        Insert: {
          created_at?: string
          event_attendee_count?: number | null
          event_budget?: number | null
          event_collaborators_name?: string | null
          event_comments?: string | null
          event_description?: string | null
          event_end_date?: string | null
          event_end_time?: string | null
          event_entertain_biz_name?: string | null
          event_entertain_collab_name?: string | null
          event_entertain_contact_name?: string | null
          event_entertain_contact_nbr?: number | null
          event_entertain_cost?: number | null
          event_entertain_email?: string | null
          event_entertain_end_date?: string | null
          event_entertain_location?: string | null
          event_entertain_start_date?: string | null
          event_entertain_type?: string | null
          event_ext_vendor_biz_name?: string | null
          event_ext_vendor_collab_name?: string | null
          event_ext_vendor_contact_name?: string | null
          event_ext_vendor_contact_nbr?: number | null
          event_ext_vendor_cost?: number | null
          event_ext_vendor_email?: string | null
          event_ext_vendor_type?: string | null
          event_hosp_biz_name?: string | null
          event_hosp_check_in_date?: string | null
          event_hosp_check_out_date?: string | null
          event_hosp_contact_name?: string | null
          event_hosp_contact_nbr?: number | null
          event_hosp_cost?: number | null
          event_hosp_location?: string | null
          event_hosp_type?: string | null
          event_location?: string | null
          event_market_biz_name?: string | null
          event_market_collab_name?: string | null
          event_market_contact_name?: string | null
          event_market_contact_nbr?: number | null
          event_market_cost?: number | null
          event_market_email?: string | null
          event_market_type?: string | null
          event_priority?: string | null
          event_start_date?: string | null
          event_start_time?: string | null
          event_status?: string | null
          event_theme?: string | null
          event_total_cost?: number | null
          event_transport_biz_name?: string | null
          event_transport_collab_name?: string | null
          event_transport_contact_name?: string | null
          event_transport_contact_nbr?: number | null
          event_transport_cost?: number | null
          event_transport_email?: string | null
          event_transport_end_date?: string | null
          event_transport_location?: string | null
          event_transport_start_date?: string | null
          event_transport_type?: string | null
          event_type?: string | null
          event_vend_biz_name?: string | null
          event_vend_collab_name?: string | null
          event_vend_contact_name?: string | null
          event_vend_contact_nbr?: number | null
          event_vend_cost?:
            | Database["public"]["Enums"]["budget_category"]
            | null
          event_vend_email?: string | null
          event_vend_end_date?: string | null
          event_vend_location?: string | null
          event_vend_start_date?: string | null
          event_vend_type?: string | null
          event_venue_biz_name?: string | null
          event_venue_check_in_date?: string | null
          event_venue_check_out_date?: string | null
          event_venue_collab_name?: string | null
          event_venue_contact_name?: string | null
          event_venue_contact_nbr?: number | null
          event_venue_cost?: number | null
          event_venue_location?: string | null
          event_venue_type?: string | null
          hosp_email?: string | null
          user_contact_name?: string | null
          user_contact_nbr?: number | null
          user_name?: string | null
          userid?: string
          venue_email?: string | null
        }
        Update: {
          created_at?: string
          event_attendee_count?: number | null
          event_budget?: number | null
          event_collaborators_name?: string | null
          event_comments?: string | null
          event_description?: string | null
          event_end_date?: string | null
          event_end_time?: string | null
          event_entertain_biz_name?: string | null
          event_entertain_collab_name?: string | null
          event_entertain_contact_name?: string | null
          event_entertain_contact_nbr?: number | null
          event_entertain_cost?: number | null
          event_entertain_email?: string | null
          event_entertain_end_date?: string | null
          event_entertain_location?: string | null
          event_entertain_start_date?: string | null
          event_entertain_type?: string | null
          event_ext_vendor_biz_name?: string | null
          event_ext_vendor_collab_name?: string | null
          event_ext_vendor_contact_name?: string | null
          event_ext_vendor_contact_nbr?: number | null
          event_ext_vendor_cost?: number | null
          event_ext_vendor_email?: string | null
          event_ext_vendor_type?: string | null
          event_hosp_biz_name?: string | null
          event_hosp_check_in_date?: string | null
          event_hosp_check_out_date?: string | null
          event_hosp_contact_name?: string | null
          event_hosp_contact_nbr?: number | null
          event_hosp_cost?: number | null
          event_hosp_location?: string | null
          event_hosp_type?: string | null
          event_location?: string | null
          event_market_biz_name?: string | null
          event_market_collab_name?: string | null
          event_market_contact_name?: string | null
          event_market_contact_nbr?: number | null
          event_market_cost?: number | null
          event_market_email?: string | null
          event_market_type?: string | null
          event_priority?: string | null
          event_start_date?: string | null
          event_start_time?: string | null
          event_status?: string | null
          event_theme?: string | null
          event_total_cost?: number | null
          event_transport_biz_name?: string | null
          event_transport_collab_name?: string | null
          event_transport_contact_name?: string | null
          event_transport_contact_nbr?: number | null
          event_transport_cost?: number | null
          event_transport_email?: string | null
          event_transport_end_date?: string | null
          event_transport_location?: string | null
          event_transport_start_date?: string | null
          event_transport_type?: string | null
          event_type?: string | null
          event_vend_biz_name?: string | null
          event_vend_collab_name?: string | null
          event_vend_contact_name?: string | null
          event_vend_contact_nbr?: number | null
          event_vend_cost?:
            | Database["public"]["Enums"]["budget_category"]
            | null
          event_vend_email?: string | null
          event_vend_end_date?: string | null
          event_vend_location?: string | null
          event_vend_start_date?: string | null
          event_vend_type?: string | null
          event_venue_biz_name?: string | null
          event_venue_check_in_date?: string | null
          event_venue_check_out_date?: string | null
          event_venue_collab_name?: string | null
          event_venue_contact_name?: string | null
          event_venue_contact_nbr?: number | null
          event_venue_cost?: number | null
          event_venue_location?: string | null
          event_venue_type?: string | null
          hosp_email?: string | null
          user_contact_name?: string | null
          user_contact_nbr?: number | null
          user_name?: string | null
          userid?: string
          venue_email?: string | null
        }
        Relationships: []
      }
      "Event Resources": {
        Row: {
          booking_types_text: string | null
          created_at: string
          entertainment_types_text: string | null
          event_id: number
          hospitality_types: string | null
          marketing_types_text: string | null
          service_rental_type: string | null
          service_vendor_type: string | null
          supply_type: string | null
          transportation_types_text: string | null
          vendor_types: string | null
          venue_types: string | null
        }
        Insert: {
          booking_types_text?: string | null
          created_at?: string
          entertainment_types_text?: string | null
          event_id?: number
          hospitality_types?: string | null
          marketing_types_text?: string | null
          service_rental_type?: string | null
          service_vendor_type?: string | null
          supply_type?: string | null
          transportation_types_text?: string | null
          vendor_types?: string | null
          venue_types?: string | null
        }
        Update: {
          booking_types_text?: string | null
          created_at?: string
          entertainment_types_text?: string | null
          event_id?: number
          hospitality_types?: string | null
          marketing_types_text?: string | null
          service_rental_type?: string | null
          service_vendor_type?: string | null
          supply_type?: string | null
          transportation_types_text?: string | null
          vendor_types?: string | null
          venue_types?: string | null
        }
        Relationships: []
      }
      event_resource_selections: {
        Row: {
          created_at: string
          event_id: string
          id: string
          notes: string | null
          resource_id: string
          selection_type: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          resource_id: string
          selection_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          resource_id?: string
          selection_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_resource_selections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "due_soon_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_resource_selections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_kpi_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_resource_selections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_resource_selections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_category_counts"
            referencedColumns: ["event_id"]
          },
        ]
      }
      event_themes: {
        Row: {
          celebration_types: string[] | null
          created_at: string
          description: string | null
          dining_types: string[] | null
          festival_types: string[] | null
          health_wellness_types: string[] | null
          holiday_types: string[] | null
          id: number
          name: string
          personal_types: string[] | null
          premium: boolean
          retreat_types: string[] | null
          reunion_types: string[] | null
          tags: string[] | null
          wedding_types: string[] | null
        }
        Insert: {
          celebration_types?: string[] | null
          created_at?: string
          description?: string | null
          dining_types?: string[] | null
          festival_types?: string[] | null
          health_wellness_types?: string[] | null
          holiday_types?: string[] | null
          id?: number
          name: string
          personal_types?: string[] | null
          premium?: boolean
          retreat_types?: string[] | null
          reunion_types?: string[] | null
          tags?: string[] | null
          wedding_types?: string[] | null
        }
        Update: {
          celebration_types?: string[] | null
          created_at?: string
          description?: string | null
          dining_types?: string[] | null
          festival_types?: string[] | null
          health_wellness_types?: string[] | null
          holiday_types?: string[] | null
          id?: number
          name?: string
          personal_types?: string[] | null
          premium?: boolean
          retreat_types?: string[] | null
          reunion_types?: string[] | null
          tags?: string[] | null
          wedding_types?: string[] | null
        }
        Relationships: []
      }
      event_types: {
        Row: {
          created_at: string
          id: number
          name: string
          parent_id: number | null
          theme_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          parent_id?: number | null
          theme_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          parent_id?: number | null
          theme_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_types_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          archived: boolean
          budget: number | null
          created_at: string
          description: string | null
          end_date: string | null
          end_time: string | null
          entertainment_id: string | null
          expected_attendees: number | null
          id: string
          location: string | null
          serv_vendor_rental_id: string | null
          start_date: string
          start_time: string | null
          status: Database["public"]["Enums"]["event_status_enum"] | null
          theme_id: number | null
          title: string
          type_id: number | null
          updated_at: string
          user_id: string
          venue: string
        }
        Insert: {
          archived?: boolean
          budget?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          entertainment_id?: string | null
          expected_attendees?: number | null
          id?: string
          location?: string | null
          serv_vendor_rental_id?: string | null
          start_date: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["event_status_enum"] | null
          theme_id?: number | null
          title: string
          type_id?: number | null
          updated_at?: string
          user_id: string
          venue: string
        }
        Update: {
          archived?: boolean
          budget?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          entertainment_id?: string | null
          expected_attendees?: number | null
          id?: string
          location?: string | null
          serv_vendor_rental_id?: string | null
          start_date?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["event_status_enum"] | null
          theme_id?: number | null
          title?: string
          type_id?: number | null
          updated_at?: string
          user_id?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_entertainment_id_fkey"
            columns: ["entertainment_id"]
            isOneToOne: false
            referencedRelation: "entertainments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_serv_vendor_rental_id_fkey"
            columns: ["serv_vendor_rental_id"]
            isOneToOne: false
            referencedRelation: "serv_vendor_rentals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
        ]
      }
      "Hospitality Directory": {
        Row: {
          Airbnb: string | null
          created_at: string
          Hotel: string | null
          id: number
          Motel: string | null
          Other: string | null
          Resort: string | null
        }
        Insert: {
          Airbnb?: string | null
          created_at?: string
          Hotel?: string | null
          id?: number
          Motel?: string | null
          Other?: string | null
          Resort?: string | null
        }
        Update: {
          Airbnb?: string | null
          created_at?: string
          Hotel?: string | null
          id?: number
          Motel?: string | null
          Other?: string | null
          Resort?: string | null
        }
        Relationships: []
      }
      "Hospitality Profile": {
        Row: {
          created_at: string
          hosp_amendities: string[] | null
          hosp_biz_name: string | null
          hosp_contact_name: string | null
          hosp_contact_nbr: number | null
          hosp_email: string | null
          hosp_location: string[] | null
          hosp_price: number | null
          hosp_type_id: Database["public"]["Enums"]["budget_category"]
          hosp_website: string | null
          hospitality_type: number | null
        }
        Insert: {
          created_at?: string
          hosp_amendities?: string[] | null
          hosp_biz_name?: string | null
          hosp_contact_name?: string | null
          hosp_contact_nbr?: number | null
          hosp_email?: string | null
          hosp_location?: string[] | null
          hosp_price?: number | null
          hosp_type_id: Database["public"]["Enums"]["budget_category"]
          hosp_website?: string | null
          hospitality_type?: number | null
        }
        Update: {
          created_at?: string
          hosp_amendities?: string[] | null
          hosp_biz_name?: string | null
          hosp_contact_name?: string | null
          hosp_contact_nbr?: number | null
          hosp_email?: string | null
          hosp_location?: string[] | null
          hosp_price?: number | null
          hosp_type_id?: Database["public"]["Enums"]["budget_category"]
          hosp_website?: string | null
          hospitality_type?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Hospitality Profile_hospitality_type_fkey"
            columns: ["hospitality_type"]
            isOneToOne: false
            referencedRelation: "hospitality_types"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitality_profile_amenities: {
        Row: {
          amenity_type_id: number
          created_at: string
          hospitality_profile_id: string
          id: string
        }
        Insert: {
          amenity_type_id: number
          created_at?: string
          hospitality_profile_id: string
          id?: string
        }
        Update: {
          amenity_type_id?: number
          created_at?: string
          hospitality_profile_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospitality_profile_amenities_amenity_type_id_fkey"
            columns: ["amenity_type_id"]
            isOneToOne: false
            referencedRelation: "amenity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospitality_profile_amenities_hospitality_profile_id_fkey"
            columns: ["hospitality_profile_id"]
            isOneToOne: false
            referencedRelation: "hospitality_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitality_profiles: {
        Row: {
          business_name: string
          capacity: number | null
          checklist: Json | null
          checklist_completed_count: number | null
          city: string | null
          contact_name: string | null
          cost: number | null
          created_at: string
          email: string | null
          hospitality_type: number | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          make_reservations: string | null
          phone_number: string | null
          rating: number | null
          state: string | null
          updated_at: string
          website: string | null
          zip: string | null
        }
        Insert: {
          business_name: string
          capacity?: number | null
          checklist?: Json | null
          checklist_completed_count?: number | null
          city?: string | null
          contact_name?: string | null
          cost?: number | null
          created_at?: string
          email?: string | null
          hospitality_type?: number | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          make_reservations?: string | null
          phone_number?: string | null
          rating?: number | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          business_name?: string
          capacity?: number | null
          checklist?: Json | null
          checklist_completed_count?: number | null
          city?: string | null
          contact_name?: string | null
          cost?: number | null
          created_at?: string
          email?: string | null
          hospitality_type?: number | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          make_reservations?: string | null
          phone_number?: string | null
          rating?: number | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hospitality_profiles_hospitality_type_fkey"
            columns: ["hospitality_type"]
            isOneToOne: false
            referencedRelation: "hospitality_types"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitality_types: {
        Row: {
          created_at: string
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      "Manage Event": {
        Row: {
          bookings_type: string[] | null
          created_at: string
          entertainment_type: string[] | null
          event_budget_cost: number[] | null
          event_contact_email: string | null
          event_contact_name: string | null
          event_contact_ph_nbr: number | null
          event_date: string | null
          event_status: Database["public"]["Enums"]["event_status_enum"] | null
          event_theme: string | null
          event_time: string | null
          event_type: string | null
          event_user_id: string
          external_vendor_type: string[] | null
          hosp_biz_name: string | null
          hosp_booking_date: string | null
          hosp_booking_time: string | null
          hosp_contact_name: string | null
          hosp_contact_nbr: number | null
          hosp_cost: number | null
          hosp_email: string | null
          hosp_location: string | null
          service_biz_name: string | null
          service_cost: number | null
          service_delivery_date: string | null
          service_delivery_location: string | null
          service_delivery_time: string | null
          service_rental_type: string[] | null
          service_type: string[] | null
          service_vendor_type: string[] | null
          set_priority: string | null
          supplier_biz_name: string | null
          supplier_contact_name: string | null
          supplier_contact_nbr: number | null
          supplier_email: string | null
          supply_cost: number | null
          supply_delivery_date: string | null
          supply_delivery_time: string | null
          supply_type: string[] | null
          task_status: string | null
          transportation_type: string[] | null
          vendor_biz_name: string | null
          vendor_contact_name: string | null
          vendor_contact_nbr: number | null
          vendor_cost: number | null
          vendor_email: string | null
          venue_booking_date: string | null
          venue_booking_time: string | null
          venue_contact_name: string | null
          venue_contact_ph_nbr: number | null
          venue_cost: number | null
          venue_location: string | null
          venue_name: string | null
          venue_type: string | null
        }
        Insert: {
          bookings_type?: string[] | null
          created_at?: string
          entertainment_type?: string[] | null
          event_budget_cost?: number[] | null
          event_contact_email?: string | null
          event_contact_name?: string | null
          event_contact_ph_nbr?: number | null
          event_date?: string | null
          event_status?: Database["public"]["Enums"]["event_status_enum"] | null
          event_theme?: string | null
          event_time?: string | null
          event_type?: string | null
          event_user_id: string
          external_vendor_type?: string[] | null
          hosp_biz_name?: string | null
          hosp_booking_date?: string | null
          hosp_booking_time?: string | null
          hosp_contact_name?: string | null
          hosp_contact_nbr?: number | null
          hosp_cost?: number | null
          hosp_email?: string | null
          hosp_location?: string | null
          service_biz_name?: string | null
          service_cost?: number | null
          service_delivery_date?: string | null
          service_delivery_location?: string | null
          service_delivery_time?: string | null
          service_rental_type?: string[] | null
          service_type?: string[] | null
          service_vendor_type?: string[] | null
          set_priority?: string | null
          supplier_biz_name?: string | null
          supplier_contact_name?: string | null
          supplier_contact_nbr?: number | null
          supplier_email?: string | null
          supply_cost?: number | null
          supply_delivery_date?: string | null
          supply_delivery_time?: string | null
          supply_type?: string[] | null
          task_status?: string | null
          transportation_type?: string[] | null
          vendor_biz_name?: string | null
          vendor_contact_name?: string | null
          vendor_contact_nbr?: number | null
          vendor_cost?: number | null
          vendor_email?: string | null
          venue_booking_date?: string | null
          venue_booking_time?: string | null
          venue_contact_name?: string | null
          venue_contact_ph_nbr?: number | null
          venue_cost?: number | null
          venue_location?: string | null
          venue_name?: string | null
          venue_type?: string | null
        }
        Update: {
          bookings_type?: string[] | null
          created_at?: string
          entertainment_type?: string[] | null
          event_budget_cost?: number[] | null
          event_contact_email?: string | null
          event_contact_name?: string | null
          event_contact_ph_nbr?: number | null
          event_date?: string | null
          event_status?: Database["public"]["Enums"]["event_status_enum"] | null
          event_theme?: string | null
          event_time?: string | null
          event_type?: string | null
          event_user_id?: string
          external_vendor_type?: string[] | null
          hosp_biz_name?: string | null
          hosp_booking_date?: string | null
          hosp_booking_time?: string | null
          hosp_contact_name?: string | null
          hosp_contact_nbr?: number | null
          hosp_cost?: number | null
          hosp_email?: string | null
          hosp_location?: string | null
          service_biz_name?: string | null
          service_cost?: number | null
          service_delivery_date?: string | null
          service_delivery_location?: string | null
          service_delivery_time?: string | null
          service_rental_type?: string[] | null
          service_type?: string[] | null
          service_vendor_type?: string[] | null
          set_priority?: string | null
          supplier_biz_name?: string | null
          supplier_contact_name?: string | null
          supplier_contact_nbr?: number | null
          supplier_email?: string | null
          supply_cost?: number | null
          supply_delivery_date?: string | null
          supply_delivery_time?: string | null
          supply_type?: string[] | null
          task_status?: string | null
          transportation_type?: string[] | null
          vendor_biz_name?: string | null
          vendor_contact_name?: string | null
          vendor_contact_nbr?: number | null
          vendor_cost?: number | null
          vendor_email?: string | null
          venue_booking_date?: string | null
          venue_booking_time?: string | null
          venue_contact_name?: string | null
          venue_contact_ph_nbr?: number | null
          venue_cost?: number | null
          venue_location?: string | null
          venue_name?: string | null
          venue_type?: string | null
        }
        Relationships: []
      }
      "Manage Event Tasks": {
        Row: {
          analytics_update: Json[] | null
          created_at: string
          event_theme: string
          linked_event_id: string | null
          progress_update: string | null
          resource_update: string | null
          task_align_update: Json[] | null
          task_change_update: string[] | null
          task_completion_time_update: string | null
          task_modified_date: string | null
          task_update: string[] | null
        }
        Insert: {
          analytics_update?: Json[] | null
          created_at?: string
          event_theme: string
          linked_event_id?: string | null
          progress_update?: string | null
          resource_update?: string | null
          task_align_update?: Json[] | null
          task_change_update?: string[] | null
          task_completion_time_update?: string | null
          task_modified_date?: string | null
          task_update?: string[] | null
        }
        Update: {
          analytics_update?: Json[] | null
          created_at?: string
          event_theme?: string
          linked_event_id?: string | null
          progress_update?: string | null
          resource_update?: string | null
          task_align_update?: Json[] | null
          task_change_update?: string[] | null
          task_completion_time_update?: string | null
          task_modified_date?: string | null
          task_update?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "Manage Event Tasks_linked_event_id_fkey"
            columns: ["linked_event_id"]
            isOneToOne: false
            referencedRelation: "due_soon_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Manage Event Tasks_linked_event_id_fkey"
            columns: ["linked_event_id"]
            isOneToOne: false
            referencedRelation: "event_kpi_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "Manage Event Tasks_linked_event_id_fkey"
            columns: ["linked_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Manage Event Tasks_linked_event_id_fkey"
            columns: ["linked_event_id"]
            isOneToOne: false
            referencedRelation: "vendor_category_counts"
            referencedColumns: ["event_id"]
          },
        ]
      }
      "Marketing Directory": {
        Row: {
          created_at: string
          "Digital Ads": string | null
          "Email Marketing": string | null
          "Event Promo": string | null
          id: number
          Influencer: string | null
          Other: string | null
          "PR / Press": string | null
          "Print Media": string | null
          "Social Media": string | null
        }
        Insert: {
          created_at?: string
          "Digital Ads"?: string | null
          "Email Marketing"?: string | null
          "Event Promo"?: string | null
          id?: number
          Influencer?: string | null
          Other?: string | null
          "PR / Press"?: string | null
          "Print Media"?: string | null
          "Social Media"?: string | null
        }
        Update: {
          created_at?: string
          "Digital Ads"?: string | null
          "Email Marketing"?: string | null
          "Event Promo"?: string | null
          id?: number
          Influencer?: string | null
          Other?: string | null
          "PR / Press"?: string | null
          "Print Media"?: string | null
          "Social Media"?: string | null
        }
        Relationships: []
      }
      marketing_profiles: {
        Row: {
          address: string | null
          budget_range_max: number | null
          budget_range_min: number | null
          business_name: string
          campaign_types: string[] | null
          checklist: Json | null
          checklist_completed_count: number | null
          city: string | null
          contact_name: string | null
          created_at: string
          description: string | null
          email: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          is_active: boolean | null
          linkedin_url: string | null
          marketing_directory_id: number | null
          marketing_type_id: number | null
          phone_number: string | null
          platforms: string[] | null
          portfolio_url: string | null
          price: number | null
          price_unit: string | null
          rating: number | null
          specialization: string | null
          state: string | null
          target_audience: string | null
          total_reviews: number | null
          twitter_url: string | null
          updated_at: string
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          budget_range_max?: number | null
          budget_range_min?: number | null
          business_name: string
          campaign_types?: string[] | null
          checklist?: Json | null
          checklist_completed_count?: number | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          marketing_directory_id?: number | null
          marketing_type_id?: number | null
          phone_number?: string | null
          platforms?: string[] | null
          portfolio_url?: string | null
          price?: number | null
          price_unit?: string | null
          rating?: number | null
          specialization?: string | null
          state?: string | null
          target_audience?: string | null
          total_reviews?: number | null
          twitter_url?: string | null
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          budget_range_max?: number | null
          budget_range_min?: number | null
          business_name?: string
          campaign_types?: string[] | null
          checklist?: Json | null
          checklist_completed_count?: number | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          marketing_directory_id?: number | null
          marketing_type_id?: number | null
          phone_number?: string | null
          platforms?: string[] | null
          portfolio_url?: string | null
          price?: number | null
          price_unit?: string | null
          rating?: number | null
          specialization?: string | null
          state?: string | null
          target_audience?: string | null
          total_reviews?: number | null
          twitter_url?: string | null
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_profiles_marketing_directory_id_fkey"
            columns: ["marketing_directory_id"]
            isOneToOne: false
            referencedRelation: "Marketing Directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_profiles_marketing_type_id_fkey"
            columns: ["marketing_type_id"]
            isOneToOne: false
            referencedRelation: "marketing_types"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_types: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          channel: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_id: string | null
          id: string
          is_read: boolean
          message: string
          recipient_id: string
          sender_id: string | null
          sent_at: string | null
          title: string
          type: string
        }
        Insert: {
          channel?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          recipient_id: string
          sender_id?: string | null
          sent_at?: string | null
          title: string
          type: string
        }
        Update: {
          channel?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          recipient_id?: string
          sender_id?: string | null
          sent_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "due_soon_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_kpi_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_category_counts"
            referencedColumns: ["event_id"]
          },
        ]
      }
      private_profiles: {
        Row: {
          email: string | null
          pay_method: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          email?: string | null
          pay_method?: string | null
          phone?: string | null
          user_id: string
        }
        Update: {
          email?: string | null
          pay_method?: string | null
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      private_residence_responses: {
        Row: {
          created_at: string
          email: string
          event_id: string | null
          id: string
          phone_number: string
          street_address: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          event_id?: string | null
          id?: string
          phone_number: string
          street_address: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          event_id?: string | null
          id?: string
          phone_number?: string
          street_address?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      qrcode_submissions: {
        Row: {
          book_id: string
          created_at: string
          email: string
          event_name: string
          id: string
          notes: string | null
          phone: string | null
          ticket_number: string
          updated_at: string
        }
        Insert: {
          book_id: string
          created_at?: string
          email: string
          event_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          ticket_number: string
          updated_at?: string
        }
        Update: {
          book_id?: string
          created_at?: string
          email?: string
          event_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          ticket_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      registry_submissions: {
        Row: {
          book_id: string
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          selected_items: Json
          total_amount: number
          updated_at: string
        }
        Insert: {
          book_id: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          selected_items: Json
          total_amount: number
          updated_at?: string
        }
        Update: {
          book_id?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          selected_items?: Json
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      reservation_submissions: {
        Row: {
          book_id: string
          created_at: string
          email: string
          event_id: string | null
          id: string
          name: string
          party_size: number
          phone: string
          preferred_date: string
          preferred_time: string
          special_requests: string | null
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          book_id: string
          created_at?: string
          email: string
          event_id?: string | null
          id?: string
          name: string
          party_size: number
          phone: string
          preferred_date: string
          preferred_time: string
          special_requests?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string
          email?: string
          event_id?: string | null
          id?: string
          name?: string
          party_size?: number
          phone?: string
          preferred_date?: string
          preferred_time?: string
          special_requests?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservation_submissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "Create Event"
            referencedColumns: ["userid"]
          },
          {
            foreignKeyName: "reservation_submissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "create_event_safe"
            referencedColumns: ["userid"]
          },
          {
            foreignKeyName: "reservation_submissions_venue_profile_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_categories: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      resource_status: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          allocated: number
          category_id: number
          created_at: string
          event_id: string
          id: string
          location: string
          name: string
          status_id: number | null
          total: number
          updated_at: string
        }
        Insert: {
          allocated?: number
          category_id: number
          created_at?: string
          event_id: string
          id?: string
          location: string
          name: string
          status_id?: number | null
          total?: number
          updated_at?: string
        }
        Update: {
          allocated?: number
          category_id?: number
          created_at?: string
          event_id?: string
          id?: string
          location?: string
          name?: string
          status_id?: number | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "due_soon_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_kpi_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "resources_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_category_counts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "resources_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "resource_status"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permission_groups: {
        Row: {
          created_at: string | null
          permission_group: Database["public"]["Enums"]["permission_level"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          permission_group: Database["public"]["Enums"]["permission_level"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          permission_group?: Database["public"]["Enums"]["permission_level"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      rsvp_submissions: {
        Row: {
          book_id: string
          created_at: string
          event_id: string | null
          guest_count: number | null
          guest_email: string
          guest_name: string
          id: string
          response_type: string
          special_requests: string | null
          updated_at: string
        }
        Insert: {
          book_id: string
          created_at?: string
          event_id?: string | null
          guest_count?: number | null
          guest_email: string
          guest_name: string
          id?: string
          response_type: string
          special_requests?: string | null
          updated_at?: string
        }
        Update: {
          book_id?: string
          created_at?: string
          event_id?: string | null
          guest_count?: number | null
          guest_email?: string
          guest_name?: string
          id?: string
          response_type?: string
          special_requests?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_submissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "Create Event"
            referencedColumns: ["userid"]
          },
          {
            foreignKeyName: "rsvp_submissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "create_event_safe"
            referencedColumns: ["userid"]
          },
        ]
      }
      serv_vendor_rental_assignments: {
        Row: {
          created_at: string
          id: number
          serv_vendor_rental_id: string | null
          updated_at: string
          vendor_rental_type_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          serv_vendor_rental_id?: string | null
          updated_at?: string
          vendor_rental_type_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          serv_vendor_rental_id?: string | null
          updated_at?: string
          vendor_rental_type_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "serv_vendor_rental_types_serv_vendor_rental_id_fkey"
            columns: ["serv_vendor_rental_id"]
            isOneToOne: false
            referencedRelation: "serv_vendor_rentals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serv_vendor_rental_types_vendor_rental_type_id_fkey"
            columns: ["vendor_rental_type_id"]
            isOneToOne: false
            referencedRelation: "vendor_rental_types"
            referencedColumns: ["id"]
          },
        ]
      }
      serv_vendor_rentals: {
        Row: {
          business_name: string
          city: string | null
          contact_name: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          phone_number: string | null
          price: number | null
          state: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          business_name: string
          city?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          phone_number?: string | null
          price?: number | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          business_name?: string
          city?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          phone_number?: string | null
          price?: number | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      serv_vendor_suppliers: {
        Row: {
          business_name: string
          checklist: Json | null
          checklist_completed_count: number | null
          city: string | null
          contact_name: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          phone_number: string | null
          price: number | null
          rating: number | null
          state: string | null
          updated_at: string
          vendor_sup_type_id: number | null
          zip: string | null
        }
        Insert: {
          business_name: string
          checklist?: Json | null
          checklist_completed_count?: number | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          phone_number?: string | null
          price?: number | null
          rating?: number | null
          state?: string | null
          updated_at?: string
          vendor_sup_type_id?: number | null
          zip?: string | null
        }
        Update: {
          business_name?: string
          checklist?: Json | null
          checklist_completed_count?: number | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          phone_number?: string | null
          price?: number | null
          rating?: number | null
          state?: string | null
          updated_at?: string
          vendor_sup_type_id?: number | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "serv_vendor_suppliers_vendor_sup_type_id_fkey"
            columns: ["vendor_sup_type_id"]
            isOneToOne: false
            referencedRelation: "vendor_supplier_types"
            referencedColumns: ["id"]
          },
        ]
      }
      "Service Profile": {
        Row: {
          "Business Name": string | null
          Contact_Name: string | null
          Contact_Ph_Nbr: number | null
          created_at: string
          Email: string | null
          id: number
          Location: string | null
          Price: number | null
          service_provided_listing: string | null
          Service_Type: string | null
        }
        Insert: {
          "Business Name"?: string | null
          Contact_Name?: string | null
          Contact_Ph_Nbr?: number | null
          created_at?: string
          Email?: string | null
          id?: number
          Location?: string | null
          Price?: number | null
          service_provided_listing?: string | null
          Service_Type?: string | null
        }
        Update: {
          "Business Name"?: string | null
          Contact_Name?: string | null
          Contact_Ph_Nbr?: number | null
          created_at?: string
          Email?: string | null
          id?: number
          Location?: string | null
          Price?: number | null
          service_provided_listing?: string | null
          Service_Type?: string | null
        }
        Relationships: []
      }
      "Service Rental/Sale Directory": {
        Row: {
          audio_visual_equip: string | null
          child_play_equip: string[] | null
          created_at: string
          entertainment_options: string | null
          flowers_plants: string | null
          game_tables: string | null
          housewares: string | null
          lighting: string | null
          photo_both: string | null
          potty_johns: number | null
          prod_props: string | null
          rental_type_id: string
          table_chairs: string | null
          tents: string | null
          transport_options: string | null
          venue_space_decor: string[] | null
        }
        Insert: {
          audio_visual_equip?: string | null
          child_play_equip?: string[] | null
          created_at?: string
          entertainment_options?: string | null
          flowers_plants?: string | null
          game_tables?: string | null
          housewares?: string | null
          lighting?: string | null
          photo_both?: string | null
          potty_johns?: number | null
          prod_props?: string | null
          rental_type_id: string
          table_chairs?: string | null
          tents?: string | null
          transport_options?: string | null
          venue_space_decor?: string[] | null
        }
        Update: {
          audio_visual_equip?: string | null
          child_play_equip?: string[] | null
          created_at?: string
          entertainment_options?: string | null
          flowers_plants?: string | null
          game_tables?: string | null
          housewares?: string | null
          lighting?: string | null
          photo_both?: string | null
          potty_johns?: number | null
          prod_props?: string | null
          rental_type_id?: string
          table_chairs?: string | null
          tents?: string | null
          transport_options?: string | null
          venue_space_decor?: string[] | null
        }
        Relationships: []
      }
      "Service Vendor Directory": {
        Row: {
          bakery: string | null
          caterer: string | null
          chef: string | null
          created_at: string
          mixologist: string | null
          service_vendor_id: string
          videographer: string | null
        }
        Insert: {
          bakery?: string | null
          caterer?: string | null
          chef?: string | null
          created_at?: string
          mixologist?: string | null
          service_vendor_id: string
          videographer?: string | null
        }
        Update: {
          bakery?: string | null
          caterer?: string | null
          chef?: string | null
          created_at?: string
          mixologist?: string | null
          service_vendor_id?: string
          videographer?: string | null
        }
        Relationships: []
      }
      "Subscription_Plans Directory": {
        Row: {
          created_at: string
          Enterprise: number | null
          id: number
          Premium: number | null
          "Premium Plus": number | null
          "Special Promo": string | null
          Standard_Plan: number | null
          Trial: string | null
        }
        Insert: {
          created_at?: string
          Enterprise?: number | null
          id?: number
          Premium?: number | null
          "Premium Plus"?: number | null
          "Special Promo"?: string | null
          Standard_Plan?: number | null
          Trial?: string | null
        }
        Update: {
          created_at?: string
          Enterprise?: number | null
          id?: number
          Premium?: number | null
          "Premium Plus"?: number | null
          "Special Promo"?: string | null
          Standard_Plan?: number | null
          Trial?: string | null
        }
        Relationships: []
      }
      "Supplier Directory": {
        Row: {
          created_at: string
          Distributor: string | null
          Food_Wholesaler: string | null
          id: number
          Merchandizer: string | null
          Online_Market: string | null
          Other: string | null
          Wholesaler: string | null
        }
        Insert: {
          created_at?: string
          Distributor?: string | null
          Food_Wholesaler?: string | null
          id?: number
          Merchandizer?: string | null
          Online_Market?: string | null
          Other?: string | null
          Wholesaler?: string | null
        }
        Update: {
          created_at?: string
          Distributor?: string | null
          Food_Wholesaler?: string | null
          id?: number
          Merchandizer?: string | null
          Online_Market?: string | null
          Other?: string | null
          Wholesaler?: string | null
        }
        Relationships: []
      }
      "Supplier Profile": {
        Row: {
          created_at: string
          distributor_supplier_biz_name: string | null
          merchandizer_supllier_biz_name: string | null
          online_marketplace_supplier_biz_name: string | null
          supplier_contact_name: string | null
          supplier_contact_nbr: number | null
          supplier_email: string | null
          supplier_location: string | null
          supplier_type: string | null
          supply_id: string
          wholesaler_supplier_biz_name: string | null
        }
        Insert: {
          created_at?: string
          distributor_supplier_biz_name?: string | null
          merchandizer_supllier_biz_name?: string | null
          online_marketplace_supplier_biz_name?: string | null
          supplier_contact_name?: string | null
          supplier_contact_nbr?: number | null
          supplier_email?: string | null
          supplier_location?: string | null
          supplier_type?: string | null
          supply_id: string
          wholesaler_supplier_biz_name?: string | null
        }
        Update: {
          created_at?: string
          distributor_supplier_biz_name?: string | null
          merchandizer_supllier_biz_name?: string | null
          online_marketplace_supplier_biz_name?: string | null
          supplier_contact_name?: string | null
          supplier_contact_nbr?: number | null
          supplier_email?: string | null
          supplier_location?: string | null
          supplier_type?: string | null
          supply_id?: string
          wholesaler_supplier_biz_name?: string | null
        }
        Relationships: []
      }
      "Supplier Vendor Profile": {
        Row: {
          created_at: string
          inventory_listing: string | null
          supp_biz_name: string | null
          supp_contact_name: string | null
          supp_contact_nbr: number | null
          supp_contact_role: string | null
          supp_email: string | null
          supp_location: string | null
          supp_name: string | null
          supp_rate: number | null
          type: number
        }
        Insert: {
          created_at?: string
          inventory_listing?: string | null
          supp_biz_name?: string | null
          supp_contact_name?: string | null
          supp_contact_nbr?: number | null
          supp_contact_role?: string | null
          supp_email?: string | null
          supp_location?: string | null
          supp_name?: string | null
          supp_rate?: number | null
          type?: number
        }
        Update: {
          created_at?: string
          inventory_listing?: string | null
          supp_biz_name?: string | null
          supp_contact_name?: string | null
          supp_contact_nbr?: number | null
          supp_contact_role?: string | null
          supp_email?: string | null
          supp_location?: string | null
          supp_name?: string | null
          supp_rate?: number | null
          type?: number
        }
        Relationships: []
      }
      supplier_categories: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      supplier_types: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          business_name: string
          category_id: number | null
          checklist: Json | null
          checklist_completed_count: number | null
          city: string | null
          contact_name: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          instagram_url: string | null
          inventory_images: string | null
          linkedin_url: string | null
          phone_number: string | null
          price: number | null
          rating: number | null
          state: string | null
          supplier_cost: number | null
          type_id: number | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          business_name: string
          category_id?: number | null
          checklist?: Json | null
          checklist_completed_count?: number | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          instagram_url?: string | null
          inventory_images?: string | null
          linkedin_url?: string | null
          phone_number?: string | null
          price?: number | null
          rating?: number | null
          state?: string | null
          supplier_cost?: number | null
          type_id?: number | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          business_name?: string
          category_id?: number | null
          checklist?: Json | null
          checklist_completed_count?: number | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          instagram_url?: string | null
          inventory_images?: string | null
          linkedin_url?: string | null
          phone_number?: string | null
          price?: number | null
          rating?: number | null
          state?: string | null
          supplier_cost?: number | null
          type_id?: number | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "supplier_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "supplier_types"
            referencedColumns: ["id"]
          },
        ]
      }
      task_collaborator_assignments: {
        Row: {
          created_at: string
          id: number
          is_collaborator: boolean
          is_viewer: boolean
          team_admin: boolean
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_collaborator?: boolean
          is_viewer?: boolean
          team_admin?: boolean
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          is_collaborator?: boolean
          is_viewer?: boolean
          team_admin?: boolean
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          archived: boolean
          assign_hospitality: string | null
          assign_transportation: string | null
          assigned_bookings_role: string | null
          assigned_coordinator_name: string | null
          assigned_entertainment_role: string | null
          assigned_external_vendor_role: string | null
          assigned_hospitality_role: string | null
          assigned_service_rental_role: string | null
          assigned_service_vendor_role: string | null
          assigned_supplier_vendor_role: string | null
          assigned_to: string | null
          assigned_to_display_name: string | null
          assigned_transportation_role: string | null
          assigned_venue_role: string | null
          assignment_type: string | null
          assined_vendor_role: string | null
          category: string | null
          change_request_id: string | null
          checklist: Json | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          end_date: string | null
          end_time: string | null
          estimated_hours: number | null
          event_id: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          resource_assignments: Json | null
          start_date: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          archived?: boolean
          assign_hospitality?: string | null
          assign_transportation?: string | null
          assigned_bookings_role?: string | null
          assigned_coordinator_name?: string | null
          assigned_entertainment_role?: string | null
          assigned_external_vendor_role?: string | null
          assigned_hospitality_role?: string | null
          assigned_service_rental_role?: string | null
          assigned_service_vendor_role?: string | null
          assigned_supplier_vendor_role?: string | null
          assigned_to?: string | null
          assigned_to_display_name?: string | null
          assigned_transportation_role?: string | null
          assigned_venue_role?: string | null
          assignment_type?: string | null
          assined_vendor_role?: string | null
          category?: string | null
          change_request_id?: string | null
          checklist?: Json | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          end_date?: string | null
          end_time?: string | null
          estimated_hours?: number | null
          event_id?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          resource_assignments?: Json | null
          start_date?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          archived?: boolean
          assign_hospitality?: string | null
          assign_transportation?: string | null
          assigned_bookings_role?: string | null
          assigned_coordinator_name?: string | null
          assigned_entertainment_role?: string | null
          assigned_external_vendor_role?: string | null
          assigned_hospitality_role?: string | null
          assigned_service_rental_role?: string | null
          assigned_service_vendor_role?: string | null
          assigned_supplier_vendor_role?: string | null
          assigned_to?: string | null
          assigned_to_display_name?: string | null
          assigned_transportation_role?: string | null
          assigned_venue_role?: string | null
          assignment_type?: string | null
          assined_vendor_role?: string | null
          category?: string | null
          change_request_id?: string | null
          checklist?: Json | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          end_date?: string | null
          end_time?: string | null
          estimated_hours?: number | null
          event_id?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          resource_assignments?: Json | null
          start_date?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assign_hospitality_fkey"
            columns: ["assign_hospitality"]
            isOneToOne: false
            referencedRelation: "hospitality_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assign_transportation_fkey"
            columns: ["assign_transportation"]
            isOneToOne: false
            referencedRelation: "transportation_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_change_request_id_fkey"
            columns: ["change_request_id"]
            isOneToOne: false
            referencedRelation: "change_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks_assignments: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          event_id: string
          event_theme: string
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"] | null
          task_name: string | null
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          event_id: string
          event_theme: string
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"] | null
          task_name?: string | null
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          event_id?: string
          event_theme?: string
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"] | null
          task_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks_dependencies: {
        Row: {
          created_at: string
          depends_on_task_id: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          depends_on_task_id: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          depends_on_task_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "event_task_timeline_view"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "tasks_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "event_task_timeline_view"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "tasks_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      team_assignments: {
        Row: {
          created_at: string
          id: number
          is_coordinator: boolean
          is_viewer: boolean
          team_admin: boolean
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_coordinator?: boolean
          is_viewer?: boolean
          team_admin?: boolean
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          is_coordinator?: boolean
          is_viewer?: boolean
          team_admin?: boolean
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_assignments_team_id_fkey1"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      template_tasks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          template_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          template_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          template_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      "Themes Directory": {
        Row: {
          baby_shower: string
          bridal_shower: string | null
          Celebration: string | null
          Dining: string | null
          Festival: string | null
          Health_Wellness: string | null
          market_place: string[] | null
          meet_up: string[] | null
          parties: string[] | null
          retreats: string | null
          reunion: string | null
          special_event: string[] | null
          sporting: string[] | null
          wedding: string | null
        }
        Insert: {
          baby_shower: string
          bridal_shower?: string | null
          Celebration?: string | null
          Dining?: string | null
          Festival?: string | null
          Health_Wellness?: string | null
          market_place?: string[] | null
          meet_up?: string[] | null
          parties?: string[] | null
          retreats?: string | null
          reunion?: string | null
          special_event?: string[] | null
          sporting?: string[] | null
          wedding?: string | null
        }
        Update: {
          baby_shower?: string
          bridal_shower?: string | null
          Celebration?: string | null
          Dining?: string | null
          Festival?: string | null
          Health_Wellness?: string | null
          market_place?: string[] | null
          meet_up?: string[] | null
          parties?: string[] | null
          retreats?: string | null
          reunion?: string | null
          special_event?: string[] | null
          sporting?: string[] | null
          wedding?: string | null
        }
        Relationships: []
      }
      "Transportation Directory": {
        Row: {
          bus: string[] | null
          car_suv: string | null
          created_at: string
          limo: string | null
          other: string | null
          transo_rental_id: number
          truck: string | null
          van: string | null
        }
        Insert: {
          bus?: string[] | null
          car_suv?: string | null
          created_at?: string
          limo?: string | null
          other?: string | null
          transo_rental_id?: number
          truck?: string | null
          van?: string | null
        }
        Update: {
          bus?: string[] | null
          car_suv?: string | null
          created_at?: string
          limo?: string | null
          other?: string | null
          transo_rental_id?: number
          truck?: string | null
          van?: string | null
        }
        Relationships: []
      }
      "Transportation Profile": {
        Row: {
          arrival_date: string | null
          arrival_time: string | null
          biz_email: string | null
          biz_name: string | null
          confirmation_nbr: number | null
          created_at: string
          dates_available: string | null
          days_of_operation: string[] | null
          departure_date: string | null
          departure_location: string | null
          departure_time: string | null
          destination_location: string | null
          hours_of_operation: string[] | null
          seating_capacity: number | null
          special_accommodations: string[] | null
          trans_amenities: string | null
          trans_contact_name: string | null
          trans_contact_nbr: number | null
          trans_type: string | null
          transpo_cost: number | null
          transpo_id: string
        }
        Insert: {
          arrival_date?: string | null
          arrival_time?: string | null
          biz_email?: string | null
          biz_name?: string | null
          confirmation_nbr?: number | null
          created_at?: string
          dates_available?: string | null
          days_of_operation?: string[] | null
          departure_date?: string | null
          departure_location?: string | null
          departure_time?: string | null
          destination_location?: string | null
          hours_of_operation?: string[] | null
          seating_capacity?: number | null
          special_accommodations?: string[] | null
          trans_amenities?: string | null
          trans_contact_name?: string | null
          trans_contact_nbr?: number | null
          trans_type?: string | null
          transpo_cost?: number | null
          transpo_id: string
        }
        Update: {
          arrival_date?: string | null
          arrival_time?: string | null
          biz_email?: string | null
          biz_name?: string | null
          confirmation_nbr?: number | null
          created_at?: string
          dates_available?: string | null
          days_of_operation?: string[] | null
          departure_date?: string | null
          departure_location?: string | null
          departure_time?: string | null
          destination_location?: string | null
          hours_of_operation?: string[] | null
          seating_capacity?: number | null
          special_accommodations?: string[] | null
          trans_amenities?: string | null
          trans_contact_name?: string | null
          trans_contact_nbr?: number | null
          trans_type?: string | null
          transpo_cost?: number | null
          transpo_id?: string
        }
        Relationships: []
      }
      transportation_profiles: {
        Row: {
          amenities: string[] | null
          amenities_notes: string | null
          amenity_ids: number[] | null
          business_name: string
          capacity: number | null
          checklist: Json | null
          checklist_completed_count: number | null
          city: string | null
          contact_name: string | null
          created_at: string
          description: string | null
          email: string | null
          has_ac: boolean | null
          has_entertainment_system: boolean | null
          has_gps_tracking: boolean | null
          has_luggage_storage: boolean | null
          has_refreshments: boolean | null
          has_wheelchair_access: boolean | null
          has_wifi: boolean | null
          id: string
          is_child_seat_available: boolean | null
          is_pet_friendly: boolean | null
          passenger_capacity: number | null
          phone_number: string | null
          price: number | null
          seating_capacity: number | null
          state: string | null
          transp_type_id: number | null
          transpo_images: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          amenities?: string[] | null
          amenities_notes?: string | null
          amenity_ids?: number[] | null
          business_name: string
          capacity?: number | null
          checklist?: Json | null
          checklist_completed_count?: number | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          has_ac?: boolean | null
          has_entertainment_system?: boolean | null
          has_gps_tracking?: boolean | null
          has_luggage_storage?: boolean | null
          has_refreshments?: boolean | null
          has_wheelchair_access?: boolean | null
          has_wifi?: boolean | null
          id?: string
          is_child_seat_available?: boolean | null
          is_pet_friendly?: boolean | null
          passenger_capacity?: number | null
          phone_number?: string | null
          price?: number | null
          seating_capacity?: number | null
          state?: string | null
          transp_type_id?: number | null
          transpo_images?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          amenities?: string[] | null
          amenities_notes?: string | null
          amenity_ids?: number[] | null
          business_name?: string
          capacity?: number | null
          checklist?: Json | null
          checklist_completed_count?: number | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          has_ac?: boolean | null
          has_entertainment_system?: boolean | null
          has_gps_tracking?: boolean | null
          has_luggage_storage?: boolean | null
          has_refreshments?: boolean | null
          has_wheelchair_access?: boolean | null
          has_wifi?: boolean | null
          id?: string
          is_child_seat_available?: boolean | null
          is_pet_friendly?: boolean | null
          passenger_capacity?: number | null
          phone_number?: string | null
          price?: number | null
          seating_capacity?: number | null
          state?: string | null
          transp_type_id?: number | null
          transpo_images?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transportations_transp_type_id_fkey"
            columns: ["transp_type_id"]
            isOneToOne: false
            referencedRelation: "transportation_types"
            referencedColumns: ["id"]
          },
        ]
      }
      transportation_types: {
        Row: {
          created_at: string
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      transportations: {
        Row: {
          business_name: string
          capacity: number | null
          city: string | null
          contact_name: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          phone_number: string | null
          price: number | null
          seating_capacity: number | null
          special_accommodations: string[] | null
          state: string | null
          transp_type_id: number | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          business_name: string
          capacity?: number | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          phone_number?: string | null
          price?: number | null
          seating_capacity?: number | null
          special_accommodations?: string[] | null
          state?: string | null
          transp_type_id?: number | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          business_name?: string
          capacity?: number | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          phone_number?: string | null
          price?: number | null
          seating_capacity?: number | null
          special_accommodations?: string[] | null
          state?: string | null
          transp_type_id?: number | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transportations_transp_type_id_fkey1"
            columns: ["transp_type_id"]
            isOneToOne: false
            referencedRelation: "transportation_types"
            referencedColumns: ["id"]
          },
        ]
      }
      uploads: {
        Row: {
          created_at: string
          event_id: string | null
          file_path: string
          id: string
          media_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          file_path: string
          id?: string
          media_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          file_path?: string
          id?: string
          media_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploads_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "due_soon_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploads_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_kpi_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "uploads_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploads_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_category_counts"
            referencedColumns: ["event_id"]
          },
        ]
      }
      "User Profile": {
        Row: {
          Biz_Name: string | null
          created_at: string
          id: number
          Pay_Method: string | null
          Sibscription_Upgrade_Date: string | null
          Subscription_Start_Date: string | null
          Subscription_type: string | null
          Subscription_Upgrade_Type: string | null
          Subscrition_End_Date: string | null
          User_Category: string | null
          User_Contact_Name: string | null
          User_Contact_Ph_Nbr: number | null
          User_Email: string | null
          user_id: string | null
          User_Location: string | null
          User_Subscription_Freq: string | null
          User_Type: string | null
          user_upload_pics: string | null
        }
        Insert: {
          Biz_Name?: string | null
          created_at?: string
          id?: number
          Pay_Method?: string | null
          Sibscription_Upgrade_Date?: string | null
          Subscription_Start_Date?: string | null
          Subscription_type?: string | null
          Subscription_Upgrade_Type?: string | null
          Subscrition_End_Date?: string | null
          User_Category?: string | null
          User_Contact_Name?: string | null
          User_Contact_Ph_Nbr?: number | null
          User_Email?: string | null
          user_id?: string | null
          User_Location?: string | null
          User_Subscription_Freq?: string | null
          User_Type?: string | null
          user_upload_pics?: string | null
        }
        Update: {
          Biz_Name?: string | null
          created_at?: string
          id?: number
          Pay_Method?: string | null
          Sibscription_Upgrade_Date?: string | null
          Subscription_Start_Date?: string | null
          Subscription_type?: string | null
          Subscription_Upgrade_Type?: string | null
          Subscrition_End_Date?: string | null
          User_Category?: string | null
          User_Contact_Name?: string | null
          User_Contact_Ph_Nbr?: number | null
          User_Email?: string | null
          user_id?: string | null
          User_Location?: string | null
          User_Subscription_Freq?: string | null
          User_Type?: string | null
          user_upload_pics?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          permission_level:
            | Database["public"]["Enums"]["permission_level"]
            | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          permission_level?:
            | Database["public"]["Enums"]["permission_level"]
            | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          permission_level?:
            | Database["public"]["Enums"]["permission_level"]
            | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "due_soon_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_kpi_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "user_roles_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_category_counts"
            referencedColumns: ["event_id"]
          },
        ]
      }
      "Vendor Directory": {
        Row: {
          Bakery: string | null
          Beverage: string | null
          Brewery: string | null
          Caterer: string | null
          Chef: string | null
          created_at: string
          Florist: string | null
          "Food Truck": string | null
          Foodies: string | null
          Ice_Sculpure: string | null
          id: number
          Mobile_Pop_Up: string | null
          Other: string | null
          Videographer: string | null
          Winery: string | null
        }
        Insert: {
          Bakery?: string | null
          Beverage?: string | null
          Brewery?: string | null
          Caterer?: string | null
          Chef?: string | null
          created_at?: string
          Florist?: string | null
          "Food Truck"?: string | null
          Foodies?: string | null
          Ice_Sculpure?: string | null
          id?: number
          Mobile_Pop_Up?: string | null
          Other?: string | null
          Videographer?: string | null
          Winery?: string | null
        }
        Update: {
          Bakery?: string | null
          Beverage?: string | null
          Brewery?: string | null
          Caterer?: string | null
          Chef?: string | null
          created_at?: string
          Florist?: string | null
          "Food Truck"?: string | null
          Foodies?: string | null
          Ice_Sculpure?: string | null
          id?: number
          Mobile_Pop_Up?: string | null
          Other?: string | null
          Videographer?: string | null
          Winery?: string | null
        }
        Relationships: []
      }
      "Vendor Profile": {
        Row: {
          created_at: string
          ven_avail_dates: string | null
          vendor_biz_name: string | null
          vendor_contact_name: string | null
          vendor_contact_nbr: number | null
          vendor_email: string | null
          vendor_location: string | null
          vendor_price: number | null
          vendor_type: string | null
          vendor_type_id: string
        }
        Insert: {
          created_at?: string
          ven_avail_dates?: string | null
          vendor_biz_name?: string | null
          vendor_contact_name?: string | null
          vendor_contact_nbr?: number | null
          vendor_email?: string | null
          vendor_location?: string | null
          vendor_price?: number | null
          vendor_type?: string | null
          vendor_type_id: string
        }
        Update: {
          created_at?: string
          ven_avail_dates?: string | null
          vendor_biz_name?: string | null
          vendor_contact_name?: string | null
          vendor_contact_nbr?: number | null
          vendor_email?: string | null
          vendor_location?: string | null
          vendor_price?: number | null
          vendor_type?: string | null
          vendor_type_id?: string
        }
        Relationships: []
      }
      vendor_rental_types: {
        Row: {
          created_at: string
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      vendor_supplier_types: {
        Row: {
          created_at: string
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      "Venue Directory": {
        Row: {
          Agri_Location: string | null
          "Agri-Farming": string | null
          Business: string | null
          Business_Location: string | null
          created_at: string
          Hospitality: string | null
          Hospitality_Location: string | null
          id: number
          Local_Govern: string | null
          Local_Govern_Location: string | null
          Market_Location: string | null
          Market_Place: string | null
          Other: string | null
          Other_Location: string | null
          Private_Club: string | null
          Private_Club_Location: string | null
          Private_Residence_Location: string | null
          Private_Resident: string | null
          Recreation: string | null
          Recreation_Location: string | null
          Resort: string | null
          Resort_Location: string | null
          Restaurant: string | null
          Restaurant_Location: string | null
          Sporting_Facility: string | null
          Sporting_Facility_Location: string | null
          State_Govern: string | null
          State_Govern_Location: string | null
          Warehouse: string | null
          Warehouse_Location: string | null
        }
        Insert: {
          Agri_Location?: string | null
          "Agri-Farming"?: string | null
          Business?: string | null
          Business_Location?: string | null
          created_at?: string
          Hospitality?: string | null
          Hospitality_Location?: string | null
          id?: number
          Local_Govern?: string | null
          Local_Govern_Location?: string | null
          Market_Location?: string | null
          Market_Place?: string | null
          Other?: string | null
          Other_Location?: string | null
          Private_Club?: string | null
          Private_Club_Location?: string | null
          Private_Residence_Location?: string | null
          Private_Resident?: string | null
          Recreation?: string | null
          Recreation_Location?: string | null
          Resort?: string | null
          Resort_Location?: string | null
          Restaurant?: string | null
          Restaurant_Location?: string | null
          Sporting_Facility?: string | null
          Sporting_Facility_Location?: string | null
          State_Govern?: string | null
          State_Govern_Location?: string | null
          Warehouse?: string | null
          Warehouse_Location?: string | null
        }
        Update: {
          Agri_Location?: string | null
          "Agri-Farming"?: string | null
          Business?: string | null
          Business_Location?: string | null
          created_at?: string
          Hospitality?: string | null
          Hospitality_Location?: string | null
          id?: number
          Local_Govern?: string | null
          Local_Govern_Location?: string | null
          Market_Location?: string | null
          Market_Place?: string | null
          Other?: string | null
          Other_Location?: string | null
          Private_Club?: string | null
          Private_Club_Location?: string | null
          Private_Residence_Location?: string | null
          Private_Resident?: string | null
          Recreation?: string | null
          Recreation_Location?: string | null
          Resort?: string | null
          Resort_Location?: string | null
          Restaurant?: string | null
          Restaurant_Location?: string | null
          Sporting_Facility?: string | null
          Sporting_Facility_Location?: string | null
          State_Govern?: string | null
          State_Govern_Location?: string | null
          Warehouse?: string | null
          Warehouse_Location?: string | null
        }
        Relationships: []
      }
      "Venue Profile": {
        Row: {
          created_at: string
          ven_biz_name: string | null
          ven_contact_name: string | null
          ven_contact_ph_nbr: number | null
          ven_email: string | null
          ven_locatiom: string | null
          ven_price: number | null
          ven_reservation_date: string | null
          ven_reservation_time: string | null
          venue_amenities: string | null
          venue_type_id: string
        }
        Insert: {
          created_at?: string
          ven_biz_name?: string | null
          ven_contact_name?: string | null
          ven_contact_ph_nbr?: number | null
          ven_email?: string | null
          ven_locatiom?: string | null
          ven_price?: number | null
          ven_reservation_date?: string | null
          ven_reservation_time?: string | null
          venue_amenities?: string | null
          venue_type_id: string
        }
        Update: {
          created_at?: string
          ven_biz_name?: string | null
          ven_contact_name?: string | null
          ven_contact_ph_nbr?: number | null
          ven_email?: string | null
          ven_locatiom?: string | null
          ven_price?: number | null
          ven_reservation_date?: string | null
          ven_reservation_time?: string | null
          venue_amenities?: string | null
          venue_type_id?: string
        }
        Relationships: []
      }
      venue_types: {
        Row: {
          created_at: string
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          amenities: string[]
          amenities_notes: string | null
          amenity_ids: number[] | null
          business_name: string
          capacity: number | null
          checklist: Json | null
          checklist_completed_count: number | null
          city: string | null
          contact_name: string | null
          cost: number | null
          created_at: string
          email: string | null
          has_accessibility: boolean | null
          has_av_equipment: boolean | null
          has_catering: boolean | null
          has_outdoor_space: boolean | null
          has_parking: boolean | null
          has_wifi: boolean | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          phone_number: string | null
          price: number | null
          rating: number | null
          state: string | null
          updated_at: string
          user_id: string | null
          venue_directory_id: number | null
          venue_images: string | null
          venue_type_id: number | null
          zip: string | null
        }
        Insert: {
          amenities?: string[]
          amenities_notes?: string | null
          amenity_ids?: number[] | null
          business_name: string
          capacity?: number | null
          checklist?: Json | null
          checklist_completed_count?: number | null
          city?: string | null
          contact_name?: string | null
          cost?: number | null
          created_at?: string
          email?: string | null
          has_accessibility?: boolean | null
          has_av_equipment?: boolean | null
          has_catering?: boolean | null
          has_outdoor_space?: boolean | null
          has_parking?: boolean | null
          has_wifi?: boolean | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          phone_number?: string | null
          price?: number | null
          rating?: number | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          venue_directory_id?: number | null
          venue_images?: string | null
          venue_type_id?: number | null
          zip?: string | null
        }
        Update: {
          amenities?: string[]
          amenities_notes?: string | null
          amenity_ids?: number[] | null
          business_name?: string
          capacity?: number | null
          checklist?: Json | null
          checklist_completed_count?: number | null
          city?: string | null
          contact_name?: string | null
          cost?: number | null
          created_at?: string
          email?: string | null
          has_accessibility?: boolean | null
          has_av_equipment?: boolean | null
          has_catering?: boolean | null
          has_outdoor_space?: boolean | null
          has_parking?: boolean | null
          has_wifi?: boolean | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          phone_number?: string | null
          price?: number | null
          rating?: number | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          venue_directory_id?: number | null
          venue_images?: string | null
          venue_type_id?: number | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venues_directory_id_fkey"
            columns: ["venue_directory_id"]
            isOneToOne: false
            referencedRelation: "Venue Directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venues_venue_type_id_fkey"
            columns: ["venue_type_id"]
            isOneToOne: false
            referencedRelation: "venue_types"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_types: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      workflows: {
        Row: {
          bookings_id: string | null
          created_at: string
          entertainment_id: string | null
          event_id: string
          external_vendor_id: string | null
          hospitality_id: string | null
          id: string
          serv_vendor_id: string | null
          serv_vendor_rent_id: string | null
          serv_vendor_sup_id: string | null
          supplier_id: string | null
          theme_id: number | null
          transportation_id: string | null
          updated_at: string
          user_id: string
          vendor_id: string | null
          venue_id: string | null
          workflow_type_id: number | null
        }
        Insert: {
          bookings_id?: string | null
          created_at?: string
          entertainment_id?: string | null
          event_id: string
          external_vendor_id?: string | null
          hospitality_id?: string | null
          id?: string
          serv_vendor_id?: string | null
          serv_vendor_rent_id?: string | null
          serv_vendor_sup_id?: string | null
          supplier_id?: string | null
          theme_id?: number | null
          transportation_id?: string | null
          updated_at?: string
          user_id: string
          vendor_id?: string | null
          venue_id?: string | null
          workflow_type_id?: number | null
        }
        Update: {
          bookings_id?: string | null
          created_at?: string
          entertainment_id?: string | null
          event_id?: string
          external_vendor_id?: string | null
          hospitality_id?: string | null
          id?: string
          serv_vendor_id?: string | null
          serv_vendor_rent_id?: string | null
          serv_vendor_sup_id?: string | null
          supplier_id?: string | null
          theme_id?: number | null
          transportation_id?: string | null
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
          venue_id?: string | null
          workflow_type_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workflows_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "due_soon_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_kpi_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "workflows_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "vendor_category_counts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "workflows_hospitality_id_fkey"
            columns: ["hospitality_id"]
            isOneToOne: false
            referencedRelation: "hospitality_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_serv_vendor_rent_id_fkey"
            columns: ["serv_vendor_rent_id"]
            isOneToOne: false
            referencedRelation: "serv_vendor_rentals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_serv_vendor_sup_id_fkey"
            columns: ["serv_vendor_id"]
            isOneToOne: false
            referencedRelation: "serv_vendor_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_serv_vendor_sup_id_fkey1"
            columns: ["serv_vendor_sup_id"]
            isOneToOne: false
            referencedRelation: "serv_vendor_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "event_themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_venue_profile_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_workflow_type_id_fkey"
            columns: ["workflow_type_id"]
            isOneToOne: false
            referencedRelation: "workflow_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      activity_feed: {
        Row: {
          action: string | null
          changed_by: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          event_id: string | null
          id: string | null
          metadata: Json | null
        }
        Insert: {
          action?: string | null
          changed_by?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_id?: string | null
          id?: string | null
          metadata?: Json | null
        }
        Update: {
          action?: string | null
          changed_by?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_id?: string | null
          id?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "cm_activity_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "due_soon_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cm_activity_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_kpi_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "cm_activity_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cm_activity_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_category_counts"
            referencedColumns: ["event_id"]
          },
        ]
      }
      cm_activity_with_event: {
        Row: {
          action: string | null
          changed_by: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          event_id: string | null
          event_title: string | null
          id: string | null
          metadata: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "cm_activity_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "due_soon_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cm_activity_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_kpi_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "cm_activity_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cm_activity_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_category_counts"
            referencedColumns: ["event_id"]
          },
        ]
      }
      create_event_safe: {
        Row: {
          booking_type: string[] | null
          created_at: string | null
          event_budget: number | null
          event_collaborators: string[] | null
          event_description: string | null
          event_end_date: string | null
          event_end_time: string | null
          event_location: string[] | null
          event_start_date: string | null
          event_start_time: string | null
          event_theme: string[] | null
          is_booking_available: boolean | null
          is_service_rental_available: boolean | null
          is_service_type_availabe: boolean | null
          is_supply_available: boolean | null
          is_transportation_available: boolean | null
          is_venue_available: boolean | null
          notification: string | null
          priority: string[] | null
          resources: string[] | null
          service_rental_type: string | null
          supplier_type: string[] | null
          transportation_type: string | null
          userid: string | null
        }
        Insert: {
          booking_type?: string[] | null
          created_at?: string | null
          event_budget?: number | null
          event_collaborators?: string[] | null
          event_description?: string | null
          event_end_date?: string | null
          event_end_time?: string | null
          event_location?: string[] | null
          event_start_date?: string | null
          event_start_time?: string | null
          event_theme?: string[] | null
          is_booking_available?: boolean | null
          is_service_rental_available?: boolean | null
          is_service_type_availabe?: boolean | null
          is_supply_available?: boolean | null
          is_transportation_available?: boolean | null
          is_venue_available?: boolean | null
          notification?: string | null
          priority?: string[] | null
          resources?: string[] | null
          service_rental_type?: string | null
          supplier_type?: string[] | null
          transportation_type?: string | null
          userid?: string | null
        }
        Update: {
          booking_type?: string[] | null
          created_at?: string | null
          event_budget?: number | null
          event_collaborators?: string[] | null
          event_description?: string | null
          event_end_date?: string | null
          event_end_time?: string | null
          event_location?: string[] | null
          event_start_date?: string | null
          event_start_time?: string | null
          event_theme?: string[] | null
          is_booking_available?: boolean | null
          is_service_rental_available?: boolean | null
          is_service_type_availabe?: boolean | null
          is_supply_available?: boolean | null
          is_transportation_available?: boolean | null
          is_venue_available?: boolean | null
          notification?: string | null
          priority?: string[] | null
          resources?: string[] | null
          service_rental_type?: string | null
          supplier_type?: string[] | null
          transportation_type?: string | null
          userid?: string | null
        }
        Relationships: []
      }
      due_soon_events: {
        Row: {
          archived: boolean | null
          budget: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          end_time: string | null
          entertainment_id: string | null
          expected_attendees: number | null
          id: string | null
          location: string | null
          serv_vendor_rental_id: string | null
          start_date: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["event_status_enum"] | null
          theme_id: number | null
          title: string | null
          type_id: number | null
          updated_at: string | null
          user_id: string | null
          venue: string | null
        }
        Insert: {
          archived?: boolean | null
          budget?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          entertainment_id?: string | null
          expected_attendees?: number | null
          id?: string | null
          location?: string | null
          serv_vendor_rental_id?: string | null
          start_date?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["event_status_enum"] | null
          theme_id?: number | null
          title?: string | null
          type_id?: number | null
          updated_at?: string | null
          user_id?: string | null
          venue?: string | null
        }
        Update: {
          archived?: boolean | null
          budget?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          entertainment_id?: string | null
          expected_attendees?: number | null
          id?: string | null
          location?: string | null
          serv_vendor_rental_id?: string | null
          start_date?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["event_status_enum"] | null
          theme_id?: number | null
          title?: string | null
          type_id?: number | null
          updated_at?: string | null
          user_id?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_entertainment_id_fkey"
            columns: ["entertainment_id"]
            isOneToOne: false
            referencedRelation: "entertainments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_serv_vendor_rental_id_fkey"
            columns: ["serv_vendor_rental_id"]
            isOneToOne: false
            referencedRelation: "serv_vendor_rentals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
        ]
      }
      event_kpi_view: {
        Row: {
          allocated_resources: number | null
          avg_task_duration: number | null
          budget_utilization_rate: number | null
          completed_tasks: number | null
          created_at: string | null
          end_date: string | null
          event_id: string | null
          in_progress_tasks: number | null
          location: string | null
          pending_tasks: number | null
          resource_utilization_rate: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["event_status_enum"] | null
          task_completion_rate: number | null
          theme_id: number | null
          title: string | null
          total_budget: number | null
          total_resources: number | null
          total_resources_count: number | null
          total_spent: number | null
          total_task_hours: number | null
          total_tasks: number | null
          type_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
        ]
      }
      event_resources: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string | null
          notes: string | null
          resource_id: string | null
          selection_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string | null
          notes?: string | null
          resource_id?: string | null
          selection_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string | null
          notes?: string | null
          resource_id?: string | null
          selection_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_resource_selections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "due_soon_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_resource_selections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_kpi_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_resource_selections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_resource_selections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vendor_category_counts"
            referencedColumns: ["event_id"]
          },
        ]
      }
      event_task_timeline_view: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          end_date: string | null
          end_time: string | null
          estimated_hours: number | null
          event_end_date: string | null
          event_id: string | null
          event_location: string | null
          event_start_date: string | null
          event_title: string | null
          is_misaligned: boolean | null
          is_overdue: boolean | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          start_date: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          task_id: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      team_admins: {
        Row: {
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_audit_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: string | null
          id: string | null
          payload: Json | null
          source: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id?: string | null
          id?: string | null
          payload?: Json | null
          source?: never
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: string | null
          id?: string | null
          payload?: Json | null
          source?: never
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      unified_locations: {
        Row: {
          address: string | null
          event_id: string | null
          id: string | null
          name: string | null
          source: string | null
        }
        Insert: {
          address?: string | null
          event_id?: string | null
          id?: string | null
          name?: string | null
          source?: never
        }
        Update: {
          address?: string | null
          event_id?: string | null
          id?: string | null
          name?: string | null
          source?: never
        }
        Relationships: []
      }
      unified_resources: {
        Row: {
          availability: Json | null
          event_id: string | null
          id: string | null
          location_id: string | null
          name: string | null
          role: string | null
          source: string | null
        }
        Relationships: []
      }
      unified_tasks: {
        Row: {
          depends_on: string | null
          end_date: string | null
          event_id: string | null
          id: string | null
          locked: boolean | null
          name: string | null
          source: string | null
          start_date: string | null
          status: string | null
        }
        Relationships: []
      }
      user_profiles_teammate_view: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          full_name: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          full_name?: never
          role?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          full_name?: never
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vendor_category_counts: {
        Row: {
          event_id: string | null
          owner_id: string | null
          selection_count: number | null
          selection_type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_change_request: {
        Args: { p_applied_by?: string; p_change_request_id: string }
        Returns: Json
      }
      apply_change_request_wr: {
        Args: { change_request_id: string }
        Returns: undefined
      }
      approve_change_request: {
        Args: { p_approved_by?: string; p_change_request_id: string }
        Returns: Json
      }
      approve_change_request_wr: {
        Args: { change_request_id: string }
        Returns: undefined
      }
      are_team_members: {
        Args: { _user_id_1: string; _user_id_2: string }
        Returns: boolean
      }
      assert_user_in_event: { Args: { p_event_id: string }; Returns: undefined }
      cancel_change_request: {
        Args: { p_cancelled_by?: string; p_change_request_id: string }
        Returns: Json
      }
      cancel_change_request_wr: {
        Args: { change_request_id: string }
        Returns: undefined
      }
      check_timeline_conflicts: {
        Args: { p_event_id: string }
        Returns: {
          conflict_details: string
          conflict_type: string
          task_id: string
          task_title: string
        }[]
      }
      cm_are_team_members: {
        Args: { u1: string; u2: string }
        Returns: boolean
      }
      generate_magic_link: { Args: { user_email: string }; Returns: string }
      get_my_events_safe: {
        Args: never
        Returns: {
          booking_type: string[]
          created_at: string
          event_budget: number
          event_collaborators: string[]
          event_description: string
          event_end_date: string
          event_end_time: string
          event_location: string[]
          event_start_date: string
          event_start_time: string
          event_theme: string[]
          is_booking_available: boolean
          is_service_rental_available: boolean
          is_service_type_availabe: boolean
          is_supply_available: boolean
          is_transportation_available: boolean
          is_venue_available: boolean
          notification: string
          priority: string[]
          resources: string[]
          service_rental_type: string
          supplier_type: string[]
          transportation_type: string
        }[]
      }
      get_user_directory_safe: {
        Args: never
        Returns: {
          contact_name: string
          user_name: string
          userid: string
        }[]
      }
      has_min_permission_level: {
        Args: {
          _event_id?: string
          _level: Database["public"]["Enums"]["permission_level"]
          _user_id: string
        }
        Returns: boolean
      }
      has_permission_level: {
        Args: {
          _event_id?: string
          _level: Database["public"]["Enums"]["permission_level"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_current_user_team_admin: { Args: { team: string }; Returns: boolean }
      is_team_admin: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_venue_booking_completed: {
        Args: { p_event_id: string }
        Returns: boolean
      }
      log_change: {
        Args: {
          p_action: string
          p_description?: string
          p_entity_id: string
          p_entity_type: string
          p_field_name?: string
          p_new_value?: string
          p_old_value?: string
        }
        Returns: string
      }
      notify_coordinators: {
        Args: {
          p_entity_id?: string
          p_entity_type?: string
          p_message: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      recalculate_downstream_tasks:
        | {
            Args: { p_new_due_date?: string; p_task_id: string }
            Returns: {
              new_due_date: string
              old_due_date: string
              task_id: string
            }[]
          }
        | {
            Args: {
              p_new_due_date: string
              p_original_due_date: string
              p_task_id: string
            }
            Returns: {
              new_due_date: string
              old_due_date: string
              task_id: string
            }[]
          }
      recalculate_project_timeline: {
        Args: { p_event_id: string }
        Returns: {
          estimated_completion: string
          new_due_date: string
          task_id: string
        }[]
      }
      reject_change_request: {
        Args: {
          p_change_request_id: string
          p_rejected_by?: string
          p_rejection_reason: string
        }
        Returns: Json
      }
      tca_insert_allowed: {
        Args: { p_team_admin: boolean; p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      tca_team_is_empty: { Args: { p_team_id: string }; Returns: boolean }
      team_assignments_is_empty: {
        Args: { p_team_id: string }
        Returns: boolean
      }
      update_resource_utilization: {
        Args: { p_allocated: number; p_resource_id: string; p_total: number }
        Returns: Json
      }
      validate_magic_link: {
        Args: { input_token: string }
        Returns: {
          is_valid: boolean
          reason: string
          user_email: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "host"
        | "organizer"
        | "event_planner"
        | "venue_owner"
        | "hospitality_provider"
        | "manager"
        | "partner"
        | "sponsor"
        | "stakeholder"
        | "venue_manager"
        | "admin"
        | "event_manager"
        | "vendor_coordinator"
        | "budget_manager"
        | "task_coordinator"
        | "client"
      budget_category:
        | "venue"
        | "catering"
        | "entertainment"
        | "decorations"
        | "transportation"
        | "marketing"
        | "supplies"
        | "services"
        | "other"
        | "hospitality"
        | "misc"
        | "vendors"
      change_status:
        | "pending"
        | "approved"
        | "rejected"
        | "applied"
        | "cancelled"
      change_type:
        | "task_update"
        | "event_update"
        | "resource_update"
        | "vendor_update"
        | "workflow_update"
        | "note"
        | "budget"
      event_status_enum:
        | "pending"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "confirmed"
      permission_level: "admin" | "coordinator" | "viewer"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status:
        | "not_started"
        | "in_progress"
        | "completed"
        | "on_hold"
        | "cancelled"
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
      app_role: [
        "host",
        "organizer",
        "event_planner",
        "venue_owner",
        "hospitality_provider",
        "manager",
        "partner",
        "sponsor",
        "stakeholder",
        "venue_manager",
        "admin",
        "event_manager",
        "vendor_coordinator",
        "budget_manager",
        "task_coordinator",
        "client",
      ],
      budget_category: [
        "venue",
        "catering",
        "entertainment",
        "decorations",
        "transportation",
        "marketing",
        "supplies",
        "services",
        "other",
        "hospitality",
        "misc",
        "vendors",
      ],
      change_status: [
        "pending",
        "approved",
        "rejected",
        "applied",
        "cancelled",
      ],
      change_type: [
        "task_update",
        "event_update",
        "resource_update",
        "vendor_update",
        "workflow_update",
        "note",
        "budget",
      ],
      event_status_enum: [
        "pending",
        "in_progress",
        "completed",
        "cancelled",
        "confirmed",
      ],
      permission_level: ["admin", "coordinator", "viewer"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: [
        "not_started",
        "in_progress",
        "completed",
        "on_hold",
        "cancelled",
      ],
    },
  },
} as const
