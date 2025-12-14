'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  HelpCircle, 
  Play, 
  BookOpen, 
  MessageCircle,
  X,
  Sparkles
} from 'lucide-react';
import { useTour } from './TourProvider';

export default function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { startTour, isTourActive } = useTour();

  // Don't show during tour
  if (isTourActive) return null;

  const handleStartTour = () => {
    setIsOpen(false);
    startTour('admin-full-tour');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" data-tour="help-center">
      {/* Expanded Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 w-64 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                Perlukan Bantuan?
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="p-2">
            <button
              onClick={handleStartTour}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-colors text-left group"
            >
              <div className="p-2 rounded-lg bg-teal-500/10 group-hover:bg-teal-500/20 transition-colors">
                <Play className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <p className="font-medium text-white">Tour Interaktif</p>
                <p className="text-xs text-slate-400">Panduan langkah demi langkah</p>
              </div>
            </button>

            <Link
              href="/help"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-white">Pusat Bantuan</p>
                <p className="text-xs text-slate-400">Artikel dan FAQ</p>
              </div>
            </Link>

            <button
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-colors text-left group"
            >
              <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <MessageCircle className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-white">Hubungi Kami</p>
                <p className="text-xs text-slate-400">Chat sokongan</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all
          ${isOpen 
            ? 'bg-slate-700 shadow-slate-900/50' 
            : 'bg-gradient-to-br from-teal-500 to-emerald-600 shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-105'
          }
        `}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <HelpCircle className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
}


