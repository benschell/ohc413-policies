# Agenda Format

Committee meeting agendas use YAML frontmatter for structured metadata and markdown for the agenda body.

## Frontmatter Fields

```yaml
---
type: agenda
unit: Pack 413 | Troop 413
date: 2026-05-06
time: 6-7PM
prior_minutes_date: 2026-03-31
next_meeting_date: 2026-06-03

roles:
  - title: Secretary
    name: Renee
  - title: Treasurer
    name: Brittany
  - title: Fundraising
    name: Homer (Acting)
  - title: Activities
    open: true

program_leadership: "Ben (CM), Cooper (ACM), Sarah (DL K-1)"

active_members:
  - Homer
  - Zach
  - Ben

inactive_members:
  - Pam

links:
  - label: Approved Calendar
    url: https://example.com/calendar
  - label: Approved Policies
    url: https://example.com/policies
---
```

| Field | Required | Description |
|---|---|---|
| `type` | yes | Document type — `agenda` for agendas, `policy` for policy docs |
| `unit` | yes | "Pack 413" or "Troop 413" |
| `date` | yes | Meeting date (YYYY-MM-DD) |
| `time` | yes | Meeting time range |
| `prior_minutes_date` | yes | Date of minutes to approve (YYYY-MM-DD) |
| `next_meeting_date` | no | Next scheduled meeting date |
| `roles` | yes | Committee role assignments; set `open: true` for vacant roles |
| `program_leadership` | yes | Free-text summary of program leaders |
| `active_members` | yes | List of active committee member first names |
| `inactive_members` | no | List of inactive members |
| `links` | no | QR codes rendered in a sidebar (label + URL) |

## Body Structure

The body uses numbered items under H2 section headers. Conventions:

- **Sections** are H2 headings (e.g., `## Administrative`)
- **Agenda items** are numbered list items, sequentially across sections
- **Owners** are appended in italics: `4. Treasurer Report - *Brittany*`
- **Sub-items** are checkboxes under the parent item: `  - [ ] Food plan`
- **Dates/details** can be inline: `6. Spring Campout - 4/10-12 - *Ben*`

Section names vary by meeting but common patterns:

- **Administrative** — approval of minutes, next meeting, scheduling
- **Committee Operations** — treasurer, policies, standing business
- **Near Term Planning / Planning** — upcoming events, fundraising, program
- **Stretch Topics** — lower-priority or time-permitting items

## Minutes Storage

Minutes are stored as PDFs in `pack/minutes/` and `troop/minutes/`, named by date:
`2026-03-31.pdf`. These are the official records from the secretary and are not reformatted.
