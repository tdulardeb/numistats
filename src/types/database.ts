// Tipos generados basados en la estructura de la base de datos

export interface User {
  id: number;
  phone: string;
  name: string | null;
  created_at: string;
}

export interface SessionMessage {
  id: number;
  user_id: number;
  phone: string;
  message: string;
  role: 'user' | 'agent';
  is_message_start: boolean;
  sent_at: string;
}

export interface Ticket {
  id: number;
  user_id: number;
  phone: string;
  freshdesk_ticket_id: string;
  subject: string;
  description: string | null;
  created_at: string;
}

export interface Survey {
  id: number;
  user_id: number;
  survey: string | null;
}

// Tipo para Supabase client
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at'> & { created_at?: string };
        Update: Partial<Omit<User, 'id'>>;
      };
      session_messages: {
        Row: SessionMessage;
        Insert: Omit<SessionMessage, 'id' | 'sent_at'> & { sent_at?: string };
        Update: Partial<Omit<SessionMessage, 'id'>>;
      };
      tickets: {
        Row: Ticket;
        Insert: Omit<Ticket, 'id' | 'created_at'> & { created_at?: string };
        Update: Partial<Omit<Ticket, 'id'>>;
      };
      survey: {
        Row: Survey;
        Insert: Omit<Survey, 'id'>;
        Update: Partial<Omit<Survey, 'id'>>;
      };
    };
  };
}

// Tipos para las métricas del dashboard
export interface DashboardStats {
  // Métricas de usuarios
  totalUsers: number;
  newUsersToday: number;
  newUsersWeek: number;
  newUsersMonth: number;
  
  // Métricas de mensajes
  totalMessages: number;
  messagesToday: number;
  messagesWeek: number;
  userMessages: number;
  agentMessages: number;
  avgMessagesPerUser: number;
  
  // Métricas de conversaciones
  totalConversations: number;
  conversationsToday: number;
  
  // Métricas de tickets
  totalTickets: number;
  ticketsToday: number;
  ticketsWeek: number;
  
  // Métricas de encuestas
  totalSurveys: number;
  surveysCompleted: number;
}

// Tipo para KPI individual
export interface KpiStat {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
  description: string;
  category: 'users' | 'messages' | 'tickets' | 'surveys' | 'atenciones';
}
