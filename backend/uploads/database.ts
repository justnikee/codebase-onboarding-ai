// Auto-generated-style types matching our Supabase schema.
// In production, use `supabase gen types typescript` to regenerate.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type PredictionStatus = "pending" | "resolved" | "expired" | "cancelled";
export type ConfidenceLevel = "low" | "normal" | "high";
export type UserRole = "user" | "moderator" | "admin";
export type BadgeCategory = "general" | "streak" | "accuracy" | "social" | "milestone" | "special";
export type BadgeRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type BadgeRequirement = "predictions_count" | "correct_count" | "points" | "streak" | "referrals" | "accuracy_pct" | "custom";
export type NotificationType = "prediction_resolved" | "badge_awarded" | "rank_change" | "friend_joined" | "streak_broken" | "system";
export type MetricType = "likes" | "retweets" | "replies" | "quotes" | "combined" | "growth_rate";

export interface TweetMetrics {
  repost_count: number;
  reply_count: number;
  like_count: number;
  quote_count: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          provider_id: string;
          auth_provider: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          points: number;
          level: number;
          streak_current: number;
          streak_best: number;
          predictions_count: number;
          correct_predictions: number;
          referral_code: string;
          referred_by: string | null;
          role: UserRole;
          is_banned: boolean;
          banned_at: string | null;
          banned_reason: string | null;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          provider_id: string;
          auth_provider?: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          points?: number;
          level?: number;
          streak_current?: number;
          streak_best?: number;
          predictions_count?: number;
          correct_predictions?: number;
          referral_code?: string;
          referred_by?: string | null;
          role?: UserRole;
          is_banned?: boolean;
          settings?: Json;
        };
        Update: {
          id?: string;
          provider_id?: string;
          auth_provider?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          points?: number;
          level?: number;
          streak_current?: number;
          streak_best?: number;
          predictions_count?: number;
          correct_predictions?: number;
          referral_code?: string;
          referred_by?: string | null;
          role?: UserRole;
          is_banned?: boolean;
          settings?: Json;
        };
        Relationships: [];
      };

      tweets: {
        Row: {
          id: string;
          author_id: string | null;
          author_username: string | null;
          text: string | null;
          metrics_initial: Json;
          metrics_latest: Json;
          metadata: Json;
          tweet_created_at: string | null;
          first_fetched_at: string;
          last_fetched_at: string;
          fetch_count: number;
        };
        Insert: {
          id: string;
          author_id?: string | null;
          author_username?: string | null;
          text?: string | null;
          metrics_initial?: Json;
          metrics_latest?: Json;
          metadata?: Json;
          tweet_created_at?: string | null;
        };
        Update: {
          id?: string;
          author_id?: string | null;
          author_username?: string | null;
          text?: string | null;
          metrics_initial?: Json;
          metrics_latest?: Json;
          metadata?: Json;
          tweet_created_at?: string | null;
          last_fetched_at?: string;
          fetch_count?: number;
        };
        Relationships: [];
      };

      predictions: {
        Row: {
          id: string;
          user_id: string;
          tweet_id: string;
          season_id: string | null;
          predicted_viral: boolean;
          confidence: ConfidenceLevel;
          status: PredictionStatus;
          is_correct: boolean | null;
          points_awarded: number;
          metrics_at_prediction: Json;
          metrics_at_resolution: Json | null;
          threshold_used: Json | null;
          resolve_after: string;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tweet_id: string;
          season_id?: string | null;
          predicted_viral: boolean;
          confidence?: ConfidenceLevel;
          status?: PredictionStatus;
          metrics_at_prediction: Json;
          resolve_after: string;
          is_correct?: boolean | null;
          points_awarded?: number;
          metrics_at_resolution?: Json | null;
          threshold_used?: Json | null;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          tweet_id?: string;
          season_id?: string | null;
          predicted_viral?: boolean;
          confidence?: ConfidenceLevel;
          status?: PredictionStatus;
          is_correct?: boolean | null;
          points_awarded?: number;
          metrics_at_prediction?: Json;
          metrics_at_resolution?: Json | null;
          threshold_used?: Json | null;
          resolve_after?: string;
          resolved_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "predictions_user_id_fkey"; columns: ["user_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "predictions_tweet_id_fkey"; columns: ["tweet_id"]; referencedRelation: "tweets"; referencedColumns: ["id"] },
        ];
      };

      badges: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon_url: string | null;
          category: BadgeCategory;
          rarity: BadgeRarity;
          requirement_type: BadgeRequirement;
          requirement_value: number | null;
          points_bonus: number;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description?: string | null;
          icon_url?: string | null;
          category?: BadgeCategory;
          rarity?: BadgeRarity;
          requirement_type: BadgeRequirement;
          requirement_value?: number | null;
          points_bonus?: number;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon_url?: string | null;
          category?: BadgeCategory;
          rarity?: BadgeRarity;
          requirement_type?: BadgeRequirement;
          requirement_value?: number | null;
          points_bonus?: number;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };

      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          awarded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_id?: string;
        };
        Relationships: [
          { foreignKeyName: "user_badges_user_id_fkey"; columns: ["user_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "user_badges_badge_id_fkey"; columns: ["badge_id"]; referencedRelation: "badges"; referencedColumns: ["id"] },
        ];
      };

      seasons: {
        Row: {
          id: string;
          name: string;
          starts_at: string;
          ends_at: string;
          is_active: boolean;
          config: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          starts_at: string;
          ends_at: string;
          is_active?: boolean;
          config?: Json;
        };
        Update: {
          id?: string;
          name?: string;
          starts_at?: string;
          ends_at?: string;
          is_active?: boolean;
          config?: Json;
        };
        Relationships: [];
      };

      season_scores: {
        Row: {
          id: string;
          season_id: string;
          user_id: string;
          points: number;
          predictions_count: number;
          correct_count: number;
          rank: number | null;
        };
        Insert: {
          id?: string;
          season_id: string;
          user_id: string;
          points?: number;
          predictions_count?: number;
          correct_count?: number;
          rank?: number | null;
        };
        Update: {
          id?: string;
          season_id?: string;
          user_id?: string;
          points?: number;
          predictions_count?: number;
          correct_count?: number;
          rank?: number | null;
        };
        Relationships: [
          { foreignKeyName: "season_scores_season_id_fkey"; columns: ["season_id"]; referencedRelation: "seasons"; referencedColumns: ["id"] },
          { foreignKeyName: "season_scores_user_id_fkey"; columns: ["user_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };

      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string | null;
          data: Json;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body?: string | null;
          data?: Json;
          is_read?: boolean;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          title?: string;
          body?: string | null;
          data?: Json;
          is_read?: boolean;
          read_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "notifications_user_id_fkey"; columns: ["user_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };

      events: {
        Row: {
          id: string;
          type: string;
          user_id: string | null;
          payload: Json;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          user_id?: string | null;
          payload?: Json;
          metadata?: Json;
        };
        Update: {
          id?: string;
          type?: string;
          user_id?: string | null;
          payload?: Json;
          metadata?: Json;
        };
        Relationships: [];
      };

      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_id: string;
          bonus_awarded: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          referrer_id: string;
          referred_id: string;
          bonus_awarded?: boolean;
        };
        Update: {
          id?: string;
          referrer_id?: string;
          referred_id?: string;
          bonus_awarded?: boolean;
        };
        Relationships: [
          { foreignKeyName: "referrals_referrer_id_fkey"; columns: ["referrer_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "referrals_referred_id_fkey"; columns: ["referred_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };

      virality_thresholds: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          metric_type: MetricType;
          threshold_value: number;
          time_window_minutes: number;
          points_multiplier: number;
          is_default: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          metric_type?: MetricType;
          threshold_value: number;
          time_window_minutes?: number;
          points_multiplier?: number;
          is_default?: boolean;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          metric_type?: MetricType;
          threshold_value?: number;
          time_window_minutes?: number;
          points_multiplier?: number;
          is_default?: boolean;
          is_active?: boolean;
        };
        Relationships: [];
      };

      rate_limits: {
        Row: {
          user_id: string;
          action: string;
          window_start: string;
          count: number;
        };
        Insert: {
          user_id: string;
          action: string;
          window_start?: string;
          count?: number;
        };
        Update: {
          user_id?: string;
          action?: string;
          window_start?: string;
          count?: number;
        };
        Relationships: [
          { foreignKeyName: "rate_limits_user_id_fkey"; columns: ["user_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
    };

    Views: {
      leaderboard: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          points: number;
          level: number;
          streak_current: number;
          streak_best: number;
          predictions_count: number;
          correct_predictions: number;
          accuracy_pct: number;
          rank: number;
        };
        Relationships: [];
      };
    };

    Functions: {
      get_leaderboard_by_timeframe: {
        Args: { cutoff_date: string; result_limit: number; result_offset: number };
        Returns: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          points: number;
          level: number;
          accuracy_pct: number;
          rank: number;
        }[];
      };
    };

    Enums: {
      prediction_status: PredictionStatus;
      confidence_level: ConfidenceLevel;
    };

    CompositeTypes: Record<string, never>;
  };
}
