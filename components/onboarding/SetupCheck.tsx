'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const SETUP_COMPLETE_KEY = 'abangbob_setup_complete';

// Pages that don't require setup to be complete
const EXEMPT_PAGES = ['/setup', '/login', '/menu'];

export default function SetupCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Skip check for exempt pages
    if (EXEMPT_PAGES.some(page => pathname?.startsWith(page))) {
      setIsChecking(false);
      return;
    }

    // Check if setup is complete
    const setupComplete = localStorage.getItem(SETUP_COMPLETE_KEY);
    
    if (setupComplete !== 'true') {
      // Redirect to setup if not complete
      router.push('/setup');
    } else {
      setIsChecking(false);
    }
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}

