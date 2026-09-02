# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

LaTeX source for Troop 413's Adult Leadership Roles & Responsibilities: one-page
standalone handouts for each adult leadership role, a combined multi-page
reference guide assembled from those same role files, and standalone process
checklists (e.g. new leader onboarding) that are built but not merged into
the guide.

## Commands

### Build the combined guide and checklists

```sh
./build_guide.sh          # build
./build_guide.sh clean    # remove intermediates from build/ and checklists/, keep PDFs
```

Builds `build/troop413_leadership_guide.pdf` (plus the assembled `.tex` and
intermediates, all in `build/`), then compiles every name listed in the
`CHECKLISTS` array (currently just `onboarding_checklist`) directly in
`checklists/`. Both the guide PDF and checklist PDFs are committed to git —
everything else regenerates on each run. If a pass fails, check the
corresponding `.buildlog` (`build/troop413_leadership_guide.buildlog` or
`checklists/<name>.buildlog`) rather than the terminal output.

### Compile a single role handout standalone

```sh
cd roles/committee   # or roles/program
latexmk -pdf committee_chair.tex
latexmk -c committee_chair.tex   # cleans intermediates, keeps the .pdf
```

Both `pdflatex` and `latexmk` write output to the *current working
directory*, not next to the source file — running either from the repo root
against a `roles/...` path drops the build artifacts in the repo root
instead. `cd` into the role's directory first (or pass
`-output-directory=roles/committee`). These outputs aren't tracked in git.

There is no test suite or linter in this repository; correctness is judged by
whether `pdflatex` compiles cleanly (no `Overfull \hbox` / `Underfull \hbox` /
`Warning` lines) and produces the expected page count.

## Architecture

### Role file structure

Every file under `roles/` is a fully standalone LaTeX document (its own
`\documentclass` ... `\end{document}`) built around a fixed template: header
block (troop name, role title, subtitle tag, colored rule) → two-column body
(Role Overview / Responsibilities / Training Requirements on the left,
Expectations / Time Commitment / Key Contacts on the right) → full-width
Notes & Resources → footer. `roles/committee/committee_role_template.tex` is
the annotated starting point for new roles — its placeholder text (`[Role]`,
`X hrs/month`, etc.) shows what belongs in each section.

### How the combined guide is assembled

`build_guide.sh` does not `\input` the role files. It greps each file's
content out from between its own `\begin{document}`/`\end{document}`,
rewrites its internal `\section{...}` headings to `\section*{...}` (so the
guide's table of contents lists only role names — not "Role Overview" /
"Responsibilities" / etc. repeated from every page), and concatenates
everything after a shared preamble/title page/introduction/TOC. Adding a role
to the guide means adding one `path:Display Name` line to the
`COMMITTEE_ROLES` or `PROGRAM_ROLES` array near the top of the script — it
doesn't need any other changes. `pdflatex` needs 3 passes for the TOC and
hyperref's page references to stabilize; the script always runs exactly 3.

The Committee Chair page is wrapped in `\begingroup\small ... \endgroup` in
`append_role()` because it carries more content than the other roles and
needs the denser type to still fit one page at the guide's shared 11pt base.

### Three role categories (Part I: Troop Committee)

Per a real, previously-contested troop governance decision: Committee Chair,
Treasurer, Secretary, and Advancement Coordinator must be filled by registered
committee members ("Required Position" in the header subtitle). All other
Part I roles (Outdoor/Activities Chair, Fundraising Chair, Camp Card
Coordinator, Popcorn Kernel, Summer Camp Coordinator, Quartermaster,
Training Coordinator) are "Functional Role" —
a registered committee member is preferred, but program leadership may fill
them if needed. This is stated in both the header subtitle and the Notes &
Resources paragraph of each role file. Preserve it when editing those roles,
and set it explicitly on any new committee-side role (the template has a
`[Required Position / Functional Role]` placeholder for this).

