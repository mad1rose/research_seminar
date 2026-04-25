# User stories

**Spec role:** These are **acceptance-level** requirements. Each story should be testable. Preferred test phrasing: **The user must be able to** \<capability\> (maps 1:1 to the classic **As a / I want / so that** format below).  
**Suggested authoring model (e.g. Opus-class):** Draft stories and acceptance criteria; keep [`plan.md`](plan.md) and [`../tasks.md`](../tasks.md) in sync when scope changes.

**How to verify:** Check boxes when acceptance criteria are true. Use [`../testing/manual-test.md`](../testing/manual-test.md) for hands-on runs; add/extend `pytest` per Epic G and [`../tasks.md`](../tasks.md).

**Status legend:** `[ ]` not started · `[~]` in progress · `[x]` done

**Traceability:** Each epic maps to [`plan.md`](plan.md) (same letter). Implementation order for the **website** is typically Epic D, with A/B/C/E supporting data and methods; F/G are parallel/hardening.

| ID | The user must be able to (summary) | Epic / story |
|----|-----------------------------------|--------------|
| A | Run a CLI on `.mxl` files in a known folder and get tessituragram JSON without crashes; see clear errors when inputs are missing. | Epic A |
| B | Run interactive terminal recommendations when the library JSON exists, and get a stable JSON output for analysis. | Epic B |
| C | Generate and run visualization notebooks for libraries and/or recommendation runs. | Epic C |
| D1 | See ensemble options from real data, land on a clear home when the library is present, and get a clear error when it is not. | D1 |
| D2 | Enter or skip singer names; blanks become sensible labels; any supported part count from the data works (including &gt;8). | D2 |
| D3 | Set range (piano), favorites, avoids, and penalty; saves go through the API; failed saves show an error and do not advance silently. | D3 |
| D4 | Review all profiles and run search only when complete; receive results with many hits paginated. | D4 |
| D5 | View ranked results with detail and charts appropriate for solo vs ensemble. | D5 |
| E | Point readers to which JSON files exist and how they relate to reproducibility / thesis. | Epic E |
| F | (Optional) Run the web app from a container with documented secrets and data. | Epic F |
| G | Rely on automated tests for API and core logic. | Epic G |

---

## Epic A — CLI: build tessituragram library from scores

**As a** researcher, **I want** to run a CLI over `.mxl` files in a fixed folder, **so that** I get a JSON tessituragram library for downstream analysis.

**User must be able to:** run `python -m src.main` successfully when at least one `.mxl` is present; know the output path; understand errors when the folder is empty or missing.

**Acceptance criteria**

- [x] With `songs/mxl_songs/` containing at least one `.mxl`, `python -m src.main` completes without unhandled crash.
- [x] Output path and filename match README / `how_tos` (currently `data/tessituragrams.json` for the main CLI path—confirm in `src/main.py` defaults if you change it).
- [x] Clear message when no `.mxl` files are found (or folder missing).

