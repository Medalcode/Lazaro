#!/usr/bin/env bash
# Use ARGOS_HOME env var or fallback to a sensible default
ARGOS_HOME=${ARGOS_HOME:-"$HOME/Documentos/Github/Argos"}
cd "$ARGOS_HOME" || exit 1
export PYTHONPATH=$PYTHONPATH:$(pwd)
python3 -m uvicorn dashboard.main:app --host 0.0.0.0 --port 8000
