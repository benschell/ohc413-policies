import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { dirname, relative, join, basename } from 'path';
import { glob } from 'glob';
import yaml from 'js-yaml';

export interface ConversionResult {
  inputPath: string;
  outputPath: string;
  success: boolean;
  skipped?: boolean;
  error?: string;
}

interface Role {
  title: string;
  name?: string;
  open?: boolean;
}

interface Link {
  label: string;
  url: string;
}

interface AgendaFrontmatter {
  type: 'agenda';
  unit: string;
  date: string | Date;
  time: string;
  prior_minutes_date: string | Date;
  next_meeting_date?: string | Date;
  roles: Role[];
  program_leadership: string;
  active_members: string[];
  inactive_members?: string[];
  links?: Link[];
}

interface PolicyFrontmatter {
  type: 'policy';
  title: string;
  subtitle?: string;
  date?: string;
}

interface FormUnit {
  name: string;
  email?: string;
  legal_name?: string;
  /** Extra per-unit template variables, usable as {{key}} in the body. */
  vars?: Record<string, string>;
}

interface FormField {
  /** A heading entry starts a new field group (and forces a row break). */
  heading?: string;
  label?: string;
  /** Fraction of the text width this field occupies (default 1.0). */
  width?: number;
  type?: 'text' | 'signature' | 'date' | 'checkbox';
  /** Override the field box height (e.g. "26pt") for write-in answers. */
  height?: string;
  /** Put the label on its own line above a full-width box. */
  stacked?: boolean;
  /** AcroForm field name; defaults to a slug of the label. */
  name?: string;
  /** Force this field onto a new row. */
  break?: boolean;
}

interface FormFrontmatter {
  type: 'form';
  title: string;
  units: (string | FormUnit)[];
  address?: string;
  email?: string;
  revision?: string | Date;
  /** Override the auto-sized title point size. */
  title_size?: number;
  fields: FormField[];
}

type Frontmatter = AgendaFrontmatter | PolicyFrontmatter | FormFrontmatter;

// --- Unit profiles ---
// Branding that belongs to the unit rather than to any one document.
interface UnitProfile {
  legalName: string;
  headerImage: string;
  barColor: string;
  /** Unit-level vocabulary: a Pack has Dens, a Troop has Patrols. */
  subunit: string;
  youth: string;
}

const UNIT_PROFILES: Record<'pack' | 'troop', (unit: string) => UnitProfile> = {
  pack: unit => ({
    legalName: `Scouting America Cub Scout ${unit}`,
    headerImage: 'pack-header.png',
    barColor: 'ScoutingDarkBlue',
    subunit: 'Den',
    youth: 'Cub Scout',
  }),
  troop: unit => ({
    legalName: `Scouting America Scouts BSA ${unit}`,
    headerImage: 'troop-header.png',
    barColor: 'ScoutingTan',
    subunit: 'Patrol',
    youth: 'Scout',
  }),
};

// --- Hashing ---

function computeHash(inputs: string[]): string {
  const hash = createHash('sha256');
  for (const input of inputs) {
    hash.update(input);
  }
  return hash.digest('hex');
}

function getHashPath(outputPath: string): string {
  return join(dirname(outputPath), `.${basename(outputPath)}.hash`);
}

function isUnchanged(outputPath: string, currentHash: string): boolean {
  const hashPath = getHashPath(outputPath);
  if (!existsSync(outputPath) || !existsSync(hashPath)) return false;
  return readFileSync(hashPath, 'utf-8').trim() === currentHash;
}

function writeHash(outputPath: string, hash: string): void {
  const hashPath = getHashPath(outputPath);
  writeFileSync(hashPath, hash + '\n');
}

// --- Helpers ---

function parseFrontmatter(content: string): { frontmatter: Frontmatter | null; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: null, body: content };
  const frontmatter = yaml.load(match[1]) as Frontmatter;
  return { frontmatter, body: match[2] };
}

