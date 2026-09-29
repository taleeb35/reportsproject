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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      about_advantage: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          image_url: string | null
          point1: string | null
          point2: string | null
          point3: string | null
          point4: string | null
          point5: string | null
          point6: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          image_url?: string | null
          point1?: string | null
          point2?: string | null
          point3?: string | null
          point4?: string | null
          point5?: string | null
          point6?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          image_url?: string | null
          point1?: string | null
          point2?: string | null
          point3?: string | null
          point4?: string | null
          point5?: string | null
          point6?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      about_experience: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          image_url: string | null
          stat1_label: string
          stat1_value: string
          stat2_label: string
          stat2_value: string
          stat3_label: string
          stat3_value: string
          title: string
          updated_at: string
          years_text: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          image_url?: string | null
          stat1_label: string
          stat1_value: string
          stat2_label: string
          stat2_value: string
          stat3_label: string
          stat3_value: string
          title: string
          updated_at?: string
          years_text: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          image_url?: string | null
          stat1_label?: string
          stat1_value?: string
          stat2_label?: string
          stat2_value?: string
          stat3_label?: string
          stat3_value?: string
          title?: string
          updated_at?: string
          years_text?: string
        }
        Relationships: []
      }
      about_hero: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          main_title: string
          subtitle: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          main_title: string
          subtitle: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          main_title?: string
          subtitle?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_logos: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          id: string
          logo_url: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          logo_url: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          logo_url?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_values: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          display_order: number
          icon_name: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          display_order?: number
          icon_name: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          display_order?: number
          icon_name?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          arabic_flipbook_url: string | null
          arabic_pdf_url: string | null
          category_id: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          english_flipbook_url: string | null
          english_pdf_url: string | null
          id: string
          title: string
          updated_at: string | null
          year: number
          youtube_url: string | null
        }
        Insert: {
          arabic_flipbook_url?: string | null
          arabic_pdf_url?: string | null
          category_id?: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          english_flipbook_url?: string | null
          english_pdf_url?: string | null
          id?: string
          title: string
          updated_at?: string | null
          year: number
          youtube_url?: string | null
        }
        Update: {
          arabic_flipbook_url?: string | null
          arabic_pdf_url?: string | null
          category_id?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          english_flipbook_url?: string | null
          english_pdf_url?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          year?: number
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "content_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          created_by: string | null
          display_order: number
          id: string
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      footer_settings: {
        Row: {
          addressksa: string
          addressuae: string
          created_at: string
          created_by: string | null
          description: string
          email: string
          facebook_url: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          phoneksa: string
          phoneuae: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          addressksa?: string
          addressuae?: string
          created_at?: string
          created_by?: string | null
          description: string
          email: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          phoneksa?: string
          phoneuae?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          addressksa?: string
          addressuae?: string
          created_at?: string
          created_by?: string | null
          description?: string
          email?: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          phoneksa?: string
          phoneuae?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      home_hero: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          main_title: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          main_title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          main_title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      home_service_section: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          subtitle: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          subtitle: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          subtitle?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      home_statistics: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          id: string
          title: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          title: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          title?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      infographics: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          image_url: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          brief: string
          company_name: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          brief: string
          company_name: string
          created_at?: string
          email: string
          id?: string
          name: string
          phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          brief?: string
          company_name?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          external_link: string | null
          id: string
          image_url: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          external_link?: string | null
          id?: string
          image_url: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          external_link?: string | null
          id?: string
          image_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      statistics: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string | null
          external_link: string
          id: string
          image_url: string
          title: string
          updated_at: string
          year: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          external_link: string
          id?: string
          image_url: string
          title: string
          updated_at?: string
          year: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          external_link?: string
          id?: string
          image_url?: string
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "statistics_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "content_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          author_image_url: string | null
          author_name: string
          author_position: string
          created_at: string
          created_by: string | null
          display_order: number
          id: string
          quote: string
          updated_at: string
        }
        Insert: {
          author_image_url?: string | null
          author_name: string
          author_position: string
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          quote: string
          updated_at?: string
        }
        Update: {
          author_image_url?: string | null
          author_name?: string
          author_position?: string
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          quote?: string
          updated_at?: string
        }
        Relationships: []
      }
      timeline_items: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          updated_at?: string
          year?: number
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
    }
    Enums: {
      app_role: "admin" | "user"
      content_type: "pdf" | "flipbook" | "youtube"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
      content_type: ["pdf", "flipbook", "youtube"],
    },
  },
} as const
