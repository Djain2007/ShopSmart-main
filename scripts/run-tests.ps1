# ShopSmart - Run Automated Test Suite (Windows PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Running ShopSmart Automated Tests" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$WorkspaceRoot = Split-Path -Parent $PSScriptRoot
Set-Location $WorkspaceRoot

$env:PYTHONPATH = $WorkspaceRoot
& .venv\Scripts\pytest.exe backend\tests -v
