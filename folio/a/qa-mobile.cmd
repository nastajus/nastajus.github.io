@echo off
setlocal
cd /d "%~dp0qa"
if not exist node_modules call npm ci
call npx playwright install chromium firefox webkit
call npm test
