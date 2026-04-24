# Clarifying questions (answer in this file or in chat)

**Purpose:** Capture product and thesis assumptions for **non-technical** readers. Fill answers inline (`> Your answer:`) or append a dated section at the bottom.

**Spec stack:** After answering, **merge durable decisions** into [`../spec/constitution.md`](../spec/constitution.md) § 6 (and adjust [`../spec/user-stories.md`](../spec/user-stories.md) / [`../spec/plan.md`](../spec/plan.md) if scope changed). This file stays the **raw Q&A**; the constitution is the **law** developers follow.

**Conflict resolution:** If two answers (e.g. public deploy vs. private link) seem to clash, the **constitution** describes how they combine: e.g. app reachable on the internet + **unlisted URL** + **no accounts** (v1).

---

## A. Audience and success

1. **Who is the single most important user for the next 3 months?** (You / advisor / public / teacher network)  
   > My advisor will be the most important person using this, but I will also be using it, and I would like the public to use it as well.

2. **What does “success” look like in one sentence?** (e.g. “defend thesis,” “public demo link,” “personal practice tool”)  
   > I want this website to impress my professor (he wanted us to do research projects, create a website based on the research, and then use containerization to deploy it)

3. **Will anyone who is not you run this on their machine?** If yes, what is their technical level?  
   > I want anyone (even someone with no technical background) to be able to use this.

---

## B. Data ownership and sharing

4. **Is `data/all_tessituragrams.json` allowed to live in a public GitHub repo?** (copyright / licensing of scores)  
   > All of the tessituragrams were extracted from OpenScore Lieder. This is what I found on the repository for theu "License and acknowledgement: "For academic publications, please cite one of these two as appropriate: "Data directly: The specific release (with DOI) on Zenodo, e.g., https://doi.org/10.5281/zenodo.15450143 the report on this mirror we published in M.E.C. Commentary: Gotham, M. R. H.; and Jonas, P. The OpenScore Lieder Corpus. In Münnich, S.; and Rizo, D., editor(s), Music Encoding Conference Proceedings 2021, pages 131–136, 2022. Humanities Commons. Best Poster Award. https://doi.org/10.17613/1my2-dm23. full bib. @inproceedings{GothamJonas2022, abstract = {The OpenScore Lieder Corpus is a collection of over 1,200 nineteenth century songs encoded by a dedicated team of mostly volunteers over several years. Having reported on the initial phase, motivations, design, and community-oriented aspects of the project before, we present here the first, stable, large-scale release of this corpus specifically designed for MIR researchers, complete with comprehensive, structured, linked metadata. The corpus continues to be available under the open CC0 licence and represents a compelling dataset for a range of MIR tasks, not least given its unusual balance of large-scale with high-quality encoding, and of diversity (songs by over 100 composers, from many countries, and in a range of languages) with unity (centred on the nineteenth-century lieder tradition).},author = {Gotham, Mark Robert Haigh and Jonas, Peter}, title = {{The OpenScore Lieder Corpus}},keywords = {mec-proceedings, mec-proceedings-2021},pages = {131--136},publisher = {{Humanities Commons}}, isbn = {978-84-1302-173-7}, editor = {M{\"u}nnich, Stefan and Rizo, David}, booktitle = {{Music Encoding Conference Proceedings 2021}}, year = {2022}, doi = {10.17613/1my2-dm23}, bibbase_note = {<span style="color: green; font-weight: bold">Best Poster Award.</span>},displayby = {Contributions from MEC 2021}} For some use / interest cases, you may also wish to check out either or both of: our initial 2018 report on the project, and a 2021 discussion: Mark Gotham, Peter Jonas, Bruno Bower, William Bosworth, Daniel Rootham, and Leigh VanHandel. 2018. ‘Scores of Scores: An OpenScore project to encode and share sheet music.’ In Proceedings of the 5th International Conference on Digital Libraries for Musicology (DLfM’18). ACM, New York, NY, USA. https://doi.org/10.1145/3273024.3273026 Gotham, M. Connecting the dots: Recognizing and implementing more kinds of “open science” to connect musicians and musicologists. Empirical Musicology Review 16 (2021). https://doi.org/10.18061/emr.v16i1.7644"" Please make sure to look into this on the internet, and make this choice based on what would be expected and legal.

