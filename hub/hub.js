#!/usr/bin/env node
// Phoenix Hub — Zero-knowledge relay for Phoenix instance federation
// Usage: node hub.js
// Env: HUB_PORT (default 8888), HUB_DATA_DIR (default ./data)

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './src/db.js';
import { createServer } from './src/server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = parseInt(process.env.HUB_PORT) || 8888;
const DATA_DIR = process.env.HUB_DATA_DIR || join(__dirname, 'data');

console.log('╔══════════════════════════════════════╗');
console.log('║          Phoenix Hub v0.1.0              ║');
console.log('║  Zero-knowledge relay for Phoenix        ║');
console.log('╚══════════════════════════════════════╝');
console.log();

// Initialize database
initDb(DATA_DIR);

// Start server
createServer(PORT, DATA_DIR);
