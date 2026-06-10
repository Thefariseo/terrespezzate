# Le Terre Spezzate Ascension

Versione React/Vite estesa di Le Terre Spezzate, pronta per Vercel e costruita come web app dinamica con endpoint serverless.

Le meccaniche del gioco restano quelle della versione completa: tabellone da 36 caselle, 4 regioni, boss gate, dado, nemici, élite, mercanti, tesori, eventi, combattimento a turni, parata, fiaschette, morte con perdita rune, respawn alla grazia, nemici che ricompaiono, livelli in Vigore e Forza, boss music e progressione finale.

## Cosa include

- React/Vite con componenti reali, non un singolo HTML statico.
- API dinamica Vercel in `/api/health`.
- Canvas battle stage con sprite pixel, particelle, aura boss e fendenti.
- Sequencer chiptune WebAudio con tema diverso per ogni boss.
- HUD desktop, boss codex, run log, toast, fullscreen e autosave locale.
- Layout responsive con modalità ridotta per mobile.

## Locale

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy Vercel

- Framework: Vite
- Build command: `npm run build`
- Output: `dist`
- API: `/api/health`
