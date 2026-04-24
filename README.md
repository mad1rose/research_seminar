# Tessituragram Repertoire Recommender

This project helps singers and teachers compare vocal music to singer ranges using **tessituragrams**.

A tessituragram is a duration-weighted pitch distribution: it shows how much time a song (or a voice part in a multi-part piece) spends on each pitch. You can:

- build tessituragrams from `.mxl` MusicXML files,
- rank songs for one singer or a small ensemble (CLI or **web UI**),
- generate Jupyter notebooks to inspect tessituragrams and recommendation vectors.

---

## Web app (easiest way to try recommendations)

**After you start the server** (see [Run the web app](#run-the-web-app) below), open the UI in your browser:

**[http://127.0.0.1:5000/](http://127.0.0.1:5000/)**

That link uses the default host and port from [`app.py`](app.py) (`127.0.0.1`, port `5000`). If you set `PORT` or `FLASK_HOST` when launching, use `http://<host>:<port>/` instead.

The web app expects **`data/all_tessituragrams.json`** for the song library (same path as in `app.py`).

### Run the web app

From the **`research_seminar`** project root (so `data/` paths resolve correctly):

```powershell
python -m pip install -r requirements.txt
python app.py
```

Then use **[http://127.0.0.1:5000/](http://127.0.0.1:5000/)** — the terminal also prints this URL when the server starts.

Optional environment variables:

- `PORT` — listen port (default `5000`)
- `FLASK_HOST` — bind address (default `127.0.0.1`; use `0.0.0.0` only if you need access from other devices on your network)

### Web app layout

| Path | Role |
|------|------|
| [`app.py`](app.py) | Flask app: ensemble choice, names, piano profiles, recommendations, results |
| [`templates/`](templates/) | HTML / Jinja templates for the UI |
| [`static/css/style.css`](static/css/style.css) | Styles |
| [`static/js/piano.js`](static/js/piano.js), [`static/js/profile-page.js`](static/js/profile-page.js), [`static/js/results.js`](static/js/results.js) | Client-side behavior |

---

## Repository layout

| Item | Description |
|------|-------------|
| [`src/`](src/) | Core library: parsing, tessituragrams, metadata, storage, recommendation engine, notebook generators |
| [`data/`](data/) | Tessituragram JSON libraries (e.g. `all_tessituragrams.json`, `tessituragrams.json`) and generated outputs |
| [`songs/`](songs/) | Put input `.mxl` files under `songs/mxl_songs/` for the CLI pipeline |
| [`how_tos/`](how_tos/) | Step-by-step text guides |
| [`requirements.txt`](requirements.txt) | Python dependencies (includes Flask for the web app) |

---

## Installation (CLI + notebooks + web)

From the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

---

## Quick start (CLI pipeline)

### 1) Build tessituragrams from `.mxl` files

Place files in `songs/mxl_songs/`, then:

```powershell
python -m src.main
```

Writes **`data/tessituragrams.json`** (and console progress).

### 2) Interactive recommendations (terminal)

Uses **`data/all_tessituragrams.json`**:

```powershell
python -m src.run_recommendations
```

Writes **`data/recommendations.json`** and prints ranked results.

### 3) Visualization notebooks

```powershell
python -m src.visualize
python -m src.visualize_recommendations
```

Generates **`tessituragrams.ipynb`** and **`recommendations.ipynb`** in the project root. Open them in Jupyter or any notebook-aware editor and run all cells.

---

## What each `src` module does

- `src/main.py` — CLI: process `.mxl` files → tessituragram JSON.
- `src/parser.py` — Vocal line extraction from MusicXML.
- `src/tessituragram.py` — Pitch distributions and statistics.
- `src/metadata.py` — Composer / title from score or filename.
- `src/storage.py` — JSON helpers for libraries and outputs.
- `src/recommend.py` — Scoring (range, vectors, cosine similarity, multi-part assignment).
- `src/run_recommendations.py` — Interactive CLI recommender.
- `src/visualize.py` / `src/visualize_recommendations.py` — Notebook builders.
- `src/__init__.py` — Package marker.

---

## Troubleshooting

- **`No module named ...`** — Activate the venv and run `pip install -r requirements.txt` again.
- **`data/all_tessituragrams.json` not found** — Add that file under `data/` for the web app and CLI multi-library flows.
- **`Directory not found: songs/mxl_songs`** — Create `songs/mxl_songs` and add `.mxl` files before `python -m src.main`.
- **Web UI styling or piano broken** — Ensure `static/` is present and you run `python app.py` from the project root.
- **Notebook charts** — Run all cells; ensure `matplotlib` / Jupyter are available (see `requirements.txt`).

---

## More detailed guides

- [`how_tos/how_to_create_tessituragrams.txt`](how_tos/how_to_create_tessituragrams.txt)
- [`how_tos/how_to_get_recommendations.txt`](how_tos/how_to_get_recommendations.txt)
- [`how_tos/how_to_view_tessituragrams.txt`](how_tos/how_to_view_tessituragrams.txt)
