import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'MindTheAI — Responsible AI Dashboard',
  description:
    'Track the water cost of your AI usage and protect sensitive data with the MindTheAI Chrome extension.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const settings = JSON.parse(localStorage.getItem('mindtheai_settings') || '{}');
                if (settings.theme === 'light') {
                  document.documentElement.classList.add('light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Sidebar />
        <ThemeToggle />
        {/* Page content offset by sidebar width */}
        <div style={{ marginLeft: '240px', minHeight: '100vh' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
