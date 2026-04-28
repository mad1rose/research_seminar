/* Results page: expand/collapse cards + Plotly + keyboard/staff heatmaps */

const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const WHITE_PCS = new Set([0, 2, 4, 5, 7, 9, 11]);
const MIDI_LOW = 21;
const MIDI_HIGH = 108;

/** Match profile piano (piano.js). */
const PIANO_KEY_W = 24;
const PIANO_KEY_H = 130;
const PIANO_BK_W = 14;
const PIANO_BK_H = 82;

/** Match profile grand staff (staff.js). */
const STAFF_STEP_PX = 7;
const STAFF_TOP_PAD = 48;
const STAFF_BOTTOM_PAD = 48;
const STAFF_WIDTH = 480;
const STAFF_LINE_MARGIN = 10;
const STAFF_NOTE_X = STAFF_WIDTH / 2;
const STAFF_LEDGER_HALF = 13;
const MIDDLE_C_MIDI = 60;

const GRAND_STAFF = {
  trebleLines: [64, 67, 71, 74, 77],
  bassLines: [43, 47, 50, 53, 57],
};

function midiName(m) {
  return NOTE_NAMES[m % 12] + (Math.floor(m / 12) - 1);
}

function isWhite(m) {
  return WHITE_PCS.has(m % 12);
}

function vizDataRoot(el) {
  return el.closest('.viz-root') || el;
}

function parseVectors(root) {
  let normed;
  let ideal;
  try {
    normed = JSON.parse(root.getAttribute('data-normed') || '{}');
    ideal = JSON.parse(root.getAttribute('data-ideal') || '{}');
  } catch (e) {
    return { normed: {}, ideal: {}, error: true };
  }
  return { normed, ideal, error: false };
}

function parseProfile(root) {
  try {
    return JSON.parse(root.getAttribute('data-profile') || '{}');
  } catch (e) {
    return {};
  }
}

/**
 * Map raw proportion t in [0,1] to a perceptually spaced strength (sqrt).
 * Mid-range differences read more clearly than strict linear mapping (common viz practice).
 */
function heatBarVisualStrength(tRaw) {
  const u = Math.max(0, Math.min(1, tRaw));
  return Math.sqrt(u);
}

/**
 * Sequential blue–teal ramp (luminance-driven), friendly for protan/deutan vision
 * vs red–green scales; aligns with the site’s cool “score paper” + indigo accents.
 */
const HEAT_SEQ_STOPS = [
  { t: 0, c: [246, 248, 253] },
  { t: 0.22, c: [228, 238, 248] },
  { t: 0.42, c: [188, 220, 236] },
  { t: 0.58, c: [130, 192, 210] },
  { t: 0.75, c: [72, 152, 170] },
  { t: 0.9, c: [38, 118, 135] },
  { t: 1, c: [14, 72, 86] },
];

function sequentialHeatRgb(uIn) {
  const u = Math.max(0, Math.min(1, uIn));
  let i = 0;
  while (i < HEAT_SEQ_STOPS.length - 1 && HEAT_SEQ_STOPS[i + 1].t < u) {
    i += 1;
  }
  const a = HEAT_SEQ_STOPS[i];
  const b = HEAT_SEQ_STOPS[Math.min(i + 1, HEAT_SEQ_STOPS.length - 1)];
  const span = b.t - a.t || 1;
  const f = (u - a.t) / span;
  const r = Math.round(a.c[0] + (b.c[0] - a.c[0]) * f);
  const g = Math.round(a.c[1] + (b.c[1] - a.c[1]) * f);
  const bl = Math.round(a.c[2] + (b.c[2] - a.c[2]) * f);
  return [r, g, bl];
}

function heatColor(t) {
  const u = heatBarVisualStrength(Math.max(0, Math.min(1, t)));
  const rgb = sequentialHeatRgb(u);
  return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
}

