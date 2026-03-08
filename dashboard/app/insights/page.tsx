'use client';

import { useEffect, useState } from 'react';
import { getAllStats, type AllStats } from '@/lib/storage';
import { formatWater } from '@/lib/format';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts';
import { Droplets, ShieldCheck, Phone, MapPin, Key, Mail, Calendar, Activity } from 'lucide-react';

const PRIVACY_ICONS: Record<string, React.ReactNode> = {
  phone: <Phone size={14} />,
  email: <Mail size={14} />,
  apikey: <Key size={14} />,
  address: <MapPin size={14} />,
};

const PRIVACY_LABELS: Record<string, string> = {
  phone: 'Phone Numbers',
  email: 'Email Addresses',
  apikey: 'API Keys / Tokens',
  address: 'Addresses',
};

const PRIVACY_COLORS: Record<string, string> = {
  phone: '#f59e0b',
  email: '#a78bfa',
  apikey: '#ef4444',
  address: '#22c55e',
};

// Mock historical data for charts
const HISTORICAL_DATA = [
  { day: 'Mon', saved: 420, prompts: 12 },
  { day: 'Tue', saved: 610, prompts: 18 },
  { day: 'Wed', saved: 290, prompts: 9 },
  { day: 'Thu', saved: 850, prompts: 24 },
  { day: 'Fri', saved: 530, prompts: 15 },
  { day: 'Sat', saved: 120, prompts: 4 },
  { day: 'Sun', saved: 210, prompts: 7 },
];

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
      }}>
        <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <p style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 700, margin: 0 }}>
          {unit === 'mL' ? formatWater(payload[0].value) : (
            <>{payload[0].value.toLocaleString()} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 400 }}>{unit}</span></>
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
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569' }}>
        {label}
      </p>
    </div>
  );
}

/* ── Metrics Card ── */
function MetricCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub: string; icon: React.ReactNode; color: string;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.06)',
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
        <span style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>{label}</span>
      </div>
      <p style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{value}</p>
      <p style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{sub}</p>
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617' }}>
        <p style={{ color: '#475569', fontSize: 14 }}>Generating insights…</p>
      </div>
    );
  }

  const { waterStats, privacyStats, settings } = stats;
  const goalMl = settings.monthlyGoalMl;
  const savedMl = waterStats.waterSavedMl;
  const usedMl = waterStats.waterUsedMl;
  const goalProgress = Math.min((savedMl / goalMl) * 100, 100);

  const privacyBuckets: Record<string, { detected: number; removed: number }> = {
    phone: { detected: 0, removed: 0 },
    email: { detected: 0, removed: 0 },
    apikey: { detected: 0, removed: 0 },
    address: { detected: 0, removed: 0 },
  };
  for (const entry of privacyStats.detected) {
    if (privacyBuckets[entry.type]) {
      privacyBuckets[entry.type].detected++;
      if (entry.removed) privacyBuckets[entry.type].removed++;
    }
  }

  const sectionBox = {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: '24px',
    marginBottom: 20,
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(circle at 100% 0%, #0f172a 0%, #020617 50%)',
      padding: '40px 32px 60px',
      color: '#f1f5f9'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Insights</h1>
        <p style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>Your environmental impact and security footprint</p>
      </div>

      <div style={{ maxWidth: 960 }}>
        {/* ── Summary Metrics ── */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <MetricCard
            label="Total Saved"
            value={formatWater(savedMl)}
            sub={`≈ ${(savedMl / 240).toFixed(1)} cups this month`}
            icon={<Droplets size={16} />}
            color="#0ea5e9"
          />
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
              <AreaChart data={HISTORICAL_DATA}>
                <defs>
                  <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 11 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip unit="mL" />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
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
                <BarChart data={HISTORICAL_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#475569', fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip unit="prompts" />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar 
                    dataKey="prompts" 
                    fill="#a78bfa" 
                    radius={[4, 4, 0, 0]} 
                    animationDuration={1500}
                  >
                    {HISTORICAL_DATA.map((entry, index) => (
                      <Cell key={index} fillOpacity={0.6 + (index / 10)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Privacy Status ── */}
          <div style={{ ...sectionBox, marginBottom: 0 }}>
            <SectionTitle icon={<ShieldCheck size={14} style={{ color: '#22c55e' }} />} label="Privacy Detections" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(privacyBuckets).map(([type, counts]) => (
                <div key={type} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ color: PRIVACY_COLORS[type], opacity: 0.8 }}>{PRIVACY_ICONS[type]}</div>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>{PRIVACY_LABELS[type]}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#cbd5e1', margin: 0 }}>
                      {counts.removed} <span style={{ fontSize: 11, color: '#475569', fontWeight: 400 }}>/ {counts.detected}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ 
              marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(34, 197, 94, 0.05)',
              border: '1px solid rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', gap: 8
            }}>
              <ShieldCheck size={14} style={{ color: '#22c55e' }} />
              <p style={{ fontSize: 11, color: '#22c55e', margin: 0, fontWeight: 500 }}>
                {privacyStats.detected.length > 0 ? 'Your data is being actively protected' : 'No sensitive data detected yet'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Monthly Savings Goal ── */}
        <div style={sectionBox}>
          <SectionTitle icon={<Droplets size={14} style={{ color: '#0ea5e9' }} />} label="Monthly Goal Progress" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0 }}>Total Saved: <strong style={{ color: '#0ea5e9' }}>{formatWater(savedMl)}</strong> / {formatWater(goalMl)}</p>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0ea5e9' }}>{goalProgress.toFixed(0)}%</span>
          </div>
          <div style={{ 
            height: 8, width: '100%', borderRadius: 10, background: 'rgba(255,255,255,0.05)',
            overflow: 'hidden', position: 'relative'
          }}>
            <div style={{ 
              height: '100%', width: `${goalProgress}%`, 
              background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
              borderRadius: 10, transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }} />
          </div>
          <p style={{ fontSize: 11, color: '#475569', marginTop: 12 }}>
            {goalProgress >= 100 
              ? "🎉 Amazing! You've achieved your monthly environmental goal." 
              : `You are ${formatWater(goalMl - savedMl)} away from your monthly goal of ${formatWater(goalMl)}.`}
          </p>
        </div>
      </div>
    </div>
  );
}
