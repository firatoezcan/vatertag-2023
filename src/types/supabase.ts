export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      drink: {
        Row: {
          amount_ml: number;
          created_at: string | null;
          id: number;
          percentage: number;
          type: string;
          user_id: string;
        };
        Insert: {
          amount_ml: number;
          created_at?: string | null;
          id?: number;
          percentage: number;
          type: string;
          user_id: string;
        };
        Update: {
          amount_ml?: number;
          created_at?: string | null;
          id?: number;
          percentage?: number;
          type?: string;
          user_id?: string;
        };
      };
      user: {
        Row: {
          created_at: string | null;
          id: number;
          name: string;
          user_id: string;
          weight: number;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          name: string;
          user_id: string;
          weight: number;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          name?: string;
          user_id?: string;
          weight?: number;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
