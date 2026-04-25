# Tessituragram Repertoire Recommender

This project helps singers and teachers compare songs to vocal ranges using **tessituragrams**.

A tessituragram is a pitch histogram weighted by note duration (how long the song spends on each pitch).

You can use this repo to:

- run a web app that recommends repertoire,
- build tessituragrams from `.mxl` MusicXML files,
- run recommendations in the terminal,
- generate notebooks for visualization.

---

## Start here (for beginners)

If you only want to use the web app, follow **one** option below.

The app opens at: **[http://127.0.0.1:5000/](http://127.0.0.1:5000/)**

Important: the app needs the file `data/all_tessituragrams.json`.

### Option A (recommended): Docker Desktop

1. Install and open [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. Open this folder (`research_seminar`) in File Explorer.
3. Open PowerShell in this folder.
4. Run:

```powershell
docker compose up --build
```

5. Open [http://127.0.0.1:5000/](http://127.0.0.1:5000/) in your browser.
6. To stop the app, press `Ctrl + C` in that PowerShell window.

### Option B: No Docker (Python)

1. Install Python 3.13.
2. Open PowerShell in this folder (`research_seminar`).
3. Run:

```powershell
python -m pip install -r requirements.txt
python app.py
```

4. Open [http://127.0.0.1:5000/](http://127.0.0.1:5000/) in your browser.
5. To stop the app, press `Ctrl + C`.

If you see “Song library not available”, check that `data/all_tessituragrams.json` exists. See [docs/DATA.md](docs/DATA.md).

---

## Web app details (advanced)

- Default host/port: `127.0.0.1:5000`
- Main entry file: [`app.py`](app.py)
- Templates: [`templates/`](templates/)
- Frontend assets: [`static/`](static/)

Optional environment variables:

- `PORT` (default `5000`)
- `FLASK_HOST` (default `127.0.0.1`)
- `FLASK_DEBUG` (`1/true/yes` = debug on, `0/false/no` = debug off)
- `SECRET_KEY` (set this for shared/public use)
- `TESSITURAGRAM_LIBRARY_PATH` (optional path override for the library JSON)

### Docker commands (advanced)

Dev server with Compose:

```powershell
docker compose up --build
```

Production-style Compose service (Gunicorn):

```powershell
docker compose --profile prod up --build
```

Build production image only:

```powershell
docker build --target prod -t tessituragram-app:prod .
```

---

## Web app layout

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
| [`docs/`](docs/) | Spec: [`docs/README.md`](docs/README.md), [`docs/spec/constitution.md`](docs/spec/constitution.md), data notes [`docs/DATA.md`](docs/DATA.md), system guide [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| [`tests/`](tests/) | `pytest` suite (`python -m pytest`) |
| [`requirements.txt`](requirements.txt) | Python dependencies (includes Flask for the web app) |
| [`requirements-prod.txt`](requirements-prod.txt) | Runtime-only deps + Gunicorn (Docker `prod` stage) |
| [`Dockerfile`](Dockerfile) | Multi-stage image (`dev` default, `prod` with `--target prod`) |
| [`.dockerignore`](.dockerignore) | Build context exclusions (`data/` not in image) |
| [`docker-compose.yml`](docker-compose.yml) | `web` (dev) and `web-prod` (profile `prod`) |
| [`.env.example`](.env.example) | Template for secrets / env vars (Compose, deployments) |

---

## Installation (for development)

From the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

---

## CLI workflow

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

## Testing

```powershell
python -m pytest
```

Manual test checklist: [docs/testing/manual-test.md](docs/testing/manual-test.md)

---

## Troubleshooting

- **`No module named ...`**: run `python -m pip install -r requirements.txt` again.
- **Song library missing**: add `data/all_tessituragrams.json` or set `TESSITURAGRAM_LIBRARY_PATH`. See [docs/DATA.md](docs/DATA.md).
- **`Directory not found: songs/mxl_songs`**: create `songs/mxl_songs` and add `.mxl` files before running `python -m src.main`.
- **Web page has no styling or piano keys do not work**: confirm `static/` exists and run from the repo root.

---

## Documentation and guides

- Spec workflow: [docs/README.md](docs/README.md)
- Constitution (project laws): [docs/spec/constitution.md](docs/spec/constitution.md)
- Architecture walkthrough: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Data layout: [docs/DATA.md](docs/DATA.md)
- [`how_tos/how_to_create_tessituragrams.txt`](how_tos/how_to_create_tessituragrams.txt)
- [`how_tos/how_to_get_recommendations.txt`](how_tos/how_to_get_recommendations.txt)
- [`how_tos/how_to_view_tessituragrams.txt`](how_tos/how_to_view_tessituragrams.txt)
