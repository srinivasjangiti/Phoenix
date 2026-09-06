@echo off
cd /d %USERPROFILE%\Desktop\Phoenix\android
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
rmdir /s /q app\build 2>nul
%USERPROFILE%\Desktop\Phoenix\android\gradlew.bat assembleDebug
