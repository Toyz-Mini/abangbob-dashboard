'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';

interface MoodOption {
  emoji: string;
  label: string;
  value: number;
}

const moodOptions: MoodOption[] = [
  { emoji: '😄', label: 'Sangat Baik', value: 5 },
  { emoji: '🙂', label: 'Baik', value: 4 },
  { emoji: '😐', label: 'Biasa', value: 3 },
  { emoji: '😔', label: 'Kurang Baik', value: 2 },
  { emoji: '😢', label: 'Teruk', value: 1 },
];

interface MoodCheckInProps {
  staffId: string;
  staffName: string;
}

export default function MoodCheckIn({ staffId, staffName }: MoodCheckInProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Check if mood already submitted today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastMoodCheck = localStorage.getItem(`mood_check_${staffId}`);
    
    if (lastMoodCheck !== today) {
      // Show mood check-in after a slight delay
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [staffId]);

  const handleSubmit = () => {
    if (!selectedMood) return;

    // Save to localStorage
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`mood_check_${staffId}`, today);
    localStorage.setItem(`mood_value_${staffId}_${today}`, JSON.stringify({
      mood: selectedMood.value,
      note: note,
      timestamp: new Date().toISOString()
    }));

    setIsSubmitted(true);
    
    // Close after showing success
    setTimeout(() => {
      setIsVisible(false);
    }, 2000);
  };

  const handleSkip = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`mood_check_${staffId}`, today);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="mood-overlay">
      <div className="mood-modal">
        {!isSubmitted ? (
          <>
            <button className="mood-close" onClick={handleSkip}>
              <X size={20} />
            </button>

            <div className="mood-header">
              <h2>Selamat Pagi, {staffName.split(' ')[0]}! 👋</h2>
              <p>Bagaimana perasaan anda hari ini?</p>
            </div>

            <div className="mood-options">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  className={`mood-option ${selectedMood?.value === mood.value ? 'selected' : ''}`}
                  onClick={() => setSelectedMood(mood)}
                >
                  <span className="mood-emoji">{mood.emoji}</span>
                  <span className="mood-label">{mood.label}</span>
                </button>
              ))}
            </div>

            {selectedMood && (
              <div className="mood-note-section">
                <label>Ada apa-apa yang ingin dikongsi? (optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Cth: Hari ini saya rasa..."
                  rows={2}
                />
              </div>
            )}

            <div className="mood-actions">
              <button className="mood-skip" onClick={handleSkip}>
                Langkau
              </button>
              <button 
                className="mood-submit"
                onClick={handleSubmit}
                disabled={!selectedMood}
              >
                Hantar
              </button>
            </div>
          </>
        ) : (
          <div className="mood-success">
            <div className="mood-success-icon">
              <CheckCircle size={48} />
            </div>
            <h3>Terima Kasih!</h3>
            <p>Semoga hari anda indah {selectedMood?.emoji}</p>
          </div>
        )}
      </div>
    </div>
  );
}

