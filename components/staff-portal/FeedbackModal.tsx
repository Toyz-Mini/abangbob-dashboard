'use client';

import { useState } from 'react';
import { MessageSquare, X, Send, CheckCircle } from 'lucide-react';
import Modal from '@/components/Modal';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffName: string;
}

type FeedbackCategory = 'suggestion' | 'issue' | 'praise' | 'other';

export default function FeedbackModal({ isOpen, onClose, staffName }: FeedbackModalProps) {
  const [category, setCategory] = useState<FeedbackCategory>('suggestion');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const categories = [
    { id: 'suggestion', label: 'Cadangan', emoji: '💡' },
    { id: 'issue', label: 'Masalah', emoji: '⚠️' },
    { id: 'praise', label: 'Pujian', emoji: '⭐' },
    { id: 'other', label: 'Lain-lain', emoji: '📝' },
  ];

  const handleSubmit = async () => {
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset after showing success
    setTimeout(() => {
      setIsSubmitted(false);
      setMessage('');
      setCategory('suggestion');
      setIsAnonymous(false);
      onClose();
    }, 2000);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setMessage('');
      setCategory('suggestion');
      setIsAnonymous(false);
      setIsSubmitted(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Hantar Maklum Balas" maxWidth="450px">
      {isSubmitted ? (
        <div className="feedback-success">
          <div className="feedback-success-icon">
            <CheckCircle size={48} />
          </div>
          <h3>Terima Kasih!</h3>
          <p>Maklum balas anda telah dihantar kepada pengurusan.</p>
        </div>
      ) : (
        <div className="feedback-form">
          <div className="feedback-greeting">
            <p>Hi {staffName.split(' ')[0]}, pendapat anda penting untuk kami!</p>
          </div>

          {/* Category Selection */}
          <div className="form-group">
            <label className="form-label">Kategori</label>
            <div className="feedback-categories">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`feedback-category ${category === cat.id ? 'active' : ''}`}
                  onClick={() => setCategory(cat.id as FeedbackCategory)}
                >
                  <span className="category-emoji">{cat.emoji}</span>
                  <span className="category-label">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="form-group">
            <label className="form-label">Mesej Anda</label>
            <textarea
              className="form-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Kongsi pendapat, cadangan, atau maklum balas anda..."
              rows={4}
            />
          </div>

          {/* Anonymous Toggle */}
          <div className="feedback-anonymous">
            <label className="feedback-toggle">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className="toggle-label">Hantar secara anonymous</span>
          </div>

          {/* Actions */}
          <div className="feedback-actions">
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!message.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>Menghantar...</>
              ) : (
                <>
                  <Send size={16} />
                  Hantar
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// Floating Feedback Button
export function FeedbackButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="feedback-fab" onClick={onClick} aria-label="Give Feedback">
      <MessageSquare size={22} />
    </button>
  );
}




