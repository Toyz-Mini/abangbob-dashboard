'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import Breadcrumb from './Breadcrumb';
import CommandPalette, { useCommandPalette } from './CommandPalette';
import BottomNav, { useBottomNav } from './BottomNav';
import Sheet from './Sheet';

export default function MainLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const sidebarRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Command palette state
  const commandPalette = useCommandPalette();
  
  // Bottom nav more menu
  const bottomNav = useBottomNav();

  // Auto-close when clicking outside sidebar
  useEffect(() => {
    if (!isSidebarOpen) return; // Don't listen if already closed
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close if clicking inside sidebar
      if (sidebarRef.current?.contains(target)) {
        return;
      }

      // Close sidebar when clicking outside (only on desktop)
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };

    // Add small delay to prevent immediate close after render
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isSidebarOpen]);

  // Expand sidebar on hover when collapsed
  const handleSidebarMouseEnter = () => {
    if (!isSidebarOpen && window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  };

  // Handle click on sidebar to expand if collapsed
  const handleSidebarClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent closing
    e.stopPropagation();
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
    }
  };

  // Handle nav link click - close sidebar on mobile
  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Ripple effect handler for buttons
  const handleRipple = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    button.style.setProperty('--ripple-x', `${x}%`);
    button.style.setProperty('--ripple-y', `${y}%`);
    button.classList.add('ripple');
    
    setTimeout(() => {
      button.classList.remove('ripple');
    }, 600);
  }, []);

  // Add ripple effect to all buttons
  useEffect(() => {
    const addRippleToButtons = () => {
      const buttons = document.querySelectorAll('.btn, .icon-btn');
      buttons.forEach(button => {
        const handler = (e: Event) => handleRipple(e as unknown as React.MouseEvent<HTMLElement>);
        button.addEventListener('mousedown', handler);
        // Store handler for cleanup
        (button as any)._rippleHandler = handler;
      });
    };

    // Initial setup
    addRippleToButtons();

    // Use MutationObserver to handle dynamically added buttons
    const observer = new MutationObserver(() => {
      addRippleToButtons();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      const buttons = document.querySelectorAll('.btn, .icon-btn');
      buttons.forEach(button => {
        if ((button as any)._rippleHandler) {
          button.removeEventListener('mousedown', (button as any)._rippleHandler);
        }
      });
    };
  }, [handleRipple]);

  return (
    <div className="main-container" ref={containerRef}>
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <Sidebar 
        ref={sidebarRef}
        isOpen={isSidebarOpen}
        onMouseEnter={handleSidebarMouseEnter}
        onClick={handleSidebarClick}
        onNavClick={handleNavClick}
      />
      <TopNav onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <main 
        id="main-content"
        className={`main-content page-enter ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
      >
        <Breadcrumb />
        {children}
      </main>
      
      {/* Command Palette */}
      <CommandPalette 
        isOpen={commandPalette.isOpen} 
        onClose={commandPalette.close} 
      />
      
      {/* Bottom Navigation (Mobile) */}
      <BottomNav 
        showMore={true}
        onMoreClick={bottomNav.openMore}
      />
      
      {/* More Menu Sheet (Mobile) */}
      <Sheet
        isOpen={bottomNav.isMoreOpen}
        onClose={bottomNav.closeMore}
        title="More Options"
        position="bottom"
      >
        <div className="stagger-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <a href="/delivery" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
            Delivery Hub
          </a>
          <a href="/production" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
            Production
          </a>
          <a href="/recipes" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
            Recipes
          </a>
          <a href="/suppliers" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
            Suppliers
          </a>
          <a href="/finance" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
            Finance
          </a>
          <a href="/customers" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
            Customers
          </a>
          <a href="/analytics" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
            Analytics
          </a>
          <a href="/settings" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
            Settings
          </a>
        </div>
      </Sheet>
    </div>
  );
}
