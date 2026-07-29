# IEP SaaS Application — Current System Schema

## Document Information

| Field | Value |
| --- | --- |
| Project | IEP SaaS Application |
| Source | Active Supabase database |
| Snapshot date | July 29, 2026 |
| Prepared by | Osama |
| Status | Current-state schema printout |
| Validation performed | No |

## Scope

This document is a current-state printout of the existing Supabase database tables and attributes. It does not include schema validation, proposed modifications, recommendations, sample data, or future requirements.

## Application-Owned Schemas

### Schema: Cm_Event_Orchestration

#### Table: change_events

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | change_request_id | uuid | NO | — |
| 3 | action | text | NO | — |
| 4 | field_name | text | YES | — |
| 5 | old_value | text | YES | — |
| 6 | new_value | text | YES | — |
| 7 | created_by | uuid | NO | — |
| 8 | created_at | timestamp with time zone | NO | now() |

#### Table: change_requests

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | requested_by | uuid | NO | — |
| 3 | entity_type | text | NO | — |
| 4 | entity_id | uuid | NO | — |
| 5 | change_type | change_type | NO | — |
| 6 | payload | jsonb | NO | — |
| 7 | status | change_status | NO | 'pending'::change_status |
| 8 | approver_id | uuid | YES | — |
| 9 | approved_at | timestamp with time zone | YES | — |
| 10 | applied_at | timestamp with time zone | YES | — |
| 11 | event_id | uuid | YES | — |
| 12 | created_at | timestamp with time zone | NO | now() |
| 13 | updated_at | timestamp with time zone | NO | now() |

### Schema: public

#### Table: Authorization

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | sign_in | text | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 5 | sign_out | text | YES | — |
| 18 | userid | text | YES | — |

#### Table: Bookings Directory

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | book_id | text | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | confirmation | boolean | YES | — |
| 5 | rsvp | boolean | YES | — |
| 6 | registry | _text | YES | — |
| 7 | reservation | boolean | YES | — |
| 8 | QR_Code | boolean | YES | — |
| 9 | user_id | uuid | YES | — |
| 10 | barcode | boolean | YES | — |

#### Table: Bookings Profile

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | name | text | YES | — |
| 3 | contact_info | text | YES | — |
| 4 | booking_type | text | YES | — |
| 5 | notes | text | YES | — |
| 6 | created_at | timestamp with time zone | YES | now() |
| 7 | updated_at | timestamp with time zone | YES | now() |

#### Table: Check Lists

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | entity_type | text | NO | — |
| 3 | entity_id | uuid | NO | — |
| 4 | label | text | NO | — |
| 5 | checked | boolean | YES | false |
| 6 | category | text | YES | — |
| 7 | sort_order | integer | YES | 0 |
| 8 | notes | text | YES | — |
| 9 | due_date | date | YES | — |
| 10 | assigned_to | uuid | YES | — |
| 11 | completed_at | timestamp with time zone | YES | — |
| 12 | created_at | timestamp with time zone | NO | now() |
| 13 | updated_at | timestamp with time zone | NO | now() |

#### Table: Collaborators

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | collab_type | text | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | service_vendor | text | YES | — |
| 4 | suppliers_assign_to | text | YES | — |
| 5 | vendors_assign_to | text | YES | — |
| 6 | venue_assign_to | text | YES | — |
| 7 | hospitality_assign_to | text | YES | — |
| 8 | entertainment_assign_to | text | YES | — |
| 9 | booking_assign_to | text | YES | — |
| 10 | transportation_assign_to | text | YES | — |
| 11 | service_rental_buy_assign_to_text | text | YES | — |
| 12 | external_vendor_assign_to_text | text | YES | — |
| 13 | marketing_assign_to_text | text | YES | — |

#### Table: Communication Hub

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | comment | text | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | creator | _text | YES | — |
| 4 | subject | text | YES | — |

#### Table: Create Event

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | userid | text | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | event_theme | _text | YES | — |
| 4 | booking_type | _text | YES | — |
| 5 | email | text | YES | — |
| 6 | contact_name | text | YES | — |
| 7 | contact_phone_nbr | numeric | YES | — |
| 9 | event_budget | numeric | YES | — |
| 10 | event_collaborators | _text | YES | — |
| 11 | event_description | text | YES | — |
| 12 | event_start_date | date | YES | — |
| 13 | event_start_time | timestamp with time zone | YES | — |
| 14 | event_end_date | date | YES | — |
| 15 | event_end_time | timestamp with time zone | YES | — |
| 16 | event_location | _text | YES | — |
| 17 | notification | text | YES | — |
| 18 | resources | _text | YES | — |
| 19 | priority | _text | YES | — |
| 20 | venue_type | _text | YES | — |
| 21 | service_rental_type | text | YES | — |
| 22 | is_service_type_availabe | boolean | YES | — |
| 23 | is_venue_available | boolean | YES | — |
| 24 | is_booking_available | boolean | YES | — |
| 25 | is_service_rental_available | boolean | YES | — |
| 26 | supplier_type | _text | YES | — |
| 27 | is_supply_available | boolean | YES | — |
| 28 | transportation_type | text | YES | — |
| 29 | is_transportation_available | boolean | YES | — |
| 30 | Venue_Location | _text | YES | — |
| 31 | Hospitality_Location | numeric | YES | — |
| 32 | resource_cost | numeric | YES | — |
| 33 | is_service_vendor | boolean | YES | false |
| 34 | entertainment_type | _text | YES | — |
| 35 | transportation_type_arr | _text | YES | — |
| 36 | hospitality_type_arr | _text | YES | — |
| 37 | marketing_type_arr | _text | YES | — |

#### Table: Entertainment Directory

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | bigint | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | Standup Comic | text | YES | — |
| 4 | DJ Music | text | YES | — |
| 5 | Performer | text | YES | — |
| 6 | Musicians | text | YES | — |
| 7 | Stage_Production | text | YES | — |
| 8 | Speaker | text | YES | — |
| 9 | Other | text | YES | — |
| 10 | state | text | YES | — |
| 11 | city | text | YES | — |
| 12 | region | text | YES | — |

#### Table: Entertainment Profile

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | bigint | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | Business_Name | text | YES | — |
| 4 | Contact_Name | text | YES | — |
| 5 | Contact_Ph_Nbr | numeric | YES | — |
| 6 | Business_Location | text | YES | — |
| 7 | Email | text | YES | — |
| 8 | Price | numeric | YES | — |
| 9 | Available_Dates | timestamp with time zone | YES | — |
| 10 | type_id | text | YES | — |
| 11 | Genre | text | YES | — |

#### Table: Event Analytics

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | event_id | integer | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | event_count_update | numeric | YES | — |
| 4 | event_freq_by_location | text | YES | — |
| 5 | lead_conversion_rate | numeric | YES | — |
| 6 | resource_util_percent | real | YES | — |
| 7 | task_completion_rate | numeric | YES | — |
| 8 | avg_task_duration | real | YES | — |

