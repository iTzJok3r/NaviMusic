@echo off
setlocal enabledelayedexpansion
title Archimedes Music
cd /d "%~dp0desktop"
set "LOG=%~dp0desktop-launch.log"
set "ELECTRON=%~dp0desktop\node_modules\electron\dist\electron.exe"

echo ============================================ >> "%LOG%"
echo Launcher run: %DATE% %TIME% >> "%LOG%"
echo Working dir: %CD% >> "%LOG%"

rem ---------------------------------------------------------------------------
rem ELECTRON_RUN_AS_NODE makes Electron behave as a plain Node interpreter: the
rem app then never opens a window, and "electron --version" prints NODE's
rem version, so a version-based health check passes while the app is dead. This
rem single variable caused the old launcher to declare success and silently
rem fall through to the browser. Clear it before anything else.
rem ---------------------------------------------------------------------------
if defined ELECTRON_RUN_AS_NODE (
    echo Clearing inherited ELECTRON_RUN_AS_NODE=!ELECTRON_RUN_AS_NODE! >> "%LOG%"
    set "ELECTRON_RUN_AS_NODE="
)

if not exist "%ELECTRON%" (
    echo ERROR: Electron runtime missing at %ELECTRON% >> "%LOG%"
    echo.
    echo   Archimedes Music cannot start: the Electron runtime is missing.
    echo   Expected at: %ELECTRON%
    echo.
    echo   This launcher is only for running from source. To just use the app,
    echo   double-click  Archimedes-Music-Portable.exe  instead.
    echo.
    echo   Log: %LOG%
    echo.
    pause
    exit /b 2
)

rem ---------------------------------------------------------------------------
rem Launch the app. No browser fallback exists on purpose: this is a native
rem desktop application, and silently degrading to a web page hides the real
rem failure instead of reporting it.
rem ---------------------------------------------------------------------------
echo Launching: "%ELECTRON%" . >> "%LOG%"
start "" "%ELECTRON%" .

rem A healthy Electron window is still alive after a few seconds.
for /l %%i in (1,1,10) do (
    timeout /t 1 /nobreak >nul 2>&1
    tasklist /fi "imagename eq electron.exe" 2>nul | find /i "electron.exe" >nul && (
        echo Electron window is up. >> "%LOG%"
        exit /b 0
    )
)

echo FAILED: no electron.exe process survived the launch. >> "%LOG%"
echo. >> "%LOG%"
echo --- diagnostics --- >> "%LOG%"
echo Exit code of a direct Electron start: >> "%LOG%"
"%ELECTRON%" --version >> "%LOG%" 2>&1
echo exit=!ERRORLEVEL! >> "%LOG%"
where node >> "%LOG%" 2>&1
ver >> "%LOG%"

rem ---------------------------------------------------------------------------
rem Integrity level and ACL check.
rem
rem This failure has one dominant cause on Windows and it is invisible from the
rem app: if the project folder carries a LOW mandatory integrity label, or a DENY
rem ACE such as Everyone:(DENY), Chromium's sandbox cannot initialise and the
rem process dies before a single line of JavaScript runs. That is exactly what
rem happened here, and it cost hours of chasing a phantom code bug.
rem
rem The label is inherited from whatever created the folder, so a sandboxed tool
rem or a copy from an unusual source can reintroduce it at any time. Reporting it
rem up front turns an unexplained instant death into a one-line answer.
rem ---------------------------------------------------------------------------
echo. >> "%LOG%"
echo --- folder integrity and ACLs --- >> "%LOG%"
icacls "%~dp0" >> "%LOG%" 2>&1
icacls "%~dp0desktop" >> "%LOG%" 2>&1

set "INTEGRITY_ISSUE="
icacls "%~dp0" 2>nul | findstr /I "Mandatory Low DENY" >nul && set "INTEGRITY_ISSUE=1"
icacls "%~dp0desktop" 2>nul | findstr /I "Low Mandatory DENY" >nul && set "INTEGRITY_ISSUE=1"

echo. >> "%LOG%"
if defined INTEGRITY_ISSUE (
    echo INTEGRITY PROBLEM DETECTED on this folder. >> "%LOG%"
) else (
    echo No Low integrity label or DENY ACE found on this folder. >> "%LOG%"
)

echo.
echo   Archimedes Music did not start.
echo.
if defined INTEGRITY_ISSUE (
    echo   CAUSE FOUND: this folder has a Low integrity label or a DENY ACL entry.
    echo   Chromium's sandbox refuses to start under those conditions, so the app
    echo   dies before any of its code runs.
    echo.
    echo   Fix ^(run in an Administrator Command Prompt^):
    echo     icacls "%~dp0" /setintegritylevel Medium /T /C
    echo     icacls "%~dp0" /remove:d Everyone /T /C
    echo.
)
echo   Full report written to:
echo     %LOG%
echo.
pause
exit /b 1
