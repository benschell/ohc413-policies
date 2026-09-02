#!/usr/bin/env bash
# Builds troop413_leadership_guide.pdf from the individual role .tex files.
# Usage: ./build_guide.sh          build the guide
#        ./build_guide.sh clean    remove build/ intermediates, keep the PDF
set -euo pipefail

cd "$(dirname "$0")"

OUT_DIR="build"
OUTPUT="$OUT_DIR/troop413_leadership_guide"

CHECKLISTS_DIR="checklists"
# basenames (without .tex) of standalone checklist documents to build
# alongside the guide — these are NOT folded into the combined guide (see
# CLAUDE.md: they're process/sequence docs, not per-role reference pages).
CHECKLISTS=(
  "onboarding_checklist"
)

if [ "${1:-}" = "clean" ]; then
  if [ -f "$OUTPUT.tex" ]; then
    latexmk -c -output-directory="$OUT_DIR" "$OUTPUT.tex" > /dev/null 2>&1
  fi
  rm -f "$OUTPUT.buildlog"
  for name in "${CHECKLISTS[@]}"; do
    latexmk -c -output-directory="$CHECKLISTS_DIR" "$CHECKLISTS_DIR/$name.tex" > /dev/null 2>&1
    rm -f "$CHECKLISTS_DIR/$name.buildlog"
  done
  echo "Cleaned intermediates in $OUT_DIR and $CHECKLISTS_DIR (kept PDFs if present)"
  exit 0
fi

BUILD_DIR="$(mktemp -d)"
trap 'rm -rf "$BUILD_DIR"' EXIT

mkdir -p "$OUT_DIR"

# file path (without .tex) : display name used in the table of contents.
# Required vs. functional reflects the troop's governance rule (see
# CLAUDE.md) and drives both the TOC grouping and page order below — this is
# the only place role lists need to be maintained; the guide's title/intro
# text no longer repeats them.
CHARTERING_ROLES=(
  "roles/committee/committee_cor:Chartered Organization Representative"
)

REQUIRED_COMMITTEE_ROLES=(
  "roles/committee/committee_chair:Committee Chair"
  "roles/committee/committee_treasurer:Treasurer"
  "roles/committee/committee_secretary:Secretary"
  "roles/committee/committee_advancement:Advancement Coordinator"
)

FUNCTIONAL_COMMITTEE_ROLES=(
  "roles/committee/committee_outdoor:Outdoor/Activities Chair"
  "roles/committee/committee_fundraising:Fundraising Chair"
  "roles/committee/committee_campcard:Camp Card Coordinator"
  "roles/committee/committee_popcorn:Popcorn Kernel"
  "roles/committee/committee_summercamp:Summer Camp Coordinator"
  "roles/committee/committee_quartermaster:Quartermaster"
  "roles/committee/committee_training:Training Coordinator"
)

REGISTERED_PROGRAM_ROLES=(
  "roles/program/scoutmaster:Scoutmaster"
  "roles/program/assistant_scoutmaster:Assistant Scoutmaster"
)

FUNCTIONAL_PROGRAM_ROLES=(
  "roles/program/health_officer:Health Officer"
)

MASTER="$BUILD_DIR/master.tex"

# Pulls the content between \begin{document} and \end{document} out of a role
# file, and converts its internal \section{...} headings to \section*{...} so
# they don't flood the guide's table of contents (only the role name itself,
# added separately below, should show up there).
extract_body() {
  local src="$1" dest="$2"
  awk '/\\begin\{document\}/{flag=1; next} /\\end\{document\}/{flag=0} flag' "$src" \
    | sed 's/\\section{/\\section*{/g' > "$dest"
}

add_toc_entry() {
  local level="$1" name="$2"
  {
    printf '\\phantomsection\n'
    printf '\\addcontentsline{toc}{%s}{%s}\n' "$level" "$name"
  } >> "$MASTER"
}

