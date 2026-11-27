import React, { useState } from 'react';
import { Send, Copy, Check, ArrowUpRight } from 'lucide-react';
import { SITE_CONFIG } from '../config/siteConfig';
import { copyPlainText } from '../utils/zero99Helpers';

export default function ContactPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyHandle = async () => {
    const ok = await copyPlainText(SITE_CONFIG.ownerTelegramHandle);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-14 md:py-20 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0B1220]">
          Kontak pengelola
        </h1>
        <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
          Hubungi pemilik {SITE_CONFIG.appName} melalui Telegram untuk pembelian akses akun
          baru atau bantuan teknis.
        </p>
      </div>

      <div className="rounded-2xl bg-white border border-[#DCE2EC] p-6 sm:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center shrink-0">
              <Send className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-lg font-semibold text-[#0B1220]">
                {SITE_CONFIG.ownerName}
              </h2>
              <p className="text-sm font-mono text-[#1D4ED8]">
                {SITE_CONFIG.ownerTelegramHandle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyHandle}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#DCE2EC] text-xs font-medium text-[#475569] hover:text-[#0B1220] transition-colors duration-150"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={1.5} />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Salin username</span>
              </>
            )}
          </button>
        </div>

        <p className="text-sm text-[#475569] leading-relaxed">
          Sertakan nama tampilan dan alamat email login yang diinginkan saat menghubungi
          Telegram agar akun langsung diaktifkan.
        </p>

        <div className="pt-2">
          <a
            href={SITE_CONFIG.ownerTelegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#1D4ED8] text-white text-sm font-medium hover:bg-[#1E40AF] transition-colors duration-150"
          >
            <span>Buka chat Telegram</span>
            <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </div>
  );
}
