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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          entity: string | null
          entity_id: string | null
          id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      ai_agents: {
        Row: {
          agent_key: string
          config: Json | null
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          last_run: string | null
          name: string
          updated_at: string
        }
        Insert: {
          agent_key: string
          config?: Json | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          last_run?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          agent_key?: string
          config?: Json | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          last_run?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      aircraft: {
        Row: {
          archived: boolean
          created_at: string
          created_by: string | null
          customer_id: string | null
          id: string
          manufacturer: string | null
          model: string | null
          notes: string | null
          registration: string | null
          serial_number: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          manufacturer?: string | null
          model?: string | null
          notes?: string | null
          registration?: string | null
          serial_number?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          manufacturer?: string | null
          model?: string | null
          notes?: string | null
          registration?: string | null
          serial_number?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aircraft_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          agent_key: string | null
          created_at: string
          id: string
          result: string | null
          status: string | null
          title: string | null
        }
        Insert: {
          agent_key?: string | null
          created_at?: string
          id?: string
          result?: string | null
          status?: string | null
          title?: string | null
        }
        Update: {
          agent_key?: string | null
          created_at?: string
          id?: string
          result?: string | null
          status?: string | null
          title?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          archived: boolean
          cert_type: Database["public"]["Enums"]["cert_type"] | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          file_url: string | null
          id: string
          issue_date: string | null
          notes: string | null
          part_id: string | null
          pn: string | null
          quote_id: string | null
          required: boolean
          serial_number: string | null
          status: Database["public"]["Enums"]["cert_status"]
          supplier_id: string | null
          updated_at: string
          updated_by: string | null
          valid_until: string | null
        }
        Insert: {
          archived?: boolean
          cert_type?: Database["public"]["Enums"]["cert_type"] | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          part_id?: string | null
          pn?: string | null
          quote_id?: string | null
          required?: boolean
          serial_number?: string | null
          status?: Database["public"]["Enums"]["cert_status"]
          supplier_id?: string | null
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
        }
        Update: {
          archived?: boolean
          cert_type?: Database["public"]["Enums"]["cert_type"] | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          part_id?: string | null
          pn?: string | null
          quote_id?: string | null
          required?: boolean
          serial_number?: string | null
          status?: Database["public"]["Enums"]["cert_status"]
          supplier_id?: string | null
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          aircraft_operated: string | null
          archived: boolean
          city: string | null
          company: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          payment_terms_days: number | null
          phone: string | null
          state: string | null
          tax_id: string | null
          type: Database["public"]["Enums"]["customer_type"] | null
          updated_at: string
          updated_by: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          aircraft_operated?: string | null
          archived?: boolean
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          payment_terms_days?: number | null
          phone?: string | null
          state?: string | null
          tax_id?: string | null
          type?: Database["public"]["Enums"]["customer_type"] | null
          updated_at?: string
          updated_by?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          aircraft_operated?: string | null
          archived?: boolean
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          payment_terms_days?: number | null
          phone?: string | null
          state?: string | null
          tax_id?: string | null
          type?: Database["public"]["Enums"]["customer_type"] | null
          updated_at?: string
          updated_by?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      document_counters: {
        Row: {
          doc_type: string
          last_number: number
          year: number
        }
        Insert: {
          doc_type: string
          last_number?: number
          year: number
        }
        Update: {
          doc_type?: string
          last_number?: number
          year?: number
        }
        Relationships: []
      }
      estimates: {
        Row: {
          archived: boolean
          created_at: string
          created_by: string | null
          customer_id: string | null
          estimate_number: string
          id: string
          notes: string | null
          quote_id: string | null
          status: Database["public"]["Enums"]["fin_doc_status"]
          terms: string | null
          total: number | null
          updated_at: string
          updated_by: string | null
          valid_until: string | null
        }
        Insert: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          estimate_number: string
          id?: string
          notes?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["fin_doc_status"]
          terms?: string | null
          total?: number | null
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
        }
        Update: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          estimate_number?: string
          id?: string
          notes?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["fin_doc_status"]
          terms?: string | null
          total?: number | null
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          archived: boolean
          category: string | null
          created_at: string
          created_by: string | null
          description: string
          expense_date: string | null
          id: string
          notes: string | null
          updated_by: string | null
        }
        Insert: {
          amount?: number
          archived?: boolean
          category?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          expense_date?: string | null
          id?: string
          notes?: string | null
          updated_by?: string | null
        }
        Update: {
          amount?: number
          archived?: boolean
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string | null
          id?: string
          notes?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          archived: boolean
          created_at: string
          created_by: string | null
          customer_id: string | null
          due_date: string | null
          estimate_id: string | null
          id: string
          invoice_number: string
          issue_date: string | null
          notes: string | null
          quote_id: string | null
          status: Database["public"]["Enums"]["fin_doc_status"]
          terms: string | null
          total: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          due_date?: string | null
          estimate_id?: string | null
          id?: string
          invoice_number: string
          issue_date?: string | null
          notes?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["fin_doc_status"]
          terms?: string | null
          total?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          due_date?: string | null
          estimate_id?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string | null
          notes?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["fin_doc_status"]
          terms?: string | null
          total?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          aircraft: string | null
          archived: boolean
          company: string | null
          created_at: string
          created_by: string | null
          desired_condition: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          pn_requested: string | null
          quantity: number | null
          responsible: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          updated_by: string | null
          urgency: Database["public"]["Enums"]["urgencia"]
          whatsapp: string | null
        }
        Insert: {
          aircraft?: string | null
          archived?: boolean
          company?: string | null
          created_at?: string
          created_by?: string | null
          desired_condition?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          pn_requested?: string | null
          quantity?: number | null
          responsible?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          updated_by?: string | null
          urgency?: Database["public"]["Enums"]["urgencia"]
          whatsapp?: string | null
        }
        Update: {
          aircraft?: string | null
          archived?: boolean
          company?: string | null
          created_at?: string
          created_by?: string | null
          desired_condition?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          pn_requested?: string | null
          quantity?: number | null
          responsible?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          updated_by?: string | null
          urgency?: Database["public"]["Enums"]["urgencia"]
          whatsapp?: string | null
        }
        Relationships: []
      }
      logistics: {
        Row: {
          archived: boolean
          carrier: string | null
          commercial_invoice: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          delivered_date: string | null
          destination_address: string | null
          dimensions: string | null
          expected_date: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          packing_list: string | null
          pn: string | null
          quote_id: string | null
          status: Database["public"]["Enums"]["logistics_status"]
          supplier_id: string | null
          supplier_tracking: string | null
          updated_at: string
          updated_by: string | null
          weight: number | null
        }
        Insert: {
          archived?: boolean
          carrier?: string | null
          commercial_invoice?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          delivered_date?: string | null
          destination_address?: string | null
          dimensions?: string | null
          expected_date?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          packing_list?: string | null
          pn?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["logistics_status"]
          supplier_id?: string | null
          supplier_tracking?: string | null
          updated_at?: string
          updated_by?: string | null
          weight?: number | null
        }
        Update: {
          archived?: boolean
          carrier?: string | null
          commercial_invoice?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          delivered_date?: string | null
          destination_address?: string | null
          dimensions?: string | null
          expected_date?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          packing_list?: string | null
          pn?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["logistics_status"]
          supplier_id?: string | null
          supplier_tracking?: string | null
          updated_at?: string
          updated_by?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "logistics_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistics_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistics_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistics_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          alternate_pn: string | null
          application: string | null
          archived: boolean
          ata_chapter: string | null
          compatible_aircraft: string | null
          conditions_available: string | null
          created_at: string
          created_by: string | null
          description: string | null
          dimensions: string | null
          estimated_weight: number | null
          id: string
          last_price: number | null
          manufacturer: string | null
          notes: string | null
          pn: string
          required_certification: string | null
          superseded_pn: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          alternate_pn?: string | null
          application?: string | null
          archived?: boolean
          ata_chapter?: string | null
          compatible_aircraft?: string | null
          conditions_available?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dimensions?: string | null
          estimated_weight?: number | null
          id?: string
          last_price?: number | null
          manufacturer?: string | null
          notes?: string | null
          pn: string
          required_certification?: string | null
          superseded_pn?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          alternate_pn?: string | null
          application?: string | null
          archived?: boolean
          ata_chapter?: string | null
          compatible_aircraft?: string | null
          conditions_available?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dimensions?: string | null
          estimated_weight?: number | null
          id?: string
          last_price?: number | null
          manufacturer?: string | null
          notes?: string | null
          pn?: string
          required_certification?: string | null
          superseded_pn?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          archived: boolean
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string | null
          method: string | null
          notes: string | null
          payment_date: string | null
          po_id: string | null
          type: Database["public"]["Enums"]["payment_type"]
          updated_by: string | null
        }
        Insert: {
          amount?: number
          archived?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          method?: string | null
          notes?: string | null
          payment_date?: string | null
          po_id?: string | null
          type: Database["public"]["Enums"]["payment_type"]
          updated_by?: string | null
        }
        Update: {
          amount?: number
          archived?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          method?: string | null
          notes?: string | null
          payment_date?: string | null
          po_id?: string | null
          type?: Database["public"]["Enums"]["payment_type"]
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          archived: boolean
          created_at: string
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          condition: string | null
          created_at: string
          description: string | null
          id: string
          part_id: string | null
          pn: string | null
          po_id: string
          quantity: number | null
          unit_cost: number | null
        }
        Insert: {
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          part_id?: string | null
          pn?: string | null
          po_id: string
          quantity?: number | null
          unit_cost?: number | null
        }
        Update: {
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          part_id?: string | null
          pn?: string | null
          po_id?: string
          quantity?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          archived: boolean
          certificate_received: boolean
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          payment_method: string | null
          po_number: string
          purchase_date: string | null
          quote_id: string | null
          status: Database["public"]["Enums"]["po_status"]
          supplier_id: string | null
          total: number | null
          tracking: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived?: boolean
          certificate_received?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          po_number: string
          purchase_date?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["po_status"]
          supplier_id?: string | null
          total?: number | null
          tracking?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived?: boolean
          certificate_received?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          po_number?: string
          purchase_date?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["po_status"]
          supplier_id?: string | null
          total?: number | null
          tracking?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          condition: string | null
          created_at: string
          description: string | null
          id: string
          part_id: string | null
          pn: string | null
          quantity: number | null
          quote_id: string
          unit_cost: number | null
          unit_price: number | null
        }
        Insert: {
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          part_id?: string | null
          pn?: string | null
          quantity?: number | null
          quote_id: string
          unit_cost?: number | null
          unit_price?: number | null
        }
        Update: {
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          part_id?: string | null
          pn?: string | null
          quantity?: number | null
          quote_id?: string
          unit_cost?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          aircraft: string | null
          archived: boolean
          created_at: string
          created_by: string | null
          customer_id: string | null
          desired_margin: number | null
          exchange_rate: number | null
          final_price: number | null
          freight: number | null
          id: string
          import_fee: number | null
          internal_number: string
          is_aog: boolean
          last_followup: string | null
          notes: string | null
          quote_date: string | null
          real_margin: number | null
          responsible: string | null
          status: Database["public"]["Enums"]["quote_status"]
          supplier_cost: number | null
          suppliers_consulted: string | null
          updated_at: string
          updated_by: string | null
          valid_until: string | null
        }
        Insert: {
          aircraft?: string | null
          archived?: boolean
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          desired_margin?: number | null
          exchange_rate?: number | null
          final_price?: number | null
          freight?: number | null
          id?: string
          import_fee?: number | null
          internal_number: string
          is_aog?: boolean
          last_followup?: string | null
          notes?: string | null
          quote_date?: string | null
          real_margin?: number | null
          responsible?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          supplier_cost?: number | null
          suppliers_consulted?: string | null
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
        }
        Update: {
          aircraft?: string | null
          archived?: boolean
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          desired_margin?: number | null
          exchange_rate?: number | null
          final_price?: number | null
          freight?: number | null
          id?: string
          import_fee?: number | null
          internal_number?: string
          is_aog?: boolean
          last_followup?: string | null
          notes?: string | null
          quote_date?: string | null
          real_margin?: number | null
          responsible?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          supplier_cost?: number | null
          suppliers_consulted?: string | null
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_items: {
        Row: {
          certification: string | null
          condition_requested: string | null
          created_at: string
          description: string | null
          id: string
          lead_time: string | null
          part_id: string | null
          pn: string | null
          price_received: number | null
          quantity: number | null
          rfq_id: string
        }
        Insert: {
          certification?: string | null
          condition_requested?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lead_time?: string | null
          part_id?: string | null
          pn?: string | null
          price_received?: number | null
          quantity?: number | null
          rfq_id: string
        }
        Update: {
          certification?: string | null
          condition_requested?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lead_time?: string | null
          part_id?: string | null
          pn?: string | null
          price_received?: number | null
          quantity?: number | null
          rfq_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_items_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          archived: boolean
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          quote_id: string | null
          response_date: string | null
          rfq_number: string
          sent_date: string | null
          status: Database["public"]["Enums"]["rfq_status"]
          supplier_email: string | null
          supplier_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          quote_id?: string | null
          response_date?: string | null
          rfq_number: string
          sent_date?: string | null
          status?: Database["public"]["Enums"]["rfq_status"]
          supplier_email?: string | null
          supplier_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          quote_id?: string | null
          response_date?: string | null
          rfq_number?: string
          sent_date?: string | null
          status?: Database["public"]["Enums"]["rfq_status"]
          supplier_email?: string | null
          supplier_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfqs_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      supplier_quotes: {
        Row: {
          certification: string | null
          chosen: boolean
          condition: string | null
          created_at: string
          id: string
          lead_time: string | null
          notes: string | null
          pn: string | null
          price: number | null
          rfq_id: string | null
          supplier_id: string | null
        }
        Insert: {
          certification?: string | null
          chosen?: boolean
          condition?: string | null
          created_at?: string
          id?: string
          lead_time?: string | null
          notes?: string | null
          pn?: string | null
          price?: number | null
          rfq_id?: string | null
          supplier_id?: string | null
        }
        Update: {
          certification?: string | null
          chosen?: boolean
          condition?: string | null
          created_at?: string
          id?: string
          lead_time?: string | null
          notes?: string | null
          pn?: string | null
          price?: number | null
          rfq_id?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_quotes_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_quotes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          archived: boolean
          avg_lead_time: string | null
          certifications: string | null
          conditions_offered: string | null
          contact: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          internal_rating: number | null
          login: string | null
          manufacturers_served: string | null
          name: string
          notes: string | null
          part_type: string | null
          password_encrypted: string | null
          phone: string | null
          updated_at: string
          updated_by: string | null
          website: string | null
        }
        Insert: {
          archived?: boolean
          avg_lead_time?: string | null
          certifications?: string | null
          conditions_offered?: string | null
          contact?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          internal_rating?: number | null
          login?: string | null
          manufacturers_served?: string | null
          name: string
          notes?: string | null
          part_type?: string | null
          password_encrypted?: string | null
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          archived?: boolean
          avg_lead_time?: string | null
          certifications?: string | null
          conditions_offered?: string | null
          contact?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          internal_rating?: number | null
          login?: string | null
          manufacturers_served?: string | null
          name?: string
          notes?: string | null
          part_type?: string | null
          password_encrypted?: string | null
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      next_document_number: { Args: { _doc_type: string }; Returns: string }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role:
        | "admin"
        | "ceo"
        | "comercial"
        | "compras"
        | "financeiro"
        | "logistica"
        | "operador"
      cert_status: "pendente" | "recebido" | "aprovado" | "rejeitado"
      cert_type:
        | "faa_8130_3"
        | "easa_form_1"
        | "coc"
        | "mfg_cert"
        | "tag"
        | "trace"
        | "non_incident"
      customer_type:
        | "oficina"
        | "operador"
        | "taxi_aereo"
        | "mecanico"
        | "proprietario"
        | "empresa"
      fin_doc_status: "rascunho" | "enviado" | "aprovado" | "pago" | "cancelado"
      lead_status:
        | "novo"
        | "qualificado"
        | "aguardando_cotacao"
        | "em_cotacao"
        | "estimate_enviado"
        | "follow_up"
        | "ganhou"
        | "perdido"
      logistics_status:
        | "aguardando_peca"
        | "em_transito_deerfield"
        | "recebido_deerfield"
        | "conferencia"
        | "doc_pendente"
        | "pronto_exportacao"
        | "enviado_brasil"
        | "em_nacionalizacao"
        | "entregue"
      payment_type: "recebido" | "enviado"
      po_status:
        | "aguardando_aprovacao"
        | "po_criada"
        | "aguardando_pagamento"
        | "pedido_realizado"
        | "aguardando_envio"
        | "enviado_fornecedor"
        | "recebido"
        | "em_conferencia"
        | "liberado_logistica"
      quote_status:
        | "nova"
        | "em_pesquisa"
        | "aguardando_fornecedor"
        | "preco_recebido"
        | "analise_margem"
        | "estimate_enviado"
        | "follow_up"
        | "aprovado"
        | "perdido"
        | "cancelado"
      rfq_status:
        | "rascunho"
        | "enviado"
        | "respondido"
        | "escolhido"
        | "recusado"
      urgencia: "aog" | "normal"
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
      app_role: [
        "admin",
        "ceo",
        "comercial",
        "compras",
        "financeiro",
        "logistica",
        "operador",
      ],
      cert_status: ["pendente", "recebido", "aprovado", "rejeitado"],
      cert_type: [
        "faa_8130_3",
        "easa_form_1",
        "coc",
        "mfg_cert",
        "tag",
        "trace",
        "non_incident",
      ],
      customer_type: [
        "oficina",
        "operador",
        "taxi_aereo",
        "mecanico",
        "proprietario",
        "empresa",
      ],
      fin_doc_status: ["rascunho", "enviado", "aprovado", "pago", "cancelado"],
      lead_status: [
        "novo",
        "qualificado",
        "aguardando_cotacao",
        "em_cotacao",
        "estimate_enviado",
        "follow_up",
        "ganhou",
        "perdido",
      ],
      logistics_status: [
        "aguardando_peca",
        "em_transito_deerfield",
        "recebido_deerfield",
        "conferencia",
        "doc_pendente",
        "pronto_exportacao",
        "enviado_brasil",
        "em_nacionalizacao",
        "entregue",
      ],
      payment_type: ["recebido", "enviado"],
      po_status: [
        "aguardando_aprovacao",
        "po_criada",
        "aguardando_pagamento",
        "pedido_realizado",
        "aguardando_envio",
        "enviado_fornecedor",
        "recebido",
        "em_conferencia",
        "liberado_logistica",
      ],
      quote_status: [
        "nova",
        "em_pesquisa",
        "aguardando_fornecedor",
        "preco_recebido",
        "analise_margem",
        "estimate_enviado",
        "follow_up",
        "aprovado",
        "perdido",
        "cancelado",
      ],
      rfq_status: [
        "rascunho",
        "enviado",
        "respondido",
        "escolhido",
        "recusado",
      ],
      urgencia: ["aog", "normal"],
    },
  },
} as const