append_role() {
  local file="$1" name="$2" first_in_group="$3" toc_level="${4:-section}"
  local base body_dest
  base="$(basename "$file")"
  body_dest="$BUILD_DIR/${base}_body.tex"
  if [ "$first_in_group" != "yes" ]; then
    printf '\\newpage\n' >> "$MASTER"
  fi
  add_toc_entry "$toc_level" "$name"
  # Committee Chair carries more content than the others; scope it to \small
  # so it still fits on one page at the guide's shared 11pt base size.
  if [ "$base" = "committee_chair" ]; then
    printf '\\begingroup\\small\n' >> "$MASTER"
  fi
  extract_body "$file.tex" "$body_dest"
  cat "$body_dest" >> "$MASTER"
  if [ "$base" = "committee_chair" ]; then
    printf '\\endgroup\n' >> "$MASTER"
  fi
}

# ── Preamble, title page, introduction, TOC placeholder ─────────────────────
cat > "$MASTER" <<'PREAMBLE'
\documentclass[11pt, letterpaper]{article}

\usepackage[top=0.6in, bottom=0.6in, left=1in, right=1in]{geometry}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage{xcolor}
\usepackage{booktabs}
\usepackage{array}
\usepackage{parskip}
\usepackage{helvet}
\usepackage[hidelinks]{hyperref}
\renewcommand{\familydefault}{\sfdefault}
\usepackage{microtype}
\DisableLigatures[f]{encoding = *, family = *}

% Color definitions: adjust to your troop's colors if desired
\definecolor{scoutgreen}{RGB}{0, 100, 60}
\definecolor{accent}{RGB}{180, 140, 0}
\definecolor{lightbg}{RGB}{242, 248, 244}

% Section formatting
\titleformat{\section}
  {\large\bfseries\color{scoutgreen}}
  {}
  {0em}
  {}
  [\vspace{-0.4em}\textcolor{accent}{\rule{\linewidth}{1.5pt}}\vspace{0.2em}]

\titlespacing{\section}{0pt}{0.7em}{0.25em}

\pagestyle{plain}

\setlist[itemize]{noitemsep, topsep=2pt, leftmargin=1.4em}

\hypersetup{
  pdftitle={Troop 413 Adult Leadership Roles \& Responsibilities},
  pdfauthor={Troop 413}
}

\begin{document}

%% ── TITLE PAGE ────────────────────────────────────────────────────────────
\thispagestyle{empty}
\begin{center}
  \vspace*{2in}

  {\small\color{scoutgreen}\textbf{SCOUTING AMERICA \textbullet{} TROOP 413}} \\[10pt]

  {\fontsize{28pt}{34pt}\selectfont\bfseries\color{scoutgreen} Adult Leadership} \\[4pt]
  {\fontsize{28pt}{34pt}\selectfont\bfseries\color{scoutgreen} Roles \& Responsibilities} \\[18pt]

  \textcolor{accent}{\rule{0.5\linewidth}{1.5pt}} \\[14pt]

  {\Large\color{accent} Committee \& Program Leadership Reference Guide}

  \vfill

  {\footnotesize\color{gray} Troop 413 \textbullet{} Last updated: \today}

  \vspace*{1in}
\end{center}

\newpage

%% ── INTRODUCTION ──────────────────────────────────────────────────────────
\section*{Introduction}
\phantomsection
\addcontentsline{toc}{section}{Introduction}

Troop 413's adult leadership runs on two complementary structures. The \textbf{Troop Committee}'s primary responsibility is to support the Scoutmaster in delivering a quality troop program: handling finances, advancement records, fundraising, logistics, and chartering so that resources and adult support are in place. \textbf{Program Leadership} is led by the Scoutmaster and supported by the Assistant Scoutmasters, delivering the Scouting program directly to youth and working alongside the youth-led Patrol Leaders' Council.

This guide collects a one-page reference for every adult leadership role in the troop, covering what the role does, what training is required, what's expected of the role-holder, the typical time commitment, and who to contact with questions. Use it to understand your own role, see how it connects to others on the committee and program side, and help the next person transition into it smoothly.

This guide exists so responsibilities are clear and nothing falls between roles. If you're unsure whether something is yours or someone else's, check here first.

\vspace{1em}
\noindent\textbf{\color{scoutgreen} Part I: Troop Committee} covers three categories: the Chartering Organization's appointed representative (not elected or hired by the committee), Required Positions that must be filled by a registered committee member, and Functional Roles where a registered committee member is preferred but program leadership may fill the role if needed. See the Table of Contents for the current roles in each group.

