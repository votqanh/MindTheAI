'use client';

import { useEffect, useState, useRef } from 'react';
import { getAllStats } from '@/lib/storage';
import { formatWater } from '@/lib/format';

function useCountUp(target: number, duration = 2400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

// Animated water drops falling in background
function WaterBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${12 + i * 12}%`,
            top: '-60px',
            width: '1.5px',
            height: '14px',
            borderRadius: '100px',
            background: `rgba(34,211,238,${0.04 + (i % 3) * 0.02})`,
            animation: `dropFall ${4 + i * 0.8}s linear ${i * 1.1}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState<{ savedMl: number; usedMl: number; googleRedirects: number } | null>(null);
  const savedDisplay = useCountUp(stats?.savedMl ?? 0);

  useEffect(() => {
    getAllStats().then((s) =>
      setStats({ 
        savedMl: s.waterStats.waterSavedMl, 
        usedMl: s.waterStats.waterUsedMl,
        googleRedirects: s.waterStats.googleRedirects
      })
    );
  }, []);

  const cups = ((stats?.savedMl ?? 0) / 240).toFixed(1);

  return (
    <div
      className="relative min-h-screen flex flex-col"
      style={{ 
        color: '#f8fafc' 
      }}
    >
      {/* Nature background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/nature-bg.png"
        alt=""
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 30%',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      {/* Dark overlay for readability */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(11,22,40,0.4) 0%, rgba(11,22,40,0.55) 50%, rgba(11,22,40,0.85) 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
      {/* Drop fall keyframe injected inline */}
      <style>{`
        @keyframes dropFall {
          0%   { transform: translateY(0); opacity: 0; }
          10%  { opacity: 0.8; }
          90%  { opacity: 0.3; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
        @keyframes floatDrop {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-14px) scale(1.02); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50%       { opacity: 0.45; transform: scale(1.1); }
        }
        @keyframes drip {
          0%   { transform: translateY(0px) scaleY(1); }
          40%  { transform: translateY(4px) scaleY(0.97); }
          60%  { transform: translateY(7px) scaleY(0.94); }
          80%  { transform: translateY(4px) scaleY(0.97); }
          100% { transform: translateY(0px) scaleY(1); }
        }
      `}</style>


      {/* ── Hero: full-height centred ── */}
      <section
        className="relative flex flex-col items-center justify-center text-center"
        style={{ minHeight: '100vh', padding: '80px 40px 60px', position: 'relative', zIndex: 2 }}
      >
        {/* Water droplet image with cool float & glow animation */}
        <div
          style={{
            position: 'relative',
            width: 160,
            height: 160,
            marginBottom: 48,
            animation: 'floatDrop 5s ease-in-out infinite',
          }}
        >
          {/* Subtle ambient glow */}
          <div
            style={{
              position: 'absolute',
              inset: -16,
              background: 'radial-gradient(circle, rgba(34,211,238,0.2) 0%, transparent 65%)',
              animation: 'glowPulse 5s ease-in-out infinite',
              zIndex: 0,
              borderRadius: '50%',
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/water-logo.svg"
            alt="MindTheAI Water Droplet"
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              zIndex: 1,
              filter: 'drop-shadow(0 0 16px rgba(34,211,238,0.3))',
            }}
          />
        </div>

        {/* Main number */}
        <div style={{ marginBottom: 12 }}>
          <span
            style={{
              fontSize: 'clamp(56px, 10vw, 96px)',
              fontWeight: 800,
              letterSpacing: '-3px',
              lineHeight: 1,
              background: 'linear-gradient(160deg, #a5f3fc 10%, #22d3ee 55%, #0891b2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'block',
            }}
          >
            {formatWater(savedDisplay).split(' ')[0]}
          </span>
        </div>

        {/* Unit label */}
        <p
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: '#94a3b8',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          {formatWater(savedDisplay).split(' ')[1]} of water saved
        </p>

        {/* Equivalent */}
        <p style={{ fontSize: 13, color: '#475569', marginBottom: 56 }}>
          ≈ {cups} cups
        </p>

        {/* Thin divider */}
        <div
          style={{
            width: 48,
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)',
            marginBottom: 40,
          }}
        />

        {/* Secondary micro-stats */}
        <div style={{ display: 'flex', gap: 48, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { value: stats?.usedMl ?? 0, label: 'used on AI', color: '#64748b', isWater: true },
            { value: stats?.googleRedirects ?? 0, label: 'prompts to Google', color: '#64748b', isWater: false },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 2 }}>
                {s.isWater ? formatWater(s.value) : s.value.toLocaleString()}
              </p>
              <p style={{ fontSize: 11, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Scroll cue */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            opacity: 0.35,
          }}
        >
          <div
            style={{
              width: 24,
              height: 36,
              borderRadius: 12,
              border: '1.5px solid #475569',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              padding: 4,
            }}
          >
            <div
              style={{
                width: 3,
                height: 6,
                borderRadius: 2,
                background: '#64748b',
                animation: 'drip 1.8s ease-in-out infinite',
              }}
            />
          </div>
          <p style={{ fontSize: 10, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            scroll
          </p>
        </div>
      </section>

      {/* ── Below fold: brief context cards ── */}
      <section
        style={{
          padding: '60px 40px 80px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 20,
          maxWidth: 800,
          margin: '0 auto',
          width: '100%',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {[
          {
            icon: '💧',
            title: 'Every prompt',
            body: 'costs ~39 mL of water for cooling AI data centers.',
          },
          {
            icon: '🔍',
            title: 'Googling instead',
            body: 'uses far less energy. We nudge you at the right moment.',
          },
          {
            icon: '🛡️',
            title: 'Your data, private',
            body: 'We flag sensitive info before it leaves your browser.',
          },
        ].map((card) => (
          <div
            key={card.title}
            style={{
              background: 'rgba(11,22,40,0.6)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              padding: '24px 20px',
            }}
          >
            <span style={{ fontSize: 24, display: 'block', marginBottom: 10 }}>{card.icon}</span>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 5 }}>{card.title}</p>
            <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>{card.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
