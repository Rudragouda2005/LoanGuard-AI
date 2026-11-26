@echo off
cd /d "%~dp0"
echo Starting LoanGuard AI...
echo Once started, open http://127.0.0.1:8000 in your browser.
start "" http://127.0.0.1:8000
".venv\Scripts\python.exe" -m backend.main
pause
