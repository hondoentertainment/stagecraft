# Stagecraft

Professional playwright script formatter. Paste a raw script and get industry-standard layout — character cues, dialogue indents, stage directions, act/scene headings, pagination, and a title page.

**Production:** [stagecraft-kappa.vercel.app](https://stagecraft-kappa.vercel.app)  
**Repository:** [github.com/hondoentertainment/stagecraft](https://github.com/hondoentertainment/stagecraft)

## Demo

1. Open the production URL — sample script loads with Dramatists Guild formatting.
2. Paste or upload `.txt`, `.docx`, `.fountain`, `.fdx`, or `.md`.
3. Use **Export** for PDF, DOCX, Fountain, FDX, or a submission ZIP.
4. Click **Outline** warnings to jump to lines that need fixes.

## Features

- **Smart parsing** — Characters, dialogue, parentheticals, stage directions, transitions, lyrics, V.O./O.S./CONT'D modifiers
- **Live preview** — Paginated output with page numbers and Courier typography
- **Title page** — Configurable title, subtitle, author, contact, and synopsis
- **Dramatists Guild preset (default)** — Courier 12pt, 1.5" binding margin, parenthetical stage directions, cast page, ALL CAPS lyrics
- **Format presets** — Dramatists Guild, US stage, UK stage, one-act, and musical templates
- **Type overrides** — Correct parser mistakes from the structure outline
- **Import** — `.txt`, `.docx`, `.fountain`, `.fdx`, `.md` with Fountain-aware parsing
- **Export** — `.txt`, `.docx`, `.pdf`, `.fountain`, `.fdx`, submission ZIP, print/PDF
- **Cast page** — Rich cast metadata (age, gender, description) merged with detected characters; included in PDF, DOCX, and submission ZIP
- **Script warnings** — Inline fixes for ALL CAPS cues, orphan dialogue, long lines, and missing settings; click to jump to the line
- **Dual dialogue** — Side-by-side columns in preview, PDF, and plain-text export
- **Share links** — Copy a compressed URL hash to share script + settings with collaborators
- **Reports** — Cast list, scene breakdown, page count, runtime estimate
- **Projects** — Save/load scripts with autosave to local storage
- **PWA** — Installable app with offline caching via service worker
- **Keyboard shortcuts** — `Ctrl+S` save project, `Ctrl+P` print
- **CI** — GitHub Actions runs lint, unit tests, build, and Playwright E2E on every push

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Script Format Tips

| Element | Example |
|---------|---------|
| Character | `MARCUS` (ALL CAPS, own line) |
| Modifier | `VOICE (V.O.)` or `MARCUS (CONT'D)` |
| Dialogue | Lines following a character name |
| Parenthetical | `(looking up)` |
| Act / Scene | `ACT 1` or `Act 1 Scene 2` |
| Stage direction | `(MARCUS exits.)` — parenthetical, 1.5" indent |
| Song | `SONG: "Title"` then `~lyric line` |
| Transition | `FADE OUT.` |

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview production build
npm run test      # Unit tests (Vitest)
npm run test:e2e  # End-to-end tests (Playwright)
npm run lint      # ESLint
```

## Submission Package

Use **Export → Submission ZIP** to download a package containing:

- Formatted script (PDF + plain text)
- Cast of characters
- Scene breakdown
- Synopsis (if provided in Settings)
