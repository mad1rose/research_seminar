# Plan — from user stories to code

**Purpose:** Map each **epic** in [`user-stories.md`](user-stories.md) to **concrete code, data, and risks**, and state **which stories** the work satisfies. Use this when breaking work for implementation (suggested: **coding model** for file-level edits; keep `user-stories` / constitution updates with a reasoning model when possible).

**Rule:** If you add routes, change JSON paths, or change scoring, update the row for that epic and the linked acceptance criteria in [`user-stories.md`](user-stories.md).

---

## Traceability (story → plan)

| User story (see [user-stories](user-stories.md)) | This document |
|------------------------------------|---------------|
| Epic A | [§ A](#epic-a--cli-build-tessituragrams) |
| Epic B | [§ B](#epic-b--cli-interactive-recommendations) |
| Epic C | [§ C](#epic-c--notebooks--visualization) |
| Epic D (D1–D5) | [§ D](#epic-d--web-wizard-flask) |
| Epic E | [§ E](#epic-e--data--reproducibility) |
| Epic F | [§ F](#epic-f--deployment--docker--hosting) |
| Epic G | [§ G](#epic-g--automated-quality) |

**Implementation loop:** *Constitution* → *User stories* (acceptance) → *This plan* → *[tasks](../tasks.md)* → code → *[manual test](../testing/manual-test.md)* → check boxes in [`user-stories.md`](user-stories.md).

---

## Epic A — CLI: build tessituragrams

**Satisfies:** [user-stories](user-stories.md) Epic A (and supports thesis data pipeline).

| Item | Detail |
|------|--------|
| **Entry** | `python -m src.main` |
| **Key modules** | `src/main.py`, `src/parser.py`, `src/tessituragram.py`, `src/metadata.py`, `src/storage.py` |
| **Inputs** | `.mxl` under `songs/mxl_songs/` (default; override via `--input-dir` in `src/main.py`) |
| **Default output** | `data/tessituragrams.json` (`--output`; merges with existing file if present) |
| **Risks** | music21 edge cases; large batch runtime |

---

## Epic B — CLI: interactive recommendations

**Satisfies:** [user-stories](user-stories.md) Epic B; must stay **consistent** with web ranking when inputs match (per constitution).

| Item | Detail |
|------|--------|
| **Entry** | `python -m src.run_recommendations` |
| **Key modules** | `src/run_recommendations.py`, `src/recommend.py`, `src/storage.py` |
| **Inputs** | `data/all_tessituragrams.json` (default library path) |
| **Default output** | `data/recommendations.json` (confirm in `run_recommendations.py` if you change) |
| **Risks** | Path assumptions; ensemble filtering must match **web** expectations for comparable results |

---

## Epic C — Notebooks / visualization

**Satisfies:** [user-stories](user-stories.md) Epic C.

| Item | Detail |
|------|--------|
| **Entry** | `python -m src.visualize`, `python -m src.visualize_recommendations` |
| **Key modules** | `src/visualize.py`, `src/visualize_recommendations.py`, `nbformat` |
| **Inputs** | JSON libraries / recommendation outputs per script help text |
| **Default outputs** | `.ipynb` in project root (verify in each module’s `if __name__` / docs) |
| **Risks** | Plotly CDN vs offline; large notebooks |

---

## Epic D — Web wizard (Flask)

**Satisfies:** [user-stories](user-stories.md) Stories D1–D5 (ensemble → names → profile → summary → results).

| Item | Detail |
|------|--------|
| **Entry** | `python app.py` from repo root (or `flask` CLI as documented) |
| **Key modules** | `app.py`; `templates/*.html`; `static/js/*.js`, `static/css/style.css` |
| **Data** | `data/all_tessituragrams.json` — `LIBRARY_PATH` in `app.py` |
| **Session** | `num_parts`, `ensemble_label`, `singer_names`, `profiles`, `result_id` |
| **In-memory stores** | `_results_store`, `_charts_store` — **cleared on process restart**; document in README/thesis |
| **API** | `POST /api/save-profile/<index>` — JSON body; validate with `_parse_profile_payload` |
| **Risks** | `SECRET_KEY` for non-local deploy; no CSRF on JSON API in v1 (document risk) |

**Request flow (satisfies D1–D5 at a high level)**

```text
GET  /                    → load library → ensemble types → index
POST /select-ensemble     → session reset → redirect /names
POST /save-names          → redirect /profile/0
GET  /profile/<n>         → names + profile_page_config
POST /api/save-profile/n  → validate → session['profiles']
GET  /summary             → cards; POST find-recommendations → score → redirect /results
GET  /results             → paginate from in-memory store by session/result id
```

---

## Epic E — Data & reproducibility

**Satisfies:** [user-stories](user-stories.md) Epic E.

| Item | Detail |
|------|--------|
| **Artifacts** | `data/*.json`; add [`../DATA.md`](../DATA.md) when you formalize (see [tasks T-D01](../tasks.md)) |
| **Risks** | Large files in git; licensing; thesis need for **cited** commit or dataset note |

---

## Epic F — Deployment (Docker / hosting)

**Satisfies:** [user-stories](user-stories.md) Epic F.

| Item | Detail |
|------|--------|
| **Status** | Add `Dockerfile`, `.dockerignore`, and `docker-compose.yml` per [tasks](../tasks.md) (T-P01–T-P03) until acceptance criteria are met. |
| **Target** | Docker on laptop (Windows first-class for now); document `SECRET_KEY` and `data/` volume. |
| **Risks** | Host port binding; **mount** `data/all_tessituragrams.json` (or `data/`) into the container at the path `app.py` expects |

---

## Epic G — Automated quality

**Satisfies:** [user-stories](user-stories.md) Epic G.

| Item | Detail |
|------|--------|
| **Targets** | `pytest` — `_parse_profile_payload`, `_session_singer_names`, scoring invariants, Flask `test_client` for `/` and `save-profile` |
| **Risks** | Do not load the full library in every test; use a **tiny** JSON fixture |

---

*When Docker or CI lands, add exact commands to § F and a one-liner in [`../README.md`](../README.md).*