#### Table: Event Plan Report

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | userid | uuid | NO | gen_random_uuid() |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | event_attendee_count | numeric | YES | — |
| 4 | event_type | text | YES | — |
| 5 | event_total_cost | numeric | YES | — |
| 6 | event_collaborators_name | text | YES | — |
| 7 | event_comments | text | YES | — |
| 8 | event_description | text | YES | — |
| 9 | event_end_date | date | YES | — |
| 10 | event_end_time | timestamp with time zone | YES | — |
| 11 | event_location | text | YES | — |
| 12 | event_start_date | date | YES | — |
| 13 | event_start_time | timestamp with time zone | YES | — |
| 14 | event_priority | text | YES | — |
| 15 | event_status | text | YES | — |
| 16 | event_theme | text | YES | — |
| 17 | user_name | text | YES | — |
| 18 | event_budget | numeric | YES | — |
| 19 | user_contact_name | text | YES | — |
| 20 | user_contact_nbr | numeric | YES | — |
| 21 | event_hosp_biz_name | text | YES | — |
| 22 | event_hosp_location | text | YES | — |
| 23 | event_hosp_contact_name | text | YES | — |
| 24 | event_hosp_contact_nbr | numeric | YES | — |
| 25 | event_hosp_type | text | YES | — |
| 26 | event_hosp_cost | numeric | YES | — |
| 27 | event_hosp_check_in_date | date | YES | — |
| 28 | event_hosp_check_out_date | date | YES | — |
| 29 | event_venue_collab_name | text | YES | — |
| 30 | event_venue_biz_name | text | YES | — |
| 31 | event_venue_location | text | YES | — |
| 32 | event_venue_contact_name | text | YES | — |
| 33 | event_venue_contact_nbr | numeric | YES | — |
| 34 | venue_email | text | YES | — |
| 35 | hosp_email | text | YES | — |
| 36 | event_venue_type | text | YES | — |
| 37 | event_venue_check_in_date | date | YES | — |
| 38 | event_venue_check_out_date | date | YES | — |
| 39 | event_venue_cost | numeric | YES | — |
| 40 | event_vend_collab_name | text | YES | — |
| 41 | event_vend_email | text | YES | — |
| 42 | event_vend_contact_name | text | YES | — |
| 43 | event_vend_biz_name | text | YES | — |
| 44 | event_vend_contact_nbr | numeric | YES | — |
| 45 | event_vend_location | text | YES | — |
| 46 | event_vend_type | text | YES | — |
| 47 | event_vend_cost | budget_category | YES | — |
| 48 | event_vend_start_date | date | YES | — |
| 49 | event_vend_end_date | date | YES | — |
| 50 | event_transport_collab_name | text | YES | — |
| 51 | event_transport_biz_name | text | YES | — |
| 52 | event_transport_location | text | YES | — |
| 53 | event_transport_contact_name | text | YES | — |
| 54 | event_transport_contact_nbr | numeric | YES | — |
| 55 | event_transport_email | text | YES | — |
| 56 | event_transport_type | text | YES | — |
| 57 | event_transport_cost | numeric | YES | — |
| 58 | event_transport_start_date | date | YES | — |
| 59 | event_transport_end_date | date | YES | — |
| 60 | event_entertain_collab_name | text | YES | — |
| 61 | event_entertain_biz_name | text | YES | — |
| 62 | event_entertain_location | text | YES | — |
| 63 | event_entertain_contact_name | text | YES | — |
| 64 | event_entertain_contact_nbr | numeric | YES | — |
| 65 | event_entertain_email | text | YES | — |
| 66 | event_entertain_type | text | YES | — |
| 67 | event_entertain_cost | numeric | YES | — |
| 68 | event_entertain_start_date | date | YES | — |
| 69 | event_entertain_end_date | date | YES | — |
| 70 | event_market_collab_name | text | YES | — |
| 71 | event_market_biz_name | text | YES | — |
| 72 | event_market_contact_name | text | YES | — |
| 73 | event_market_contact_nbr | numeric | YES | — |
| 74 | event_market_email | text | YES | — |
| 75 | event_market_type | text | YES | — |
| 76 | event_market_cost | numeric | YES | — |
| 77 | event_ext_vendor_collab_name | text | YES | — |
| 78 | event_ext_vendor_biz_name | text | YES | — |
| 79 | event_ext_vendor_contact_name | text | YES | — |
| 80 | event_ext_vendor_contact_nbr | numeric | YES | — |
| 81 | event_ext_vendor_email | text | YES | — |
| 82 | event_ext_vendor_type | text | YES | — |
| 83 | event_ext_vendor_cost | numeric | YES | — |
| 84 | event_service_rental_buy_biz_name | text | YES | — |
| 85 | event_service_rental_buy_collab_name | text | YES | — |
| 86 | event_service_rental_buy_contact_name | text | YES | — |
| 87 | event_service_rental_buy_contact_nbr | numeric | YES | — |
| 88 | event_service_rental_buy_cost | budget_category | YES | — |
| 89 | event_service_rental_buy_email | text | YES | — |
| 90 | event_service_rental_buy_end_date | text | YES | — |
| 91 | event_service_rental_buy_location | text | YES | — |
| 92 | event_service_rental_buy_start_date | text | YES | — |
| 93 | event_service_rental_buy_type | text | YES | — |
| 94 | event_service_vendor_biz_name | text | YES | — |
| 95 | event_service_vendor_collab_name | text | YES | — |
| 96 | event_service_vendor_contact_name | text | YES | — |
| 97 | event_service_vendor_contact_nbr | numeric | YES | — |
| 98 | event_service_vendor_cost | budget_category | YES | — |
| 99 | event_service_vendor_email | text | YES | — |
| 100 | event_service_vendor_end_date | text | YES | — |
| 101 | event_service_vendor_location | text | YES | — |
| 102 | event_service_vendor_start_date | text | YES | — |
| 103 | event_service_vendor_type | text | YES | — |
| 104 | event_supplier_biz_name | text | YES | — |
| 105 | event_supplier_collab_name | text | YES | — |
| 106 | event_supplier_contact_name | text | YES | — |
| 107 | event_supplier_contact_nbr | numeric | YES | — |
| 108 | event_supplier_cost | budget_category | YES | — |
| 109 | event_supplier_email | text | YES | — |
| 110 | event_supplier_end_date | text | YES | — |
| 111 | event_supplier_location | text | YES | — |
| 112 | event_supplier_start_date | text | YES | — |
| 113 | event_supplier_type | text | YES | — |
| 114 | booking_type | text | YES | — |

#### Table: Event Resources

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | event_id | integer | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | hospitality_types | text | YES | — |
| 4 | service_rental_buy_type | text | YES | — |
| 5 | service_vendor_types | text | YES | — |
| 6 | venue_types | text | YES | — |
| 7 | supplier_types | text | YES | — |
| 8 | vendor_types | text | YES | — |
| 9 | booking_types_text | text | YES | — |
| 10 | marketing_types_text | text | YES | — |
| 11 | entertainment_types_text | text | YES | — |
| 12 | transportation_types_text | text | YES | — |
| 13 | external_vendor_types_text | text | YES | — |

#### Table: Hospitality Directory

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | bigint | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | Airbnb | text | YES | — |
| 4 | Hotel | text | YES | — |
| 5 | Motel | text | YES | — |
| 6 | Resort | text | YES | — |
| 7 | Other | text | YES | — |
| 8 | state | text | YES | — |
| 9 | city | text | YES | — |
| 10 | region | text | YES | — |

#### Table: Hospitality Profile

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | hosp_type_id | budget_category | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | hosp_biz_name | text | YES | — |
| 4 | hosp_location | _text | YES | — |
| 5 | hosp_contact_name | text | YES | — |
| 6 | hosp_contact_nbr | numeric | YES | — |
| 7 | hosp_website | text | YES | — |
| 8 | hosp_amendities | _text | YES | — |
| 9 | hosp_price | numeric | YES | — |
| 10 | hospitality_type | integer | YES | — |
| 11 | hosp_email | text | YES | — |

#### Table: Manage Event

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | event_user_id | text | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | event_contact_email | text | YES | — |
| 4 | event_contact_name | text | YES | — |
| 5 | event_contact_ph_nbr | numeric | YES | — |
| 6 | event_budget_cost | _numeric | YES | — |
| 7 | event_date | date | YES | — |
| 9 | event_time | timestamp with time zone | YES | — |
| 10 | event_type | text | YES | — |
| 11 | hosp_biz_name | text | YES | — |
| 13 | hosp_location | text | YES | — |
| 14 | hosp_booking_date | date | YES | — |
| 15 | hosp_booking_time | timestamp with time zone | YES | — |
| 16 | service_vendor_type | _text | YES | — |
| 17 | service_vendor_biz_name | text | YES | — |
| 18 | service_vendor_delivery_location | text | YES | — |
| 19 | service_vendor_delivery_date | date | YES | — |
| 20 | service_vendor_delivery_time | timestamp with time zone | YES | — |
| 21 | venue_contact_name | text | YES | — |
| 22 | venue_contact_ph_nbr | numeric | YES | — |
| 23 | venue_location | text | YES | — |
| 24 | venue_booking_time | timestamp with time zone | YES | — |
| 25 | venue_name | text | YES | — |
| 26 | venue_type | text | YES | — |
| 27 | venue_booking_date | date | YES | — |
| 28 | venue_cost | numeric | YES | — |
| 29 | hosp_cost | numeric | YES | — |
| 30 | hosp_contact_name | text | YES | — |
| 31 | hosp_contact_nbr | numeric | YES | — |
| 32 | hosp_email | text | YES | — |
| 33 | service_vendor_cost | numeric | YES | — |
| 34 | supplier_biz_name | text | YES | — |
| 35 | supplier_types | _text | YES | — |
| 36 | supplier_contact_name | text | YES | — |
| 37 | supplier_contact_nbr | numeric | YES | — |
| 38 | supplier_email | text | YES | — |
| 39 | supplier_cost | numeric | YES | — |
| 40 | supplier_delivery_date | date | YES | — |
| 41 | supplier_delivery_time | timestamp with time zone | YES | — |
| 42 | vendor_biz_name | text | YES | — |
| 43 | vendor_contact_name | text | YES | — |
| 44 | vendor_contact_nbr | numeric | YES | — |
| 45 | vendor_email | text | YES | — |
| 46 | vendor_cost | numeric | YES | — |
| 47 | event_status | event_status_enum | YES | — |
| 48 | set_priority | text | YES | — |
| 49 | task_status | text | YES | — |
| 50 | event_theme | text | YES | — |
| 51 | service_rental_buy_type | _text | YES | — |
| 52 | external_vendor_type | _text | YES | — |
| 53 | service_vendor_types | _text | YES | — |
| 54 | entertainment_type | _text | YES | — |
| 55 | transportation_type | _text | YES | — |
| 56 | bookings_type | _text | YES | — |
| 57 | marketing_type | _text | YES | — |

#### Table: Manage Event Tasks

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | event_theme | text | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | analytics_update | _jsonb | YES | — |
| 4 | task_update | _text | YES | — |
| 5 | resource_update | text | YES | — |
| 6 | progress_update | text | YES | — |
| 7 | task_change_update | _text | YES | — |
| 8 | task_modified_date | date | YES | — |
| 9 | task_align_update | _jsonb | YES | — |
| 10 | task_completion_time_update | timestamp with time zone | YES | — |
| 11 | linked_event_id | uuid | YES | — |

#### Table: Marketing Directory

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | bigint | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | Social Media | text | YES | — |
| 4 | Email Marketing | text | YES | — |
| 5 | Print Media | text | YES | — |
| 6 | Digital Ads | text | YES | — |
| 7 | Influencer | text | YES | — |
| 8 | PR / Press | text | YES | — |
| 9 | Event Promo | text | YES | — |
| 10 | Other | text | YES | — |
| 11 | state | text | YES | — |
| 12 | city | text | YES | — |
| 13 | region | text | YES | — |

