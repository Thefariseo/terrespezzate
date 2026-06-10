import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const REGIONS = [
  'Sepolcreto dei Primi',
  'Palude del Vespro',
  'Altopiano Cinereo',
  'Cittadella del Crepuscolo'
];

const PATTERN = ['grace', 'enemy', 'event', 'enemy', 'treasure', 'shop', 'elite', 'event', 'boss'];
const ICONS = { grace: '❋', enemy: '⚔', event: '?', treasure: '✦', shop: '⚖', elite: '☠', boss: '♛' };

const ENEMIES = [
  [{ n: 'Soldato Errante', hp: 11, atk: 2, r: [25, 40] }, { n: 'Segugio di Tomba', hp: 9, atk: 3, r: [25, 40] }],
  [{ n: 'Spettro di Fango', hp: 16, atk: 3, r: [45, 70] }, { n: 'Strega di Palude', hp: 14, atk: 4, r: [45, 70] }],
  [{ n: 'Cavaliere di Brace', hp: 22, atk: 5, r: [75, 110] }, { n: 'Arciere di Cenere', hp: 19, atk: 6, r: [75, 110] }],
  [{ n: 'Guardia Crepuscolare', hp: 28, atk: 7, r: [120, 170] }, { n: 'Accolito del Vuoto', hp: 25, atk: 8, r: [120, 170] }]
];

const ELITES = [
  { n: 'Campione Caduto', hp: 20, atk: 3, r: [90, 120] },
  { n: 'Divoratore della Melma', hp: 28, atk: 5, r: [150, 190] },
  { n: 'Golem di Scorie', hp: 38, atk: 7, r: [220, 280] },
  { n: 'Araldo della Fine', hp: 50, atk: 9, r: [320, 400] }
];

const BOSSES = [
  { n: 'Sentinella Spezzata', sub: 'Custode del Sepolcreto', hp: 34, atk: 4, r: [160, 160], song: 'Veglia della Sentinella', bpm: 84, scale: 'A minore' },
  { n: 'Madre della Palude', sub: 'Colei che annega i nomi', hp: 50, atk: 6, r: [300, 300], song: 'Ninnananna della Palude', bpm: 96, scale: 'D locrio' },
  { n: 'Cavaliere della Cenere', sub: 'Ultimo stendardo dell Altopiano', hp: 68, atk: 8, r: [480, 480], song: 'Galoppo nella Cenere', bpm: 148, scale: 'E frigio' },
  { n: 'Sovrano Senza Nome', sub: 'Signore delle Terre Spezzate', hp: 95, atk: 10, r: [1000, 1000], song: 'Corona del Senza Nome', bpm: 156, scale: 'A minore armonica' }
];

const SAVE_KEY = 'terre-spezzate-ascension-v3';
const d6 = () => 1 + Math.floor(Math.random() * 6);
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const deepClone = value => JSON.parse(JSON.stringify(value));

function makeTiles() {
  return Array.from({ length: 36 }, (_, idx) => ({
    idx,
    region: Math.floor(idx / 9),
    type: PATTERN[idx % 9],
    cleared: idx === 0
  }));
}

function makePlayer() {
  return {
    pos: 0,
    hp: 30,
    maxhp: 30,
    atk: 3,
    flasks: 3,
    maxflasks: 3,
    runes: 0,
    level: 1,
    checkpoint: 0,
    deaths: 0,
    flaskBonus: 0
  };
}

