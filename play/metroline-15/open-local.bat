@echo off
cd /d "%~dp0"
node toolsuild-changelog.js
start "" "%~dp0index.html"
