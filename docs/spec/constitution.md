# Constitution — Tessituragram Repertoire Recommender

**Spec stack:** This file is the **first** document in a spec-driven workflow. **Laws** below are non-optional for implementers unless you change this file and the dependent specs in the same change set.  
*Living document. Last revised for: research, teaching, demo, and public deployment (private link, no user accounts).*

**Suggested authoring model (team convention):** Draft and revise **Laws** and high-level **Decisions** with a reasoning-capable model (e.g. **Opus**-class); keep code and [`../tasks.md`](../tasks.md) aligned after edits.

---

## 1. Purpose

**What this project is for**

- Support **data-driven vocal repertoire exploration** using tessituragrams (duration-weighted pitch use in scores).
- Offer a **terminal (CLI)** workflow for building libraries and experiments, and a **browser (Flask)** workflow for interactive recommendations with a piano-based range UI.

**Primary audiences (v1):** thesis / coursework, voice teachers and singers, committee, and **public or invited users** via a **shareable link** (not a login-gated product).

**Access model (v1):** The app may be **reachable on the public internet** for deployment, but the operator may **distribute a private or unlisted URL** so only intended recipients use it. **User accounts and passwords are out of scope** (see §4).

---

## 2. Laws (coders: follow these)

These are **project law**. If implementation disagrees, fix the code or update this constitution and [`user-stories.md`](user-stories.md) / [`plan.md`](plan.md) together.

### 2.1 You must

1. **Ship honest documentation for required data**  
   Document whether `data/all_tessituragrams.json` (and other required inputs) are present in the repo, built via CLI, mounted in Docker, or obtained elsewhere. The web app’s library path is fixed in `app.py` unless you change it **and** document the new contract.

2. **Keep web and CLI behavior aligned where the spec says so**  
   If both paths accept the “same” vocal profile inputs and the same song library, **rankings and sorting** must match within documented numerical tolerance. When they cannot (e.g. different filters), document the difference in [`plan.md`](plan.md) and [`user-stories.md`](user-stories.md).

3. **Surface API validation failures to the UI**  
   Failed `POST /api/save-profile/<index>` must return a **400** with JSON `{ "ok": false, "error": "..." }` and the **profile step must not** navigate as if save succeeded (see `static/js/profile-page.js` design).

4. **Respect the MIDI range contract in specs and code**  
   Default: **MIDI 21–108** for the piano and profile validation. Extensions are allowed **only** if you extend validation, UI, and this document in one coherent change (future-friendly hooks are encouraged).

5. **Track score and data licensing**  
   You are responsible for rights to **scores** (e.g. `.mxl`) and **derived library JSON** (citations, CC0 / academic use, redistribution). Cite OpenScore Lieder and Zenodo where applicable.

6. **Tie “done” to verification**  
   A milestone is not “done” until relevant **[`user-stories.md`](user-stories.md)** acceptance rows are true and **[`../testing/manual-test.md`](../testing/manual-test.md)** (and automated tests, when they exist) pass for that scope.

### 2.2 You must not

1. **Imply production-grade security** while using only the in-repo dev `SECRET_KEY` pattern. If you deploy beyond a **trusted** context, you must use environment-based secrets and document them ([`../tasks.md`](../tasks.md) / root `README`).

2. **Silently succeed on failed profile save** (no redirect to the next step with no error).

3. **Add paid third-party APIs** to the core scoring or parsing path without updating this constitution (offline-first is the default).

4. **Commit unchecked user stories as “finished”** when the implementation or data does not satisfy them. Spec truth beats optimism.

5. **Change library paths, session semantics, or ranking formulas** for thesis-critical behavior without updating [`plan.md`](plan.md), and ideally adding or updating tests.

---

## 3. Non-negotiables (short form)

Same as §2, compressed for skimming:

