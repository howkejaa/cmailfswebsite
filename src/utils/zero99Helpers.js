const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

export function generateAdultBirthDate() {
  const day = Math.floor(Math.random() * 28) + 1;
  const monthIndex = Math.floor(Math.random() * 12);
  const year = Math.floor(Math.random() * 10) + 1994; // Rentang 1994 - 2003 (23 - 32 tahun)
  const dayStr = String(day).padStart(2, '0');
  return `${dayStr} ${MONTHS_ID[monthIndex]} ${year}`;
}

export function parseExactZero99Lines(rawText) {
  if (!rawText) return [];
  const lines = rawText.split(/\r?\n/);
  const seen = new Set();
  const validEmails = [];

  for (const line of lines) {
    // Hanya menghapus spasi di awal/akhir tanpa mengubah satu huruf pun
    const exact = line.trim();
    if (!exact) continue;

    // Jika ditempel format email:password, ambil bagian sebelum titik dua secara persis
    const beforeColon = exact.includes(':') ? exact.split(':')[0].trim() : exact;
    if (!beforeColon) continue;

    if (!seen.has(beforeColon)) {
      seen.add(beforeColon);
      validEmails.push(beforeColon);
    }
  }

  return validEmails;
}

export async function copyPlainText(text) {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    document.body.removeChild(textarea);
    return ok;
  }
}
