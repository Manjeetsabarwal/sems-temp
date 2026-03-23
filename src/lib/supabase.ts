// Re-export the singleton Supabase client
export { supabase } from '/utils/supabase/client';

// Database types
export interface Database {
  public: {
    Tables: {
      classes: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
      };
      sections: {
        Row: {
          id: string;
          class_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          class_id: string;
          name: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          name?: string;
        };
      };
      students: {
        Row: {
          student_id: string;
          name: string;
          class_id: string;
          section_id: string;
          roll_no: number;
          parent_contact: string | null;
          parent_email: string | null;
          avatar: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          student_id: string;
          name: string;
          class_id: string;
          section_id: string;
          roll_no: number;
          parent_contact?: string | null;
          parent_email?: string | null;
          avatar?: string | null;
        };
        Update: {
          student_id?: string;
          name?: string;
          class_id?: string;
          section_id?: string;
          roll_no?: number;
          parent_contact?: string | null;
          parent_email?: string | null;
          avatar?: string | null;
        };
      };
    };
  };
}