/** Semi-transparent fill; staff lines stay visible through the bar. */
function heatBarFill(tRaw) {
  const u = heatBarVisualStrength(tRaw);
  const rgb = sequentialHeatRgb(u);
  const a = 0.2 + 0.68 * u;
  return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a.toFixed(3) + ')';
}

function buildWhiteMidis() {
  const out = [];
  for (let m = MIDI_LOW; m <= MIDI_HIGH; m++) {
    if (isWhite(m)) out.push(m);
  }
  return out;
}

function staffGeometry(whiteMidis, topPad, bottomPad, stepPx) {
  const n = whiteMidis.length;
  function yForIndex(i) {
    if (n <= 1) return topPad;
    return topPad + (n - 1 - i) * stepPx;
  }
  function midiToY(m) {
    if (n === 0) return topPad;
    let lo = 0;
    let hi = n - 1;
    let best = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (whiteMidis[mid] <= m) {
        best = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    const wBelow = whiteMidis[best];
    const yBelow = yForIndex(best);
    if (m === wBelow) return yBelow;
    if (best + 1 >= n) return yBelow;
    const wAbove = whiteMidis[best + 1];
    const yAbove = yForIndex(best + 1);
    const frac = (m - wBelow) / (wAbove - wBelow);
    return yBelow + frac * (yAbove - yBelow);
  }
  const H = topPad + Math.max(0, n - 1) * stepPx + bottomPad;
  return { yForIndex, midiToY, H, n };
}

function maxInVector(obj) {
  let mx = 0;
  Object.keys(obj || {}).forEach((k) => {
    const v = Number(obj[k]) || 0;
    if (v > mx) mx = v;
  });
  return mx;
}

function buildFullPianoHeatmap(container, vector, maxV, profile) {
  if (!container) return;
  const minM = profile.min_midi;
  const maxM = profile.max_midi;
  const hasRange =
    typeof minM === 'number' &&
    typeof maxM === 'number' &&
    !Number.isNaN(minM) &&
    !Number.isNaN(maxM) &&
    minM <= maxM;
  const fav = new Set((profile.favorite_midis || []).map(Number));
  const avo = new Set((profile.avoid_midis || []).map(Number));

  const denom = Math.max(maxV, 1e-12);

  let whiteIndex = 0;
  const whitePositions = {};
  for (let m = MIDI_LOW; m <= MIDI_HIGH; m++) {
    if (isWhite(m)) {
      whitePositions[m] = whiteIndex;
      whiteIndex++;
    }
  }
  const totalW = whiteIndex * PIANO_KEY_W;
  container.innerHTML = '';
  container.className = 'heat-keyboard heat-keyboard-full';
  container.style.width = totalW + 'px';
  container.style.height = PIANO_KEY_H + 'px';

  for (let m = MIDI_LOW; m <= MIDI_HIGH; m++) {
    const v = Number(vector[String(m)]) || 0;
    const t = v / denom;
    const el = document.createElement('div');
    el.className = 'heat-piano-key';
    el.dataset.midi = String(m);
    el.title = midiName(m) + ': ' + (v * 100).toFixed(1) + '%';
    el.style.background = heatColor(t);
    el.style.borderColor = t > 0.32 ? 'rgb(32, 96, 112)' : '#c8c4cc';

    const lbl = document.createElement('span');
    lbl.className = 'heat-key-label';
    lbl.textContent = midiName(m);
    lbl.style.pointerEvents = 'none';
    el.appendChild(lbl);
    const rgbL = sequentialHeatRgb(heatBarVisualStrength(t));
    const lum = 0.299 * rgbL[0] + 0.587 * rgbL[1] + 0.114 * rgbL[2];
    if (lum < 125) {
      lbl.style.color = '#f2f9fb';
      lbl.style.textShadow = '0 1px 2px rgba(0,0,0,0.65)';
    }

    if (hasRange) {
      if (m < minM || m > maxM) el.classList.add('rk-out');
      else if (fav.has(m)) el.classList.add('rk-fav');
      else if (avo.has(m)) el.classList.add('rk-avoid');
      if (m === minM || m === maxM) el.classList.add('rk-edge');
    }

    if (isWhite(m)) {
      el.classList.add('heat-white');
      el.style.left = whitePositions[m] * PIANO_KEY_W + 'px';
      el.style.width = PIANO_KEY_W + 'px';
      el.style.height = PIANO_KEY_H + 'px';
    } else {
      el.classList.add('heat-black');
      lbl.classList.add('heat-key-label-black');
      const leftW = whitePositions[m - 1];
      if (leftW !== undefined) {
        el.style.left = leftW * PIANO_KEY_W + PIANO_KEY_W - PIANO_BK_W / 2 + 'px';
      }
      el.style.width = PIANO_BK_W + 'px';
      el.style.height = PIANO_BK_H + 'px';
    }
    container.appendChild(el);
  }
}

function scrollHeatKeyboardToRangeCenter(scrollEl, kbContainer, profile) {
  if (!scrollEl || !kbContainer) return;
  const minM = profile.min_midi;
  const maxM = profile.max_midi;
  const hasRange =
    typeof minM === 'number' &&
    typeof maxM === 'number' &&
    !Number.isNaN(minM) &&
    !Number.isNaN(maxM) &&
    minM <= maxM;
  const centerM = hasRange ? Math.round((minM + maxM) / 2) : 60;
  const keyEl = kbContainer.querySelector('.heat-piano-key[data-midi="' + centerM + '"]');
  if (!keyEl) return;
  const w = keyEl.offsetWidth || PIANO_KEY_W;
  const offset = keyEl.offsetLeft - scrollEl.clientWidth / 2 + w / 2;
  scrollEl.scrollLeft = Math.max(0, offset);
}

function renderKeyboardHeatmap(root) {
  const kbPane = root.querySelector('.viz-pane-keyboard');
  const kb = kbPane && kbPane.querySelector('.heat-keyboard');
  const scrollEl = kbPane && kbPane.querySelector('.heat-keyboard-scroll');
  const legend = root.querySelector('.heat-legend');
  if (!kb || !legend) return;

  const { normed, error } = parseVectors(root);
  if (error) {
    kb.textContent = 'Could not read chart data.';
    return;
  }

  const profile = parseProfile(root);
  const maxV = Math.max(maxInVector(normed), 1e-12);

  buildFullPianoHeatmap(kb, normed, maxV, profile);

  requestAnimationFrame(() => {
    if (scrollEl) scrollHeatKeyboardToRangeCenter(scrollEl, kb, profile);
  });

  legend.innerHTML = '';
  legend.className = 'heat-legend';
  const cap = document.createElement('div');
  cap.className = 'heat-legend-cap';
  cap.innerHTML =
    '<span>Less time on pitch</span><span class="heat-legend-gradient" role="img" aria-label="from light to deep teal"></span><span>More time on pitch</span>';
  legend.appendChild(cap);
}

function ns(tag, attrs, text) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  if (attrs) {
    Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k]));
  }
  if (text != null) el.textContent = text;
  return el;
}

