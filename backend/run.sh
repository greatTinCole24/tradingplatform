#!/usr/bin/env bash
set -euo pipefail
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
