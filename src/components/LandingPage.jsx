import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Copy,
  Check,
  ShieldCheck,
  KeyRound,
  Calendar,
  PhoneOff,
  FileCheck2
} from 'lucide-react';
import { SITE_CONFIG } from '../config/siteConfig';
import { copyPlainText, generateAdultBirthDate } from '../utils/zero99Helpers';

const ZERO99_RULES = [
  {
    number: '01',
    icon: FileCheck2,
    title: 'Akun Gmail baru dibuat',
    detail: 'Seluruh setoran wajib berasal dari pendaftaran baru, bukan stok akun lama.'
  },
  {
    number: '02',
    icon: ShieldCheck,
    title: 'Nama persis hasil Zero99',
    detail: 'Sistem mengunci ejaan asli tanpa mengubah satu huruf pun.'
  },
  {
    number: '03',
    icon: KeyRound,
    title: 'Password wajib goldacok',
    detail: 'Dikunci huruf kecil semua agar bebas koreksi huruf kapital otomatis di HP.'
  },
  {
    number: '04',
    icon: Calendar,
    title: 'Usia minimal 18 tahun',
    detail: 'Tanggal lahir acak usia 23–32 tahun dibuat otomatis di setiap baris kerja.'
  },
  {
    number: '05',
    icon: PhoneOff,
    title: 'Tanpa nomor HP & pemulihan',
    detail: 'Pengingat langsung di kartu kerja agar bagian pemulihan selalu dilewati.'
  }
];

export default function LandingPage({ user, onNavigate }) {
  const containerRef = useRef(null);
  const [demoEmail, setDemoEmail] = useState('bagas.saputra841@gmail.com');
  const [demoDob] = useState(() => generateAdultBirthDate());
  const [copiedKey, setCopiedKey] = useState('');

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.cmailfs-reveal',
        { y: 16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power3.out'
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleDemoCopy = async (key, value) => {
    const ok = await copyPlainText(value);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 1500);
    }
  };

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-20">
      {/* Split Hero: Kiri Narasi, Kanan Simulasi Meja Produksi Interaktif */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 space-y-6">
          <div className="cmailfs-reveal inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#DCE2EC]">
            <span className="w-2 h-2 rounded-full bg-[#1D4ED8]" />
            <span className="text-xs font-mono text-[#475569]">
              Pendamping Setoran S3L Zero99
            </span>
          </div>

          <h1 className="cmailfs-reveal text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-[#0B1220] leading-[1.15]">
            Alur kerja cepat untuk pendaftaran dan setoran Gmail Zero99
          </h1>

          <p className="cmailfs-reveal text-base text-[#475569] leading-relaxed">
            Tempel daftar nama dari Zero99, salin kredensial standar dalam satu ketukan dari
            Chrome HP, dan ekspor format setoran bersih tanpa risiko salah ketik.
          </p>

          <div className="cmailfs-reveal pt-2 flex flex-wrap items-center gap-3">
            {user ? (
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#1D4ED8] text-white text-sm font-medium hover:bg-[#1E40AF] transition-colors duration-150"
              >
                <span>Buka dashboard utama</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#1D4ED8] text-white text-sm font-medium hover:bg-[#1E40AF] transition-colors duration-150"
                >
                  <span>Masuk ke ruang kerja</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white border border-[#DCE2EC] text-[#0B1220] text-sm font-medium hover:bg-[#F8FAFC] transition-colors duration-150"
                >
                  <span>Beli akses via Telegram</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Momen Utama: Simulasi Meja Produksi Interaktif */}
        <div className="cmailfs-reveal lg:col-span-6">
          <div className="rounded-2xl bg-white border border-[#DCE2EC] overflow-hidden">
            <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#DCE2EC] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1D4ED8]" />
                <span className="text-xs font-medium text-[#0B1220]">
                  Simulasi kartu produksi 1-ketuk
                </span>
              </div>
              <span className="text-xs font-mono text-[#64748B]">Pratinjau langsung</span>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="demo-zero99-input"
                  className="block text-xs font-medium text-[#475569]"
                >
                  Ubah atau tempel contoh nama Gmail Zero99
                </label>
                <input
                  id="demo-zero99-input"
                  type="text"
                  value={demoEmail}
                  onChange={(e) => setDemoEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#DCE2EC] text-sm font-mono text-[#0B1220] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div className="rounded-xl bg-[#F8FAFC] border border-[#DCE2EC] p-4 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-[#0B1220] truncate">
                    {demoEmail.trim() || 'namaemail@gmail.com'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] text-[11px] font-mono shrink-0">
                    Antrean
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleDemoCopy('email', demoEmail.trim())}
                    className="inline-flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-[#DCE2EC] text-xs font-medium text-[#0B1220] hover:border-[#1D4ED8] transition-colors duration-150"
                  >
                    <span>Salin email</span>
                    {copiedKey === 'email' ? (
                      <Check className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={1.5} />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-[#64748B]" strokeWidth={1.5} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoCopy('pass', SITE_CONFIG.requiredPassword)}
                    className="inline-flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-[#DCE2EC] text-xs font-mono text-[#0B1220] hover:border-[#1D4ED8] transition-colors duration-150"
                  >
                    <span>{SITE_CONFIG.requiredPassword}</span>
                    {copiedKey === 'pass' ? (
                      <Check className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={1.5} />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-[#64748B]" strokeWidth={1.5} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoCopy('dob', demoDob)}
                    className="inline-flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-[#DCE2EC] text-xs font-mono text-[#0B1220] hover:border-[#1D4ED8] transition-colors duration-150 tabular-nums"
                  >
                    <span className="truncate">{demoDob}</span>
                    {copiedKey === 'dob' ? (
                      <Check className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={1.5} />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-[#64748B]" strokeWidth={1.5} />
                    )}
                  </button>
                </div>

                <div className="pt-2 border-t border-[#DCE2EC] flex items-center justify-between text-[11px] font-mono text-[#64748B]">
                  <span>Lewati nomor HP & email pemulihan</span>
                  <span>Format setor: namaemail@gmail.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pita 5 Aturan Kepatuhan S3L Zero99 */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-[#0B1220]">
            Standar kepatuhan S3L Zero99
          </h2>
          <p className="text-sm text-[#475569]">
            Seluruh kolom dan tombol di ruang kerja dirancang mengikuti aturan setoran
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {ZERO99_RULES.map((rule) => {
            const IconComponent = rule.icon;
            return (
              <motion.div
                key={rule.number}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-xl bg-white border border-[#DCE2EC] p-5 flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center">
                    <IconComponent className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-mono text-[#64748B] tabular-nums">
                    {rule.number}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold text-[#0B1220]">{rule.title}</h3>
                  <p className="text-xs text-[#475569] leading-relaxed">{rule.detail}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Bagian Akses Terbatas / Pembelian Lisensi Member */}
      <section className="rounded-2xl bg-white border border-[#DCE2EC] p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <h2 className="text-lg font-semibold text-[#0B1220]">
            Akses khusus member terdaftar
          </h2>
          <p className="text-sm text-[#475569] leading-relaxed">
            Pendaftaran mandiri ditutup untuk menjaga kapasitas ruang kerja. Hubungi pengelola
            melalui Telegram untuk mendapatkan akun akses pribadi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('contact')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1D4ED8] text-white text-sm font-medium hover:bg-[#1E40AF] shrink-0 transition-colors duration-150"
        >
          <span>Hubungi {SITE_CONFIG.ownerTelegramHandle}</span>
          <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </section>
    </div>
  );
}
