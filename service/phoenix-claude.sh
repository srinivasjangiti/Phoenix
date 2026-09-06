#!/bin/bash
# phoenix-claude — starts Claude with auto-context summary
# Usage: phoenix-claude [project_dir]
#   If no dir given, uses current directory
#
# This is the fix for "Claude doesn't speak first" —
# it passes the initial prompt as a CLI argument so Claude
# immediately summarizes context without the user typing anything.

DIR="${1:-.}"
cd "$DIR" 2>/dev/null || DIR="."

# Check if .phoenix-briefing.md or .phoenix-state.md exists
if [ -f ".phoenix-briefing.md" ] || [ -f ".phoenix-state.md" ]; then
  claude "This is a fresh session. Read the Phoenix session context injected into CLAUDE.md (between PHOENIX-CONTEXT markers). Summarize what we were working on last time — start with 'Last time we were working on...' and list the key topics. Then ask what I want to work on next."
else
  claude "This is a fresh session. Check CLAUDE.md for any session context. If there's a Recent Conversation section, summarize what we were working on. Otherwise just say hello and ask what to work on."
fi
