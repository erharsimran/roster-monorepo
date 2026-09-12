'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAVIGATION_REGISTRY, isNavAccessible } from '@/config/navigation';

interface BottomBarProps {
  userPermissions: string[];
  userRole: string;
}

export function BottomBar({ userPermissions, userRole }: BottomBarProps) {
  const pathname = usePathname();

  const accessibleItems = NAVIGATION_REGISTRY.filter(
    (item) =>
      item.showInBottomNav &&
      isNavAccessible(item, userPermissions, userRole),
  ).slice(0, 5); // Industry standard: Cap bottom bar to 5 items

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-900/95 backdrop-blur-lg border-t border-neutral-800 px-2 py-1.5 flex items-center justify-around safe-area-bottom">
      {accessibleItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.title}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors ${
              isActive
                ? 'text-emerald-400 font-medium'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.75]'}`} />
            <span className="text-[10px] tracking-tight mt-0.5">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}