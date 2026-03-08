'use client';

import { useEffect, useState } from 'react';
import { getAllStats, type AllStats } from '@/lib/storage';
import { formatWater, formatCups } from '@/lib/format';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts';
import { 
  Droplets, ShieldCheck, Phone, MapPin, Key, Mail, Calendar, Activity, 
  Waves
} from 'lucide-react';

const PRIVACY_ICONS: Record<string, React.ReactNode> = {
  phone: <Phone size={14} />,
  email: <Mail size={14} />,
  address: <MapPin size={14} />,
  vault: <ShieldCheck size={14} />,
};

const PRIVACY_LABELS: Record<string, string> = {
  phone: 'Phone Numbers',
  email: 'Email Addresses',
  address: 'Addresses',
  vault: '1Password Vault Secrets',
};

const PRIVACY_COLORS: Record<string, string> = {
  phone: '#f59e0b',
  email: '#a78bfa',
  address: '#22c55e',
  vault: '#0ea5e9',
};

// Mock historical data for charts

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <p style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, margin: 0 }}>
          {unit === 'mL' ? formatWater(payload[0].value) : (
            <>{payload[0].value.toLocaleString()} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>{unit}</span></>
          )}
        </p>
      </div>
    );
  }
  return null;
};

/* ── Section Title ── */
function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
      {icon}
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
        {label}
      </p>
    </div>
  );
}

/* ── Metrics Card ── */
function MetricCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub: React.ReactNode; icon: React.ReactNode; color: string;
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '20px 18px',
      flex: 1,
      minWidth: '200px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: color
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{value}</p>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</p>
    </div>
  );
}

