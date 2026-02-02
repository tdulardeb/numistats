import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseServerConfigured } from '@/lib/supabase-server';
import type { KpiStat } from '@/types/database';

// Helper para calcular fechas
function getDateRanges() {
  const now = new Date();
  
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  
  const monthStart = new Date(todayStart);
  monthStart.setDate(monthStart.getDate() - 30);
  
  const lastMonthStart = new Date(monthStart);
  lastMonthStart.setDate(lastMonthStart.getDate() - 30);

  return {
    todayStart: todayStart.toISOString(),
    yesterdayStart: yesterdayStart.toISOString(),
    weekStart: weekStart.toISOString(),
    lastWeekStart: lastWeekStart.toISOString(),
    monthStart: monthStart.toISOString(),
    lastMonthStart: lastMonthStart.toISOString(),
  };
}

// Calcular porcentaje de cambio
function calculateChange(current: number, previous: number): { change: number; type: 'positive' | 'negative' | 'neutral' } {
  if (previous === 0) {
    return { change: current > 0 ? 100 : 0, type: current > 0 ? 'positive' : 'neutral' };
  }
  const change = ((current - previous) / previous) * 100;
  return {
    change: Math.round(change * 10) / 10,
    type: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
  };
}

// Formatear números grandes
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString('es-ES');
}

