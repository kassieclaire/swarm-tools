---
"opencode-swarm-plugin": patch
---

Fix skills_update tool - add `content` parameter as primary (with `body` as backwards-compat alias)

The tool was only accepting `body` but users expected `content`. Now both work:
- `skills_update(name="foo", content="new stuff")` - preferred
- `skills_update(name="foo", body="new stuff")` - still works for backwards compat
