/* 88-key piano keyboard component (A0 = MIDI 21  to  C8 = MIDI 108) */

const NOTE_NAMES = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
const WHITE_PCS  = new Set([0, 2, 4, 5, 7, 9, 11]);
const BLACK_PCS  = new Set([1, 3, 6, 8, 10]);

const MIDI_LOW  = 21;   // A0
const MIDI_HIGH = 108;  // C8

const KEY_W  = 24;      // white key width
const KEY_H  = 130;     // white key height
const BK_W   = 14;      // black key width
const BK_H   = 82;      // black key height

function midiToNoteName(midi) {
  const octave = Math.floor(midi / 12) - 1;
  return NOTE_NAMES[midi % 12] + octave;
}

/** Uses staff accidental mode when staff.js exposes spellMidiForStaffDisplay. */
function displayNoteName(midi) {
  if (typeof window.spellMidiForStaffDisplay === 'function') {
    return window.spellMidiForStaffDisplay(midi);
  }
  return midiToNoteName(midi);
}

function isWhite(midi) { return WHITE_PCS.has(midi % 12); }

/* ── State ──────────────────────────────────────────────────────────────── */
const pianoState = {
  mode: 'range',         // 'range' | 'favorites' | 'avoids'
  rangeStart: null,
  rangeEnd: null,
  favorites: new Set(),
  avoids: new Set(),
  keys: {},              // midi -> DOM element
  _rangeClicks: 0,
};

/* ── Build keyboard ─────────────────────────────────────────────────────── */
function buildPiano() {
  const container = document.getElementById('piano');
  if (!container) return;

  let whiteIndex = 0;
  const whitePositions = {};

  for (let m = MIDI_LOW; m <= MIDI_HIGH; m++) {
    if (isWhite(m)) {
      whitePositions[m] = whiteIndex;
      whiteIndex++;
    }
  }

  const totalWidth = whiteIndex * KEY_W;
  container.style.width = totalWidth + 'px';
  container.style.height = KEY_H + 'px';

  for (let m = MIDI_LOW; m <= MIDI_HIGH; m++) {
    const el = document.createElement('div');
    el.className = 'piano-key';
    el.dataset.midi = m;
    el.dataset.note = displayNoteName(m);

    const lbl = document.createElement('span');
    lbl.className = 'key-label';
    lbl.textContent = displayNoteName(m);
    lbl.style.pointerEvents = 'none';

    if (isWhite(m)) {
      el.classList.add('white-key');
      el.style.left = (whitePositions[m] * KEY_W) + 'px';
      el.style.width = KEY_W + 'px';
      el.style.height = KEY_H + 'px';
      el.appendChild(lbl);
    } else {
      el.classList.add('black-key');
      lbl.classList.add('black-key-label');
      const leftWhite = whitePositions[m - 1];
      if (leftWhite !== undefined) {
        el.style.left = (leftWhite * KEY_W + KEY_W - BK_W / 2) + 'px';
      }
      el.style.width = BK_W + 'px';
      el.style.height = BK_H + 'px';
      el.appendChild(lbl);
    }

    el.title = displayNoteName(m) + ' (MIDI ' + m + ')';
    el.addEventListener('click', () => onKeyClick(m));
    container.appendChild(el);
    pianoState.keys[m] = el;
  }

  scrollPianoToRangeCenter();
  loadExisting();
}

/** Horizontally center the keyboard on the current range midpoint (or middle C). */
function scrollPianoToRangeCenter() {
  const scroll = document.getElementById('piano-scroll');
  if (!scroll) return;
  const s = pianoState;
  let centerM = 60;
  if (s.rangeStart != null && s.rangeEnd != null) {
    centerM = Math.round((s.rangeStart + s.rangeEnd) / 2);
  } else if (s.rangeStart != null) {
    centerM = s.rangeStart;
  }
  centerM = Math.max(MIDI_LOW, Math.min(MIDI_HIGH, centerM));
  const keyEl = pianoState.keys[centerM];
  if (!keyEl) return;
  const w = keyEl.offsetWidth || KEY_W;
  const offset = keyEl.offsetLeft - scroll.clientWidth / 2 + w / 2;
  scroll.scrollLeft = Math.max(0, offset);
}

