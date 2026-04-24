# Specification (`spec/`)

This directory holds the **core product spec** in fixed order. Edit these when scope or policy changes; then align [`../tasks.md`](../tasks.md) and code.

| Order | File | Role |
|------|------|------|
| 1 | [`constitution.md`](constitution.md) | Laws: **you must** / **you must not** |
| 2 | [`user-stories.md`](user-stories.md) | **User must be able to** — acceptance criteria |
| 3 | [`plan.md`](plan.md) | **Implementation map**: code paths, data, epics A–G |

**Typical model:** reasoning-focused models for (1)–(2); coding-focused models to keep (3) aligned with the actual repo.

**After changing spec:** run [`../testing/manual-test.md`](../testing/manual-test.md) and update checkboxes in `user-stories.md`.

---

**Related (outside this folder):**

- [`../tasks.md`](../tasks.md) — granular backlog
- [`../testing/manual-test.md`](../testing/manual-test.md) — verification
- [`../research/clarifying-questions.md`](../research/clarifying-questions.md) — Q&A; durable decisions are summarized in `constitution.md` § 6
