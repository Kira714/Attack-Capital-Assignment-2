/**
 * Settings Page
 * Configure integrations and view Twilio phone numbers
 */
'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, CheckCircle2, AlertCircle, Loader2, Users, ShoppingCart, Phone } from 'lucide-react';
import { signOut, useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('integrations');
  const [showNumbers, setShowNumbers] = useState(false);
  const queryClient = useQueryClient();

  // Fetch Twilio configuration
  const { data: twilioData, isLoading: twilioLoading } = useQuery({
    queryKey: ['twilio-config'],
    queryFn: async () => {
      const res = await fetch('/api/settings/twilio');
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Fetch available Twilio numbers
  const { data: numbersData, isLoading: numbersLoading } = useQuery({
    queryKey: ['twilio-numbers'],
    queryFn: async () => {
      const res = await fetch('/api/twilio/numbers');
      if (!res.ok) return { available: [], purchased: [] };
      return res.json();
    },
    enabled: showNumbers && twilioData?.configured,
  });

  // Purchase phone number mutation
  const purchaseMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const res = await fetch('/api/twilio/numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to purchase number');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['twilio-config'] });
      queryClient.invalidateQueries({ queryKey: ['twilio-numbers'] });
      setShowNumbers(false);
    },
  });

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
          <button
            onClick={() => router.push('/inbox')}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            Back to Inbox
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'integrations'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Integrations
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'general'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'account'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Account
          </button>
        </div>

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            {/* Twilio SMS/WhatsApp */}
            <IntegrationCard
              name="Twilio SMS & WhatsApp"
              description="Send and receive SMS and WhatsApp messages"
              status={twilioData?.configured ? 'configured' : 'not_configured'}
              isLoading={twilioLoading}
            >
              {twilioData?.configured ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-900">Trial Number Active</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Your Twilio number: <span className="font-mono font-semibold">{twilioData.phoneNumber}</span>
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        You can send messages to verified contacts in Twilio sandbox
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href="https://console.twilio.com/us1/develop/sms/try-it-out/send-an-sms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      <Phone className="w-4 h-4" />
                      Try It Out
                    </a>
                    <button
                      onClick={() => setShowNumbers(!showNumbers)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {showNumbers ? 'Hide' : 'Buy More'}
                    </button>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800 mb-2">
                      <strong>Sandbox Mode:</strong> Join the WhatsApp sandbox
                    </p>
                    <a
                      href="https://console.twilio.com/us1/develop/sms/sandbox"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Open WhatsApp Sandbox →
                    </a>
                  </div>

                  {showNumbers && (
                    <div className="space-y-3">
                      {numbersLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        </div>
                      ) : numbersData?.available?.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Available to Purchase:</p>
                          {numbersData.available.slice(0, 10).map((num: any) => (
                            <div key={num.phoneNumber} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-gray-600" />
                                <div>
                                  <p className="font-mono text-sm font-semibold">{num.phoneNumber}</p>
                                  <p className="text-xs text-gray-600">{num.locality}, {num.region}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (confirm(`Purchase ${num.phoneNumber}?`)) {
                                    purchaseMutation.mutate(num.phoneNumber);
                                  }
                                }}
                                disabled={purchaseMutation.isPending}
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                              >
                                {purchaseMutation.isPending ? 'Purchasing...' : 'Buy Now'}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-sm text-gray-500">
                          No available numbers found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    Configure your Twilio credentials in the <code className="font-mono bg-yellow-100 px-1 rounded">.env</code> file
                  </p>
                  <p className="text-xs text-yellow-700 mt-2">
                    Need help? <a href="/TWILIO_SETUP.md" className="underline">View setup guide</a>
                  </p>
                </div>
              )}
            </IntegrationCard>

            {/* Email (Resend) */}
            <IntegrationCard
              name="Email (Resend)"
              description="Send and receive emails via Resend API"
              status="not_configured"
            >
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Add your Resend API key to enable email sending:
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="re_xxxxxxxxxxxxx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled
                  />
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            </IntegrationCard>

            {/* Twitter/X */}
            <IntegrationCard
              name="Twitter/X DMs"
              description="Send and receive direct messages on Twitter/X"
              status="not_configured"
            >
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Connect your Twitter API credentials:
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="API Key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled
                  />
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            </IntegrationCard>

            {/* Facebook Messenger */}
            <IntegrationCard
              name="Facebook Messenger"
              description="Send and receive messages via Facebook Messenger"
              status="not_configured"
            >
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Connect your Facebook App credentials:
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="App ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled
                  />
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            </IntegrationCard>

            {/* HubSpot */}
            <IntegrationCard
              name="HubSpot CRM"
              description="Sync contacts and manage deals"
              status="not_configured"
            >
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Connect your HubSpot API key:
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="api_key_here"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled
                  />
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            </IntegrationCard>

            {/* Slack */}
            <IntegrationCard
              name="Slack Notifications"
              description="Get notified of new messages via Slack"
              status="not_configured"
            >
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Add your Slack webhook URL:
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled
                  />
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            </IntegrationCard>
          </div>
        )}

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Management</h2>
              <a href="/contacts" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Users className="w-4 h-4" />
                Find & Merge Duplicate Contacts
              </a>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Settings</h2>
              <p className="text-sm text-gray-600">Team management features coming soon</p>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-sm text-gray-900">{session.user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <p className="text-sm text-gray-900 capitalize">{session.user.role}</p>
                </div>
                {session.user.name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <p className="text-sm text-gray-900">{session.user.name}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Danger Zone</h2>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function IntegrationCard({
  name,
  description,
  status,
  isLoading,
  children,
}: {
  name: string;
  description: string;
  status: 'configured' | 'not_configured' | 'error';
  isLoading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        ) : status === 'configured' ? (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        ) : status === 'error' ? (
          <AlertCircle className="w-5 h-5 text-red-600" />
        ) : (
          <AlertCircle className="w-5 h-5 text-gray-400" />
        )}
      </div>
      {children}
    </div>
  );
}

