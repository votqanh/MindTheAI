import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'MindTheAI — Responsible AI Dashboard',
  description:
    'Track the water cost of your AI usage and protect sensitive data with the MindTheAI Chrome extension.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Sidebar />
        {/* Page content offset by sidebar width */}
        <div style={{ marginLeft: '240px', minHeight: '100vh' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
