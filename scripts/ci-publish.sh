#!/usr/bin/env bash
set -euo pipefail

# CI publish script: pack each package (resolving workspace:* deps) then npm publish.
#
# bun pm pack resolves workspace:* → actual versions in the tarball.
# We verify this and fail-fast if any workspace: refs leak through.

PACK_DIR=$(mktemp -d)
trap 'rm -rf "$PACK_DIR"' EXIT

resolve_workspace_deps() {
  local tarball="$1"
  local extract_dir="$PACK_DIR/extract"

  mkdir -p "$extract_dir"
  tar -xzf "$tarball" -C "$extract_dir"

  if grep -q '"workspace:' "$extract_dir/package/package.json"; then
    echo "  ⚠ Found unresolved workspace: deps — resolving from monorepo..."

    # For each workspace:* dep, resolve to the version in the local workspace
    local pkg_json="$extract_dir/package/package.json"
    local tmp_json="$pkg_json.tmp"

    # Get all workspace: dependencies and resolve them
    python3 -c "
import json, os, glob

with open('$pkg_json') as f:
    pkg = json.load(f)

# Find all package dirs in workspace
pkg_versions = {}
for pattern in ['packages/*/package.json', 'apps/*/package.json']:
    for pj in glob.glob(pattern):
        with open(pj) as f:
            p = json.load(f)
            if 'version' in p:
                pkg_versions[p['name']] = p['version']

changed = False
for dep_type in ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']:
    deps = pkg.get(dep_type, {})
    for name, version in list(deps.items()):
        if 'workspace:' in str(version):
            if name in pkg_versions:
                deps[name] = pkg_versions[name]
                print(f'  → {name}: {version} → {pkg_versions[name]}')
                changed = True
            else:
                print(f'  ✗ {name}: {version} — NOT FOUND in workspace!')
                exit(1)

if changed:
    with open('$pkg_json', 'w') as f:
        json.dump(pkg, f, indent=2)
        f.write('\n')
" || return 1

    # Re-pack the tarball with fixed package.json
    (cd "$extract_dir" && tar -czf "$tarball" package/)
    echo "  ✓ Workspace deps resolved"
  fi

  rm -rf "$extract_dir"
}

for dir in packages/*; do
  [ -d "$dir" ] || continue

  pkg_name=$(python3 -c "import json; print(json.load(open('$dir/package.json'))['name'])")
  pkg_private=$(python3 -c "import json; print(json.load(open('$dir/package.json')).get('private', False))")

  if [ "$pkg_private" = "True" ]; then
    echo "⏭ Skipping private package: $pkg_name"
    continue
  fi

  echo "📦 Publishing $pkg_name from $dir..."

  # Pack (this resolves workspace:* on bun >= 1.3.5)
  TARBALL=$(cd "$dir" && bun pm pack --destination "$PACK_DIR" 2>&1 | grep '\.tgz$') || {
    echo "  ✗ Failed to pack $pkg_name"
    continue
  }

  # Safety net: verify and fix any remaining workspace: refs
  resolve_workspace_deps "$TARBALL"

  # Publish
  npm publish "$TARBALL" --access public 2>&1 || {
    echo "  ⚠ Publish failed for $pkg_name (may already exist)"
  }

  rm -f "$TARBALL"
  echo ""
done

# Tag the releases
changeset tag