function drawStaffLineH(g, y, x1, x2, stroke, strokeWidth) {
  g.appendChild(
    ns('line', {
      x1: String(x1),
      y1: String(y),
      x2: String(x2),
      y2: String(y),
      stroke: stroke == null ? '#8a93a8' : stroke,
      'stroke-width': strokeWidth == null ? '1.1' : strokeWidth,
    }),
  );
}

function drawLedgerShortH(g, y, cx, stroke, strokeWidth) {
  const x0 = cx - STAFF_LEDGER_HALF;
  const x1 = cx + STAFF_LEDGER_HALF;
  g.appendChild(
    ns('line', {
      x1: String(x0),
      y1: String(y),
      x2: String(x1),
      y2: String(y),
      stroke: stroke == null ? '#8a93a8' : stroke,
      'stroke-width': strokeWidth == null ? '1.1' : strokeWidth,
    }),
  );
}

/** Ledgers only above treble top or below bass bottom (not between staves). */
function appendLedgersForPitch(ledgerG, yNote, trebleTopY, bassBottomY, stepPx, stroke, strokeWidth) {
  if (yNote < trebleTopY - 0.5) {
    let y = trebleTopY;
    while (y > yNote + 0.01) {
      y -= stepPx;
      drawLedgerShortH(ledgerG, y, STAFF_NOTE_X, stroke, strokeWidth);
    }
  } else if (yNote > bassBottomY + 0.5) {
    let y = bassBottomY;
    while (y < yNote - 0.01) {
      y += stepPx;
      drawLedgerShortH(ledgerG, y, STAFF_NOTE_X, stroke, strokeWidth);
    }
  }
}

