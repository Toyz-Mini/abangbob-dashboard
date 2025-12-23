'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function VerificationFailedContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    const errorMessages: Record<string, string> = {
        missing: 'Link pengesahan tidak lengkap.',
        invalid: 'Link pengesahan tidak sah atau telah tamat tempoh.',
        server: 'Ralat server berlaku. Sila cuba lagi.',
    };

    return (
        <div className="page">
            <div className="container">
                <div className="icon error">
                    <XCircle size={48} />
                </div>
                <h1>Pengesahan Gagal</h1>
                <p>{errorMessages[error || 'server']}</p>
                <Link href="/login" className="btn">
                    Kembali ke Log Masuk
                </Link>
            </div>

            <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
          padding: 1rem;
        }
        .container {
          width: 100%;
          max-width: 400px;
          background: white;
          border-radius: 24px;
          padding: 3rem 2rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          text-align: center;
        }
        .icon {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }
        .icon.error {
          background: #fef2f2;
          color: #ef4444;
        }
        h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ef4444;
          margin: 0 0 1rem;
        }
        p {
          color: #666;
          margin: 0 0 2rem;
          line-height: 1.6;
        }
        .btn {
          display: inline-block;
          padding: 1rem 2rem;
          background: #f5f5f5;
          color: #333;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 500;
        }
      `}</style>
        </div>
    );
}

export default function VerificationFailedPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerificationFailedContent />
        </Suspense>
    );
}
