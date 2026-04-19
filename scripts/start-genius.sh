#!/bin/bash
# Start Genius Team Playground Server
# Usage: bash scripts/start-genius.sh [--port 3333] [--tunnel] [--open]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPEN_BROWSER=false
ARGS=()

for arg in "$@"; do
  if [[ "$arg" == "--open" ]]; then
    OPEN_BROWSER=true
  else
    ARGS+=("$arg")
  fi
done

# Start server
node "$SCRIPT_DIR/genius-server.js" "${ARGS[@]}" &
SERVER_PID=$!

# Optionally open browser
if [[ "$OPEN_BROWSER" == "true" ]]; then
  sleep 1.5
  PORT=3333
  for i in "${!ARGS[@]}"; do
    if [[ "${ARGS[$i]}" == "--port" && -n "${ARGS[$((i+1))]}" ]]; then
      PORT="${ARGS[$((i+1))]}"
    fi
  done
  if command -v open &>/dev/null; then
    open "http://localhost:$PORT"
  elif command -v xdg-open &>/dev/null; then
    xdg-open "http://localhost:$PORT"
  fi
fi

wait $SERVER_PID
