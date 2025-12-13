'use client';

import { ReactNode, Suspense } from 'react';
import { StoreProvider } from '@/lib/store';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import { SoundProvider } from '@/lib/contexts/SoundContext';
import { LanguageProvider } from '@/lib/contexts/LanguageContext';
import { ToastProvider } from '@/lib/contexts/ToastContext';
import { KeyboardShortcutsProvider } from '@/lib/contexts/KeyboardShortcutsContext';
import { OnlineStatusProvider } from '@/components/OfflineIndicator';
import { EnhancedToastProvider } from '@/lib/contexts/EnhancedToastContext';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { SetupProvider } from '@/lib/contexts/SetupContext';
import TopProgressBar from '@/components/TopProgressBar';
import OfflineIndicator from '@/components/OfflineIndicator';
import { TourProvider } from '@/components/onboarding/TourProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SoundProvider>
          <ToastProvider>
            <EnhancedToastProvider>
              <OnlineStatusProvider>
                <KeyboardShortcutsProvider>
                  <StoreProvider>
                    <AuthProvider>
                      <SetupProvider>
                        <TourProvider>
                          {/* Top Progress Bar for navigation */}
                          <Suspense fallback={null}>
                            <TopProgressBar />
                          </Suspense>
                          
                          {/* Main content */}
                          {children}
                          
                          {/* Offline indicator */}
                          <OfflineIndicator />
                        </TourProvider>
                      </SetupProvider>
                    </AuthProvider>
                  </StoreProvider>
                </KeyboardShortcutsProvider>
              </OnlineStatusProvider>
            </EnhancedToastProvider>
          </ToastProvider>
        </SoundProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
