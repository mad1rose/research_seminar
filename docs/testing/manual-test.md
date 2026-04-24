# Manual test checklist

**Spec role:** **Verification** step after the **Implement** phase ([`../tasks.md`](../tasks.md) → code). Run these **after meaningful changes** to `app.py`, `src/recommend.py`, `templates/`, `static/js/`.

**Suggested model:** N/A (human execution); optionally have a **coding model** draft new steps when you add features.

**Environment:** project root, venv active, `pip install -r requirements.txt`  
**Data:** `data/all_tessituragrams.json` present unless you intentionally test the missing-file path.

Record date and outcome in a lab notebook or git tag for thesis evidence.

---

## Web — happy path (Epic D / Story D1–D5)

1. [ ] Start server: `python app.py`  
2. [ ] Open `http://127.0.0.1:5000/`  
3. [ ] Home shows ensemble cards with counts; pick one (e.g. solo or duet).  
4. [ ] Names: submit with blank fields → defaults acceptable; optional custom names.  
5. [ ] Profile: set range (two clicks), optional favorites/avoids, move alpha slider.  
6. [ ] Next / through all profiles → Summary; “Find recommendations” enabled when all complete.  
7. [ ] Results: ranked list, expand a row, charts render (Plotly from CDN—needs network unless you change that).  
8. [ ] Pagination: if enough results, Next/Prev.  

---

## Web — session / edge cases

1. [ ] Refresh mid-wizard: document behavior.  
2. [ ] Browser back: no undocumentable silent corruption.  
3. [ ] Multi-singer: back between profiles; names and ranges sensible.  

---

## Web — save validation (D3) — `POST /api/save-profile`

**Option A — DevTools**

1. [ ] Profile page with valid range.  
2. [ ] Network: `save-profile` on Next → **200** when valid.  

**Option B — Intentional bad payload (advanced)**  

1. [ ] `curl` or REST client: invalid body to `/api/save-profile/0` with session cookie → **400** and `{ "ok": false, "error": "..." }`.  

---

## Web — missing library (D1)

1. [ ] Temporarily rename `data/all_tessituragrams.json`, restart app.  
2. [ ] `/` behavior: clear error vs crash; align [`../spec/user-stories.md`](../spec/user-stories.md) D1 if you improve.  

---

## CLI — Epics A / B / C

**A — Build tessituragrams**  

1. [ ] At least one `.mxl` in `songs/mxl_songs/`  
2. [ ] `python -m src.main` completes  
3. [ ] Output JSON at README path (default `data/tessituragrams.json`)  

**B — Recommendations**  

1. [ ] `python -m src.run_recommendations` — clear message or success when data present/missing  

**C — Notebooks**  

1. [ ] `python -m src.visualize` and/or `python -m src.visualize_recommendations`  
2. [ ] Open `.ipynb`, run all cells  

---

## Regression triage (short on time)

Minimum before a demo:  

- [ ] Web happy path steps 1–7  
- [ ] One CLI command you will show live  

---

*Extend this file when you fix a bug that must never return.*
