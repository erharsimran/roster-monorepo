import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Roster | Workforce Management',
  description: 'Scheduling, time tracking, and labor analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="min-h-screen antialiased bg-neutral-950 text-neutral-100"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}