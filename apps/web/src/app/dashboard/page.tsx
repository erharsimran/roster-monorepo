'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { RosterApiClient } from '@roster/api-client';
import { Position, Employee, SetupOrgDto } from '@roster/types';
import { Briefcase, Users, Building2, Plus, ArrowRight, CheckCircle2 } from 'lucide-react';

const api = new RosterApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Setup Org Form State
  const [form, setForm] = useState<SetupOrgDto>({
    organizationName: '',
    primaryLocationName: '',
    address: '',
    timezone: '',
  });
  const [settingUp, setSettingUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const userProfile = await api.getMe();
      setProfile(userProfile);

      // Verify org strictly from user profile
      if (userProfile.orgId || userProfile.organization?.id) {
        localStorage.setItem('orgId', userProfile.orgId || userProfile.organization.id);

        const [positionsRes, employeesRes] = await Promise.all([
            api.getPositions(userProfile.organization.id),
            api.getEmployees(userProfile.organization.id).catch(() => []),
        ]);
        setPositions(positionsRes);
        setEmployees(employeesRes);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to authenticate user.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.setToken(token);
      loadDashboardData();
    }
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    setForm((prev) => ({ ...prev, timezone: detectedTimezone }));
  }, []);

  const handleBootstrapOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      setSettingUp(true);
      const payload: SetupOrgDto = {
        organizationName: form.organizationName.trim(),
        primaryLocationName: form.primaryLocationName.trim(),
        timezone: form.timezone || 'UTC',
        ...(form.address?.trim() ? { address: form.address.trim() } : {}),
      };

      await api.setupOrganization(payload);
      await loadDashboardData();
    } catch (err: any) {
      const rawMessage = err.response?.data?.message;
      setErrorMessage(Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage || 'Failed to setup org.');
    } finally {
      setSettingUp(false);
    }
  };

  if (loading) {
    return <div className="text-neutral-400 text-sm">Loading admin dashboard...</div>;
  }

  const hasOrganization = Boolean(profile?.orgId || profile?.organization?.id);

  if (!hasOrganization) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400 mb-6">
            <Building2 className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-bold tracking-tight">Create your Organization</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Configure your company workspace and default branch location.
          </p>

          {errorMessage && (
            <div className="mt-4 p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleBootstrapOrg} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Organization Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={form.organizationName}
                onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                placeholder="Apex Logistics Inc."
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Primary Branch Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={form.primaryLocationName}
                onChange={(e) => setForm({ ...form, primaryLocationName: e.target.value })}
                placeholder="Main Distribution Hub"
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={settingUp}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors mt-2"
            >
              {settingUp ? 'Bootstrapping workspace...' : 'Bootstrap Organization'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Console</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Workspace for <span className="text-neutral-200 font-medium">{profile.organization?.name || 'Your Company'}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Configured Roles</span>
              <p className="text-3xl font-bold mt-2">{positions.length}</p>
            </div>
            <div className="p-3 bg-neutral-800 text-emerald-400 rounded-xl">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between">
            <Link
              href="/dashboard/positions"
              className="text-xs text-neutral-300 hover:text-emerald-400 font-medium flex items-center gap-1.5 transition-colors"
            >
              <span>Manage positions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Total Staff</span>
              <p className="text-3xl font-bold mt-2">{employees.length}</p>
            </div>
            <div className="p-3 bg-neutral-800 text-sky-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between">
            <Link
              href="/dashboard/employees"
              className="text-xs text-neutral-300 hover:text-sky-400 font-medium flex items-center gap-1.5 transition-colors"
            >
              <span>Manage directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/40">
        <h2 className="text-base font-semibold">Deployment Checklist</h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-900 border border-neutral-800">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium">Organization Created</p>
                <p className="text-xs text-neutral-400">{profile.organization?.name || 'Completed'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-900 border border-neutral-800">
            <div className="flex items-center gap-3">
              <CheckCircle2 className={`w-5 h-5 ${positions.length > 0 ? 'text-emerald-500' : 'text-neutral-600'}`} />
              <div>
                <p className="text-sm font-medium">Define Positions & Pay Rates</p>
                <p className="text-xs text-neutral-400">{positions.length} configured</p>
              </div>
            </div>
            <Link
              href="/dashboard/positions"
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Position</span>
            </Link>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-900 border border-neutral-800">
            <div className="flex items-center gap-3">
              <CheckCircle2 className={`w-5 h-5 ${employees.length > 0 ? 'text-emerald-500' : 'text-neutral-600'}`} />
              <div>
                <p className="text-sm font-medium">Onboard Employees</p>
                <p className="text-xs text-neutral-400">{employees.length} team members</p>
              </div>
            </div>
            <Link
              href="/dashboard/employees"
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Onboard Staff</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}