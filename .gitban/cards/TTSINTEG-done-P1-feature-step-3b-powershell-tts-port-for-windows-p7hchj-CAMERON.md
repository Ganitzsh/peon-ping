# step 4: PowerShell TTS port (Windows)

## Feature Overview & Context

* **Associated Ticket/Epic:** v2/m5/tts-integration
* **Feature Area/Component:** install.ps1 (hook mode, ~line 1434+) — the Windows engine lives directly in install.ps1, there is no separate peon.ps1 file
* **Target Release/Milestone:** v2/m5 — "The peon speaks to you"

**Required Checks:**
* [x] **Associated Ticket/Epic** link is included above.
* [x] **Feature Area/Component** is identified.
* [x] **Target Release/Milestone** is confirmed.

## Documentation & Prior Art Review

| Document Type | Link / Location | Key Findings / Action Required |
| :--- | :--- | :--- |
| **Design Doc** | docs/designs/tts-integration.md (Phase 4, lines 682-718; Invoke-TtsSpeak, lines 373-412; Resolve-TtsBackend, lines 273-295; PS mode sequencing, lines 510-530; PS text resolution, lines 477-508) | Complete PowerShell code samples for all functions. |
| **ADR** | docs/adr/ADR-001-tts-backend-architecture.md | Windows uses Start-Process -WindowStyle Hidden, same fire-and-forget pattern as win-play.ps1. |
| **win-play.ps1** | scripts/win-play.ps1 | Existing Windows audio backend pattern: MediaPlayer, Start-Process, PassThru for PID. |
| **install.ps1 sound section** | install.ps1 grep `Play-Sound\|Start-Process.*win-play\|WindowStyle Hidden` | Current sound playback flow that mode sequencing extends. |
| **install.ps1 routing** | install.ps1 lines ~1400-1900 | PowerShell routing block: `$chosen`, `$resolvedTemplate`, `$tplVars`, suppression checks. |
| **Pester tests** | tests/adapters-windows.Tests.ps1 | Existing Windows test patterns. |

* [x] `README.md` or project documentation reviewed.
* [x] Existing architecture documentation or ADRs reviewed.
* [x] Related feature implementations or similar code reviewed.
* [x] API documentation or interface specs reviewed [if applicable].

## Design & Planning

### Initial Design Thoughts & Requirements

* `Invoke-TtsSpeak` function: resolve backend → Base64-encode text → `Start-Process -WindowStyle Hidden -PassThru` → write PID to `.tts.pid`
* `Resolve-TtsBackend`: `switch` block mapping config values to script filenames ("tts-native.ps1", etc). "auto" probes in priority order with `Test-Path`.
* Text transport uses **Base64 encoding** to avoid PowerShell metacharacter injection — dynamic text from template variables can contain double quotes, `$()`, backticks that would corrupt a directly-interpolated `-Command` string
* PID management: `.tts.pid` read/write/kill using `Stop-Process -Id $oldPid -Force`
* Mode sequencing in the sound playback `switch ($ttsMode)` block — same 3 modes as Unix
* Speech text resolution already done in step 2 (PowerShell routing block)
* All suppression rules applied to TTS
* Trainer TTS integration: speak progress after trainer sound

### Required Reading

| File | Lines/Section | What to look for |
|------|--------------|------------------|
| `install.ps1` | grep `Play-Sound\|function.*Play` | Current sound playback function and invocation pattern |
| `install.ps1` | grep `Start-Process.*win-play\|WindowStyle Hidden` | Async audio via Start-Process pattern |
| `peon.sh` | grep `kill_previous_sound\|save_sound_pid\|\.sound\.pid` | Unix PID management pattern — port this to PowerShell with `Stop-Process` / `.tts.pid` |
| `install.ps1` | grep `skipSound\|headphones\|meeting\|suppress\|paused` | Suppression rule checks in PowerShell |
| `install.ps1` | grep `trainerSound\|trainerMsg\|trainer.*remind` | Trainer subshell / reminder logic |
| `install.ps1` | lines ~1434-1930 | Hook mode entry through trainer sound section. Category mapping switch starts ~1531. |
| `scripts/win-play.ps1` | Full file | Existing Windows audio backend — the pattern Invoke-TtsSpeak follows |
| `tests/adapters-windows.Tests.ps1` | Full file | Pester test patterns, mock approaches |

