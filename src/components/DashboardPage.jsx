import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Copy,
  Check,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Download,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { SITE_CONFIG } from '../config/siteConfig';
import {
  copyPlainText,
  generateAdultBirthDate,
  parseExactZero99Lines
} from '../utils/zero99Helpers';

const TABS = [
  { id: 'antrean', label: 'Antrean' },
  { id: 'siap_setor', label: 'Siap setor' },
  { id: 'sudah_disetor', label: 'Sudah disetor' },
  { id: 'limit', label: 'Kena limit' }
];

export default function DashboardPage({ user, profile, onProfileRefresh }) {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [activeTab, setActiveTab] = useState('antrean');

  // Input tempel massal Zero99
  const [rawInput, setRawInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  // Status tombol salin sementara
  const [copiedId, setCopiedId] = useState('');
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!user || !supabase) return;
    setLoadingTasks(true);
    try {
      const { data, error } = await supabase
        .from('gmail_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setFeedbackError(err.message || 'Gagal memuat daftar kerja.');
    } finally {
      setLoadingTasks(false);
    }
  }, [user]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCopyValue = async (tokenKey, value) => {
    const ok = await copyPlainText(value);
    if (ok) {
      setCopiedId(tokenKey);
      setTimeout(() => setCopiedId(''), 1400);
    }
  };

  const handleAddZero99Batch = async (e) => {
    e.preventDefault();
    setFeedbackError('');
    setFeedbackSuccess('');

    const parsedList = parseExactZero99Lines(rawInput);
    if (parsedList.length === 0) {
      setFeedbackError('Tempel minimal satu nama Gmail dari Zero99 terlebih dahulu.');
      return;
    }

    const existingSet = new Set(tasks.map((t) => t.email));
    const uniqueNewEmails = parsedList.filter((email) => !existingSet.has(email));

    if (uniqueNewEmails.length === 0) {
      setFeedbackError('Seluruh email yang ditempel sudah ada di dalam daftar kamu.');
      return;
    }

    setAdding(true);
    try {
      const rowsToInsert = uniqueNewEmails.map((email) => ({
        user_id: user.id,
        email,
        dob_18: generateAdultBirthDate(),
        status: 'antrean'
      }));

      const { data, error } = await supabase
        .from('gmail_tasks')
        .insert(rowsToInsert)
        .select();

      if (error) throw error;

      setTasks((prev) => [...(data || []), ...prev]);
      setRawInput('');
      setActiveTab('antrean');
      const skipped = parsedList.length - uniqueNewEmails.length;
      setFeedbackSuccess(
        skipped > 0
          ? `${uniqueNewEmails.length} email ditambahkan (${skipped} duplikat dilewati).`
          : `${uniqueNewEmails.length} email berhasil ditambahkan ke antrean.`
      );
    } catch (err) {
      setFeedbackError(err.message || 'Gagal menyimpan daftar email.');
    } finally {
      setAdding(false);
    }
  };

  const handleRegenerateDob = async (taskId) => {
    const newDob = generateAdultBirthDate();
    try {
      const { error } = await supabase
        .from('gmail_tasks')
        .update({ dob_18: newDob, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;
      setTasks((prev) =>
        prev.map((item) => (item.id === taskId ? { ...item, dob_18: newDob } : item))
      );
    } catch (err) {
      setFeedbackError(err.message || 'Gagal memperbarui tanggal lahir.');
    }
  };

  const handleUpdateStatus = async (task, nextStatus) => {
    setFeedbackError('');
    setFeedbackSuccess('');

    try {
      const { error } = await supabase
        .from('gmail_tasks')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', task.id);

      if (error) throw error;

      if (task.status !== 'sudah_disetor' && nextStatus === 'sudah_disetor') {
        await supabase.rpc('increment_lifetime_submitted', { add_count: 1 });
        if (onProfileRefresh) onProfileRefresh();
      }

      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item))
      );
    } catch (err) {
      setFeedbackError(err.message || 'Gagal memperbarui status akun.');
    }
  };

  const handleDeleteSingle = async (taskId) => {
    try {
      const { error } = await supabase.from('gmail_tasks').delete().eq('id', taskId);
      if (error) throw error;
      setTasks((prev) => prev.filter((item) => item.id !== taskId));
    } catch (err) {
      setFeedbackError(err.message || 'Gagal menghapus baris.');
    }
  };

  // Aksi massal untuk tab Siap Setor
  const readyTasks = tasks.filter((t) => t.status === 'siap_setor');
  const submittedTasks = tasks.filter((t) => t.status === 'sudah_disetor');
  const queueCount = tasks.filter((t) => t.status === 'antrean').length;
  const limitCount = tasks.filter((t) => t.status === 'limit').length;

  const handleCopyAllReady = async () => {
    if (readyTasks.length === 0) return;
    const payload = readyTasks.map((t) => t.email).join('\n');
    const ok = await copyPlainText(payload);
    if (ok) {
      setFeedbackSuccess(
        `${readyTasks.length} alamat email siap setor disalin ke clipboard.`
      );
    }
  };

  const handleMarkAllReadyAsSubmitted = async () => {
    if (readyTasks.length === 0) return;
    setFeedbackError('');
    setFeedbackSuccess('');

    const ids = readyTasks.map((t) => t.id);
    try {
      const { error } = await supabase
        .from('gmail_tasks')
        .update({ status: 'sudah_disetor', updated_at: new Date().toISOString() })
        .in('id', ids);

      if (error) throw error;

      await supabase.rpc('increment_lifetime_submitted', { add_count: ids.length });
      if (onProfileRefresh) onProfileRefresh();

      setTasks((prev) =>
        prev.map((item) =>
          ids.includes(item.id) ? { ...item, status: 'sudah_disetor' } : item
        )
      );
      setFeedbackSuccess(`${ids.length} akun dipindahkan ke riwayat Sudah Disetor.`);
    } catch (err) {
      setFeedbackError(err.message || 'Gagal memperbarui status setoran massal.');
    }
  };

  const handleDownloadSubmittedTxt = () => {
    if (submittedTasks.length === 0) return;
    const textContent = submittedTasks.map((t) => t.email).join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `cmailfs-setoran-${dateStamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearSubmittedHistory = async () => {
    if (submittedTasks.length === 0) return;
    setFeedbackError('');
    setFeedbackSuccess('');

    const ids = submittedTasks.map((t) => t.id);
    try {
      const { error } = await supabase.from('gmail_tasks').delete().in('id', ids);
      if (error) throw error;

      setTasks((prev) => prev.filter((item) => item.status !== 'sudah_disetor'));
      setConfirmClearHistory(false);
      setFeedbackSuccess(
        'Riwayat daftar dibersihkan. Total akumulasi setoran tetap tersimpan.'
      );
    } catch (err) {
      setFeedbackError(err.message || 'Gagal membersihkan riwayat.');
    }
  };

  const filteredTasks = tasks.filter((t) => t.status === activeTab);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header & Ringkasan Angka */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[#0B1220]">
            Ruang kerja setoran Zero99
          </h1>
          <p className="text-sm text-[#475569]">
            Password standar terkunci:{' '}
            <span className="font-mono font-medium text-[#0B1220]">
              {SITE_CONFIG.requiredPassword}
            </span>{' '}
            · Tanpa nomor HP & email pemulihan
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleCopyValue('global-pass', SITE_CONFIG.requiredPassword)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-[#DCE2EC] text-xs font-mono font-medium text-[#0B1220] hover:border-[#1D4ED8] self-start transition-colors duration-150"
        >
          {copiedId === 'global-pass' ? (
            <>
              <Check className="w-4 h-4 text-[#15803D]" strokeWidth={1.5} />
              <span>Password tersalin</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-[#1D4ED8]" strokeWidth={1.5} />
              <span>Salin password: {SITE_CONFIG.requiredPassword}</span>
            </>
          )}
        </button>
      </div>

      {/* 4 Kartu Statistik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white border border-[#DCE2EC] p-5 space-y-1">
          <span className="text-xs text-[#64748B]">Dalam antrean</span>
          <div className="text-2xl font-semibold font-mono text-[#0B1220] tabular-nums">
            {queueCount}
          </div>
        </div>

        <div className="rounded-xl bg-white border border-[#DCE2EC] p-5 space-y-1">
          <span className="text-xs text-[#64748B]">Siap disetor</span>
          <div className="text-2xl font-semibold font-mono text-[#1D4ED8] tabular-nums">
            {readyTasks.length}
          </div>
        </div>

        <div className="rounded-xl bg-white border border-[#DCE2EC] p-5 space-y-1">
          <span className="text-xs text-[#64748B]">Total akumulasi disetor</span>
          <div className="text-2xl font-semibold font-mono text-[#15803D] tabular-nums">
            {profile?.lifetime_submitted ?? submittedTasks.length}
          </div>
        </div>

        <div className="rounded-xl bg-white border border-[#DCE2EC] p-5 space-y-1">
          <span className="text-xs text-[#64748B]">Kena limit</span>
          <div className="text-2xl font-semibold font-mono text-[#475569] tabular-nums">
            {limitCount}
          </div>
        </div>
      </div>

      {/* Kotak Tempel Nama Gmail dari Zero99 */}
      <form
        onSubmit={handleAddZero99Batch}
        className="rounded-2xl bg-white border border-[#DCE2EC] p-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label
            htmlFor="zero99-paste-box"
            className="text-sm font-semibold text-[#0B1220]"
          >
            Tempel nama Gmail hasil generate Zero99
          </label>
          <span className="text-xs font-mono text-[#64748B]">
            Mendukung 1 baris atau banyak baris sekaligus
          </span>
        </div>

        <textarea
          id="zero99-paste-box"
          rows={3}
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder={'contoh.nama123@gmail.com\nnama.kedua456@gmail.com'}
          className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#DCE2EC] text-sm font-mono text-[#0B1220] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
        />

        {feedbackError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>{feedbackError}</span>
          </div>
        )}

        {feedbackSuccess && (
          <div className="p-3 rounded-lg bg-[#EFF6FF] border border-blue-200 text-xs text-[#1D4ED8]">
            {feedbackSuccess}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-[#64748B]">
            Ejaan huruf dijaga persis sesuai input dan otomatis diberi tanggal lahir 18+.
          </span>

          <button
            type="submit"
            disabled={adding}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1D4ED8] text-white text-sm font-medium hover:bg-[#1E40AF] disabled:opacity-60 shrink-0 transition-colors duration-150"
          >
            {adding ? (
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
            ) : (
              <Plus className="w-4 h-4" strokeWidth={1.5} />
            )}
            <span>Masukkan ke antrean</span>
          </button>
        </div>
      </form>

      {/* Navigasi Tab & Bilah Aksi Batch */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="inline-flex flex-wrap gap-1.5 p-1 rounded-xl bg-white border border-[#DCE2EC]">
            {TABS.map((tab) => {
              const count = tasks.filter((t) => t.status === tab.id).length;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setConfirmClearHistory(false);
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors duration-150 tabular-nums ${
                    isSelected
                      ? 'bg-[#1D4ED8] text-white'
                      : 'text-[#475569] hover:text-[#0B1220] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#F3F5F8] text-[#64748B]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Aksi Massal Tab Siap Setor */}
          {activeTab === 'siap_setor' && readyTasks.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyAllReady}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1D4ED8] text-white text-xs font-medium hover:bg-[#1E40AF] transition-colors duration-150"
              >
                <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Salin semua ({readyTasks.length} email)</span>
              </button>

              <button
                type="button"
                onClick={handleMarkAllReadyAsSubmitted}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-[#DCE2EC] text-xs font-medium text-[#0B1220] hover:bg-[#F8FAFC] transition-colors duration-150"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={1.5} />
                <span>Tandai semua sudah disetor</span>
              </button>
            </div>
          )}

          {/* Aksi Riwayat Tab Sudah Disetor */}
          {activeTab === 'sudah_disetor' && submittedTasks.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownloadSubmittedTxt}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#DCE2EC] text-xs font-medium text-[#0B1220] hover:bg-[#F8FAFC] transition-colors duration-150"
              >
                <Download className="w-3.5 h-3.5 text-[#1D4ED8]" strokeWidth={1.5} />
                <span>Unduh .txt</span>
              </button>

              {confirmClearHistory ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleClearSubmittedHistory}
                    className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700"
                  >
                    Konfirmasi hapus
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearHistory(false)}
                    className="px-3 py-2 rounded-lg bg-white border border-[#DCE2EC] text-xs text-[#475569]"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClearHistory(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#DCE2EC] text-xs font-medium text-[#475569] hover:text-red-600 hover:border-red-200 transition-colors duration-150"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Bersihkan riwayat</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Daftar Baris Produksi */}
        {loadingTasks ? (
          <div className="rounded-2xl bg-white border border-[#DCE2EC] p-16 flex items-center justify-center gap-2.5 text-sm text-[#64748B]">
            <Loader2 className="w-4 h-4 animate-spin text-[#1D4ED8]" strokeWidth={1.5} />
            <span>Memuat data akun...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#DCE2EC] p-14 text-center space-y-1">
            <p className="text-sm font-medium text-[#0B1220]">
              Tidak ada akun pada kategori ini
            </p>
            <p className="text-xs text-[#64748B]">
              Tempel nama Gmail dari Zero99 di kolom atas untuk memulai
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl bg-white border border-[#DCE2EC] p-5 space-y-4"
              >
                {/* Baris Atas: Nama Gmail Persis & Aksi Status */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm font-mono font-medium text-[#0B1220] truncate select-all">
                      {task.email}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {task.status === 'antrean' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(task, 'siap_setor')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D4ED8] text-white text-xs font-medium hover:bg-[#1E40AF] transition-colors duration-150"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span>Tandai siap setor</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(task, 'limit')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#DCE2EC] text-xs font-medium text-[#B45309] hover:bg-amber-50 transition-colors duration-150"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span>Kena limit</span>
                        </button>
                      </>
                    )}

                    {task.status === 'siap_setor' && (
                      <>
                        <button
                          type="button"
                          onClick={async () => {
                            await handleCopyValue(`setor-${task.id}`, task.email);
                            await handleUpdateStatus(task, 'sudah_disetor');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#15803D] text-white text-xs font-medium hover:opacity-95 transition-opacity duration-150"
                        >
                          <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span>Salin & tandai disetor</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(task, 'antrean')}
                          className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#DCE2EC] text-xs text-[#475569] hover:text-[#0B1220]"
                        >
                          Ke antrean
                        </button>
                      </>
                    )}

                    {(task.status === 'sudah_disetor' || task.status === 'limit') && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(task, 'antrean')}
                        className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#DCE2EC] text-xs text-[#475569] hover:text-[#0B1220]"
                      >
                        Kembalikan ke antrean
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteSingle(task.id)}
                      title="Hapus baris"
                      className="p-1.5 rounded-lg border border-[#DCE2EC] text-[#64748B] hover:text-red-600 hover:border-red-200 transition-colors duration-150"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Baris Bawah: 3 Tombol Salin 1-Ketuk untuk Chrome HP */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-[#DCE2EC]">
                  <button
                    type="button"
                    onClick={() => handleCopyValue(`email-${task.id}`, task.email)}
                    className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#F8FAFC] border border-[#DCE2EC] text-xs font-medium text-[#0B1220] hover:border-[#1D4ED8] transition-colors duration-150"
                  >
                    <span>Salin nama Gmail</span>
                    {copiedId === `email-${task.id}` ? (
                      <span className="inline-flex items-center gap-1 text-[#15803D] font-mono">
                        <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
                        Tersalin
                      </span>
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-[#64748B]" strokeWidth={1.5} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopyValue(`pass-${task.id}`, SITE_CONFIG.requiredPassword)
                    }
                    className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#F8FAFC] border border-[#DCE2EC] text-xs font-mono text-[#0B1220] hover:border-[#1D4ED8] transition-colors duration-150"
                  >
                    <span>Password: {SITE_CONFIG.requiredPassword}</span>
                    {copiedId === `pass-${task.id}` ? (
                      <span className="inline-flex items-center gap-1 text-[#15803D]">
                        <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
                        Tersalin
                      </span>
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-[#64748B]" strokeWidth={1.5} />
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyValue(`dob-${task.id}`, task.dob_18)}
                      className="flex-1 flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#F8FAFC] border border-[#DCE2EC] text-xs font-mono text-[#0B1220] hover:border-[#1D4ED8] transition-colors duration-150 tabular-nums"
                    >
                      <span className="truncate">18+: {task.dob_18}</span>
                      {copiedId === `dob-${task.id}` ? (
                        <Check className="w-3.5 h-3.5 text-[#15803D] shrink-0" strokeWidth={1.5} />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-[#64748B] shrink-0" strokeWidth={1.5} />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRegenerateDob(task.id)}
                      title="Acak ulang tanggal lahir 18+"
                      className="p-2 rounded-lg bg-[#F8FAFC] border border-[#DCE2EC] text-[#64748B] hover:text-[#1D4ED8] transition-colors duration-150"
                    >
                      <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
