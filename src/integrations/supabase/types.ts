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
      Authorization: {
        Row: {
          create_password: string | null
          create_userid: string | null
          created_at: string
          pass_word: string | null
          reset_pw: string | null
          sign_in: string
          sign_out: string | null
        }
        Insert: {
          create_password?: string | null
          create_userid?: string | null
          created_at?: string
          pass_word?: string | null
          reset_pw?: string | null
          sign_in: string
          sign_out?: string | null
        }
        Update: {
          create_password?: string | null
          create_userid?: string | null
          created_at?: string
          pass_word?: string | null
          reset_pw?: string | null
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
          id: string
          priority_tag: string | null
          requested_by: string | null
          task_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          priority_tag?: string | null
          requested_by?: string | null
          task_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          priority_tag?: string | null
          requested_by?: string | null
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
          hospitality_assign_to: string | null
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
          hospitality_assign_to?: string | null
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
          hospitality_assign_to?: string | null
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
          userid?: string
          Venue_Location?: string[] | null
          venue_type?: string[] | null
        }
        Relationships: []
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
      entertainment_profiles: {
        Row: {
          business_name: string
          city: string | null
          contact_name: string | null
          created_at: string
          description: string | null
          email: string | null
          ent_type_id: number | null
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
          city?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          ent_type_id?: number | null
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
          city?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          ent_type_id?: number | null
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
            foreignKeyName: "entertainment_profiles_ent_type_id_fkey"
            columns: ["ent_type_id"]
            isOneToOne: false
            referencedRelation: "entertainment_types"
            referencedColumns: ["id"]
          },
        ]
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
          event_hosp_biz_name: string | null
          event_hosp_check_in_date: string | null
          event_hosp_check_out_date: string | null
          event_hosp_contact_name: string | null
          event_hosp_contact_nbr: number | null
          event_hosp_cost: number | null
          event_hosp_location: string | null
          event_hosp_type: string | null
          event_location: string | null
          event_priority: string | null
          event_start_date: string | null
          event_start_time: string | null
          event_status: string | null
          event_theme: string | null
          event_total_cost: number | null
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
          event_hosp_biz_name?: string | null
          event_hosp_check_in_date?: string | null
          event_hosp_check_out_date?: string | null
          event_hosp_contact_name?: string | null
          event_hosp_contact_nbr?: number | null
          event_hosp_cost?: number | null
          event_hosp_location?: string | null
          event_hosp_type?: string | null
          event_location?: string | null
          event_priority?: string | null
          event_start_date?: string | null
          event_start_time?: string | null
          event_status?: string | null
          event_theme?: string | null
          event_total_cost?: number | null
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
          event_hosp_biz_name?: string | null
          event_hosp_check_in_date?: string | null
          event_hosp_check_out_date?: string | null
          event_hosp_contact_name?: string | null
          event_hosp_contact_nbr?: number | null
          event_hosp_cost?: number | null
          event_hosp_location?: string | null
          event_hosp_type?: string | null
          event_location?: string | null
          event_priority?: string | null
          event_start_date?: string | null
          event_start_time?: string | null
          event_status?: string | null
          event_theme?: string | null
          event_total_cost?: number | null
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
          created_at: string
          event_id: number
          hospitality_types: string | null
          service_rental_type: string | null
          service_vendor_type: string | null
          supply_type: string | null
          vendor_types: string | null
          venue_types: string | null
        }
        Insert: {
          created_at?: string
          event_id?: number
          hospitality_types?: string | null
          service_rental_type?: string | null
          service_vendor_type?: string | null
          supply_type?: string | null
          vendor_types?: string | null
          venue_types?: string | null
        }
        Update: {
          created_at?: string
          event_id?: number
          hospitality_types?: string | null
          service_rental_type?: string | null
          service_vendor_type?: string | null
          supply_type?: string | null
          vendor_types?: string | null
          venue_types?: string | null
        }
        Relationships: []
      }
      event_themes: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          premium: boolean
          tags: string[] | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          premium?: boolean
          tags?: string[] | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          premium?: boolean
          tags?: string[] | null
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
          budget: number | null
          created_at: string
          description: string | null
          end_date: string | null
          end_time: string | null
          expected_attendees: number | null
          id: string
          location: string | null
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
          budget?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          expected_attendees?: number | null
          id?: string
          location?: string | null
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
          budget?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          expected_attendees?: number | null
          id?: string
          location?: string | null
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
          created_at: string
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
          service_type: string[] | null
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
          created_at?: string
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
          service_type?: string[] | null
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
          created_at?: string
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
          service_type?: string[] | null
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
          progress_update?: string | null
          resource_update?: string | null
          task_align_update?: Json[] | null
          task_change_update?: string[] | null
          task_completion_time_update?: string | null
          task_modified_date?: string | null
          task_update?: string[] | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          message: string
          recipient_id: string
          sender_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message: string
          recipient_id: string
          sender_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string
          recipient_id?: string
          sender_id?: string | null
          title?: string
          type?: string
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
            referencedRelation: "venue_profiles"
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
          type_id: number | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          business_name: string
          category_id?: number | null
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
          type_id?: number | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          business_name?: string
          category_id?: number | null
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
      tasks: {
        Row: {
          actual_hours: number | null
          archived: boolean
          assigned_coordinator_name: string | null
          assigned_service_vendor_role: string | null
          assigned_supplier_vendor_role: string | null
          assigned_to: string | null
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
          assigned_coordinator_name?: string | null
          assigned_service_vendor_role?: string | null
          assigned_supplier_vendor_role?: string | null
          assigned_to?: string | null
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
          assigned_coordinator_name?: string | null
          assigned_service_vendor_role?: string | null
          assigned_supplier_vendor_role?: string | null
          assigned_to?: string | null
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
            foreignKeyName: "team_assignments_team_id_fkey"
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
          state: string | null
          transp_type_id: number | null
          transpo_images: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          amenities?: string[] | null
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
          state?: string | null
          transp_type_id?: number | null
          transpo_images?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          amenities?: string[] | null
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
          Business_Location: string | null
          created_at: string
          Hospitality_Location: string | null
          id: number
          Local_Govern_Location: string | null
          Market_Location: string | null
          Market_Place: string | null
          Other: string | null
          Private_Club: string | null
          Private_Club_Location: string | null
          Private_Resident: string | null
          Recreation_Location: string | null
          Resort_Location: string | null
          Restaurant_Location: string | null
          Sporting_Facility: string | null
          Sporting_Facility_Location: string | null
          State_Govern_Location: string | null
          Warehouse: string | null
          Warehouse_Location: string | null
        }
        Insert: {
          Agri_Location?: string | null
          "Agri-Farming"?: string | null
          Business_Location?: string | null
          created_at?: string
          Hospitality_Location?: string | null
          id?: number
          Local_Govern_Location?: string | null
          Market_Location?: string | null
          Market_Place?: string | null
          Other?: string | null
          Private_Club?: string | null
          Private_Club_Location?: string | null
          Private_Resident?: string | null
          Recreation_Location?: string | null
          Resort_Location?: string | null
          Restaurant_Location?: string | null
          Sporting_Facility?: string | null
          Sporting_Facility_Location?: string | null
          State_Govern_Location?: string | null
          Warehouse?: string | null
          Warehouse_Location?: string | null
        }
        Update: {
          Agri_Location?: string | null
          "Agri-Farming"?: string | null
          Business_Location?: string | null
          created_at?: string
          Hospitality_Location?: string | null
          id?: number
          Local_Govern_Location?: string | null
          Market_Location?: string | null
          Market_Place?: string | null
          Other?: string | null
          Private_Club?: string | null
          Private_Club_Location?: string | null
          Private_Resident?: string | null
          Recreation_Location?: string | null
          Resort_Location?: string | null
          Restaurant_Location?: string | null
          Sporting_Facility?: string | null
          Sporting_Facility_Location?: string | null
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
      venue_profiles: {
        Row: {
          amenities: string[]
          business_name: string
          capacity: number | null
          city: string | null
          contact_name: string | null
          cost: number | null
          created_at: string
          email: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          phone_number: string | null
          rating: number | null
          state: string | null
          updated_at: string
          user_id: string | null
          venue_images: string | null
          venue_type_id: number | null
          zip: string | null
        }
        Insert: {
          amenities?: string[]
          business_name: string
          capacity?: number | null
          city?: string | null
          contact_name?: string | null
          cost?: number | null
          created_at?: string
          email?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          phone_number?: string | null
          rating?: number | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          venue_images?: string | null
          venue_type_id?: number | null
          zip?: string | null
        }
        Update: {
          amenities?: string[]
          business_name?: string
          capacity?: number | null
          city?: string | null
          contact_name?: string | null
          cost?: number | null
          created_at?: string
          email?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          phone_number?: string | null
          rating?: number | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          venue_images?: string | null
          venue_type_id?: number | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_profiles_venue_type_id_fkey"
            columns: ["venue_type_id"]
            isOneToOne: false
            referencedRelation: "venue_types"
            referencedColumns: ["id"]
          },
        ]
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
          created_at: string
          event_id: string
          hospitality_id: string | null
          id: string
          serv_vendor_rent_id: string | null
          serv_vendor_sup_id: string | null
          supplier_id: string | null
          theme_id: number | null
          updated_at: string
          user_id: string
          venue_id: string | null
          workflow_type_id: number | null
        }
        Insert: {
          created_at?: string
          event_id: string
          hospitality_id?: string | null
          id?: string
          serv_vendor_rent_id?: string | null
          serv_vendor_sup_id?: string | null
          supplier_id?: string | null
          theme_id?: number | null
          updated_at?: string
          user_id: string
          venue_id?: string | null
          workflow_type_id?: number | null
        }
        Update: {
          created_at?: string
          event_id?: string
          hospitality_id?: string | null
          id?: string
          serv_vendor_rent_id?: string | null
          serv_vendor_sup_id?: string | null
          supplier_id?: string | null
          theme_id?: number | null
          updated_at?: string
          user_id?: string
          venue_id?: string | null
          workflow_type_id?: number | null
        }
        Relationships: [
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
            referencedRelation: "venue_profiles"
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
      execute_raw_sql: { Args: { query: string }; Returns: Json }
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
      update_resource_utilization: {
        Args: { p_allocated: number; p_resource_id: string; p_total: number }
        Returns: Json
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
      event_status_enum: "pending" | "in_progress" | "completed" | "cancelled"
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
      event_status_enum: ["pending", "in_progress", "completed", "cancelled"],
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
