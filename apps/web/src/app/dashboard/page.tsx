'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthUser } from '@roster/types';
import { RosterApiClient } from '@roster/api-client';
import { NAVIGATION_REGISTRY, isNavAccessible } from '@/config/navigation';
import { TopHeader } from '@/components/navigation/TopHeader';
import { BottomBar } from '@/components/navigation/BottomBar';

const api = new RosterApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }
      api.setToken(token);
      const profile = await api.getMe();
      setUser(profile);
    } catch {
      localStorage.removeItem('token');
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleSignOut = () => {
    localStorage.clear();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-400 text-xs">
        Authenticating enterprise session...
      </div>
    );
  }

  if (!user) return null;

  // Filter sidebar navigation items through RPA
  const accessibleNavItems = NAVIGATION_REGISTRY.filter((item) =>
    isNavAccessible(item, user.permissions || [], user.role),
  );

  return (
    <div className="min-h-screen flex bg-neutral-950 text-neutral-100 antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 border-r border-neutral-800 bg-neutral-900/40 flex-col shrink-0 sticky top-0 h-screen">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-neutral-800">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-emerald-900/40">
            R
          </div>
          <div>
            <span className="font-semibold tracking-tight text-sm block">Roster</span>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">
              Enterprise
            </span>
          </div>
        </div>

        {/* Dynamic RPA Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
            Navigation
          </div>
          {accessibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.title}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-800 text-emerald-400 border border-neutral-700/60 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Viewport Shell */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <TopHeader user={user} onSignOut={handleSignOut} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomBar
        userPermissions={user.permissions || []}
        userRole={user.role}
      />
    </div>
  );
}