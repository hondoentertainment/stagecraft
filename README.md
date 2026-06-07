# Stagecraft

Professional playwright script formatter. Paste a raw script and get industry-standard layout — character cues, dialogue indents, stage directions, act/scene headings, pagination, and a title page.

## Features

- **Smart parsing** — Characters, dialogue, parentheticals, stage directions, transitions, lyrics, V.O./O.S./CONT'D modifiers
- **Live preview** — Paginated output with page numbers and Courier typography
- **Title page** — Configurable title, subtitle, author, contact, and synopsis
- **Format presets** — US stage, UK stage, one-act, and musical templates
- **Type overrides** — Correct parser mistakes from the structure outline
- **Import** — `.txt`, `.docx`, `.fountain`, `.fdx`, `.md` with Fountain-aware parsing
- **Export** — `.txt`, `.docx`, `.pdf`, `.fountain`, `.fdx`, submission ZIP, print/PDF
- **Reports** — Cast list, scene breakdown, page count, runtime estimate
- **Projects** — Save/load scripts with autosave to local storage
- **Keyboard shortcuts** — `Ctrl+S` save project, `Ctrl+P` print

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
| Stage direction | `Marcus exits.` |
| Song | `SONG: "Title"` then `~lyric line` |
| Transition | `FADE OUT.` |

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview production build
npm run test      # Run test suite
npm run lint      # ESLint
```

## Submission Package

Use **Export → Submission ZIP** to download a package containing:

- Formatted script (PDF + plain text)
- Cast of characters
- Scene breakdown
- Synopsis (if provided in Settings)