#### Table: Marketing Profile

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | name | text | YES | — |
| 3 | contact_info | text | YES | — |
| 4 | marketing_type | _text | YES | — |
| 5 | notes | text | YES | — |
| 6 | created_at | timestamp with time zone | YES | now() |
| 7 | updated_at | timestamp with time zone | YES | now() |

#### Table: Service Rental/Sale Directory

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | rental_type_id | text | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | audio_visual_equip | text | YES | — |
| 4 | child_play_equip | _text | YES | — |
| 5 | venue_space_decor | _text | YES | — |
| 6 | entertainment_options | text | YES | — |
| 7 | flowers_plants | text | YES | — |
| 8 | game_tables | text | YES | — |
| 9 | table_chairs | text | YES | — |
| 10 | housewares | text | YES | — |
| 11 | lighting | text | YES | — |
| 12 | photo_both | text | YES | — |
| 13 | potty_johns | numeric | YES | — |
| 14 | prod_props | text | YES | — |
| 15 | tents | text | YES | — |
| 16 | transport_options | text | YES | — |
| 17 | state | text | YES | — |
| 18 | city | text | YES | — |
| 19 | region | text | YES | — |

#### Table: Service_Vendor Profile

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | bigint | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | Business Name | text | YES | — |
| 4 | Contact_Name | text | YES | — |
| 5 | Contact_Ph_Nbr | numeric | YES | — |
| 6 | Price | numeric | YES | — |
| 7 | Email | text | YES | — |
| 8 | Location | text | YES | — |
| 9 | Service_Type | text | YES | — |
| 10 | service_provided_listing | text | YES | — |

#### Table: Subscription_Plans Directory

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | bigint | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | Trial | text | YES | 'Free'::text |
| 4 | Standard_Plan | numeric | YES | — |
| 5 | Premium | numeric | YES | — |
| 6 | Premium Plus | numeric | YES | — |
| 7 | Enterprise | numeric | YES | — |
| 8 | Special Promo | text | YES | — |

#### Table: Subscription_Plans Profile

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | plan_name | text | YES | — |
| 3 | plan_type | text | YES | — |
| 4 | price | numeric | YES | — |
| 5 | features | _text | YES | — |
| 6 | notes | text | YES | — |
| 7 | created_at | timestamp with time zone | YES | now() |
| 8 | updated_at | timestamp with time zone | YES | now() |

#### Table: Supplier Directory

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | bigint | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | Distributor | text | YES | — |
| 4 | Merchandizer | text | YES | — |
| 5 | Online_Market | text | YES | — |
| 6 | Wholesaler | text | YES | — |
| 7 | Other | text | YES | — |
| 8 | Food_Wholesaler | text | YES | — |
| 9 | other_manual_text | text | YES | — |
| 10 | state | text | YES | — |
| 11 | city | text | YES | — |
| 12 | region | text | YES | — |

#### Table: Supplier Profile

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | supplier_id | text | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | distributor_supplier_biz_name | text | YES | — |
| 4 | supplier_email | text | YES | — |
| 5 | supplier_location | text | YES | — |
| 6 | supplier_contact_name | text | YES | — |
| 7 | supplier_contact_nbr | numeric | YES | — |
| 8 | supplier_type | text | YES | — |
| 9 | wholesaler_supplier_biz_name | text | YES | — |
| 10 | online_marketplace_supplier_biz_name | text | YES | — |
| 11 | merchandizer_supllier_biz_name | text | YES | — |

#### Table: Supplier Vendor Profile

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | type | bigint | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | supp_name | text | YES | — |
| 4 | supp_contact_name | text | YES | — |
| 5 | supp_contact_nbr | numeric | YES | — |
| 6 | supp_contact_role | text | YES | — |
| 7 | supp_email | text | YES | — |
| 10 | supp_location | text | YES | — |
| 11 | supp_biz_name | text | YES | — |
| 12 | supp_rate | numeric | YES | — |
| 14 | inventory_listing | text | YES | — |

#### Table: Themes Directory

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | baby_shower | text | NO | — |
| 3 | bridal_shower | text | YES | — |
| 4 | Celebration | text | YES | — |
| 5 | Dining | text | YES | — |
| 6 | Festival | text | YES | — |
| 7 | market_place | _text | YES | — |
| 8 | meet_up | _text | YES | — |
| 9 | parties | _text | YES | — |
| 10 | retreats | text | YES | — |
| 11 | reunion | text | YES | — |
| 12 | special_event | _text | YES | — |
| 13 | sporting | _text | YES | — |
| 14 | wedding | text | YES | — |
| 15 | Health_Wellness | text | YES | — |
| 16 | event_themes_catalog | jsonb | YES | — |

#### Table: Themes Directory Catalog

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 2 | name | text | NO | — |
| 3 | created_at | timestamp with time zone | NO | now() |
| 4 | description | text | YES | — |
| 5 | tags | _text | YES | — |
| 6 | premium | boolean | NO | false |
| 8 | wedding_types | _text | YES | ARRAY['bridal_shower'::text, 'ceremony'::text, 'rehearsal_dinner'::text, 'bachelor_party'::text] |
| 9 | celebration_types | _text | YES | ARRAY['holiday'::text, 'personal'::text] |
| 10 | holiday_types | _text | YES | ARRAY['New Years Day'::text, 'MLK Day'::text, 'Presidents Day'::text, 'Memorial Day'::text, 'Independence Day'::text, 'Labor Day'::text, 'Columbus Day'::text, 'Veterans Day'::text, 'Thanksgiving'::text, 'Christmas'::text] |
| 11 | personal_types | _text | YES | ARRAY['baby_shower'::text, 'birthday_party'::text, 'anniversary'::text, 'graduation'::text] |
| 12 | dining_types | _text | YES | — |
| 13 | festival_types | _text | YES | — |
| 14 | retreat_types | _text | YES | ARRAY['skills_building'::text, 'personal_development'::text, 'community_relationships'::text, 'hybrid'::text] |
| 15 | reunion_types | _text | YES | — |
| 16 | health_wellness_types | _text | YES | — |
| 17 | id | integer | NO | nextval('event_themes_id_seq'::regclass) |

#### Table: Transportation Directory

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | transo_rental_id | integer | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | bus | _text | YES | — |
| 4 | van | text | YES | — |
| 5 | limo | text | YES | — |
| 6 | car_suv | text | YES | — |
| 7 | truck | text | YES | — |
| 8 | other | text | YES | — |
| 9 | state | text | YES | — |
| 10 | city | text | YES | — |
| 11 | region | text | YES | — |

#### Table: Transportation Profile

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | transpo_id | text | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | trans_type | text | YES | — |
| 4 | biz_name | text | YES | — |
| 5 | biz_email | text | YES | — |
| 6 | trans_contact_name | text | YES | — |
| 7 | trans_contact_nbr | numeric | YES | — |
| 8 | days_of_operation | _text | YES | — |
| 9 | hours_of_operation | _timestamptz | YES | — |
| 10 | dates_available | date | YES | — |
| 11 | departure_date | date | YES | — |
| 12 | departure_time | timestamp with time zone | YES | — |
| 13 | arrival_date | date | YES | — |
| 14 | arrival_time | timestamp with time zone | YES | — |
| 15 | departure_location | text | YES | — |
| 16 | destination_location | text | YES | — |
| 17 | seating_capacity | numeric | YES | — |
| 18 | special_accommodations | _text | YES | — |
| 19 | transpo_cost | numeric | YES | — |
| 20 | confirmation_nbr | numeric | YES | — |
| 21 | trans_amenities | text | YES | — |

#### Table: User Profile

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | bigint | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | Biz_Name | text | YES | — |
| 4 | User_Contact_Ph_Nbr | numeric | YES | — |
| 5 | User_Contact_Name | text | YES | — |
| 6 | User_Email | text | YES | — |
| 7 | User_Type | text | YES | — |
| 8 | Subscription_type | text | YES | 'Trial'::text |
| 9 | Pay_Method | text | YES | — |
| 10 | Subscription_Start_Date | date | YES | — |
| 11 | Subscription_End_Date | date | YES | — |
| 12 | Subscription_Upgrade_Type | text | YES | — |
| 13 | Sibscription_Upgrade_Date | date | YES | — |
| 14 | User_Category | text | YES | — |
| 15 | User_Subscription_Freq | text | YES | — |
| 16 | User_Location | text | YES | — |
| 18 | user_id | uuid | YES | — |
| 19 | user_upload_pics | text | YES | — |

#### Table: Vendor Directory

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | bigint | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | Bakery | text | YES | — |
| 4 | Beverage | text | YES | — |
| 5 | Brewery | text | YES | — |
| 6 | Caterer | text | YES | — |
| 7 | Chef | text | YES | — |
| 8 | Florist | text | YES | — |
| 9 | Food Truck | text | YES | — |
| 10 | Foodies | text | YES | — |
| 11 | Ice_Sculpure | text | YES | — |
| 12 | Mobile_Pop_Up | text | YES | — |
| 13 | Other | text | YES | — |
| 14 | Videographer | text | YES | — |
| 15 | Winery | text | YES | — |
| 16 | other_manual_text | text | YES | — |
| 17 | state | text | YES | — |
| 18 | city | text | YES | — |
| 19 | region | text | YES | — |

