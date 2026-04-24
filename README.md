# Tessituragram Repertoire Recommender

This project helps singers and teachers compare vocal music to singer ranges using **tessituragrams**.

A tessituragram is a pitch-distribution chart: it shows how much time a song (or a voice part in a multi-part song) spends on each pitch.  
This system can:

- build tessituragrams from `.mxl` MusicXML files,
- rank songs against one singer or multiple singers,
- generate Jupyter notebooks so you can visually inspect tessituragrams and recommendations.

## What's in this repository

Current structure in this repo:

- `src/` - Python source code
- `data/all_tessituragrams.json` - multi-part tessituragram library (used by recommendations)
- `data/tessituragrams.json` - single-part tessituragram library format
- `README.md` - this guide

Notes:

- `requirements.txt` is not currently present in this snapshot.
- `songs/` is not currently present in this snapshot; create it when you want to process your own `.mxl` files.

## Installation

From the `research_seminar` folder:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
```

If `requirements.txt` exists in your copy, install with:

```powershell
pip install -r requirements.txt
```

In this current snapshot (no `requirements.txt`), install directly:

```powershell
pip install music21 numpy scipy nbformat matplotlib jupyter
```

## Quick start

### 1) Create tessituragrams from song files

If you have your own `.mxl` files:

```powershell
mkdir songs\mxl_songs
# copy your .mxl files into songs\mxl_songs
python -m src.main
```

Expected output:

- console messages like `Processing: ...` and `Done!`
- JSON saved to `data/tessituragrams.json`

### 2) Run recommendations

The recommender reads `data/all_tessituragrams.json` and saves ranked results:

```powershell
python -m src.run_recommendations
```

Expected output:

- interactive prompts for range, favorite notes, and avoid notes
- ranked recommendations printed in terminal
- saved file: `data/recommendations.json`

### 3) View tessituragrams and recommendation plots

Generate notebook for tessituragram library:

```powershell
python -m src.visualize
```

Generate notebook for recommendation results:

```powershell
python -m src.visualize_recommendations
```

Then open the generated notebooks in Cursor/VS Code or with Jupyter:

```powershell
jupyter notebook tessituragrams.ipynb
jupyter notebook recommendations.ipynb
```

## What each `src` module does

- `src/main.py` - CLI to process `.mxl` files and save tessituragrams to JSON.
- `src/parser.py` - extracts vocal notes/rests from MusicXML scores.
- `src/tessituragram.py` - converts notes into duration-weighted MIDI pitch distributions and statistics.
- `src/metadata.py` - gets composer/title metadata from MusicXML or filename parsing.
- `src/storage.py` - JSON load/save helpers for tessituragrams and recommendation outputs.
- `src/recommend.py` - scoring engine (range checks, vectors, cosine similarity, multi-part assignment).
- `src/run_recommendations.py` - interactive recommendation workflow for solo and ensemble settings.
- `src/visualize.py` - builds `tessituragrams.ipynb` with pitch histograms.
- `src/visualize_recommendations.py` - builds `recommendations.ipynb` comparing song vectors with ideal profiles.
- `src/__init__.py` - package marker for `src` module imports.

## Troubleshooting

- **`No module named ...`**
  - Activate your virtual environment and reinstall dependencies.
- **`Error: data/all_tessituragrams.json not found`**
  - Put the file in `data/` or adjust `src/run_recommendations.py` paths before running.
- **`Error: Directory not found: songs/mxl_songs`**
  - Create `songs\mxl_songs` and add `.mxl` files, then run `python -m src.main`.
- **`No .mxl files found`**
  - Check that files end with `.mxl` and are inside `songs\mxl_songs`.
- **Notebook opens but charts do not render**
  - Run all cells (`Cell -> Run All`) and ensure `matplotlib` + Jupyter are installed.

## More detailed guides

- `how_tos/how_to_create_tessituragrams.txt`
- `how_tos/how_to_get_recommendations.txt`
- `how_tos/how_to_view_tessituragrams.txt`