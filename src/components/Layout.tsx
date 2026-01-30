import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  onNavigate?: (url: string) => void;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function Layout({ children, onNavigate, showHeader = true, showFooter = true }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {showHeader && <Header onNavigate={onNavigate} />}
      <main className={`flex-grow ${showHeader ? 'pt-16' : ''}`}>
        {children}
      </main>
      {showFooter && <Footer onNavigate={onNavigate} />}
    </div>
  );
}
