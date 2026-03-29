The reviewer flagged 3 non-blocking items, grouped into 2 cards below.
Create ONE card per group. Do not split groups into multiple cards.
The planner is responsible for deduplication against existing cards.
All cards go into the current sprint unless marked BLOCKED with a reason.

### Card 1: Extract shared template-key resolution helper in PowerShell routing block
Sprint: TTSINTEG
Files touched: install.ps1
Items:
- L1: The PowerShell TTS block duplicates the notification template key resolution logic (the category-to-key mapping exists in both `Resolve-NotificationTemplate` and the new `$ttsKeyMap`). Extract a shared helper function so future template keys don't require maintaining two parallel mappings.

### Card 2: Group test-mode file writes in peon.sh Python block
Sprint: TTSINTEG
Files touched: peon.sh
Items:
- L3: The 8 test-mode file writes in `peon.sh` each evaluate their condition independently on every invocation. Group them in a single `if PEON_TEST:` block to reduce repetition and make it easier to add more test observability points in the future.
