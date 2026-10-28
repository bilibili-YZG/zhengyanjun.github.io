@echo off
cd /d "%~dp0"
node tools\build-changelog.js
start "" "%~dp0index.html"
