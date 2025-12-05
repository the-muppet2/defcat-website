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
      bookmark_sync_logs: {
        Row: {
          bookmark_id: string
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          inserted_decks: number | null
          started_at: string | null
          status: string
          total_decks: number | null
          unchanged_decks: number | null
          updated_decks: number | null
        }
        Insert: {
          bookmark_id: string
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          inserted_decks?: number | null
          started_at?: string | null
          status: string
          total_decks?: number | null
          unchanged_decks?: number | null
          updated_decks?: number | null
        }
        Update: {
          bookmark_id?: string
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          inserted_decks?: number | null
          started_at?: string | null
          status?: string
          total_decks?: number | null
          unchanged_decks?: number | null
          updated_decks?: number | null
        }
        Relationships: []
      }
      cards: {
        Row: {
          cache_attempts: number | null
          cache_error: string | null
          cached_back_image_url: string | null
          cached_image_url: string | null
          cmc: number | null
          collector_number: string | null
          color_identity: string[] | null
          colors: string[] | null
          created_at: string | null
          id: string
          image_url: string | null
          last_cache_attempt_at: string | null
          layout: string | null
          mana_cost: string | null
          name: string
          oracle_text: string | null
          prices: Json | null
          rarity: string | null
          scryfall_id: string | null
          set_code: string | null
          set_name: string | null
          type_line: string | null
        }
        Insert: {
          cache_attempts?: number | null
          cache_error?: string | null
          cached_back_image_url?: string | null
          cached_image_url?: string | null
          cmc?: number | null
          collector_number?: string | null
          color_identity?: string[] | null
          colors?: string[] | null
          created_at?: string | null
          id: string
          image_url?: string | null
          last_cache_attempt_at?: string | null
          layout?: string | null
          mana_cost?: string | null
          name: string
          oracle_text?: string | null
          prices?: Json | null
          rarity?: string | null
          scryfall_id?: string | null
          set_code?: string | null
          set_name?: string | null
          type_line?: string | null
        }
        Update: {
          cache_attempts?: number | null
          cache_error?: string | null
          cached_back_image_url?: string | null
          cached_image_url?: string | null
          cmc?: number | null
          collector_number?: string | null
          color_identity?: string[] | null
          colors?: string[] | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          last_cache_attempt_at?: string | null
          layout?: string | null
          mana_cost?: string | null
          name?: string
          oracle_text?: string | null
          prices?: Json | null
          rarity?: string | null
          scryfall_id?: string | null
          set_code?: string | null
          set_name?: string | null
          type_line?: string | null
        }
        Relationships: []
      }
      credit_grant_history: {
        Row: {
          amount: number
          created_at: string | null
          credit_type: string
          id: string
          notes: string | null
          tier: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          credit_type: string
          id?: string
          notes?: string | null
          tier?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          credit_type?: string
          id?: string
          notes?: string | null
          tier?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credit_types: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id: string
          is_active?: boolean | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      deck_submissions: {
        Row: {
          bracket: string | null
          budget: string | null
          coffee_preference: string | null
          color_preference: string | null
          commander: string | null
          created_at: string | null
          deck_list_url: string | null
          discord_username: string | null
          email: string
          id: string
          ideal_date: string | null
          moxfield_username: string | null
          mystery_deck: boolean
          notes: string | null
          patreon_id: string | null
          patreon_tier: string | null
          patreon_username: string
          status: string | null
          submission_month: string | null
          submission_type: Database["public"]["Enums"]["submission_type"] | null
          theme: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bracket?: string | null
          budget?: string | null
          coffee_preference?: string | null
          color_preference?: string | null
          commander?: string | null
          created_at?: string | null
          deck_list_url?: string | null
          discord_username?: string | null
          email: string
          id?: string
          ideal_date?: string | null
          moxfield_username?: string | null
          mystery_deck?: boolean
          notes?: string | null
          patreon_id?: string | null
          patreon_tier?: string | null
          patreon_username: string
          status?: string | null
          submission_month?: string | null
          submission_type?:
            | Database["public"]["Enums"]["submission_type"]
            | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bracket?: string | null
          budget?: string | null
          coffee_preference?: string | null
          color_preference?: string | null
          commander?: string | null
          created_at?: string | null
          deck_list_url?: string | null
          discord_username?: string | null
          email?: string
          id?: string
          ideal_date?: string | null
          moxfield_username?: string | null
          mystery_deck?: boolean
          notes?: string | null
          patreon_id?: string | null
          patreon_tier?: string | null
          patreon_username?: string
          status?: string | null
          submission_month?: string | null
          submission_type?:
            | Database["public"]["Enums"]["submission_type"]
            | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      decklist_cards: {
        Row: {
          board: string
          card_data: Json | null
          card_id: string | null
          card_name: string
          fetched_at: string | null
          id: number
          moxfield_deck_id: string
          quantity: number | null
        }
        Insert: {
          board: string
          card_data?: Json | null
          card_id?: string | null
          card_name: string
          fetched_at?: string | null
          id?: number
          moxfield_deck_id: string
          quantity?: number | null
        }
        Update: {
          board?: string
          card_data?: Json | null
          card_id?: string | null
          card_name?: string
          fetched_at?: string | null
          id?: number
          moxfield_deck_id?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "decklist_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decklist_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards_with_dashes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decklist_cards_moxfield_deck_id_fkey"
            columns: ["moxfield_deck_id"]
            isOneToOne: false
            referencedRelation: "deck_list_view"
            referencedColumns: ["moxfield_id"]
          },
          {
            foreignKeyName: "decklist_cards_moxfield_deck_id_fkey"
            columns: ["moxfield_deck_id"]
            isOneToOne: false
            referencedRelation: "decks_enhanced"
            referencedColumns: ["moxfield_id"]
          },
          {
            foreignKeyName: "decklist_cards_moxfield_deck_id_fkey"
            columns: ["moxfield_deck_id"]
            isOneToOne: false
            referencedRelation: "decks_parsed"
            referencedColumns: ["moxfield_id"]
          },
          {
            foreignKeyName: "decklist_cards_moxfield_deck_id_fkey"
            columns: ["moxfield_deck_id"]
            isOneToOne: false
            referencedRelation: "mox_decks"
            referencedColumns: ["moxfield_id"]
          },
          {
            foreignKeyName: "decklist_cards_moxfield_deck_id_fkey"
            columns: ["moxfield_deck_id"]
            isOneToOne: false
            referencedRelation: "moxfield_decks"
            referencedColumns: ["moxfield_id"]
          },
        ]
      }
      doc_chunks: {
        Row: {
          category: string
          content: string
          created_at: string | null
          embedding: string | null
          filename: string
          heading: string | null
          id: string
          token_count: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          embedding?: string | null
          filename: string
          heading?: string | null
          id?: string
          token_count?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          embedding?: string | null
          filename?: string
          heading?: string | null
          id?: string
          token_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      edgecases: {
        Row: {
          added_by: string | null
          date_added: string | null
          id: number
          preserve_as: string
          string_to_preserve: string
        }
        Insert: {
          added_by?: string | null
          date_added?: string | null
          id?: number
          preserve_as: string
          string_to_preserve: string
        }
        Update: {
          added_by?: string | null
          date_added?: string | null
          id?: number
          preserve_as?: string
          string_to_preserve?: string
        }
        Relationships: []
      }
      moxfield_decks: {
        Row: {
          admin_description: string | null
          admin_title: string | null
          author_name: string | null
          author_username: string | null
          cards_fetched_at: string | null
          commanders_count: number | null
          comment_count: number | null
          created_at: string | null
          fetched_at: string | null
          format: string | null
          id: number
          is_legal: boolean | null
          last_updated_at: string | null
          like_count: number | null
          mainboard_count: number | null
          moxfield_id: string
          name: string
          owner_profile_id: string | null
          public_id: string | null
          public_url: string | null
          raw_data: Json | null
          sideboard_count: number | null
          user_description: string | null
          user_hidden: boolean | null
          user_title: string | null
          view_count: number | null
          visibility: string | null
        }
        Insert: {
          admin_description?: string | null
          admin_title?: string | null
          author_name?: string | null
          author_username?: string | null
          cards_fetched_at?: string | null
          commanders_count?: number | null
          comment_count?: number | null
          created_at?: string | null
          fetched_at?: string | null
          format?: string | null
          id?: number
          is_legal?: boolean | null
          last_updated_at?: string | null
          like_count?: number | null
          mainboard_count?: number | null
          moxfield_id: string
          name: string
          owner_profile_id?: string | null
          public_id?: string | null
          public_url?: string | null
          raw_data?: Json | null
          sideboard_count?: number | null
          user_description?: string | null
          user_hidden?: boolean | null
          user_title?: string | null
          view_count?: number | null
          visibility?: string | null
        }
        Update: {
          admin_description?: string | null
          admin_title?: string | null
          author_name?: string | null
          author_username?: string | null
          cards_fetched_at?: string | null
          commanders_count?: number | null
          comment_count?: number | null
          created_at?: string | null
          fetched_at?: string | null
          format?: string | null
          id?: number
          is_legal?: boolean | null
          last_updated_at?: string | null
          like_count?: number | null
          mainboard_count?: number | null
          moxfield_id?: string
          name?: string
          owner_profile_id?: string | null
          public_id?: string | null
          public_url?: string | null
          raw_data?: Json | null
          sideboard_count?: number | null
          user_description?: string | null
          user_hidden?: boolean | null
          user_title?: string | null
          view_count?: number | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moxfield_decks_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          key: string
          link: string
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          key: string
          link: string
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          key?: string
          link?: string
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          discord_id: string | null
          email: string
          id: string
          moxfield_username: string | null
          patreon_id: string | null
          patreon_tier: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discord_id?: string | null
          email: string
          id: string
          moxfield_username?: string | null
          patreon_id?: string | null
          patreon_tier?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discord_id?: string | null
          email?: string
          id?: string
          moxfield_username?: string | null
          patreon_id?: string | null
          patreon_tier?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_config: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_sensitive: boolean | null
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      tier_benefits: {
        Row: {
          amount: number
          credit_type_id: string
          tier_id: string
        }
        Insert: {
          amount?: number
          credit_type_id: string
          tier_id: string
        }
        Update: {
          amount?: number
          credit_type_id?: string
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tier_benefits_credit_type_id_fkey"
            columns: ["credit_type_id"]
            isOneToOne: false
            referencedRelation: "credit_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_benefits_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_credit_config: {
        Row: {
          created_at: string | null
          deck_credits: number | null
          is_active: boolean | null
          roast_credits: number | null
          tier: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deck_credits?: number | null
          is_active?: boolean | null
          roast_credits?: number | null
          tier: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deck_credits?: number | null
          is_active?: boolean | null
          roast_credits?: number | null
          tier?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tiers: {
        Row: {
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          display_name: string
          id: string
          is_active?: boolean | null
          sort_order: number
        }
        Update: {
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number
        }
        Relationships: []
      }
      update_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_details: Json | null
          error_message: string | null
          failed_count: number | null
          id: string
          metadata: Json | null
          operation_type: string
          processed_count: number | null
          skipped_count: number | null
          started_at: string
          status: string
          success_count: number | null
          total_items: number | null
          triggered_by: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          failed_count?: number | null
          id?: string
          metadata?: Json | null
          operation_type: string
          processed_count?: number | null
          skipped_count?: number | null
          started_at?: string
          status: string
          success_count?: number | null
          total_items?: number | null
          triggered_by?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          failed_count?: number | null
          id?: string
          metadata?: Json | null
          operation_type?: string
          processed_count?: number | null
          skipped_count?: number | null
          started_at?: string
          status?: string
          success_count?: number | null
          total_items?: number | null
          triggered_by?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string | null
          credits: Json
          last_granted: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits?: Json
          last_granted?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits?: Json
          last_granted?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      cards_with_dashes: {
        Row: {
          id: string | null
          name: string | null
          rarity: string | null
          type_line: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          rarity?: string | null
          type_line?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          rarity?: string | null
          type_line?: string | null
        }
        Relationships: []
      }
      deck_list_view: {
        Row: {
          author_username: string | null
          color_string: string | null
          created_at: string | null
          format: string | null
          id: number | null
          last_updated_at: string | null
          like_count: number | null
          mainboard_count: number | null
          moxfield_id: string | null
          name: string | null
          primary_commander: string | null
          public_id: string | null
          public_url: string | null
          total_price: number | null
          view_count: number | null
        }
        Insert: {
          author_username?: string | null
          color_string?: never
          created_at?: string | null
          format?: string | null
          id?: number | null
          last_updated_at?: string | null
          like_count?: number | null
          mainboard_count?: number | null
          moxfield_id?: string | null
          name?: string | null
          primary_commander?: never
          public_id?: string | null
          public_url?: string | null
          total_price?: never
          view_count?: number | null
        }
        Update: {
          author_username?: string | null
          color_string?: never
          created_at?: string | null
          format?: string | null
          id?: number | null
          last_updated_at?: string | null
          like_count?: number | null
          mainboard_count?: number | null
          moxfield_id?: string | null
          name?: string | null
          primary_commander?: never
          public_id?: string | null
          public_url?: string | null
          total_price?: never
          view_count?: number | null
        }
        Relationships: []
      }
      decks_enhanced: {
        Row: {
          author_display_name: string | null
          auto_bracket: number | null
          bookmark_count: number | null
          bracket: number | null
          cards_fetched_at: string | null
          color_identity: Json | null
          color_string: string | null
          commanders: Json | null
          commanders_count: number | null
          comment_count: number | null
          created_at: string | null
          deck_title: string | null
          description: string | null
          event_date: string | null
          fetched_at: string | null
          format: string | null
          has_primer: boolean | null
          id: number | null
          is_legal: boolean | null
          is_shared: boolean | null
          last_updated_at: string | null
          like_count: number | null
          main_card_id: string | null
          mainboard_count: number | null
          moxfield_id: string | null
          moxfield_url: string | null
          name: string | null
          player_username: string | null
          public_id: string | null
          public_url: string | null
          sideboard_count: number | null
          total_cards: number | null
          updated_at: string | null
          view_count: number | null
          visibility: string | null
        }
        Relationships: []
      }
      decks_parsed: {
        Row: {
          author_name: string | null
          author_username: string | null
          cards_fetched_at: string | null
          commanders_count: number | null
          comment_count: number | null
          created_at: string | null
          deck_title: string | null
          event_date: string | null
          event_date_std: string | null
          fetched_at: string | null
          format: string | null
          id: number | null
          is_legal: boolean | null
          last_updated_at: string | null
          like_count: number | null
          mainboard_count: number | null
          moxfield_id: string | null
          original_name: string | null
          player_username: string | null
          public_id: string | null
          public_url: string | null
          sideboard_count: number | null
          view_count: number | null
          visibility: string | null
        }
        Relationships: []
      }
      mox_decks: {
        Row: {
          author_name: string | null
          author_username: string | null
          cards_fetched_at: string | null
          commanders_count: number | null
          comment_count: number | null
          created_at: string | null
          deck_title: string | null
          event_date: string | null
          event_date_std: string | null
          fetched_at: string | null
          format: string | null
          id: number | null
          is_legal: boolean | null
          last_updated_at: string | null
          like_count: number | null
          mainboard_count: number | null
          moxfield_id: string | null
          original_name: string | null
          player_username: string | null
          public_id: string | null
          public_url: string | null
          sideboard_count: number | null
          view_count: number | null
          visibility: string | null
        }
        Relationships: []
      }
      tier_benefit_matrix: {
        Row: {
          benefits: Json | null
          sort_order: number | null
          tier: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_credit_type: {
        Args: { p_description?: string; p_display_name: string; p_id: string }
        Returns: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
        }
        SetofOptions: {
          from: "*"
          to: "credit_types"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      add_tier: {
        Args: { p_display_name: string; p_id: string; p_sort_order?: number }
        Returns: {
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          sort_order: number
        }
        SetofOptions: {
          from: "*"
          to: "tiers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      consume_credit: {
        Args: { p_amount?: number; p_credit_type: string; p_user_id: string }
        Returns: number
      }
      distribute_monthly_credits: {
        Args: never
        Returns: {
          credits_granted: Json
          user_id: string
        }[]
      }
      exec_sql: { Args: { query: string }; Returns: Json }
      get_tier_monthly_credits: {
        Args: { tier: string }
        Returns: {
          deck_credits: number
          roast_credits: number
        }[]
      }
      hybrid_search: {
        Args: {
          match_count?: number
          query_embedding: string
          query_text: string
        }
        Returns: {
          content: string
          filename: string
          heading: string
          id: string
          score: number
        }[]
      }
      import_deck_from_jsonb: {
        Args: { deck_jsonb: Json; deck_moxfield_id: string }
        Returns: string
      }
      increment_cache_attempts: {
        Args: { attempt_time: string; card_id: string; error_msg: string }
        Returns: undefined
      }
      parse_date: { Args: { p_text: string }; Returns: string }
      parse_date_from_string: { Args: { p_text: string }; Returns: string }
      parse_date_string: { Args: { p_text: string }; Returns: string }
      parse_deck: {
        Args: { p_name: string }
        Returns: {
          drop_date: string
          parsed_deck: string
          parsed_user: string
        }[]
      }
      parse_deck_name: {
        Args: { deck_name: string }
        Returns: {
          deck_title: string
          parsed_date: string
          username: string
        }[]
      }
      parse_deck_name_final: {
        Args: { p_name: string }
        Returns: {
          drop_date: string
          parsed_deck: string
          parsed_user: string
        }[]
      }
      parse_deck_name_final2: {
        Args: { p_name: string }
        Returns: {
          drop_date: string
          parsed_deck: string
          parsed_user: string
        }[]
      }
      parse_decks: {
        Args: { deck_name: string }
        Returns: {
          deck_title: string
          parsed_date: string
          standardized_date: string
          username: string
        }[]
      }
      parse_title: {
        Args: { p_name: string }
        Returns: {
          drop_date: string
          parsed_deck: string
          parsed_user: string
        }[]
      }
      parse7: {
        Args: { deck_name: string }
        Returns: {
          deck_title: string
          parsed_date: string
          username: string
        }[]
      }
      parse8: {
        Args: { deck_name: string }
        Returns: {
          deck_title: string
          parsed_date: string
          standardized_date: string
          username: string
        }[]
      }
      parse9: {
        Args: { deck_name: string }
        Returns: {
          deck_title: string
          parsed_date: string
          standardized_date: string
          username: string
        }[]
      }
      refresh_user_credits: {
        Args: { p_patreon_tier: string; p_user_id: string }
        Returns: undefined
      }
      refund_credit: {
        Args: {
          p_submission_month: string
          p_submission_type: Database["public"]["Enums"]["submission_type"]
          p_user_id: string
        }
        Returns: boolean
      }
      search_docs: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          category: string
          content: string
          filename: string
          heading: string
          id: string
          similarity: number
        }[]
      }
      set_tier_benefit: {
        Args: { p_amount: number; p_credit_type_id: string; p_tier_id: string }
        Returns: {
          amount: number
          credit_type_id: string
          tier_id: string
        }
        SetofOptions: {
          from: "*"
          to: "tier_benefits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      use_credit: {
        Args: {
          p_submission_type: Database["public"]["Enums"]["submission_type"]
          p_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      patreon_tier:
        | "Citizen"
        | "Knight"
        | "Emissary"
        | "Duke"
        | "Wizard"
        | "ArchMage"
      submission_type: "deck" | "roast"
      user_role: "user" | "member" | "moderator" | "administrator" | "developer"
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
      patreon_tier: [
        "Citizen",
        "Knight",
        "Emissary",
        "Duke",
        "Wizard",
        "ArchMage",
      ],
      submission_type: ["deck", "roast"],
      user_role: ["user", "member", "moderator", "administrator", "developer"],
    },
  },
} as const
