'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { RosterApiClient } from '@roster/api-client';
import { RoleWithPermissions, PermissionItem } from '@roster/types';
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Users,
  Key,
  AlertCircle,
  Lock,
  UserCheck,
} from 'lucide-react';

const api = new RosterApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
);

export default function RolesAndPermissionsPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [activeRole, setActiveRole] = useState<RoleWithPermissions | null>(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const me = await api.getMe();
      const resolvedOrgId = me.orgId || me.organization?.id;
      setOrgId(resolvedOrgId);

      if (!resolvedOrgId) {
        setErrorMessage('No active organization detected for this account.');
        return;
      }

      const [rolesData, permsData] = await Promise.all([
        api.getRoles(resolvedOrgId),
        api.getPermissions(resolvedOrgId),
      ]);

      setRoles(rolesData);
      setPermissions(permsData);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load roles and permissions.');
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

  // Group permissions by resource domain (e.g., 'shifts:create' -> 'shifts')
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, PermissionItem[]> = {};
    permissions.forEach((perm) => {
      const [group] = perm.key.split(':');
      const normalizedGroup = group ? group.replace('_', ' ') : 'general';
      if (!groups[normalizedGroup]) {
        groups[normalizedGroup] = [];
      }
      groups[normalizedGroup].push(perm);
    });
    return groups;
  }, [permissions]);

  const openCreateModal = () => {
    setRoleName('');
    setSelectedPermissionIds([]);
    setActiveRole(null);
    setModalMode('create');
    setErrorMessage(null);
  };

  const openEditModal = (role: RoleWithPermissions) => {
    setRoleName(role.name);
    setSelectedPermissionIds(role.permissions.map((p) => p.id));
    setActiveRole(role);
    setModalMode('edit');
    setErrorMessage(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setActiveRole(null);
    setRoleName('');
    setSelectedPermissionIds([]);
  };

  const togglePermission = (id: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id],
    );
  };

  const toggleAllInGroup = (perms: PermissionItem[]) => {
    const ids = perms.map((p) => p.id);
    const allSelected = ids.every((id) => selectedPermissionIds.includes(id));

    if (allSelected) {
      setSelectedPermissionIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedPermissionIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim() || !orgId) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);

      if (modalMode === 'create') {
        await api.createRole(orgId, {
          name: roleName.trim(),
          permissionIds: selectedPermissionIds,
        });
      } else if (modalMode === 'edit' && activeRole) {
        await api.updateRole(orgId, activeRole.id, {
          name: activeRole.isSystemRole ? undefined : roleName.trim(),
          permissionIds: selectedPermissionIds,
        });
      }

      closeModal();
      await loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to persist role.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (role: RoleWithPermissions) => {
    if (!orgId || !confirm(`Are you sure you want to delete role '${role.name}'?`)) return;

    try {
      setErrorMessage(null);
      await api.deleteRole(orgId, role.id);
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to delete role.');
    }
  };

  if (loading) {
    return <div className="text-neutral-400 text-sm">Loading RBAC matrix...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Configure tenant-level access tiers, system policies, and capability keys.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Role</span>
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

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {roles.map((role) => (
          <div
            key={role.id}
            className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/50 flex flex-col justify-between hover:border-neutral-700 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-neutral-800 text-emerald-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-neutral-100">{role.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {role.isSystemRole ? (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider text-amber-400 bg-amber-950/50 border border-amber-900/50 px-1.5 py-0.5 rounded">
                          <Lock className="w-2.5 h-2.5" /> System Preset
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                          Custom Role
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {role.name.toLowerCase() !== 'owner' && (
                    <button
                      onClick={() => openEditModal(role)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-md transition-colors"
                      title="Edit Permissions"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!role.isSystemRole && (
                    <button
                      onClick={() => handleDelete(role)}
                      className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-md transition-colors"
                      title="Delete Role"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-neutral-800/80 text-xs">
                <div className="flex items-center gap-1.5 text-neutral-400">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  <span>{role.userCount} member(s)</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-400">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>{role.permissions.length} capabilities</span>
                </div>
              </div>

              {role.lastUpdatedBy && (
                <div className="mt-3 flex items-center gap-1 text-[11px] text-neutral-500">
                  <UserCheck className="w-3 h-3" />
                  <span>Updated by {role.lastUpdatedBy.fullName}</span>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-1.5">
                {role.name.toLowerCase() === 'owner' ? (
                  <span className="text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded-md">
                    Full Platform Control (*)
                  </span>
                ) : role.permissions.length === 0 ? (
                  <span className="text-[11px] text-neutral-500 italic">
                    No active capabilities
                  </span>
                ) : (
                  role.permissions.slice(0, 4).map((p) => (
                    <span
                      key={p.id}
                      className="text-[11px] font-mono text-neutral-300 bg-neutral-800/80 border border-neutral-700/60 px-2 py-0.5 rounded-md"
                    >
                      {p.key}
                    </span>
                  ))
                )}
                {role.permissions.length > 4 && (
                  <span className="text-[11px] font-mono text-neutral-500 bg-neutral-800/40 px-1.5 py-0.5 rounded-md">
                    +{role.permissions.length - 4} more
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Permission Matrix Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-neutral-800">
              <h2 className="text-lg font-bold">
                {modalMode === 'create' ? 'Create Custom Role' : `Edit: ${activeRole?.name}`}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Assign capabilities to establish this role&apos;s authorization boundaries.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Role Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(activeRole?.isSystemRole)}
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g. Shift Lead, Floor Auditor"
                  className="w-full px-3 py-2 bg-neutral-800 disabled:opacity-60 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
                {activeRole?.isSystemRole && (
                  <span className="text-[11px] text-amber-500/90 mt-1 block">
                    System role titles are immutable.
                  </span>
                )}
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Capability Registry
                  </span>
                  <span className="text-xs text-neutral-400">
                    {selectedPermissionIds.length} of {permissions.length} granted
                  </span>
                </div>

                {Object.entries(groupedPermissions).map(([category, perms]) => {
                  const allSelected = perms.every((p) =>
                    selectedPermissionIds.includes(p.id),
                  );

                  return (
                    <div
                      key={category}
                      className="border border-neutral-800 rounded-xl p-4 bg-neutral-950/40 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-neutral-200">
                          {category}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleAllInGroup(perms)}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
                        >
                          {allSelected ? 'Revoke All' : 'Grant All'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {perms.map((perm) => {
                          const isChecked = selectedPermissionIds.includes(perm.id);
                          return (
                            <label
                              key={perm.id}
                              className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-emerald-950/20 border-emerald-800/60 text-neutral-200'
                                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(perm.id)}
                                className="w-3.5 h-3.5 rounded border-neutral-700 bg-neutral-800 text-emerald-600 focus:ring-0"
                              />
                              <span className="font-mono text-[11px]">{perm.key}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="sticky bottom-0 pt-4 bg-neutral-900 border-t border-neutral-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  {submitting ? 'Saving...' : modalMode === 'create' ? 'Create Role' : 'Save Capabilities'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}