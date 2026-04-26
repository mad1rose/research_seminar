# Tessituragram Repertoire Recommender

This repository builds and compares tessituragrams for vocal repertoire.

A tessituragram is a duration-weighted pitch distribution for a song (or a voice part in a multi-part song). The project supports:

- extracting tessituragrams from MusicXML (`.mxl`) files,
- ranking songs for solo singers or small ensembles,
- generating notebooks and figures for analysis and research experiments.

## Repository layout

- `src/` - core parsing, tessituragram generation, recommendation, and notebook export code.
- `previous_experiment/previous_experiment_scripts/` - scripts used for the initial paper draft experiments (101-song setup).
- `previous_experiment/previous_experiment_results/` - JSON outputs from the initial paper draft experiments.
- `experiment/` - RQ1/RQ2/RQ3 experiment runners and plotting scripts.
- `experiment_results/` - JSON outputs from the later large-library experiments.
- `data/` - tessituragram libraries and recommendation output JSON files.
- `songs/` - input folder for `.mxl` files (used by `src.main`).
- `how_tos/` - step-by-step usage guides.

## Installation

From the `research_seminar` folder:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Quick start (core pipeline)

### 1) Build tessituragrams from `.mxl` files

Put your files in `songs/mxl_songs`, then run:

```powershell
python -m src.main
```

Output is saved to `data/tessituragrams.json`.

### 2) Generate recommendations

Run the interactive recommender:

```powershell
python -m src.run_recommendations
```

This reads `data/all_tessituragrams.json` and writes `data/recommendations.json`.

### 3) Generate visualization notebooks

```powershell
python -m src.visualize
python -m src.visualize_recommendations
```

These generate `tessituragrams.ipynb` and `recommendations.ipynb` in the repository root.

## Experiments

This repository contains **two experiment phases**:

1. **Initial paper-draft experiments (101 songs)**  
   - Dataset source for that phase: `songs/mxl_songs` (101-song set).  
   - Scripts used: `previous_experiment/previous_experiment_scripts/`.  
   - Results produced: `previous_experiment/previous_experiment_results/`.

2. **Later large-library experiments**  
   - Dataset source for that phase: `data/all_tessituragrams.json` (larger library).  
   - Scripts used: `experiment/`.  
   - Results produced: `experiment_results/`.

The `experiment/` scripts reproduce evaluation workflows and figures for RQ1, RQ2, RQ3, baselines, and alpha sensitivity.

Common examples:

```powershell
python -m experiment.run_rq1_experiment
python -m experiment.run_rq2_experiment
python -m experiment.run_rq3_experiment
python -m experiment.visualize_rq1
python -m experiment.visualize_rq2
python -m experiment.visualize_rq3
```

Generated JSON outputs for this (later) phase are stored in `experiment_results/`.

## Main modules in `src/`

- `src.main` - CLI entry point to process `.mxl` files and save tessituragrams.
- `src.parser` - extracts vocal content from MusicXML scores.
- `src.tessituragram` - builds duration-weighted pitch distributions and summary statistics.
- `src.metadata` - extracts title/composer metadata from score/file information.
- `src.storage` - read/write helpers for tessituragram and recommendation JSON files.
- `src.recommend` - recommendation scoring for solo and multi-singer matching.
- `src.run_recommendations` - interactive recommendation workflow.
- `src.visualize` - notebook generator for tessituragram plots.
- `src.visualize_recommendations` - notebook generator for recommendation plots.

## Troubleshooting

- **`No module named ...`**: activate the virtual environment and reinstall with `pip install -r requirements.txt`.
- **`Directory not found: songs/mxl_songs`**: create `songs/mxl_songs` and add `.mxl` files.
- **`data/all_tessituragrams.json not found`**: place the dataset in `data/` before running recommendations.
- **Notebook/plot issues**: regenerate notebooks and run all cells in your notebook environment.

## More detailed guides

- `how_tos/how_to_create_tessituragrams.txt`
- `how_tos/how_to_get_recommendations.txt`
- `how_tos/how_to_view_tessituragrams.txt`