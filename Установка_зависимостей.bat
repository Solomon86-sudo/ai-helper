@echo off
cd /d "%~dp0"
echo ===================================================
echo INSTALLING BACKEND DEPENDENCIES (Python)
echo ===================================================
echo PLEASE TURN OFF YOUR VPN / SOCKS PROXY FOR 1 MINUTE!
echo ===================================================
pause

cd backend
call .\venv\Scripts\activate
set HTTP_PROXY=
set HTTPS_PROXY=
pip install -r requirements.txt

echo.
echo ===================================================
echo DONE!
echo You can close this window and run the second file.
echo ===================================================
pause
