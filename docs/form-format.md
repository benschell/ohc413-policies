# Form Format

Unit forms (photo release, permission slips, reimbursement requests, etc.) use
`type: form`. One markdown source produces **one PDF per unit**, and every PDF is
both a **fillable AcroForm** (typeable in any PDF reader) and a clean **print-and-sign**
handout — the fields are real form widgets drawn with an underline border.

## Frontmatter Fields

```yaml
---
type: form
title: Photo Release Form
units:
  - name: Pack 413
    email: pack-leadership@ohc413.org
    vars:
      presence: A parent or legal guardian must remain on site for the entire visit.
  - name: Troop 413
    email: troop-leadership@ohc413.org
    vars:
      presence: A parent or legal guardian is welcome to stay but is not required to.
address: 228 W Dalton Street, King, NC 27021
revision: 2026-07-26
fields:
  - heading: Please print clearly
  - label: Scout's Name
    width: 0.62
  - label: "{{subunit}}"
    width: 0.34
  - heading: Signature
  - label: Parent / Guardian Signature
    width: 0.62
    type: signature
  - label: Date
    width: 0.34
    type: date
---
```

| Field | Required | Description |
|---|---|---|
| `type` | yes | `form` |
| `title` | yes | Form name — sets the page title, footer, and output filename |
| `units` | yes | One entry per unit to generate. A plain string (`- Pack 413`) or an object with `name` plus optional `email` / `legal_name` / `vars` overrides |
| `address` | no | Mailing address printed under the unit name |
| `email` | no | Default contact email; a unit's own `email` wins |
| `revision` | no | Revision date (YYYY-MM-DD), printed in the footer |
| `title_size` | no | Title point size. Defaults to 20, dropping to 16 for titles over 44 characters so they still set on one line |
| `fields` | no | The fill-in block (see below) |

### Field entries

Each entry is either a **heading** (starts a new group) or a **field**:

| Key | Default | Description |
|---|---|---|
| `heading` | — | Group heading, uppercased. Forces a row break |
| `label` | — | Printed label, followed by a colon |
| `width` | `1.0` | Fraction of the text width this field occupies |
| `type` | `text` | `text`, `date`, `signature` (taller box), or `checkbox` |
| `height` | `14pt` | Box height — raise it for write-in answers |
| `stacked` | `false` | Put the label on its own line above a full-width box. Use for long labels, where an inline field would leave nowhere to write |
| `name` | slug of label | AcroForm field name, for scripted filling or data extraction |
| `break` | `false` | Force this field onto a new row |

Fields **flow left to right and wrap** when the running width would exceed 1.0 — so
`0.62` + `0.34` share a row, and the next field starts a new one. Leave ~0.04 of
slack per row for the gap between fields.

A **group** (a heading and the fields under it) is boxed, so a page break can never
separate a heading from its fields or split a row.

## Body

The body is normal markdown — usually the release or agreement language. These
placeholders are substituted per unit:

| Placeholder | Expands to |
|---|---|
| `{{unit}}` | `Pack 413` |
| `{{org}}` | `Scouting America Cub Scout Pack 413` (`legal_name` overrides) |
| `{{address}}` | The `address` frontmatter value |
| `{{email}}` | The unit's contact email |
| `{{title}}` | The form title |
| `{{subunit}}` | `Den` for a Pack, `Patrol` for a Troop |
| `{{youth}}` | `Cub Scout` for a Pack, `Scout` for a Troop |
| *any* `vars` key | Whatever that unit's `vars` block defines — this is how one source says different things to different units |
| `{{fields:some-heading}}` | One field group, dropped in at that point. The key is the group heading, lowercased and hyphenated |
| `{{fields}}` | Every group not already placed. Optional — without it, leftovers go at the end |

Placeholders work in field labels and group headings too.

Use `{{fields:...}}` when a form needs fields *around* its body text — contact
info above the release language, signatures below it — as `visitor-waiver.md` does.
Set a `vars` key to an empty string for a unit that should say nothing.

## Unit branding

Branding comes from the unit name, not the document: a "Pack" gets the Cub Scout
header image and a blue accent bar, a "Troop" gets the Scouts BSA header and a tan
bar. The legal name is derived the same way (`Scouting America Cub Scout Pack 413`
/ `Scouting America Scouts BSA Troop 413`) and can be overridden per unit with
`legal_name`.

## Output

`docs/<dir>/pdf/<Title>_<Unit>.pdf` — e.g. `docs/forms/pdf/Photo_Release_Form_Pack_413.pdf`.
Each unit's PDF is hashed independently, so editing the source rebuilds all of them
and nothing else.

## Debugging

`KEEP_TMP=1 pnpm convert:force` leaves the generated `<name>.tmp.md` (markdown plus
the raw LaTeX the preprocessor emitted) next to the source.

The content hash covers the source and the `.tex` header — **not** the converter code.
After editing `converter.ts`, `pnpm convert` will report everything unchanged. Delete the
hashes for what you're working on (`rm docs/forms/pdf/.*.hash`) rather than reaching for
`convert:force`, which rewrites every PDF in the repo and floods `git status`.

Two LaTeX gotchas worth knowing before editing `markdown-converter/form-header.tex`:

- The whole document sits inside hyperref's `Form` environment (opened via
  `\AtBeginDocument`), which is a group. Per-document settings must be set globally
  (`\setformmeta` uses `\gdef`) or they roll back before the last page ships.
- Field underlines are 1pt annotation borders. They can vanish in low-DPI raster
  previews — check at 300 dpi before concluding a field is missing.
