#!/bin/bash
# Script to create Cursor agents automatically with full permissions
# Run this script after Cursor opens: bash .cursor/create-agents.sh

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
AGENTS_DIR="$PROJECT_DIR/.cursor/agents"

echo "Creating Cursor agents from $AGENTS_DIR with full permissions..."

# Wait for Cursor to be ready
sleep 3

for agent_file in "$AGENTS_DIR"/*-agent.md; do
  if [ -f "$agent_file" ]; then
    agent_name=$(basename "$agent_file" -agent.md)
    echo "Creating agent: $agent_name"
    
    # Copy content to clipboard
    pbcopy < "$agent_file"
    
    # Use AppleScript to create agent with full permissions
    osascript <<EOF
tell application "Cursor"
  activate
end tell
delay 2
tell application "System Events"
  -- Open agent panel (Shift+Cmd+L)
  key code 37 using {shift down, command down}
  delay 2
  -- Click New Agent
  keystroke return
  delay 2
  -- Paste content
  keystroke "v" using command down
  delay 1
  -- Set to Auto mode (∞ Agent) - Tab to mode dropdown, then select Auto
  key code 48 -- Tab key
  delay 0.5
  keystroke "a" -- Select Auto
  delay 0.5
  key code 48 -- Tab to next field
  delay 0.5
  -- Enable full permissions (if there's a permissions toggle)
  -- Note: This may vary based on Cursor UI - adjust as needed
  -- Save
  keystroke "s" using command down
  delay 1
end tell
EOF
    
    sleep 2
  fi
done

echo "Done! Check Cursor's agent panel."
echo "⚠️  IMPORTANT: Make sure each agent is set to 'Auto' mode (∞ Agent) with full permissions!"
