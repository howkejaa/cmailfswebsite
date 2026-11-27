import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, Loader2, Lock } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { SITE_CONFIG } from '../config/siteConfig';

export default function LoginPage({ onBackHome, onGoContact, blockedNotice }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg('Konfigurasi database Supabase belum dipasang pada Vercel.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) throw error;
    } catch (err) {
      setErrorMsg(
        err.message === 'Invalid login credentials'
          ? 'Email atau kata sandi tidak cocok.'
          : err.message || 'Gagal masuk ke akun.'
      );
    } finally {
      setLoading(false);
    }
  };

  const activeError = errorMsg || blockedNotice;

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <button
        type="button"
        onClick={onBackHome}
        className="inline-flex items-center gap-2 text-sm text-[#475569] hover:text-[#0B1220] mb-6 transition-colors duration-150"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        <span>Kembali ke beranda</span>
      </button>

      <div className="rounded-2xl bg-white border border-[#DCE2EC] p-8 space-y-6">
        <div className="space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center mb-3">
            <Lock className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-semibold text-[#0B1220]">
            Masuk ke {SITE_CONFIG.appName}
          </h1>
          <p className="text-sm text-[#475569]">
            Gunakan email dan kata sandi yang diberikan oleh pengelola.
          </p>
        </div>

        {activeError && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
            <span>{activeError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-sm font-medium text-[#0B1220]">
              Email akun
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#DCE2EC] text-sm font-mono text-[#0B1220] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-pass" className="block text-sm font-medium text-[#0B1220]">
              Kata sandi
            </label>
            <input
              id="login-pass"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#DCE2EC] text-sm text-[#0B1220] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#1D4ED8] text-white text-sm font-medium hover:bg-[#1E40AF] disabled:opacity-60 transition-colors duration-150"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />}
            <span>Masuk sekarang</span>
          </button>
        </form>

        <div className="pt-4 border-t border-[#DCE2EC] text-center text-xs text-[#64748B]">
          Belum memiliki akun akses?{' '}
          <button
            type="button"
            onClick={onGoContact}
            className="font-medium text-[#1D4ED8] hover:underline"
          >
            Hubungi {SITE_CONFIG.ownerTelegramHandle}
          </button>
        </div>
      </div>
    </div>
  );
}
