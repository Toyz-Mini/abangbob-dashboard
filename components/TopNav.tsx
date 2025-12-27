'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, User, Menu, Sun, Moon, Volume2, VolumeX, Languages, Settings, LogOut, ChevronDown, Store } from 'lucide-react';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useSound } from '@/lib/contexts/SoundContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import { useNotifications } from '@/lib/store';
import { useNotificationsRealtime } from '@/lib/supabase/realtime-hooks';

interface TopNavProps {
  onMenuClick?: () => void;
}

export default function TopNav({ onMenuClick }: TopNavProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { resolvedTheme, toggleTheme } = useTheme();
  const { settings, toggleSound, playSound } = useSound();
  const { language, toggleLanguage, t } = useLanguage();

  const { getUnreadCount, refreshNotifications } = useNotifications();
  const { currentStaff, logoutStaff, signOut } = useAuth();

  useNotificationsRealtime(() => {
    console.log('[TopNav Realtime] Notifications refreshed');
    refreshNotifications();
  });

  const unreadCount = getUnreadCount();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Track mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleThemeToggle = () => {
    toggleTheme();
    playSound('notification');
  };

  const handleSoundToggle = () => {
    toggleSound();
  };

  const handleLanguageToggle = () => {
    toggleLanguage();
    playSound('notification');
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    // Clear both staff session and Supabase session
    try {
      await logoutStaff();
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  return (
    <div className="top-nav">
      <div className="top-nav-left">
        {!isMobile && (
          <button onClick={onMenuClick} className="mobile-menu-btn icon-btn">
            <Menu size={24} />
          </button>
        )}

        {/* Logo untuk mobile */}
        <img
          src="/logo.png"
          alt="Abang Bob"
          className="topnav-logo"
        />

        {/* Search Bar */}
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={t('common.search') + '...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="top-nav-right">
        {/* Language Toggle */}
        <button
          onClick={handleLanguageToggle}
          className="lang-toggle"
          title={t('topnav.switchLanguage')}
        >
          <Languages size={16} />
          <span>{language.toUpperCase()}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={handleThemeToggle}
          className="icon-btn"
          title={resolvedTheme === 'dark' ? t('settings.light') : t('settings.dark')}
        >
          {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Sound Toggle */}
        <button
          onClick={handleSoundToggle}
          className={`icon-btn ${!settings.enabled ? 'muted' : ''}`}
          title={settings.enabled ? t('settings.soundEnabled') : t('topnav.soundMuted')}
        >
          {settings.enabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

        {/* Notifications */}
        <Link href="/notifications" className="icon-btn">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Profile with Dropdown */}
        <div className="user-dropdown-container" ref={userMenuRef}>
          <button
            className={`user-profile-btn ${isUserMenuOpen ? 'active' : ''}`}
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <div className="user-avatar">
              <User size={18} />
            </div>
            <span className="user-name">{currentStaff?.name || t('topnav.admin')}</span>
            <ChevronDown size={16} className={`dropdown-chevron ${isUserMenuOpen ? 'open' : ''}`} />
          </button>

          {isUserMenuOpen && (
            <div className="user-dropdown-menu">
              <div className="dropdown-header">
                <div className="dropdown-user-avatar">
                  <User size={24} />
                </div>
                <div className="dropdown-user-info">
                  <div className="dropdown-user-name">{currentStaff?.name || t('topnav.administrator')}</div>
                  <div className="dropdown-user-role">{currentStaff?.role || t('topnav.systemManager')}</div>
                </div>
              </div>

              <div className="dropdown-divider" />

              <Link href="/settings" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                <Settings size={18} />
                <span>{t('topnav.accountSettings')}</span>
              </Link>

              <button className="dropdown-item">
                <Store size={18} />
                <span>{t('topnav.switchOutlet')}</span>
              </button>

              <div className="dropdown-divider" />

              <button className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
                <LogOut size={18} />
                <span>{t('topnav.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
