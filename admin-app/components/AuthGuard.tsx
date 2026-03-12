'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, isAdmin } from '@/lib/auth';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token || !isAdmin(token)) {
      router.replace('/login');
    }
  }, [router]);

  const token = getToken();
  if (!token || !isAdmin(token)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Checking authentication…</div>
      </div>
    );
  }

  return <>{children}</>;
}