#### Table: Vendor Profile

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | vendor_type_id | text | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | vendor_biz_name | text | YES | — |
| 4 | vendor_location | text | YES | — |
| 5 | vendor_contact_name | text | YES | — |
| 6 | vendor_contact_nbr | numeric | YES | — |
| 7 | vendor_email | text | YES | — |
| 8 | vendor_type | text | YES | — |
| 9 | vendor_price | numeric | YES | — |
| 10 | ven_avail_dates | date | YES | — |

#### Table: Venue Directory

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | bigint | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | Agri-Farming | text | YES | — |
| 4 | Hospitality_Location | text | YES | — |
| 5 | Local_Govern_Location | text | YES | — |
| 6 | Market_Place | text | YES | — |
| 7 | Other | text | YES | — |
| 8 | Private_Club | text | YES | — |
| 9 | Private_Resident | text | YES | — |
| 10 | Recreation_Location | text | YES | — |
| 11 | Resort_Location | text | YES | — |
| 12 | Restaurant_Location | text | YES | — |
| 13 | Business_Location | text | YES | — |
| 14 | Sporting_Facility | text | YES | — |
| 15 | State_Govern_Location | text | YES | — |
| 16 | Warehouse | text | YES | — |
| 17 | Sporting_Facility_Location | text | YES | — |
| 18 | Warehouse_Location | text | YES | — |
| 19 | Private_Club_Location | text | YES | — |
| 20 | Agri_Location | text | YES | — |
| 21 | Market_Location | text | YES | — |
| 22 | Hospitality | text | YES | — |
| 23 | Local_Govern | text | YES | — |
| 24 | Private_Residence_Location | text | YES | — |
| 25 | Other_Location | text | YES | — |
| 26 | Recreation | text | YES | — |
| 27 | Resort | text | YES | — |
| 28 | Restaurant | text | YES | — |
| 29 | Business | text | YES | — |
| 30 | State_Govern | text | YES | — |
| 31 | state | text | YES | — |
| 32 | city | text | YES | — |
| 33 | region | text | YES | — |

#### Table: Venue Profile

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | venue_type_id | text | NO | — |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | ven_locatiom | text | YES | — |
| 4 | ven_email | text | YES | — |
| 5 | ven_contact_name | text | YES | — |
| 6 | ven_contact_ph_nbr | numeric | YES | — |
| 7 | ven_biz_name | text | YES | — |
| 8 | ven_reservation_date | date | YES | — |
| 9 | ven_reservation_time | timestamp with time zone | YES | — |
| 10 | ven_price | numeric | YES | — |
| 11 | venue_amenities | text | YES | — |

#### Table: amenity_types

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | integer | NO | nextval('amenity_types_id_seq'::regclass) |
| 2 | name | text | NO | — |
| 3 | description | text | YES | — |
| 4 | created_at | timestamp with time zone | NO | now() |
| 5 | updated_at | timestamp with time zone | NO | now() |
| 6 | price | numeric | YES | 0 |

#### Table: backup_cm_change_requests_columns_20260608

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | backed_up_at | timestamp with time zone | YES | — |
| 2 | table_schema | name | YES | — |
| 3 | table_name | name | YES | — |
| 4 | column_name | name | YES | — |
| 5 | ordinal_position | integer | YES | — |
| 6 | column_default | character varying | YES | — |
| 7 | is_nullable | character varying | YES | — |
| 8 | data_type | character varying | YES | — |
| 9 | udt_name | name | YES | — |

#### Table: backup_cm_change_requests_data_20260608

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | YES | — |
| 2 | created_at | timestamp with time zone | YES | — |
| 3 | event_id | uuid | YES | — |
| 4 | task_id | uuid | YES | — |
| 5 | requested_by | uuid | YES | — |
| 6 | description | text | YES | — |
| 7 | priority_tag | text | YES | — |
| 8 | field_changed | text | YES | — |
| 9 | old_value | text | YES | — |
| 10 | new_value | text | YES | — |
| 11 | status | text | YES | — |
| 12 | resolved_at | timestamp with time zone | YES | — |
| 13 | resolved_by | uuid | YES | — |
| 14 | rollout_timing | text | YES | — |
| 15 | location_id | uuid | YES | — |
| 16 | device_info | jsonb | YES | — |
| 17 | requested_estimate_minutes | integer | YES | — |
| 18 | change_type | text | YES | — |

#### Table: backup_cm_change_requests_policies_20260608

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | backed_up_at | timestamp with time zone | YES | — |
| 2 | schemaname | name | YES | — |
| 3 | tablename | name | YES | — |
| 4 | policyname | name | YES | — |
| 5 | permissive | text | YES | — |
| 6 | roles | _name | YES | — |
| 7 | cmd | text | YES | — |
| 8 | qual | text | YES | — |
| 9 | with_check | text | YES | — |

#### Table: backup_cm_change_requests_test_event_20260608

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | YES | — |
| 2 | created_at | timestamp with time zone | YES | — |
| 3 | event_id | uuid | YES | — |
| 4 | task_id | uuid | YES | — |
| 5 | requested_by | uuid | YES | — |
| 6 | description | text | YES | — |
| 7 | priority_tag | text | YES | — |
| 8 | field_changed | text | YES | — |
| 9 | old_value | text | YES | — |
| 10 | new_value | text | YES | — |
| 11 | status | text | YES | — |
| 12 | resolved_at | timestamp with time zone | YES | — |
| 13 | resolved_by | uuid | YES | — |
| 14 | rollout_timing | text | YES | — |
| 15 | location_id | uuid | YES | — |
| 16 | device_info | jsonb | YES | — |
| 17 | requested_estimate_minutes | integer | YES | — |
| 18 | change_type | text | YES | — |

#### Table: barcode_submissions

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | book_id | text | NO | — |
| 3 | event_name | text | NO | — |
| 4 | ticket_number | text | NO | — |
| 5 | email | text | NO | — |
| 6 | phone | text | YES | — |
| 7 | notes | text | YES | — |
| 8 | created_at | timestamp with time zone | NO | now() |
| 9 | updated_at | timestamp with time zone | NO | now() |

#### Table: budget_items

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | event_id | uuid | NO | — |
| 3 | category | budget_category | NO | — |
| 4 | item_name | text | NO | — |
| 5 | description | text | YES | — |
| 6 | estimated_cost | numeric | YES | — |
| 7 | actual_cost | numeric | YES | — |
| 8 | vendor_name | text | YES | — |
| 9 | vendor_contact | text | YES | — |
| 10 | payment_status | text | YES | 'pending'::text |
| 11 | payment_due_date | date | YES | — |
| 12 | created_by | uuid | NO | — |
| 13 | created_at | timestamp with time zone | NO | now() |
| 14 | updated_at | timestamp with time zone | NO | now() |
| 15 | archived | boolean | NO | false |
| 16 | status | text | YES | 'Estimated'::text |
| 17 | original_amount | numeric | YES | — |
| 18 | budget_credit | numeric | YES | 0 |

#### Table: change_logs

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | entity_type | text | NO | — |
| 3 | entity_id | uuid | NO | — |
| 4 | action | text | NO | — |
| 5 | field_name | text | YES | — |
| 6 | old_value | text | YES | — |
| 7 | new_value | text | YES | — |
| 8 | changed_by | uuid | NO | — |
| 9 | change_description | text | YES | — |
| 10 | created_at | timestamp with time zone | NO | now() |

#### Table: change_requests

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | title | text | NO | — |
| 3 | description | text | YES | — |
| 4 | status | change_status | NO | 'pending'::change_status |
| 5 | priority | task_priority | NO | 'medium'::task_priority |
| 6 | event_id | text | YES | — |
| 7 | task_id | uuid | YES | — |
| 8 | requested_by | uuid | YES | — |
| 9 | approved_by | uuid | YES | — |
| 10 | applied_by | uuid | YES | — |
| 11 | created_at | timestamp with time zone | NO | now() |
| 12 | updated_at | timestamp with time zone | NO | now() |
| 13 | approved_at | timestamp with time zone | YES | — |
| 14 | applied_at | timestamp with time zone | YES | — |
| 15 | rejection_reason | text | YES | — |
| 16 | change_type | change_type | YES | 'event_update'::change_type |
| 17 | field_changes | jsonb | YES | — |

#### Table: check_lists

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | event_id | uuid | NO | — |
| 3 | resource_type | text | NO | — |
| 4 | resource_id | text | NO | ''::text |
| 5 | title | text | NO | ''::text |
| 6 | items | jsonb | NO | '[]'::jsonb |
| 7 | created_at | timestamp with time zone | NO | now() |
| 8 | updated_at | timestamp with time zone | NO | now() |

#### Table: checklist_templates

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | integer | NO | nextval('checklist_templates_id_seq'::regclass) |
| 2 | category_name | text | NO | — |
| 3 | sort_order | integer | NO | 0 |
| 4 | label | text | NO | — |
| 5 | created_at | timestamp with time zone | NO | now() |

#### Table: cm_activity

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | event_id | uuid | YES | — |
| 3 | entity_type | text | NO | — |
| 4 | entity_id | uuid | YES | — |
| 5 | action | text | NO | — |
| 6 | changed_by | uuid | YES | — |
| 7 | metadata | jsonb | YES | — |
| 8 | created_at | timestamp with time zone | NO | now() |

#### Table: cm_audit_events

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | user_id | uuid | YES | — |
| 4 | event_id | uuid | YES | — |
| 5 | type | text | NO | — |
| 6 | description | text | YES | — |
| 7 | payload | jsonb | YES | — |

