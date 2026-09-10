'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userJson = searchParams.get('user');

    if (token) {
      localStorage.setItem('token', token);
      if (userJson) {
        localStorage.setItem('user', decodeURIComponent(userJson));
      }
      router.replace('/dashboard');
    } else {
      router.replace('/login?error=oauth_failed');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-400 text-sm">
      Authenticating with Google...
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-400 text-sm">Loading...</div>}>
      <CallbackHandler />
    </Suspense>
  );
}