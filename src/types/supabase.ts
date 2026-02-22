/**
 * Supabase Database Types (Sprint 9)
 *
 * TypeScript types matching the Supabase PostgreSQL schema.
 * Generated from the V1.2 household-scoped data model defined
 * in the Implementation Plan Phase 12.
 *
 * @module supabase types
 */

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          invite_code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string | null;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          household_id: string;
          display_name: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          household_id: string;
          display_name?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          display_name?: string | null;
          email?: string | null;
          created_at?: string;
        };
      };
      recipes: {
        Row: {
          id: string;
          household_id: string;
          title: string;
          ingredients: string[];
          instructions: string[];
          source_url: string | null;
          image_url: string | null;
          last_cooked_date: string | null;
          tags: string[];
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          title: string;
          ingredients?: string[];
          instructions?: string[];
          source_url?: string | null;
          image_url?: string | null;
          last_cooked_date?: string | null;
          tags?: string[];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          title?: string;
          ingredients?: string[];
          instructions?: string[];
          source_url?: string | null;
          image_url?: string | null;
          last_cooked_date?: string | null;
          tags?: string[];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      schedule_entries: {
        Row: {
          id: string;
          household_id: string;
          recipe_id: string | null;
          date: string;
          meal_type: 'lunch' | 'dinner';
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          recipe_id?: string | null;
          date: string;
          meal_type: 'lunch' | 'dinner';
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          recipe_id?: string | null;
          date?: string;
          meal_type?: 'lunch' | 'dinner';
          created_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          created_at?: string;
        };
      };
    };
    Functions: {
      create_household: {
        Args: { household_name: string; user_display_name: string };
        Returns: { household_id: string; invite_code: string };
      };
      join_household: {
        Args: { invite_code_input: string; user_display_name: string };
        Returns: { household_id: string; household_name: string };
      };
      generate_invite: {
        Args: { household_id_input: string };
        Returns: { invite_code: string };
      };
    };
  };
}

/**
 * Helper type aliases for cleaner code
 */
export type HouseholdRow = Database['public']['Tables']['households']['Row'];
export type UserRow = Database['public']['Tables']['users']['Row'];
export type RecipeRow = Database['public']['Tables']['recipes']['Row'];
export type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];
export type ScheduleEntryRow = Database['public']['Tables']['schedule_entries']['Row'];
export type ScheduleEntryInsert = Database['public']['Tables']['schedule_entries']['Insert'];
export type TagRow = Database['public']['Tables']['tags']['Row'];
