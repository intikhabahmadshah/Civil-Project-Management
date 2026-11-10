@echo off
title Civil Construction Project Management Dashboard
echo ==============================================================================
echo   STARTING CIVIL CONSTRUCTION PROJECT MANAGEMENT DASHBOARD
echo   Trainee: Intikhab Ahmad Shah (TRN-2026-000059)
echo   Bootcamp: PSEB - Tech Destination - Bootcamp
echo   Venue: Iqra University - IU, Islamabad
echo ==============================================================================
echo.
echo Checking data payloads...
if not exist "civil_dashboard_data.json" (
    echo Generating analytical data payload...
    python prepare_dashboard_data.py
)

echo Starting Express Server and opening dashboard in browser...
start "" "http://localhost:3000"
node server.js
pause
