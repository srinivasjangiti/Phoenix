#!/bin/bash
# Phoenix Remembers — Recovery command
# Type "phoenix-remembers" or "phoenix remembers" in any terminal to get back to full Phoenix state
#
# This fetches the context briefing, writes it to .phoenix-briefing.md,
# prints the banner, and starts Claude with the full briefing context.

PROJECT_PATH="$(pwd)"
BRIEFING=""

# Fetch briefing from Phoenix server
PORT="${PHOENIX_PORT:-7777}"
if curl -s --connect-timeout 2 "http://localhost:${PORT}/health" > /dev/null 2>&1; then
  BRIEFING=$(curl -s "http://localhost:${PORT}/api/v1/context-briefing?project_path=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$PROJECT_PATH'))" 2>/dev/null || echo "$PROJECT_PATH")" 2>/dev/null | node -e "
    let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
      try { const j=JSON.parse(d); console.log(j.briefing||''); } catch { console.log(''); }
    });
  " 2>/dev/null)
fi

# Write briefing to .phoenix-briefing.md if we got one
if [ -n "$BRIEFING" ]; then
  echo "$BRIEFING" > .phoenix-briefing.md
fi

# Print the banner
printf "\033[1;96mPhoenix remembers..\033[0m\n"

# Start Claude with the briefing prompt
claude --permission-mode auto "Phoenix remembers... Start session. Read CLAUDE.md and give the session continuity summary."
