'use client';

import { useEffect, useState } from 'react';
import { getAllStats, saveSettings, saveAllStats, getDefaultSettings, type Settings, type OnePasswordSettings } from '@/lib/storage';
import { formatWater } from '@/lib/format';
import { Droplets, ShieldCheck, CheckCircle2, KeyRound, Eye, EyeOff, ExternalLink, Download, Upload, Sprout } from 'lucide-react';

const SITES = [
  {
    key: 'chatgpt',
    label: 'ChatGPT',
    url: 'chatgpt.com',
    icon: <img src="/logos/chatgpt.svg" alt="ChatGPT" width="18" height="18" className="opacity-80" />
  },
  {
    key: 'gemini',
    label: 'Gemini',
    url: 'gemini.google.com',
    icon: <img src="/logos/gemini.svg" alt="Gemini" width="18" height="18" />
  },
  {
    key: 'claude',
    label: 'Claude',
    url: 'claude.ai',
    icon: <img src="/logos/claude.svg" alt="Claude" width="18" height="18" />
  },
  {
    key: 'grok',
    label: 'Grok',
    url: 'grok.com',
    icon: <img src="/logos/grok.svg" alt="Grok" width="18" height="18" className="invert brightness-0" />
  },
  {
    key: 'copilot',
    label: 'Copilot',
    url: 'copilot.microsoft.com',
    icon: <img src="/logos/copilot.svg" alt="Copilot" width="18" height="18" />
  },
  {
    key: 'perplexity',
    label: 'Perplexity',
    url: 'perplexity.ai',
    icon: <img src="/logos/perplexity.svg" alt="Perplexity" width="18" height="18" />
  },
];

/* ── Toggle pill ── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: checked ? 'var(--accent)' : 'var(--border)',
        boxShadow: checked ? '0 0 10px var(--accent-glow)' : 'none',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        flexShrink: 0,
        transition: 'background 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <span
        style={{
          display: 'block',
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
          position: 'absolute',
          top: 4,
          left: checked ? 24 : 4,
          transition: 'left 0.2s ease',
        }}
      />
    </button>
  );
}

/* ── Section heading ── */
function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      {icon}
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
        {label}
      </p>
    </div>
  );
}