function renderStaffHeatmapInto(wrap, vector, maxV) {
  if (!wrap) return;

  const midis = Object.keys(vector || {})
    .map(Number)
    .filter((m) => !Number.isNaN(m))
    .sort((a, b) => a - b);
  if (midis.length === 0) {
    wrap.textContent = 'No pitch data.';
    return;
  }

  const vals = midis.map((m) => Number(vector[String(m)]) || 0);
  const localMax = Math.max(...vals, 1e-12);
  const denom = Math.max(maxV, localMax, 1e-12);

  const whiteMidis = buildWhiteMidis();
  const geo = staffGeometry(whiteMidis, STAFF_TOP_PAD, STAFF_BOTTOM_PAD, STAFF_STEP_PX);

  const trebleBottomY = geo.midiToY(GRAND_STAFF.trebleLines[0]);
  const trebleTopY = geo.midiToY(GRAND_STAFF.trebleLines[4]);
  const bassBottomY = geo.midiToY(GRAND_STAFF.bassLines[0]);
  const bassTopY = geo.midiToY(GRAND_STAFF.bassLines[4]);

  const trebleLineGap = (trebleBottomY - trebleTopY) / 4;
  const bassLineGap = (bassBottomY - bassTopY) / 4;
  const trebleStaffH = trebleBottomY - trebleTopY;
  const bassStaffH = bassBottomY - bassTopY;
  const yG4 = geo.midiToY(67);
  const yF3 = geo.midiToY(53);
  const trebleClefPx = Math.round(
    Math.max(30, Math.min(68, Math.min(trebleLineGap * 3.85, trebleStaffH * 0.88))),
  );
  const bassClefPx = Math.round(
    Math.max(26, Math.min(60, Math.min(bassLineGap * 3.25, bassStaffH * 0.82))),
  );
  const trebleClefDy = -trebleLineGap * 0.675;
  const bassClefDy = bassLineGap * 0.535;
  const clefInsetX = STAFF_LINE_MARGIN + 2;

  const xLine1 = STAFF_LINE_MARGIN;
  const xLine2 = STAFF_WIDTH - STAFF_LINE_MARGIN;
  const heatLineStroke = '#3d4559';
  const heatLineSw = '1.35';

  const barMidis = midis.filter((m) => (Number(vector[String(m)]) || 0) > 0);
  if (barMidis.length === 0) {
    wrap.textContent = 'No singing-time share on any pitch for this song.';
    return;
  }
  let peakMidi = barMidis[0];
  let peakV = 0;
  barMidis.forEach((m) => {
    const vv = Number(vector[String(m)]) || 0;
    if (vv > peakV) {
      peakV = vv;
      peakMidi = m;
    }
  });
  const ariaStaff =
    barMidis.length +
    ' pitch levels; strongest is ' +
    midiName(peakMidi) +
    ' at about ' +
    ((peakV / denom) * 100).toFixed(0) +
    ' percent of singing time. Hover each bar for exact values.';

  const svg = ns('svg', {
    viewBox: '0 0 ' + STAFF_WIDTH + ' ' + geo.H,
    width: '100%',
    height: String(geo.H),
    class: 'heat-staff-svg results-grand-staff',
    role: 'img',
    'aria-label': ariaStaff,
  });

  svg.appendChild(
    ns('rect', {
      x: '0',
      y: '0',
      width: String(STAFF_WIDTH),
      height: String(geo.H),
      fill: '#f6f8fd',
      stroke: '#c8d0e0',
      'stroke-width': '1',
      rx: '10',
    }),
  );

  const linesG = ns('g', { class: 'heat-staff-lines-only' });
  GRAND_STAFF.trebleLines.forEach((mm) =>
    drawStaffLineH(linesG, geo.midiToY(mm), xLine1, xLine2, heatLineStroke, heatLineSw),
  );
  GRAND_STAFF.bassLines.forEach((mm) =>
    drawStaffLineH(linesG, geo.midiToY(mm), xLine1, xLine2, heatLineStroke, heatLineSw),
  );
  var yC = geo.midiToY(MIDDLE_C_MIDI);
  if (yC > trebleBottomY + 0.5 && yC < bassTopY - 0.5) {
    drawLedgerShortH(linesG, yC, STAFF_NOTE_X, heatLineStroke, heatLineSw);
  }
  svg.appendChild(linesG);

  const ledgerG = ns('g', { class: 'heat-staff-extra-ledgers' });
  midis.forEach((m) => {
    const v = Number(vector[String(m)]) || 0;
    if (v <= 0) return;
    const y = geo.midiToY(m);
    appendLedgersForPitch(ledgerG, y, trebleTopY, bassBottomY, STAFF_STEP_PX, heatLineStroke, heatLineSw);
  });
  svg.appendChild(ledgerG);

  const HEAT_BAR_HALF_W = 44;
  const heatBarH = STAFF_STEP_PX * 0.92;
  const heatG = ns('g', { class: 'heat-staff-bars' });
  const sortedBars = barMidis.slice().sort((a, b) => {
    return (Number(vector[String(a)]) || 0) - (Number(vector[String(b)]) || 0);
  });
  sortedBars.forEach((m) => {
    const v = Number(vector[String(m)]) || 0;
    const t = v / denom;
    const y = geo.midiToY(m);
    const pct = (v * 100).toFixed(1);
    const rect = ns('rect', {
      x: String(STAFF_NOTE_X - HEAT_BAR_HALF_W),
      y: String(y - heatBarH / 2),
      width: String(HEAT_BAR_HALF_W * 2),
      height: String(heatBarH),
      fill: heatBarFill(t),
      stroke: 'rgba(37, 49, 85, 0.55)',
      'stroke-width': '1',
      rx: '1.5',
      ry: '1.5',
      'vector-effect': 'non-scaling-stroke',
      'shape-rendering': 'crispEdges',
    });
    rect.appendChild(
      ns('title', {}, midiName(m) + ': ' + pct + '% of singing time on this pitch in the song'),
    );
    heatG.appendChild(rect);
  });
  svg.appendChild(heatG);

  const clefsG = ns('g', { class: 'heat-staff-clefs' });
  const gTrebleClef = ns('g', {
    transform: 'translate(' + clefInsetX + ',' + (yG4 + trebleClefDy) + ')',
    'aria-hidden': 'true',
  });
  gTrebleClef.appendChild(
    ns('text', {
      class: 'staff-clef',
      x: '0',
      y: '0',
      'font-size': String(trebleClefPx),
      fill: '#252134',
      'font-family': '"Noto Music", "Apple Symbols", "Segoe UI Symbol", serif',
      'dominant-baseline': 'central',
      'text-anchor': 'start',
    }, '\uD834\uDD1E'),
  );
  clefsG.appendChild(gTrebleClef);
  const gBassClef = ns('g', {
    transform: 'translate(' + clefInsetX + ',' + (yF3 + bassClefDy) + ')',
    'aria-hidden': 'true',
  });
  gBassClef.appendChild(
    ns('text', {
      class: 'staff-clef',
      x: '0',
      y: '0',
      'font-size': String(bassClefPx),
      fill: '#252134',
      'font-family': '"Noto Music", "Apple Symbols", "Segoe UI Symbol", serif',
      'dominant-baseline': 'central',
      'text-anchor': 'start',
    }, '\uD834\uDD22'),
  );
  clefsG.appendChild(gBassClef);
  svg.appendChild(clefsG);

  wrap.innerHTML = '';
  wrap.appendChild(svg);
}

