# ShopSmart - Start Local Python Backend (Windows PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Starting ShopSmart Python Backend" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$WorkspaceRoot = Split-Path -Parent $PSScriptRoot
Set-Location $WorkspaceRoot

# Check virtual environment
if (-not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Host "Virtual environment .venv not found. Creating..." -ForegroundColor Yellow
    python -m venv .venv
    & .venv\Scripts\pip.exe install -r backend\requirements.txt
}

# Run FastAPI backend with Uvicorn
$env:PYTHONPATH = $WorkspaceRoot
Write-Host "Starting Uvicorn server on http://127.0.0.1:8000..." -ForegroundColor Green
& .venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
