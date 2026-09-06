@echo off
cd /d %~dp0
node phoenix-client.js >> client.log 2>&1
