import { fetchCsv } from './utils.js';

const HALLS_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTxIyWyKYFIDbdy8fczpFv3Zve_727oqCzECbh_agylB2d24EAMWaG4ZaWs0Q1EcrenTQ1c78ccUwPy/pub?gid=0&single=true&output=csv';

export async function fetchHalls() {
  const rows = await fetchCsv(HALLS_CSV);
  return rows.map(r => ({
    Name: r['Name'] || r['Όνομα'] || '',
    Address: r['Address'] || r['Διεύθυνση'] || '',
    MapLink: r['MapLink'] || r['Map'] || r['Χάρτης'] || '',
  }));
}

export function renderHallCard(h) {
  const el = document.createElement('div');
  el.className = 'rounded-lg border border-slate-200 bg-white p-4 flex flex-col gap-2';
  el.innerHTML = `
    <div class="text-lg font-semibold">${escapeHtml(h.Name)}</div>
    <div class="text-slate-600">${escapeHtml(h.Address)}</div>
    <div class="pt-2">
      <a class="inline-flex items-center gap-2 text-sm text-white bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded" href="${escapeAttr(h.MapLink)}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
    </div>
  `;
  return el;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>\"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
}
function escapeAttr(s) {
  return String(s || '').replace(/\"/g, '&quot;');
}