function formatDate(date: string | Date): string {
  const d = date instanceof Date ? date : new Date(date + 'T12:00:00');
  return `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

function escapeLatex(str: string): string {
  return str
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([#$%&_{}~^])/g, '\\$1');
}

function rawLatex(content: string): string {
  return '```{=latex}\n' + content + '\n```';
}

function unitType(unit: string): 'pack' | 'troop' {
  return unit.toLowerCase().includes('pack') ? 'pack' : 'troop';
}

function barColor(unit: string): string {
  return unitType(unit) === 'pack' ? 'ScoutingDarkBlue' : 'ScoutingTan';
}

// --- Agenda building ---

function buildHeaderImage(unit: string, assetsDir: string): string {
  const type = unitType(unit);
  const imagePath = join(assetsDir, `${type}-header.png`);
  if (!existsSync(imagePath)) return '';

  const lines: string[] = [];
  lines.push('{\\centering');
  lines.push(`\\includegraphics[width=\\textwidth]{${imagePath}}%`);
  lines.push('\\par}');
  lines.push('\\vspace{0.5em}');
  return lines.join('\n');
}

function buildTitle(fm: AgendaFrontmatter): string {
  const title = `${fm.unit} Committee Meeting`;
  const date = `${formatDate(fm.date)} - ${fm.time}`;

  const lines: string[] = [];
  lines.push('{\\centering\\robotoserifbold\\fontsize{27}{32}\\selectfont ' + escapeLatex(title) + '\\par}');
  lines.push('\\vskip 0.3em');
  lines.push('{\\centering\\fontsize{14}{17}\\selectfont ' + escapeLatex(date) + '\\par}');
  lines.push('\\vskip 0.8em');
  return lines.join('\n');
}

function buildRolesFooter(fm: AgendaFrontmatter): string {
  const lines: string[] = [];

  const filledRoles = fm.roles.filter(r => !r.open);
  const openRoles = fm.roles.filter(r => r.open).map(r => r.title);

  const cells: string[] = filledRoles.map(
    r => `\\textbf{${escapeLatex(r.title)}} - ${escapeLatex(r.name ?? '')}`
  );
  if (openRoles.length > 0) {
    cells.push(`\\textit{OPEN: ${escapeLatex(openRoles.join(', '))}}`);
  }

  // Fill row-by-row (left to right, then next row)
  const cols = 3;
  while (cells.length % cols !== 0) cells.push('');

  // Build the table inside a minipage so it works in the fancyhdr footer
  lines.push('\\begin{minipage}{\\textwidth}');
  lines.push('{\\fontsize{9}{11}\\selectfont\\raggedright\\renewcommand{\\arraystretch}{1.2}');
  lines.push(`\\begin{tabular}{|p{0.27\\textwidth}|p{0.33\\textwidth}|p{0.27\\textwidth}|}`);
  lines.push('\\hline');
  lines.push(`\\multicolumn{${cols}}{|c|}{\\textbf{Committee Roles + Current Chairs}} \\\\`);
  lines.push('\\hline');

  for (let i = 0; i < cells.length; i += cols) {
    const rowCells = cells.slice(i, i + cols);
    lines.push(`${rowCells.join(' & ')} \\\\`);
  }
  lines.push('\\hline');

  lines.push(`\\multicolumn{${cols}}{|p{0.97\\textwidth}|}{\\textbf{Program Leadership:} ${escapeLatex(fm.program_leadership)}} \\\\`);
  lines.push('\\hline');

  const activeText = escapeLatex(fm.active_members.join(', '));
  if (fm.inactive_members && fm.inactive_members.length > 0) {
    const inactiveText = escapeLatex(fm.inactive_members.join(', '));
    lines.push(`\\multicolumn{${cols - 1}}{|p{0.67\\textwidth}|}{\\textbf{Active Committee Members:} ${activeText}} & \\textbf{Inactive:} ${inactiveText} \\\\`);
  } else {
    lines.push(`\\multicolumn{${cols}}{|p{0.97\\textwidth}|}{\\textbf{Active Committee Members:} ${activeText}} \\\\`);
  }
  lines.push('\\hline');
  lines.push('\\end{tabular}');
  lines.push('}');
  lines.push('\\end{minipage}');

  return lines.join('\n');
}

function buildQrSection(links: Link[]): string {
  const lines: string[] = [];
  for (const link of links) {
    lines.push('');
    lines.push(`${escapeLatex(link.label)}:`);
    lines.push('\\vspace{0.4em}');
    lines.push('');
    lines.push(`\\qrcode[height=1.3in]{${link.url}}`);
    lines.push('\\vspace{0.4em}');
  }
  return lines.join('\n');
}

function preprocessAgenda(fm: AgendaFrontmatter, body: string, assetsDir: string): string {
  const lines: string[] = [];

  // Set bar color, define roles table as footer on all pages
  const rolesFooter = buildRolesFooter(fm);
  lines.push(rawLatex(
    `\\renewcommand{\\agendabarcolor}{${barColor(fm.unit)}}` +
    // Page 1 (plain): no rules, tall roles box as the footer. We blank both
    // \headrule and \footrule explicitly — agenda-header.tex defines them as
    // unconditional 4pt rules that otherwise leak across page styles.
    `\n\\fancypagestyle{plain}{` +
    `\n  \\fancyhf{}` +
    `\n  \\renewcommand{\\headrulewidth}{0pt}` +
    `\n  \\renewcommand{\\headrule}{}` +
    `\n  \\renewcommand{\\footrulewidth}{0pt}` +
    `\n  \\renewcommand{\\footrule}{}` +
    `\n  \\fancyfoot[C]{\\color{ScoutingTitle}${rolesFooter}}` +
    `\n}` +
    // Page 2+ (fancy): colored bar at top, no roles box. The deep bottom margin
    // is reserved for page 1's tall footer, so drop the bottom bar to the bottom
    // of that band with a fixed raise instead of letting it float at the anchor.
    `\n\\fancypagestyle{fancy}{` +
    `\n  \\fancyhf{}` +
    `\n  \\renewcommand{\\headrulewidth}{4pt}` +
    `\n  \\renewcommand{\\headrule}{\\color{\\agendabarcolor}\\hrule height 4pt}` +
    `\n  \\renewcommand{\\footrulewidth}{0pt}` +
    `\n  \\renewcommand{\\footrule}{}` +
    `\n  \\fancyfoot[C]{\\smash{\\raisebox{-1.1in}{\\color{\\agendabarcolor}\\rule{\\textwidth}{4pt}}}}` +
    `\n}` +
    `\n\\pagestyle{fancy}`
  ));
  lines.push('');

  // Header image (if asset exists)
  const headerImage = buildHeaderImage(fm.unit, assetsDir);
  if (headerImage) {
    lines.push(rawLatex(headerImage));
    lines.push('');
  }

  // Title block
  lines.push(rawLatex(buildTitle(fm)));
  lines.push('');

  // First page uses the roles-footer style (no top bar); page 2+ inherit the
  // default `fancy` style (colored bars only). Issued after the title so the
  // first page's header reliably picks up `plain`.
  lines.push(rawLatex('\\thispagestyle{plain}'));
  lines.push('');

  // Agenda body with optional QR sidebar
  if (fm.links && fm.links.length > 0) {
    // Start both minipages together so they align at the top
    const sidebarContent = buildQrSection(fm.links);
    lines.push(rawLatex(
      '\\noindent\\begin{minipage}[t]{0.68\\textwidth}\\vspace{0pt}'
    ));
    lines.push('');
    lines.push(body.trim());
    lines.push('');
    lines.push(rawLatex(
      '\\end{minipage}%\n\\hfill\n' +
      '\\begin{minipage}[t]{0.26\\textwidth}\\vspace{0pt}\n' +
      '\\raggedleft\n' +
      sidebarContent + '\n' +
      '\\end{minipage}'
    ));
  } else {
    lines.push(body.trim());
  }

  // Roles table is rendered as the page footer (see fancyhdr setup above)

  return lines.join('\n');
}

// --- Form building ---

interface FormContext {
  unit: string;
  org: string;
  address: string;
  email: string;
  title: string;
  subunit: string;
  youth: string;
  [key: string]: string;
}

function resolveFormUnit(entry: string | FormUnit, fm: FormFrontmatter): FormContext {
  const unit = typeof entry === 'string' ? entry : entry.name;
  const overrides: Partial<FormUnit> = typeof entry === 'string' ? {} : entry;
  const profile = UNIT_PROFILES[unitType(unit)](unit);
  return {
    ...(overrides.vars ?? {}),
    unit,
    org: overrides.legal_name ?? profile.legalName,
    address: fm.address ?? '',
    email: overrides.email ?? fm.email ?? '',
    title: fm.title,
    subunit: profile.subunit,
    youth: profile.youth,
  };
}

/** Replace {{unit}}, {{org}}, {{subunit}}, ... and any per-unit `vars`. */
function applyTemplate(text: string, ctx: FormContext): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    ctx[key] === undefined ? match : ctx[key]
  );
}

function fieldName(field: FormField, index: number, used: Set<string>): string {
  const slug = (field.label ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const base = field.name ?? (slug || `field${index}`);
  let name = base;
  let n = 2;
  while (used.has(name)) name = `${base}_${n++}`;
  used.add(name);
  return name;
}

interface FieldGroup {
  /** Slug of the group heading; used by {{fields:slug}} placeholders. */
  key: string;
  latex: string;
}

function buildFieldGroups(fields: FormField[], ctx: FormContext): FieldGroup[] {
  const groups: FieldGroup[] = [];
  const used = new Set<string>();
  let group: string[] = [];
  let groupKey = '';
  let row: string[] = [];
  let rowWidth = 0;

  const flushRow = () => {
    if (row.length === 0) return;
    group.push(row.join('\\hfill%\n'));
    group.push('\\par\\formrowgap');
    row = [];
    rowWidth = 0;
  };

  // Each heading starts a new group, and a group is boxed so a page break can
  // never separate a heading from its fields (or split a row of fields).
  const flushGroup = () => {
    flushRow();
    if (group.length === 0) return;
    groups.push({
      key: groupKey || `group${groups.length + 1}`,
      latex: ['\\begin{minipage}{\\textwidth}', ...group, '\\end{minipage}\\par'].join('\n'),
    });
    group = [];
    groupKey = '';
  };

  fields.forEach((field, index) => {
    if (field.heading) {
      const heading = applyTemplate(field.heading, ctx);
      flushGroup();
      groupKey = heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      group.push(`\\formgroupheading{${escapeLatex(heading)}}`);
      return;
    }

    const width = field.width ?? 1.0;
    // Flow left-to-right, wrapping when the row is full (small epsilon so
    // widths like 0.5 + 0.5 still share a row).
    if (field.break || rowWidth + width > 1.001) flushRow();

    const label = escapeLatex(applyTemplate(field.label ?? '', ctx));
    const name = fieldName(field, index, used);

    if (field.type === 'checkbox') {
      row.push(`\\formcheckbox{${name}}{${label}}{${width}}`);
    } else {
      const height = field.height ?? (field.type === 'signature' ? '18pt' : '14pt');
      const macro = field.stacked ? 'formfieldstacked' : 'formfield';
      row.push(`\\${macro}{${name}}{${label}}{${width}}{${height}}`);
    }
    rowWidth += width;
  });

  flushGroup();
  return groups;
}

function buildFormMasthead(
  ctx: FormContext,
  unit: string,
  assetsDir: string,
  titleSize?: number
): string {
  const profile = UNIT_PROFILES[unitType(unit)](unit);
  const lines: string[] = [];

  const imagePath = join(assetsDir, profile.headerImage);
  if (existsSync(imagePath)) {
    lines.push('{\\centering');
    lines.push(`\\includegraphics[width=\\textwidth]{${imagePath}}%`);
    lines.push('\\par}');
    lines.push('\\vspace{0.4em}');
  }

  lines.push(
    '{\\centering\\robotoserifbold\\fontsize{13}{16}\\selectfont ' +
      escapeLatex(ctx.org.toUpperCase()) +
      '\\par}'
  );
  for (const line of [ctx.address, ctx.email].filter(Boolean)) {
    lines.push(
      '{\\centering\\fontsize{11}{14}\\selectfont ' + escapeLatex(line) + '\\par}'
    );
  }

  // Long titles drop a size so they still set on one line.
  const size = titleSize ?? (ctx.title.length > 44 ? 16 : 20);
  lines.push('\\vspace{0.6em}');
  lines.push(
    `{\\centering\\robotoserifbold\\fontsize{${size}}{${Math.round(size * 1.2)}}\\selectfont ` +
      escapeLatex(ctx.title) +
      '\\par}'
  );
  lines.push('\\vspace{0.45em}');

  return lines.join('\n');
}

function preprocessForm(fm: FormFrontmatter, body: string, entry: string | FormUnit, assetsDir: string): string {
  const ctx = resolveFormUnit(entry, fm);
  const profile = UNIT_PROFILES[unitType(ctx.unit)](ctx.unit);

  const footerBits = [ctx.unit, fm.title];
  if (fm.revision) footerBits.push(`Rev. ${formatDate(fm.revision)}`);
  const footer = footerBits.map(escapeLatex).join('~~\\textbar{}~~');

  const lines: string[] = [];
  lines.push(rawLatex(`\\setformmeta{${profile.barColor}}{${footer}}`));
  lines.push('');
  lines.push(rawLatex(buildFormMasthead(ctx, ctx.unit, assetsDir, fm.title_size)));
  lines.push('');

  const groups = buildFieldGroups(fm.fields ?? [], ctx);
  const placed = new Set<string>();
  let templatedBody = applyTemplate(body.trim(), ctx);

  // {{fields:some-heading}} drops one group at that point in the body, so a
  // form can put contact fields above the release language and signatures
  // below it. A bare {{fields}} takes whatever groups are left over.
  templatedBody = templatedBody.replace(/\{\{fields:([a-z0-9-]+)\}\}/g, (match, key: string) => {
    const group = groups.find(g => g.key === key);
    if (!group) {
      console.warn(`  Warning: {{fields:${key}}} has no matching field group`);
      return '';
    }
    placed.add(key);
    return `\n\n${rawLatex(group.latex)}\n\n`;
  });

  const remaining = groups.filter(g => !placed.has(g.key));
  const remainingBlock = remaining.map(g => rawLatex(g.latex)).join('\n\n');

  if (templatedBody.includes('{{fields}}')) {
    const [before, after] = templatedBody.split('{{fields}}');
    lines.push(before.trim());
    lines.push('');
    lines.push(remainingBlock);
    lines.push('');
    lines.push(after.trim());
  } else {
    lines.push(templatedBody);
    if (remaining.length > 0) {
      lines.push('');
      lines.push(rawLatex('\\vspace{1.5em}'));
      lines.push('');
      lines.push(remainingBlock);
    }
  }

  return lines.join('\n');
}

function formOutputPath(defaultOutputPath: string, title: string, unit: string): string {
  const slug = (s: string) => s.trim().replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return join(dirname(defaultOutputPath), `${slug(title)}_${slug(unit)}.pdf`);
}

// --- Conversion ---

function convertFile(
  inputPath: string,
  outputPath: string,
  headerPath: string,
  pandocArgs: string,
  tempContent?: string
): ConversionResult {
  const outputDir = dirname(outputPath);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  let sourcePath = inputPath;
  if (tempContent) {
    sourcePath = inputPath.replace(/\.md$/, '.tmp.md');
    writeFileSync(sourcePath, tempContent);
  }

  try {
    const command = `pandoc "${sourcePath}" -o "${outputPath}" --pdf-engine=lualatex -H "${headerPath}" ${pandocArgs}`;
    execSync(command, { stdio: 'inherit' });
    return { inputPath, outputPath, success: true };
  } catch (error) {
    return {
      inputPath,
      outputPath,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    // KEEP_TMP=1 leaves the generated markdown+LaTeX next to the source for
    // debugging what the preprocessors actually emitted.
    if (tempContent && !process.env.KEEP_TMP && existsSync(sourcePath)) {
      unlinkSync(sourcePath);
    }
  }
}

export function convertMarkdownToPdf(
  inputPath: string,
  outputPath: string,
  headersDir: string,
  force: boolean = false
): ConversionResult[] {
  const content = readFileSync(inputPath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(content);

  if (!frontmatter?.type) {
    console.log(`  Skipping (no type in frontmatter)`);
    return [{ inputPath, outputPath, success: true, skipped: true }];
  }

  const docType = frontmatter.type;
  const assetsDir = join(headersDir, 'assets');

  const headerFileName =
    docType === 'agenda' ? 'agenda-header.tex'
    : docType === 'form' ? 'form-header.tex'
    : 'header.tex';
  const headerPath = join(headersDir, headerFileName);
  const headerContent = readFileSync(headerPath, 'utf-8');

  // A form renders one PDF per unit; everything else renders exactly one.
  if (docType === 'form') {
    const fm = frontmatter as FormFrontmatter;
    const args = '-V geometry:top=0.7in,left=0.75in,right=0.75in,bottom=0.8in -V fontsize=11pt -V colorlinks=true -V linkcolor=ScoutingDarkBlue -V urlcolor=ScoutingDarkBlue';

    return (fm.units ?? []).map(entry => {
      const unit = typeof entry === 'string' ? entry : entry.name;
      const unitOutputPath = formOutputPath(outputPath, fm.title, unit);
      const contentHash = computeHash([content, headerContent, docType, unit]);

      if (!force && isUnchanged(unitOutputPath, contentHash)) {
        console.log(`  Skipping ${unit} (unchanged)`);
        return { inputPath, outputPath: unitOutputPath, success: true, skipped: true };
      }

      const processed = preprocessForm(fm, body, entry, assetsDir);
      const result = convertFile(inputPath, unitOutputPath, headerPath, args, processed);
      if (result.success) writeHash(unitOutputPath, contentHash);
      return result;
    });
  }

  const contentHash = computeHash([content, headerContent, docType]);
  if (!force && isUnchanged(outputPath, contentHash)) {
    console.log(`  Skipping (unchanged)`);
    return [{ inputPath, outputPath, success: true, skipped: true }];
  }

  let result: ConversionResult;

  if (docType === 'agenda') {
    const fm = frontmatter as AgendaFrontmatter;
    const processed = preprocessAgenda(fm, body, assetsDir);
    const args = '-V geometry:top=0.9in,left=0.5in,right=0.5in,bottom=2in -V fontsize=11pt -V colorlinks=true -V linkcolor=ScoutingDarkBlue -V urlcolor=ScoutingDarkBlue';
    result = convertFile(inputPath, outputPath, headerPath, args, processed);
  } else {
    const args = '--toc -V geometry:margin=0.5in -V fontsize=11pt -V colorlinks=true -V linkcolor=ScoutingDarkBlue -V urlcolor=ScoutingDarkBlue -V toccolor=ScoutingDarkBlue';
    result = convertFile(inputPath, outputPath, headerPath, args);
  }

  if (result.success) {
    writeHash(outputPath, contentHash);
  }

  return [result];
}

export async function findMarkdownFiles(docsDir: string): Promise<string[]> {
  const pattern = join(docsDir, '**/*.md');
  return glob(pattern, { ignore: '**/node_modules/**' });
}

export function getOutputPath(
  inputPath: string,
  docsDir: string,
  _outputDir: string
): string {
  const dir = dirname(inputPath);
  const name = basename(inputPath).replace(/\.md$/, '.pdf');
  return join(dir, 'pdf', name);
}

export async function convertAllMarkdownFiles(
  docsDir: string,
  outputDir: string,
  headersDir: string,
  force: boolean = false
): Promise<ConversionResult[]> {
  const markdownFiles = await findMarkdownFiles(docsDir);
  const results: ConversionResult[] = [];

  console.log(`Found ${markdownFiles.length} markdown file(s) to convert\n`);

  for (const inputPath of markdownFiles) {
    const outputPath = getOutputPath(inputPath, docsDir, outputDir);
    const fileName = basename(inputPath);

    console.log(`Converting: ${fileName}...`);
    const fileResults = convertMarkdownToPdf(inputPath, outputPath, headersDir, force);

    for (const result of fileResults) {
      if (result.skipped) {
        // already logged
      } else if (result.success) {
        console.log(`  Created: ${relative(process.cwd(), result.outputPath)}`);
      } else {
        console.error(`  Failed: ${fileName}`);
        console.error(`  Error: ${result.error}`);
      }
    }
    console.log('');

    results.push(...fileResults);
  }

  return results;
}