#### Table: cm_change_logs

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | entity_type | text | NO | — |
| 3 | entity_id | uuid | NO | — |
| 4 | action | text | NO | — |
| 5 | field_name | text | YES | — |
| 6 | old_value | text | YES | — |
| 7 | new_value | text | YES | — |
| 8 | changed_by | uuid | NO | — |
| 9 | change_description | text | YES | — |
| 10 | created_at | timestamp with time zone | NO | now() |

#### Table: cm_change_requests

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | created_at | timestamp with time zone | NO | now() |
| 3 | event_id | uuid | YES | — |
| 4 | task_id | uuid | YES | — |
| 5 | requested_by | uuid | YES | — |
| 6 | description | text | YES | — |
| 7 | priority_tag | text | YES | — |
| 8 | field_changed | text | YES | — |
| 9 | old_value | text | YES | — |
| 10 | new_value | text | YES | — |
| 11 | status | text | YES | 'pending'::text |
| 12 | resolved_at | timestamp with time zone | YES | — |
| 13 | resolved_by | uuid | YES | — |
| 14 | rollout_timing | text | NO | 'optional'::text |
| 15 | location_id | uuid | YES | — |
| 16 | device_info | jsonb | YES | — |
| 17 | requested_estimate_minutes | integer | YES | — |
| 18 | change_type | text | YES | — |

#### Table: cm_event_members

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | user_id | uuid | NO | — |
| 2 | event_id | uuid | NO | — |
| 3 | role | text | NO | 'viewer'::text |

#### Table: cm_locations

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | event_id | uuid | YES | — |
| 3 | name | text | YES | — |
| 4 | address | text | YES | — |
| 5 | city | text | YES | — |
| 6 | state | text | YES | — |
| 7 | zip | text | YES | — |
| 8 | region | text | YES | — |
| 9 | created_at | timestamp with time zone | YES | now() |

#### Table: cm_resources

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | event_id | uuid | YES | — |
| 3 | name | text | YES | — |
| 4 | role | text | YES | — |
| 5 | location_id | uuid | YES | — |
| 6 | availability | jsonb | YES | — |

#### Table: cm_tasks

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | event_id | uuid | YES | — |
| 3 | name | text | YES | — |
| 4 | start_date | timestamp with time zone | YES | — |
| 5 | end_date | timestamp with time zone | YES | — |
| 6 | depends_on | uuid | YES | — |
| 7 | locked | boolean | YES | false |
| 8 | status | text | YES | — |

#### Table: collaborator_configurations

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | team_id | uuid | YES | — |
| 3 | role | text | NO | — |
| 4 | collaborator_types | _text | NO | — |
| 5 | is_coordinator | boolean | YES | false |
| 6 | is_viewer | boolean | YES | false |
| 7 | assigned_user_id | uuid | YES | — |
| 8 | notes | text | YES | — |
| 9 | created_at | timestamp with time zone | YES | now() |
| 10 | updated_at | timestamp with time zone | YES | now() |
| 11 | roles | _text | YES | '{}'::text[] |
| 12 | permission_level_text | text | YES | 'R'::text |

#### Table: confirmation_submissions

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | book_id | text | NO | — |
| 3 | confirmation_number | text | NO | — |
| 4 | name | text | NO | — |
| 5 | email | text | NO | — |
| 6 | phone | text | YES | — |
| 7 | notes | text | YES | — |
| 8 | created_at | timestamp with time zone | NO | now() |
| 9 | updated_at | timestamp with time zone | NO | now() |
| 10 | event_id | text | YES | — |

#### Table: discussion_comment_likes

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | comment_id | uuid | NO | — |
| 2 | user_id | uuid | NO | — |
| 3 | created_at | timestamp with time zone | NO | now() |

#### Table: discussion_comments

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | user_id | uuid | NO | — |
| 3 | parent_id | uuid | YES | — |
| 4 | content | text | NO | — |
| 5 | entity_type | text | NO | 'general'::text |
| 6 | entity_id | text | NO | 'general'::text |
| 7 | entity_title | text | NO | 'General Discussion'::text |
| 8 | attachments | jsonb | NO | '[]'::jsonb |
| 9 | mentions | _text | NO | '{}'::text[] |
| 10 | is_edited | boolean | NO | false |
| 11 | created_at | timestamp with time zone | NO | now() |
| 12 | updated_at | timestamp with time zone | NO | now() |
| 13 | author_display_name | text | YES | — |
| 14 | author_avatar_url | text | YES | — |

#### Table: email_events

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | user_id | uuid | YES | — |
| 3 | event_id | uuid | YES | — |
| 4 | template | text | NO | — |
| 5 | recipient | text | NO | — |
| 6 | provider | text | YES | 'resend'::text |
| 7 | status | text | NO | 'sent'::text |
| 8 | error | text | YES | — |
| 9 | metadata | jsonb | YES | — |
| 10 | created_at | timestamp with time zone | NO | now() |

#### Table: entertainment_types

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | integer | NO | nextval('entertainment_types_id_seq'::regclass) |
| 2 | name | text | NO | — |
| 3 | created_at | timestamp with time zone | NO | now() |
| 4 | updated_at | timestamp with time zone | NO | now() |

#### Table: entertainments

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | business_name | text | NO | — |
| 3 | contact_name | text | YES | — |
| 4 | email | text | YES | — |
| 5 | phone_number | text | YES | — |
| 6 | city | text | YES | — |
| 7 | state | text | YES | — |
| 8 | zip | text | YES | — |
| 9 | ent_type_id | integer | YES | — |
| 10 | created_at | timestamp with time zone | NO | now() |
| 11 | updated_at | timestamp with time zone | NO | now() |
| 12 | price | numeric | YES | — |
| 13 | description | text | YES | — |
| 14 | linkedin_url | text | YES | — |
| 15 | instagram_url | text | YES | — |
| 16 | rating | numeric | YES | 0 |
| 17 | entertainment_directory_id | bigint | YES | — |
| 18 | checklist | jsonb | YES | '[]'::jsonb |
| 19 | checklist_completed_count | integer | YES | 0 |
| 20 | custom_type | text | YES | — |

#### Table: event_resource_selections

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | event_id | uuid | NO | — |
| 3 | resource_id | uuid | NO | — |
| 4 | selection_type | text | NO | — |
| 5 | status | text | NO | 'selected'::text |
| 6 | notes | text | YES | — |
| 7 | created_at | timestamp with time zone | NO | now() |
| 8 | updated_at | timestamp with time zone | NO | now() |

#### Table: event_types

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 2 | name | text | NO | — |
| 3 | theme_id | integer | YES | — |
| 4 | created_at | timestamp with time zone | NO | now() |
| 6 | parent_id | integer | YES | — |
| 7 | id | integer | NO | nextval('event_types_id_seq'::regclass) |

#### Table: events

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | user_id | uuid | NO | — |
| 3 | title | text | NO | — |
| 4 | description | text | YES | — |
| 6 | venue | text | NO | — |
| 7 | start_date | date | NO | — |
| 8 | end_date | date | YES | — |
| 9 | budget | numeric | YES | — |
| 10 | expected_attendees | integer | YES | — |
| 12 | created_at | timestamp with time zone | NO | now() |
| 13 | updated_at | timestamp with time zone | NO | now() |
| 16 | start_time | time without time zone | YES | — |
| 17 | end_time | time without time zone | YES | — |
| 18 | theme_id | integer | YES | — |
| 21 | status | event_status_enum | YES | 'pending'::event_status_enum |
| 22 | location | text | YES | — |
| 23 | entertainment_id | uuid | YES | — |
| 24 | service_rental_buy_id | uuid | YES | — |
| 25 | archived | boolean | NO | false |
| 26 | service_vendor_id | uuid | YES | — |
| 27 | entertainment_ids | _uuid | YES | — |
| 28 | service_vendor_ids | _uuid | YES | — |
| 29 | external_supplier_ids | _uuid | YES | — |
| 30 | venue_booking_completed | boolean | NO | false |
| 31 | type_id | integer | YES | — |
| 32 | organization_id | uuid | YES | — |

#### Table: external_vendor directory

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | category | text | NO | — |
| 3 | type | text | NO | — |
| 4 | manual_entry | text | YES | — |
| 5 | created_at | timestamp with time zone | NO | now() |
| 6 | updated_at | timestamp with time zone | NO | now() |

#### Table: external_vendor profile

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | external_vendor_directory_id | uuid | YES | — |
| 3 | business_name | text | YES | — |
| 4 | contact_name | text | YES | — |
| 5 | email | text | YES | — |
| 6 | phone | text | YES | — |
| 7 | notes | text | YES | — |
| 8 | manual_entry | text | YES | — |
| 9 | created_at | timestamp with time zone | NO | now() |
| 10 | updated_at | timestamp with time zone | NO | now() |

#### Table: hospitality_profile_amenities

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | hospitality_profile_id | uuid | NO | — |
| 3 | amenity_type_id | integer | NO | — |
| 4 | created_at | timestamp with time zone | NO | now() |

#### Table: hospitality_profiles

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | business_name | text | NO | — |
| 3 | contact_name | text | YES | — |
| 4 | email | text | YES | — |
| 5 | phone_number | text | YES | — |
| 6 | website | text | YES | — |
| 7 | city | text | YES | — |
| 8 | state | text | YES | — |
| 9 | zip | text | YES | — |
| 10 | created_at | timestamp with time zone | NO | now() |
| 11 | updated_at | timestamp with time zone | NO | now() |
| 12 | hospitality_type | integer | YES | — |
| 13 | cost | numeric | YES | — |
| 14 | capacity | integer | YES | — |
| 15 | make_reservations | text | YES | — |
| 16 | linkedin_url | text | YES | — |
| 17 | instagram_url | text | YES | — |
| 18 | rating | numeric | YES | 0 |
| 19 | checklist | jsonb | YES | '[]'::jsonb |
| 20 | checklist_completed_count | integer | YES | 0 |

