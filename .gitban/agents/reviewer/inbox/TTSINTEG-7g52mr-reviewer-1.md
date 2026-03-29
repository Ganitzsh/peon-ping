# Review: TTSINTEG-7g52mr-reviewer-1

**Card:** 7g52mr — step-1-tts-config-schema-and-peon-update-backfill
**Sprint:** TTSINTEG
**Commit:** c2ff5ac
**Review number:** 1

## Verdict: APPROVAL

## Summary

The diff is clean and correctly scoped to Phase 1 of the TTS integration design. The `tts` section added to `config.json` has the right 6 keys with safe defaults (`enabled: false`). No changes to `install.sh` were needed because the existing shallow top-level-key merge automatically backfills new keys — this was verified by reading the actual merge logic at lines 614-635. The `install.ps1` change mirrors the JSON structure as a PowerShell hashtable following the established `trainer` pattern. Tests exercise the real Python merge logic (not mocks) and cover both the add-missing and preserve-existing paths.

## Findings

### Non-blocking

- **L1**: The Pester test checks 6 of 7 tts hashtable fields but omits `volume = 0.5`.
- **L2**: README config docs are deferred to the tts-docs card per the design doc. Acceptable given TTS is disabled by default.

## Files Reviewed

- config.json
- install.ps1
- tests/adapters-windows.Tests.ps1
- tests/peon.bats
