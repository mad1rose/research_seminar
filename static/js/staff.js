/* Grand-staff input: shares pianoState with piano.js (load after piano.js). */

(function () {
  'use strict';

  var MIDI_LOW = 21;
  var MIDI_HIGH = 108;
  var STEP_PX = 7;
  var TOP_PAD = 48;
  var BOTTOM_PAD = 48;
  /* Logical width (viewBox); lines span nearly full width; clefs sit on the left. */
  var STAFF_WIDTH = 480;
  var STAFF_LINE_MARGIN = 10;
  /* Note column: horizontal center so ghost/committed notes align with the middle-C ledger. */
  var NOTE_X = STAFF_WIDTH / 2;
  var LEDGER_HALF_W = 13;
  var GHOST_OPACITY = 0.45;
  var MIDDLE_C_MIDI = 60;

  var whiteMidis = [];
  var whiteIndexByMidi = new Map();

  var staffState = { accidental: 'natural', built: false };

  var markDrag = {
    active: false,
    which: null,
    startMidi: null,
    lastMidi: null,
    strokeStarted: false,
  };

  function isWhiteKey(m) {
    if (typeof isWhite === 'function') return isWhite(m);
    var W = new Set([0, 2, 4, 5, 7, 9, 11]);
    return W.has(m % 12);
  }

  function buildWhiteMidis() {
    whiteMidis = [];
    whiteIndexByMidi.clear();
    for (var m = MIDI_LOW; m <= MIDI_HIGH; m++) {
      if (isWhiteKey(m)) {
        whiteIndexByMidi.set(m, whiteMidis.length);
        whiteMidis.push(m);
      }
    }
  }

  function yForWhiteIndex(i) {
    var n = whiteMidis.length;
    if (n <= 1) return TOP_PAD;
    return TOP_PAD + (n - 1 - i) * STEP_PX;
  }

  /** Nearest white-key MIDI for vertical snap (Finale-style staff position). */
  function staffYToWhiteMidi(svgY) {
    var n = whiteMidis.length;
    var bestI = 0;
    var bestD = Infinity;
    for (var i = 0; i < n; i++) {
      var yy = yForWhiteIndex(i);
      var d = Math.abs(yy - svgY);
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    }
    return whiteMidis[bestI];
  }

  function applyAccidental(whiteMidi, acc) {
    var m = whiteMidi;
    if (acc === 'sharp') m += 1;
    else if (acc === 'flat') m -= 1;
    if (m < MIDI_LOW) m = MIDI_LOW;
    if (m > MIDI_HIGH) m = MIDI_HIGH;
    return m;
  }

  /** Y coordinate for any MIDI (chromatic between white keys). */
  function midiToY(m) {
    var n = whiteMidis.length;
    if (n === 0) return TOP_PAD;
    var lo = 0;
    var hi = n - 1;
    var best = 0;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      if (whiteMidis[mid] <= m) {
        best = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    var wBelow = whiteMidis[best];
    var yBelow = yForWhiteIndex(best);
    if (m === wBelow) return yBelow;
    if (best + 1 >= n) return yBelow;
    var wAbove = whiteMidis[best + 1];
    var yAbove = yForWhiteIndex(best + 1);
    var frac = (m - wBelow) / (wAbove - wBelow);
    return yBelow + frac * (yAbove - yBelow);
  }

  /**
   * Staff line/space for the notehead (not chromatic height between keys).
   * Flat spelling uses the upper white (Eb4 shares E4’s line); sharp uses the lower (D#4 on D).
   */
  function staffAnchorWhiteMidi(m, acc) {
    if (isWhiteKey(m)) return m;
    var up;
    var dn;
    if (acc === 'flat') {
      up = m + 1;
      if (up <= MIDI_HIGH && isWhiteKey(up)) return up;
      dn = m - 1;
      if (dn >= MIDI_LOW && isWhiteKey(dn)) return dn;
      return m;
    }
    dn = m - 1;
    if (dn >= MIDI_LOW && isWhiteKey(dn)) return dn;
    up = m + 1;
    if (up <= MIDI_HIGH && isWhiteKey(up)) return up;
    return m;
  }

  /** Vertical center for drawing a notehead (matches printed staff positions). */
  function midiToNoteheadY(m) {
    var acc = staffState.accidental || 'natural';
    return midiToY(staffAnchorWhiteMidi(m, acc));
  }

  /** When two midis tie on notehead Y, pick the one that matches ♯ / ♭ / natural mode. */
  function staffTiePrefer(mNew, mCur) {
    var acc = staffState.accidental || 'natural';
    var wNew = isWhiteKey(mNew);
    var wCur = isWhiteKey(mCur);
    if (acc === 'sharp' || acc === 'flat') {
      if (!wNew && wCur) return true;
      if (wNew && !wCur) return false;
    } else {
      if (wNew && !wCur) return true;
      if (!wNew && wCur) return false;
    }
    return mNew < mCur;
  }

  /** Nearest semitone to a vertical position (uses notehead Y so Eb sits on the E line). */
  function yToNearestMidi(svgY) {
    if (whiteMidis.length === 0) buildWhiteMidis();
    var best = MIDI_LOW;
    var bestD = Infinity;
    for (var m = MIDI_LOW; m <= MIDI_HIGH; m++) {
      var d = Math.abs(midiToNoteheadY(m) - svgY);
      if (d < bestD || (d === bestD && staffTiePrefer(m, best))) {
        bestD = d;
        best = m;
      }
    }
    return best;
  }

  function svgHeight() {
    var n = whiteMidis.length;
    return TOP_PAD + Math.max(0, n - 1) * STEP_PX + BOTTOM_PAD;
  }

  /**
   * Western grand staff (treble G clef + bass F clef), concert pitch.
   * Treble: five lines bottom→top = E4, G4, B4, D5, F5 (spaces F–A–C–E).
   * Bass: five lines bottom→top = G2, B2, D3, F3, A3 (top line toward middle C).
   * Ledger between staves: C4 (middle C).
   */
  var GRAND_STAFF = {
    trebleLines: [
      { midi: 64, tip: 'E4 — treble staff bottom line' },
      { midi: 67, tip: 'G4 — treble staff (G-clef spiral wraps this line)' },
      { midi: 71, tip: 'B4 — treble staff' },
      { midi: 74, tip: 'D5 — treble staff' },
      { midi: 77, tip: 'F5 — treble staff top line' },
    ],
    bassLines: [
      { midi: 43, tip: 'G2 — bass staff bottom line' },
      { midi: 47, tip: 'B2 — bass staff' },
      { midi: 50, tip: 'D3 — bass staff' },
      { midi: 53, tip: 'F3 — bass staff (F-clef dots bracket this line)' },
      { midi: 57, tip: 'A3 — bass staff top line (toward middle C)' },
    ],
  };
  function ns(tag, attrs, text) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        el.setAttribute(k, attrs[k]);
      });
    }
    if (text != null) el.textContent = text;
    return el;
  }

  function drawStaffLine(g, y, tip) {
    var x1 = STAFF_LINE_MARGIN;
    var x2 = STAFF_WIDTH - STAFF_LINE_MARGIN;
    var line = ns('line', {
      x1: String(x1),
      y1: String(y),
      x2: String(x2),
      y2: String(y),
      stroke: '#8a93a8',
      'stroke-width': '1.1',
    });
    if (tip) {
      line.appendChild(ns('title', {}, tip));
    }
    g.appendChild(line);
  }

  /**
   * Short ledger segment. Default center = NOTE_X (note entry column).
   * Pass centerX (e.g. STAFF_WIDTH / 2) for middle C between the staves.
   */
  function drawLedgerShort(g, y, centerX, tip) {
    var cx = centerX != null ? centerX : NOTE_X;
    var x0 = cx - LEDGER_HALF_W;
    var x1 = cx + LEDGER_HALF_W;
    var line = ns('line', {
      x1: String(x0),
      y1: String(y),
      x2: String(x1),
      y2: String(y),
      stroke: '#8a93a8',
      'stroke-width': '1.1',
    });
    if (tip) {
      line.appendChild(ns('title', {}, tip));
    }
    g.appendChild(line);
  }

  function drawLedgerBetween(g, yNote, yInner, yOuter, side) {
    var step = STEP_PX;
    var y = yInner;
    if (side === 'up') {
      while (y > yNote + 0.01) {
        y -= step;
        drawLedgerShort(g, y);
      }
    } else {
      while (y < yNote - 0.01) {
        y += step;
        drawLedgerShort(g, y);
      }
    }
  }

  /** Only ledger lines above treble top or below bass bottom (not between staves). */
  function drawGhostLedgers(ghostG, yNote, trebleTopY, bassBottomY) {
    if (yNote < trebleTopY - 0.5) {
      drawLedgerBetween(ghostG, yNote, trebleTopY, TOP_PAD, 'up');
    } else if (yNote > bassBottomY + 0.5) {
      drawLedgerBetween(ghostG, yNote, bassBottomY, svgHeight() - BOTTOM_PAD, 'down');
    }
  }

  var PC_SHARP = { 1: 'C#', 3: 'D#', 6: 'F#', 8: 'G#', 10: 'A#' };
  var PC_FLAT = { 1: 'Db', 3: 'Eb', 6: 'Gb', 8: 'Ab', 10: 'Bb' };

  /** Note name for sidebar / piano labels; black keys follow ♯ or ♭ palette. */
  function spellMidiForStaffDisplay(m) {
    if (isWhiteKey(m)) {
      return typeof midiToNoteName === 'function' ? midiToNoteName(m) : String(m);
    }
    var acc = staffState.accidental || 'natural';
    var pc = m % 12;
    var oct = Math.floor(m / 12) - 1;
    if (acc === 'sharp' && PC_SHARP[pc]) return PC_SHARP[pc] + oct;
    if (acc === 'flat' && PC_FLAT[pc]) return PC_FLAT[pc] + oct;
    return typeof midiToNoteName === 'function' ? midiToNoteName(m) : String(m);
  }

  /** Glyph next to notehead: ♯ only in sharp mode, ♭ only in flat mode (natural uses default names). */
  function staffAccidentalGlyphForMidi(m) {
    if (isWhiteKey(m)) return '';
    var acc = staffState.accidental || 'natural';
    if (acc === 'sharp') return '\u266F';
    if (acc === 'flat') return '\u266D';
    if (typeof midiToNoteName === 'function') {
      var name = midiToNoteName(m);
      if (name.indexOf('#') !== -1) return '\u266F';
      if (name.indexOf('b') !== -1) return '\u266D';
    }
    return '';
  }

  function drawNotehead(parent, x, y, fill, stroke, strokeWidth, r) {
    var ell = ns('ellipse', {
      cx: String(x),
      cy: String(y),
      rx: String(r || 7),
      ry: String((r || 7) * 0.72),
      fill: fill,
      stroke: stroke || 'none',
      'stroke-width': strokeWidth || '0',
      transform: 'rotate(-20 ' + x + ' ' + y + ')',
    });
    parent.appendChild(ell);
    return ell;
  }

  function buildStaff() {
    var svgEl = document.getElementById('staff-svg');
    var scrollEl = document.getElementById('staff-scroll');
    if (!svgEl || staffState.built) return;

    buildWhiteMidis();
    staffState.built = true;

    var H = svgHeight();
    svgEl.setAttribute('width', String(STAFF_WIDTH));
    svgEl.setAttribute('height', String(H));
    svgEl.setAttribute('viewBox', '0 0 ' + STAFF_WIDTH + ' ' + H);
    svgEl.innerHTML = '';

    svgEl.appendChild(
      ns('rect', {
        x: '0',
        y: '0',
        width: String(STAFF_WIDTH),
        height: String(H),
        fill: '#f6f8fd',
        stroke: '#c8d0e0',
        'stroke-width': '1',
        rx: '10',
      }),
    );

    var staticG = ns('g', { id: 'staff-static' });
    staticG.setAttribute(
      'aria-label',
      'Grand staff: treble five lines are E4 G4 B4 D5 F5 from bottom to top; short ledger is C4 middle C; bass five lines are G2 B2 D3 F3 A3 from bottom to top.',
    );
    svgEl.appendChild(staticG);

    var trebleBottomY = midiToY(GRAND_STAFF.trebleLines[0].midi);
    var trebleTopY = midiToY(GRAND_STAFF.trebleLines[4].midi);
    var bassBottomY = midiToY(GRAND_STAFF.bassLines[0].midi);
    var bassTopY = midiToY(GRAND_STAFF.bassLines[4].midi);

    (function verifyGrandStaffPitchOrder() {
      var yF5 = midiToY(77);
      var yE4 = midiToY(64);
      var yC4 = midiToY(60);
      var yA3 = midiToY(57);
      var yG2 = midiToY(43);
      if (!(yF5 < yE4 && yE4 < yC4 && yC4 < yA3 && yA3 < yG2)) {
        console.warn(
          '[staff] Expected screen Y order (high pitch up): F5 < E4 < C4 < A3 < G2. Values:',
          { F5: yF5, E4: yE4, C4: yC4, A3: yA3, G2: yG2 },
        );
      }
    })();

    GRAND_STAFF.trebleLines.forEach(function (row) {
      drawStaffLine(staticG, midiToY(row.midi), row.tip);
    });

    var trebleLineGap = (trebleBottomY - trebleTopY) / 4;
    var bassLineGap = (bassBottomY - bassTopY) / 4;
    var trebleStaffH = trebleBottomY - trebleTopY;
    var bassStaffH = bassBottomY - bassTopY;
    var yG4 = midiToY(67);
    var yF3 = midiToY(53);
    /* Western classical: G clef ~4 staff spaces tall, spiral on G4; F clef on F3 line. */
    var trebleClefPx = Math.round(
      Math.max(30, Math.min(68, Math.min(trebleLineGap * 3.85, trebleStaffH * 0.88))),
    );
    var bassClefPx = Math.round(
      Math.max(26, Math.min(60, Math.min(bassLineGap * 3.25, bassStaffH * 0.82))),
    );
    /* Noto Music SMuFL anchors: nudge so G line / F line align with engraving. */
    /* Tiny vertical nudges for Noto Music (fractions of one staff-space). */
    /* Treble: raised to match classical G-clef placement on G4; bass: F3 between dots. */
    var trebleClefDy = -trebleLineGap * 0.675;
    var bassClefDy = bassLineGap * 0.535;
    var clefInsetX = STAFF_LINE_MARGIN + 2;

    var gTrebleClef = ns('g', {
      transform: 'translate(' + clefInsetX + ',' + (yG4 + trebleClefDy) + ')',
      'aria-label': 'Treble clef (G clef)',
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
    staticG.appendChild(gTrebleClef);

    GRAND_STAFF.bassLines.forEach(function (row) {
      drawStaffLine(staticG, midiToY(row.midi), row.tip);
    });

    var gBassClef = ns('g', {
      transform: 'translate(' + clefInsetX + ',' + (yF3 + bassClefDy) + ')',
      'aria-label': 'Bass clef (F clef)',
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
    staticG.appendChild(gBassClef);

    var yMiddleCStatic = midiToY(MIDDLE_C_MIDI);
    if (yMiddleCStatic > trebleBottomY + 0.5 && yMiddleCStatic < bassTopY - 0.5) {
      drawLedgerShort(
        staticG,
        yMiddleCStatic,
        null,
        'C4 (middle C), short ledger line between treble and bass staves',
      );
    }

    var dimG = ns('g', { id: 'staff-dim-layer' });
    var notesG = ns('g', { id: 'staff-notes-layer' });
    var ghostG = ns('g', { id: 'staff-ghost-layer', 'pointer-events': 'none' });
    svgEl.appendChild(dimG);
    svgEl.appendChild(notesG);
    svgEl.appendChild(ghostG);

    function clientToSvg(evt) {
      var pt = svgEl.createSVGPoint();
      pt.x = evt.clientX;
      pt.y = evt.clientY;
      var ctm = svgEl.getScreenCTM();
      if (!ctm) return null;
      var p = pt.matrixTransform(ctm.inverse());
      return p;
    }

    function ghostColor() {
      var mode = typeof pianoState !== 'undefined' ? pianoState.mode : 'range';
      if (mode === 'favorites') return '#2d9d78';
      if (mode === 'avoids') return '#c44d62';
      return '#4f63d8';
    }

    function updateGhost(evt) {
      ghostG.innerHTML = '';
      var p = clientToSvg(evt);
      if (!p) return;
      var mode = typeof pianoState !== 'undefined' ? pianoState.mode : 'range';
      var midi;
      if (mode === 'favorites' || mode === 'avoids') {
        midi = yToNearestMidi(p.y);
      } else {
        var whiteBase = staffYToWhiteMidi(p.y);
        midi = applyAccidental(whiteBase, staffState.accidental);
      }
      var y = midiToNoteheadY(midi);

      drawGhostLedgers(ghostG, y, trebleTopY, bassBottomY);

      drawNotehead(ghostG, NOTE_X, y, ghostColor(), '#fff', '1', 7);

      var accT = staffAccidentalGlyphForMidi(midi);
      if (accT) {
        ghostG.appendChild(
          ns('text', {
            x: String(NOTE_X - 28),
            y: String(y + 5),
            'font-size': '20',
            fill: ghostColor(),
            'font-family': 'serif',
          }, accT),
        );
      }
    }

    function clearGhost() {
      ghostG.innerHTML = '';
    }

    function midiFromClientEvt(evt) {
      var p = clientToSvg(evt);
      if (!p) return null;
      return yToNearestMidi(p.y);
    }

    function paintMarkSpan(fromM, toM, which) {
      if (typeof ensureMarkOnly !== 'function') return;
      var a = Math.min(fromM, toM);
      var b = Math.max(fromM, toM);
      for (var mm = a; mm <= b; mm++) {
        ensureMarkOnly(mm, which);
      }
    }

    function onMarkDocMove(evt) {
      if (!markDrag.active) return;
      if (typeof ensureMarkOnly !== 'function') return;
      var midi = midiFromClientEvt(evt);
      if (midi == null) {
        updateGhost(evt);
        return;
      }
      var lo = Math.min(pianoState.rangeStart, pianoState.rangeEnd);
      var hi = Math.max(pianoState.rangeStart, pianoState.rangeEnd);
      if (midi < lo || midi > hi) {
        updateGhost(evt);
        return;
      }
      if (midi === markDrag.lastMidi) {
        updateGhost(evt);
        return;
      }
      if (!markDrag.strokeStarted) {
        if (midi !== markDrag.startMidi) {
          markDrag.strokeStarted = true;
          paintMarkSpan(markDrag.startMidi, midi, markDrag.which);
        }
      } else {
        paintMarkSpan(markDrag.lastMidi, midi, markDrag.which);
      }
      markDrag.lastMidi = midi;
      updateGhost(evt);
    }

    function onMarkDocUp() {
      if (!markDrag.active) return;
      markDrag.active = false;
      document.removeEventListener('mousemove', onMarkDocMove);
      document.removeEventListener('mouseup', onMarkDocUp);
      if (
        !markDrag.strokeStarted &&
        typeof handleMarkClick === 'function' &&
        markDrag.which != null &&
        markDrag.startMidi != null
      ) {
        handleMarkClick(markDrag.startMidi, markDrag.which);
      }
      markDrag.which = null;
      markDrag.startMidi = null;
      markDrag.lastMidi = null;
      markDrag.strokeStarted = false;
      clearGhost();
    }

    svgEl.addEventListener('mousemove', updateGhost);
    svgEl.addEventListener('mouseleave', function () {
      if (!markDrag.active) clearGhost();
    });

    svgEl.addEventListener('click', function (evt) {
      if (typeof pianoState === 'undefined') return;
      if (pianoState.mode !== 'range') return;
      var p = clientToSvg(evt);
      if (!p) return;
      var whiteBase = staffYToWhiteMidi(p.y);
      var midi = applyAccidental(whiteBase, staffState.accidental);
      handleRangeClick(midi);
      clearGhost();
    });

    svgEl.addEventListener('mousedown', function (evt) {
      if (evt.button !== 0) return;
      if (typeof pianoState === 'undefined') return;
      var mode = pianoState.mode;
      if (mode !== 'favorites' && mode !== 'avoids') return;
      if (pianoState.rangeStart === null || pianoState.rangeEnd === null) return;
      var midi = midiFromClientEvt(evt);
      if (midi == null) return;
      var lo = Math.min(pianoState.rangeStart, pianoState.rangeEnd);
      var hi = Math.max(pianoState.rangeStart, pianoState.rangeEnd);
      if (midi < lo || midi > hi) return;
      markDrag.active = true;
      markDrag.which = mode;
      markDrag.startMidi = midi;
      markDrag.lastMidi = midi;
      markDrag.strokeStarted = false;
      document.addEventListener('mousemove', onMarkDocMove);
      document.addEventListener('mouseup', onMarkDocUp);
      evt.preventDefault();
    });

    wireAccidentalPalette();

    if (scrollEl) {
      var yC = midiToY(MIDDLE_C_MIDI);
      requestAnimationFrame(function () {
        scrollEl.scrollTop = Math.max(0, yC - scrollEl.clientHeight / 2);
      });
    }

    if (typeof window.refreshPianoKeyLabels === 'function') window.refreshPianoKeyLabels();
    if (typeof window.refreshStaffNotes === 'function') window.refreshStaffNotes();
  }

  function wireAccidentalPalette() {
    document.querySelectorAll('.acc-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.acc-btn').forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        staffState.accidental = btn.getAttribute('data-acc') || 'natural';
        if (typeof window.refreshPianoKeyLabels === 'function') window.refreshPianoKeyLabels();
        if (typeof window.refreshStaffNotes === 'function') window.refreshStaffNotes();
        if (typeof updateReadouts === 'function') updateReadouts();
      });
    });
  }

  function drawDimLayer(dimG, s) {
    dimG.innerHTML = '';
    var H = svgHeight();
    if (s.rangeStart == null || s.rangeEnd == null) return;
    var lo = Math.min(s.rangeStart, s.rangeEnd);
    var hi = Math.max(s.rangeStart, s.rangeEnd);
    var yHi = midiToNoteheadY(hi);
    var yLo = midiToNoteheadY(lo);
    var fade = 'rgba(37,33,52,0.1)';
    if (yHi > TOP_PAD + 2) {
      dimG.appendChild(
        ns('rect', {
          x: '0',
          y: String(TOP_PAD),
          width: String(STAFF_WIDTH),
          height: String(Math.max(0, yHi - TOP_PAD - 2)),
          fill: fade,
        }),
      );
    }
    if (yLo < H - BOTTOM_PAD - 2) {
      dimG.appendChild(
        ns('rect', {
          x: '0',
          y: String(yLo + 2),
          width: String(STAFF_WIDTH),
          height: String(Math.max(0, H - yLo - BOTTOM_PAD)),
          fill: fade,
        }),
      );
    }
  }

  function drawCommittedNote(parent, midi, kind) {
    var y = midiToNoteheadY(midi);
    var trebleTopY = midiToY(GRAND_STAFF.trebleLines[4].midi);
    var bassBottomY = midiToY(GRAND_STAFF.bassLines[0].midi);
    var g = ns('g', { class: 'staff-note-wrap', 'data-midi': String(midi) });

    var tmp = ns('g', {});
    drawGhostLedgers(tmp, y, trebleTopY, bassBottomY);
    while (tmp.firstChild) g.appendChild(tmp.firstChild);

    var fill = '#252134';
    var stroke = 'none';
    var sw = '0';
    if (kind === 'favorite') fill = '#2d9d78';
    else if (kind === 'avoid') fill = '#c44d62';
    else if (kind === 'range-edge') {
      fill = '#eef2ff';
      stroke = '#4f63d8';
      sw = '2.5';
    }

    drawNotehead(g, NOTE_X, y, fill, stroke, sw, 7);

    var accT = staffAccidentalGlyphForMidi(midi);
    if (accT) {
      var accFill =
        kind === 'favorite' ? '#0d4a36' : kind === 'avoid' ? '#5c1f28' : '#252134';
      g.appendChild(
        ns('text', {
          x: String(NOTE_X - 28),
          y: String(y + 5),
          'font-size': '20',
          fill: accFill,
          'font-family': 'serif',
        }, accT),
      );
    }

    parent.appendChild(g);
  }

  window.refreshStaffNotes = function () {
    var svgEl = document.getElementById('staff-svg');
    if (!svgEl || !staffState.built) return;

    buildWhiteMidis();

    var dimG = svgEl.querySelector('#staff-dim-layer');
    var notesG = svgEl.querySelector('#staff-notes-layer');
    if (!dimG || !notesG) return;

    var s = typeof pianoState !== 'undefined' ? pianoState : null;
    if (!s) return;

    drawDimLayer(dimG, s);
    notesG.innerHTML = '';

    var hasRange = s.rangeStart != null && s.rangeEnd != null;
    var drawn = new Set();

    if (hasRange) {
      drawCommittedNote(notesG, s.rangeStart, 'range-edge');
      drawn.add(s.rangeStart);
      if (s.rangeEnd !== s.rangeStart) {
        drawCommittedNote(notesG, s.rangeEnd, 'range-edge');
        drawn.add(s.rangeEnd);
      }
    } else if (s.rangeStart != null) {
      drawCommittedNote(notesG, s.rangeStart, 'range-edge');
      drawn.add(s.rangeStart);
    }

    var favs = Array.from(s.favorites).sort(function (a, b) {
      return a - b;
    });
    favs.forEach(function (m) {
      if (drawn.has(m)) return;
      drawCommittedNote(notesG, m, 'favorite');
      drawn.add(m);
    });

    var avs = Array.from(s.avoids).sort(function (a, b) {
      return a - b;
    });
    avs.forEach(function (m) {
      if (drawn.has(m)) return;
      drawCommittedNote(notesG, m, 'avoid');
      drawn.add(m);
    });
  };

  window.buildStaff = buildStaff;
  window.spellMidiForStaffDisplay = spellMidiForStaffDisplay;
})();
