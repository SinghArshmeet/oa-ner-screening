$ErrorActionPreference = 'Stop'

Set-Location $PSScriptRoot

$python = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if (-not (Test-Path $python)) {
    throw 'Project virtual environment not found. Create it with: py -m venv .venv'
}

$existing = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    try {
        $health = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/health' -TimeoutSec 2
        if ($health.status -eq 'ok') {
            Write-Host 'OA-NER backend is already running at http://127.0.0.1:8000'
            Write-Host 'API docs: http://127.0.0.1:8000/docs'
            exit 0
        }
    } catch {
        throw 'Port 8000 is occupied by another service. Stop it or choose another port.'
    }
}

# Supported environment variables:
# $env:GOOGLE_CLIENT_ID     - Google OAuth Client ID
# $env:GOOGLE_CLIENT_SECRET - Google OAuth Client Secret
# $env:GOOGLE_REDIRECT_URI  - Google OAuth Redirect URI (default: http://localhost:8000/auth/google/callback)
# $env:SESSION_SECRET       - Secret for session signatures
# $env:FRONTEND_ORIGIN      - Frontend origin (default: http://localhost:5173)
# $env:COOKIE_SECURE        - Set true in production HTTPS

Write-Host 'Starting OA-NER Screening Backend at http://127.0.0.1:8000...'
& $python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
