'use client';

import { useState } from 'react';
import { Phone, X, AlertTriangle, PhoneCall, MapPin } from 'lucide-react';
import Modal from '@/components/Modal';

interface EmergencyContact {
  name: string;
  role: string;
  phone: string;
}

const emergencyContacts: EmergencyContact[] = [
  { name: 'Ahmad Razak', role: 'Pengurus', phone: '+673 8123456' },
  { name: 'Siti Aminah', role: 'HR Manager', phone: '+673 8234567' },
  { name: 'Keselamatan', role: 'Security', phone: '+673 8345678' },
];

export default function EmergencySOS() {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [callingContact, setCallingContact] = useState<EmergencyContact | null>(null);

  const handleSOSClick = () => {
    setIsOpen(true);
  };

  const handleCallManager = () => {
    setIsConfirming(true);
    // In real app, initiate call to primary contact
    const primaryContact = emergencyContacts[0];
    setCallingContact(primaryContact);
    
    // Simulate call initiation
    setTimeout(() => {
      window.location.href = `tel:${primaryContact.phone.replace(/\s/g, '')}`;
    }, 500);
  };

  const handleCallContact = (contact: EmergencyContact) => {
    window.location.href = `tel:${contact.phone.replace(/\s/g, '')}`;
  };

  return (
    <>
      {/* SOS Button */}
      <button 
        className="emergency-sos-btn"
        onClick={handleSOSClick}
        aria-label="Emergency SOS"
      >
        <Phone size={20} />
        <span>SOS</span>
      </button>

      {/* SOS Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={() => {
          setIsOpen(false);
          setIsConfirming(false);
          setCallingContact(null);
        }} 
        title="" 
        maxWidth="400px"
      >
        <div className="sos-modal">
          {!isConfirming ? (
            <>
              <div className="sos-header">
                <div className="sos-icon">
                  <AlertTriangle size={32} />
                </div>
                <h2>Bantuan Kecemasan</h2>
                <p>Tekan butang di bawah untuk menghubungi pengurus dengan segera.</p>
              </div>

              <button className="sos-call-btn" onClick={handleCallManager}>
                <PhoneCall size={24} />
                <span>Hubungi Pengurus Sekarang</span>
              </button>

              <div className="sos-divider">
                <span>atau pilih kontak</span>
              </div>

              <div className="sos-contacts">
                {emergencyContacts.map((contact, index) => (
                  <button 
                    key={index}
                    className="sos-contact-item"
                    onClick={() => handleCallContact(contact)}
                  >
                    <div className="contact-avatar">
                      {contact.name.charAt(0)}
                    </div>
                    <div className="contact-info">
                      <span className="contact-name">{contact.name}</span>
                      <span className="contact-role">{contact.role}</span>
                    </div>
                    <Phone size={18} className="contact-phone-icon" />
                  </button>
                ))}
              </div>

              <button 
                className="btn btn-outline" 
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={() => setIsOpen(false)}
              >
                Batal
              </button>
            </>
          ) : (
            <div className="sos-calling">
              <div className="calling-animation">
                <div className="calling-ring"></div>
                <div className="calling-ring"></div>
                <div className="calling-ring"></div>
                <PhoneCall size={32} />
              </div>
              <h3>Menghubungi...</h3>
              <p>{callingContact?.name}</p>
              <span className="calling-phone">{callingContact?.phone}</span>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}