async function getStatsFromSupabase(): Promise<KpiStat[]> {
  // Usar Service Role Key (solo servidor, bypasea RLS)
  const supabase = getSupabaseServerClient();
  
  const dates = getDateRanges();
  
  // Ejecutar todas las consultas en paralelo
  const [
    // Usuarios
    totalUsersResult,
    usersThisWeekResult,
    usersLastWeekResult,
    usersTodayResult,
    usersYesterdayResult,
    
    // Mensajes
    totalMessagesResult,
    messagesThisWeekResult,
    messagesLastWeekResult,
    userMessagesResult,
    agentMessagesResult,
    
    // Conversaciones (mensajes con is_message_start = true)
    totalConversationsResult,
    conversationsThisWeekResult,
    conversationsLastWeekResult,
    
    // Tickets
    totalTicketsResult,
    ticketsThisWeekResult,
    ticketsLastWeekResult,
    
    // Encuestas
    totalSurveysResult,
    surveysCompletedResult,
  ] = await Promise.all([
    // Usuarios
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', dates.weekStart),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', dates.lastWeekStart).lt('created_at', dates.weekStart),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', dates.todayStart),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', dates.yesterdayStart).lt('created_at', dates.todayStart),
    
    // Mensajes
    supabase.from('session_messages').select('*', { count: 'exact', head: true }),
    supabase.from('session_messages').select('*', { count: 'exact', head: true }).gte('sent_at', dates.weekStart),
    supabase.from('session_messages').select('*', { count: 'exact', head: true }).gte('sent_at', dates.lastWeekStart).lt('sent_at', dates.weekStart),
    supabase.from('session_messages').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('session_messages').select('*', { count: 'exact', head: true }).eq('role', 'agent'),
    
    // Conversaciones
    supabase.from('session_messages').select('*', { count: 'exact', head: true }).eq('is_message_start', true),
    supabase.from('session_messages').select('*', { count: 'exact', head: true }).eq('is_message_start', true).gte('sent_at', dates.weekStart),
    supabase.from('session_messages').select('*', { count: 'exact', head: true }).eq('is_message_start', true).gte('sent_at', dates.lastWeekStart).lt('sent_at', dates.weekStart),
    
    // Tickets
    supabase.from('tickets').select('*', { count: 'exact', head: true }),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).gte('created_at', dates.weekStart),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).gte('created_at', dates.lastWeekStart).lt('created_at', dates.weekStart),
    
    // Encuestas
    supabase.from('survey').select('*', { count: 'exact', head: true }),
    supabase.from('survey').select('*', { count: 'exact', head: true }).not('survey', 'is', null),
  ]);

  // Extraer conteos
  const totalUsers = totalUsersResult.count ?? 0;
  const usersThisWeek = usersThisWeekResult.count ?? 0;
  const usersLastWeek = usersLastWeekResult.count ?? 0;
  const usersToday = usersTodayResult.count ?? 0;
  const usersYesterday = usersYesterdayResult.count ?? 0;
  
  const totalMessages = totalMessagesResult.count ?? 0;
  const messagesThisWeek = messagesThisWeekResult.count ?? 0;
  const messagesLastWeek = messagesLastWeekResult.count ?? 0;
  const userMessages = userMessagesResult.count ?? 0;
  const agentMessages = agentMessagesResult.count ?? 0;
  
  const totalConversations = totalConversationsResult.count ?? 0;
  const conversationsThisWeek = conversationsThisWeekResult.count ?? 0;
  const conversationsLastWeek = conversationsLastWeekResult.count ?? 0;
  
  const totalTickets = totalTicketsResult.count ?? 0;
  const ticketsThisWeek = ticketsThisWeekResult.count ?? 0;
  const ticketsLastWeek = ticketsLastWeekResult.count ?? 0;
  
  const totalSurveys = totalSurveysResult.count ?? 0;
  const surveysCompleted = surveysCompletedResult.count ?? 0;

  // Calcular métricas derivadas
  const avgMessagesPerUser = totalUsers > 0 ? Math.round(totalMessages / totalUsers) : 0;
  const responseRate = totalMessages > 0 ? Math.round((agentMessages / totalMessages) * 100) : 0;

  // Calcular métricas de atenciones
  const atencionesTotales = totalConversations;
  const atencionesN0 = Math.max(0, totalConversations - totalTickets);
  const atencionesN1 = totalTickets;
  
  // Calcular métricas de atenciones esta semana
  const atencionesThisWeek = conversationsThisWeek;
  const atencionesN0ThisWeek = Math.max(0, conversationsThisWeek - ticketsThisWeek);
  const atencionesN1ThisWeek = ticketsThisWeek;
  
  // Calcular métricas de atenciones semana pasada
  const atencionesLastWeek = conversationsLastWeek;
  const atencionesN0LastWeek = Math.max(0, conversationsLastWeek - ticketsLastWeek);
  const atencionesN1LastWeek = ticketsLastWeek;

  // Calcular cambios
  const usersChange = calculateChange(usersThisWeek, usersLastWeek);
  const usersTodayChange = calculateChange(usersToday, usersYesterday);
  const messagesChange = calculateChange(messagesThisWeek, messagesLastWeek);
  const conversationsChange = calculateChange(conversationsThisWeek, conversationsLastWeek);
  const ticketsChange = calculateChange(ticketsThisWeek, ticketsLastWeek);
  
  // Construir KPIs
  const stats: KpiStat[] = [
    // ATENCIONES (primero) - Sin porcentajes comparativos
    {
      id: 'cantidad-atenciones',
      title: 'Cantidad de atenciones',
      value: formatNumber(atencionesTotales),
      change: 0,
      changeType: 'neutral',
      icon: 'support_agent',
      description: 'Total histórico desde el inicio',
      category: 'atenciones',
    },
    {
      id: 'atenciones-n0',
      title: 'Cantidad de atenciones finalizadas en N0',
      value: formatNumber(atencionesN0),
      change: 0,
      changeType: 'neutral',
      icon: 'check_circle',
      description: 'Resueltas sin escalar • Histórico',
      category: 'atenciones',
    },
    {
      id: 'atenciones-n1',
      title: 'Cantidad de atenciones derivadas a N1',
      value: formatNumber(atencionesN1),
      change: 0,
      changeType: 'neutral',
      icon: 'escalator_warning',
      description: 'Escaladas a ticket • Histórico',
      category: 'atenciones',
    },
    // USUARIOS
    {
      id: 'total-users',
      title: 'Usuarios Totales',
      value: formatNumber(totalUsers),
      change: usersChange.change,
      changeType: usersChange.type,
      icon: 'people',
      description: `${formatNumber(usersThisWeek)} nuevos esta semana`,
      category: 'users',
    },
    {
      id: 'users-today',
      title: 'Usuarios Nuevos Hoy',
      value: formatNumber(usersToday),
      change: usersTodayChange.change,
      changeType: usersTodayChange.type,
      icon: 'person_add',
      description: `${formatNumber(usersYesterday)} ayer`,
      category: 'users',
    },
    {
      id: 'total-messages',
      title: 'Mensajes Totales',
      value: formatNumber(totalMessages),
      change: messagesChange.change,
      changeType: messagesChange.type,
      icon: 'chat',
      description: `${formatNumber(messagesThisWeek)} esta semana`,
      category: 'messages',
    },
    {
      id: 'conversations',
      title: 'Conversaciones',
      value: formatNumber(totalConversations),
      change: conversationsChange.change,
      changeType: conversationsChange.type,
      icon: 'forum',
      description: `${formatNumber(conversationsThisWeek)} iniciadas esta semana`,
      category: 'messages',
    },
    {
      id: 'avg-messages',
      title: 'Promedio Msgs/Usuario',
      value: avgMessagesPerUser,
      change: 0,
      changeType: 'neutral',
      icon: 'analytics',
      description: `${formatNumber(userMessages)} de usuarios, ${formatNumber(agentMessages)} de agente`,
      category: 'messages',
    },
    {
      id: 'response-rate',
      title: 'Tasa de Respuesta',
      value: `${responseRate}%`,
      change: 0,
      changeType: responseRate >= 50 ? 'positive' : 'negative',
      icon: 'speed',
      description: 'Mensajes del agente vs total',
      category: 'messages',
    },
    {
      id: 'total-tickets',
      title: 'Tickets Creados',
      value: formatNumber(totalTickets),
      change: ticketsChange.change,
      changeType: ticketsChange.type,
      icon: 'confirmation_number',
      description: `${formatNumber(ticketsThisWeek)} esta semana`,
      category: 'tickets',
    },
    {
      id: 'total-surveys',
      title: 'Encuestas',
      value: formatNumber(totalSurveys),
      change: 0,
      changeType: 'neutral',
      icon: 'poll',
      description: `${formatNumber(surveysCompleted)} completadas`,
      category: 'surveys',
    },
  ];

  return stats;
}

