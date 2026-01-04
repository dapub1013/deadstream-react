import type { ReactNode } from 'react';
import { Header } from '../molecules/Header';
import { Footer } from '../molecules/Footer';

interface MainLayoutProps {
  children: ReactNode;
}

/**
 * Main layout component with header, footer, and scrollable content area
 * Designed for 7" touchscreen (1280x720)
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      <Footer />
    </div>
  );
}
