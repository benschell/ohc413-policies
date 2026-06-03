# OHC 413 Documents

Policy documents, committee meeting agendas, and minutes for Pack 413 and Troop 413, sponsored by King Moravian Church.

## Structure

- `docs/` - Source markdown documents
  - `pack/` - Pack 413 policies, agendas, and minutes
  - `troop/` - Troop 413 policies, agendas, and minutes
  - `agenda-format.md` - Schema reference for agenda markdown files
- `markdown-converter/` - TypeScript tool for converting markdown to PDF
- `prior-art/` - Reference documents (will be removed once finalized)

Each source directory contains a `pdf/` subdirectory with the generated output:

```
docs/pack/
├── Pack_413_Policies.md
├── pdf/Pack_413_Policies.pdf
├── agendas/
│   ├── 2026-05-06.md
│   └── pdf/2026-05-06.pdf
└── minutes/
    └── (secretary PDFs stored as-is)
```

## Document Types

All markdown files use a `type` field in YAML frontmatter to control conversion:

- **`policy`** — Policy documents. Converted with table of contents.
- **`agenda`** — Committee meeting agendas. Converted with header image, colored bars, optional QR code sidebar, and roles footer table. See [`docs/agenda-format.md`](docs/agenda-format.md) for the full schema.

## Converting Documents to PDF

### Dependencies

- [Pandoc](https://pandoc.org/installing.html)
- XeLaTeX (via [TeX Live](https://tug.org/texlive/) or [MacTeX](https://tug.org/mactex/))
- LaTeX packages: `qrcode` (install via `sudo tlmgr install qrcode` if not present)
- Roboto and Roboto Slab fonts (system-installed)
- Node.js + pnpm

### Usage

```bash
pnpm install
pnpm convert        # only converts changed files (content hashing)
pnpm convert:force  # reconverts all files
```

PDFs and their content hashes are both committed to git. The hashes ensure that `pnpm convert` on a fresh clone skips files that haven't changed.
