# OHC 413 Policies

Policy documents for Pack 413 and Troop 413, sponsored by King Moravian Church.

## Structure

- `docs/` - Source markdown policy documents
  - `troop/` - Troop 413 policies
  - `pack/` - Pack 413 policies
- `output/` - Generated PDF documents (committed to git)
- `markdown-converter/` - Tool for converting markdown to PDF
- `prior-art/` - Reference documents (will be removed once finalized)

## Converting Policies to PDF

See [markdown-converter/README.md](markdown-converter/README.md) for setup instructions.

Once Pandoc is installed:

```bash
pnpm install
pnpm convert
```

This will convert all markdown files in `docs/` to PDFs in `output/`.

## Viewing PDFs

Generated PDFs are committed to the repository and can be viewed directly:
- [Troop 413 Policies](output/troop/Troop_413_Policies.pdf)
- [Pack 413 Policies](output/pack/Pack_413_Policies.pdf)
