/**
 * Analytics Dashboard
 * Display metrics and engagement stats
 */
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, MessageSquare, Clock, CheckCircle2, AlertCircle, Loader2, Download, Shield, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, all

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?range=${timeRange}`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      // Redirect non-admins to inbox
      router.push('/inbox');
    }
  }, [status, session, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Check if user is admin
  if (session.user?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            Analytics dashboard is only available to administrators.
          </p>
          <button
            onClick={() => router.push('/inbox')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Inbox
          </button>
        </div>
      </div>
    );
  }

  const channelColors: Record<string, string> = {
    SMS: '#3B82F6',
    WHATSAPP: '#22C55E',
    EMAIL: '#A855F7',
    TWITTER: '#0EA5E9',
    FACEBOOK: '#6366F1',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
            <button
              onClick={() => {
                window.open(`/api/analytics/export?range=${timeRange}&format=csv`, '_blank');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => router.push('/inbox')}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Back to Inbox
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<MessageSquare className="w-5 h-5" />}
            label="Total Messages"
            value={analytics?.totalMessages || 0}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Response Rate"
            value={`${analytics?.responseRate || 0}%`}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Avg Response Time"
            value={analytics?.avgResponseTime || '0m'}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            label="Delivery Rate"
            value={`${analytics?.deliveryRate || 0}%`}
            color="text-indigo-600"
            bgColor="bg-indigo-50"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Messages by Channel */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Messages by Channel</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.channelBreakdown || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sent" fill="#3B82F6" name="Sent" />
                <Bar dataKey="received" fill="#22C55E" name="Received" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Messages Over Time */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Messages Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.messagesOverTime || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="messages" stroke="#3B82F6" name="Messages" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Channel Distribution Pie */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Channel Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics?.channelDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name}: ${((entry.percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(analytics?.channelDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={channelColors[entry.channel] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Contacts */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Contacts</h2>
            <div className="space-y-3">
              {(analytics?.topContacts || []).slice(0, 5).map((contact: any, index: number) => (
                <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                      {contact.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-xs text-gray-500">{contact.channel} • {contact.messageCount} messages</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">#{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, bgColor }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`${bgColor} p-3 rounded-lg`}>
          <div className={color}>{icon}</div>
        </div>
        {typeof value === 'number' && value > 0 && (
          <TrendingUp className="w-5 h-5 text-green-600" />
        )}
      </div>
      <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

