#!/usr/bin/env node

import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { convertAllMarkdownFiles } from './converter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = join(__dirname, '..', '..');
const DOCS_DIR = join(PROJECT_ROOT, 'docs');
const OUTPUT_DIR = join(PROJECT_ROOT, 'output');
const HEADER_PATH = join(__dirname, '..', 'header.tex');

async function main() {
  console.log('🔄 Converting markdown policies to PDF...\n');
  console.log(`Docs directory: ${DOCS_DIR}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Header file: ${HEADER_PATH}\n`);

  try {
    const results = await convertAllMarkdownFiles(DOCS_DIR, OUTPUT_DIR, HEADER_PATH);

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log('━'.repeat(50));
    console.log(`✓ Conversions completed: ${successCount} succeeded, ${failCount} failed`);

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
