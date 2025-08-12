export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
      Bookings: {
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
          venue_type?: string[] | null
        }
        Relationships: []
      }
      "Distributor Directory": {
        Row: {
          beverages: string | null
          brewery: string | null
          created_at: string
          dist_type: string
          florist: string | null
          water: string | null
          winery: string | null
        }
        Insert: {
          beverages?: string | null
          brewery?: string | null
          created_at?: string
          dist_type: string
          florist?: string | null
          water?: string | null
          winery?: string | null
        }
        Update: {
          beverages?: string | null
          brewery?: string | null
          created_at?: string
          dist_type?: string
          florist?: string | null
          water?: string | null
          winery?: string | null
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
      "Event Detail Report": {
        Row: {
          created_at: string
          event_attendee_count: number | null
          event_booking_type: string | null
          event_collaborators: string | null
          event_comments: string | null
          event_description: string | null
          event_end_date: string | null
          event_end_time: string | null
          event_location: string | null
          event_priority: string | null
          event_start_date: string | null
          event_start_time: string | null
          event_status: string | null
          event_theme: string | null
          event_total_cost: number | null
          userid: string
        }
        Insert: {
          created_at?: string
          event_attendee_count?: number | null
          event_booking_type?: string | null
          event_collaborators?: string | null
          event_comments?: string | null
          event_description?: string | null
          event_end_date?: string | null
          event_end_time?: string | null
          event_location?: string | null
          event_priority?: string | null
          event_start_date?: string | null
          event_start_time?: string | null
          event_status?: string | null
          event_theme?: string | null
          event_total_cost?: number | null
          userid?: string
        }
        Update: {
          created_at?: string
          event_attendee_count?: number | null
          event_booking_type?: string | null
          event_collaborators?: string | null
          event_comments?: string | null
          event_description?: string | null
          event_end_date?: string | null
          event_end_time?: string | null
          event_location?: string | null
          event_priority?: string | null
          event_start_date?: string | null
          event_start_time?: string | null
          event_status?: string | null
          event_theme?: string | null
          event_total_cost?: number | null
          userid?: string
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
      "Hospitality Directory": {
        Row: {
          created_at: string
          hosp_amendities: string[] | null
          hosp_biz_name: string | null
          hosp_contact_name: string | null
          hosp_contact_nbr: number | null
          hosp_cost: number | null
          hosp_location: string[] | null
          hosp_type_id: string
          hosp_website: string | null
        }
        Insert: {
          created_at?: string
          hosp_amendities?: string[] | null
          hosp_biz_name?: string | null
          hosp_contact_name?: string | null
          hosp_contact_nbr?: number | null
          hosp_cost?: number | null
          hosp_location?: string[] | null
          hosp_type_id: string
          hosp_website?: string | null
        }
        Update: {
          created_at?: string
          hosp_amendities?: string[] | null
          hosp_biz_name?: string | null
          hosp_contact_name?: string | null
          hosp_contact_nbr?: number | null
          hosp_cost?: number | null
          hosp_location?: string[] | null
          hosp_type_id?: string
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
          event_status: string | null
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
          event_status?: string | null
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
          event_status?: string | null
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
      "Market Place Online Directory": {
        Row: {
          cost_of_item: number | null
          created_at: string
          location: string | null
          market_type_id: string
          nbr_of_items: number | null
        }
        Insert: {
          cost_of_item?: number | null
          created_at?: string
          location?: string | null
          market_type_id: string
          nbr_of_items?: number | null
        }
        Update: {
          cost_of_item?: number | null
          created_at?: string
          location?: string | null
          market_type_id?: string
          nbr_of_items?: number | null
        }
        Relationships: []
      }
      Notification: {
        Row: {
          created_at: string
          message_type_id: number
          receiver: string | null
          sender: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          message_type_id: number
          receiver?: string | null
          sender?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          message_type_id?: number
          receiver?: string | null
          sender?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      "Service Rental Directory": {
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
      "Supplier Directory": {
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
      "Themes Directory": {
        Row: {
          baby_shower: string
          bridal_shower: string | null
          Celebration: string | null
          created_at: string
          Dining: string | null
          Festival: string | null
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
          created_at?: string
          Dining?: string | null
          Festival?: string | null
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
          created_at?: string
          Dining?: string | null
          Festival?: string | null
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
      Transportation: {
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
      User: {
        Row: {
          contact_name: string | null
          contact_phone_nbr: number | null
          created_at: string
          email: string | null
          is_admin: boolean | null
          user_name: string | null
          user_profile: string | null
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
          user_profile?: string | null
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
          user_profile?: string | null
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
      "Vendor Directory": {
        Row: {
          created_at: string
          vendor_biz_name: string | null
          vendor_contact_name: string | null
          vendor_contact_nbr: number | null
          vendor_email: string | null
          vendor_location: string | null
          vendor_type: string | null
          vendor_type_id: string
        }
        Insert: {
          created_at?: string
          vendor_biz_name?: string | null
          vendor_contact_name?: string | null
          vendor_contact_nbr?: number | null
          vendor_email?: string | null
          vendor_location?: string | null
          vendor_type?: string | null
          vendor_type_id: string
        }
        Update: {
          created_at?: string
          vendor_biz_name?: string | null
          vendor_contact_name?: string | null
          vendor_contact_nbr?: number | null
          vendor_email?: string | null
          vendor_location?: string | null
          vendor_type?: string | null
          vendor_type_id?: string
        }
        Relationships: []
      }
      "Venue Directory": {
        Row: {
          created_at: string
          ven_address: string | null
          ven_contact_name: string | null
          ven_contact_ph_nbr: number | null
          ven_email: string | null
          venue_type_id: string
        }
        Insert: {
          created_at?: string
          ven_address?: string | null
          ven_contact_name?: string | null
          ven_contact_ph_nbr?: number | null
          ven_email?: string | null
          venue_type_id: string
        }
        Update: {
          created_at?: string
          ven_address?: string | null
          ven_contact_name?: string | null
          ven_contact_ph_nbr?: number | null
          ven_email?: string | null
          venue_type_id?: string
        }
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
