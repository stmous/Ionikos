export async function fetchCsv(url) {
  const res = await fetch(withCacheBuster(url), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch CSV: ' + res.status);
  const text = await res.text();
  return parseCsv(text);
}

function withCacheBuster(url) {
  try {
    const u = new URL(url);
    u.searchParams.set('t', Date.now().toString());
    return u.toString();
  } catch (e) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}t=${Date.now()}`;
  }
}

export function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const delim = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines.shift(), delim).map(h => h.trim());
  return lines.filter(l => l.trim().length > 0).map(line => {
    const cols = splitCsvLine(line, delim);
    const obj = {};
    headers.forEach((h, i) => (obj[h] = (cols[i] || '').trim()))
    return obj;
  });
}

function detectDelimiter(headerLine) {
  const candidates = [',', ';', '\t', '|'];
  let best = ','; let bestCount = -1;
  for (const d of candidates) {
    const c = headerLine.split(d).length - 1;
    if (c > bestCount) { bestCount = c; best = d; }
  }
  return best;
}

function splitCsvLine(line, delim = ',') {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delim && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

export function tryParseDate(dateStr, timeStr) {
  const cleanDate = (dateStr || '').trim();
  const cleanTime = (timeStr || '').trim();
  const candidates = [];
  if (cleanDate && cleanTime) {
    candidates.push(`${cleanDate} ${cleanTime}`);
  }
  if (cleanDate) candidates.push(cleanDate);

  const fmts = [
    (s) => parseDMYTime(s),
    (s) => parseDMY(s),
    (s) => new Date(s) // Fallback for ISO or RFC-like strings
  ];

  for (const cand of candidates) {
    for (const f of fmts) {
      const d = f(cand);
      if (d && !isNaN(d.getTime())) return d;
    }
  }
  return null;
}

function parseDMY(s) {
  // dd/mm[/yyyy]
  const m = s.match(/^(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?$/);
  if (!m) return null;
  const [_, d, mo, y] = m;
  const cy = new Date().getFullYear();
  const year = !y ? cy : (y.length === 2 ? 2000 + Number(y) : Number(y));
  return new Date(year, Number(mo) - 1, Number(d));
}

function parseDMYTime(s) {
  // dd/mm[/yyyy] hh:mm
  const m = s.match(/^(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\s+(\d{1,2})[:.](\d{2})$/);
  if (!m) return null;
  const [_, d, mo, y, hh, mm] = m;
  const cy = new Date().getFullYear();
  const year = !y ? cy : (y.length === 2 ? 2000 + Number(y) : Number(y));
  return new Date(year, Number(mo) - 1, Number(d), Number(hh), Number(mm));
}

export function formatDateTime(d) {
  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  const HH = pad2(d.getHours());
  const MM = pad2(d.getMinutes());
  return `${dd}/${mm}/${yyyy} ${HH}:${MM}`;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}