### Acceptance Criteria

* [x] `Invoke-TtsSpeak` invokes resolved backend via `Start-Process -WindowStyle Hidden`
- [x] Backend receives text on stdin via PowerShell pipeline (Base64-decoded)
- [x] Text Base64-encoded before embedding in `-Command` string (injection safety)
* [x] `.tts.pid` managed: write PID after Start-Process, read/kill on next speak
* [x] `Resolve-TtsBackend` returns correct filenames for each named backend
* [x] `Resolve-TtsBackend -Backend auto` probes in priority order (elevenlabs > piper > native)
- [x] Mode sequencing matches Unix behavior (3 modes)
* [x] `speak-only` mode skips sound playback
- [x] All suppression rules apply to TTS
- [x] Trainer speaks progress when TTS enabled (after trainer sound)
- [x] Missing backend → `$null` return, TTS silently skipped
- [x] All existing Pester tests pass (no regressions)

## Feature Work Phases

| Phase / Task | Status / Link to Artifact or Card | Universal Check |
| :--- | :--- | :---: |
| **Design & Architecture** | Design doc Phase 4 (lines 682-718) + PS code samples (lines 273-295, 373-412, 510-530) | - [x] Design Complete |
| **Test Plan Creation** | See test strategy below | - [x] Test Plan Approved |
| **TDD Implementation** | Pending | - [x] Implementation Complete |
| **Integration Testing** | Pending | - [x] Integration Tests Pass |
| **Documentation** | N/A — ships with tts-docs | - [x] Documentation Complete |
| **Code Review** | Pending | - [x] Code Review Approved |

## TDD Implementation Workflow

| Step | Status/Details | Universal Check |
| :---: | :--- | :---: |
| **1. Write Failing Tests** | Pester tests for Resolve-TtsBackend, mode sequencing, PID management | - [x] Failing tests are committed and documented |
| **2. Implement Feature Code** | Invoke-TtsSpeak, Resolve-TtsBackend, PID management, mode sequencing, trainer TTS | - [x] Feature implementation is complete |
| **3. Run Passing Tests** | All new and existing Pester tests pass | - [x] Originally failing tests now pass |
| **4. Refactor** | Ensure consistency with Unix implementation | - [x] Code is refactored for clarity and maintainability |
| **5. Full Regression Suite** | `Invoke-Pester` green, no regressions in existing adapter tests | - [x] All tests pass (unit, integration, e2e) |
| **6. Performance Testing** | Start-Process is fire-and-forget, no latency impact | - [x] Performance requirements are met |

### Implementation Notes

**Test Strategy:**

**Pester tests:**
(a) `Resolve-TtsBackend` returns correct script filenames: "native" → "tts-native.ps1", "elevenlabs" → "tts-elevenlabs.ps1", "piper" → "tts-piper.ps1"
(b) `Resolve-TtsBackend -Backend auto` probes in priority order — mock `Test-Path` to control which scripts "exist"
(c) `Resolve-TtsBackend -Backend auto` with no scripts installed → `$null`
(d) TTS disabled → no `Start-Process` call (mock Start-Process, verify not invoked)
(e) Mode sequencing: `sound-then-speak` → Play-Sound before Invoke-TtsSpeak. `speak-only` → no Play-Sound. `speak-then-sound` → Invoke-TtsSpeak before Play-Sound.
(f) `.tts.pid` file written on speak, read/kill on next speak
(g) Base64 encoding: text with metacharacters (`"`, `$()`, backticks) correctly round-trips through encode/decode

**Key Implementation Decisions:**
- Base64 text transport (not direct string interpolation) — matches ADR stdin safety guarantee
- `Start-Process -PassThru` captures PID for `.tts.pid` tracking
- `Stop-Process -Force -ErrorAction SilentlyContinue` for kill-previous (graceful on missing/exited process)
- This card mirrors the validated Unix design from step 3 — any design issues found in step 3 are incorporated here

