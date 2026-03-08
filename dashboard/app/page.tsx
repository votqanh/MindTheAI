'use client';

import { useEffect, useState, useRef } from 'react';
import { getAllStats } from '@/lib/storage';
import { formatWater, formatCups } from '@/lib/format';

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
            background: `var(--accent)`,
            opacity: 0.04 + (i % 3) * 0.02,
            animation: `dropFall ${4 + i * 0.8}s linear ${i * 1.1}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState<{ savedMl: number; usedMl: number; googleRedirects: number } | null>(null);
  const [tip, setTip] = useState<string>('');
  const savedDisplay = useCountUp(stats?.savedMl ?? 0);

  const tips = [
    "Don't be polite to AI: skipping 'please' and 'thank you' saves tokens and minor energy.",
    "Use 'Output as [format]' in your first prompt to avoid energy-heavy follow-up regenerations.",
    "Limit responses: ask for 'top 3 points' or 'max 100 words' to reduce per-prompt compute waste.",
    "For coding, ask for 'minimal diffs' rather than full file rewrites to save tokens and cooling.",
    "Chain of Thought: ask AI to 'think step-by-step' for better accuracy in one shot, avoiding retries.",
    "Draft locally: refine your thoughts in a text editor before prompt submission to avoid re-runs.",
    "Use temperature settings: lower 'temperature' (0.1–0.3) for factual queries to reduce randomness."
  ];

  useEffect(() => {
    getAllStats().then((s) =>
      setStats({ 
        savedMl: s.waterStats.waterSavedMl, 
        usedMl: s.waterStats.waterUsedMl,
        googleRedirects: s.waterStats.googleRedirects
      })
    );
    setTip(tips[Math.floor(Math.random() * tips.length)]);
  }, []);

  const cups = ((stats?.savedMl ?? 0) / 240).toFixed(1);
  const liters = (savedDisplay / 1000).toFixed(1);

  return (
    <div
      className="relative min-h-screen flex flex-col"
      style={{ 
        color: 'var(--text-primary)' 
      }}
    >
      {/* Nature background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {/* Theme-aware background image */}
      <img
        src="/nature-bg.png"
        alt=""
        aria-hidden="true"
        className="dark-only"
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
      <img
        src="/light-nature-bg.png"
        alt=""
        aria-hidden="true"
        className="light-only"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      {/* Dark overlay for readability */}
      <div
        className="light-overlay-transition"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--overlay-bg, linear-gradient(180deg, rgba(11,22,40,0.4) 0%, rgba(11,22,40,0.55) 50%, rgba(11,22,40,0.85) 100%))',
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
        @keyframes waterDrip {
          0%   { transform: translateY(0px) scaleY(1); }
          40%  { transform: translateY(6px) scaleY(0.97); }
          55%  { transform: translateY(8px) scaleY(0.95); }
          70%  { transform: translateY(5px) scaleY(0.98); }
          100% { transform: translateY(0px) scaleY(1); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(1.05); }
        }
        @keyframes subtlePulse {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50%       { opacity: 1; transform: scale(1.01); }
        }
        @keyframes squishBreathe {
          0%, 100% { transform: translateY(0) scale(1, 1); }
          50%       { transform: translateY(-4px) scale(1.03, 0.97); }
        }
        @keyframes birdPerch {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%       { transform: translateY(-2px) rotate(2deg); }
        }
        .dark-only { display: block; }
        .light-only { display: none; }
        .light .dark-only { display: none; }
        .light .light-only { display: block; }
      `}</style>


      {/* ── Hero: full-height centred ── */}
      <section
        className="relative flex flex-col items-center justify-center text-center"
        style={{ minHeight: '100vh', padding: '40px 40px 140px', position: 'relative', zIndex: 2 }}
      >
        {/* AI Tip of the Day - Relocated to top */}
        <div 
          style={{
            padding: '10px 24px',
            background: 'rgba(20, 184, 166, 0.25)',
            border: '1px solid rgba(20, 184, 166, 0.5)',
            borderRadius: '100px',
            maxWidth: '720px',
            width: '100%',
            backdropFilter: 'blur(16px)',
            animation: 'subtlePulse 6s ease-in-out infinite',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 24,
            textAlign: 'center'
          }}
        >
          <span style={{ 
            fontSize: 10, 
            textTransform: 'uppercase', 
            letterSpacing: '0.15em', 
            color: '#0f766e', 
            fontWeight: 800,
            whiteSpace: 'nowrap',
            opacity: 0.8,
            lineHeight: 1
          }}>
            AI Tip:
          </span>
          <p style={{ 
            fontSize: 13, 
            color: '#064e3b', 
            lineHeight: 1.3,
            fontWeight: 700,
            margin: 0
          }}>
            {tip || "Loading tip..."}
          </p>
        </div>

        {/* Logo Container with Glow & Bird Perched on top */}
        <div style={{
          position: 'relative',
          width: 200,
          height: 200,
          margin: '0 auto 24px',
        }}>
          {/* The bird was previously here, moved to settings */}
          {/* Subtle ambient glow */}
          <div
            style={{
              position: 'absolute',
              inset: -16,
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.10) 0%, transparent 60%)',
              animation: 'glowPulse 5s ease-in-out infinite',
              zIndex: 0,
              borderRadius: '50%',
            }}
          />
          <img
            src="/water-logo.svg"
            alt="MindTheAI"
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              zIndex: 1,
              opacity: 0.92,
              filter: 'drop-shadow(0 0 18px rgba(59, 130, 246, 0.35)) drop-shadow(0 0 6px rgba(59, 130, 246, 0.15))',
              animation: 'waterDrip 3.5s ease-in-out infinite',
            }}
          />
        </div>

        {/* Stats card — Robot is perched on top of it */}
        <div style={{
          position: 'relative',
          display: 'inline-block',
          padding: '32px 48px 28px',
          marginBottom: 12,
          textAlign: 'center',
        }}>
          {/* Robot was previously here */}

          {/* Main number: Liters equivalent for more visceral impact */}
          <div style={{ marginBottom: 12 }}>
            <span
              style={{
                fontSize: 'clamp(64px, 12vw, 110px)',
                fontWeight: 800,
                letterSpacing: '-3px',
                lineHeight: 1,
                background: 'linear-gradient(160deg, #14b8a6 10%, #0f766e 55%, #0c6456 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'block',
                isolation: 'isolate',
              }}
            >
              {liters}
            </span>
          </div>

          {/* Unit label: Liters */}
          <p
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#065f46',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            Liters of water saved
          </p>

          {/* Literal amount: Cups — styled to match the liters gradient */}
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ color: '#065f46', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>≈</span>
            <span
              style={{
                fontSize: 'clamp(28px, 5vw, 40px)',
                fontWeight: 800,
                letterSpacing: '-1px',
                lineHeight: 1,
                background: 'linear-gradient(160deg, #14b8a6 10%, #0f766e 55%, #0c6456 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                isolation: 'isolate',
              }}
            >
              {formatCups(savedDisplay)}
            </span>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#065f46', opacity: 1, letterSpacing: '0.05em' }}>cups</span>
          </div>
        </div>

        {/* Thin divider */}
        <div
          style={{
            width: 48,
            height: 1,
             background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
            marginBottom: 12,
          }}
        />

        {/* Secondary micro-stats */}
        <div style={{ display: 'flex', gap: 48, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          {[
             { value: stats?.usedMl ?? 0, label: 'used on AI', color: 'var(--text-secondary)', isWater: true },
             { value: stats?.googleRedirects ?? 0, label: 'prompts to Google', color: 'var(--text-secondary)', isWater: false },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 2 }}>
                {s.isWater ? formatWater(s.value) : s.value.toLocaleString()}
              </p>
               <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
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
               border: '1.5px solid var(--text-muted)',
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
                 background: 'var(--text-secondary)',
                animation: 'drip 1.8s ease-in-out infinite',
              }}
            />
          </div>
           <p style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
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
               background: 'var(--bg-card)',
               backdropFilter: 'blur(12px)',
               border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '24px 20px',
            }}
          >
            <span style={{ fontSize: 24, display: 'block', marginBottom: 10 }}>{card.icon}</span>
             <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 5 }}>{card.title}</p>
             <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{card.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
