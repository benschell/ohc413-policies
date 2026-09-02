# Troop 413 Adult Leadership Guide

LaTeX source for a reference guide to Troop 413's adult leadership roles
(Troop Committee and Program Leadership), plus standalone one-page handouts
for each individual role and standalone process checklists.

## Layout

```
roles/
  committee/   Committee-side roles (Chair, Treasurer, Secretary, ...)
                 + committee_role_template.tex, a starting point for new roles
  program/     Scoutmaster, Assistant Scoutmaster, Health Officer
checklists/    Process checklists (e.g. new leader onboarding) — standalone
                 from the role guide; see "Checklists" below
build_guide.sh Concatenates all roles into the combined guide
build/         Build output (gitignored except the final PDF)
```

Each file under `roles/` is a complete, standalone LaTeX document — it can be
compiled on its own to produce a one-page handout for that role. `pdflatex`
and `latexmk` both write their output to the *current working directory*,
not next to the source file, so `cd` into the role's directory first:

```sh
cd roles/committee   # or roles/program
latexmk -pdf committee_chair.tex
latexmk -c committee_chair.tex   # cleans intermediates, keeps the .pdf
```

None of this output is tracked in git (see `.gitignore`) — the `latexmk -c`
step above removes it, or just delete `committee_chair.{aux,fdb_latexmk,fls,log,pdf}`
by hand.

## Building the combined guide

```sh
./build_guide.sh          # build the guide
./build_guide.sh clean    # remove build/ intermediates, keep the PDF
```

This pulls the body of every role file, drops it into a shared preamble/title
page/table of contents, and compiles with `latexmk`, which reruns `pdflatex`
as many times as it actually takes (usually 2-3) to resolve section anchors,
the TOC, and hyperref's page references. On success the script immediately
runs `latexmk -c` to remove the `.aux`/`.log`/`.out`/`.toc`/`.fls`/`.fdb_latexmk`
intermediates, so `build/` ends up with just `troop413_leadership_guide.tex`
and `.pdf`. If a build fails, the intermediates and `.buildlog` are left in
place for debugging.

Only `build/troop413_leadership_guide.pdf` is committed to git, so the
current guide can be viewed without a LaTeX install. The assembled `.tex` is
regenerated on each run — if you edit a role file, rerun `./build_guide.sh`
and commit the updated PDF.

## Checklists

`checklists/` holds standalone process documents — currently just
`onboarding_checklist.tex`, a two-part checklist (unit responsibilities vs.
new leader responsibilities) for bringing on a new registered adult leader.
These are process/sequence documents rather than per-role reference pages,
so their content is kept separate from the role guide, but `./build_guide.sh`
builds them too: each name listed in the `CHECKLISTS` array gets compiled
with `latexmk` directly in `checklists/` (not merged into the combined
guide), and `./build_guide.sh clean` cleans their intermediates the same way
it does for the guide.

Unlike role PDFs, checklist PDFs (e.g. `checklists/onboarding_checklist.pdf`)
*are* tracked in git — they're the only finished view of that document, so
they're committed the same way `build/troop413_leadership_guide.pdf` is.

To add a new checklist: create `checklists/<name>.tex` and add `"<name>"` to
the `CHECKLISTS` array in `build_guide.sh`, then add
`!checklists/<name>.pdf` to `.gitignore` next to the existing exception.

## Adding a new role

1. Copy `roles/committee/committee_role_template.tex` (or an existing role
   file) as a starting point.
2. Fill in the sections and save it under `roles/committee/` or
   `roles/program/`.
3. Add an entry to `build_guide.sh`: `REQUIRED_COMMITTEE_ROLES` or
   `FUNCTIONAL_COMMITTEE_ROLES` for a committee-side role, or
   `REGISTERED_PROGRAM_ROLES`/`FUNCTIONAL_PROGRAM_ROLES` for a program-side
   one. See CLAUDE.md for what Required/Registered vs. Functional means.
4. Run `./build_guide.sh` and commit the new source file and the rebuilt PDF.

## Requirements

A working TeX distribution with `pdflatex` and `latexmk` (both included in
e.g. TeX Live) and the packages used in the preambles: `geometry`,
`enumitem`, `titlesec`, `xcolor`, `booktabs`, `array`, `parskip`, `helvet`,
`hyperref`.
