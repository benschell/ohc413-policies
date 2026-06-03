#!/usr/bin/env node

import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { convertAllMarkdownFiles } from './converter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = join(__dirname, '..', '..');
const DOCS_DIR = join(PROJECT_ROOT, 'docs');
const HEADERS_DIR = join(__dirname, '..');

const force = process.argv.includes('--force');

async function main() {
  console.log('Converting markdown documents to PDF...\n');
  console.log(`Docs directory: ${DOCS_DIR}`);
  if (force) console.log('Force mode: ignoring content hashes');
  console.log('');

  try {
    const results = await convertAllMarkdownFiles(DOCS_DIR, '', HEADERS_DIR, force);

    const succeeded = results.filter(r => r.success && !r.skipped).length;
    const skipped = results.filter(r => r.skipped).length;
    const failed = results.filter(r => !r.success).length;

    console.log('━'.repeat(50));
    console.log(`Done: ${succeeded} converted, ${skipped} skipped, ${failed} failed`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