A third category, "Chartering Organization Appointee," covers the Chartered
Organization Representative (COR) — appointed directly by King Moravian
Church, not elected or hired by the committee, and not subject to committee
term limits. It gets its own `CHARTERING_ROLES` array and TOC section in
`build_guide.sh`, listed first in Part I since the COR holds final authority
over the unit. Don't fold the COR into Required/Functional — it's a
genuinely different kind of role (see `roles/committee/committee_cor.tex`'s
Notes & Resources for why).

### Program side (Part II)

Scoutmaster, Assistant Scoutmaster, and Health Officer use "Unit Leadership"
as their header subtitle instead of "Troop Committee" — they are not
committee positions. Part II mirrors Part I's Required/Functional grouping
with different terminology: Scoutmaster and Assistant Scoutmaster are
"Registered Position" (actual BSA-registered position types), while Health
Officer is "Functional Role" (a specialized duty assigned within an existing
ASM registration, not its own registration type). Health Officer's Notes &
Resources says it's typically filled by an ASM — don't promote it to
Scoutmaster-level responsibility if you edit it.

## Content conventions

These were arrived at deliberately; don't regress them without being asked to:

- No em dashes, en dashes, or double-hyphen ranges anywhere (it reads as an
  AI tell) — use a single hyphen for ranges ("3-4 hrs/month") and
  `\textbullet{}`, commas, or parentheses for asides.
- Verified BSA facts currently reflected in these docs (earlier drafts had
  fabricated or outdated versions of several of these — don't reintroduce
  them):
  - The generic required training is "Scouts BSA - Troop Committee
    Position-Specific Training (my.scouting.org)". The Committee Chair has
    its own distinct "Scouts BSA - Troop Committee Chair - Position Specific
    Training". There is no "Introduction to Committee Concepts (ICC)"
    course, and there's no separate "Treasurer training" or "Advancement
    Chair training" — those were fabricated and have been replaced.
  - Scoutmaster/ASM required trainings: SYT, Scoutmaster/Assistant
    Scoutmaster Leader Specific Training, Introduction to Outdoor Leader
    Skills (IOLS), Hazardous Weather Training. The old Scoutmaster Handbook
    has been replaced by the Troop Leader Guidebook (Volumes 1 & 2).
  - BSA Tour and Activity Plans were discontinued in 2017 — don't reference
    them; the Outdoor/Activities Chair doc instead references Guide to Safe
    Scouting and council approvals generically.
  - The Troop Scribe (a youth position), not the Treasurer, collects dues
    and forms at troop meetings alongside patrol leaders; the Treasurer
    trains and oversees the Scribe. The Secretary, not the
    Outdoor/Activities Chair, owns the troop's shared calendar.
  - Courts of Honor require the Field Uniform (not "Class A").
- Communication/response-time expectations are intentionally generic ("Be
  familiar with and follow Troop 413 Policies & Procedures") rather than
  specific SLAs (e.g. no "respond within 24 hours") — that level of detail
  belongs in a not-yet-written Troop 413 Policies & Procedures document, not
  in these role docs.
- Every role doc should fit on one page; the Treasurer is the one approved
  exception (2 pages, given its actual scope).

## LaTeX gotchas encountered while building this

- Table/list cells with `p{...}` columns are fully justified by default and
  can produce ugly stretched spacing or bad word wraps at narrow widths —
  apply `\raggedright` inside minipages, and
  `>{\raggedright\arraybackslash}p{...}` on table columns holding short,
  variable-length text.
- An unbreakable token sitting where a line needs to wrap (a bare URL like
  `my.scouting.org.`, or a slash-joined pair like `bank/account`) causes an
  `Overfull \hbox` — reword to avoid it rather than forcing a break.
- This environment's default shell is zsh, and zsh's builtin `echo`
  interprets backslash escapes (`\n`, `\e`, ...) unlike bash's — `echo
  '\newpage'` under zsh can silently corrupt into a literal ESC character
  and break the document. `build_guide.sh` avoids this by using `printf
  '%s\n'` and quoted heredocs (`<<'EOF'`) instead of `echo` for any string
  containing a backslash; keep doing that if you touch the script.
