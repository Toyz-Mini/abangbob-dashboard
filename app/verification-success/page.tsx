'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function VerificationSuccessPage() {
    return (
        <div className="page">
            <div className="container">
                <div className="icon success">
                    <CheckCircle size={48} />
                </div>
                <h1>Email Disahkan!</h1>
                <p>Email anda telah berjaya disahkan. Sila lengkapkan profil anda untuk meneruskan.</p>
                <Link href="/complete-profile" className="btn">
                    Lengkapkan Profil
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
        .icon.success {
          background: #dcfce7;
          color: #22c55e;
        }
        h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #22c55e;
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
          background: linear-gradient(135deg, #CC1512 0%, #8B0000 100%);
          color: white;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 600;
        }
      `}</style>
        </div>
    );
}
