# ShopSmart - Start Local React + Vite Frontend (Windows PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Starting ShopSmart React Frontend" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$WorkspaceRoot = Split-Path -Parent $PSScriptRoot
$FrontendDir = Join-Path $WorkspaceRoot "frontend"
Set-Location $FrontendDir

if (-not (Test-Path "node_modules")) {
    Write-Host "node_modules not found. Running npm install..." -ForegroundColor Yellow
    npm install
}

Write-Host "Starting Vite dev server on http://localhost:5173..." -ForegroundColor Green
npm run dev