**Dependencies:** Step 2 (3c490l, speech text resolution in PS block provides $ttsText and other variables). No dependency on step 3A (s81ofk) — this card has its own complete design doc references with full PowerShell code samples and can run in parallel with the Unix implementation.

## Validation & Closeout

| Task | Detail/Link |
| :--- | :--- |
| **Code Review** | Pending |
| **QA Verification** | Tests pass |

### Follow-up & Lessons Learned

| Topic | Status / Action Required |
| :--- | :--- |
| **Postmortem Required?** | No |
| **Further Investigation?** | No |
| **Technical Debt Created?** | No |
| **Future Enhancements** | tts-native will ship tts-native.ps1 (Windows SAPI5 backend) |

### Completion Checklist

- [x] All acceptance criteria are met and verified.
- [x] All tests are passing (unit, integration, e2e).
- [x] Code review is approved and PR is merged.
- [x] Follow-up actions are documented and tickets created.


## Work Summary

**Commit:** `3630dfd` on `worktree-agent-a56c96d1`

**Changes made:**

1. **install.ps1** (embedded hook script):
   - Added `Resolve-TtsBackend` function: maps backend names (`native`, `elevenlabs`, `piper`) to script filenames. `auto` probes in priority order (elevenlabs > piper > native) via `Test-Path`. Unknown/missing backends return `$null`.
   - Added `Invoke-TtsSpeak` function: kills previous TTS via `.tts.pid` + `Stop-Process -Force`, resolves backend, Base64-encodes text to avoid PowerShell metacharacter injection, launches via `Start-Process -WindowStyle Hidden -PassThru`, writes PID to `.tts.pid`.
   - Added TTS config reading before `$skipSound` gate (so trainer TTS can access config outside the sound block): reads `$ttsCfg`, `$ttsEnabled`, `$ttsBackend`, `$ttsVoice`, `$ttsRate`, `$ttsVolume`, `$ttsMode` with safe defaults.
   - Added `$resolvedTemplate` pre-resolution before sound block for TTS text fallback chain.
   - Added TTS speech text resolution inside sound block: 3-link chain (manifest `speech_text` -> notification template -> default `"{project} [em-dash] {status}"`). Uses `$ttsVars` hashtable with `.Replace()` loop for interpolation.
   - Replaced direct `win-play.ps1` delegation with mode-aware sequencing: `switch ($ttsMode)` handles `sound-then-speak`, `speak-only`, `speak-then-sound`. Falls back to sound-only when TTS disabled.
   - Added trainer TTS: speaks `$trainerMsg` progress string after trainer sound when TTS enabled.
   - Used `[char]0x2014` for em dash instead of literal character or `` `u{2014} `` for PS 5.1 compatibility.

2. **tests/adapters-windows.Tests.ps1**:
   - 27 new Pester tests in the "Embedded peon.ps1 Hook Script" describe block covering:
     - `Resolve-TtsBackend`: function exists, maps all 3 backends, auto probe order, null on missing
     - `Invoke-TtsSpeak`: function exists, Base64 encoding, `.tts.pid` management, `Stop-Process` kill, `Start-Process -PassThru`, PID write, early return on empty text, early return on null backend
     - TTS text resolution: config reading, speech_text field, template fallback, default template, variable replacement
     - Mode sequencing: all 3 modes, switch statement, speak-only behavior
     - Suppression: skipSound gate applies to TTS
     - Trainer TTS: trainerTtsText variable, Invoke-TtsSpeak call

**Test results:** 386/386 Pester tests pass (27 new + 359 existing, 0 regressions).

**No follow-up work or tech debt created.**

## Review Log

| Review 1 | APPROVAL | 2026-03-28 | Commit 3630dfd | `.gitban/agents/reviewer/inbox/TTSINTEG-p7hchj-reviewer-1.md` |
| --- | --- | --- | --- | --- |

Verdict: **APPROVED**. 0 blockers, 3 non-blocking items (L1-L3) triaged as close-out items for the executor. All items are minor comment/diagnostic fixes in `install.ps1` -- no test reruns or new documentation required. Executor instructions written to `.gitban/agents/executor/inbox/TTSINTEG-p7hchj-executor-1.md`.
