import * as XLSX from 'xlsx';
import fs from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function fetchTable(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  if (!res.ok) {
    throw new Error(`Kon ${table} niet ophalen: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function toRows(items, typeField, typeLabel) {
  return items.map(r => ({
    [typeLabel]: r[typeField],
    Locatie: r.locatie,
    Omschrijving: r.omschrijving,
    Aantal: r.aantal,
    Conditie: r.conditie,
    Opmerking: r.opmerking || ''
  }));
}

(async () => {
  const parts = await fetchTable('parts');
  const turbos = await fetchTable('turbos');

  const wb = XLSX.utils.book_new();

  const wsInvoer = XLSX.utils.json_to_sheet(toRows(parts, 'motortype', 'Motortype'));
  XLSX.utils.book_append_sheet(wb, wsInvoer, 'Invoer');

  const wsTurbos = XLSX.utils.json_to_sheet(toRows(turbos, 'turbotype', 'Turbotype'));
  XLSX.utils.book_append_sheet(wb, wsTurbos, 'Turbos');

  fs.mkdirSync('backup-output', { recursive: true });
  const datum = new Date().toISOString().slice(0, 10);
  const filename = `backup-output/voorraad-backup-${datum}.xlsx`;
  XLSX.writeFile(wb, filename);

  console.log(`Backup geschreven: ${filename} (${parts.length} onderdelen, ${turbos.length} turbo's)`);
  fs.writeFileSync('backup-output/filename.txt', filename);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
