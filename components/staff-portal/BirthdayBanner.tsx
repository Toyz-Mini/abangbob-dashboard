'use client';

import { useState, useEffect } from 'react';
import { useStaff } from '@/lib/store';
import { X, Cake, PartyPopper, Gift } from 'lucide-react';

interface BirthdayBannerProps {
  currentStaffId: string;
}

export default function BirthdayBanner({ currentStaffId }: BirthdayBannerProps) {
  const { staff } = useStaff();
  const [dismissed, setDismissed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  
  const currentStaff = staff.find(s => s.id === currentStaffId);
  
  // Check if today is birthday
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  
  // Mock birthday check - in real app, check against staff.birthday field
  // For demo, let's assume staff ID 2 has birthday today if it's the 15th of any month
  const isBirthday = todayDay === 15; // Demo condition
  
  // Check for work anniversary
  const joinDate = currentStaff?.joinDate ? new Date(currentStaff.joinDate) : null;
  const isAnniversary = joinDate && 
    joinDate.getMonth() === today.getMonth() && 
    joinDate.getDate() === today.getDate() &&
    joinDate.getFullYear() !== today.getFullYear();
  
  const yearsOfService = joinDate ? today.getFullYear() - joinDate.getFullYear() : 0;

  // Hide confetti after animation
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  if (dismissed || (!isBirthday && !isAnniversary)) {
    return null;
  }

  return (
    <div className={`birthday-banner ${isBirthday ? 'birthday' : 'anniversary'}`}>
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)]
              }}
            />
          ))}
        </div>
      )}
      
      <div className="birthday-content">
        <div className="birthday-icon">
          {isBirthday ? <Cake size={28} /> : <Gift size={28} />}
        </div>
        <div className="birthday-text">
          {isBirthday ? (
            <>
              <h3>🎂 Selamat Hari Lahir, {currentStaff?.name?.split(' ')[0]}! 🎉</h3>
              <p>Semoga dipanjangkan umur dan dimurahkan rezeki!</p>
            </>
          ) : (
            <>
              <h3>🎊 Tahniah! {yearsOfService} Tahun Bersama Kami! 🎊</h3>
              <p>Terima kasih atas dedikasi dan komitmen anda!</p>
            </>
          )}
        </div>
        <button className="birthday-close" onClick={() => setDismissed(true)}>
          <X size={18} />
        </button>
      </div>
      
      <div className="birthday-decorations">
        <PartyPopper className="decoration decoration-1" size={24} />
        <PartyPopper className="decoration decoration-2" size={20} />
      </div>
    </div>
  );
}




