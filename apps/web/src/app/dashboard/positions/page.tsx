'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RosterApiClient } from '@roster/api-client';
import { Briefcase, Plus, Trash2, ShieldCheck, DollarSign, AlertCircle } from 'lucide-react';

const api = new RosterApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');

interface PositionItem {
  id: string;
  orgId: string;
  name: string;
  hourlyRate: number | string | null;
  isLeadership?: boolean;
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [isLeadership, setIsLeadership] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const me = await api.getMe();
      const resolvedOrgId = me.orgId || me.organization?.id;
      setOrgId(resolvedOrgId);

      if (resolvedOrgId) {
        const list = await api.getPositions(resolvedOrgId);
        setPositions(list);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load positions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.setToken(token);
      loadData();
    }
  }, [loadData]);

  const handleCreatePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !name.trim()) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);

      await api.createPosition({
        orgId,
        name: name.trim(),
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        isLeadership,
      });

      setName('');
      setHourlyRate('');
      setIsLeadership(false);
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to create position.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePosition = async (id: string) => {
    if (!confirm('Are you sure you want to delete this position?')) return;

    try {
      await api.deletePosition(id);
      setPositions((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cannot delete position with active shifts.');
    }
  };

  if (loading) {
    return <div className="text-neutral-400 text-sm">Loading positions...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Job Positions</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Define organizational roles, default wage rates, and leadership tiers.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Position</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Positions Table */}
      <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/40">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3.5">Position Name</th>
              <th className="px-6 py-3.5">Hourly Rate</th>
              <th className="px-6 py-3.5">Tier</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {positions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-neutral-500 text-xs">
                  No positions created yet. Click &quot;Add Position&quot; to configure your first job role.
                </td>
              </tr>
            ) : (
              positions.map((pos) => (
                <tr key={pos.id} className="hover:bg-neutral-850/50 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-neutral-800 text-emerald-400">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <span>{pos.name}</span>
                  </td>
                  <td className="px-6 py-4 text-neutral-300">
                    {pos.hourlyRate ? `$${Number(pos.hourlyRate).toFixed(2)}/hr` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {pos.isLeadership ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-800/60">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Leadership
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">Standard</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeletePosition(pos.id)}
                      className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-md transition-colors"
                      title="Delete Position"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Position Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div>
              <h2 className="text-lg font-bold">Add New Position</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Set operational requirements and default pay tier.
              </p>
            </div>

            <form onSubmit={handleCreatePosition} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Position Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Line Cook, Cashier, Supervisor"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Default Hourly Rate ($)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="18.50"
                    className="w-full pl-9 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="leadership"
                  checked={isLeadership}
                  onChange={(e) => setIsLeadership(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-emerald-600 focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="leadership" className="text-xs text-neutral-300 select-none cursor-pointer">
                  Designate as Leadership position (can satisfy leadership-on-duty rules)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  {submitting ? 'Saving...' : 'Save Position'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}