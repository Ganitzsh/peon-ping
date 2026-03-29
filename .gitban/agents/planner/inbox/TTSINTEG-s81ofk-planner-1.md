The reviewer flagged 3 non-blocking items, grouped into 1 card below.
Create ONE card per group. Do not split groups into multiple cards.
The planner is responsible for deduplication against existing cards.
All cards go into the current sprint unless marked BLOCKED with a reason.

### Card 1: TTS test ordering verification and code polish
Sprint: TTSINTEG
Files touched: tests/tts.bats, peon.sh
Items:
- L1: Mode sequencing tests ("sound-then-speak mode plays sound before TTS", "speak-then-sound mode invokes TTS then sound") only assert both afplay_was_called and tts_was_called are true, but don't verify ordering. In PEON_TEST=1 synchronous mode, ordering is deterministic and could be verified by comparing log line positions (afplay.log vs tts.log timestamps or write order). Cosmetic -- implementation is correct but test names overstate what they prove.
- L2: When TTS_MODE=speak-only and TTS is disabled (or text is empty), _run_sound_and_notify skips both sound and TTS -- total silence. Consider logging a [tts] debug message for this path, or falling back to sound when TTS is unavailable in speak-only mode. UX decision, not a correctness issue.
- L3: _resolve_tts_backend "auto" calls _resolve_tts_backend "$b" in a loop for each candidate backend. This works but is an unusual recursion pattern for what is effectively a lookup table + probe. A flat case with inline probing would be more readable and avoid the (harmless) self-call overhead. Readability refactor only.
