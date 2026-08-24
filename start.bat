@echo off
echo Starting HealthVerse Frontend and Backend...
start cmd /k "cd backend && uvicorn main:app --reload"
start cmd /k "cd frontend && npm run dev"
echo Both Frontend (http://localhost:5173) and Backend (http://localhost:8000) are starting!
