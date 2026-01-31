---
"swarm-mail": patch
"swarm-tools": patch
"opencode-swarm-plugin": patch
---

Add SKOS taxonomy extraction to hivemind memory system

- SKOS entity taxonomy with broader/narrower/related relationships
- LLM-powered taxonomy extraction wired into adapter.store()
- Entity extraction now includes prefLabel and altLabels
- New CLI commands: `swarm memory entities`, `swarm memory entity`, `swarm memory taxonomy`
- Moltbot plugin: decay tier filtering, entity-aware auto-capture
- HATEOAS-style hints in hivemind tool responses
