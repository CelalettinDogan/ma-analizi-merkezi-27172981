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
      admin_activity_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_daily_analytics: {
        Row: {
          active_users_24h: number
          ai_accuracy: number
          created_at: string
          id: string
          league_stats: Json | null
          live_matches: number
          prediction_stats: Json | null
          premium_by_plan: Json | null
          premium_rate: number
          premium_revenue: number
          premium_users: number
          report_date: string
          today_analysis: number
          today_chats: number
          total_users: number
        }
        Insert: {
          active_users_24h?: number
          ai_accuracy?: number
          created_at?: string
          id?: string
          league_stats?: Json | null
          live_matches?: number
          prediction_stats?: Json | null
          premium_by_plan?: Json | null
          premium_rate?: number
          premium_revenue?: number
          premium_users?: number
          report_date: string
          today_analysis?: number
          today_chats?: number
          total_users?: number
        }
        Update: {
          active_users_24h?: number
          ai_accuracy?: number
          created_at?: string
          id?: string
          league_stats?: Json | null
          live_matches?: number
          prediction_stats?: Json | null
          premium_by_plan?: Json | null
          premium_rate?: number
          premium_revenue?: number
          premium_users?: number
          report_date?: string
          today_analysis?: number
          today_chats?: number
          total_users?: number
        }
        Relationships: []
      }
      ai_prompts: {
        Row: {
          id: string
          is_active: boolean | null
          name: string
          prompt: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          name: string
          prompt: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          name?: string
          prompt?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      analysis_usage: {
        Row: {
          id: string
          last_used_at: string | null
          usage_count: number
          usage_date: string
          user_id: string
        }
        Insert: {
          id?: string
          last_used_at?: string | null
          usage_count?: number
          usage_date?: string
          user_id: string
        }
        Update: {
          id?: string
          last_used_at?: string | null
          usage_count?: number
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
        }
        Relationships: []
      }
      cached_ai_predictions: {
        Row: {
          away_team: string
          created_at: string | null
          expires_at: string | null
          home_team: string
          id: string
          match_date: string
          match_key: string
          predictions: Json
        }
        Insert: {
          away_team: string
          created_at?: string | null
          expires_at?: string | null
          home_team: string
          id?: string
          match_date: string
          match_key: string
          predictions: Json
        }
        Update: {
          away_team?: string
          created_at?: string | null
          expires_at?: string | null
          home_team?: string
          id?: string
          match_date?: string
          match_key?: string
          predictions?: Json
        }
        Relationships: []
      }
      cached_live_matches: {
        Row: {
          away_score: number | null
          away_team_crest: string | null
          away_team_id: number | null
          away_team_name: string
          competition_code: string
          competition_name: string | null
          half_time_away: number | null
          half_time_home: number | null
          home_score: number | null
          home_team_crest: string | null
          home_team_id: number | null
          home_team_name: string
          id: number
          match_id: number
          matchday: number | null
          minute: string | null
          raw_data: Json | null
          status: string
          updated_at: string | null
          utc_date: string
        }
        Insert: {
          away_score?: number | null
          away_team_crest?: string | null
          away_team_id?: number | null
          away_team_name: string
          competition_code: string
          competition_name?: string | null
          half_time_away?: number | null
          half_time_home?: number | null
          home_score?: number | null
          home_team_crest?: string | null
          home_team_id?: number | null
          home_team_name: string
          id?: number
          match_id: number
          matchday?: number | null
          minute?: string | null
          raw_data?: Json | null
          status: string
          updated_at?: string | null
          utc_date: string
        }
        Update: {
          away_score?: number | null
          away_team_crest?: string | null
          away_team_id?: number | null
          away_team_name?: string
          competition_code?: string
          competition_name?: string | null
          half_time_away?: number | null
          half_time_home?: number | null
          home_score?: number | null
          home_team_crest?: string | null
          home_team_id?: number | null
          home_team_name?: string
          id?: number
          match_id?: number
          matchday?: number | null
          minute?: string | null
          raw_data?: Json | null
          status?: string
          updated_at?: string | null
          utc_date?: string
        }
        Relationships: []
      }
      cached_matches: {
        Row: {
          away_score: number | null
          away_team_crest: string | null
          away_team_id: number | null
          away_team_name: string
          competition_code: string
          competition_name: string | null
          home_score: number | null
          home_team_crest: string | null
          home_team_id: number | null
          home_team_name: string
          id: number
          match_id: number
          matchday: number | null
          raw_data: Json | null
          status: string
          updated_at: string | null
          utc_date: string
          winner: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_crest?: string | null
          away_team_id?: number | null
          away_team_name: string
          competition_code: string
          competition_name?: string | null
          home_score?: number | null
          home_team_crest?: string | null
          home_team_id?: number | null
          home_team_name: string
          id?: number
          match_id: number
          matchday?: number | null
          raw_data?: Json | null
          status: string
          updated_at?: string | null
          utc_date: string
          winner?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_crest?: string | null
          away_team_id?: number | null
          away_team_name?: string
          competition_code?: string
          competition_name?: string | null
          home_score?: number | null
          home_team_crest?: string | null
          home_team_id?: number | null
          home_team_name?: string
          id?: number
          match_id?: number
          matchday?: number | null
          raw_data?: Json | null
          status?: string
          updated_at?: string | null
          utc_date?: string
          winner?: string | null
        }
        Relationships: []
      }
      cached_standings: {
        Row: {
          competition_code: string
          competition_name: string | null
          draw: number | null
          form: string | null
          goal_difference: number | null
          goals_against: number | null
          goals_for: number | null
          id: number
          lost: number | null
          played_games: number | null
          points: number | null
          position: number
          team_crest: string | null
          team_id: number
          team_name: string
          team_short_name: string | null
          team_tla: string | null
          updated_at: string | null
          won: number | null
        }
        Insert: {
          competition_code: string
          competition_name?: string | null
          draw?: number | null
          form?: string | null
          goal_difference?: number | null
          goals_against?: number | null
          goals_for?: number | null
          id?: number
          lost?: number | null
          played_games?: number | null
          points?: number | null
          position: number
          team_crest?: string | null
          team_id: number
          team_name: string
          team_short_name?: string | null
          team_tla?: string | null
          updated_at?: string | null
          won?: number | null
        }
        Update: {
          competition_code?: string
          competition_name?: string | null
          draw?: number | null
          form?: string | null
          goal_difference?: number | null
          goals_against?: number | null
          goals_for?: number | null
          id?: number
          lost?: number | null
          played_games?: number | null
          points?: number | null
          position?: number
          team_crest?: string | null
          team_id?: number
          team_name?: string
          team_short_name?: string | null
          team_tla?: string | null
          updated_at?: string | null
          won?: number | null
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      chatbot_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          expires_at: string | null
          id: string
          response: string
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          response: string
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          response?: string
        }
        Relationships: []
      }
      chatbot_usage: {
        Row: {
          id: string
          last_used_at: string | null
          usage_count: number
          usage_date: string
          user_id: string
        }
        Insert: {
          id?: string
          last_used_at?: string | null
          usage_count?: number
          usage_date?: string
          user_id: string
        }
        Update: {
          id?: string
          last_used_at?: string | null
          usage_count?: number
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      league_averages: {
        Row: {
          avg_away_goals: number | null
          avg_goals_per_match: number | null
          avg_home_goals: number | null
          away_win_percentage: number | null
          btts_percentage: number | null
          clean_sheet_away_pct: number | null
          clean_sheet_home_pct: number | null
          draw_percentage: number | null
          home_win_percentage: number | null
          id: string
          league: string
          over_1_5_percentage: number | null
          over_2_5_percentage: number | null
          over_3_5_percentage: number | null
          season: string
          updated_at: string | null
        }
        Insert: {
          avg_away_goals?: number | null
          avg_goals_per_match?: number | null
          avg_home_goals?: number | null
          away_win_percentage?: number | null
          btts_percentage?: number | null
          clean_sheet_away_pct?: number | null
          clean_sheet_home_pct?: number | null
          draw_percentage?: number | null
          home_win_percentage?: number | null
          id?: string
          league: string
          over_1_5_percentage?: number | null
          over_2_5_percentage?: number | null
          over_3_5_percentage?: number | null
          season: string
          updated_at?: string | null
        }
        Update: {
          avg_away_goals?: number | null
          avg_goals_per_match?: number | null
          avg_home_goals?: number | null
          away_win_percentage?: number | null
          btts_percentage?: number | null
          clean_sheet_away_pct?: number | null
          clean_sheet_home_pct?: number | null
          draw_percentage?: number | null
          home_win_percentage?: number | null
          id?: string
          league?: string
          over_1_5_percentage?: number | null
          over_2_5_percentage?: number | null
          over_3_5_percentage?: number | null
          season?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      match_history: {
        Row: {
          away_attack_index: number | null
          away_away_form: string | null
          away_defense_index: number | null
          away_draws: number | null
          away_form: string | null
          away_form_score: number | null
          away_goal_avg: number | null
          away_goals_conceded: number | null
          away_goals_scored: number | null
          away_losses: number | null
          away_momentum: number | null
          away_points: number | null
          away_position: number | null
          away_rest_days: number | null
          away_score: number
          away_team: string
          away_wins: number | null
          both_teams_scored: boolean | null
          created_at: string
          first_half_away_score: number | null
          first_half_home_score: number | null
          first_half_result: string | null
          h2h_away_wins: number | null
          h2h_draws: number | null
          h2h_home_wins: number | null
          home_attack_index: number | null
          home_defense_index: number | null
          home_draws: number | null
          home_form: string | null
          home_form_score: number | null
          home_goal_avg: number | null
          home_goals_conceded: number | null
          home_goals_scored: number | null
          home_home_form: string | null
          home_losses: number | null
          home_momentum: number | null
          home_points: number | null
          home_position: number | null
          home_rest_days: number | null
          home_score: number
          home_team: string
          home_wins: number | null
          id: string
          is_derby: boolean | null
          league: string
          match_date: string
          match_importance: string | null
          match_result: string | null
          position_diff: number | null
          season_phase: string | null
          total_goals: number | null
        }
        Insert: {
          away_attack_index?: number | null
          away_away_form?: string | null
          away_defense_index?: number | null
          away_draws?: number | null
          away_form?: string | null
          away_form_score?: number | null
          away_goal_avg?: number | null
          away_goals_conceded?: number | null
          away_goals_scored?: number | null
          away_losses?: number | null
          away_momentum?: number | null
          away_points?: number | null
          away_position?: number | null
          away_rest_days?: number | null
          away_score: number
          away_team: string
          away_wins?: number | null
          both_teams_scored?: boolean | null
          created_at?: string
          first_half_away_score?: number | null
          first_half_home_score?: number | null
          first_half_result?: string | null
          h2h_away_wins?: number | null
          h2h_draws?: number | null
          h2h_home_wins?: number | null
          home_attack_index?: number | null
          home_defense_index?: number | null
          home_draws?: number | null
          home_form?: string | null
          home_form_score?: number | null
          home_goal_avg?: number | null
          home_goals_conceded?: number | null
          home_goals_scored?: number | null
          home_home_form?: string | null
          home_losses?: number | null
          home_momentum?: number | null
          home_points?: number | null
          home_position?: number | null
          home_rest_days?: number | null
          home_score: number
          home_team: string
          home_wins?: number | null
          id?: string
          is_derby?: boolean | null
          league: string
          match_date: string
          match_importance?: string | null
          match_result?: string | null
          position_diff?: number | null
          season_phase?: string | null
          total_goals?: number | null
        }
        Update: {
          away_attack_index?: number | null
          away_away_form?: string | null
          away_defense_index?: number | null
          away_draws?: number | null
          away_form?: string | null
          away_form_score?: number | null
          away_goal_avg?: number | null
          away_goals_conceded?: number | null
          away_goals_scored?: number | null
          away_losses?: number | null
          away_momentum?: number | null
          away_points?: number | null
          away_position?: number | null
          away_rest_days?: number | null
          away_score?: number
          away_team?: string
          away_wins?: number | null
          both_teams_scored?: boolean | null
          created_at?: string
          first_half_away_score?: number | null
          first_half_home_score?: number | null
          first_half_result?: string | null
          h2h_away_wins?: number | null
          h2h_draws?: number | null
          h2h_home_wins?: number | null
          home_attack_index?: number | null
          home_defense_index?: number | null
          home_draws?: number | null
          home_form?: string | null
          home_form_score?: number | null
          home_goal_avg?: number | null
          home_goals_conceded?: number | null
          home_goals_scored?: number | null
          home_home_form?: string | null
          home_losses?: number | null
          home_momentum?: number | null
          home_points?: number | null
          home_position?: number | null
          home_rest_days?: number | null
          home_score?: number
          home_team?: string
          home_wins?: number | null
          id?: string
          is_derby?: boolean | null
          league?: string
          match_date?: string
          match_importance?: string | null
          match_result?: string | null
          position_diff?: number | null
          season_phase?: string | null
          total_goals?: number | null
        }
        Relationships: []
      }
      match_tags: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          match_id: number
          tag: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          match_id: number
          tag: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          match_id?: number
          tag?: string
        }
        Relationships: []
      }
      ml_model_stats: {
        Row: {
          accuracy_percentage: number | null
          ai_accuracy: number | null
          ai_correct: number | null
          ai_total: number | null
          avg_confidence: number | null
          correct_predictions: number | null
          created_at: string
          high_confidence_accuracy: number | null
          id: string
          last_updated: string | null
          math_accuracy: number | null
          math_correct: number | null
          math_total: number | null
          prediction_type: string
          premium_accuracy: number | null
          premium_correct: number | null
          premium_total: number | null
          total_predictions: number | null
        }
        Insert: {
          accuracy_percentage?: number | null
          ai_accuracy?: number | null
          ai_correct?: number | null
          ai_total?: number | null
          avg_confidence?: number | null
          correct_predictions?: number | null
          created_at?: string
          high_confidence_accuracy?: number | null
          id?: string
          last_updated?: string | null
          math_accuracy?: number | null
          math_correct?: number | null
          math_total?: number | null
          prediction_type: string
          premium_accuracy?: number | null
          premium_correct?: number | null
          premium_total?: number | null
          total_predictions?: number | null
        }
        Update: {
          accuracy_percentage?: number | null
          ai_accuracy?: number | null
          ai_correct?: number | null
          ai_total?: number | null
          avg_confidence?: number | null
          correct_predictions?: number | null
          created_at?: string
          high_confidence_accuracy?: number | null
          id?: string
          last_updated?: string | null
          math_accuracy?: number | null
          math_correct?: number | null
          math_total?: number | null
          prediction_type?: string
          premium_accuracy?: number | null
          premium_correct?: number | null
          premium_total?: number | null
          total_predictions?: number | null
        }
        Relationships: []
      }
      prediction_features: {
        Row: {
          actual_result: string | null
          ai_confidence: number | null
          ai_prediction_value: string | null
          ai_reasoning: string | null
          ai_was_correct: boolean | null
          away_attack_index: number | null
          away_defense_index: number | null
          away_form_score: number | null
          away_goal_avg: number | null
          away_momentum: number | null
          created_at: string
          expected_goals: number | null
          h2h_away_wins: number | null
          h2h_draws: number | null
          h2h_home_wins: number | null
          home_advantage_score: number | null
          home_attack_index: number | null
          home_defense_index: number | null
          home_form_score: number | null
          home_goal_avg: number | null
          home_momentum: number | null
          hybrid_confidence: number | null
          id: string
          is_derby: boolean | null
          match_importance: string | null
          math_prediction_value: string | null
          math_was_correct: boolean | null
          mathematical_confidence: number | null
          poisson_away_expected: number | null
          poisson_home_expected: number | null
          position_diff: number | null
          prediction_id: string | null
          similar_matches_away_win_pct: number | null
          similar_matches_count: number | null
          similar_matches_draw_pct: number | null
          similar_matches_home_win_pct: number | null
          was_correct: boolean | null
        }
        Insert: {
          actual_result?: string | null
          ai_confidence?: number | null
          ai_prediction_value?: string | null
          ai_reasoning?: string | null
          ai_was_correct?: boolean | null
          away_attack_index?: number | null
          away_defense_index?: number | null
          away_form_score?: number | null
          away_goal_avg?: number | null
          away_momentum?: number | null
          created_at?: string
          expected_goals?: number | null
          h2h_away_wins?: number | null
          h2h_draws?: number | null
          h2h_home_wins?: number | null
          home_advantage_score?: number | null
          home_attack_index?: number | null
          home_defense_index?: number | null
          home_form_score?: number | null
          home_goal_avg?: number | null
          home_momentum?: number | null
          hybrid_confidence?: number | null
          id?: string
          is_derby?: boolean | null
          match_importance?: string | null
          math_prediction_value?: string | null
          math_was_correct?: boolean | null
          mathematical_confidence?: number | null
          poisson_away_expected?: number | null
          poisson_home_expected?: number | null
          position_diff?: number | null
          prediction_id?: string | null
          similar_matches_away_win_pct?: number | null
          similar_matches_count?: number | null
          similar_matches_draw_pct?: number | null
          similar_matches_home_win_pct?: number | null
          was_correct?: boolean | null
        }
        Update: {
          actual_result?: string | null
          ai_confidence?: number | null
          ai_prediction_value?: string | null
          ai_reasoning?: string | null
          ai_was_correct?: boolean | null
          away_attack_index?: number | null
          away_defense_index?: number | null
          away_form_score?: number | null
          away_goal_avg?: number | null
          away_momentum?: number | null
          created_at?: string
          expected_goals?: number | null
          h2h_away_wins?: number | null
          h2h_draws?: number | null
          h2h_home_wins?: number | null
          home_advantage_score?: number | null
          home_attack_index?: number | null
          home_defense_index?: number | null
          home_form_score?: number | null
          home_goal_avg?: number | null
          home_momentum?: number | null
          hybrid_confidence?: number | null
          id?: string
          is_derby?: boolean | null
          match_importance?: string | null
          math_prediction_value?: string | null
          math_was_correct?: boolean | null
          mathematical_confidence?: number | null
          poisson_away_expected?: number | null
          poisson_home_expected?: number | null
          position_diff?: number | null
          prediction_id?: string | null
          similar_matches_away_win_pct?: number | null
          similar_matches_count?: number | null
          similar_matches_draw_pct?: number | null
          similar_matches_home_win_pct?: number | null
          was_correct?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "prediction_features_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_features_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "public_predictions"
            referencedColumns: ["id"]
          },
        ]
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
          hybrid_confidence: number | null
          id: string
          is_correct: boolean | null
          is_premium: boolean | null
          is_primary: boolean | null
          league: string
          match_date: string
          prediction_type: string
          prediction_value: string
          reasoning: string | null
          user_id: string | null
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
          hybrid_confidence?: number | null
          id?: string
          is_correct?: boolean | null
          is_premium?: boolean | null
          is_primary?: boolean | null
          league: string
          match_date: string
          prediction_type: string
          prediction_value: string
          reasoning?: string | null
          user_id?: string | null
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
          hybrid_confidence?: number | null
          id?: string
          is_correct?: boolean | null
          is_premium?: boolean | null
          is_primary?: boolean | null
          league?: string
          match_date?: string
          prediction_type?: string
          prediction_value?: string
          reasoning?: string | null
          user_id?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      premium_subscriptions: {
        Row: {
          acknowledged: boolean | null
          auto_renewing: boolean | null
          created_at: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          order_id: string | null
          plan_type: string
          platform: string | null
          product_id: string | null
          purchase_state: number | null
          purchase_token: string | null
          starts_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          acknowledged?: boolean | null
          auto_renewing?: boolean | null
          created_at?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          order_id?: string | null
          plan_type?: string
          platform?: string | null
          product_id?: string | null
          purchase_state?: number | null
          purchase_token?: string | null
          starts_at?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          acknowledged?: boolean | null
          auto_renewing?: boolean | null
          created_at?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          order_id?: string | null
          plan_type?: string
          platform?: string | null
          product_id?: string | null
          purchase_state?: number | null
          purchase_token?: string | null
          starts_at?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          created_at: string
          display_name: string | null
          id: string
          is_banned: boolean | null
          onboarding_completed: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_banned?: boolean | null
          onboarding_completed?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_banned?: boolean | null
          onboarding_completed?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          delivered_count: number | null
          id: string
          opened_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          sent_by: string | null
          target_audience: string | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          delivered_count?: number | null
          id?: string
          opened_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          target_audience?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          delivered_count?: number | null
          id?: string
          opened_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          target_audience?: string | null
          title?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string | null
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform?: string | null
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string | null
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string | null
          favorite_id: string
          favorite_name: string | null
          favorite_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          favorite_id: string
          favorite_name?: string | null
          favorite_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          favorite_id?: string
          favorite_name?: string | null
          favorite_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      public_predictions: {
        Row: {
          actual_result: string | null
          away_score: number | null
          away_team: string | null
          confidence: string | null
          created_at: string | null
          home_score: number | null
          home_team: string | null
          id: string | null
          is_correct: boolean | null
          is_premium: boolean | null
          is_primary: boolean | null
          league: string | null
          match_date: string | null
          prediction_type: string | null
          prediction_value: string | null
          verified_at: string | null
        }
        Insert: {
          actual_result?: string | null
          away_score?: number | null
          away_team?: string | null
          confidence?: string | null
          created_at?: string | null
          home_score?: number | null
          home_team?: string | null
          id?: string | null
          is_correct?: boolean | null
          is_premium?: boolean | null
          is_primary?: boolean | null
          league?: string | null
          match_date?: string | null
          prediction_type?: string | null
          prediction_value?: string | null
          verified_at?: string | null
        }
        Update: {
          actual_result?: string | null
          away_score?: number | null
          away_team?: string | null
          confidence?: string | null
          created_at?: string | null
          home_score?: number | null
          home_team?: string | null
          id?: string | null
          is_correct?: boolean | null
          is_premium?: boolean | null
          is_primary?: boolean | null
          league?: string | null
          match_date?: string | null
          prediction_type?: string | null
          prediction_value?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_caches: { Args: never; Returns: undefined }
      cleanup_old_analysis_usage: { Args: never; Returns: undefined }
      cleanup_old_bet_slips: { Args: never; Returns: undefined }
      cleanup_old_cached_matches: { Args: never; Returns: undefined }
      cleanup_old_chat_history: { Args: never; Returns: undefined }
      cleanup_old_chatbot_usage: { Args: never; Returns: undefined }
      cleanup_old_features: { Args: never; Returns: undefined }
      cleanup_old_predictions: { Args: never; Returns: undefined }
      get_daily_analysis_usage:
        | { Args: never; Returns: number }
        | { Args: { p_user_id: string }; Returns: number }
      get_daily_usage:
        | { Args: never; Returns: number }
        | { Args: { p_user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_analysis_usage:
        | { Args: never; Returns: number }
        | { Args: { p_user_id: string }; Returns: number }
      increment_chatbot_usage:
        | { Args: never; Returns: number }
        | { Args: { p_user_id: string }; Returns: number }
      is_premium_user:
        | { Args: never; Returns: boolean }
        | { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "vip"
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
      app_role: ["admin", "moderator", "user", "vip"],
    },
  },
} as const
