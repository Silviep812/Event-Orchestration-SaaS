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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
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
          registry: string[] | null
          reservation: boolean | null
          rsvp: boolean | null
        }
        Insert: {
          book_id: string
          confirmation?: boolean | null
          created_at?: string
          registry?: string[] | null
          reservation?: boolean | null
          rsvp?: boolean | null
        }
        Update: {
          book_id?: string
          confirmation?: boolean | null
          created_at?: string
          registry?: string[] | null
          reservation?: boolean | null
          rsvp?: boolean | null
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
          payment_due_date: string | null
          payment_status: string | null
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
          payment_due_date?: string | null
          payment_status?: string | null
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
          payment_due_date?: string | null
          payment_status?: string | null
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
      Collaborators: {
        Row: {
          collab_type: string
          created_at: string
          hospitality_assign_to: string | null
          services_assign_to: string | null
          suppliers_assign_to: string | null
          vendors_assign_to: string | null
          venue_assign_to: string | null
        }
        Insert: {
          collab_type: string
          created_at?: string
          hospitality_assign_to?: string | null
          services_assign_to?: string | null
          suppliers_assign_to?: string | null
          vendors_assign_to?: string | null
          venue_assign_to?: string | null
        }
        Update: {
          collab_type?: string
          created_at?: string
          hospitality_assign_to?: string | null
          services_assign_to?: string | null
          suppliers_assign_to?: string | null
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
          id?: number
          Price?: number | null
          type_id?: string | null
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
          theme_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          theme_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          theme_id?: number | null
        }
        Relationships: []
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
          start_date: string
          start_time: string | null
          status: Database["public"]["Enums"]["event_status_enum"] | null
          tags: string[] | null
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
          start_date: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["event_status_enum"] | null
          tags?: string[] | null
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
          start_date?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["event_status_enum"] | null
          tags?: string[] | null
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
          hosp_location: string[] | null
          hosp_price: number | null
          hosp_type_id: Database["public"]["Enums"]["budget_category"]
          hosp_website: string | null
        }
        Insert: {
          created_at?: string
          hosp_amendities?: string[] | null
          hosp_biz_name?: string | null
          hosp_contact_name?: string | null
          hosp_contact_nbr?: number | null
          hosp_location?: string[] | null
          hosp_price?: number | null
          hosp_type_id: Database["public"]["Enums"]["budget_category"]
          hosp_website?: string | null
        }
        Update: {
          created_at?: string
          hosp_amendities?: string[] | null
          hosp_biz_name?: string | null
          hosp_contact_name?: string | null
          hosp_contact_nbr?: number | null
          hosp_location?: string[] | null
          hosp_price?: number | null
          hosp_type_id?: Database["public"]["Enums"]["budget_category"]
          hosp_website?: string | null
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
      Registration: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
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
          service_vendor_id: string
          videographer: string | null
        }
        Insert: {
          bakery?: string | null
          caterer?: string | null
          chef?: string | null
          created_at?: string
          service_vendor_id: string
          videographer?: string | null
        }
        Update: {
          bakery?: string | null
          caterer?: string | null
          chef?: string | null
          created_at?: string
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
          Standard_Plan: number | null
          Trial: string | null
        }
        Insert: {
          created_at?: string
          Enterprise?: number | null
          id?: number
          Premium?: number | null
          "Premium Plus"?: number | null
          Standard_Plan?: number | null
          Trial?: string | null
        }
        Update: {
          created_at?: string
          Enterprise?: number | null
          id?: number
          Premium?: number | null
          "Premium Plus"?: number | null
          Standard_Plan?: number | null
          Trial?: string | null
        }
        Relationships: []
      }
      "Supplier Directory": {
        Row: {
          created_at: string
          Distributor: string | null
          id: number
          Merchandizer: string | null
          Online_Market: string | null
          Other: string | null
          Wholesaler: string | null
        }
        Insert: {
          created_at?: string
          Distributor?: string | null
          id?: number
          Merchandizer?: string | null
          Online_Market?: string | null
          Other?: string | null
          Wholesaler?: string | null
        }
        Update: {
          created_at?: string
          Distributor?: string | null
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
      tasks: {
        Row: {
          actual_hours: number | null
          assigned_hosp_role: Database["public"]["Enums"]["app_role"] | null
          assigned_service_vendor_role: string | null
          assigned_supplier_vendor_role: string | null
          assigned_to: string | null
          assigned_venue_role: string | null
          assined_vendor_role: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          event_id: string
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_hosp_role?: Database["public"]["Enums"]["app_role"] | null
          assigned_service_vendor_role?: string | null
          assigned_supplier_vendor_role?: string | null
          assigned_to?: string | null
          assigned_venue_role?: string | null
          assined_vendor_role?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          event_id: string
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_hosp_role?: Database["public"]["Enums"]["app_role"] | null
          assigned_service_vendor_role?: string | null
          assigned_supplier_vendor_role?: string | null
          assigned_to?: string | null
          assigned_venue_role?: string | null
          assined_vendor_role?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          event_id?: string
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks_new: {
        Row: {
          actual_hours: number | null
          assigned_hosp_role: Database["public"]["Enums"]["app_role"] | null
          assigned_service_vendor_role: string | null
          assigned_supplier_vendor_role: string | null
          assigned_to: string | null
          assigned_venue_role: string | null
          assined_vendor_role: string | null
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
          start_date: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_hosp_role?: Database["public"]["Enums"]["app_role"] | null
          assigned_service_vendor_role?: string | null
          assigned_supplier_vendor_role?: string | null
          assigned_to?: string | null
          assigned_venue_role?: string | null
          assined_vendor_role?: string | null
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
          start_date?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_hosp_role?: Database["public"]["Enums"]["app_role"] | null
          assigned_service_vendor_role?: string | null
          assigned_supplier_vendor_role?: string | null
          assigned_to?: string | null
          assigned_venue_role?: string | null
          assined_vendor_role?: string | null
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
          start_date?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string
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
          trans_contact_name?: string | null
          trans_contact_nbr?: number | null
          trans_type?: string | null
          transpo_cost?: number | null
          transpo_id?: string
        }
        Relationships: []
      }
      User: {
        Row: {
          contact_name: string | null
          contact_phone_nbr: number | null
          created_at: string
          email: string | null
          is_admin: boolean | null
          user_name: string | null
          user_role: string | null
          userid: string | null
          website: string | null
        }
        Insert: {
          contact_name?: string | null
          contact_phone_nbr?: number | null
          created_at?: string
          email?: string | null
          is_admin?: boolean | null
          user_name?: string | null
          user_role?: string | null
          userid?: string | null
          website?: string | null
        }
        Update: {
          contact_name?: string | null
          contact_phone_nbr?: number | null
          created_at?: string
          email?: string | null
          is_admin?: boolean | null
          user_name?: string | null
          user_role?: string | null
          userid?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "User_user_name_fkey"
            columns: ["user_name"]
            isOneToOne: true
            referencedRelation: "Authorization"
            referencedColumns: ["sign_in"]
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
          "User_Ty[e": string | null
          User_Type: string | null
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
          "User_Ty[e"?: string | null
          User_Type?: string | null
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
          "User_Ty[e"?: string | null
          User_Type?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role_new"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role_new"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role_new"]
          user_id?: string
        }
        Relationships: []
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
          venue_type_id?: string
        }
        Relationships: []
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
    }
    Functions: {
      execute_raw_sql: {
        Args: { query: string }
        Returns: Json
      }
      get_my_events_safe: {
        Args: Record<PropertyKey, never>
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
        Args: Record<PropertyKey, never>
        Returns: {
          contact_name: string
          user_name: string
          userid: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
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
      recalculate_project_timeline: {
        Args: { p_event_id: string }
        Returns: {
          estimated_completion: string
          new_due_date: string
          task_id: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "event_manager"
        | "vendor_coordinator"
        | "budget_manager"
        | "task_coordinator"
        | "client"
        | "host"
        | "organizer"
        | "event_planner"
        | "venue_owner"
        | "hospitality_provider"
      app_role_new:
        | "host"
        | "organizer"
        | "event_planner"
        | "venue_owner"
        | "hospitality_provider"
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
      event_status_enum: "pending" | "in_progress" | "completed" | "cancelled"
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
        "admin",
        "event_manager",
        "vendor_coordinator",
        "budget_manager",
        "task_coordinator",
        "client",
        "host",
        "organizer",
        "event_planner",
        "venue_owner",
        "hospitality_provider",
      ],
      app_role_new: [
        "host",
        "organizer",
        "event_planner",
        "venue_owner",
        "hospitality_provider",
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
      ],
      event_status_enum: ["pending", "in_progress", "completed", "cancelled"],
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
