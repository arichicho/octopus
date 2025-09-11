#!/usr/bin/env node
/**
 * Sync Gemini/Meet meeting minutes from Google Drive.
 *
 * Usage:
 *   node scripts/sync-gemini-minutes.js \
 *     --client client_secret_xxx.apps.googleusercontent.com.json \
 *     [--out data/meetings] [--days 30]
 *
 * Notes:
 * - Requires a Google OAuth client for "Desktop app" or "Web" with localhost redirect.
 * - First run opens a browser for consent and stores cached tokens under .tokens/.
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { authenticate } = require('@google-cloud/local-auth');
const sanitize = require('sanitize-filename');

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/documents.readonly',
];

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { client: null, outDir: 'data/meetings', days: 30, limit: 100 }; // sane defaults
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--client') out.client = args[++i];
    else if (a === '--out') out.outDir = args[++i];
    else if (a === '--days') out.days = parseInt(args[++i], 10) || out.days;
    else if (a === '--limit') out.limit = parseInt(args[++i], 10) || out.limit;
    else if (a === '--help' || a === '-h') {
      console.log(`\nUsage: node scripts/sync-gemini-minutes.js --client <client_secret.json> [--out data/meetings] [--days 30] [--limit 100]\n`);
      process.exit(0);
    }
  }
  if (!out.client) {
    // Best effort: try to find a client_secret file in root.
    const guesses = fs
      .readdirSync(process.cwd())
      .filter((f) => f.startsWith('client_secret_') && f.endsWith('.json'));
    if (guesses.length) out.client = guesses[0];
  }
  if (!out.client) {
    console.error('Missing --client <client_secret.json> and no client_secret_*.json found in CWD.');
    process.exit(1);
  }
  return out;
}

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

function sinceDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function buildQuery(sinceIso) {
  // Match common Gemini/Meet minute titles in ES/EN.
  const nameFilters = [
    "name contains ' - Notas'",
    "name contains ' - Notes'",
    "name contains 'Notas de reunión'",
    "name contains 'Meeting notes'",
    "name contains ' - Not'", // fallback for truncated UI titles
  ];
  const joined = '(' + nameFilters.join(' or ') + ')';
  const time = sinceIso ? ` and modifiedTime > '${sinceIso}'` : '';
  // We focus on Google Docs (Gemini usually generates Docs)
  return `mimeType = 'application/vnd.google-apps.document' and trashed = false and ${joined}${time}`;
}

async function getAuth(keyfilePath) {
  const tokenDir = path.join(process.cwd(), '.tokens');
  await ensureDir(tokenDir);
  // @google-cloud/local-auth will cache tokens in home dir by default, but we can keep it simple.
  // It reads the client from keyfilePath and handles localhost callback.
  const auth = await authenticate({
    scopes: SCOPES,
    keyfilePath,
  });
  return auth;
}

async function exportDocAsText(drive, fileId) {
  const res = await drive.files.export(
    { fileId, mimeType: 'text/plain' },
    { responseType: 'arraybuffer' }
  );
  const buf = Buffer.from(res.data);
  return buf.toString('utf8');
}

function makeFilename(item) {
  const ts = (item.modifiedTime || item.createdTime || new Date().toISOString()).slice(0, 19).replace(/[:T]/g, '-');
  const safe = sanitize(item.name || 'untitled').slice(0, 80);
  return `${ts}__${safe}__${item.id}.txt`;
}

async function main() {
  const opts = parseArgs();
  const outDir = path.resolve(opts.outDir);
  await ensureDir(outDir);

  const auth = await getAuth(path.resolve(opts.client));
  const drive = google.drive({ version: 'v3', auth });

  const query = buildQuery(sinceDate(opts.days));
  const params = { q: query, pageSize: opts.limit, fields: 'files(id,name,modifiedTime,createdTime,webViewLink,iconLink,owners,createdTime)', orderBy: 'modifiedTime desc' };
  const list = await drive.files.list(params);
  const files = list.data.files || [];
  console.log(`Found ${files.length} candidate docs.`);

  const indexPath = path.join(outDir, 'index.json');
  const index = [];

  for (const f of files) {
    try {
      const text = await exportDocAsText(drive, f.id);
      const fname = makeFilename(f);
      const target = path.join(outDir, fname);
      await fs.promises.writeFile(target, text, 'utf8');
      index.push({ id: f.id, name: f.name, modifiedTime: f.modifiedTime, createdTime: f.createdTime, webViewLink: f.webViewLink, file: fname });
      console.log(`✓ Saved ${fname}`);
    } catch (e) {
      console.warn(`! Failed to export ${f.name} (${f.id}):`, e.message || e);
    }
  }

  await fs.promises.writeFile(indexPath, JSON.stringify(index, null, 2));
  console.log(`\nDone. Saved ${index.length} minutes to ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

