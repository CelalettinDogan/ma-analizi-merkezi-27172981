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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bet_slip_items: {
        Row: {
          away_score: number | null
          away_team: string
          confidence: string
          created_at: string
          home_score: number | null
          home_team: string
          id: string
          is_correct: boolean | null
          league: string
          match_date: string
          odds: number | null
          prediction_type: string
          prediction_value: string
          slip_id: string
        }
        Insert: {
          away_score?: number | null
          away_team: string
          confidence: string
          created_at?: string
          home_score?: number | null
          home_team: string
          id?: string
          is_correct?: boolean | null
          league: string
          match_date: string
          odds?: number | null
          prediction_type: string
          prediction_value: string
          slip_id: string
        }
        Update: {
          away_score?: number | null
          away_team?: string
          confidence?: string
          created_at?: string
          home_score?: number | null
          home_team?: string
          id?: string
          is_correct?: boolean | null
          league?: string
          match_date?: string
          odds?: number | null
          prediction_type?: string
          prediction_value?: string
          slip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bet_slip_items_slip_id_fkey"
            columns: ["slip_id"]
            isOneToOne: false
            referencedRelation: "bet_slips"
            referencedColumns: ["id"]
          },
        ]
      }
      bet_slips: {
        Row: {
          created_at: string
          id: string
          is_verified: boolean
          name: string | null
          potential_win: number | null
          stake: number | null
          status: string
          total_odds: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_verified?: boolean
          name?: string | null
          potential_win?: number | null
          stake?: number | null
          status?: string
          total_odds?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_verified?: boolean
          name?: string | null
          potential_win?: number | null
          stake?: number | null
          status?: string
          total_odds?: number | null
        }
        Relationships: []
      }
      predictions: {
        Row: {
          actual_result: string | null
          away_score: number | null
          away_team: string
          confidence: string
          created_at: string
          home_score: number | null
          home_team: string
          id: string
          is_correct: boolean | null
          league: string
          match_date: string
          prediction_type: string
          prediction_value: string
          reasoning: string | null
          verified_at: string | null
        }
        Insert: {
          actual_result?: string | null
          away_score?: number | null
          away_team: string
          confidence: string
          created_at?: string
          home_score?: number | null
          home_team: string
          id?: string
          is_correct?: boolean | null
          league: string
          match_date: string
          prediction_type: string
          prediction_value: string
          reasoning?: string | null
          verified_at?: string | null
        }
        Update: {
          actual_result?: string | null
          away_score?: number | null
          away_team?: string
          confidence?: string
          created_at?: string
          home_score?: number | null
          home_team?: string
          id?: string
          is_correct?: boolean | null
          league?: string
          match_date?: string
          prediction_type?: string
          prediction_value?: string
          reasoning?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      overall_stats: {
        Row: {
          accuracy_percentage: number | null
          correct_predictions: number | null
          high_confidence_correct: number | null
          high_confidence_total: number | null
          incorrect_predictions: number | null
          pending_predictions: number | null
          total_predictions: number | null
        }
        Relationships: []
      }
      prediction_stats: {
        Row: {
          accuracy_percentage: number | null
          correct_predictions: number | null
          incorrect_predictions: number | null
          pending_predictions: number | null
          prediction_type: string | null
          total_predictions: number | null
        }
        Relationships: []
      }
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
