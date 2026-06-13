---
"@loworbitstudio/visor": patch
---

docs: call Visor's `patterns/` "composition recipes" in prose (BO-50 follow-up)

Aligns Visor's prose with the canonical Borealis vocabulary: the `patterns/*.visor-pattern.yaml` directory holds **composition recipes** — a Components-axis / AI-consumability artifact powering `visor suggest` — distinct from a Playbook design-language **pattern**. Updated `CLAUDE.md`, `CONSUMER_CLAUDE.md`, `docs/ai-consumability.md`, and `README.md`, with a cross-link to the Playbook `GLOSSARY.md` §3 disambiguation. Vocabulary only — no directory, extension, CLI command, or manifest-key rename.
