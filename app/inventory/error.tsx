'use client';

import { useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import PremiumButton from '@/components/PremiumButton';
import GlassCard from '@/components/GlassCard';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Inventory Page Error:', error);
    }, [error]);

    return (
        <MainLayout>
            <div className="flex items-center justify-center min-h-[60vh] p-4">
                <GlassCard className="max-w-md w-full text-center p-8 space-y-6">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-gray-900">Oops! Something went wrong</h2>
                        <p className="text-gray-500">
                            We encountered an error while loading the inventory. This might be due to a connection issue or permission problem.
                        </p>
                        {process.env.NODE_ENV === 'development' && (
                            <div className="p-3 bg-red-50 text-red-700 text-xs text-left overflow-auto rounded max-h-32 mt-4 font-mono">
                                {error.message}
                                {error.stack && <pre className="mt-2 text-[10px]">{error.stack}</pre>}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center gap-3">
                        <PremiumButton
                            onClick={() => window.location.href = '/'}
                            variant="outline"
                        >
                            Go Home
                        </PremiumButton>
                        <PremiumButton
                            onClick={
                                // Attempt to recover by trying to re-render the segment
                                () => reset()
                            }
                            variant="primary"
                            icon={RefreshCw}
                        >
                            Try Again
                        </PremiumButton>
                    </div>
                </GlassCard>
            </div>
        </MainLayout>
    );
}
