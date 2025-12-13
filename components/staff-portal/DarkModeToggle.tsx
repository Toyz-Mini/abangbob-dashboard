'use client';

import { useTheme } from '@/lib/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function DarkModeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="staff-dark-toggle"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Mode Cerah' : 'Mode Gelap'}
    >
      <div className={`toggle-track ${isDark ? 'dark' : 'light'}`}>
        <div className={`toggle-thumb ${isDark ? 'dark' : 'light'}`}>
          {isDark ? <Moon size={14} /> : <Sun size={14} />}
        </div>
        <Sun size={12} className="toggle-icon sun" />
        <Moon size={12} className="toggle-icon moon" />
      </div>
    </button>
  );
}

