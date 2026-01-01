#!/bin/bash

# Start Watched app with API, DB, and open browser
set -e

echo "🚀 Starting Watched app..."

# Function to cleanup background processes
cleanup() {
  echo "🛑 Shutting down..."
  jobs -p | xargs -r kill
  exit 0
}
trap cleanup SIGINT SIGTERM

# Load Node.js environment
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Use full path to pnpm if available; try to auto-activate via corepack or install locally if missing
PNPM_CMD="pnpm"
if ! command -v pnpm &> /dev/null; then
  # Try corepack to activate pnpm
  if command -v corepack &> /dev/null; then
    echo "🔧 Enabling pnpm via corepack..."
    corepack enable || true
    corepack prepare pnpm@latest --activate || true
  fi
fi

if ! command -v pnpm &> /dev/null; then
  # Try common pnpm locations
  if [ -f "$HOME/.npm-global/bin/pnpm" ]; then
    PNPM_CMD="$HOME/.npm-global/bin/pnpm"
  elif [ -f "/usr/local/bin/pnpm" ]; then
    PNPM_CMD="/usr/local/bin/pnpm"
  elif [ -n "$NVM_DIR" ] && command -v node &> /dev/null && [ -f "$NVM_DIR/versions/node/$(node -v)/bin/pnpm" ]; then
    PNPM_CMD="$NVM_DIR/versions/node/$(node -v)/bin/pnpm"
  else
    # As a last resort, attempt local user install without sudo
    if command -v npm &> /dev/null; then
      echo "📦 Installing pnpm locally (user space)..."
      npm config set prefix "$HOME/.npm-global" --location=user >/dev/null 2>&1 || true
      export PATH="$HOME/.npm-global/bin:$PATH"
      npm install -g pnpm >/dev/null 2>&1 || true
      if command -v pnpm &> /dev/null; then
        PNPM_CMD="pnpm"
      elif [ -f "$HOME/.npm-global/bin/pnpm" ]; then
        PNPM_CMD="$HOME/.npm-global/bin/pnpm"
      else
        echo "❌ pnpm not found. Please install Node.js and pnpm first."
        exit 1
      fi
    else
      echo "❌ pnpm not found and npm is unavailable to install it. Please install Node.js and pnpm."
      exit 1
    fi
  fi
fi

echo "📦 Using pnpm at: $PNPM_CMD"

# Start PostgreSQL (if not running)
if ! pgrep -x "postgres" > /dev/null; then
  echo "📦 Starting PostgreSQL..."
  sudo systemctl start postgresql || echo "⚠️ Could not start PostgreSQL (try running manually)"
fi

# Start API server
echo "🔧 Starting API server on port 33010..."
cd /var/www/watched
$PNPM_CMD dev:api &
API_PID=$!

# Wait a moment for API to start
sleep 3

# Start client dev server
echo "🌐 Starting client on port 33000..."
cd /var/www/watched
$PNPM_CMD dev:client &
CLIENT_PID=$!

# Wait a moment for client to start
sleep 5

# Open browser (prefer Windows default via wslview/powershell, then Linux fallbacks)
echo "🌍 Opening browser to http://localhost:33000"
if command -v wslview > /dev/null; then
  wslview http://localhost:33000 || true
elif command -v powershell.exe > /dev/null; then
  powershell.exe -NoProfile -NonInteractive -Command "Start-Process 'http://localhost:33000'" >/dev/null 2>&1 || true
elif command -v cmd.exe > /dev/null; then
  cmd.exe /c start "" http://localhost:33000 >/dev/null 2>&1 || true
elif command -v explorer.exe > /dev/null; then
  explorer.exe http://localhost:33000 >/dev/null 2>&1 || true
elif command -v xdg-open > /dev/null; then
  xdg-open http://localhost:33000 || true
elif command -v open > /dev/null; then
  open http://localhost:33000 || true
elif command -v google-chrome > /dev/null; then
  google-chrome http://localhost:33000 || true
elif command -v firefox > /dev/null; then
  firefox http://localhost:33000 || true
else
  echo "⚠️ Could not detect browser command. Please open http://localhost:33000 manually"
fi

echo "✅ App started! Press Ctrl+C to stop all services."

# Wait for background jobs
wait
