import React, { useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { SITE_CONFIG } from '../config/siteConfig';

export default function Navbar({
  activePage,
  onNavigate,
  user,
  profile,
  onSignOut
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelect = (pageId) => {
    onNavigate(pageId);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DCE2EC]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Teks Merek Bersih */}
        <button
          type="button"
          onClick={() => handleSelect(user ? 'dashboard' : 'home')}
          className="inline-flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded"
        >
          <span className="w-2 h-2 rounded-full bg-[#1D4ED8]" />
          <span className="text-lg font-semibold tracking-tight text-[#0B1220]">
            {SITE_CONFIG.appName}
          </span>
        </button>

        {/* Navigasi Desktop */}
        <nav className="hidden md:flex items-center gap-2" aria-label="Navigasi utama">
          <button
            type="button"
            onClick={() => handleSelect('home')}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
              activePage === 'home'
                ? 'bg-[#F3F5F8] text-[#0B1220]'
                : 'text-[#475569] hover:text-[#0B1220] hover:bg-[#F8FAFC]'
            }`}
          >
            Beranda
          </button>

          {user && (
            <button
              type="button"
              onClick={() => handleSelect('dashboard')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                activePage === 'dashboard'
                  ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                  : 'text-[#475569] hover:text-[#0B1220] hover:bg-[#F8FAFC]'
              }`}
            >
              Dashboard utama
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSelect('contact')}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
              activePage === 'contact'
                ? 'bg-[#F3F5F8] text-[#0B1220]'
                : 'text-[#475569] hover:text-[#0B1220] hover:bg-[#F8FAFC]'
            }`}
          >
            Contact
          </button>
        </nav>

        {/* Aksi Kanan Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <div className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#DCE2EC] text-xs font-mono text-[#475569]">
                {profile?.full_name || user.email}
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#DCE2EC] bg-white text-sm font-medium text-[#475569] hover:text-[#0B1220] hover:bg-[#F8FAFC] transition-colors duration-150"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
                <span>Keluar</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => handleSelect('login')}
              className="px-4 py-2 rounded-lg bg-[#1D4ED8] text-white text-sm font-medium hover:bg-[#1E40AF] transition-colors duration-150"
            >
              Masuk member
            </button>
          )}
        </div>

        {/* Tombol Menu Mobile */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
          className="md:hidden p-2 rounded-lg text-[#475569] hover:text-[#0B1220] hover:bg-[#F3F5F8] transition-colors duration-150"
        >
          {mobileOpen ? (
            <X className="w-5 h-5" strokeWidth={1.5} />
          ) : (
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* Menu Mobile */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-[#DCE2EC] px-6 py-4 space-y-2">
          <button
            type="button"
            onClick={() => handleSelect('home')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
              activePage === 'home' ? 'bg-[#F3F5F8] text-[#0B1220]' : 'text-[#475569]'
            }`}
          >
            Beranda
          </button>

          {user && (
            <button
              type="button"
              onClick={() => handleSelect('dashboard')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                activePage === 'dashboard'
                  ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                  : 'text-[#475569]'
              }`}
            >
              Dashboard utama
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSelect('contact')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
              activePage === 'contact' ? 'bg-[#F3F5F8] text-[#0B1220]' : 'text-[#475569]'
            }`}
          >
            Contact
          </button>

          <div className="pt-2 border-t border-[#DCE2EC]">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onSignOut();
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#DCE2EC] text-sm font-medium text-[#0B1220]"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
                <span>Keluar dari akun</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSelect('login')}
                className="w-full px-4 py-2.5 rounded-lg bg-[#1D4ED8] text-white text-sm font-medium"
              >
                Masuk member
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
