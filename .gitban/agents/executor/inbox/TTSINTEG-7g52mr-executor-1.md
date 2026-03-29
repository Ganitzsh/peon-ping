Use `.venv/Scripts/python.exe` to run Python commands.

The code for the gitban card with id 7g52mr has been approved as of commit c2ff5ac. Please use the gitban tools to update the gitban card and begin the tasks required to properly complete it.

## Card Close-out tasks:
- Use gitban's checkbox tools to ensure all checkboxes on the card are checked off for completed work if not already.
- Do not mark any work as deferred. This card will be closed and archived and likely never seen again.
- Use gitban's complete card tool to submit and validate if not already completed.
- Close-out items:
  - **L1**: The Pester test (`tests/adapters-windows.Tests.ps1`) checks 6 of 7 tts hashtable fields but omits `volume = 0.5`. Add the missing `volume` assertion to the Pester test for completeness.
  - **L2**: README config docs are deferred to the tts-docs card per the design doc. No action needed on this card.
- If this card is not in a sprint, push the feature branch and create a draft PR to main using `gh pr create --draft`. Do not merge it — the user reviews and merges.

Note: You are closing out this card only. The dispatcher owns sprint lifecycle — do not close, archive, or finalize the sprint itself. The exception is a sprint close-out card, which will be obvious from its content.
