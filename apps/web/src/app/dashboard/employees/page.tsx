'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RosterApiClient } from '@roster/api-client';
import { Position, RoleWithPermissions } from '@roster/types';
import {
  UserPlus,
  Mail,
  Phone,
  Shield,
  Briefcase,
  MapPin,
  Building,
  AlertCircle,
  Search,
} from 'lucide-react';

const api = new RosterApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
);

interface EmployeeDirectoryItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  roleName: string;
  scopeType: 'organization' | 'location';
  scopeId?: string;
  positions: Array<{ id: string; name: string; hourlyRate?: string | number | null }>;
  createdAt: string;
}

interface LocationSummary {
  id: string;
  name: string;
}

export default function EmployeesPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeDirectoryItem[]>([]);
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [locations, setLocations] = useState<LocationSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Onboard Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    roleName: '',
    scopeType: 'organization' as 'organization' | 'location',
    scopeId: '',
    positionIds: [] as string[],
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const me = await api.getMe();
      const resolvedOrgId = me.orgId || me.organization?.id;
      setOrgId(resolvedOrgId);

      if (!resolvedOrgId) {
        setErrorMessage('No active organization context found.');
        return;
      }

      // Pass resolvedOrgId so the URL resolves correctly
      const [rawEmployees, rolesRes, positionsRes, locationsRes] = await Promise.all([
        api.getEmployees(resolvedOrgId).catch(() => []),
        api.getRoles(resolvedOrgId).catch(() => []),
        api.getPositions(resolvedOrgId).catch(() => []),
        api.getLocations().catch(() => []),
      ]);

      // Normalize raw Prisma response into flat table schema
      const normalizedEmployees: EmployeeDirectoryItem[] = (rawEmployees || []).map((emp: any) => {
        const activeRole = emp.userRoles?.[0];
        return {
          id: emp.id,
          fullName: emp.fullName || 'Unnamed Member',
          email: emp.email || '',
          phone: emp.phone || null,
          roleName: emp.roleName ?? activeRole?.role?.name ?? 'Employee',
          scopeType: emp.scopeType ?? activeRole?.scopeType ?? 'organization',
          scopeId: emp.scopeId ?? activeRole?.scopeId ?? resolvedOrgId,
          positions:
            emp.positions ??
            emp.employeePositions?.map((ep: any) => ep.position).filter(Boolean) ??
            [],
          createdAt: emp.createdAt,
        };
      });

      setEmployees(normalizedEmployees);
      setRoles(rolesRes || []);
      setPositions(positionsRes || []);
      setLocations(locationsRes || []);

      if (rolesRes && rolesRes.length > 0) {
        setFormData((prev) => ({
          ...prev,
          roleName: rolesRes[0]?.name || 'Employee',
          scopeId: resolvedOrgId,
        }));
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load employee directory.');
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

  const openOnboardModal = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      roleName: roles[0]?.name || 'Employee',
      scopeType: 'organization',
      scopeId: orgId || '',
      positionIds: [],
    });
    setIsModalOpen(true);
    setErrorMessage(null);
  };

  const handleScopeTypeChange = (type: 'organization' | 'location') => {
    setFormData((prev) => ({
      ...prev,
      scopeType: type,
      scopeId: type === 'organization' ? orgId || '' : locations[0]?.id || '',
    }));
  };

  const togglePosition = (posId: string) => {
    setFormData((prev) => ({
      ...prev,
      positionIds: prev.positionIds.includes(posId)
        ? prev.positionIds.filter((id) => id !== posId)
        : [...prev.positionIds, posId],
    }));
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !formData.fullName.trim() || !formData.email.trim()) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);

      await api.createEmployee({
        orgId,
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        roleName: formData.roleName,
        scopeType: formData.scopeType,
        scopeId: formData.scopeId,
        positionIds: formData.positionIds,
      });

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to onboard employee.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const term = searchQuery.toLowerCase();
    const nameMatch = emp.fullName?.toLowerCase().includes(term) ?? false;
    const emailMatch = emp.email?.toLowerCase().includes(term) ?? false;
    const roleMatch = emp.roleName?.toLowerCase().includes(term) ?? false;
    return nameMatch || emailMatch || roleMatch;
  });

  if (loading) {
    return <div className="text-neutral-400 text-sm">Loading team directory...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Directory</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Manage staff profiles, organizational roles, and qualified positions.
          </p>
        </div>
        <button
          onClick={openOnboardModal}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Onboard Employee</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Counter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm focus:outline-none focus:border-neutral-600 transition-colors"
          />
        </div>
        <div className="text-xs text-neutral-400 self-center">
          Showing <span className="text-neutral-200 font-medium">{filteredEmployees.length}</span> of {employees.length} team members
        </div>
      </div>

      {/* Directory Table */}
      <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/40">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3.5">Employee</th>
              <th className="px-6 py-3.5">Access Role</th>
              <th className="px-6 py-3.5">Scope</th>
              <th className="px-6 py-3.5">Assigned Positions</th>
              <th className="px-6 py-3.5 text-right">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-neutral-500 text-xs">
                  {employees.length === 0
                    ? 'No employees onboarded yet. Click "Onboard Employee" to add team members.'
                    : 'No employees matched your search query.'}
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-neutral-850/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-semibold text-xs text-neutral-300">
                        {emp.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-neutral-200">{emp.fullName}</div>
                        <div className="text-xs text-neutral-500">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-800 border border-neutral-700 text-neutral-300">
                      <Shield className="w-3 h-3 text-emerald-400" />
                      {emp.roleName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
                      {emp.scopeType === 'organization' ? (
                        <Building className="w-3.5 h-3.5 text-sky-400" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span className="capitalize">{emp.scopeType}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(!emp.positions || emp.positions.length === 0) ? (
                        <span className="text-xs text-neutral-500 italic">None assigned</span>
                      ) : (
                        emp.positions.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-neutral-800/90 text-neutral-300 border border-neutral-700/60"
                          >
                            <Briefcase className="w-2.5 h-2.5 text-emerald-400" />
                            {p.name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center justify-end gap-3 text-neutral-400">
                      <a
                        href={`mailto:${emp.email}`}
                        className="hover:text-neutral-200 transition-colors"
                        title={emp.email}
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                      {emp.phone && (
                        <a
                          href={`tel:${emp.phone}`}
                          className="hover:text-neutral-200 transition-colors"
                          title={emp.phone}
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Onboard Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div>
              <h2 className="text-lg font-bold">Onboard Team Member</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Assign account credentials, authorization role, and qualified positions.
              </p>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="Jane Doe"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="jane@company.com"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Phone Number <span className="text-neutral-500">(Optional)</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    System Role <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.roleName}
                    onChange={(e) =>
                      setFormData({ ...formData, roleName: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500 text-neutral-200"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Scope Type <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleScopeTypeChange('organization')}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                        formData.scopeType === 'organization'
                          ? 'bg-emerald-950/40 border-emerald-600 text-emerald-400'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                      }`}
                    >
                      Org-wide
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScopeTypeChange('location')}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                        formData.scopeType === 'location'
                          ? 'bg-emerald-950/40 border-emerald-600 text-emerald-400'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                      }`}
                    >
                      Location
                    </button>
                  </div>
                </div>
              </div>

              {formData.scopeType === 'location' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Assigned Location <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.scopeId}
                    onChange={(e) =>
                      setFormData({ ...formData, scopeId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500 text-neutral-200"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Qualified Positions
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-neutral-950/40 border border-neutral-800 rounded-lg">
                  {positions.length === 0 ? (
                    <span className="text-xs text-neutral-500 col-span-2 py-1">
                      No positions configured yet.
                    </span>
                  ) : (
                    positions.map((pos) => {
                      const isSelected = formData.positionIds.includes(pos.id);
                      return (
                        <button
                          type="button"
                          key={pos.id}
                          onClick={() => togglePosition(pos.id)}
                          className={`flex items-center justify-between p-2 rounded-md border text-xs text-left transition-colors ${
                            isSelected
                              ? 'bg-emerald-950/30 border-emerald-700 text-emerald-300'
                              : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                          }`}
                        >
                          <span className="truncate">{pos.name}</span>
                          {isSelected && <span className="text-emerald-400">✓</span>}
                        </button>
                      );
                    })
                  )}
                </div>
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
                  {submitting ? 'Onboarding...' : 'Onboard Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}