'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Settings, Droplets, Home, Sprout } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col"
      style={{
        width: 240,
        background: 'var(--bg-secondary)',
        backdropFilter: 'blur(40px)',
        borderRight: '1px solid var(--border)',
        zIndex: 50,
      }}
    >
      {/* ── Logo Section ── */}
      <div
        style={{
          padding: '32px 24px 24px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Link
          href="/"
          className="group"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            textDecoration: 'none',
          }}
        >
          <div style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
            className="group-hover:scale-105"
          >
            <img src="/squishy-robot.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                lineHeight: 1.2,
              }}
            >
              MindTheAI
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: 'var(--accent)',
                opacity: 0.8,
              }}
            >
              Responsible AI
            </span>
          </div>
        </Link>
      </div>

      {/* ── Navigation ── */}
      <nav
        style={{
          flex: 1,
          padding: '20px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em',
            color: '#475569',
            padding: '0 12px',
            marginBottom: 8,
          }}
        >
          Navigation
        </p>

        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive
                  ? 'var(--bg-card-hover)'
                  : 'transparent',
                border: isActive
                  ? '1px solid var(--border-hover)'
                  : '1px solid transparent',
                boxShadow: isActive
                  ? '0 0 16px var(--accent-glow)'
                  : 'none',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = '#94a3b8';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#64748b';
                }
              }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 20,
                    borderRadius: '0 4px 4px 0',
                    background: 'linear-gradient(180deg, #5eead4, #22d3ee)',
                    boxShadow: '0 0 8px rgba(34,211,238,0.4)',
                  }}
                />
              )}
              <Icon
                style={{
                  width: 20,
                  height: 20,
                  flexShrink: 0,
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  transition: 'color 0.2s ease',
                }}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div
        style={{
          padding: '16px 24px 20px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Droplets style={{ width: 12, height: 12, color: 'var(--accent)', opacity: 0.4 }} />
          <p
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: '#334155',
              margin: 0,
            }}
          >
            v1.0 · MindTheAI
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 0',
            opacity: 0.3,
            transition: 'opacity 0.3s ease',
          }}
          className="hover:opacity-100 group"
          title="Growing with you"
        >
          <Sprout
            size={18}
            className="group-hover:scale-110 transition-transform duration-500"
            style={{ color: 'var(--accent)' }}
          />
        </div>
      </div>
    </aside>
  );
}
