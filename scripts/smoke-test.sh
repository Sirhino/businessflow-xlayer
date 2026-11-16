#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm test
python -m http.server 4173 --directory frontend >/tmp/businessflow-http.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
sleep 1
curl -fsS http://127.0.0.1:4173/ | grep -q 'BusinessFlow'
echo 'HTTP smoke test passed.'
