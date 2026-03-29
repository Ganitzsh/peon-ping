# Review: TTSINTEG-3c490l-reviewer-1

**Card:** 3c490l — step-2-speech-text-resolution-in-python-and-powershell-routing-blocks
**Sprint:** TTSINTEG
**Commit:** cac6bb4
**Review number:** 1

## Verdict: APPROVAL

## Summary

The implementation is solid and ADR-001 compliant. The 3-link TTS speech text resolution chain is correctly placed after both sound selection and notification template resolution in both platforms, tests cover all chain paths (8 BATS + 7 Pester), and the 8 output variables match the design doc specification. No blockers.

## Findings

### Non-blocking

- **L1**: PowerShell TTS block duplicates the notification template key resolution logic (the category-to-key mapping exists in both `Resolve-NotificationTemplate` and the new `$ttsKeyMap`). Worth extracting a shared helper if more template keys are added.
- **L2**: PowerShell omits the explicit `$paused` guard from `$ttsEnabled`, diverging from the design doc. Not a functional bug (the PS hook exits early when paused via `$config.enabled = false`), but worth documenting the divergence.
- **L3**: The 8 test-mode file writes in `peon.sh` each evaluate their condition independently on every invocation. Consider grouping them in a single `if` block as more test observability points are added.

## Files Reviewed

- peon.sh
- install.ps1
- tests/peon.bats
- tests/tts-resolution.Tests.ps1
