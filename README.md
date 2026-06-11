# Le Terre Spezzate

Un **gioco da tavolo soulslike in solitario**, giocabile direttamente nel browser. Un singolo file HTML autonomo: nessun build, nessuna dipendenza esterna oltre ai font.

Mondo originale ispirato alle meccaniche dei soulslike (Elden Ring in primis) — nomi, personaggi e luoghi sono inventati per non usare proprietà di FromSoftware/Bandai Namco.

## Come si gioca

- Tira il dado per avanzare lungo un tabellone di **36 caselle** attraverso **4 regioni**, ognuna chiusa da un boss.
- Ogni casella nasconde nemici, élite, mercanti, tesori o eventi.
- Combattimento a turni: **attacca**, **para** (3+ blocca e contrattacca), bevi una **fiaschetta** o **fuggi**.
- I boss caricano colpi devastanti: il momento giusto per parare.
- Quando muori perdi le rune dove sei caduto e risorgi all'ultima grazia; i nemici (boss esclusi) ricompaiono.
- Alle **grazie** ti curi, ricarichi le fiaschette e sali di livello scegliendo Vigore o Forza.

## Novità di questa versione

- **Quattro classi di partenza** — Vagabondo, Cavaliere Decaduto, Asceta Cinereo, Mendico — con statistiche e stili diversi.
- **Salvataggio automatico** su `localStorage`: chiudi e riprendi il viaggio con «Riprendi il viaggio».
- **Record personali** persistenti: vittorie, morti totali e miglior viaggio (in numero di tiri).
- **Pannello impostazioni** con cursori di volume separati per **musica** ed **effetti**, e interruttore animazioni.
- **Eventi ampliati**: scommesse runiche, fonti spezzate, benedizioni, eremiti che potenziano le fiaschette e altro.
- Musiche chiptune composte su misura per ogni boss, scena di battaglia in pixel art 16-bit, animazioni integrate.

## Caratteristiche tecniche

- **Singolo file** `index.html`, zero dipendenze runtime.
- Audio sintetizzato in tempo reale in **WebAudio** (SFX + sequencer musicale chiptune), nessun file audio.
- Sprite e scene di battaglia disegnati proceduralmente su **canvas**.
- Rispetta `prefers-reduced-motion` ed è completamente giocabile da tastiera.

## Comandi da tastiera

- **Spazio / Invio** — azione principale (tira il dado)
- **A** attacca · **P** para · **F** fiaschetta · **S** fuggi (in combattimento)
- **?** regole · **Esc** chiude i pannelli

## Sviluppo locale

Essendo un file statico, basta aprirlo o servirlo:

```bash
npx http-server -p 8099
# poi apri http://127.0.0.1:8099/index.html
```

## Deploy

Configurato per **Vercel** come sito statico (`vercel.json`). Ogni push sul branch collegato pubblica automaticamente.
