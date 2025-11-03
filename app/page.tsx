/**
 * Home Page
 * Main entry point - redirects to inbox or login
 */
'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/inbox');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Unified Inbox</h1>
          <p className="text-gray-600 mb-8">Your multi-channel customer outreach platform</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="font-semibold text-blue-900 mb-2">📱 SMS & WhatsApp</h2>
              <p className="text-sm text-blue-700">Send and receive messages via Twilio</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="font-semibold text-green-900 mb-2">📧 Email</h2>
              <p className="text-sm text-green-700">Unified email management</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h2 className="font-semibold text-purple-900 mb-2">👥 Social Media</h2>
              <p className="text-sm text-purple-700">Twitter, Facebook integration</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <Link href="/auth/signin" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
              Sign In to Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