function renderStaffHeatmap(root) {
  const wrap = root.querySelector('.viz-pane-staff .heat-staff-wrap');
  if (!wrap) return;

  const { normed, error } = parseVectors(root);
  if (error) {
    wrap.textContent = 'Could not read chart data.';
    return;
  }

  const maxV = Math.max(maxInVector(normed), 1e-12);

  renderStaffHeatmapInto(wrap, normed, maxV);

  const staffPane = root.querySelector('.viz-pane-staff');
  if (staffPane) {
    staffPane.querySelectorAll('.heat-staff-legend').forEach((el) => el.remove());
    const legend = document.createElement('div');
    legend.className = 'heat-staff-legend heat-staff-legend-rich';
    legend.innerHTML =
      '<p class="heat-staff-legend-lead">Each vertical band is <strong>one pitch</strong>, aligned with that note’s height on the grand staff. <strong>Darker = more</strong> of this song’s singing time on that pitch (brightness uses a perceptual scale so mid values are easier to compare).</p>' +
      '<p class="heat-staff-legend-hint"><strong>Tip:</strong> hover any bar for the exact note and percentage. Staff lines stay visible through the bars.</p>' +
      '<div class="heat-staff-legend-scale" aria-hidden="true"><span>Less</span><span class="heat-legend-gradient"></span><span>More</span></div>';
    staffPane.appendChild(legend);
  }
}