| Topic | Rule |
|--------|------|
| **Web + multi-part library** | Flask reads `data/all_tessituragrams.json` (see `LIBRARY_PATH` in `app.py`) unless you change and document it. |
| **Sessions** | v1: dev-style secret in code is **OK for local/trusted** use only; set `SECRET_KEY` from the environment for real deployment. |
| **Results lifetime** | In-memory `_results_store` is **OK**; document loss on restart (v1). |
| **MIDI** | 21–108 default; document extensions. |
| **CLI vs web rankings** | Must match when the spec says they use the same inputs. |

---

## 4. Out of scope for v1

- User accounts, passwords, OAuth, email login.  
- Multi-tenant product (many isolated private libraries on one install).  
- Native mobile app.  
- 24/7 uptime SLA.  
- Full legal/compliance program (GDPR, FERPA) unless you **later** collect real PII at scale.  
- **Payments, monetization, and large-scale “production” infra** as a requirement before graduation (per clarifying answers).

**Security roadmap (clarifying answers):** For deployment on **untrusted** networks, **HTTPS, secret key management, CSRF, and rate limiting** are **desired**; v1 may ship with **documented** gaps (e.g. no CSRF on JSON API) as long as risk and follow-up **tasks** are explicit—not hidden.

---

## 5. Quality bar

**From a clean machine (fresh clone, documented Python version, e.g. 3.13.x)**

- Within **5–15 minutes**: install `requirements.txt`, place or build `data/all_tessituragrams.json` as documented, run `python app.py`, open `http://127.0.0.1:5000/` (or `PORT` / `FLASK_HOST` as documented).  
- Within **2–7 minutes**: run at least one documented CLI path (`python -m src.main` and/or `python -m src.run_recommendations`) per README and `how_tos/`.  

**Correctness**

- Every user story in [`user-stories.md`](user-stories.md) has testable acceptance criteria.  
- Automated **pytest** coverage is **expected to grow**; at minimum, critical API validation and scoring helpers (see [`../tasks.md`](../tasks.md)).

**API UX**

- `400` responses from `/api/save-profile/...` include a JSON `error` string the UI can display (already required in §2).

---

## 6. Decisions (resolved; sync with [`../research/clarifying-questions.md`](../research/clarifying-questions.md))

| Topic | Decision |
|--------|----------|
| Primary audience (next 3 months) | Advisor, you, and invited/public users via a shareable experience. |
| `all_tessituragrams.json` in repo | Sourced from OpenScore Lieder–derived work; **cite corpus and license**; confirm redistribution with your program. |
| Public internet | **Yes** — app must be deployable so it is reachable; **no login**; use private/unlisted link for access control. |
| Results after restart | **OK** if in-memory store clears. |
| Accounts | **Not** required. |
| Untrusted network | Hardening **expected**; v1 may document **known gaps** (e.g. CSRF on JSON API acceptable short-term with explicit risk). |
| CLI vs web | **Both** matter; **same** rankings for same inputs where specified. |
| Python | **3.13.5** standardized (verify with `python --version` in docs when you change). |
| Deployment (near term) | **Docker on laptop**; Windows first-class for now. |
| Committee release tag | **No** frozen tag required. |
| Ensemble types | **Only** part counts that **exist in the library** (data-driven). |
| MIDI range extensions | **Future**; design changes so extension is **easy**. |
| Accessibility | **Not** v1; architecture should not block **later** keyboard/screen-reader work. |
| Spec sync | **Weekly** with code. |

**Open (fill when needed)**

| Topic | Decision | Date |
|--------|----------|------|
| Exact public vs git visibility of `data/all_tessituragrams.json` | | |

---

## 7. Governance (solo + future collaborators)

- You are **product owner**; advisor/collaborators may commit—**review** changes against this constitution.  
- When spec and code disagree, **update both** in the same change when possible.  
- Milestones: record “story set complete” in [`../tasks.md`](../tasks.md) or a tag for thesis chapters.

---

*When in doubt, update this file first, then [`user-stories.md`](user-stories.md) and [`plan.md`](plan.md), then code.*
