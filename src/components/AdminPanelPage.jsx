import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  UserCheck,
  UserX,
  Trash2,
  ShieldAlert,
  ArrowLeft,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  supabase,
  isSupabaseConfigured,
  createIsolatedAuthClient
} from '../lib/supabaseClient';
import { SITE_CONFIG } from '../config/siteConfig';

export default function AdminPanelPage({ user, onBackHome, onSignOut }) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // State form buat akun pembeli
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPassword, setBuyerPassword] = useState('');
  const [creatingBuyer, setCreatingBuyer] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // State daftar pembeli
  const [buyers, setBuyers] = useState([]);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const loadBuyers = useCallback(async () => {
    if (!supabase) return;
    setLoadingBuyers(true);
    try {
      const { data, error } = await supabase
        .from('member_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBuyers(Array.isArray(data) ? data : []);
    } catch (err) {
      setFormError(err.message || 'Gagal memuat daftar member.');
    } finally {
      setLoadingBuyers(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      if (!user || !supabase || !isSupabaseConfigured) {
        if (active) {
          setIsAdmin(false);
          setCheckingAdmin(false);
        }
        return;
      }

      setCheckingAdmin(true);
      try {
        const { data, error } = await supabase
          .from('app_admins')
          .select('email')
          .ilike('email', user.email)
          .maybeSingle();

        if (!active) return;

        if (!error && data) {
          setIsAdmin(true);
          loadBuyers();
        } else {
          setIsAdmin(false);
        }
      } finally {
        if (active) setCheckingAdmin(false);
      }
    }

    checkAdmin();
    return () => {
      active = false;
    };
  }, [user, loadBuyers]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword
      });
      if (error) throw error;
    } catch (err) {
      setLoginError(err.message || 'Gagal masuk ke admin panel.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleCreateBuyerAccount = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const cleanName = buyerName.trim();
    const cleanEmail = buyerEmail.trim().toLowerCase();

    if (!cleanName || !cleanEmail || buyerPassword.length < 6) {
      setFormError('Isi nama pembeli, email, dan kata sandi minimal 6 karakter.');
      return;
    }

    const isolatedClient = createIsolatedAuthClient();
    if (!isolatedClient) {
      setFormError('Koneksi Supabase tidak tersedia.');
      return;
    }

    setCreatingBuyer(true);
    try {
      const { data, error } = await isolatedClient.auth.signUp({
        email: cleanEmail,
        password: buyerPassword,
        options: {
          data: {
            full_name: cleanName
          }
        }
      });

      if (error) throw error;

      if (!data?.user) {
        throw new Error('Akun gagal dibuat. Periksa pengaturan Auth di Supabase.');
      }

      setBuyerName('');
      setBuyerEmail('');
      setBuyerPassword('');
      setFormSuccess(
        `Akun akses untuk ${cleanName} (${cleanEmail}) berhasil dibuat dan siap dipakai login.`
      );
      setTimeout(loadBuyers, 500);
    } catch (err) {
      setFormError(
        err.message === 'User already registered'
          ? 'Email tersebut sudah terdaftar sebelumnya.'
          : err.message || 'Gagal membuat akun pembeli.'
      );
    } finally {
      setCreatingBuyer(false);
    }
  };

  const handleToggleBuyerStatus = async (buyer) => {
    setFormError('');
    setFormSuccess('');
    if (buyer.id === user.id) {
      setFormError('Tidak dapat menonaktifkan akun owner sendiri.');
      return;
    }

    try {
      const nextActive = !buyer.is_active;
      const { error } = await supabase
        .from('member_profiles')
        .update({ is_active: nextActive })
        .eq('id', buyer.id);

      if (error) throw error;

      setBuyers((prev) =>
        prev.map((item) =>
          item.id === buyer.id ? { ...item, is_active: nextActive } : item
        )
      );
      setFormSuccess(
        nextActive
          ? `Akses ${buyer.full_name} diaktifkan kembali.`
          : `Akses ${buyer.full_name} dinonaktifkan.`
      );
    } catch (err) {
      setFormError(err.message || 'Gagal mengubah status akses.');
    }
  };

  const handleDeleteBuyerProfile = async (buyerId) => {
    setFormError('');
    try {
      const { error } = await supabase
        .from('member_profiles')
        .delete()
        .eq('id', buyerId);

      if (error) throw error;
      setBuyers((prev) => prev.filter((item) => item.id !== buyerId));
      setConfirmDeleteId(null);
      setFormSuccess('Data profil member dihapus.');
    } catch (err) {
      setFormError(err.message || 'Gagal menghapus data member.');
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-6 py-16">
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-2 text-sm text-[#475569] hover:text-[#0B1220] mb-6"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          <span>Kembali ke beranda</span>
        </button>

        <div className="rounded-2xl bg-white border border-[#DCE2EC] p-8 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-mono text-[#1D4ED8]">Area pengelola</span>
            <h1 className="text-xl font-semibold text-[#0B1220]">
              Admin panel {SITE_CONFIG.appName}
            </h1>
            <p className="text-sm text-[#475569]">
              Masuk dengan email owner yang terdaftar di database.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input
              type="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Email owner"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#DCE2EC] text-sm font-mono text-[#0B1220] focus:outline-none focus:border-[#1D4ED8]"
            />
            <input
              type="password"
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Kata sandi"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#DCE2EC] text-sm text-[#0B1220] focus:outline-none focus:border-[#1D4ED8]"
            />
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#1D4ED8] text-white text-sm font-medium hover:bg-[#1E40AF] disabled:opacity-60"
            >
              {loginLoading ? 'Memproses...' : 'Masuk ke admin panel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (checkingAdmin) {
    return (
      <div className="py-24 flex items-center justify-center gap-2 text-sm text-[#64748B]">
        <Loader2 className="w-4 h-4 animate-spin text-[#1D4ED8]" strokeWidth={1.5} />
        <span>Memverifikasi hak akses pengelola...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="rounded-2xl bg-white border border-[#DCE2EC] p-8 space-y-5">
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-semibold text-[#0B1220]">Akses ditolak</h1>
            <p className="text-sm text-[#475569]">
              Akun <span className="font-mono text-[#0B1220]">{user.email}</span> tidak
              memiliki izin pengelola.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBackHome}
              className="flex-1 py-2.5 rounded-lg bg-[#1D4ED8] text-white text-sm font-medium"
            >
              Ke dashboard
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="px-4 py-2.5 rounded-lg border border-[#DCE2EC] text-sm text-[#475569]"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeBuyersCount = buyers.filter((b) => b.is_active).length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[#0B1220]">
            Admin panel · Kelola akses member
          </h1>
          <p className="text-sm text-[#475569]">
            Buat akun login untuk pembeli akses dan atur status aktif secara manual
          </p>
        </div>

        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#DCE2EC] text-sm font-medium text-[#0B1220] hover:bg-[#F8FAFC] self-start"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          <span>Kembali ke website</span>
        </button>
      </div>

      {/* Ringkasan Member */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white border border-[#DCE2EC] p-5 space-y-1">
          <span className="text-xs text-[#64748B]">Total akun dibuat</span>
          <div className="text-2xl font-semibold font-mono text-[#0B1220] tabular-nums">
            {buyers.length}
          </div>
        </div>

        <div className="rounded-xl bg-white border border-[#DCE2EC] p-5 space-y-1">
          <span className="text-xs text-[#64748B]">Akses berstatus aktif</span>
          <div className="text-2xl font-semibold font-mono text-[#1D4ED8] tabular-nums">
            {activeBuyersCount}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Buat Akun Pembeli */}
        <form
          onSubmit={handleCreateBuyerAccount}
          className="lg:col-span-5 rounded-2xl bg-white border border-[#DCE2EC] p-6 space-y-4 self-start"
        >
          <h2 className="text-base font-semibold text-[#0B1220]">
            Buat akun akses baru
          </h2>

          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 rounded-lg bg-[#EFF6FF] border border-blue-200 text-xs text-[#1D4ED8]">
              {formSuccess}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="buyer-name" className="block text-xs font-medium text-[#475569]">
              Nama pembeli / keterangan
            </label>
            <input
              id="buyer-name"
              type="text"
              required
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Contoh: Reza (Batch 1)"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#DCE2EC] text-sm text-[#0B1220] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="buyer-email" className="block text-xs font-medium text-[#475569]">
              Email login pembeli
            </label>
            <input
              id="buyer-email"
              type="email"
              required
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="pembeli@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#DCE2EC] text-sm font-mono text-[#0B1220] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="buyer-pass" className="block text-xs font-medium text-[#475569]">
              Kata sandi login (minimal 6 karakter)
            </label>
            <input
              id="buyer-pass"
              type="text"
              required
              minLength={6}
              value={buyerPassword}
              onChange={(e) => setBuyerPassword(e.target.value)}
              placeholder="Buat kata sandi akun"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#DCE2EC] text-sm font-mono text-[#0B1220] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={creatingBuyer}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#1D4ED8] text-white text-sm font-medium hover:bg-[#1E40AF] disabled:opacity-60 transition-colors duration-150"
          >
            {creatingBuyer ? (
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
            ) : (
              <UserPlus className="w-4 h-4" strokeWidth={1.5} />
            )}
            <span>Buat & aktifkan akun</span>
          </button>
        </form>

        {/* Daftar Pembeli Terdaftar */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-[#DCE2EC] overflow-hidden">
          <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#DCE2EC] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#0B1220]">Daftar pembeli terdaftar</h2>
            <span className="text-xs font-mono text-[#64748B] tabular-nums">
              {buyers.length} akun
            </span>
          </div>

          {loadingBuyers ? (
            <div className="p-12 flex items-center justify-center gap-2 text-sm text-[#64748B]">
              <Loader2 className="w-4 h-4 animate-spin text-[#1D4ED8]" strokeWidth={1.5} />
              <span>Memuat daftar pembeli...</span>
            </div>
          ) : buyers.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#64748B]">
              Belum ada akun pembeli yang dibuat.
            </div>
          ) : (
            <div className="divide-y divide-[#DCE2EC]">
              {buyers.map((buyer) => {
                const isSelf = buyer.id === user.id;
                return (
                  <div
                    key={buyer.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#0B1220] truncate">
                          {buyer.full_name} {isSelf ? '(Owner)' : ''}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                            buyer.is_active
                              ? 'bg-[#DCFCE7] text-[#15803D]'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {buyer.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#64748B]">
                        <span className="truncate">{buyer.email}</span>
                        <span className="tabular-nums">
                          Setoran: {buyer.lifetime_submitted}
                        </span>
                      </div>
                    </div>

                    {!isSelf && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleBuyerStatus(buyer)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#DCE2EC] text-xs font-medium text-[#0B1220] hover:border-[#1D4ED8] transition-colors duration-150"
                        >
                          {buyer.is_active ? (
                            <>
                              <UserX className="w-3.5 h-3.5 text-red-600" strokeWidth={1.5} />
                              <span>Nonaktifkan</span>
                            </>
                          ) : (
                            <>
                              <UserCheck
                                className="w-3.5 h-3.5 text-[#15803D]"
                                strokeWidth={1.5}
                              />
                              <span>Aktifkan</span>
                            </>
                          )}
                        </button>

                        {confirmDeleteId === buyer.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteBuyerProfile(buyer.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium"
                            >
                              Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2.5 py-1.5 rounded-lg border border-[#DCE2EC] text-xs text-[#475569]"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(buyer.id)}
                            className="p-1.5 rounded-lg border border-[#DCE2EC] text-[#64748B] hover:text-red-600 hover:border-red-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
