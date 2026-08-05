import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from '../src/db/client.js';
import { importUrls } from '../src/db/repositories.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seed = path.join(__dirname, '../data/seed-urls.txt');
const text = fs.readFileSync(seed, 'utf8');
const urls = text.split(/\r?\n/);
getDb();
const r = importUrls(urls);
console.log(JSON.stringify(r, null, 2));
