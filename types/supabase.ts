export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: "admin" | "user"
          department: string
          position: string
          phone: string | null
          profile_image: string | null
          date_created: string
          last_login: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role?: "admin" | "user"
          department: string
          position: string
          phone?: string | null
          profile_image?: string | null
          date_created?: string
          last_login?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: "admin" | "user"
          department?: string
          position?: string
          phone?: string | null
          profile_image?: string | null
          date_created?: string
          last_login?: string
        }
      }
      rooms: {
        Row: {
          id: string
          name: string
          location: string
          capacity: number
          room_resources: string[] | null
          status: "available" | "maintenance" | "reserved"
          image: string | null
          description: string | null
          hourly_rate: number
          currency: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          capacity: number
          room_resources?: string[] | null
          status?: "available" | "maintenance" | "reserved"
          image?: string | null
          description?: string | null
          hourly_rate?: number
          currency?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          capacity?: number
          room_resources?: string[] | null
          status?: "available" | "maintenance" | "reserved"
          image?: string | null
          description?: string | null
          hourly_rate?: number
          currency?: string
        }
      }
      bookings: {
        Row: {
          id: string
          room_id: string
          user_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          attendees: string[] | null
          status: "pending" | "confirmed" | "cancelled"
          resources: string[] | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          attendees?: string[] | null
          status?: "pending" | "confirmed" | "cancelled"
          resources?: string[] | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          attendees?: string[] | null
          status?: "pending" | "confirmed" | "cancelled"
          resources?: string[] | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      resources: {
        Row: {
          id: string
          name: string
          type: string
          status: "available" | "in-use" | "maintenance"
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          type: string
          status?: "available" | "in-use" | "maintenance"
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: string
          status?: "available" | "in-use" | "maintenance"
          description?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 