**Plan:** [plan § A](plan.md#epic-a--cli-build-tessituragrams) · **Tasks:** see [manual test checklist](../testing/manual-test.md) (§ CLI), [`../tasks.md`](../tasks.md) T-M03

---

## Epic B — CLI: interactive recommendations

**As a** singer or researcher, **I want** to answer prompts for range, favorites, and avoids, **so that** I get ranked songs in the terminal and a JSON file.

**User must be able to:** run the recommender only when the library file exists (or read documented alternate); get output suitable for methods/write-up.

**Acceptance criteria**

- [x] `python -m src.run_recommendations` runs only when `data/all_tessituragrams.json` exists (or document alternate path if you parameterize it).
- [x] Output file location and fields are documented and stable enough for your thesis methods section.

**Plan:** [plan § B](plan.md#epic-b--cli-interactive-recommendations)

---

## Epic C — CLI / notebooks: visualization

**As a** researcher, **I want** generated notebooks for tessituragrams and/or recommendations, **so that** I can inspect distributions and scores visually.

**User must be able to:** run the notebook generators and execute cells in a fresh environment with dependencies from `requirements.txt`.

**Acceptance criteria**

- [x] `python -m src.visualize` and `python -m src.visualize_recommendations` run with documented inputs and produce `.ipynb` in the expected location.
- [x] Running all cells in a fresh environment produces plots (dependencies listed in `requirements.txt`).

**Plan:** [plan § C](plan.md#epic-c--notebooks--visualization)

---

## Epic D — Web wizard: ensemble → names → profiles → summary → results

**As a** singer or teacher, **I want** to pick ensemble size, name singers, set each vocal profile on a piano, and get ranked pieces, **so that** I can explore repertoire without the terminal.

### Story D1 — Landing and ensemble choice

**User must be able to:** open the app with a valid library, see only ensemble sizes that exist in the data, and get a **clear** response if the library file is missing or bad.

**As a** user, **I want** to see ensemble types derived from the library with song counts, **so that** I pick a realistic part count.

**Acceptance criteria**

- [x] `/` loads when `data/all_tessituragrams.json` is present.
- [x] If the library file is missing or invalid, the user sees a **clear error** (not a blank page or generic 500—improve incrementally if needed).
- [x] Choosing an ensemble starts the flow (session initialized for that part count).

**Plan:** [plan § D (flow start)](plan.md#epic-d--web-wizard-flask)

---

### Story D2 — Names

**User must be able to:** submit names or leave fields blank; receive default labels **Singer 1…N**; use any part count the **data** supports, including more than eight singers, without template errors.

**As a** user, **I want** to enter names (or skip with defaults), **so that** labels make sense in later screens.

**Acceptance criteria**

- [x] Empty fields become sensible defaults (`Singer N` pattern matches backend).
- [x] Works for any supported part count supported by your data (including >8 singers without template crash—placeholder fix in `names.html`).

**Plan:** [plan § D](plan.md#epic-d--web-wizard-flask)

---

### Story D3 — Profile (piano + avoid penalty)

**User must be able to:** set range before continuing; have profile data saved through `POST /api/save-profile/<index>`; see errors on failure; see prior range when returning to a profile; never see the literal `None` as a name in navigation.

**As a** user, **I want** to set range, favorites, avoid notes, and avoid penalty, **so that** recommendations match my vocal strategy.

**Acceptance criteria**

- [x] Range must be set before “Next” enables (matches piano rules).
- [x] Saving profile calls `/api/save-profile/<index>` with JSON; **on failure** user sees message and **stays** on the page (no silent navigation).
- [x] Valid saves persist in session; returning to profile shows prior range when implemented in session data.
- [x] Back / Next labels never show the literal string `None` for names (session repair + fallbacks).

**Plan:** [plan § D (API)](plan.md#epic-d--web-wizard-flask) · **Tasks:** T-W01–T-W03 in [`../tasks.md`](../tasks.md)

---

### Story D4 — Summary and run recommendations

**User must be able to:** confirm all profiles before search; run search only when complete; open results, with pagination for large result sets.

**As a** user, **I want** to review all profiles and launch search, **so that** I only rank when everyone is complete.

**Acceptance criteria**

- [x] “Find recommendations” is disabled until all profiles complete (or document if behavior changes).
- [x] POST triggers scoring and redirect to results with pagination when many hits.

**Plan:** [plan § D](plan.md#epic-d--web-wizard-flask)

---

### Story D5 — Results (charts + pagination)

**User must be able to:** see solo vs ensemble fields correctly and paginate; understand that results are **in-memory** until you add persistence (documented).

**As a** user, **I want** a ranked list with expandable detail and charts, **so that** I understand why a piece scored well or poorly.

**Acceptance criteria**

- [x] Solo vs ensemble displays correct score fields (`final_score` vs multi-part fields—matches templates).
- [x] Pagination preserves session result id behavior (document: results live in memory on server—**lost on restart**).

**Plan:** [plan § D](plan.md#epic-d--web-wizard-flask)

---

## Epic E — Data, reproducibility, and thesis alignment

**As a** graduate student, **I want** frozen library versions and documented preprocessing, **so that** committee can reproduce findings.

**User must be able to:** read in README (and optionally [`../DATA.md`](../DATA.md)) which files power the web app and CLI, and (optionally) cite a version/hash of the library.

**Acceptance criteria**

- [x] README states which JSON library the web app and CLI use.
- [x] (Optional) Version or hash of `all_tessituragrams.json` noted in thesis supplement or [`../DATA.md`](../DATA.md) when you add it. *(**Note:** `docs/DATA.md` now explains provenance; add a concrete file hash in your thesis or in `DATA.md` when you freeze a run.)*

**Plan:** [plan § E](plan.md#epic-e--data--reproducibility) · **Tasks:** T-D01–T-D02 in [`../tasks.md`](../tasks.md)

---

## Epic F — Deployment & operations (optional until thesis/hosting need)

**As a** operator, **I want** a container (or defined hosting steps) for the web app, **so that** others can run it without a local Python setup.

**User must be able to** (when this epic is in scope): build and run with the **documented** one-command path (e.g. `docker compose up`); set `SECRET_KEY` and mount `data/` per README for non-dev use.

**Acceptance criteria**

- [ ] One command builds and runs (e.g. `docker compose up`) from README — **check only when `Dockerfile` / compose exist and are verified** (see [plan § F](plan.md#epic-f--deployment--docker--hosting), [`../tasks.md`](../tasks.md) T-P01–P03).
- [ ] `SECRET_KEY` and data mounting behavior documented for non-dev use.

**Plan:** [plan § F](plan.md#epic-f--deployment--docker--hosting)

---

## Epic G — Automated quality (grow over time)

**As a** maintainer, **I want** pytest coverage for core logic and API contracts, **so that** refactors do not break scoring silently.

**User must be able to** (when this epic is in scope): run `pytest` from the repo and see tests for at least one invalid `save-profile` payload.

**Acceptance criteria**

- [x] Tests run in CI or locally with one command (`pytest`) — **see [`../tasks.md`](../tasks.md) T-A01+**.
- [x] At least one test for invalid `/api/save-profile` payload returns 400 with JSON error.

**Plan:** [plan § G](plan.md#epic-g--automated-quality)

---

*If any section grows past ~15 criteria, split stories and add a row to the traceability table at the top.*
