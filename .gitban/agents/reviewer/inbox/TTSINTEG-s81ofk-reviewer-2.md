---
verdict: APPROVAL
card_id: s81ofk
review_number: 2
commit: 17f8576
date: 2026-03-28
has_backlog_items: false
---

## Review Summary

This commit fixes both blockers from review 1. The changes are limited to test infrastructure (`tests/setup.bash` and `tests/tts.bats`) -- no production code was modified.

**B1 resolution (env var overwrite): Correct.** `run_peon_tts` now writes the `tts` section directly into `config.json` via a Python one-liner and injects `speech_text` into manifest entries. This matches how `peon.sh`'s Python eval block actually resolves TTS configuration. The helper correctly uses `json.load`/`json.dump` round-tripping, so pre-existing config keys (like `headphones_only` set by suppression tests before calling `run_peon_tts`) are preserved. The `speech_text` injection uses `json.dumps()` for safe quoting of the text value, handling shell metacharacters correctly.

**B2 resolution (missing suppress_sound_when_tab_focused test): Correct.** New test at line 116 sets `suppress_sound_when_tab_focused: true` in config, writes a `.mock_terminal_focused` fixture, and verifies both `! afplay_was_called` and `! tts_was_called`. This completes the suppression rule coverage that the card's acceptance criteria claimed.

**Bonus fix: TaskComplete -> Stop.** All 13 original test events used `TaskComplete`, which is not a real Claude Code hook event. The Python block would have early-exited on unrecognized events, meaning tests never reached the sound/TTS code path. All events are now `Stop` with `permission_mode` included, matching the actual hook payload shape. This is a significant correctness fix -- without it, even the config.json approach would not have produced meaningful test results.

**Auto backend test refactored.** The `auto` backend test now writes config and manifest inline rather than going through `run_peon_tts` (which hardcodes `backend: 'native'`). This duplicates ~10 lines of config/manifest setup, but the alternative would be adding a fifth parameter to `run_peon_tts` for a single test. Acceptable tradeoff.

**Trainer test fix.** Removed the dead `TRAINER_TTS_TEXT` env var export (same overwrite bug as B1). The assertion now checks for `"pushups"` in the TTS log, which is what the Python block computes from the trainer state (`reps: {pushups: 0}`). This tests the actual end-to-end behavior rather than a pre-baked env var.

**Empty text test.** Changed from passing empty string to passing an em-dash character as `speech_text`. The Python block (line 3851) explicitly treats a resolved text of just `"\u2014"` as empty -- this is the fallback template `{project} \u2014 {status}` when both vars resolve empty. The test now exercises this real code path rather than relying on an env var that was never read.

**Checkbox integrity:** All checked boxes are truthful. Unchecked boxes (integration tests pass, full regression suite, code review approved) are correctly gated on CI execution and this review.

**ADR compliance:** ADR-001 specifies text on stdin, voice/rate/volume as args. The tests verify this calling convention (lines 18-27 check arg order, lines 29-36 check stdin text delivery). No architectural deviations.

## FOLLOW-UP

No new follow-up items. L1-L3 from review 1 remain valid as previously filed.
