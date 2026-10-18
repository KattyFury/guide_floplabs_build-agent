@echo off
chcp 65001 >nul
rem Cai agent TU CHAY NGAM moi khi mo may (khong co cua so). Bam dup file nay 1 lan la xong.
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "AGENT=%~dp0"
if not exist "%AGENT%logs" mkdir "%AGENT%logs"
(
echo Set sh = CreateObject^("WScript.Shell"^)
echo sh.CurrentDirectory = "%AGENT%"
echo sh.Run "cmd /c node bot.js >> logs\bot.log 2>&1", 0, False
) > "%STARTUP%\flop-kibble-agent.vbs"
wscript "%STARTUP%\flop-kibble-agent.vbs"
echo.
echo Xong! Agent dang chay ngam va se tu chay moi khi mo may.
echo Kiem tra tren Telegram: go /status
pause