#### Table: hospitality_types

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | integer | NO | nextval('hospitality_types_id_seq'::regclass) |
| 2 | name | text | NO | — |
| 3 | created_at | timestamp with time zone | NO | now() |
| 4 | updated_at | timestamp with time zone | NO | now() |

#### Table: invoices

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | user_id | uuid | NO | — |
| 3 | plan_name | text | NO | 'starter'::text |
| 4 | amount | numeric | NO | 0 |
| 5 | currency | text | NO | 'USD'::text |
| 6 | status | text | NO | 'draft'::text |
| 7 | due_date | date | YES | — |
| 8 | paid_at | timestamp with time zone | YES | — |
| 9 | invoice_number | text | YES | — |
| 10 | description | text | YES | — |
| 11 | billing_period_start | date | YES | — |
| 12 | billing_period_end | date | YES | — |
| 13 | stripe_invoice_id | text | YES | — |
| 14 | created_at | timestamp with time zone | NO | now() |
| 15 | updated_at | timestamp with time zone | NO | now() |

#### Table: marketing_campaigns

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | campaign_name | text | YES | — |
| 3 | campaign_type | text | YES | — |
| 4 | start_date | timestamp with time zone | YES | — |
| 5 | end_date | timestamp with time zone | YES | — |
| 6 | created_at | timestamp with time zone | NO | now() |

#### Table: marketing_conversions

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | subscriber_id | uuid | YES | — |
| 3 | conversion_type | text | YES | — |
| 4 | conversion_date | timestamp with time zone | NO | now() |
| 5 | value | numeric | YES | — |
| 6 | created_at | timestamp with time zone | NO | now() |
| 7 | auth_user_id | uuid | YES | — |

#### Table: marketing_email_deliveries

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | subscriber_id | uuid | NO | — |
| 3 | email_id | uuid | YES | — |
| 4 | sent_at | timestamp with time zone | YES | — |
| 5 | opened | boolean | NO | false |
| 6 | clicked | boolean | NO | false |
| 7 | created_at | timestamp with time zone | NO | now() |

#### Table: marketing_emails

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | campaign_id | uuid | YES | — |
| 3 | email_name | text | YES | — |
| 4 | subject_line | text | YES | — |
| 5 | send_day | integer | YES | — |
| 6 | template_key | text | YES | — |
| 7 | created_at | timestamp with time zone | NO | now() |

#### Table: marketing_profiles

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | business_name | text | NO | — |
| 3 | contact_name | text | YES | — |
| 4 | email | text | YES | — |
| 5 | phone_number | text | YES | — |
| 6 | website | text | YES | — |
| 7 | city | text | YES | — |
| 8 | state | text | YES | — |
| 9 | zip | text | YES | — |
| 10 | address | text | YES | — |
| 11 | marketing_type_id | integer | YES | — |
| 12 | marketing_directory_id | bigint | YES | — |
| 13 | specialization | text | YES | — |
| 14 | platforms | _text | YES | — |
| 15 | target_audience | text | YES | — |
| 16 | campaign_types | _text | YES | — |
| 17 | price | numeric | YES | — |
| 18 | price_unit | text | YES | 'per campaign'::text |
| 19 | budget_range_min | numeric | YES | — |
| 20 | budget_range_max | numeric | YES | — |
| 21 | instagram_url | text | YES | — |
| 22 | linkedin_url | text | YES | — |
| 23 | facebook_url | text | YES | — |
| 24 | twitter_url | text | YES | — |
| 25 | rating | numeric | YES | 0 |
| 26 | total_reviews | integer | YES | 0 |
| 27 | portfolio_url | text | YES | — |
| 28 | description | text | YES | — |
| 29 | checklist | jsonb | YES | '[{"id": "m1", "label": "Campaign brief confirmed", "checked": false, "category": "Planning"}, {"id": "m2", "label": "Target audience defined", "checked": false, "category": "Strategy"}, {"id": "m3", "label": "Budget approved", "checked": false, "category": "Finance"}, {"id": "m4", "label": "Contract / agreement signed", "checked": false, "category": "Legal"}, {"id": "m5", "label": "Creative assets delivered", "checked": false, "category": "Creative"}, {"id": "m6", "label": "Platforms / channels confirmed", "checked": false, "category": "Distribution"}, {"id": "m7", "label": "Launch date scheduled", "checked": false, "category": "Scheduling"}, {"id": "m8", "label": "Performance tracking setup", "checked": false, "category": "Analytics"}]'::jsonb |
| 30 | checklist_completed_count | integer | YES | 0 |
| 31 | is_active | boolean | YES | true |
| 32 | created_at | timestamp with time zone | NO | now() |
| 33 | updated_at | timestamp with time zone | NO | now() |

#### Table: marketing_subscribers

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | email | text | NO | — |
| 3 | name | text | YES | — |
| 4 | user_type | text | YES | — |
| 5 | organization | text | YES | — |
| 6 | signup_source | text | YES | — |
| 7 | created_at | timestamp with time zone | NO | now() |

#### Table: marketing_types

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | integer | NO | nextval('marketing_types_id_seq'::regclass) |
| 2 | name | text | NO | — |
| 3 | description | text | YES | — |
| 4 | created_at | timestamp with time zone | NO | now() |
| 5 | updated_at | timestamp with time zone | NO | now() |

#### Table: notifications

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | recipient_id | uuid | NO | — |
| 3 | sender_id | uuid | YES | — |
| 4 | title | text | NO | — |
| 5 | message | text | NO | — |
| 6 | type | text | NO | — |
| 7 | entity_type | text | YES | — |
| 8 | entity_id | uuid | YES | — |
| 9 | is_read | boolean | NO | false |
| 10 | created_at | timestamp with time zone | NO | now() |
| 11 | event_id | uuid | YES | — |
| 12 | channel | text | YES | — |
| 13 | sent_at | timestamp with time zone | YES | — |

#### Table: organization_members

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | organization_id | uuid | NO | — |
| 3 | user_id | uuid | NO | — |
| 4 | role | text | NO | 'host'::text |
| 5 | created_at | timestamp with time zone | NO | now() |

#### Table: organizations

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | name | text | NO | — |
| 3 | owner_id | uuid | YES | — |
| 4 | created_at | timestamp with time zone | NO | now() |
| 5 | updated_at | timestamp with time zone | NO | now() |

#### Table: private_profiles

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | user_id | uuid | NO | — |
| 2 | email | text | YES | — |
| 3 | phone | text | YES | — |
| 4 | pay_method | text | YES | — |

#### Table: private_residence_responses

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | user_id | uuid | YES | — |
| 3 | event_id | uuid | YES | — |
| 4 | street_address | text | NO | — |
| 5 | email | text | NO | — |
| 6 | phone_number | text | NO | — |
| 7 | created_at | timestamp with time zone | NO | now() |
| 8 | updated_at | timestamp with time zone | NO | now() |

#### Table: profiles

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | user_id | uuid | NO | — |
| 3 | username | text | YES | — |
| 4 | display_name | text | YES | — |
| 5 | bio | text | YES | — |
| 6 | created_at | timestamp with time zone | NO | now() |
| 7 | updated_at | timestamp with time zone | NO | now() |
| 8 | avatar_url | text | YES | — |
| 9 | subscription_level | text | YES | — |
| 10 | onboarding_completed_at | timestamp with time zone | YES | — |
| 11 | subscription_plan | text | YES | 'starter'::text |
| 12 | subscription_status | text | YES | 'active'::text |
| 13 | subscription_started_at | timestamp with time zone | YES | — |
| 14 | subscription_expires_at | timestamp with time zone | YES | — |

#### Table: public_profiles

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | user_id | uuid | NO | — |
| 2 | display_name | text | YES | — |
| 3 | avatar_url | text | YES | — |
| 4 | role | text | YES | — |

#### Table: qrcode_submissions

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | book_id | text | NO | — |
| 3 | event_name | text | NO | — |
| 4 | ticket_number | text | NO | — |
| 5 | email | text | NO | — |
| 6 | phone | text | YES | — |
| 7 | notes | text | YES | — |
| 8 | created_at | timestamp with time zone | NO | now() |
| 9 | updated_at | timestamp with time zone | NO | now() |

#### Table: registry_submissions

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | book_id | text | NO | — |
| 3 | name | text | NO | — |
| 4 | email | text | NO | — |
| 5 | phone | text | YES | — |
| 6 | selected_items | jsonb | NO | — |
| 7 | total_amount | numeric | NO | — |
| 8 | message | text | YES | — |
| 9 | created_at | timestamp with time zone | NO | now() |
| 10 | updated_at | timestamp with time zone | NO | now() |

#### Table: reservation_submissions

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | book_id | text | NO | — |
| 3 | name | text | NO | — |
| 4 | email | text | NO | — |
| 5 | phone | text | NO | — |
| 6 | party_size | integer | NO | — |
| 7 | preferred_date | date | NO | — |
| 8 | preferred_time | text | NO | — |
| 9 | special_requests | text | YES | — |
| 10 | created_at | timestamp with time zone | NO | now() |
| 11 | updated_at | timestamp with time zone | NO | now() |
| 12 | venue_id | uuid | YES | — |
| 13 | event_id | text | YES | — |