function useChiptune() {
  const ctxRef = useRef(null);
  const timerRef = useRef(null);
  const enabledRef = useRef(true);

  const ensure = () => {
    if (!ctxRef.current) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      ctxRef.current = new AudioCtor();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  };

  const tone = (freq, dur = 0.12, type = 'square', vol = 0.05) => {
    if (!enabledRef.current) return;
    const ctx = ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.03);
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  return {
    toggle: () => {
      enabledRef.current = !enabledRef.current;
      if (!enabledRef.current) stop();
      return enabledRef.current;
    },
    hit: () => {
      tone(135, 0.12, 'sawtooth', 0.08);
      tone(70, 0.16, 'square', 0.04);
    },
    parry: () => [880, 1320].forEach((f, i) => setTimeout(() => tone(f, 0.09, 'square', 0.07), i * 60)),
    rune: () => [1040, 1560].forEach((f, i) => setTimeout(() => tone(f, 0.07, 'square', 0.05), i * 50)),
    grace: () => [392, 523, 659].forEach((f, i) => setTimeout(() => tone(f, 0.35, 'triangle', 0.05), i * 70)),
    stop,
    music: region => {
      if (!enabledRef.current || region == null) return;
      stop();
      let step = 0;
      const base = [220, 146, 164, 220][region];
      const patterns = [[0, 7, 3, 5], [0, 6, 1, 3], [0, 3, 7, 12], [0, 3, 7, 11]];
      const bpm = BOSSES[region].bpm;
      timerRef.current = setInterval(() => {
        const note = base * Math.pow(2, patterns[region][step % 4] / 12);
        tone(note, 0.12, 'square', 0.035);
        if (step % 2 === 0) tone(base / 2, 0.18, 'triangle', 0.028);
        step += 1;
      }, 60000 / bpm / 2);
    }
  };
}

function BattleCanvas({ combat, pulse }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let tick = 0;
    let particles = [];

    function burst(x, y, color, count = 12) {
      for (let i = 0; i < count; i += 1) {
        particles.push({
          x,
          y,
          color,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 3,
          life: 1
        });
      }
    }

    function sprite(x, y, big, color, flip) {
      ctx.save();
      ctx.translate(x, y);
      if (flip) ctx.scale(-1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(-14, -52, 28, 20);
      ctx.fillRect(-20, -32, 40, 34);
      ctx.fillStyle = '#d8cab0';
      ctx.fillRect(-9, -47, 18, 10);
      ctx.fillStyle = '#15100b';
      ctx.fillRect(-5, -43, 3, 3);
      ctx.fillRect(5, -43, 3, 3);
      ctx.fillStyle = '#e9ddc1';
      ctx.fillRect(22, -38, 5, 58);
      if (big) {
        ctx.strokeStyle = '#e7c15a88';
        ctx.lineWidth = 2;
        ctx.strokeRect(-28, -62, 56, 72);
      }
      ctx.restore();
    }

    function draw() {
      tick += 1;
      const region = combat?.tile.region || 0;
      const backgrounds = [
        ['#101827', '#26384f'],
        ['#07150d', '#28492f'],
        ['#1d0c07', '#5b2814'],
        ['#12091f', '#38245c']
      ];
      const bg = backgrounds[region];
      const grad = ctx.createLinearGradient(0, 0, 0, 220);
      grad.addColorStop(0, bg[0]);
      grad.addColorStop(1, bg[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 520, 220);
      ctx.fillStyle = '#0b0805';
      ctx.fillRect(0, 176, 520, 44);

      for (let i = 0; i < 38; i += 1) {
        ctx.fillStyle = i % 3 ? '#e7c15a44' : '#ffffff22';
        ctx.fillRect((i * 41 + tick * (region + 1)) % 520, 30 + ((i * 19) % 125), 2, 2);
      }

      sprite(120 + Math.sin(tick / 15) * 3, 158, false, '#8d7b51', false);
      sprite(
        395 + Math.sin(tick / 17) * 3,
        158,
        combat?.isBoss,
        combat?.isBoss ? '#8d79c9' : combat?.isElite ? '#c58a4b' : '#9ca8bd',
        true
      );

      if (combat?.charging) {
        ctx.strokeStyle = `rgba(255,72,54,${0.45 + 0.25 * Math.sin(tick / 5)})`;
        ctx.lineWidth = 5;
        ctx.strokeRect(350, 86, 90, 78);
      }

      if (pulse) burst(pulse.x, pulse.y, pulse.color, pulse.count);
      particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.life -= 0.025;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
        ctx.globalAlpha = 1;
        return p.life > 0;
      });

      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(raf);
  }, [combat, pulse]);

  return <canvas ref={canvasRef} width="520" height="220" className="battle" />;
}

