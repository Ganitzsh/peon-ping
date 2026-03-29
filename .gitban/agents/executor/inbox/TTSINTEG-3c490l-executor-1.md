Use `.venv/Scripts/python.exe` to run Python commands.

The code for the gitban card with id 3c490l has been approved as of commit cac6bb4. Please use the gitban tools to update the gitban card and begin the tasks required to properly complete it.

## Card Close-out tasks:
- Use gitban's checkbox tools to ensure all checkboxes on the card are checked off for completed work if not already.
- Do not mark any work as deferred. This card will be closed and archived and likely never seen again.
- Use gitban's complete card tool to submit and validate if not already completed.
- Close-out item: Add a brief inline comment in `install.ps1` near the TTS resolution block noting that the `$paused` guard is handled implicitly by the early-exit when `$config.enabled = false`, rather than explicitly checked in `$ttsEnabled`. This documents the divergence from the design doc flagged in review finding L2.
- If this card is not in a sprint, push the feature branch and create a draft PR to main using `gh pr create --draft`. Do not merge it — the user reviews and merges.

Note: You are closing out this card only. The dispatcher owns sprint lifecycle — do not close, archive, or finalize the sprint itself. The exception is a sprint close-out card, which will be obvious from its content.
