import React, { useState, useEffect, useCallback } from 'react';
import Lenis from 'lenis';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import ContactPage from './components/ContactPage';
import DashboardPage from './components/DashboardPage';
import AdminPanelPage from './components/AdminPanelPage';
import { SITE_CONFIG } from './config/siteConfig';

function getInitialRoute() {
  const cleanPath = window.location.pathname.replace(/\/+$/, '');
  if (cleanPath === '/adminpanel') return 'adminpanel';
  return 'home';
}

export default function App() {
  const [activePage, setActivePage] = useState(getInitialRoute);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [blockedNotice, setBlockedNotice] = useState('');
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);

  // Inisialisasi Lenis Smooth Scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // Dengarkan tombol Back/Forward browser untuk /adminpanel
  useEffect(() => {
    const onPopState = () => setActivePage(getInitialRoute());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const loadMemberProfile = useCallback(async (currentUser) => {
    if (!currentUser || !supabase) return null;

    const { data: prof } = await supabase
      .from('member_profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (prof && prof.is_active === false) {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setBlockedNotice(
        `Akses akun ini dinonaktifkan oleh pengelola. Hubungi ${SITE_CONFIG.ownerTelegramHandle} untuk bantuan.`
      );
      setActivePage('login');
      return null;
    }

    setBlockedNotice('');
    setProfile(prof || null);
    return prof;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getSession().then(async ({ data }) => {
      const currentUser = data?.session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        const prof = await loadMemberProfile(currentUser);
        if (prof && getInitialRoute() === 'home') {
          setActivePage('dashboard');
        }
      }
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const updatedUser = session?.user || null;
        setUser(updatedUser);

        if (updatedUser) {
          const prof = await loadMemberProfile(updatedUser);
          if (prof) {
            setActivePage((prev) =>
              prev === 'login' || prev === 'home' ? 'dashboard' : prev
            );
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, [loadMemberProfile]);

  const handleNavigate = (pageId) => {
    if (
      window.location.pathname.replace(/\/+$/, '') === '/adminpanel' &&
      pageId !== 'adminpanel'
    ) {
      window.history.pushState({}, '', '/');
    }

    if (pageId === 'dashboard' && !user) {
      setActivePage('login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setActivePage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    if (window.location.pathname.replace(/\/+$/, '') === '/adminpanel') {
      window.history.pushState({}, '', '/');
    }
    setActivePage('home');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F5F8] text-[#0B1220]">
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        user={user}
        profile={profile}
        onSignOut={handleSignOut}
      />

      <main className="flex-1">
        {!authReady ? (
          <div className="py-24 text-center text-sm text-[#64748B]">Memuat sesi...</div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {activePage === 'home' && (
                <LandingPage user={user} onNavigate={handleNavigate} />
              )}

              {activePage === 'login' && (
                <LoginPage
                  onBackHome={() => handleNavigate('home')}
                  onGoContact={() => handleNavigate('contact')}
                  blockedNotice={blockedNotice}
                />
              )}

              {activePage === 'contact' && <ContactPage />}

              {activePage === 'dashboard' && user && (
                <DashboardPage
                  user={user}
                  profile={profile}
                  onProfileRefresh={() => loadMemberProfile(user)}
                />
              )}

              {activePage === 'adminpanel' && (
                <AdminPanelPage
                  user={user}
                  onBackHome={() => handleNavigate(user ? 'dashboard' : 'home')}
                  onSignOut={handleSignOut}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <footer className="bg-white border-t border-[#DCE2EC] py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1D4ED8]" />
            <span className="text-sm font-semibold text-[#0B1220]">
              {SITE_CONFIG.appName}
            </span>
          </div>
          <p className="text-xs font-mono text-[#64748B]">
            © {new Date().getFullYear()} {SITE_CONFIG.appName} — Developed by{' '}
            {SITE_CONFIG.ownerName}
          </p>
        </div>
      </footer>
    </div>
  );
}
