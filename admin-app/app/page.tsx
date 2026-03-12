'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, isAdmin } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (token && isAdmin(token)) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return null;
}
