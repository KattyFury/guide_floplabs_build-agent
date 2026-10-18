@echo off
chcp 65001 >nul
rem Tat agent dang chay ngam + bo tu chay khi mo may.
rem Chi tat dung tien trinh "node bot.js" cua agent, khong dung toi chuong trinh node khac.
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\flop-kibble-agent.vbs" 2>nul
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"name='node.exe'\" | Where-Object { $_.CommandLine -match 'bot\.js' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; 'Da tat tien trinh ' + $_.ProcessId }"
echo.
echo Da tat agent va bo tu chay khi mo may. Bam dup CAI-TU-CHAY.bat de bat lai.
pause
