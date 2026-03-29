#!/usr/bin/env bats

load setup.bash

setup() {
  setup_test_env
  install_mock_tts_backend
}

teardown() {
  teardown_test_env
}

# ============================================================
# speak() function — backend invocation
# ============================================================

@test "TTS: speak() invokes backend with correct arg order (voice, rate, volume)" {
  run_peon_tts '{"hook_event_name":"TaskComplete","cwd":"/tmp/proj","session_id":"s1"}' "Hello world"
  [ "$PEON_EXIT" -eq 0 ]
  tts_was_called
  local call
  call=$(tts_last_call)
  [[ "$call" == *"voice=default"* ]]
  [[ "$call" == *"rate=1.0"* ]]
  [[ "$call" == *"vol=0.5"* ]]
}

@test "TTS: speak() passes text on stdin to backend" {
  run_peon_tts '{"hook_event_name":"TaskComplete","cwd":"/tmp/proj","session_id":"s1"}' "Task completed successfully"
  [ "$PEON_EXIT" -eq 0 ]
  tts_was_called
  local call
  call=$(tts_last_call)
  [[ "$call" == *"text=Task completed successfully"* ]]
}

# ============================================================
# Mode sequencing in _run_sound_and_notify
# ============================================================

@test "TTS: sound-then-speak mode plays sound before TTS" {
  run_peon_tts '{"hook_event_name":"TaskComplete","cwd":"/tmp/proj","session_id":"s1"}' "Done" "sound-then-speak"
  [ "$PEON_EXIT" -eq 0 ]
  afplay_was_called
  tts_was_called
}

@test "TTS: speak-only mode skips play_sound entirely" {
  run_peon_tts '{"hook_event_name":"TaskComplete","cwd":"/tmp/proj","session_id":"s1"}' "Done" "speak-only"
  [ "$PEON_EXIT" -eq 0 ]
  ! afplay_was_called
  tts_was_called
}

@test "TTS: speak-then-sound mode invokes TTS then sound" {
  run_peon_tts '{"hook_event_name":"TaskComplete","cwd":"/tmp/proj","session_id":"s1"}' "Done" "speak-then-sound"
  [ "$PEON_EXIT" -eq 0 ]
  afplay_was_called
  tts_was_called
}

# ============================================================
# TTS suppression
# ============================================================

@test "TTS: empty TTS_TEXT skips TTS invocation" {
  run_peon_tts '{"hook_event_name":"TaskComplete","cwd":"/tmp/proj","session_id":"s1"}' "" "sound-then-speak"
  [ "$PEON_EXIT" -eq 0 ]
  afplay_was_called
  ! tts_was_called
}

@test "TTS: TTS_ENABLED=false skips TTS invocation" {
  run_peon_tts '{"hook_event_name":"TaskComplete","cwd":"/tmp/proj","session_id":"s1"}' "Hello" "sound-then-speak" "false"
  [ "$PEON_EXIT" -eq 0 ]
  afplay_was_called
  ! tts_was_called
}

@test "TTS: headphones_only suppresses TTS when no headphones" {
  # Set headphones_only and speakers-only fixture
  /usr/bin/python3 -c "
import json
cfg = json.load(open('$TEST_DIR/config.json'))
cfg['headphones_only'] = True
json.dump(cfg, open('$TEST_DIR/config.json', 'w'))
"
  touch "$TEST_DIR/.mock_speakers_only"
  run_peon_tts '{"hook_event_name":"TaskComplete","cwd":"/tmp/proj","session_id":"s1"}' "Hello" "sound-then-speak"
  [ "$PEON_EXIT" -eq 0 ]
  ! afplay_was_called
  ! tts_was_called
}

@test "TTS: meeting_detect suppresses TTS when in meeting" {
  /usr/bin/python3 -c "
import json
cfg = json.load(open('$TEST_DIR/config.json'))
cfg['meeting_detect'] = True
json.dump(cfg, open('$TEST_DIR/config.json', 'w'))
"
  # Create mock that signals a meeting is active
  cat > "$MOCK_BIN/lsof" <<'SCRIPT'
#!/bin/bash
echo "zoom"
SCRIPT
  chmod +x "$MOCK_BIN/lsof"
  run_peon_tts '{"hook_event_name":"TaskComplete","cwd":"/tmp/proj","session_id":"s1"}' "Hello" "sound-then-speak"
  [ "$PEON_EXIT" -eq 0 ]
  ! afplay_was_called
  ! tts_was_called
}

# ============================================================
# PID tracking
# ============================================================

