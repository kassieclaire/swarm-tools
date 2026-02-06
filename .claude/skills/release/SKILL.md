---
name: release
description: |
  Handles version bumps and npm releases for the opencode-swarm-plugin monorepo.
  Use when: creating changesets, bumping versions, or preparing releases.
  CICD auto-publishes when changesets are pushed - just create changeset and push.
---

# Release Skill

## Quick Release (Recommended)

CICD auto-publishes when changesets exist. Just:

1. **Create changeset**:
   ```bash
   cat > .changeset/my-change.md << 'EOF'
   ---
   "opencode-swarm-plugin": minor
   "claude-code-swarm-plugin": minor
   ---

   feat: description of changes
   EOF
   ```

2. **Commit and push**:
   ```bash
   git add -A && git commit -m "feat: description" && git push
   ```

CI will run `changeset version`, sync plugin.json, build, and publish.

## Version Touchpoints

When bumping versions manually, ALL of these files must be updated:

### opencode-swarm-plugin
- `packages/opencode-swarm-plugin/package.json`
- `packages/opencode-swarm-plugin/claude-plugin/.claude-plugin/plugin.json`

### claude-code-swarm-plugin (thin wrapper)
- `packages/claude-code-swarm-plugin/package.json`
- `packages/claude-code-swarm-plugin/.claude-plugin/plugin.json`

### Other packages (if applicable)
- `packages/swarm-evals/package.json`
- `packages/swarm-mail/package.json`
- `packages/swarm-dashboard/package.json`

## Manual Release (Local Dev Only)

Only needed if CI is broken or you need immediate local publish:

1. `bun run ci:version` - Apply changesets
2. Sync plugin.json versions:
   ```bash
   VERSION=$(cat packages/opencode-swarm-plugin/package.json | jq -r '.version')
   jq ".version = \"$VERSION\"" packages/opencode-swarm-plugin/claude-plugin/.claude-plugin/plugin.json > /tmp/p.json && mv /tmp/p.json packages/opencode-swarm-plugin/claude-plugin/.claude-plugin/plugin.json

   VERSION=$(cat packages/claude-code-swarm-plugin/package.json | jq -r '.version')
   jq ".version = \"$VERSION\"" packages/claude-code-swarm-plugin/.claude-plugin/plugin.json > /tmp/p.json && mv /tmp/p.json packages/claude-code-swarm-plugin/.claude-plugin/plugin.json
   ```
3. `cd packages/opencode-swarm-plugin && bun run build`
4. `npm publish --access public` (in each package dir)
5. `git add -A && git commit -m "release: v$VERSION" && git push`

## Gotchas

- **plugin.json NOT auto-bumped** - CI handles this, but manual requires jq sync
- **Two plugins**: `opencode-swarm-plugin` (full) and `claude-code-swarm-plugin` (thin MCP wrapper)
- **Marketplace cache** - Users may need to uninstall/reinstall for updates
