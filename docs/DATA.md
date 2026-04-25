# Data files (`data/`)

This document supports **reproducibility** and the requirements in `docs/spec/user-stories.md` (Epic E). The web app and CLI are **offline**; there are no paid third-party API calls in the core pipeline.

## `all_tessituragrams.json` (primary library)

- **Role:** Full **multi-voice** tessituragram library used by the **web app** and by `python -m src.run_recommendations` / multi-part paths.
- **Path (default):** `data/all_tessituragrams.json` (override with the environment variable `TESSITURAGRAM_LIBRARY_PATH` in the environment; see `app.py` and `README.md`).
- **Format (top level):** A JSON object with a **`"songs"`** key whose value is a **list of song objects**. Each song can embed multiple voice parts; see `src/storage.py` (`get_voice_part_count`, `load_tessituragrams_with_status`).
- **Provenance:** Your thesis should cite the corpus used to build this file. A common source in this line of work is the **OpenScore Lieder** corpus; cite the **Zenodo release and/or MEC report** as required by that project’s license and your program’s rules.
- **Size / GitHub:** Large JSON may be **git-ignored** or distributed separately; the important part is a single, documented way to obtain or build it (see `README.md` and your assignment instructions).
- **Optional version stamp:** You may add a one-line `README` or this file note with a **date** or **hash** of the file when you freeze a thesis run.

## `tessituragrams.json` (CLI merge file)

- **Role:** Default output of `python -m src.main` when building from `songs/mxl_songs/*.mxl`. Merges into a single file (see `src/main.py`).
- **Path (default):** `data/tessituragrams.json`
- **Relation to the web app:** The Flask UI reads **`all_tessituragrams.json`** by default, not this file. To use CLI-built data for the full library, you must build or **merge** into the “all” library using your own workflow (or convert—keep one canonical path in your write-up).

## `recommendations.json`

- **Role:** Default output of `python -m src.run_recommendations` (CLI interactive run).
- **Path (default):** `data/recommendations.json`
- **Use:** Reproducibility and downstream notebooks (`src/visualize_recommendations.py`).

## In-memory results (web)

- **Role:** The wizard stores **recommendation results in server memory** (`_results_store` in `app.py`) keyed by a session/result id.
- **Limitation:** **Restart the Flask process** and those results are **gone**; the **ranking and sorting methods** are the reproducible part for your data science report, not a permanent server-side log unless you add persistence later.

## CLI and web: same inputs → same behaviour

- For comparable inputs (same library file, same vocal profiles, same filters), the **recommendation engine** uses the same `src/recommend` helpers for terminal and web. Document any intentional difference in your methods section (e.g. different filters in CLI vs web).
