# Stagecraft

Professional playwright script formatter. Paste a raw script and get industry-standard layout — character cues, dialogue indents, stage directions, act/scene headings, and a title page.

## Features

- **Smart parsing** — Detects characters, dialogue, parentheticals, stage directions, transitions, and act/scene markers
- **Live preview** — See formatted output in real time with Courier-style typography
- **Title page** — Configurable title, subtitle, author, and contact info
- **Format settings** — Adjust indents, font size, act/scene numbering (Roman/Arabic/Words), and stage direction style
- **Export** — Copy to clipboard, download as `.txt` or `.docx`, or print/save as PDF
- **Structure outline** — Review how each line was classified with helpful warnings

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
| Dialogue | Lines following a character name |
| Parenthetical | `(looking up)` |
| Act / Scene | `ACT 1` or `Act 1 Scene 2` |
| Stage direction | `Marcus exits.` or `INT. KITCHEN - NIGHT` |
| Transition | `FADE OUT.` |

## Build

```bash
npm run build
npm run preview
```