5. **If the library cannot be public, how will you distribute it?** (USB, Zenodo private link, cloud drive, not at all)  
   > I would like it to be on a private link, but please also make it easy for me to find this public link so i can send it to the people I want to have access to it.

6. **Roughly how large is the library file?** (MB / GB — affects Docker and git)  
   > The file will be as large as all of the the items in this repository that make the website work, plus all of the future updates to the current files, or new files that will be created according to the specifications made in this document.

---

## C. Web app expectations

7. **Is the Flask app only for local demos, or must it be reachable on the public internet?**  
   > I need it to be reachable to the public internet

8. **Are you OK with results disappearing after a server restart?** (Current design: in-memory `_results_store`.) If not, you must add persistence—note priority.  
   > Yes

9. **Do you need accounts / login?** (Constitution says v1 out of scope—confirm still true.)  
   > I do not need accounts

---

## D. Security (honest minimum)

10. **Will the app ever run on a network you do not fully trust?** If yes, list required hardening (HTTPS, secret key, CSRF, rate limits).  
    > Yes, the app may run on an untrusted network (shared via private link). Will require HTTPS, basic secret key management, CSRF protection, and rate limiting.

11. **Is it acceptable that the API has no CSRF token today?** (Typical for local dev; risky for logged-in multi-user sites.)  
    > Yes, acceptable for now

---

## E. CLI vs web priority

12. **Which path is “source of truth” for your thesis: CLI, web, or both equally?**  
    > Both equally

13. **Must CLI and web produce identical rankings for the same inputs?** If yes, you need shared fixtures/tests.  
    > Yes, they should produce identical rankings

---

## F. Python and tooling

14. **What Python version do you standardize on?** (e.g. 3.11, 3.12 — check `python --version`)  
    >  Python 3.13.5

15. **Are you willing to add `pytest` even if it feels heavy?** (Strongly recommended before big refactors.)  
    > Yes

---

## G. Deployment target

16. **Where do you imagine hosting?** (Docker only on laptop / Fly.io / Render / Azure / school server / unknown)  
    > Docker only on laptop

17. **Must Windows be a first-class dev environment forever?** (Affects choice of production server tooling.)  
    > For now, yes

---

## H. Musical / UX truth

18. **Should “ensemble type” options only include part counts that exist in the library, or also show empty options?** (Current: derived from data.)  
    > Only ones in the current database

19. **Is the 88-key MIDI 21–108 range always correct for your repertoire, or do you need extensions?**  
    > I am not sure if I will need extensions, so please make it a future posibility if I need it that would be easy to implement

20. **Any accessibility requirement?** (keyboard-only piano, screen reader — today largely mouse-based)  
    > Not for the moment, but please make sure it would be easy to add if I wanted to in the future.

---

## I. Thesis and evaluation

21. **Will you cite exact software version/commit in the thesis?**  
    > yes

22. **Do you need a frozen “release” tag for the committee?**  
    > No frozen release

23. **What figures in the thesis depend on this repo?** (so tests guard the right behavior)  
    > The ranking and sorting methods for the results

---

## J. Maintenance and collaborators

24. **Will a second person commit code?** If yes, how will you review changes (peer, advisor)?  
    > eventually yes, my advisor (and/or future collaborators) will be commiting code

25. **How often will you realistically sync spec + code?** (weekly / per milestone / only before defense)  
    > weekly

---

## K. Out of scope confirmation

26. **List three things you explicitly will NOT build before graduation.**  
    > 1 = full user authentication system, 2 = payments / monetization system, 3 = scalable production infrastructure

---

## L. Open-ended

27. **What worries you most about this codebase?** (One paragraph.)  
    > I have been told that my codebase looks really solid by my mentor and a couple of peers. However, I did build this with vibe-coding because I have a bachelors degree in music performance and I have never built anything like this before. I know my input for vibecoding was essential because I was ablee to use my domain knowledge when giving instructions and testing how it works, but I want to be cautious because I may not be able to see something that is wrong with it.

28. **What would make you trust a change without fear?** (e.g. “green pytest,” “advisor ran MANUAL_TEST”)  
    > Green pytest results combined with successful manual validation of core workflows (CLI/web consistency and ranking outputs).

---

*When answered, skim [`../spec/constitution.md`](../spec/constitution.md) and [`../spec/user-stories.md`](../spec/user-stories.md) and update any checkbox or sentence that now lies.*
