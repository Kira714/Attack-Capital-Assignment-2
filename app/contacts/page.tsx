/**
 * Contacts Management Page
 * Manage and merge duplicate contacts
 */
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Merge, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ContactsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedDuplicates, setSelectedDuplicates] = useState<string[][]>([]);
  const queryClient = useQueryClient();

  const { data: duplicatesData, isLoading } = useQuery({
    queryKey: ['duplicates'],
    queryFn: async () => {
      const res = await fetch('/api/contacts/merge');
      return res.json();
    },
  });

  const mergeMutation = useMutation({
    mutationFn: async ({ primaryId, duplicateIds }: { primaryId: string; duplicateIds: string[] }) => {
      const res = await fetch('/api/contacts/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryId, duplicateIds }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duplicates'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setSelectedDuplicates([]);
    },
  });

  if (status === 'loading' || isLoading) {
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

  const duplicates = duplicatesData?.duplicates || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Contacts Management</h1>
          </div>
          <button
            onClick={() => router.push('/inbox')}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            Back to Inbox
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {duplicates.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Duplicates Found</h2>
            <p className="text-gray-600">Your contacts are clean and organized!</p>
          </div>
        ) : (
          <>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">Found {duplicates.length} duplicate groups</h3>
                <p className="text-sm text-yellow-700">
                  Select contacts to merge. The primary contact will retain all messages and notes.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {duplicates.map((group: any[], groupIndex: number) => (
                <div key={groupIndex} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      Group {groupIndex + 1} - {group.length} duplicates
                    </h3>
                    {selectedDuplicates[groupIndex] && (
                      <button
                        onClick={() => handleMergeGroup(groupIndex)}
                        disabled={mergeMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                      >
                        <Merge className="w-4 h-4" />
                        {mergeMutation.isPending ? 'Merging...' : 'Merge Selected'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {group.map((contact: any) => (
                      <label
                        key={contact.id}
                        className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`group-${groupIndex}`}
                          value={contact.id}
                          onChange={() => {
                            const newSelected = [...selectedDuplicates];
                            newSelected[groupIndex] = group
                              .map(c => c.id)
                              .filter(id => id !== contact.id);
                            setSelectedDuplicates(newSelected);
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {contact.firstName} {contact.lastName}
                          </p>
                          {contact.email && (
                            <p className="text-sm text-gray-600">{contact.email}</p>
                          )}
                          {contact.phone && (
                            <p className="text-sm text-gray-600">{contact.phone}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {contact._count?.messages || 0} messages, {contact._count?.notes || 0} notes
                          </p>
                        </div>
                        {selectedDuplicates[groupIndex]?.[0] === contact.id && (
                          <span className="text-xs font-medium text-blue-600">Primary</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  function handleMergeGroup(groupIndex: number) {
    const duplicateIds = selectedDuplicates[groupIndex];
    if (!duplicateIds || duplicateIds.length === 0) return;

    const group = duplicatesData?.duplicates?.[groupIndex];
    const primaryId = group?.find((c: any) => !duplicateIds.includes(c.id))?.id;
    
    if (!primaryId) return;

    mergeMutation.mutate({ primaryId, duplicateIds });
  }
}

