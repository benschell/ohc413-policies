import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { dirname, relative, join, basename } from 'path';
import { glob } from 'glob';

export interface ConversionResult {
  inputPath: string;
  outputPath: string;
  success: boolean;
  error?: string;
}

/**
 * Converts a single markdown file to PDF using Pandoc
 */
export function convertMarkdownToPdf(
  inputPath: string,
  outputPath: string,
  headerPath: string
): ConversionResult {
  try {
    // Ensure output directory exists
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Run Pandoc conversion with custom header for styling
    // --toc creates clickable table of contents
    const command = `pandoc "${inputPath}" -o "${outputPath}" --pdf-engine=xelatex -H "${headerPath}" --toc -V geometry:margin=0.5in -V fontsize=11pt -V colorlinks=true -V linkcolor=ScoutingDarkBlue -V urlcolor=ScoutingDarkBlue -V toccolor=ScoutingDarkBlue`;

    execSync(command, { stdio: 'inherit' });

    return {
      inputPath,
      outputPath,
      success: true,
    };
  } catch (error) {
    return {
      inputPath,
      outputPath,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Finds all markdown files in the docs directory
 */
export async function findMarkdownFiles(docsDir: string): Promise<string[]> {
  const pattern = join(docsDir, '**/*.md');
  return glob(pattern, { ignore: '**/node_modules/**' });
}

/**
 * Converts the relative path from docs/ to output/
 */
export function getOutputPath(
  inputPath: string,
  docsDir: string,
  outputDir: string
): string {
  const relativePath = relative(docsDir, inputPath);
  const outputRelativePath = relativePath.replace(/\.md$/, '.pdf');
  return join(outputDir, outputRelativePath);
}

/**
 * Converts all markdown files in the docs directory
 */
export async function convertAllMarkdownFiles(
  docsDir: string,
  outputDir: string,
  headerPath: string
): Promise<ConversionResult[]> {
  const markdownFiles = await findMarkdownFiles(docsDir);
  const results: ConversionResult[] = [];

  console.log(`Found ${markdownFiles.length} markdown file(s) to convert\n`);

  for (const inputPath of markdownFiles) {
    const outputPath = getOutputPath(inputPath, docsDir, outputDir);
    const fileName = basename(inputPath);

    console.log(`Converting: ${fileName}...`);
    const result = convertMarkdownToPdf(inputPath, outputPath, headerPath);

    if (result.success) {
      console.log(`✓ Created: ${relative(process.cwd(), outputPath)}\n`);
    } else {
      console.error(`✗ Failed: ${fileName}`);
      console.error(`  Error: ${result.error}\n`);
    }

    results.push(result);
  }

  return results;
}
