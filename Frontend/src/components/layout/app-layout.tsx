'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { GlassSidebar } from '@/components/oasis/glass-sidebar';
import { ContextualTopBar } from '@/components/oasis/contextual-top-bar';
import { MobileBottomBar } from '@/components/oasis/mobile-bottom-bar';
import { BottomSheetNav } from '@/components/oasis/bottom-sheet-nav';
import { ContextualFAB } from '@/components/oasis/contextual-fab';
import { OrganicBlobs } from '@/components/oasis/organic-blobs';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import { ChatOverlay } from '@/components/oasis/chat-overlay';
import { useTheme } from 'next-themes';

// --- Notification Toast ---
function NotificationToast() {
  const { notification, setNotification } = useAuthStore();

  const config = {
    success: {
      icon: CheckCircle,
      bg: 'bg-teal-500/10 border-teal-500/20',
      text: 'text-teal-800 dark:text-teal-300',
      iconColor: 'text-teal-500',
    },
    error: {
      icon: XCircle,
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-800 dark:text-red-300',
      iconColor: 'text-red-500',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-amber-500/10 border-amber-500/20',
      text: 'text-amber-800 dark:text-amber-300',
      iconColor: 'text-amber-500',
    },
    info: {
      icon: Info,
      bg: 'bg-sky-500/10 border-sky-500/20',
      text: 'text-sky-800 dark:text-sky-300',
      iconColor: 'text-sky-500',
    },
  };

  // Auto-dismiss logic
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, setNotification]);

  return (
    <AnimatePresence>
      {notification && (() => {
        const { icon: Icon, bg, text, iconColor } = config[notification.type as keyof typeof config];
        return (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[90%] sm:max-w-md px-4"
          >
            <div className={cn('flex items-center gap-3 rounded-full border px-5 py-3.5 shadow-2xl backdrop-blur-xl ring-1 ring-white/20', bg)}>
              <div className={cn('size-8 rounded-full flex items-center justify-center shrink-0 bg-white/20', iconColor)}>
                <Icon className="size-4.5" />
              </div>
              <p className={cn('text-sm font-bold flex-1 leading-tight', text)}>{notification.message}</p>
              <button
                onClick={() => setNotification(null)}
                className="shrink-0 rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="size-4 text-slate-400" />
              </button>
            </div>
          </motion.div>
        );
      })()}
    </AnimatePresence>
  );
}

// --- Footer ---
function Footer() {
  return (
    <footer className="border-t border-border/30 px-4 py-3">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
            <span className="text-white font-bold text-[8px]">O</span>
          </div>
          <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">OASIS</span>
        </div>
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} OASIS — Encuentra tu oasis de salud
        </p>
      </div>
    </footer>
  );
}

// --- Main Layout ---
interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated } = useAuthStore();
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const sidebarExpanded = isDesktop && (sidebarPinned || sidebarHovered);
  const sidebarWidth = isDesktop ? (sidebarExpanded ? 260 : 72) : 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background relative">
        <OrganicBlobs />
        <main className="relative z-10 flex-1 flex items-center justify-center p-4">
          {children}
        </main>
        <Footer />
        <NotificationToast />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background relative">
      <OrganicBlobs />

      {/* Desktop Sidebar — hover to expand */}
      <div
        className="hidden lg:block relative z-30 shrink-0"
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        <GlassSidebar />
      </div>

      {/* Mobile Bottom Sheet */}
      <BottomSheetNav
        open={bottomSheetOpen}
        onOpenChange={setBottomSheetOpen}
      />

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col min-w-0 relative z-10"
        style={{ marginLeft: isDesktop ? 0 : 0 }}
      >
        {/* Top Bar */}
        <ContextualTopBar onMenuClick={() => setBottomSheetOpen(true)} />

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto pb-24 lg:pb-6">
          {children}
        </main>

        {/* Footer — desktop only */}
        <div className="hidden lg:block">
          <Footer />
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <MobileBottomBar />

      {/* Mobile Contextual FAB */}
      <ContextualFAB />

      <ChatOverlay />
      <NotificationToast />
    </div>
  );
}
