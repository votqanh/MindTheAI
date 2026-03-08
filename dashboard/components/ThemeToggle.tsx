'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { getAllStats, saveSettings, type Settings } from '@/lib/storage';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    getAllStats().then(({ settings }) => {
      const savedTheme = settings.theme || 'dark';
      setTheme(savedTheme);
      applyTheme(savedTheme);
    });
  }, []);

  const applyTheme = (t: 'light' | 'dark') => {
    if (t === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);

    const { settings } = await getAllStats();
    await saveSettings({ ...settings, theme: nextTheme });
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 100,
        width: 44,
        height: 44,
        borderRadius: 12,
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--text-primary)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
      className="hover:scale-105 active:scale-95 group"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div style={{ position: 'relative', width: 20, height: 20 }}>
        <Sun
          size={20}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: theme === 'light' ? 'rotate(0) scale(1)' : 'rotate(90deg) scale(0)',
            opacity: theme === 'light' ? 1 : 0,
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            color: '#fbbf24',
          }}
        />
        <Moon
          size={20}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: theme === 'dark' ? 'rotate(0) scale(1)' : 'rotate(-90deg) scale(0)',
            opacity: theme === 'dark' ? 1 : 0,
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            color: '#94a3b8',
          }}
        />
      </div>
      
      {/* Subtle glow effect */}
      <div 
        style={{
          position: 'absolute',
          inset: -1,
          borderRadius: 12,
          background: 'var(--accent)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
          zIndex: -1,
          filter: 'blur(8px)',
        }}
        className="group-hover:opacity-20"
      />
    </button>
  );
}