export default function InsightsPage() {
  const [stats, setStats] = useState<AllStats | null>(null);

  useEffect(() => {
    getAllStats().then(setStats);
  }, []);

  if (!stats) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Generating insights…</p>
      </div>
    );
  }

  const { waterStats, privacyStats, settings } = stats;
  const goalMl = settings.monthlyGoalMl;
  const savedMl = waterStats.waterSavedMl;
  const usedMl = waterStats.waterUsedMl;
  const goalProgress = Math.min((savedMl / goalMl) * 100, 100);

  // Transform real history for charts, showing only the last 7 days
  const history = [...(waterStats.dailyHistory || [])].sort((a,b) => a.date.localeCompare(b.date));
  const recentHistory = history.slice(-7);
  const chartData = recentHistory.length > 0 
    ? recentHistory.map(d => ({
        day: new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
        saved: d.saved,
        prompts: d.prompts
      }))
    : [{ day: 'Today', saved: 0, prompts: 0 }];

  const privacyBuckets: Record<string, { detected: number; removed: number }> = {
    phone: { detected: 0, removed: 0 },
    email: { detected: 0, removed: 0 },
    address: { detected: 0, removed: 0 },
    vault: { detected: 0, removed: 0 },
  };
  for (const entry of privacyStats.detected) {
    if (privacyBuckets[entry.type]) {
      privacyBuckets[entry.type].detected++;
      if (entry.removed) privacyBuckets[entry.type].removed++;
    }
  }

  const sectionBox = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '24px',
    marginBottom: 20,
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-primary)',
      padding: '40px 32px 60px',
      color: 'var(--text-primary)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Insights</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Your environmental impact and security footprint</p>
      </div>

      <div style={{ maxWidth: 960 }}>
        {/* ── Summary Metrics ── */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {/* Squishy Robot perched on top of the first metric card */}
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <div style={{
              position: 'absolute',
              top: -36,
              right: -8,
              width: 64,
              height: 64,
              zIndex: 10,
              animation: 'squishBreathe 4s ease-in-out infinite',
              pointerEvents: 'none',
            }}>
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes squishBreathe {
                  0%, 100% { transform: translateY(0) scaleY(1) scaleX(1); }
                  50%       { transform: translateY(-4px) scaleY(0.96) scaleX(1.04); }
                }
              ` }} />
              <img src="/squishy-robot.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <MetricCard
              label="Total Saved"
              value={formatWater(savedMl)}
              sub={
                <span>
                  ≈ <strong style={{ color: 'var(--accent)' }}>{formatCups(savedMl)} cups</strong> saved this month
                </span>
              }
              icon={<Droplets size={16} />}
              color="#0ea5e9"
            />
          </div>
          <MetricCard
            label="Security Blocks"
            value={`${privacyStats.detected.filter(d => d.removed).length}`}
            sub="Sensitive items removed"
            icon={<ShieldCheck size={16} />}
            color="#22c55e"
          />
          <MetricCard
            label="Activity"
            value={`${waterStats.aiPromptsCount + waterStats.googleRedirects}`}
            sub="Total interactions"
            icon={<Activity size={16} />}
            color="#a78bfa"
          />
        </div>

        {/* ── Water Saved Over Time (Area Chart) ── */}
        <div style={sectionBox}>
          <SectionTitle icon={<Calendar size={14} style={{ color: '#0ea5e9' }} />} label="Water Saved Over Time" />
          <div style={{ height: 240, width: '100%', marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip unit="mL" />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
                <Area 
                  type="monotone" 
                  dataKey="saved" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSaved)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20, marginBottom: 20 }}>
          {/* ── AI Prompts Over Time (Bar Chart) ── */}
          <div style={{ ...sectionBox, marginBottom: 0 }}>
            <SectionTitle icon={<Activity size={14} style={{ color: '#a78bfa' }} />} label="AI Prompt Activity" />
            <div style={{ height: 200, width: '100%', marginTop: 10 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip unit="prompts" />} cursor={{ fill: 'var(--border)' }} />
                  <Bar 
                    dataKey="prompts" 
                    fill="#a78bfa" 
                    radius={[4, 4, 0, 0]} 
                    animationDuration={1500}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={index} fillOpacity={0.6 + (index / 10)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Privacy Status ── */}
          <div style={{ position: 'relative' }}>
            {/* Squishy Bird perched on the Privacy Detections section */}
            <div style={{
              position: 'absolute',
              top: -28,
              right: 8,
              width: 52,
              height: 52,
              zIndex: 10,
              animation: 'birdPerch 3s ease-in-out infinite',
              pointerEvents: 'none',
            }}>
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes birdPerch {
                  0%, 100% { transform: translateY(0) rotate(0deg); }
                  50%       { transform: translateY(-2px) rotate(2deg); }
                }
              ` }} />
              <img src="/squishy-bird.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ ...sectionBox, marginBottom: 0 }}>
              <SectionTitle icon={<ShieldCheck size={14} style={{ color: '#22c55e' }} />} label="Privacy Detections" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(privacyBuckets).map(([type, counts]) => (
                  <div key={type} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: 12, background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ color: PRIVACY_COLORS[type], opacity: 0.8 }}>{PRIVACY_ICONS[type]}</div>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{PRIVACY_LABELS[type]}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {counts.removed} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>/ {counts.detected}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ 
                marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'var(--accent-glow)',
                border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8
              }}>
                <ShieldCheck size={14} style={{ color: 'var(--accent)' }} />
                <p style={{ fontSize: 11, color: 'var(--accent)', margin: 0, fontWeight: 500 }}>
                  {privacyStats.detected.length > 0 ? 'Your data is being actively protected' : 'No sensitive data detected yet'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Monthly Savings Goal ── */}
        <div style={sectionBox}>
          <SectionTitle icon={<Droplets size={14} style={{ color: '#0ea5e9' }} />} label="Monthly Goal Progress" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Total Saved: <strong style={{ color: 'var(--accent)' }}>{formatWater(savedMl)}</strong> / {formatWater(goalMl)}</p>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{goalProgress.toFixed(0)}%</span>
          </div>
          <div style={{ 
            height: 8, width: '100%', borderRadius: 10, background: 'rgba(255,255,255,0.05)',
            overflow: 'hidden', position: 'relative'
          }}>
            <div style={{ 
              height: '100%', width: `${goalProgress}%`, 
              background: 'linear-gradient(90deg, var(--water), var(--accent))',
              borderRadius: 10, transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
            {goalProgress >= 100 
              ? "🎉 Amazing! You've achieved your monthly environmental goal." 
              : `You are ${formatWater(goalMl - savedMl)} away from your monthly goal of ${formatWater(goalMl)}.`}
          </p>
        </div>
      </div>

      {/* Sapling Pixar character — bottom-right corner */}
      <img
        src="/sapling-pixar.png"
        alt=""
        aria-hidden="true"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 80,
          height: 80,
          objectFit: 'contain',
          zIndex: 50,
          pointerEvents: 'none',
          animation: 'squishBreathe 5s ease-in-out infinite',
        }}
      />
    </div>
  );
}
