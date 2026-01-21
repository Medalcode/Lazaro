#!/data/data/com.termux/files/usr/bin/bash
cd /home/medalcode/Documentos/GitHub/Argos
export PYTHONPATH=$PYTHONPATH:$(pwd)
python3 -m uvicorn dashboard.main:app --host 0.0.0.0 --port 8000