#### Table: resource_categories

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | integer | NO | nextval('resource_categories_id_seq'::regclass) |
| 2 | name | text | NO | — |
| 3 | created_at | timestamp with time zone | NO | now() |

#### Table: resource_status

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | integer | NO | nextval('resource_status_id_seq'::regclass) |
| 2 | name | text | NO | — |
| 3 | created_at | timestamp with time zone | NO | now() |

#### Table: resources

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | name | text | NO | — |
| 3 | category_id | integer | NO | — |
| 4 | status_id | integer | YES | — |
| 5 | location | text | NO | — |
| 7 | allocated | integer | NO | 0 |
| 8 | total | integer | NO | 0 |
| 9 | event_id | uuid | NO | — |
| 10 | created_at | timestamp with time zone | NO | now() |
| 11 | updated_at | timestamp with time zone | NO | now() |

#### Table: role_permission_groups

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | role | app_role | NO | — |
| 2 | permission_group | permission_level | NO | — |
| 3 | created_at | timestamp with time zone | YES | now() |

#### Table: rsvp_submissions

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | book_id | text | NO | — |
| 3 | guest_name | text | NO | — |
| 4 | guest_email | text | NO | — |
| 5 | response_type | text | NO | — |
| 6 | guest_count | integer | YES | — |
| 7 | special_requests | text | YES | — |
| 8 | created_at | timestamp with time zone | NO | now() |
| 9 | updated_at | timestamp with time zone | NO | now() |
| 10 | event_id | text | YES | — |

#### Table: service_rental_buy

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | business_name | text | NO | — |
| 3 | contact_name | text | YES | — |
| 4 | email | text | YES | — |
| 5 | phone_number | text | YES | — |
| 6 | city | text | YES | — |
| 7 | state | text | YES | — |
| 8 | zip | text | YES | — |
| 9 | created_at | timestamp with time zone | NO | now() |
| 10 | updated_at | timestamp with time zone | NO | now() |
| 11 | price | numeric | YES | — |
| 12 | description | text | YES | — |

#### Table: service_rental_buy_assignments

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | integer | NO | nextval('serv_vendor_rental_types_id_seq'::regclass) |
| 2 | service_rental_buy_id | uuid | YES | — |
| 3 | vendor_rental_type_id | integer | YES | — |
| 4 | created_at | timestamp with time zone | NO | now() |
| 5 | updated_at | timestamp with time zone | NO | now() |

#### Table: service_rental_types

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | integer | NO | nextval('serv_vendor_rental_types_id_seq1'::regclass) |
| 2 | serv_vendor_rental_id | uuid | YES | — |
| 3 | vendor_rental_type_id | integer | YES | — |
| 4 | created_at | timestamp with time zone | NO | now() |
| 5 | updated_at | timestamp with time zone | NO | now() |

#### Table: supplier_categories

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | integer | NO | nextval('supplier_categories_id_seq'::regclass) |
| 2 | name | text | NO | — |
| 3 | created_at | timestamp with time zone | NO | now() |

#### Table: supplier_types

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | integer | NO | nextval('supplier_types_id_seq'::regclass) |
| 2 | name | text | NO | — |
| 3 | created_at | timestamp with time zone | NO | now() |

#### Table: suppliers

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | business_name | text | NO | — |
| 3 | contact_name | text | YES | — |
| 4 | email | text | YES | — |
| 5 | phone_number | text | YES | — |
| 6 | city | text | YES | — |
| 7 | state | text | YES | — |
| 8 | zip | text | YES | — |
| 9 | type_id | integer | YES | — |
| 10 | category_id | integer | YES | — |
| 11 | created_at | timestamp with time zone | NO | now() |
| 12 | updated_at | timestamp with time zone | NO | now() |
| 13 | price | numeric | YES | — |
| 14 | description | text | YES | — |
| 15 | inventory_images | text | YES | — |
| 16 | linkedin_url | text | YES | — |
| 17 | instagram_url | text | YES | — |
| 18 | rating | numeric | YES | 0 |
| 19 | checklist | jsonb | YES | '[]'::jsonb |
| 20 | checklist_completed_count | integer | YES | 0 |
| 21 | supplier_cost | numeric | YES | — |
| 22 | custom_category | text | YES | — |
| 23 | custom_type | text | YES | — |

#### Table: task_assignments

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | task_id | uuid | NO | — |
| 4 | created_at | timestamp with time zone | NO | now() |
| 5 | created_by | uuid | NO | — |
| 6 | user_id | uuid | YES | — |

#### Table: task_collaborator_assignments

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | integer | NO | nextval('team_assignments_id_seq'::regclass) |
| 2 | team_id | uuid | NO | — |
| 3 | user_id | uuid | NO | — |
| 4 | team_admin | boolean | NO | false |
| 5 | created_at | timestamp with time zone | NO | now() |
| 6 | updated_at | timestamp with time zone | NO | now() |
| 7 | is_viewer | boolean | NO | false |
| 8 | is_collaborator | boolean | NO | false |

#### Table: tasks

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | event_id | uuid | YES | — |
| 3 | title | text | NO | — |
| 4 | description | text | YES | — |
| 5 | assigned_to | uuid | YES | — |
| 7 | status | task_status | YES | 'not_started'::task_status |
| 8 | priority | task_priority | NO | 'medium'::task_priority |
| 9 | estimated_hours | numeric | YES | — |
| 10 | actual_hours | numeric | YES | — |
| 11 | due_date | timestamp with time zone | YES | — |
| 12 | created_by | uuid | NO | — |
| 13 | created_at | timestamp with time zone | NO | now() |
| 14 | updated_at | timestamp with time zone | NO | now() |
| 15 | assigned_venue_role | text | YES | — |
| 16 | assigned_supplier_vendor_role | text | YES | — |
| 17 | assigned_service_vendor_role | text | YES | — |
| 18 | assined_vendor_role | text | YES | — |
| 19 | start_time | time without time zone | YES | — |
| 20 | end_time | time without time zone | YES | — |
| 21 | start_date | date | YES | — |
| 22 | end_date | date | YES | — |
| 23 | archived | boolean | NO | false |
| 24 | category | text | YES | — |
| 25 | assigned_coordinator_name | text | YES | — |
| 26 | assigned_to_display_name | text | YES | — |
| 27 | assigned_bookings_role | text | YES | — |
| 28 | assigned_service_rental_role | text | YES | — |
| 29 | assigned_hospitality_role | text | YES | — |
| 30 | assigned_entertainment_role | text | YES | — |
| 31 | assigned_transportation_role | text | YES | — |
| 32 | assigned_external_vendor_role | text | YES | — |
| 33 | organization_id | uuid | YES | — |
| 34 | location_id | uuid | YES | — |
| 35 | checklist | jsonb | NO | '{}'::jsonb |
| 36 | resource_assignments | jsonb | YES | — |

#### Table: tasks_assignments

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | event_id | uuid | NO | — |
| 3 | event_theme | text | NO | — |
| 4 | description | text | YES | — |
| 5 | assigned_to | uuid | YES | — |
| 7 | status | task_status | YES | 'not_started'::task_status |
| 8 | priority | task_priority | NO | 'medium'::task_priority |
| 9 | estimated_hours | numeric | YES | — |
| 10 | actual_hours | numeric | YES | — |
| 11 | due_date | timestamp with time zone | YES | — |
| 12 | created_by | uuid | NO | — |
| 13 | created_at | timestamp with time zone | NO | now() |
| 14 | updated_at | timestamp with time zone | NO | now() |
| 19 | task_name | text | YES | — |

#### Table: tasks_dependencies

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | task_id | uuid | NO | — |
| 3 | depends_on_task_id | uuid | NO | — |
| 4 | created_at | timestamp with time zone | NO | now() |

#### Table: tasks_old

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | event_id | uuid | YES | — |
| 3 | title | text | NO | — |
| 4 | description | text | YES | — |
| 5 | assigned_to | uuid | YES | — |
| 7 | status | task_status | YES | 'not_started'::task_status |
| 8 | priority | task_priority | NO | 'medium'::task_priority |
| 9 | estimated_hours | numeric | YES | — |
| 10 | actual_hours | numeric | YES | — |
| 11 | due_date | timestamp with time zone | YES | — |
| 12 | created_by | uuid | NO | — |
| 13 | created_at | timestamp with time zone | NO | now() |
| 14 | updated_at | timestamp with time zone | NO | now() |
| 15 | assigned_venue_role | text | YES | — |
| 16 | assigned_supplier_vendor_role | text | YES | — |
| 17 | assigned_service_vendor_role | text | YES | — |
| 18 | assined_vendor_role | text | YES | — |
| 19 | start_time | time without time zone | YES | — |
| 20 | end_time | time without time zone | YES | — |
| 21 | start_date | date | YES | — |
| 22 | end_date | date | YES | — |
| 23 | archived | boolean | NO | false |
| 24 | category | text | YES | — |
| 25 | assigned_coordinator_name | text | YES | — |
| 26 | resource_assignments | jsonb | YES | '{}'::jsonb |
| 27 | change_request_id | uuid | YES | — |
| 28 | checklist | jsonb | YES | '[]'::jsonb |
| 29 | assignment_type | text | YES | — |
| 30 | assign_hospitality | uuid | YES | — |
| 31 | assign_transportation | uuid | YES | — |
| 32 | assigned_bookings_role | text | YES | — |
| 33 | assigned_service_rental_role | text | YES | — |
| 34 | assigned_hospitality_role | text | YES | — |
| 35 | assigned_entertainment_role | text | YES | — |
| 36 | assigned_transportation_role | text | YES | — |
| 37 | assigned_external_vendor_role | text | YES | — |
| 38 | assigned_to_display_name | text | YES | — |

