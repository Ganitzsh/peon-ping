# TTS Integration Layer Sprint

## Sprint Definition & Scope

* **Sprint Name/Tag**: TTSINTEG
* **Sprint Goal**: Ship the TTS integration layer — config schema, speech text resolution, speak() function, PID tracking, mode sequencing, and backend resolution — in both peon.sh (Unix) and install.ps1 (Windows). This is the foundation every TTS feature builds on.
* **Timeline**: 2026-03-28 — open-ended
* **Roadmap Link**: v2/m5/tts-integration ("The peon speaks to you")
* **Definition of Done**: All 4 work cards complete. Hook pipeline invokes resolved TTS backend with text on stdin, voice/rate/volume as args. Both Unix and Windows. No actual backend needed — mock backends verify the contract.

**Required Checks:**
* [x] Sprint name/tag is chosen and will be used as prefix for all cards
* [x] Sprint goal clearly articulates the value/outcome
* [x] Roadmap milestone is identified and linked

---

## Card Planning & Brainstorming

### Work Areas & Card Ideas

**Area 1: Config Foundation**
* Config schema — add `tts` section to config.json with 6 keys
* `peon update` backfill — merge tts section into existing configs without overwriting user values
* Windows installer — include tts section in generated config

**Area 2: Text Resolution (Python/PowerShell)**
* Speech text resolution chain: manifest speech_text → notification template → default template
* 8 new TTS_* output variables from Python block
* TRAINER_TTS_TEXT from trainer progress string

**Area 3: Unix speak() Layer**
* speak() shell function with backend resolution and PID tracking
* _resolve_tts_backend() with auto probing
* Mode sequencing in _run_sound_and_notify()
* Trainer wait-for-both-PIDs logic
* Suppression rules applied to TTS
* PEON_TEST=1 synchronous mode
* Debug logging [tts] phase

**Area 4: Windows PowerShell Port**
* Invoke-TtsSpeak with Start-Process and Base64 text transport
* Resolve-TtsBackend with auto probing
* Mode sequencing in sound playback section
* Speech text resolution in PS routing block
* PID management (.tts.pid)

### Card Types Needed

* [x] **Features**: 4 feature cards (one per phase)
- [x] **Bugs**: 0
- [x] **Chores**: 0
- [x] **Spikes**: 0
- [x] **Docs**: 0 (docs ship with tts-docs feature)

---

## Sequential Card Creation Workflow

| Step | Status/Details | Universal Check |
| :---: | :--- | :---: |
| **1. Create Feature Cards** | 4 cards: config, text resolution, Unix speak(), Windows port | - [x] Feature cards created with sprint tag |
| **2. Create Bug Cards** | N/A | - [x] Bug cards created with sprint tag |
| **3. Create Chore Cards** | N/A | - [x] Chore cards created with sprint tag |
| **4. Create Spike Cards** | N/A | - [x] Spike cards created with sprint tag |
| **5. Verify Sprint Tags** | All 4 cards tagged TTSINTEG | - [x] All cards show correct sprint tag |
| **6. Fill Detailed Cards** | All cards have full acceptance criteria from design doc | - [x] P0/P1 cards have full acceptance criteria |

**Created Card IDs**: 7g52mr (step 1: config), 3c490l (step 2: text resolution), s81ofk (step 3: Unix speak), p7hchj (step 4: Windows port)

### Execution Sequencing

```
Step 0: ia8id8 — Sprint kickoff (this card, tracking only)
Step 1: 7g52mr — Config schema (sequential, no deps)
Step 2: 3c490l — Text resolution (depends on step 1)
Step 3A: s81ofk — Unix speak (depends on step 2, parallel with 3B)
Step 3B: p7hchj — Windows port (depends on step 2, parallel with 3A)
Step 4: geowa6 — Sprint closeout (depends on all above)
```

Steps 3A and 3B touch entirely different files (`peon.sh` vs `install.ps1`) and have no code artifact dependencies on each other. They run in parallel after step 2 completes.

---

## Sprint Execution Phases

| Phase / Task | Status / Link to Artifact | Universal Check |
| :--- | :--- | :---: |
| **Roadmap Integration** | v2/m5/tts-integration | - [x] Milestone updated with sprint tag |
| **Take Sprint** | Pending | - [x] Used take_sprint() to claim work |

**Note:** Sprint closeout (archiving, changelog, roadmap update, retrospective) is tracked in the dedicated closeout card.
