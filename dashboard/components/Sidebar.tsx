'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Settings, Droplets } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Droplets },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col"
      style={{
        width: '240px',
        background: 'rgba(6, 12, 28, 0.45)',
        backdropFilter: 'blur(40px)',
        borderRight: '1px solid rgba(255,255,255,0.03)',
        zIndex: 50,
      }}
    >
      {/* Logo Section */}
      <div className="px-7 pt-12 pb-10 mb-20">
        <Link href="/" className="flex items-center gap-5 group">
          <div
            className="w-12 h-12 flex items-center justify-center transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 flex-shrink-0"
          >
            <img src="/logos/mindtheai_brand.svg" alt="MindTheAI Logo" width={44} height={44} />
          </div>
          <div className="flex flex-col">
            <span
              className="font-black text-xl tracking-tight block leading-none text-white mb-1"
            >
              MindTheAI
            </span>
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-sky-400">
              Responsible AI
            </span>
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-4 flex flex-col gap-10">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 px-4 py-3 rounded-2xl text-base font-semibold transition-all duration-300 group"
              style={{
                color: isActive ? '#f8fafc' : '#94a3b8',
                background: isActive ? 'rgba(14,165,233,0.12)' : 'transparent',
                boxShadow: isActive ? 'inset 0 0 20px rgba(14,165,233,0.1)' : 'none',
              }}
            >
              <Icon
                className="w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                style={{ color: isActive ? '#38bdf8' : '#64748b' }}
              />
              <span>{label}</span>
              {isActive && (
                <div
                  className="ml-auto w-1.5 h-6 rounded-full"
                  style={{ 
                    background: '#0ea5e9',
                    boxShadow: '0 0 12px rgba(14,165,233,0.8)' 
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer – version */}
      <div className="px-8 py-8">
        <p className="text-[10px] font-medium tracking-widest uppercase opacity-30" style={{ color: '#94a3b8' }}>v1.0 · MindTheAI</p>
      </div>
    </aside>
  );
}