/* ── Key click handler ──────────────────────────────────────────────────── */
function onKeyClick(midi) {
  const mode = pianoState.mode;

  if (mode === 'range') {
    handleRangeClick(midi);
  } else if (mode === 'favorites') {
    handleMarkClick(midi, 'favorites');
  } else if (mode === 'avoids') {
    handleMarkClick(midi, 'avoids');
  }
}

function handleRangeClick(midi) {
  const s = pianoState;

  if (s.rangeStart === null) {
    // First click — set low note
    s.rangeStart = midi;
    s.rangeEnd = null;
    s._rangeClicks = 1;
    s.favorites.clear();
    s.avoids.clear();
  } else if (s.rangeEnd === null) {
    // Second click — set high note (or re-tap low to restart)
    if (midi === s.rangeStart) {
      s.rangeStart = null;
      s.rangeEnd = null;
      s._rangeClicks = 0;
      s.favorites.clear();
      s.avoids.clear();
    } else if (midi < s.rangeStart) {
      s.rangeEnd = s.rangeStart;
      s.rangeStart = midi;
      s._rangeClicks = 2;
    } else {
      s.rangeEnd = midi;
      s._rangeClicks = 2;
    }
  } else {
    // Range already complete — tap low or high to re-pick that boundary
    if (midi === s.rangeStart) {
      s.rangeStart = null;
      s.rangeEnd = null;
      s._rangeClicks = 0;
      s.favorites.clear();
      s.avoids.clear();
    } else if (midi === s.rangeEnd) {
      s.rangeEnd = null;
      s._rangeClicks = 1;
    } else {
      // Clicked a different note — start over
      s.rangeStart = midi;
      s.rangeEnd = null;
      s._rangeClicks = 1;
      s.favorites.clear();
      s.avoids.clear();
    }
  }

  refreshViews();
  updateReadouts();
  if (typeof updateNextButton === 'function') updateNextButton();
  if (s.rangeStart != null && s.rangeEnd != null) {
    requestAnimationFrame(() => scrollPianoToRangeCenter());
  }
}

function handleMarkClick(midi, which) {
  const s = pianoState;
  if (s.rangeStart === null || s.rangeEnd === null) return;
  if (midi < s.rangeStart || midi > s.rangeEnd) return;

  const set = s[which];
  const other = which === 'favorites' ? 'avoids' : 'favorites';

  if (set.has(midi)) {
    set.delete(midi);
  } else {
    s[other].delete(midi);
    set.add(midi);
  }

  refreshViews();
  updateReadouts();
}

/** Add a favorite/avoid without toggling off; used by staff drag-paint. */
function ensureMarkOnly(midi, which) {
  const s = pianoState;
  if (s.rangeStart === null || s.rangeEnd === null) return;
  const lo = Math.min(s.rangeStart, s.rangeEnd);
  const hi = Math.max(s.rangeStart, s.rangeEnd);
  if (midi < lo || midi > hi) return;

  const set = s[which];
  const other = which === 'favorites' ? 'avoids' : 'favorites';
  if (set.has(midi)) return;

  s[other].delete(midi);
  set.add(midi);
  refreshViews();
  updateReadouts();
}

/* ── Styling ────────────────────────────────────────────────────────────── */
function refreshPianoKeyLabels() {
  for (let m = MIDI_LOW; m <= MIDI_HIGH; m++) {
    const el = pianoState.keys[m];
    if (!el) continue;
    const lbl = el.querySelector('.key-label');
    if (lbl) lbl.textContent = displayNoteName(m);
    el.title = displayNoteName(m) + ' (MIDI ' + m + ')';
    el.dataset.note = displayNoteName(m);
  }
}
window.refreshPianoKeyLabels = refreshPianoKeyLabels;

