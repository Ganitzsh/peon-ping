Use `.venv/Scripts/python.exe` to run Python commands.

===BEGIN REFACTORING INSTRUCTIONS===

### B1: `run_peon_tts` helper sets TTS config via environment variables, but Python `eval` overwrites them -- all 13 tests are broken

The `run_peon_tts` helper in `tests/setup.bash` (line 419) exports `TTS_ENABLED=true`, `TTS_TEXT`, `TTS_MODE`, etc. as environment variables before invoking `peon.sh`. However, `peon.sh` line 3904 runs `eval "$_PEON_PYOUT"`, and the Python block at line 3827 computes:

```python
tts_enabled = tts_cfg.get('enabled', False) and not paused
```

Since the test `config.json` has no `tts` section, `tts_cfg.get('enabled', False)` returns `False`, and the Python block outputs `TTS_ENABLED=false` (line 3894). The `eval` unconditionally overwrites the exported env var with `false`. This means `_do_tts` in `_run_sound_and_notify` is always `false` for every test in `tts.bats`, and `speak()` is never called.

Every test that asserts `tts_was_called` will fail. Every test that asserts `! tts_was_called` will pass vacuously (TTS is never called because it is disabled, not because the suppression rule worked).

The same issue affects `TTS_TEXT`, `TTS_MODE`, `TTS_BACKEND`, `TTS_VOICE`, `TTS_RATE`, `TTS_VOLUME` -- all are overwritten by the Python block's output.

**Refactor plan**: `run_peon_tts` must write a `tts` section to the test `config.json` (same pattern used by the TTS resolution tests in `peon.bats` at line 3897) rather than relying on environment variable injection. For example:

```bash
run_peon_tts() {
  local json="$1"
  local tts_text="${2:-Hello world}"
  local tts_mode="${3:-sound-then-speak}"
  local tts_enabled="${4:-true}"
  # Write TTS config to config.json so Python block picks it up
  /usr/bin/python3 -c "
import json
cfg = json.load(open('$TEST_DIR/config.json'))
cfg['tts'] = {
  'enabled': $( [ "$tts_enabled" = "true" ] && echo "True" || echo "False" ),
  'backend': 'native',
  'voice': 'default',
  'rate': 1.0,
  'volume': 0.5,
  'mode': '$tts_mode'
}
json.dump(cfg, open('$TEST_DIR/config.json', 'w'))
"
  export PEON_TEST=1
  echo "$json" | bash "$PEON_SH" 2>"$TEST_DIR/stderr.log"
  PEON_EXIT=$?
  PEON_STDERR=$(cat "$TEST_DIR/stderr.log" 2>/dev/null)
}
```

The `TTS_TEXT` issue is separate -- speech text is resolved by the Python block from manifest/template sources, not from env vars. Tests that need specific text content should set up the manifest `speech_text` field or notification template. The `run_peon_tts` helper's `tts_text` parameter is currently dead code.

This is the only blocker, but it invalidates the entire test file. None of the 13 tests exercise what they claim to.

### B2: Checked checkbox "All suppression rules (headphones_only, meeting_detect, suppress_sound_when_tab_focused, pause) apply to TTS" -- `suppress_sound_when_tab_focused` has no test

The card's acceptance criteria checks this box as done. The test plan in the card specifies "(h) Suppression active (headphones_only, meeting_detect, tab_focused) -> TTS suppressed same as sound." The implementation correctly applies all three rules (the suppression checks are hoisted above the TTS_MODE case block at line 4061-4075, so they apply to both sound and TTS). But only two of the three are tested: `headphones_only` and `meeting_detect`. There is no test for `suppress_sound_when_tab_focused` suppressing TTS.

The implementation is correct, but the TDD contract requires the test to exist. A checked box saying "all suppression rules apply" without a test for one of them is incomplete.

**Refactor plan**: Add a test case that sets `suppress_sound_when_tab_focused=true` in config, mocks `terminal_is_focused` to return true, and verifies both `! afplay_was_called` and `! tts_was_called`.
