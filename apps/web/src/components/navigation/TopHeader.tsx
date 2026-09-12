'use client';

import React from 'react';
import { AuthUser } from '@roster/types';
import { Building2, Bell, Shield, LogOut } from 'lucide-react';

interface TopHeaderProps {
  user: AuthUser;
  onSignOut: () => void;
}

export function TopHeader({ user, onSignOut }: TopHeaderProps) {
  return (
    <header className="h-16 border-b border-neutral-800 bg-neutral-900/60 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Organization & Context Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/80 border border-neutral-700/60 text-xs">
          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-neutral-200">
            {user.organization?.name || 'Workspace'}
          </span>
          <span className="text-neutral-600">|</span>
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">
            {user.organization?.timezone || 'UTC'}
          </span>
        </div>
      </div>

      {/* Right: Controls & User Profile Dropdown */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="View system alerts"
          className="relative p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
        </button>

        <div className="h-6 w-px bg-neutral-800" />

        {/* User Card */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-neutral-200 leading-tight">
              {user.fullName}
            </div>
            <div className="flex items-center justify-end gap-1 text-[11px] text-neutral-400">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>{user.role}</span>
            </div>
          </div>

          <button
            onClick={onSignOut}
            aria-label="Sign out of account"
            title="Sign Out"
            className="p-2 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}