# Tasks (granular backlog)

**Spec role:** Break **[`spec/plan.md`](spec/plan.md)** and unchecked **[`spec/user-stories.md`](spec/user-stories.md)** items into small work units (**~1–2 hours** when possible) with a **testable outcome**. Suggested: track with a **coding model** or your issue tracker; **ID**s stay stable for thesis notes.

**Rules**

- Every task should reference at least one **story** (e.g. D3, F, G) or **constitution** clause where applicable.  
- Check `[x]` when done. Do not check **user story** epics in [`spec/user-stories.md`](spec/user-stories.md) until acceptance criteria and relevant tasks here are satisfied.  
- Implement phase = pick tasks → code → [`testing/manual-test.md`](testing/manual-test.md) (and `pytest` when G is live).

**How to pick work:** top-to-bottom within a milestone, or by story (e.g. all **F** before public Docker demo).

---

## Spec & docs hygiene

- [ ] **T-S01** (Constitution) — Review [`spec/constitution.md`](spec/constitution.md) §6 **Open** table; fill *Exact public vs git visibility* when you decide.  
- [ ] **T-S02** (traceability) — If you add [`DATA.md`](DATA.md), link it from root `README.md` and Epic E in [`spec/user-stories.md`](spec/user-stories.md).  
- [x] **T-S03** (D) — Cross-link root `README.md` “Web app” section to [`testing/manual-test.md`](testing/manual-test.md) for testers.

---

## Manual verification (before or alongside automated tests)

- [ ] **T-M01** (D) — Run full [`testing/manual-test.md`](testing/manual-test.md) § Web happy path; note any mismatch; fix stories or code.  
- [ ] **T-M02** (D3) — [`testing/manual-test.md`](testing/manual-test.md) § Save failure / validation; confirm 400 path if exercised.  
- [ ] **T-M03** (A/B) — [`testing/manual-test.md`](testing/manual-test.md) § CLI smoke for the commands you cite in the thesis.  

---

## Web / API hardening

- [ ] **T-W01** (D3) — Confirm `POST /api/save-profile/0` with out-of-range MIDI returns **400** and JSON `{ok: false, error: ...}`.  
- [ ] **T-W02** (D3) — Confirm failed save does **not** navigate to the next step (manual).  
- [ ] **T-W03** (D1) — Document or implement friendly behavior when `data/all_tessituragrams.json` is missing on `GET /`.  
- [ ] **T-W04** (Constitution §2) — `SECRET_KEY` from environment for non-local deploys; document in README.  

---

## Data & thesis reproducibility

- [ ] **T-D01** (E) — Add [`DATA.md`](DATA.md): what each file in `data/` is, provenance, approximate size, redistributability.  
- [ ] **T-D02** (E) — If library JSON is not in git, document how to obtain or build it in **one** canonical place.  

---

## Automated tests (Epic G)

- [ ] **T-A01** (G) — Add `pytest` + `tests/` layout; document in README.  
- [ ] **T-A02** (G) — Unit tests: `_parse_profile_payload` valid + invalid (refactor to `src/` if needed for import hygiene).  
- [ ] **T-A03** (D1) — Flask `test_client`: e.g. `GET /` with a minimal temp library (may need injectable `LIBRARY_PATH`).  
- [ ] **T-A04** (G) — At least one test: invalid `POST /api/save-profile/0` → 400 + JSON `error` (satisfies `spec/user-stories` G).  

---

## Deployment (Epic F)

- [ ] **T-P01** (F) — `Dockerfile` runs the web app from repo root; `docker build` verified locally.  
- [ ] **T-P02** (F) — `.dockerignore` excluding `.venv`, `__pycache__`, `.git`, large artifacts.  
- [ ] **T-P03** (F) — `docker-compose.yml`: port map, optional **volume** for `data/`; **README** documents `SECRET_KEY` + mount paths.  
- [ ] **T-P04** (F) — After T-P01–P03, tick **[`spec/user-stories.md`](spec/user-stories.md) Epic F** acceptance rows and re-run [`testing/manual-test.md`](testing/manual-test.md) web path against the container.  

---

## Nice-to-have (do not block thesis)

- [ ] **T-N01** — `gunicorn` (or Windows-suitable server) in Docker image.  
- [ ] **T-N02** — GitHub Actions: run `pytest` on push.  

---

*Add task IDs (`T-…`) when you split work; keep completed rows checked for an audit trail.*