function switchViz(root, viz) {
  root.querySelectorAll('.viz-tab').forEach((b) => {
    const on = b.getAttribute('data-viz') === viz;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  root.querySelectorAll('.viz-caption').forEach((p) => {
    const show =
      (viz === 'bars' && p.classList.contains('viz-caption-bars')) ||
      (viz === 'keyboard' && p.classList.contains('viz-caption-keyboard')) ||
      (viz === 'staff' && p.classList.contains('viz-caption-staff'));
    p.classList.toggle('hidden', !show);
  });
  root.querySelectorAll('.viz-pane').forEach((pane) => {
    const show = pane.classList.contains('viz-pane-' + viz);
    pane.classList.toggle('hidden', !show);
  });

  if (viz === 'keyboard' && root.dataset.heatKeyboard !== '3') {
    renderKeyboardHeatmap(root);
    root.dataset.heatKeyboard = '3';
  } else if (viz === 'keyboard') {
    const profile = parseProfile(root);
    const kbPane = root.querySelector('.viz-pane-keyboard');
    const kb = kbPane && kbPane.querySelector('.heat-keyboard');
    const scrollEl = kbPane && kbPane.querySelector('.heat-keyboard-scroll');
    requestAnimationFrame(() => {
      if (scrollEl && kb) scrollHeatKeyboardToRangeCenter(scrollEl, kb, profile);
    });
  }
  if (viz === 'staff' && root.dataset.heatStaff !== '3') {
    root.querySelectorAll('.heat-staff-legend').forEach((el) => el.remove());
    renderStaffHeatmap(root);
    root.dataset.heatStaff = '3';
  }

  if (viz === 'bars' && typeof Plotly !== 'undefined' && Plotly.Plots && Plotly.Plots.resize) {
    const plotEl = root.querySelector('.plotly-chart');
    if (plotEl && plotEl.dataset.rendered === 'true') {
      requestAnimationFrame(() => Plotly.Plots.resize(plotEl));
    }
  }
}

function initVizRoot(root) {
  if (root.dataset.vizInit === '1') return;
  root.dataset.vizInit = '1';
  root.querySelectorAll('.viz-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const v = btn.getAttribute('data-viz');
      if (v) switchViz(root, v);
    });
  });
}

