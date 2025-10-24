import { fetchCsv, tryParseDate, formatDateTime } from './utils.js';

const SCHEDULE_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTnhHlJBoxTnJER-sI7eerLBMsG5_eoZks5ELym4_-ey0pzRCR893Y0zdkxal-zsyeM6RyzyBsAg3iB/pub?gid=0&single=true&output=csv';

export async function fetchSchedule() {
  const rows = await fetchCsv(SCHEDULE_CSV);
  return rows.map(r => ({
    Date: r['Date'] || r['date'] || r['Ημερομηνία'] || '',
    Time: r['Time'] || r['time'] || r['Ώρα'] || '',
    Opponent: r['Opponent'] || r['opponent'] || r['Αντίπαλος'] || '',
    Location: r['Location'] || r['location'] || r['Γήπεδο'] || '',
    Result: r['Result'] || r['result'] || r['Αποτέλεσμα'] || '',
  }));
}

function gameDate(g) {
  return tryParseDate(g.Date, g.Time);
}

export function findNextGame(rows) {
  const now = new Date();
  const future = rows
    .map(g => ({ g, d: gameDate(g) }))
    .filter(x => x.d && x.d >= now)
    .sort((a, b) => a.d - b.d);
  return future.length ? { ...future[0].g, _dt: future[0].d } : null;
}

export function segmentGames(rows) {
  const now = new Date();
  const withDates = rows.map(g => ({ g, d: gameDate(g) })).filter(x => x.d);
  const upcoming = withDates
    .filter(x => x.d >= now)
    .sort((a, b) => a.d - b.d)
    .map(x => ({ ...x.g, _dt: x.d }));
  const past = withDates
    .filter(x => x.d < now)
    .sort((a, b) => b.d - a.d)
    .map(x => ({ ...x.g, _dt: x.d }));
  return { upcoming, past };
}

export function renderGameCard(game, opts = {}) {
  const d = game._dt || gameDate(game);
  const el = document.createElement('div');
  el.className = `rounded-lg border ${opts.accent ? 'border-blue-200 bg-white shadow' : 'border-slate-200 bg-white'} p-4`;
  el.innerHTML = `
    <div class="flex items-start justify-between">
      <div>
        <div class="text-sm text-slate-500">${d ? formatDateTime(d) : (game.Date + (game.Time ? ' ' + game.Time : ''))}</div>
        <div class="mt-1 text-lg font-semibold">vs ${escapeHtml(game.Opponent)}</div>
        <div class="mt-1 text-slate-600">${escapeHtml(game.Location)}</div>
      </div>
      ${game.Result ? `<span class="ml-4 inline-flex items-center rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">${escapeHtml(game.Result)}</span>` : ''}
    </div>
  `;
  return el;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>\"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
}
