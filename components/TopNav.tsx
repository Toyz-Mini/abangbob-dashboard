'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Bell, User, Menu, Sun, Moon, Volume2, VolumeX, Languages, Settings, LogOut, ChevronDown, Store } from 'lucide-react';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useSound } from '@/lib/contexts/SoundContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import { useNotifications } from '@/lib/store';
import { useNotificationsRealtime } from '@/lib/supabase/realtime-hooks';
import AppsLauncher from './AppsLauncher';

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
    <div className="fixed top-0 right-0 left-0 h-[70px] bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 z-40 flex items-center px-4 md:px-6 transition-all duration-300 md:ml-[280px]">
      <div className="flex items-center gap-4 flex-1">
        {!isMobile && (
          <button onClick={onMenuClick} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors md:hidden">
            <Menu size={24} />
          </button>
        )}

        {/* Logo untuk mobile */}
        <div className="md:hidden">
          <Image
            src="/logo.png"
            alt="Abang Bob"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
          />
        </div>

        {/* Search Bar */}
        <div className="relative hidden md:flex items-center w-full max-w-md">
          <Search size={18} className="absolute left-3 text-gray-400" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-black/20 transition-all text-sm"
            placeholder={t('common.search') + '...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Apps Launcher (Admin/Manager Only) */}
        {['Admin', 'Manager'].includes(currentStaff?.role || '') && (
          <AppsLauncher />
        )}

        {/* Language Toggle */}
        <button
          onClick={handleLanguageToggle}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-bold text-gray-600 dark:text-gray-300 transition-colors"
          title={t('topnav.switchLanguage')}
        >
          <Languages size={16} />
          <span className="hidden sm:inline">{language.toUpperCase()}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={handleThemeToggle}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors"
          title={resolvedTheme === 'dark' ? t('settings.light') : t('settings.dark')}
        >
          {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Sound Toggle */}
        <button
          onClick={handleSoundToggle}
          className={`w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors ${!settings.enabled ? 'opacity-50' : ''}`}
          title={settings.enabled ? t('settings.soundEnabled') : t('topnav.soundMuted')}
        >
          {settings.enabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

        {/* Notifications */}
        <Link href="/notifications" className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900">
            </span>
          )}
        </Link>

        {/* User Profile with Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            className={`flex items-center gap-3 pl-2 pr-1 py-1 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all border border-transparent hover:border-gray-100 dark:hover:border-white/10 ${isUserMenuOpen ? 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10' : ''}`}
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white shadow-sm">
              <User size={18} />
            </div>
            <div className="hidden md:flex flex-col items-start mr-2">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200 leading-none">{currentStaff?.name || t('topnav.admin')}</span>
              <span className="text-[10px] text-gray-400 font-medium leading-none mt-1">{currentStaff?.role || 'Admin'}</span>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform hidden md:block ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl mb-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User size={20} />
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">{currentStaff?.name || t('topnav.administrator')}</div>
                  <div className="text-xs text-gray-500">{currentStaff?.role || t('topnav.systemManager')}</div>
                </div>
              </div>

              <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />

              <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                <Settings size={16} />
                <span>{t('topnav.accountSettings')}</span>
              </Link>

              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left">
                <Store size={16} />
                <span>{t('topnav.switchOutlet')}</span>
              </button>

              <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />

              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left font-medium" onClick={handleLogout}>
                <LogOut size={16} />
                <span>{t('topnav.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
