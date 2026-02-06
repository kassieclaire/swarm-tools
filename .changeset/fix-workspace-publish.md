---
"opencode-swarm-plugin": patch
---

fix(publish): resolve workspace:\* deps before npm publish

`bun publish v1.3.4` silently shipped unresolved `workspace:*` dependencies to npm,
breaking installs of `opencode-swarm-plugin@0.63.0`. Switch CI publish to
`bun pm pack` (which correctly resolves workspace protocol) + `npm publish <tarball>`.

> "I consider any unsolved bug to be an intolerable personal insult"
> — John Ousterhout, A Philosophy of Software Design