function refreshViews() {
  refreshKeyStyles();
  if (typeof refreshStaffNotes === 'function') refreshStaffNotes();
}

function refreshKeyStyles() {
  const s = pianoState;
  const hasRange = s.rangeStart !== null && s.rangeEnd !== null;

  for (let m = MIDI_LOW; m <= MIDI_HIGH; m++) {
    const el = s.keys[m];
    if (!el) continue;

    el.classList.remove('dimmed', 'range-edge', 'favorite', 'avoid');

    if (hasRange) {
      if (m < s.rangeStart || m > s.rangeEnd) {
        el.classList.add('dimmed');
      } else if (s.favorites.has(m)) {
        el.classList.add('favorite');
      } else if (s.avoids.has(m)) {
        el.classList.add('avoid');
      }

      if (m === s.rangeStart || m === s.rangeEnd) {
        el.classList.add('range-edge');
      }
    } else if (s.rangeStart !== null && m === s.rangeStart) {
      el.classList.add('range-edge');
    }
  }
}

/* ── Readouts ───────────────────────────────────────────────────────────── */
function updateReadouts() {
  const s = pianoState;

  const rangeEl = document.querySelector('#range-readout .note-list');
  if (rangeEl) {
    if (s.rangeStart !== null && s.rangeEnd !== null) {
      rangeEl.textContent =
        displayNoteName(s.rangeStart) + ' – ' + displayNoteName(s.rangeEnd);
    } else if (s.rangeStart !== null) {
      rangeEl.textContent = displayNoteName(s.rangeStart) + ' – (click high note)';
    } else {
      rangeEl.textContent = 'Click two notes to set your range';
    }
  }

  const favEl = document.querySelector('#favorites-readout .note-list');
  if (favEl) {
    const arr = Array.from(s.favorites).sort((a, b) => a - b);
    favEl.textContent = arr.length ? arr.map(displayNoteName).join(', ') : 'None';
  }

  const avoidEl = document.querySelector('#avoids-readout .note-list');
  if (avoidEl) {
    const arr = Array.from(s.avoids).sort((a, b) => a - b);
    avoidEl.textContent = arr.length ? arr.map(displayNoteName).join(', ') : 'None';
  }
}

/* ── Mode switching ─────────────────────────────────────────────────────── */
function setMode(mode) {
  pianoState.mode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('mode-' + mode);
  if (btn) btn.classList.add('active');
}

/* ── Reset ──────────────────────────────────────────────────────────────── */
function resetRange() {
  pianoState.rangeStart = null;
  pianoState.rangeEnd = null;
  pianoState._rangeClicks = 0;
  pianoState.favorites.clear();
  pianoState.avoids.clear();
  pianoState.mode = 'range';
  setMode('range');
  refreshViews();
  updateReadouts();
  if (typeof updateNextButton === 'function') updateNextButton();
  requestAnimationFrame(() => scrollPianoToRangeCenter());
}

/* ── Load existing profile data ─────────────────────────────────────────── */
function loadExisting() {
  if (typeof EXISTING === 'undefined' || !EXISTING || !EXISTING.min_midi) return;
  const e = EXISTING;

  pianoState.rangeStart = e.min_midi;
  pianoState.rangeEnd = e.max_midi;
  pianoState._rangeClicks = 2;

  if (e.favorite_midis) e.favorite_midis.forEach(m => pianoState.favorites.add(m));
  if (e.avoid_midis) e.avoid_midis.forEach(m => pianoState.avoids.add(m));

  refreshViews();
  updateReadouts();
  if (typeof updateNextButton === 'function') updateNextButton();

  requestAnimationFrame(() => scrollPianoToRangeCenter());
}

/* ── Init ───────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', buildPiano);
