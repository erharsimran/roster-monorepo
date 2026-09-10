'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser, LocationSummary } from '@roster/types';
import { RosterApiClient } from '@roster/api-client';
import { LogOut, User, MapPin, Calendar } from 'lucide-react';

const api = new RosterApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
);

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [locations, setLocations] = useState<LocationSummary[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.replace('/login');
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
      api.setToken(token);

      // Fetch locations for this manager
      api.getLocations()
        .then((locs) => {
          setLocations(locs);
          if (locs.length > 0) {
            const savedLoc = localStorage.getItem('selectedLocationId');
            const initialId = savedLoc && locs.some(l => l.id === savedLoc) 
              ? savedLoc 
              : locs[0].id;
            setSelectedLocationId(initialId);
            localStorage.setItem('selectedLocationId', initialId);
          }
        })
        .catch((err) => {
          console.error('Failed to load locations', err);
        })
        .finally(() => setLoading(false));
    } catch {
      router.replace('/login');
    }
  }, [router]);

  const handleLocationChange = (locId: string) => {
    setSelectedLocationId(locId);
    localStorage.setItem('selectedLocationId', locId);
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedLocationId');
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-400 text-sm">
        Loading workspace...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-neutral-800 bg-neutral-900/50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">
              R
            </div>
            <span className="font-semibold tracking-tight text-lg">Roster</span>
          </div>

          {/* Location Selector Dropdown */}
          {locations.length > 0 && (
            <div className="flex items-center gap-2 bg-neutral-800/80 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={selectedLocationId}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="bg-transparent text-neutral-200 outline-none cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-neutral-900 text-neutral-200">
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-medium text-neutral-200">{user.fullName}</div>
            <div className="text-xs text-neutral-400">{user.email}</div>
          </div>

          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
            <p className="text-neutral-400 text-sm mt-1">
              Select a view to manage shifts, staffing, and punches.
            </p>
          </div>

          {selectedLocationId && (
            <button
              onClick={() => router.push(`/dashboard/schedule?locationId=${selectedLocationId}`)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Open Schedule Grid</span>
            </button>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-neutral-800 text-emerald-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-neutral-400">Signed In As</div>
              <div className="text-sm font-medium">{user.fullName} ({user.email})</div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-neutral-800 text-sky-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-neutral-400">Active Location</div>
              <div className="text-sm font-medium">
                {locations.find((l) => l.id === selectedLocationId)?.name || 'No location selected'}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}