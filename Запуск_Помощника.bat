@echo off
cd /d "%~dp0"
echo ===================================================
echo STARTING AI ASSISTANT (Frontend + Backend)
echo ===================================================

echo Starting backend (FastAPI) on port 8000...
start cmd /k "cd /d "%~dp0backend" && call .\venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0"

echo Starting frontend (React/Vite) on port 5173...
start cmd /k "cd /d "%~dp0" && npm run dev -- --host --port 5173"

timeout /t 5 /nobreak >nul
start http://127.0.0.1:5173

echo.
echo Servers started! Browser should open automatically.
echo If not, go to: http://127.0.0.1:5173
echo.
pause
