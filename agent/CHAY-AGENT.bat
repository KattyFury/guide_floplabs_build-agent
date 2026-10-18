@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Agent research keo - dong cua so nay = agent nghi
node bot.js
echo.
echo Agent da dung. Bam phim bat ky de dong.
pause >nul
