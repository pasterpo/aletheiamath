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
      achievements: {
        Row: {
          category: string | null
          created_at: string
          description: string
          icon: string | null
          id: string
          name: string
          points: number | null
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          name: string
          points?: number | null
          requirement_type: string
          requirement_value: number
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          name?: string
          points?: number | null
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      discussion_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      duels: {
        Row: {
          challenger_answer: string | null
          challenger_id: string
          challenger_time_seconds: number | null
          completed_at: string | null
          created_at: string
          id: string
          opponent_answer: string | null
          opponent_id: string | null
          opponent_time_seconds: number | null
          problem_id: string | null
          started_at: string | null
          status: string | null
          winner_id: string | null
        }
        Insert: {
          challenger_answer?: string | null
          challenger_id: string
          challenger_time_seconds?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          opponent_answer?: string | null
          opponent_id?: string | null
          opponent_time_seconds?: number | null
          problem_id?: string | null
          started_at?: string | null
          status?: string | null
          winner_id?: string | null
        }
        Update: {
          challenger_answer?: string | null
          challenger_id?: string
          challenger_time_seconds?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          opponent_answer?: string | null
          opponent_id?: string | null
          opponent_time_seconds?: number | null
          problem_id?: string | null
          started_at?: string | null
          status?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "duels_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      imo_waitlist: {
        Row: {
          country: string | null
          created_at: string
          current_level: string | null
          email: string
          experience: string | null
          full_name: string
          id: string
          motivation: string | null
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          current_level?: string | null
          email: string
          experience?: string | null
          full_name: string
          id?: string
          motivation?: string | null
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          current_level?: string | null
          email?: string
          experience?: string | null
          full_name?: string
          id?: string
          motivation?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      problem_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      problems: {
        Row: {
          answer: string | null
          answer_type: string | null
          category_id: string | null
          created_at: string
          difficulty: number | null
          hints: string[] | null
          id: string
          image_url: string | null
          is_published: boolean | null
          solution: string | null
          source: string | null
          statement: string
          subtopic: string | null
          tags: string[] | null
          title: string
          topic: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          answer?: string | null
          answer_type?: string | null
          category_id?: string | null
          created_at?: string
          difficulty?: number | null
          hints?: string[] | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          solution?: string | null
          source?: string | null
          statement: string
          subtopic?: string | null
          tags?: string[] | null
          title: string
          topic?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          answer?: string | null
          answer_type?: string | null
          category_id?: string | null
          created_at?: string
          difficulty?: number | null
          hints?: string[] | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          solution?: string | null
          source?: string | null
          statement?: string
          subtopic?: string | null
          tags?: string[] | null
          title?: string
          topic?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "problems_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "problem_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rating_history: {
        Row: {
          created_at: string
          id: string
          rating: number
          rating_change: number
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          rating_change: number
          source?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          rating_change?: number
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      solution_submissions: {
        Row: {
          feedback: string | null
          id: string
          points_earned: number | null
          problem_id: string
          reviewed_at: string | null
          solution_text: string
          status: string | null
          submitted_at: string
          user_id: string
        }
        Insert: {
          feedback?: string | null
          id?: string
          points_earned?: number | null
          problem_id: string
          reviewed_at?: string | null
          solution_text: string
          status?: string | null
          submitted_at?: string
          user_id: string
        }
        Update: {
          feedback?: string | null
          id?: string
          points_earned?: number | null
          problem_id?: string
          reviewed_at?: string | null
          solution_text?: string
          status?: string | null
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solution_submissions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      ui_permissions: {
        Row: {
          created_at: string
          description: string | null
          element_key: string
          element_name: string
          element_type: string
          id: string
          interactable_by_roles: string[]
          updated_at: string
          visible_to_roles: string[]
        }
        Insert: {
          created_at?: string
          description?: string | null
          element_key: string
          element_name: string
          element_type?: string
          id?: string
          interactable_by_roles?: string[]
          updated_at?: string
          visible_to_roles?: string[]
        }
        Update: {
          created_at?: string
          description?: string | null
          element_key?: string
          element_name?: string
          element_type?: string
          id?: string
          interactable_by_roles?: string[]
          updated_at?: string
          visible_to_roles?: string[]
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_daily_skips: {
        Row: {
          category_id: string
          created_at: string
          id: string
          skip_count: number
          skip_date: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          skip_count?: number
          skip_date?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          skip_count?: number
          skip_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_skips_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "problem_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_problem_stats: {
        Row: {
          created_at: string
          difficulty: number | null
          id: string
          is_correct: boolean
          problem_id: string | null
          rating_change: number
          source: string
          subtopic: string | null
          time_taken_seconds: number | null
          topic: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty?: number | null
          id?: string
          is_correct: boolean
          problem_id?: string | null
          rating_change?: number
          source?: string
          subtopic?: string | null
          time_taken_seconds?: number | null
          topic?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty?: number | null
          id?: string
          is_correct?: boolean
          problem_id?: string | null
          rating_change?: number
          source?: string
          subtopic?: string | null
          time_taken_seconds?: number | null
          topic?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_problem_stats_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          current_streak: number | null
          duels_played: number | null
          duels_won: number | null
          id: string
          last_activity_at: string | null
          longest_streak: number | null
          problems_solved: number | null
          rating: number | null
          total_points: number | null
          updated_at: string
          user_id: string
          videos_watched: number | null
        }
        Insert: {
          current_streak?: number | null
          duels_played?: number | null
          duels_won?: number | null
          id?: string
          last_activity_at?: string | null
          longest_streak?: number | null
          problems_solved?: number | null
          rating?: number | null
          total_points?: number | null
          updated_at?: string
          user_id: string
          videos_watched?: number | null
        }
        Update: {
          current_streak?: number | null
          duels_played?: number | null
          duels_won?: number | null
          id?: string
          last_activity_at?: string | null
          longest_streak?: number | null
          problems_solved?: number | null
          rating?: number | null
          total_points?: number | null
          updated_at?: string
          user_id?: string
          videos_watched?: number | null
        }
        Relationships: []
      }
      video_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      video_progress: {
        Row: {
          completed: boolean | null
          created_at: string
          id: string
          last_watched_at: string | null
          user_id: string
          video_id: string
          watched_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          id?: string
          last_watched_at?: string | null
          user_id: string
          video_id: string
          watched_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          id?: string
          last_watched_at?: string | null
          user_id?: string
          video_id?: string
          watched_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          difficulty: string | null
          duration_seconds: number | null
          id: string
          is_featured: boolean | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          view_count: number | null
          youtube_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          duration_seconds?: number | null
          id?: string
          is_featured?: boolean | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          view_count?: number | null
          youtube_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          duration_seconds?: number | null
          id?: string
          is_featured?: boolean | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          view_count?: number | null
          youtube_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "video_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_or_higher: {
        Args: {
          _min_role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "developer" | "staff" | "moderator" | "member"
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
      app_role: ["developer", "staff", "moderator", "member"],
    },
  },
} as const
