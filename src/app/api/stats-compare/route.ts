import { NextResponse } from 'next/server';
import {
  getSupabaseServerClient,
  getSupabasePreprodClient,
  isSupabaseServerConfigured,
  isSupabasePreprodConfigured,
} from '@/lib/supabase-server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { KpiStat } from '@/types/database';

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

  return {
    todayStart: todayStart.toISOString(),
    yesterdayStart: yesterdayStart.toISOString(),
    weekStart: weekStart.toISOString(),
    lastWeekStart: lastWeekStart.toISOString(),
  };
}

function calculateChange(
  current: number,
  previous: number,
): { change: number; type: 'positive' | 'negative' | 'neutral' } {
  if (previous === 0) {
    return { change: current > 0 ? 100 : 0, type: current > 0 ? 'positive' : 'neutral' };
  }
  const change = ((current - previous) / previous) * 100;
  return {
    change: Math.round(change * 10) / 10,
    type: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
  };
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString('es-ES');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchStatsFromClient(supabase: SupabaseClient<any>): Promise<KpiStat[]> {
  const dates = getDateRanges();

  const [
    totalUsersResult,
    usersThisWeekResult,
    usersLastWeekResult,
    usersTodayResult,
    usersYesterdayResult,
    totalMessagesResult,
    messagesThisWeekResult,
    messagesLastWeekResult,
    userMessagesResult,
    agentMessagesResult,
    totalConversationsResult,
    conversationsThisWeekResult,
    conversationsLastWeekResult,
    totalTicketsResult,
    ticketsThisWeekResult,
    ticketsLastWeekResult,
    totalSurveysResult,
    surveysCompletedResult,
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', dates.weekStart),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', dates.lastWeekStart).lt('created_at', dates.weekStart),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', dates.todayStart),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', dates.yesterdayStart).lt('created_at', dates.todayStart),
    supabase.from('session_messages').select('*', { count: 'exact', head: true }),
    supabase.from('session_messages').select('*', { count: 'exact', head: true }).gte('sent_at', dates.weekStart),
    supabase.from('session_messages').select('*', { count: 'exact', head: true }).gte('sent_at', dates.lastWeekStart).lt('sent_at', dates.weekStart),
    supabase.from('session_messages').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('session_messages').select('*', { count: 'exact', head: true }).eq('role', 'agent'),
    supabase.from('session_messages').select('*', { count: 'exact', head: true }).eq('is_message_start', true),
    supabase.from('session_messages').select('*', { count: 'exact', head: true }).eq('is_message_start', true).gte('sent_at', dates.weekStart),
    supabase.from('session_messages').select('*', { count: 'exact', head: true }).eq('is_message_start', true).gte('sent_at', dates.lastWeekStart).lt('sent_at', dates.weekStart),
    supabase.from('tickets').select('*', { count: 'exact', head: true }),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).gte('created_at', dates.weekStart),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).gte('created_at', dates.lastWeekStart).lt('created_at', dates.weekStart),
    supabase.from('survey').select('*', { count: 'exact', head: true }),
    supabase.from('survey').select('*', { count: 'exact', head: true }).not('survey', 'is', null),
  ]);

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

  const avgMessagesPerUser = totalUsers > 0 ? Math.round(totalMessages / totalUsers) : 0;
  const responseRate = totalMessages > 0 ? Math.round((agentMessages / totalMessages) * 100) : 0;

  const atencionesTotales = totalConversations;
  const atencionesN0 = Math.max(0, totalConversations - totalTickets);
  const atencionesN1 = totalTickets;

  const usersChange = calculateChange(usersThisWeek, usersLastWeek);
  const usersTodayChange = calculateChange(usersToday, usersYesterday);
  const messagesChange = calculateChange(messagesThisWeek, messagesLastWeek);
  const conversationsChange = calculateChange(conversationsThisWeek, conversationsLastWeek);
  const ticketsChange = calculateChange(ticketsThisWeek, ticketsLastWeek);

  return [
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
      title: 'Atenciones finalizadas en N0',
      value: formatNumber(atencionesN0),
      change: 0,
      changeType: 'neutral',
      icon: 'check_circle',
      description: 'Resueltas sin escalar • Histórico',
      category: 'atenciones',
    },
    {
      id: 'atenciones-n1',
      title: 'Atenciones derivadas a N1',
      value: formatNumber(atencionesN1),
      change: 0,
      changeType: 'neutral',
      icon: 'escalator_warning',
      description: 'Escaladas a ticket • Histórico',
      category: 'atenciones',
    },
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
}

type KpiCategory = KpiStat['category'];

function getEmptyStats(): KpiStat[] {
  const ids: Array<{ id: string; title: string; icon: string; category: KpiCategory }> = [
    { id: 'cantidad-atenciones', title: 'Cantidad de atenciones', icon: 'support_agent', category: 'atenciones' },
    { id: 'atenciones-n0', title: 'Atenciones finalizadas en N0', icon: 'check_circle', category: 'atenciones' },
    { id: 'atenciones-n1', title: 'Atenciones derivadas a N1', icon: 'escalator_warning', category: 'atenciones' },
    { id: 'total-users', title: 'Usuarios Totales', icon: 'people', category: 'users' },
    { id: 'users-today', title: 'Usuarios Nuevos Hoy', icon: 'person_add', category: 'users' },
    { id: 'total-messages', title: 'Mensajes Totales', icon: 'chat', category: 'messages' },
    { id: 'conversations', title: 'Conversaciones', icon: 'forum', category: 'messages' },
    { id: 'avg-messages', title: 'Promedio Msgs/Usuario', icon: 'analytics', category: 'messages' },
    { id: 'response-rate', title: 'Tasa de Respuesta', icon: 'speed', category: 'messages' },
    { id: 'total-tickets', title: 'Tickets Creados', icon: 'confirmation_number', category: 'tickets' },
    { id: 'total-surveys', title: 'Encuestas', icon: 'poll', category: 'surveys' },
  ];
  return ids.map(({ id, title, icon, category }) => ({
    id,
    title,
    value: '—',
    change: 0,
    changeType: 'neutral' as const,
    icon,
    description: 'No configurado',
    category,
  }));
}

export interface CompareResponse {
  success: boolean;
  prod: KpiStat[];
  preprod: KpiStat[];
  prodConfigured: boolean;
  preprodConfigured: boolean;
  prodError?: string;
  preprodError?: string;
  timestamp: string;
}

export async function GET(): Promise<NextResponse<CompareResponse>> {
  const prodConfigured = isSupabaseServerConfigured();
  const preprodConfigured = isSupabasePreprodConfigured();

  const [prodResult, preprodResult] = await Promise.allSettled([
    prodConfigured ? fetchStatsFromClient(getSupabaseServerClient()) : Promise.resolve(getEmptyStats()),
    preprodConfigured ? fetchStatsFromClient(getSupabasePreprodClient()) : Promise.resolve(getEmptyStats()),
  ]);

  const prod = prodResult.status === 'fulfilled' ? prodResult.value : getEmptyStats();
  const preprod = preprodResult.status === 'fulfilled' ? preprodResult.value : getEmptyStats();

  return NextResponse.json({
    success: true,
    prod,
    preprod,
    prodConfigured,
    preprodConfigured,
    prodError: prodResult.status === 'rejected' ? String(prodResult.reason) : undefined,
    preprodError: preprodResult.status === 'rejected' ? String(preprodResult.reason) : undefined,
    timestamp: new Date().toISOString(),
  });
}

export const dynamic = 'force-dynamic';
