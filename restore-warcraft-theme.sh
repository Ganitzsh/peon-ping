#!/bin/bash
# Restore the custom Warcraft 3 overlay theme after an install or upgrade.
# Works for both Homebrew and local (--local) installs.
# Run: bash restore-warcraft-theme.sh

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Homebrew install ---
BREW_SCRIPTS=""
if BREW_PREFIX="$(brew --prefix peon-ping 2>/dev/null || brew --prefix PeonPing/tap/peon-ping 2>/dev/null)" 2>/dev/null; then
  BREW_SCRIPTS="$BREW_PREFIX/libexec/scripts"
fi

if [ -n "$BREW_SCRIPTS" ] && [ -d "$BREW_SCRIPTS" ]; then
  echo "Restoring Warcraft theme to Homebrew install ($BREW_SCRIPTS) ..."
  cp "$REPO_DIR/scripts/mac-overlay-warcraft.js" "$BREW_SCRIPTS/mac-overlay-warcraft.js"
  cp "$REPO_DIR/scripts/warcraft-bg.png" "$BREW_SCRIPTS/warcraft-bg.png"
  echo "  Copied mac-overlay-warcraft.js + warcraft-bg.png"

  if grep -q 'warcraft' "$BREW_SCRIPTS/notify.sh"; then
    echo "  notify.sh already has warcraft registered"
  else
    sed -i '' 's/jarvis|glass|sakura)/jarvis|glass|sakura|warcraft)/' "$BREW_SCRIPTS/notify.sh"
    echo "  Registered warcraft in notify.sh"
  fi
fi

# --- Local install (--local) ---
LOCAL_SCRIPTS="$REPO_DIR/.claude/hooks/peon-ping/scripts"
if [ -d "$LOCAL_SCRIPTS" ]; then
  echo "Restoring Warcraft theme to local install ($LOCAL_SCRIPTS) ..."
  cp "$REPO_DIR/scripts/mac-overlay-warcraft.js" "$LOCAL_SCRIPTS/mac-overlay-warcraft.js"
  cp "$REPO_DIR/scripts/warcraft-bg.png" "$LOCAL_SCRIPTS/warcraft-bg.png"
  echo "  Copied mac-overlay-warcraft.js + warcraft-bg.png"
fi

# --- Peasant icon ---
for packs_dir in "$REPO_DIR/.claude/hooks/peon-ping/packs" "$HOME/.claude/hooks/peon-ping/packs"; do
  peasant_dir="$packs_dir/peasant"
  if [ -d "$peasant_dir" ] && [ ! -f "$peasant_dir/icon.png" ]; then
    if [ -f "$HOME/Downloads/peasant.gif" ]; then
      cp "$HOME/Downloads/peasant.gif" "$peasant_dir/icon.png"
      echo "  Copied peasant icon to $peasant_dir"
    fi
  fi
done

# --- Config: set overlay_theme and default_pack ---
for cfg in "$REPO_DIR/.claude/hooks/peon-ping/config.json" "$HOME/.claude/hooks/peon-ping/config.json"; do
  if [ -f "$cfg" ]; then
    python3 -c "
import json
with open('$cfg') as f:
    cfg_data = json.load(f)
changed = False
if cfg_data.get('overlay_theme') != 'warcraft':
    cfg_data['overlay_theme'] = 'warcraft'
    changed = True
if cfg_data.get('default_pack') != 'peasant':
    cfg_data['default_pack'] = 'peasant'
    changed = True
if changed:
    with open('$cfg', 'w') as f:
        json.dump(cfg_data, f, indent=2)
    print('  Updated $cfg')
else:
    print('  $cfg already configured')
"
  fi
done

echo "Done! Warcraft theme restored."
