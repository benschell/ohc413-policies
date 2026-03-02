# Markdown to PDF Converter

Converts markdown policy documents to PDF format using Pandoc.

## Prerequisites

This tool requires Pandoc and a LaTeX distribution to be installed on your system.

### macOS Installation

```bash
# Install Pandoc
brew install pandoc

# Install BasicTeX (smaller) or MacTeX (full)
brew install --cask basictex
# OR for full MacTeX:
# brew install --cask mactex

# After installing BasicTeX, restart your shell, then install required packages
sudo tlmgr update --self
sudo tlmgr install titlesec fancyhdr tabularx longtable booktabs enumitem parskip
```

### Verify Installation

```bash
pandoc --version
xelatex --version
```

## Usage

From the project root directory:

```bash
# Convert all markdown files in docs/ to PDFs in output/
pnpm convert
```

The converter will:
- Find all `.md` files in the `docs/` directory (recursively)
- Convert each to PDF maintaining the directory structure
- Output PDFs to the `output/` directory

## Output

Generated PDFs will mirror the source directory structure:
- `docs/troop/Troop_413_Policies.md` → `output/troop/Troop_413_Policies.pdf`
- `docs/pack/Pack_413_Policies.md` → `output/pack/Pack_413_Policies.pdf`

## Styling

The PDFs follow Scouting America brand guidelines:

**Fonts:**
- H1 headers: Roboto Slab Bold
- H2/H3 headers: Roboto Condensed Bold
- Body text: Roboto Condensed Regular

**Colors:**
- H1 headers: Scouting Warm Gray (#515354)
- H2/H3 headers: Scouting Dark Blue (#003366)
- Links and table borders: Scouting Dark Blue (#003366)

**Layout:**
- 1-inch margins on all sides
- 11pt base font size
- Headers with section title
- Footers with page numbers
- XeLaTeX PDF engine for better font support

**Font Requirements:**
The Roboto font family (Roboto Condensed and Roboto Slab) must be installed on your system. If not available, you can download from [Google Fonts](https://fonts.google.com/specimen/Roboto).
