import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const backupDir = path.join(rootDir, 'supabase-backup');
const seedFilePath = path.join(rootDir, 'seed.sql');

function loadJson(baseName) {
  const candidates = [
    `${baseName}_rows.json`,
    `${baseName}.json`
  ];
  for (const candidate of candidates) {
    const fullPath = path.join(backupDir, candidate);
    if (fs.existsSync(fullPath)) {
      console.log(`Found backup file: ${candidate}`);
      return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    }
  }
  throw new Error(`Could not find backup file for "${baseName}" in ${backupDir}`);
}

function sqlEscape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  const s = String(val);
  if (s.includes('\n') || s.includes('\r')) {
    const lines = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    return lines.map(line => `'${line.replace(/'/g, "''")}'`).join(' || char(10) || ');
  }
  return `'${s.replace(/'/g, "''")}'`;
}

function generateSecretToken() {
  return 'tqm_' + crypto.randomBytes(16).toString('hex');
}

function main() {
  console.log('--- Starting Taqyeemi Supabase Backup Migration ---');

  const clientsData = loadJson('clients');
  const feedbackData = loadJson('feedback');

  console.log(`Loaded ${clientsData.length} client(s) and ${feedbackData.length} feedback row(s).`);

  const sqlStatements = [
    '-- Auto-generated seed file for Cloudflare D1 (taqyeemi-db)',
    '-- Generated at ' + new Date().toISOString()
  ];

  // 1. Businesses
  for (const client of clientsData) {
    const id = client.id;
    const name = client.name;
    const googleMapsUrl = client.google_review_url || client.google_maps_url || '';
    const publicSlug = client.slug || client.public_slug;
    const secretToken = client.secret_token || generateSecretToken();
    const ownerEmail = client.owner_email || null;
    const createdAt = client.created_at || new Date().toISOString();

    if (!id || !name || !googleMapsUrl || !publicSlug) {
      throw new Error(`Client record missing required field: ${JSON.stringify(client)}`);
    }

    sqlStatements.push(
      `INSERT INTO businesses (id, name, google_maps_url, public_slug, secret_token, owner_email, created_at) ` +
      `VALUES (${sqlEscape(id)}, ${sqlEscape(name)}, ${sqlEscape(googleMapsUrl)}, ${sqlEscape(publicSlug)}, ${sqlEscape(secretToken)}, ${sqlEscape(ownerEmail)}, ${sqlEscape(createdAt)});`
    );
  }

  // 2. Feedback
  for (const fb of feedbackData) {
    const id = fb.id;
    const businessId = fb.client_id || fb.business_id;
    const rating = Number(fb.rating);
    const comment = fb.feedback_text !== undefined ? fb.feedback_text : (fb.comment !== undefined ? fb.comment : null);
    const customerContact = fb.customer_contact || null;
    const createdAt = fb.submitted_at || fb.created_at || new Date().toISOString();

    if (!id || !businessId || isNaN(rating)) {
      throw new Error(`Feedback record missing required field: ${JSON.stringify(fb)}`);
    }

    sqlStatements.push(
      `INSERT INTO feedback (id, business_id, rating, comment, customer_contact, created_at) ` +
      `VALUES (${sqlEscape(id)}, ${sqlEscape(businessId)}, ${rating}, ${sqlEscape(comment)}, ${sqlEscape(customerContact)}, ${sqlEscape(createdAt)});`
    );
  }

  fs.writeFileSync(seedFilePath, sqlStatements.join('\n') + '\n', 'utf8');
  console.log(`Successfully generated ${seedFilePath} with ${clientsData.length} businesses and ${feedbackData.length} feedback entries.`);
}

main();