/* ── Setting row ── */
function SettingRow({ icon, label, sub, checked, onChange }: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        borderRadius: 12,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        marginBottom: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{icon}</div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{label}</p>
          {sub && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>{sub}</p>}
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

/* ── Input field ── */
function FieldInput({ label, value, onChange, placeholder, type = 'text', hint }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={isPassword && !visible ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '10px 14px',
            paddingRight: isPassword ? 42 : 14,
            borderRadius: 10,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontSize: 13,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        {isPassword && (
          <button
            onClick={() => setVisible(!visible)}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
            }}
          >
            {visible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
      {hint && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [opTestResult, setOpTestResult] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  useEffect(() => {
    getAllStats().then(({ settings }) => {
      setSettings(settings);
      setGoalInput(String(settings.monthlyGoalMl));
    });
  }, []);

  const update = async (next: Settings) => {
    setSettings(next);
    await saveSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const setFeature = (key: 'waterCheckEnabled' | 'privacyCheckEnabled', val: boolean) => {
    if (!settings) return;
    update({ ...settings, [key]: val });
  };

  const setSite = (site: string, val: boolean) => {
    if (!settings) return;
    update({ ...settings, sites: { ...settings.sites, [site]: val } });
  };

  const setOP = (key: keyof OnePasswordSettings, val: boolean | string) => {
    if (!settings) return;
    update({ ...settings, onePassword: { ...settings.onePassword, [key]: val } });
  };

  const handleGoalSave = () => {
    if (!settings) return;
    const n = parseInt(goalInput, 10);
    if (!isNaN(n) && n > 0) update({ ...settings, monthlyGoalMl: n });
  };

  const testOnePassword = async () => {
    if (!settings) return;
    const { authMode, connectUrl, accessToken, serviceAccountToken, vaultId } = settings.onePassword;

    if (authMode === 'connect') {
      if (!connectUrl || !accessToken || !vaultId) {
        setOpTestResult('error');
        return;
      }
    } else {
      if (!serviceAccountToken || !vaultId) {
        setOpTestResult('error');
        return;
      }
    }

    setOpTestResult('loading');
    try {
      if (authMode === 'connect') {
        const res = await fetch(`${connectUrl!.replace(/\/$/, '')}/v1/vaults/${vaultId}/items`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setOpTestResult(res.ok ? 'ok' : 'error');
      } else {
        // For service account, we test via our own API route
        const res = await fetch('/api/1password/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceAccountToken,
            vaultId,
            testOnly: true
          }),
        });
        setOpTestResult(res.ok ? 'ok' : 'error');
      }
    } catch {
      setOpTestResult('error');
    }
  };

  const handleExport = async () => {
    const data = await getAllStats();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindtheai-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.settings && json.waterStats && json.privacyStats) {
          await saveAllStats(json);
          setSettings(json.settings);
          setGoalInput(String(json.settings.monthlyGoalMl));
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
          alert('Data imported successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Error parsing backup file.');
      }
    };
    reader.readAsText(file);
    // Clear input
    e.target.value = '';
  };

  if (!settings) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#475569', fontSize: 14 }}>Loading settings…</p>
      </div>
    );
  }

  const sectionBox = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '20px 18px',
    marginBottom: 16,
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-primary)',
      padding: '40px 32px 60px',
      color: 'var(--text-primary)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Settings</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Control how MindTheAI protects you</p>
        </div>
        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#22c55e' }}>
            <CheckCircle2 size={14} /> Saved
          </div>
        )}
      </div>

      <div style={{ maxWidth: 540 }}>
        {/* ── Data Management ── */}
        <div style={sectionBox}>
          <SectionTitle icon={<Upload size={14} style={{ color: 'var(--text-secondary)' }} />} label="Data Management" />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            Backup your stats and settings to a JSON file, or restore from a previous backup.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleExport}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <Download size={16} /> Export Data
            </button>
            <label
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <Upload size={16} /> Import Data
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
        {/* ── Features ── */}
        {/* Squishy Sapling perched on the Features card */}
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute',
            top: -36,
            right: -12,
            width: 60,
            height: 60,
            zIndex: 10,
            animation: 'squishBreathe 5s ease-in-out infinite',
            pointerEvents: 'none',
          }}>
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes squishBreathe {
                0%, 100% { transform: translateY(0) scaleY(1) scaleX(1); }
                50%       { transform: translateY(-3px) scaleY(0.96) scaleX(1.04); }
              }
            ` }} />
            <img src="/squishy-sapling.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={sectionBox}>
          <SectionTitle icon={<Droplets size={14} style={{ color: 'var(--accent)' }} />} label="Features" />
          <SettingRow
            icon={<Droplets size={16} />}
            label="Water Awareness"
            sub="Tooltip when you start typing a prompt"
            checked={settings.waterCheckEnabled}
            onChange={(v) => setFeature('waterCheckEnabled', v)}
          />
          <SettingRow
            icon={<ShieldCheck size={16} />}
            label="Privacy Detection"
            sub="Highlight sensitive data before you send"
            checked={settings.privacyCheckEnabled}
            onChange={(v) => setFeature('privacyCheckEnabled', v)}
          />
          <SettingRow
            icon={<ExternalLink size={16} />}
            label="Auto-open Dashboard"
            sub="Automatically open your dashboard on every new tab"
            checked={settings.autoOpenDashboard}
            onChange={(v) => update({ ...settings, autoOpenDashboard: v })}
          />
          <SettingRow
            icon={<Droplets size={16} />}
            label="Hide AI Overview"
            sub="Append &udm=14 to Google searches for web-only results"
            checked={settings.hideAIOverview}
            onChange={(v) => update({ ...settings, hideAIOverview: v })}
          />
          <SettingRow
            icon={<Droplets size={16} />}
            label="Pleasantry Detection"
            sub="Save water by removing 'hi', 'thanks', etc. from prompts"
            checked={settings.pleasantryCheckEnabled}
            onChange={(v) => update({ ...settings, pleasantryCheckEnabled: v })}
          />
        </div>
        </div>

        {/* ── Sites ── */}
        <div style={sectionBox}>
          <SectionTitle icon={<ShieldCheck size={14} style={{ color: 'var(--accent)' }} />} label="Active Sites" />
          {SITES.map(({ key, label, url, icon }) => (
            <SettingRow
              key={key}
              icon={icon}
              label={label}
              sub={url}
              checked={(settings.sites as any)[key] ?? true}
              onChange={(v) => setSite(key, v)}
            />
          ))}
        </div>

        {/* ── Monthly Goal ── */}
        <div style={sectionBox}>
          <SectionTitle icon={<Droplets size={14} style={{ color: 'var(--accent)' }} />} label="Monthly Water Saving Goal" />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            How much water (mL) do you want to save this month by using Google instead?
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                min={1}
                placeholder="5000"
                style={{
                  width: '100%', padding: '10px 46px 10px 14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 10, color: 'var(--text-primary)', fontSize: 13,
                  outline: 'none', fontFamily: 'inherit',
                }}
              />
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-muted)' }}>
                mL
              </span>
            </div>
            <button
              onClick={handleGoalSave}
              style={{
                padding: '10px 18px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                background: 'var(--accent)',
                color: 'white', border: 'none', cursor: 'pointer', flexShrink: 0,
                boxShadow: '0 3px 10px var(--accent-glow)',
              }}
            >
              Save
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Current: <span style={{ color: 'var(--accent)' }}>{formatWater(settings.monthlyGoalMl)}</span>
            {' '}≈ {(settings.monthlyGoalMl / 240).toFixed(1)} cups
          </p>
        </div>

        {/* ── Preferred Search Engine ── */}
        <div style={sectionBox}>
          <SectionTitle icon={<ExternalLink size={14} style={{ color: 'var(--accent)' }} />} label="Preferred Search Engine" />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
            Choose where to redirect prompts when you click "Google It".
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { id: 'google', label: 'Google (Default)', icon: '🔍' },
              { id: 'ecosia', label: 'Ecosia (Plants trees)', icon: '🌳' },
              { id: 'other', label: 'Other / Custom', icon: '🔗' },
            ].map((option) => (
              <label
                key={option.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  background: 'var(--bg-secondary)', borderRadius: 10, cursor: 'pointer',
                  border: settings.preferredBrowser.type === option.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  type="radio"
                  name="browserPref"
                  checked={settings.preferredBrowser.type === option.id}
                  onChange={() => update({ ...settings, preferredBrowser: { ...settings.preferredBrowser, type: option.id as any } })}
                   style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
                 <span style={{ fontSize: 16 }}>{option.icon}</span>
                 <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{option.label}</span>
              </label>
            ))}

            {settings.preferredBrowser.type === 'other' && (
              <div style={{ paddingLeft: 28, marginTop: 4 }}>
                <FieldInput
                  label="Custom Search URL"
                  value={settings.preferredBrowser.customUrl || ''}
                  onChange={(v) => update({ ...settings, preferredBrowser: { ...settings.preferredBrowser, customUrl: v } })}
                  placeholder="https://duckduckgo.com/?q="
                  hint="Must include the search query parameter (e.g. ?q=)"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── 1Password Vault ── */}
        <div style={sectionBox}>
          <SectionTitle icon={<KeyRound size={14} style={{ color: 'var(--warning)' }} />} label="1Password Vault Secrets" />

          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
            Automatically detect vault credentials in AI prompts. Choose between a self-hosted <strong style={{ color: 'var(--text-secondary)' }}>Connect server</strong> or a direct <strong style={{ color: 'var(--text-secondary)' }}>Service Account</strong>.
          </p>

          {/* Enable toggle */}
          <SettingRow
            icon={<KeyRound size={16} />}
            label="Enable 1Password detection"
            sub="Check if any typed text matches a vault credential"
            checked={settings.onePassword.enabled}
            onChange={(v) => setOP('enabled', v)}
          />

          {settings.onePassword.enabled && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {/* Mode Toggle */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                {[
                  { id: 'connect', label: 'Connect Server' },
                  { id: 'service-account', label: 'Service Account' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setOP('authMode', m.id)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                      background: settings.onePassword.authMode === m.id ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                      color: settings.onePassword.authMode === m.id ? 'var(--accent)' : 'var(--text-muted)',
                      border: settings.onePassword.authMode === m.id ? '1px solid var(--border-hover)' : '1px solid var(--border)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {settings.onePassword.authMode === 'connect' ? (
                <>
                  <FieldInput
                    label="Connect Server URL"
                    value={settings.onePassword.connectUrl || ''}
                    onChange={(v) => setOP('connectUrl', v)}
                    placeholder="https://your-connect-server"
                    hint="Include https://, no trailing slash needed"
                  />
                  <FieldInput
                    label="API Access Token"
                    value={settings.onePassword.accessToken || ''}
                    onChange={(v) => setOP('accessToken', v)}
                    placeholder="eyJhbGci…"
                    type="password"
                    hint="Generated in your 1Password Connect server dashboard"
                  />
                </>
              ) : (
                <FieldInput
                  label="Service Account Token"
                  value={settings.onePassword.serviceAccountToken || ''}
                  onChange={(v) => setOP('serviceAccountToken', v)}
                  placeholder="ov_sau_..."
                  type="password"
                  hint="Create a Service Account in your 1Password billing settings"
                />
              )}

              <FieldInput
                label="Vault ID"
                value={settings.onePassword.vaultId}
                onChange={(v) => setOP('vaultId', v)}
                placeholder="abc123def456…"
                hint={'Find this in 1Password → vault → share → copy the UUID from the URL'}
              />

              {/* Test connection */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                <button
                  onClick={testOnePassword}
                  disabled={opTestResult === 'loading'}
                  style={{
                    padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                    background: 'var(--accent-glow)',
                    border: '1px solid var(--border)',
                    color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit',
                    opacity: opTestResult === 'loading' ? 0.6 : 1,
                  }}
                >
                  {opTestResult === 'loading' ? 'Testing…' : 'Test Connection'}
                </button>
                {opTestResult === 'ok' && (
                  <span style={{ fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={13} /> Connected
                  </span>
                )}
                {opTestResult === 'error' && (
                  <span style={{ fontSize: 12, color: '#ef4444' }}>
                    ✕ Could not connect — check URL, token, and vault ID
                  </span>
                )}
              </div>
            </div>
          )}
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