function toggleCard(cardId) {
  const card = document.getElementById(cardId);
  if (!card) return;
  const wasExpanded = card.classList.contains('expanded');
  card.classList.toggle('expanded');

  if (!wasExpanded) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        card.querySelectorAll('.plotly-chart').forEach(renderChart);
      });
    });
  }
}

function renderChart(el) {
  if (el.dataset.rendered === 'true') return;
  if (typeof Plotly === 'undefined') {
    el.textContent = 'Chart library failed to load (check network / CDN).';
    return;
  }

  const root = vizDataRoot(el);
  const normedRaw = root.getAttribute('data-normed') || el.getAttribute('data-normed');
  const idealRaw = root.getAttribute('data-ideal') || el.getAttribute('data-ideal');
  let normed;
  let ideal;
  try {
    normed = JSON.parse(normedRaw || '{}');
    ideal = JSON.parse(idealRaw || '{}');
  } catch (e) {
    el.textContent = 'Chart data could not be parsed';
    return;
  }
  const title =
    root.getAttribute('data-chart-title') || el.getAttribute('data-chart-title') || '';

  const allMidis = new Set([
    ...Object.keys(normed).map(Number),
    ...Object.keys(ideal).map(Number),
  ]);
  if (allMidis.size === 0) {
    el.textContent = 'No data';
    return;
  }

  const sorted = Array.from(allMidis).sort((a, b) => a - b);
  const labels = sorted.map((m) => midiName(m) + ' (' + m + ')');
  const songVals = sorted.map((m) => normed[m] || 0);
  const idealVals = sorted.map((m) => ideal[m] || 0);

  /** Solid fill for all song bars (same hue family as staff heat, distinct from ideal line). */
  const BAR_COLOR = 'rgb(88, 164, 188)';

  const barTrace = {
    x: labels,
    y: songVals,
    type: 'bar',
    name: 'Song (normalised)',
    marker: { color: BAR_COLOR, line: { color: '#fff', width: 0.5 } },
  };

  const lineTrace = {
    x: labels,
    y: idealVals,
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Ideal vector',
    line: { color: '#4f63d8', width: 2.5 },
    marker: { size: 4 },
  };

  const layout = {
    title: { text: title, font: { size: 13, family: 'Poppins', color: '#252134' } },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(238,242,255,0.55)',
    font: { color: '#5a566d', size: 9, family: 'Inter' },
    xaxis: {
      tickangle: -45,
      tickfont: { size: 7 },
      gridcolor: '#c8d0e0',
      automargin: true,
    },
    yaxis: {
      title: { text: 'Proportion of singing time', font: { size: 10 } },
      gridcolor: '#c8d0e0',
      automargin: true,
    },
    legend: { x: 0, y: 1.12, orientation: 'h', font: { size: 9 } },
    margin: { t: 50, b: 100, l: 60, r: 20 },
    bargap: 0.2,
  };

  try {
    Plotly.newPlot(el, [barTrace, lineTrace], layout, {
      responsive: true,
      displayModeBar: false,
    });
    el.dataset.rendered = 'true';
    requestAnimationFrame(() => {
      if (typeof Plotly !== 'undefined' && Plotly.Plots && Plotly.Plots.resize) {
        Plotly.Plots.resize(el);
      }
    });
  } catch (e) {
    el.textContent = 'Chart could not be drawn.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.viz-root').forEach(initVizRoot);
});