// Datos mock para cuando Supabase no está configurado
function getMockStats(): KpiStat[] {
  return [
    // ATENCIONES
    {
      id: 'cantidad-atenciones',
      title: 'Cantidad de atenciones',
      value: '—',
      change: 0,
      changeType: 'neutral',
      icon: 'support_agent',
      description: 'Configura Supabase para ver datos reales',
      category: 'atenciones',
    },
    {
      id: 'atenciones-n0',
      title: 'Cantidad de atenciones finalizadas en N0',
      value: '—',
      change: 0,
      changeType: 'neutral',
      icon: 'check_circle',
      description: 'Configura Supabase para ver datos reales',
      category: 'atenciones',
    },
    {
      id: 'atenciones-n1',
      title: 'Cantidad de atenciones derivadas a N1',
      value: '—',
      change: 0,
      changeType: 'neutral',
      icon: 'escalator_warning',
      description: 'Configura Supabase para ver datos reales',
      category: 'atenciones',
    },
    // USUARIOS
    {
      id: 'total-users',
      title: 'Usuarios Totales',
      value: '—',
      change: 0,
      changeType: 'neutral',
      icon: 'people',
      description: 'Configura Supabase para ver datos reales',
      category: 'users',
    },
    {
      id: 'users-today',
      title: 'Usuarios Hoy',
      value: '—',
      change: 0,
      changeType: 'neutral',
      icon: 'person_add',
      description: 'Configura Supabase para ver datos reales',
      category: 'users',
    },
    {
      id: 'total-messages',
      title: 'Mensajes Totales',
      value: '—',
      change: 0,
      changeType: 'neutral',
      icon: 'chat',
      description: 'Configura Supabase para ver datos reales',
      category: 'messages',
    },
    {
      id: 'conversations',
      title: 'Conversaciones',
      value: '—',
      change: 0,
      changeType: 'neutral',
      icon: 'forum',
      description: 'Configura Supabase para ver datos reales',
      category: 'messages',
    },
    {
      id: 'avg-messages',
      title: 'Promedio Msgs/Usuario',
      value: '—',
      change: 0,
      changeType: 'neutral',
      icon: 'analytics',
      description: 'Configura Supabase para ver datos reales',
      category: 'messages',
    },
    {
      id: 'response-rate',
      title: 'Tasa de Respuesta',
      value: '—',
      change: 0,
      changeType: 'neutral',
      icon: 'speed',
      description: 'Configura Supabase para ver datos reales',
      category: 'messages',
    },
    {
      id: 'total-tickets',
      title: 'Tickets Creados',
      value: '—',
      change: 0,
      changeType: 'neutral',
      icon: 'confirmation_number',
      description: 'Configura Supabase para ver datos reales',
      category: 'tickets',
    },
    {
      id: 'total-surveys',
      title: 'Encuestas',
      value: '—',
      change: 0,
      changeType: 'neutral',
      icon: 'poll',
      description: 'Configura Supabase para ver datos reales',
      category: 'surveys',
    },
  ];
}

export async function GET() {
  try {
    // Verificar si Supabase Server está configurado (Service Role Key)
    if (!isSupabaseServerConfigured()) {
      return NextResponse.json({
        success: true,
        data: getMockStats(),
        configured: false,
        message: 'Supabase no configurado. Usa datos mock.',
        timestamp: new Date().toISOString(),
      });
    }

    const stats = await getStatsFromSupabase();

    return NextResponse.json({
      success: true,
      data: stats,
      configured: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        data: getMockStats(),
        configured: false,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Configurar como ruta dinámica (no se prerenderiza en build)
export const dynamic = 'force-dynamic';