\vspace{0.5em}
\noindent\textbf{\color{scoutgreen} Part II: Program Leadership} is split the same way: Registered Positions are actual BSA-registered position types, while Functional Roles are specialized duties assigned within an existing registered position. See the Table of Contents for the current roles in each group.

\newpage

%% ── TABLE OF CONTENTS ─────────────────────────────────────────────────────
\tableofcontents

\newpage
PREAMBLE

# ── Part I: Troop Committee ─────────────────────────────────────────────────
add_toc_entry "part" "Part I: Troop Committee"

add_toc_entry "section" "Chartering Organization"
first="yes"
for entry in "${CHARTERING_ROLES[@]}"; do
  file="${entry%%:*}"
  name="${entry#*:}"
  append_role "$file" "$name" "$first" "subsection"
  first="no"
done

printf '\\newpage\n' >> "$MASTER"
add_toc_entry "section" "Required Positions"
first="yes"
for entry in "${REQUIRED_COMMITTEE_ROLES[@]}"; do
  file="${entry%%:*}"
  name="${entry#*:}"
  append_role "$file" "$name" "$first" "subsection"
  first="no"
done

printf '\\newpage\n' >> "$MASTER"
add_toc_entry "section" "Functional Roles"
first="yes"
for entry in "${FUNCTIONAL_COMMITTEE_ROLES[@]}"; do
  file="${entry%%:*}"
  name="${entry#*:}"
  append_role "$file" "$name" "$first" "subsection"
  first="no"
done

# ── Part II: Program Leadership ─────────────────────────────────────────────
printf '\\newpage\n' >> "$MASTER"
add_toc_entry "part" "Part II: Program Leadership"

add_toc_entry "section" "Registered Positions"
first="yes"
for entry in "${REGISTERED_PROGRAM_ROLES[@]}"; do
  file="${entry%%:*}"
  name="${entry#*:}"
  append_role "$file" "$name" "$first" "subsection"
  first="no"
done

printf '\\newpage\n' >> "$MASTER"
add_toc_entry "section" "Functional Roles"
first="yes"
for entry in "${FUNCTIONAL_PROGRAM_ROLES[@]}"; do
  file="${entry%%:*}"
  name="${entry#*:}"
  append_role "$file" "$name" "$first" "subsection"
  first="no"
done

printf '\\end{document}\n' >> "$MASTER"

cp "$MASTER" "$OUTPUT.tex"

# latexmk figures out how many passes are actually needed (TOC/hyperref
# references can take 2-3) instead of us hardcoding a fixed loop, and knows
# which generated files belong to this job for the cleanup step below.
if ! latexmk -pdf -interaction=nonstopmode -output-directory="$OUT_DIR" "$OUTPUT.tex" > "$OUTPUT.buildlog" 2>&1; then
  echo "latexmk failed — see $OUTPUT.buildlog" >&2
  exit 1
fi

# Build succeeded: drop the .aux/.out/.toc/.fls/.fdb_latexmk/.buildlog
# intermediates and keep only the assembled .tex and final .pdf.
latexmk -c -output-directory="$OUT_DIR" "$OUTPUT.tex" > /dev/null 2>&1
rm -f "$OUTPUT.buildlog"

pages=$(pdfinfo "$OUTPUT.pdf" 2>/dev/null | awk '/^Pages:/{print $2}')
echo "Built $OUTPUT.pdf ($pages pages)"

# ── Standalone checklists ────────────────────────────────────────────────────
for name in "${CHECKLISTS[@]}"; do
  checklist_buildlog="$CHECKLISTS_DIR/$name.buildlog"
  if ! latexmk -pdf -interaction=nonstopmode -output-directory="$CHECKLISTS_DIR" "$CHECKLISTS_DIR/$name.tex" > "$checklist_buildlog" 2>&1; then
    echo "latexmk failed on $name — see $checklist_buildlog" >&2
    exit 1
  fi
  latexmk -c -output-directory="$CHECKLISTS_DIR" "$CHECKLISTS_DIR/$name.tex" > /dev/null 2>&1
  rm -f "$checklist_buildlog"
  checklist_pages=$(pdfinfo "$CHECKLISTS_DIR/$name.pdf" 2>/dev/null | awk '/^Pages:/{print $2}')
  echo "Built $CHECKLISTS_DIR/$name.pdf ($checklist_pages pages)"
done
