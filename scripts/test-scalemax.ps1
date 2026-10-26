# ScaleMax Diagnostic PowerShell Runner
$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$VenvPython = Join-Path $ProjectRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
    Write-Host "[!] Virtual environment not found at $VenvPython. Using system python." -ForegroundColor Yellow
    $VenvPython = "python"
}

$env:PYTHONPATH = $ProjectRoot
& $VenvPython "scripts\test_scalemax.py"
exit $LASTEXITCODE
