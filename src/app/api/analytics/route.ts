import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

// Tipos para los datos de analytics
export interface FunnelData {
  n0: number;  // Resueltos en primera interacción (conversaciones sin ticket)
  n1: number;  // Escalados (conversaciones con ticket)
  total: number;
  n0Percentage: number;
  n1Percentage: number;
}

export interface DailyMetric {
  date: string;
  label: string;
  messages: number;
  conversations: number;
  users: number;
  tickets: number;
}

export interface AnalyticsData {
  funnel: FunnelData;
  dailyMetrics: DailyMetric[];
  hourlyDistribution: { hour: number; messages: number }[];
}

// Obtener los últimos N días
function getLastNDays(n: number): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date);
  }
  
  return dates;
}

// Formatear fecha para mostrar
function formatDateLabel(date: Date): string {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const day = days[date.getDay()];
  return `${day} ${date.getDate()}`;
}

async function getAnalyticsFromSupabase(): Promise<AnalyticsData> {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const last7Days = getLastNDays(7);
  const startDate = last7Days[0].toISOString();
  const endDate = new Date(last7Days[6]);
  endDate.setDate(endDate.getDate() + 1);
  const endDateStr = endDate.toISOString();

  // Ejecutar consultas en paralelo
  const [
    // Total de conversaciones (mensajes con is_message_start = true)
    totalConversationsResult,
    // Total de tickets
    totalTicketsResult,
    // Mensajes de los últimos 7 días
    recentMessagesResult,
    // Conversaciones de los últimos 7 días
    recentConversationsResult,
    // Usuarios de los últimos 7 días
    recentUsersResult,
    // Tickets de los últimos 7 días
    recentTicketsResult,
  ] = await Promise.all([
    supabase.from('session_messages').select('*', { count: 'exact', head: true }).eq('is_message_start', true),
    supabase.from('tickets').select('*', { count: 'exact', head: true }),
    supabase.from('session_messages').select('sent_at').gte('sent_at', startDate).lt('sent_at', endDateStr),
    supabase.from('session_messages').select('sent_at').eq('is_message_start', true).gte('sent_at', startDate).lt('sent_at', endDateStr),
    supabase.from('users').select('created_at').gte('created_at', startDate).lt('created_at', endDateStr),
    supabase.from('tickets').select('created_at').gte('created_at', startDate).lt('created_at', endDateStr),
  ]);

  // Calcular embudo N0/N1
  const totalConversations = totalConversationsResult.count ?? 0;
  const totalTickets = totalTicketsResult.count ?? 0;
  const n1 = totalTickets; // Escalados = tickets creados
  const n0 = Math.max(0, totalConversations - n1); // Resueltos = conversaciones - escalados

  const funnel: FunnelData = {
    n0,
    n1,
    total: totalConversations,
    n0Percentage: totalConversations > 0 ? Math.round((n0 / totalConversations) * 100) : 0,
    n1Percentage: totalConversations > 0 ? Math.round((n1 / totalConversations) * 100) : 0,
  };

  // Extraer datos con tipos explícitos
  const messagesData = (recentMessagesResult.data ?? []) as { sent_at: string }[];
  const conversationsData = (recentConversationsResult.data ?? []) as { sent_at: string }[];
  const usersData = (recentUsersResult.data ?? []) as { created_at: string }[];
  const ticketsData = (recentTicketsResult.data ?? []) as { created_at: string }[];

  // Procesar métricas diarias
  const dailyMetrics: DailyMetric[] = last7Days.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Contar mensajes del día
    const messages = messagesData.filter(m => {
      const msgDate = new Date(m.sent_at).toISOString().split('T')[0];
      return msgDate === dateStr;
    }).length;

    // Contar conversaciones del día
    const conversations = conversationsData.filter(c => {
      const convDate = new Date(c.sent_at).toISOString().split('T')[0];
      return convDate === dateStr;
    }).length;

    // Contar usuarios del día
    const users = usersData.filter(u => {
      const userDate = new Date(u.created_at).toISOString().split('T')[0];
      return userDate === dateStr;
    }).length;

    // Contar tickets del día
    const tickets = ticketsData.filter(t => {
      const ticketDate = new Date(t.created_at).toISOString().split('T')[0];
      return ticketDate === dateStr;
    }).length;

    return {
      date: dateStr,
      label: formatDateLabel(date),
      messages,
      conversations,
      users,
      tickets,
    };
  });

  // Calcular distribución horaria (de todos los mensajes recientes)
  const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    messages: messagesData.filter(m => {
      const msgHour = new Date(m.sent_at).getHours();
      return msgHour === hour;
    }).length,
  }));

  return {
    funnel,
    dailyMetrics,
    hourlyDistribution,
  };
}

// Datos mock
function getMockAnalytics(): AnalyticsData {
  const mockDays = getLastNDays(7);
  
  return {
    funnel: {
      n0: 0,
      n1: 0,
      total: 0,
      n0Percentage: 0,
      n1Percentage: 0,
    },
    dailyMetrics: mockDays.map(date => ({
      date: date.toISOString().split('T')[0],
      label: formatDateLabel(date),
      messages: 0,
      conversations: 0,
      users: 0,
      tickets: 0,
    })),
    hourlyDistribution: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      messages: 0,
    })),
  };
}

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        data: getMockAnalytics(),
        configured: false,
        message: 'Supabase no configurado.',
        timestamp: new Date().toISOString(),
      });
    }

    const analytics = await getAnalyticsFromSupabase();

    return NextResponse.json({
      success: true,
      data: analytics,
      configured: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        data: getMockAnalytics(),
        configured: false,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
