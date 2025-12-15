---
"opencode-swarm-plugin": patch
---

Fix workspace:* protocol not being resolved before npm publish

Changed swarm-mail dependency from `workspace:*` to `^0.1.0` so npm can resolve it.