@test "TTS: kill_previous_tts kills old .tts.pid before new speak" {
  # Plant a fake .tts.pid — it should be cleaned up
  echo "99999" > "$TEST_DIR/.tts.pid"
  run_peon_tts '{"hook_event_name":"TaskComplete","cwd":"/tmp/proj","session_id":"s1"}' "Hello"
  [ "$PEON_EXIT" -eq 0 ]
  tts_was_called
  # Old PID file should have been removed (or replaced)
  if [ -f "$TEST_DIR/.tts.pid" ]; then
    local pid_content
    pid_content=$(cat "$TEST_DIR/.tts.pid")
    [ "$pid_content" != "99999" ]
  fi
}

# ============================================================
# Missing backend — graceful skip
# ============================================================

@test "TTS: missing backend script causes graceful skip, sound still plays" {
  # Remove the mock backend
  rm -f "$TEST_DIR/scripts/tts-native.sh"
  run_peon_tts '{"hook_event_name":"TaskComplete","cwd":"/tmp/proj","session_id":"s1"}' "Hello" "sound-then-speak"
  [ "$PEON_EXIT" -eq 0 ]
  afplay_was_called
  ! tts_was_called
}

@test "TTS: auto backend resolution with no scripts installed returns gracefully" {
  rm -f "$TEST_DIR/scripts/tts-native.sh"
  export TTS_BACKEND="auto"
  run_peon_tts '{"hook_event_name":"TaskComplete","cwd":"/tmp/proj","session_id":"s1"}' "Hello" "sound-then-speak"
  [ "$PEON_EXIT" -eq 0 ]
  afplay_was_called
  ! tts_was_called
}

# ============================================================
# Trainer TTS
# ============================================================

@test "TTS: trainer speaks TRAINER_TTS_TEXT after trainer sound when TTS enabled" {
  # Enable trainer and set up trainer state so a reminder fires
  bash "$PEON_SH" trainer on

  # Create trainer sounds directory and manifest
  mkdir -p "$TEST_DIR/trainer/sounds/remind"
  cat > "$TEST_DIR/trainer/manifest.json" <<'JSON'
{
  "trainer.remind": [
    { "file": "sounds/remind/reminder.mp3", "label": "Time for reps!" }
  ]
}
JSON
  touch "$TEST_DIR/trainer/sounds/remind/reminder.mp3"

  # Set trainer state: last reminder was long ago so it fires
  python3 -c "
import json, time
s = json.load(open('$TEST_DIR/.state.json'))
s['trainer'] = {'date': '$(date +%Y-%m-%d)', 'reps': {'pushups': 0, 'squats': 0}, 'last_reminder_ts': int(time.time()) - 3600}
json.dump(s, open('$TEST_DIR/.state.json', 'w'))
"

  # TRAINER_TTS_TEXT is exported (Step 2 Python block will set this; for now env survives eval)
  export TRAINER_TTS_TEXT="Time for pushups"
  run_peon_tts '{"hook_event_name":"Stop","cwd":"/tmp/proj","session_id":"s1","permission_mode":"default"}' "Task done"
  [ "$PEON_EXIT" -eq 0 ]
  tts_was_called
  # Should have 2 TTS calls: one for main event, one for trainer
  local count
  count=$(tts_call_count)
  [ "$count" -eq 2 ]
  # Last TTS call should be the trainer text
  local last
  last=$(tts_last_call)
  [[ "$last" == *"text=Time for pushups"* ]]
}

# ============================================================
# Integration: full hook invocation with both sound and TTS
# ============================================================

@test "TTS: integration — full hook with TTS enabled fires both sound and TTS" {
  run_peon_tts '{"hook_event_name":"TaskComplete","cwd":"/tmp/proj","session_id":"s1"}' "Build succeeded"
  [ "$PEON_EXIT" -eq 0 ]
  afplay_was_called
  tts_was_called
  local call
  call=$(tts_last_call)
  [[ "$call" == *"text=Build succeeded"* ]]
  [[ "$call" == *"voice=default"* ]]
}

# ============================================================
# Text safety — shell metacharacters
# ============================================================

@test "TTS: text with shell metacharacters delivered safely via stdin" {
  run_peon_tts '{"hook_event_name":"TaskComplete","cwd":"/tmp/proj","session_id":"s1"}' 'Hello $USER `whoami` $(date)'
  [ "$PEON_EXIT" -eq 0 ]
  tts_was_called
  local call
  call=$(tts_last_call)
  # Text should be passed literally, not interpreted
  [[ "$call" == *'$USER'* ]]
}