function Meter({ label, value, max, gold = false }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="meter">
      <div>
        <span>{label}</span>
        <b>{Math.max(0, value)} / {max}</b>
      </div>
      <em><i className={gold ? 'gold' : ''} style={{ width: `${pct}%` }} /></em>
    </div>
  );
}

function Overlay({ active, onClose, children }) {
  return (
    <div className={active ? 'overlay open' : 'overlay'}>
      <div className="modal">
        <button className="x" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
}

function App() {
  const audio = useChiptune();
  const [tiles, setTiles] = useState(makeTiles);
  const [player, setPlayer] = useState(makePlayer);
  const [combat, setCombat] = useState(null);
  const [drop, setDrop] = useState(null);
  const [dropAmount, setDropAmount] = useState(0);
  const [log, setLog] = useState(['Il viaggio comincia nel Sepolcreto dei Primi.']);
  const [action, setAction] = useState({ title: 'Il sentiero', text: 'Tira il dado per avanzare.', buttons: ['roll'] });
  const [overlay, setOverlay] = useState(null);
  const [pulse, setPulse] = useState(null);
  const [toast, setToast] = useState('');
  const [soundOn, setSoundOn] = useState(true);

  const region = tiles[player.pos]?.region || 0;
  const defeatedBosses = tiles.filter(t => t.type === 'boss' && t.cleared).length;

  const pushLog = message => setLog(old => [message, ...old].slice(0, 60));
  const notify = message => {
    setToast(message);
    setTimeout(() => setToast(''), 2200);
  };

  useEffect(() => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      if (saved.tiles && saved.player) {
        setTiles(saved.tiles);
        setPlayer(saved.player);
        setDrop(saved.drop ?? null);
        setDropAmount(saved.dropAmount ?? 0);
        setLog(saved.log || ['Autosave caricato.']);
      }
    } catch (error) {
      console.warn('Autosave ignorato:', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ tiles, player, drop, dropAmount, log }));
  }, [tiles, player, drop, dropAmount, log]);

  function mutateTile(idx, fn) {
    setTiles(old => old.map(tile => (tile.idx === idx ? fn({ ...tile }) : tile)));
  }

  function restAtGrace(idx = player.pos) {
    setPlayer(old => ({ ...old, hp: old.maxhp, flasks: old.maxflasks, checkpoint: idx }));
    setTiles(old => old.map(tile => {
      if (tile.type === 'enemy' || tile.type === 'elite') return { ...tile, cleared: false };
      if (tile.idx === idx) return { ...tile, cleared: true };
      return tile;
    }));
    audio.grace();
    pushLog('Riposi alla grazia: cure complete, fiaschette ricaricate, nemici ridestati.');
  }

  function passTile(idx) {
    const tile = tiles[idx];
    if (!tile) return;
    if (drop === idx) {
      setPlayer(old => ({ ...old, runes: old.runes + dropAmount }));
      notify(`Rune recuperate: ${dropAmount}`);
      audio.rune();
      setDrop(null);
      setDropAmount(0);
    }
    if (tile.type === 'grace') restAtGrace(idx);
  }

  async function rollMove() {
    let roll = d6();
    let target = Math.min(35, player.pos + roll);
    for (let i = player.pos + 1; i <= target; i += 1) {
      if ((tiles[i].type === 'boss' || tiles[i].type === 'grace') && !tiles[i].cleared) {
        target = i;
        break;
      }
    }

    for (let i = player.pos + 1; i <= target; i += 1) {
      setPlayer(old => ({ ...old, pos: i }));
      passTile(i);
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    arriveAt(target, roll);
  }

  function arriveAt(idx, roll) {
    const tile = tiles[idx];
    if (!tile) return;

    if (tile.cleared && tile.type !== 'grace' && tile.type !== 'shop') {
      setAction({ title: 'Luogo quieto', text: `Hai tirato ${roll}. Qui resta solo cenere.`, buttons: ['roll'] });
      return;
    }

    if (tile.type === 'grace') {
      restAtGrace(idx);
      setOverlay('grace');
      return;
    }

    if (tile.type === 'shop') {
      setOverlay('shop');
      return;
    }

    if (tile.type === 'treasure') {
      const found = rnd(30, 80) + tile.region * 15;
      mutateTile(idx, old => ({ ...old, cleared: true }));
      setPlayer(old => ({ ...old, runes: old.runes + found }));
      audio.rune();
      pushLog(`Tesoro: ${found} rune.`);
      setAction({ title: 'Tesoro', text: `Trovi ${found} rune.`, buttons: ['roll'] });
      return;
    }

    if (tile.type === 'event') {
      runEvent(idx);
      return;
    }

    if (tile.type === 'elite') {
      startCombat(deepClone(ELITES[tile.region]), tile, false, true);
      return;
    }

    if (tile.type === 'boss') {
      startCombat(deepClone(BOSSES[tile.region]), tile, true, false);
      return;
    }

    startCombat(deepClone(ENEMIES[tile.region][Math.floor(Math.random() * 2)]), tile, false, false);
  }

  function runEvent(idx) {
    const tile = tiles[idx];
    const roll = d6();
    mutateTile(idx, old => ({ ...old, cleared: true }));

    if (roll <= 2) {
      const damage = rnd(4, 9) + tile.region * 2;
      setPlayer(old => ({ ...old, hp: Math.max(1, old.hp - damage) }));
      pushLog(`Trappola: perdi ${damage} PV.`);
    } else if (roll <= 4) {
      const found = rnd(25, 55) + tile.region * 10;
      setPlayer(old => ({ ...old, runes: old.runes + found }));
      pushLog(`Evento: trovi ${found} rune.`);
    } else {
      pushLog('Imboscata dalle rovine.');
      startCombat(deepClone(ENEMIES[tile.region][Math.floor(Math.random() * 2)]), tile, false, false);
      return;
    }

    setAction({ title: 'Evento', text: 'La terra decide di essere ostile. Che sorpresa.', buttons: ['roll'] });
  }

  function startCombat(enemy, tile, isBoss, isElite) {
    setCombat({ enemy: { ...enemy, maxhp: enemy.hp }, tile, isBoss, isElite, turn: 0, charging: false });
    setAction({ title: 'Scontro in corso', text: `${enemy.n} ti sbarra la strada.`, buttons: [] });
    if (isBoss) audio.music(tile.region);
    else audio.stop();
  }

  function winCombat(nextCombat) {
    const reward = rnd(nextCombat.enemy.r[0], nextCombat.enemy.r[1]);
    const final = nextCombat.tile.idx === 35;
    setPlayer(old => ({ ...old, runes: old.runes + reward }));
    mutateTile(nextCombat.tile.idx, old => ({ ...old, cleared: true }));
    pushLog(`${nextCombat.enemy.n} cade. Ottieni ${reward} rune.`);
    audio.rune();
    audio.stop();
    setCombat(null);
    if (final) setOverlay('victory');
    else setAction({ title: nextCombat.isBoss ? 'Boss sconfitto' : 'Vittoria', text: 'Il sentiero torna silenzioso.', buttons: ['roll'] });
  }

  function enemyTurn(nextCombat) {
    let damage = d6() + nextCombat.enemy.atk;
    let updated = { ...nextCombat };
    if (updated.charging) {
      damage = Math.round(damage * 1.6);
      updated.charging = false;
    }

    const newHp = player.hp - damage;
    setPlayer(old => ({ ...old, hp: newHp }));
    setPulse({ x: 120, y: 120, color: '#b84a3b', count: 16, t: Date.now() });
    audio.hit();

    if (updated.isBoss && updated.turn % 3 === 2) updated.charging = true;
    updated.turn += 1;

    if (newHp <= 0) {
      die();
      return null;
    }
    return updated;
  }

  function attack() {
    if (!combat) return;
    let next = deepClone(combat);
    const damage = d6() + player.atk;
    next.enemy.hp -= damage;
    setPulse({ x: 392, y: 122, color: '#ecc857', count: 18, t: Date.now() });
    audio.hit();
    if (next.enemy.hp <= 0) {
      winCombat(next);
      return;
    }
    next = enemyTurn(next);
    if (next) setCombat(next);
  }

  function parry() {
    if (!combat) return;
    let next = deepClone(combat);
    const roll = d6();
    if (roll >= 3) {
      const damage = Math.ceil((d6() + player.atk) / 2);
      next.enemy.hp -= damage;
      next.charging = false;
      setPulse({ x: 275, y: 116, color: '#f8df8a', count: 24, t: Date.now() });
      audio.parry();
      if (next.enemy.hp <= 0) {
        winCombat(next);
        return;
      }
    } else {
      next = enemyTurn(next);
      if (!next) return;
    }
    setCombat(next);
  }

  function drinkFlask() {
    if (!combat || player.flasks <= 0) return;
    const heal = Math.max(18, Math.round(player.maxhp * 0.4)) + player.flaskBonus;
    setPlayer(old => ({ ...old, flasks: old.flasks - 1, hp: Math.min(old.maxhp, old.hp + heal) }));
    setPulse({ x: 120, y: 120, color: '#88b66b', count: 22, t: Date.now() });
    const next = enemyTurn(deepClone(combat));
    if (next) setCombat(next);
  }

  function flee() {
    if (!combat || combat.isBoss || combat.isElite) return;
    if (d6() >= 5) {
      setCombat(null);
      audio.stop();
      setPlayer(old => ({ ...old, pos: Math.max(0, old.pos - 1) }));
      setAction({ title: 'Fuga', text: 'Arretri di una casella. Non eroico, ma vivo.', buttons: ['roll'] });
      return;
    }
    const next = enemyTurn(deepClone(combat));
    if (next) setCombat(next);
  }

  function die() {
    audio.stop();
    const lost = player.runes;
    setDropAmount(lost);
    setDrop(lost ? player.pos : null);
    setCombat(null);
    setPlayer(old => ({ ...old, deaths: old.deaths + 1, runes: 0, pos: old.checkpoint, hp: old.maxhp, flasks: old.maxflasks }));
    setTiles(old => old.map(tile => (tile.type === 'enemy' || tile.type === 'elite') ? { ...tile, cleared: false } : tile));
    setOverlay('death');
    pushLog(`Sei morto. ${lost} rune restano sulla casella ${player.pos + 1}.`);
  }

  function level(kind) {
    const cost = 50 + (player.level - 1) * 35;
    if (player.runes < cost) return;
    if (kind === 'vig') {
      setPlayer(old => ({ ...old, runes: old.runes - cost, level: old.level + 1, maxhp: old.maxhp + 10, hp: old.maxhp + 10 }));
    } else {
      setPlayer(old => ({ ...old, runes: old.runes - cost, level: old.level + 1, atk: old.atk + 1 }));
    }
  }

  function buy(id) {
    const base = { flask: 90, sharp: 120, heart: 100 }[id];
    const cost = Math.floor(base * (1 + region * 0.35));
    if (player.runes < cost) return;
    if (id === 'flask') setPlayer(old => ({ ...old, runes: old.runes - cost, maxflasks: old.maxflasks + 1, flasks: old.maxflasks + 1 }));
    if (id === 'sharp') setPlayer(old => ({ ...old, runes: old.runes - cost, atk: old.atk + 1 }));
    if (id === 'heart') setPlayer(old => ({ ...old, runes: old.runes - cost, maxhp: old.maxhp + 10, hp: old.hp + 10 }));
  }

  function reset() {
    localStorage.removeItem(SAVE_KEY);
    setTiles(makeTiles());
    setPlayer(makePlayer());
    setCombat(null);
    setDrop(null);
    setDropAmount(0);
    setLog(['Nuovo viaggio iniziato.']);
    setOverlay(null);
    setAction({ title: 'Il sentiero', text: 'Tira il dado per avanzare.', buttons: ['roll'] });
  }

  useEffect(() => {
    const handler = event => {
      const key = event.key.toLowerCase();
      if (combat) {
        if (key === 'a') attack();
        if (key === 'p') parry();
        if (key === 'f') drinkFlask();
        if (key === 's') flee();
      } else if (event.key === ' ' || event.key === 'Enter') {
        if (action.buttons.includes('roll')) {
          event.preventDefault();
          rollMove();
        }
      }
      if (event.key === 'Escape') setOverlay(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [combat, player, action, tiles, drop, dropAmount]);

  const board = useMemo(() => REGIONS.map((regionName, regionIdx) => (
    <div className="region" key={regionName}>
      <div className={regionIdx === region ? 'rlabel active' : 'rlabel'}>
        <b>{regionIdx + 1}. {regionName}</b>
        <small>♛ {BOSSES[regionIdx].n}</small>
      </div>
      <div className="row">
        {Array.from({ length: 9 }, (_, col) => {
          const idx = regionIdx * 9 + (regionIdx % 2 ? 8 - col : col);
          const tile = tiles[idx];
          return (
            <div key={idx} className={`tile ${tile.type} ${tile.cleared ? 'cleared' : ''} ${player.pos === idx ? 'current' : ''} ${drop === idx ? 'drop' : ''}`} title={`Casella ${idx + 1}`}>
              <small>{idx + 1}</small>
              {ICONS[tile.type]}
              {player.pos === idx && <i>●</i>}
            </div>
          );
        })}
      </div>
    </div>
  )), [tiles, player.pos, drop, region]);

  return (
    <main>
      <header className="top">
        <div>
          <span>Ascension 3.0 · React/Vite</span>
          <h1>Le Terre Spezzate</h1>
        </div>
        <nav>
          <button onClick={() => document.documentElement.requestFullscreen?.()}>Fullscreen</button>
          <button onClick={() => setOverlay('codex')}>Boss Codex</button>
          <button onClick={() => setSoundOn(audio.toggle())}>{soundOn ? 'Audio ♪' : 'Audio ×'}</button>
          <button onClick={reset}>Nuova run</button>
        </nav>
      </header>

      <section className="layout">
        <section>
          <div className="board">{board}</div>
          <div className="panel">
            <h2>{action.title}</h2>
            <p>{action.text}</p>
            <div className="buttons">
              {action.buttons.includes('roll') && <button onClick={rollMove}>Tira il dado</button>}
              {action.buttons.includes('grace') && <button onClick={() => setOverlay('grace')}>Medita</button>}
            </div>
          </div>
        </section>

        <aside>
          <div className="card hero">
            <div className="portrait">♞</div>
            <div>
              <h3>Senza Fiamma</h3>
              <p>Livello {player.level}</p>
            </div>
          </div>
          <Meter label="PV" value={player.hp} max={player.maxhp} />
          <div className="stats">
            <b>ATK {player.atk}+d6</b>
            <b>Rune {player.runes}</b>
            <b>Fiaschette {player.flasks}/{player.maxflasks}</b>
          </div>
          <div className="flasks">
            {Array.from({ length: player.maxflasks }, (_, i) => <span key={i} className={i < player.flasks ? 'on' : ''} />)}
          </div>
          <button disabled={player.flasks < 1 || player.hp >= player.maxhp || Boolean(combat)} onClick={() => setPlayer(old => ({ ...old, flasks: old.flasks - 1, hp: Math.min(old.maxhp, old.hp + Math.round(old.maxhp * 0.4)) }))}>
            Bevi fiaschetta
          </button>
          <div className="card">
            <h3>Progresso</h3>
            <Meter label="Boss" value={defeatedBosses} max={4} gold />
            <p>{BOSSES[region].song} · {BOSSES[region].bpm} BPM</p>
          </div>
          <div className="card log">
            <h3>Registro della run</h3>
            {log.map((entry, i) => <p key={`${entry}-${i}`}>{entry}</p>)}
          </div>
        </aside>
      </section>

      {combat && (
        <div className="overlay open">
          <div className="modal">
            <h2>{combat.isBoss ? 'Duello col Boss' : combat.isElite ? 'Nemico Élite' : 'Scontro'}: {combat.enemy.n}</h2>
            <p>{combat.enemy.sub || 'Le lame si incrociano nella polvere.'}</p>
            <BattleCanvas combat={combat} pulse={pulse} />
            <div className="duo">
              <Meter label="Senza Fiamma" value={player.hp} max={player.maxhp} />
              <Meter label={combat.enemy.n} value={combat.enemy.hp} max={combat.enemy.maxhp} />
            </div>
            {combat.charging && <div className="warn">⚠ Colpo devastante in arrivo: para!</div>}
            <div className="buttons">
              <button onClick={attack}>Attacca A</button>
              <button onClick={parry}>Para P</button>
              <button onClick={drinkFlask} disabled={player.flasks < 1}>Fiaschetta F</button>
              {!combat.isBoss && !combat.isElite && <button onClick={flee}>Fuggi S</button>}
            </div>
            <p className="song">{combat.isBoss ? `♪ ${BOSSES[combat.tile.region].song}` : ''}</p>
          </div>
        </div>
      )}

      <Overlay active={overlay === 'grace'} onClose={() => setOverlay(null)}>
        <h2>❋ Sito di Grazia</h2>
        <p>Cure complete. Costo livello: {50 + (player.level - 1) * 35} rune.</p>
        <div className="buttons">
          <button onClick={() => level('vig')}>Vigore +10 PV</button>
          <button onClick={() => level('for')}>Forza +1 ATK</button>
        </div>
      </Overlay>

      <Overlay active={overlay === 'shop'} onClose={() => setOverlay(null)}>
        <h2>⚖ Mercante Errante</h2>
        <div className="buttons">
          <button onClick={() => buy('flask')}>Fiaschetta +1</button>
          <button onClick={() => buy('sharp')}>Attacco +1</button>
          <button onClick={() => buy('heart')}>PV max +10</button>
        </div>
      </Overlay>

      <Overlay active={overlay === 'codex'} onClose={() => setOverlay(null)}>
        <h2>Boss Codex</h2>
        {BOSSES.map((boss, i) => (
          <div className="bossrow" key={boss.n}>
            <b>{tiles[i * 9 + 8].cleared ? '✓' : '♛'} {boss.n}</b>
            <span>{REGIONS[i]} · {boss.hp} PV · {boss.atk} ATK · ♪ {boss.song} · {boss.bpm} BPM</span>
          </div>
        ))}
      </Overlay>

      <Overlay active={overlay === 'death'} onClose={() => setOverlay(null)}>
        <h2 className="death">Sei morto</h2>
        <p>{dropAmount} rune giacciono dove sei caduto.</p>
      </Overlay>

      <Overlay active={overlay === 'victory'} onClose={reset}>
        <h2 className="victory">Le Terre sono tue</h2>
        <p>Livello {player.level}, morti {player.deaths}, rune {player.runes}.</p>
      </Overlay>

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
