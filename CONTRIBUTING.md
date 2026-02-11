# Contributing to peon-ping

Want to add a sound pack? We'd love that.

## Add a new sound pack

Sound files are version-controlled in the repo. No external downloads needed.

### 1. Create your pack

```
packs/<name>/
  manifest.json
  sounds/
    SomeSound.wav
    AnotherSound.mp3
    ...
```

Audio formats: WAV, MP3, or OGG. Keep files small (game sound effects are ideal).

### 2. Write the manifest

Map your sounds to categories. See `packs/peon/manifest.json` for the full example:

```json
{
  "name": "my_pack",
  "display_name": "My Character",
  "categories": {
    "greeting": {
      "sounds": [
        { "file": "Hello.mp3", "line": "Hello there" }
      ]
    },
    "acknowledge": {
      "sounds": [
        { "file": "OnIt.mp3", "line": "On it" }
      ]
    },
    "complete": {
      "sounds": [
        { "file": "Done.mp3", "line": "Done" }
      ]
    },
    "error": {
      "sounds": [
        { "file": "Oops.mp3", "line": "Oops" }
      ]
    },
    "permission": {
      "sounds": [
        { "file": "NeedHelp.mp3", "line": "Need your help" }
      ]
    },
    "resource_limit": {
      "sounds": [
        { "file": "Blocked.mp3", "line": "Blocked" }
      ]
    },
    "annoyed": {
      "sounds": [
        { "file": "StopIt.mp3", "line": "Stop it" }
      ]
    }
  }
}
```

**Categories explained:**

| Category | When it plays |
|---|---|
| `greeting` | Session starts (`$ claude`) |
| `acknowledge` | Claude acknowledges a task |
| `complete` | Claude finishes and is idle |
| `error` | Something fails |
| `permission` | Claude needs tool approval |
| `resource_limit` | Resource limits hit |
| `annoyed` | User spams prompts (3+ in 10 seconds) |

Not every category is required — just include the ones you have sounds for.

### 3. Add your pack to install.sh

Add your pack name to the `PACKS` variable:

```bash
PACKS="peon ra2_soviet_engineer my_pack"
```

### 4. Bump the version

We use [semver](https://semver.org/). Edit the `VERSION` file in the repo root:

- **New sound pack** → bump the patch version (e.g. `1.0.0` → `1.0.1`)
- **New feature** (new hook event, config option) → bump the minor version (e.g. `1.0.1` → `1.1.0`)
- **Breaking change** (config format change, removed feature) → bump the major version

Users with an older version will see an update notice on session start.

### 5. Add web audio (optional)

If you want your sounds playable on the landing page, copy them to `docs/audio/`.

### 6. Submit a PR

That's it. We'll review and merge.

## Generate a preview video

There's a [Remotion](https://remotion.dev) project in `video/` that generates a terminal-style preview video showing a simulated Claude Code session with your sounds.

1. Copy your sound files to `video/public/sounds/`
2. Edit `video/src/SovietEngineerPreview.tsx` — update the `TIMELINE` array with your sounds, quotes, and categories
3. Install deps and render:

```bash
cd video
npm install
npx remotion render src/index.ts SovietEngineerPreview out/my-pack-preview.mp4
```

The video shows typed commands in a terminal with your sounds playing at each hook event.

## Pack ideas

We'd love to see these (or anything else):

- Human Peasant ("Job's done!")
- Night Elf Wisp
- Undead Acolyte
- Protoss Probe
- SCV
- GLaDOS
- Navi ("Hey! Listen!")
- Clippy