#### Table: team_assignments

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | integer | NO | nextval('team_assignments_id_seq1'::regclass) |
| 2 | team_id | uuid | NO | — |
| 3 | user_id | uuid | NO | — |
| 4 | team_admin | boolean | NO | false |
| 5 | is_collaborator | boolean | NO | false |
| 6 | is_viewer | boolean | NO | false |
| 7 | created_at | timestamp with time zone | NO | now() |
| 8 | updated_at | timestamp with time zone | NO | now() |

#### Table: teams

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | name | text | NO | — |
| 3 | created_at | timestamp with time zone | NO | now() |
| 4 | updated_at | timestamp with time zone | NO | now() |

#### Table: template_tasks

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | template_id | uuid | NO | — |
| 3 | user_id | uuid | NO | — |
| 4 | title | text | NO | — |
| 5 | description | text | YES | — |
| 6 | created_at | timestamp with time zone | NO | now() |
| 7 | updated_at | timestamp with time zone | NO | now() |

#### Table: templates

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | user_id | uuid | NO | — |
| 3 | name | text | NO | — |
| 4 | description | text | YES | — |
| 5 | created_at | timestamp with time zone | NO | now() |
| 6 | updated_at | timestamp with time zone | NO | now() |

#### Table: transportation_profiles

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | business_name | text | NO | — |
| 3 | contact_name | text | YES | — |
| 4 | email | text | YES | — |
| 5 | phone_number | text | YES | — |
| 6 | city | text | YES | — |
| 7 | state | text | YES | — |
| 8 | zip | text | YES | — |
| 9 | capacity | integer | YES | — |
| 10 | transp_type_id | integer | YES | — |
| 11 | created_at | timestamp with time zone | NO | now() |
| 12 | updated_at | timestamp with time zone | NO | now() |
| 13 | seating_capacity | integer | YES | — |
| 14 | price | numeric | YES | — |
| 15 | description | text | YES | — |
| 16 | amenities | _text | YES | — |
| 17 | transpo_images | text | YES | — |
| 18 | amenity_ids | _int4 | YES | — |
| 19 | amenities_notes | text | YES | — |
| 20 | has_wifi | boolean | YES | false |
| 21 | has_ac | boolean | YES | false |
| 22 | has_wheelchair_access | boolean | YES | false |
| 23 | has_luggage_storage | boolean | YES | false |
| 24 | has_gps_tracking | boolean | YES | false |
| 25 | has_entertainment_system | boolean | YES | false |
| 26 | has_refreshments | boolean | YES | false |
| 27 | is_pet_friendly | boolean | YES | false |
| 28 | is_child_seat_available | boolean | YES | false |
| 29 | passenger_capacity | integer | YES | — |
| 30 | checklist | jsonb | YES | '[]'::jsonb |
| 31 | checklist_completed_count | integer | YES | 0 |

#### Table: transportation_types

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | integer | NO | nextval('transportation_types_id_seq'::regclass) |
| 2 | name | text | NO | — |
| 3 | created_at | timestamp with time zone | NO | now() |
| 4 | updated_at | timestamp with time zone | NO | now() |

#### Table: transportations

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | business_name | text | NO | — |
| 3 | contact_name | text | YES | — |
| 4 | email | text | YES | — |
| 5 | phone_number | text | YES | — |
| 6 | city | text | YES | — |
| 7 | state | text | YES | — |
| 8 | zip | text | YES | — |
| 9 | capacity | integer | YES | — |
| 10 | transp_type_id | integer | YES | — |
| 11 | created_at | timestamp with time zone | NO | now() |
| 12 | updated_at | timestamp with time zone | NO | now() |
| 13 | seating_capacity | integer | YES | — |
| 14 | price | numeric | YES | — |
| 15 | description | text | YES | — |
| 16 | special_accommodations | _text | YES | — |
| 17 | profile_url | text | YES | — |
| 18 | custom_type | text | YES | — |

#### Table: uploads

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | user_id | uuid | NO | — |
| 3 | file_path | text | NO | — |
| 4 | media_type | text | YES | — |
| 5 | event_id | uuid | YES | — |
| 6 | created_at | timestamp with time zone | NO | now() |

#### Table: user_roles

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | user_id | uuid | NO | — |
| 3 | role | app_role | NO | — |
| 4 | created_at | timestamp with time zone | NO | now() |
| 5 | permission_level | permission_level | YES | — |
| 6 | event_id | uuid | YES | — |

#### Table: vendor

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | business_name | text | NO | — |
| 3 | contact_name | text | YES | — |
| 4 | email | text | YES | — |
| 5 | phone_number | text | YES | — |
| 6 | city | text | YES | — |
| 7 | state | text | YES | — |
| 8 | zip | text | YES | — |
| 9 | vendor_sup_type_id | integer | YES | — |
| 10 | created_at | timestamp with time zone | NO | now() |
| 11 | updated_at | timestamp with time zone | NO | now() |
| 12 | price | numeric | YES | — |
| 13 | description | text | YES | — |
| 14 | linkedin_url | text | YES | — |
| 15 | instagram_url | text | YES | — |
| 16 | rating | numeric | YES | 0 |
| 17 | checklist | jsonb | YES | '[]'::jsonb |
| 18 | checklist_completed_count | integer | YES | 0 |
| 19 | custom_type | text | YES | — |

#### Table: vendor_rental_types

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | integer | NO | nextval('vendor_rental_types_id_seq'::regclass) |
| 2 | name | text | NO | — |
| 3 | created_at | timestamp with time zone | NO | now() |
| 4 | updated_at | timestamp with time zone | NO | now() |

#### Table: vendor_supplier_types

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | integer | NO | nextval('vendor_supplier_types_id_seq'::regclass) |
| 2 | name | text | NO | — |
| 3 | created_at | timestamp with time zone | NO | now() |
| 4 | updated_at | timestamp with time zone | NO | now() |

#### Table: venue_types

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | integer | NO | nextval('venue_types_id_seq'::regclass) |
| 2 | name | text | NO | — |
| 3 | created_at | timestamp with time zone | NO | now() |
| 4 | updated_at | timestamp with time zone | NO | now() |

#### Table: venues

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | business_name | text | NO | — |
| 3 | contact_name | text | YES | — |
| 4 | email | text | YES | — |
| 5 | phone_number | text | YES | — |
| 6 | city | text | YES | — |
| 7 | state | text | YES | — |
| 8 | zip | text | YES | — |
| 9 | capacity | integer | YES | — |
| 10 | venue_type_id | integer | YES | — |
| 11 | created_at | timestamp with time zone | NO | now() |
| 12 | updated_at | timestamp with time zone | NO | now() |
| 14 | user_id | uuid | YES | — |
| 15 | cost | numeric | YES | — |
| 16 | venue_images | text | YES | — |
| 17 | amenities | _text | NO | '{}'::text[] |
| 18 | linkedin_url | text | YES | — |
| 19 | instagram_url | text | YES | — |
| 20 | rating | numeric | YES | 0 |
| 21 | venue_directory_id | bigint | YES | — |
| 22 | amenity_ids | _int4 | YES | — |
| 23 | amenities_notes | text | YES | — |
| 24 | has_parking | boolean | YES | false |
| 25 | has_wifi | boolean | YES | false |
| 26 | has_catering | boolean | YES | false |
| 27 | has_av_equipment | boolean | YES | false |
| 28 | has_accessibility | boolean | YES | false |
| 29 | has_outdoor_space | boolean | YES | false |
| 30 | checklist | jsonb | YES | '[]'::jsonb |
| 31 | checklist_completed_count | integer | YES | 0 |
| 32 | price | numeric | YES | — |
| 34 | custom_type | text | YES | — |

#### Table: workflow_types

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | integer | NO | nextval('workflow_types_id_seq'::regclass) |
| 2 | name | text | NO | — |
| 3 | description | text | YES | — |
| 4 | tags | _text | YES | — |
| 5 | created_at | timestamp with time zone | NO | now() |
| 6 | updated_at | timestamp with time zone | NO | now() |

#### Table: workflows

| Position | Attribute | Data Type | Nullable | Default Value |
| --- | --- | --- | --- | --- |
| 1 | id | uuid | NO | gen_random_uuid() |
| 2 | workflow_type_id | integer | YES | — |
| 3 | user_id | uuid | NO | — |
| 4 | created_at | timestamp with time zone | NO | now() |
| 5 | updated_at | timestamp with time zone | NO | now() |
| 6 | theme_id | integer | YES | — |
| 7 | hospitality_id | uuid | YES | — |
| 8 | venue_id | uuid | YES | — |
| 9 | supplier_id | uuid | YES | — |
| 10 | serv_vendor_id | uuid | YES | — |
| 11 | service_rental_buy_id | uuid | YES | — |
| 12 | event_id | uuid | NO | — |
| 13 | bookings_id | uuid | YES | — |
| 14 | entertainment_id | uuid | YES | — |
| 15 | transportation_id | uuid | YES | — |
| 16 | vendor_id | uuid | YES | — |
| 17 | external_vendor_id | uuid | YES | — |

