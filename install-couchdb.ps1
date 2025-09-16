# CouchDB Installation Script for Windows
# Run this as Administrator

Write-Host "🚀 Installing CouchDB for React Native Sync..." -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ Please run PowerShell as Administrator" -ForegroundColor Red
    exit 1
}

# Download CouchDB installer
$url = "https://archive.apache.org/dist/couchdb/binary/win/3.3.3/apache-couchdb-3.3.3.msi"
$output = "$env:TEMP\couchdb-installer.msi"

Write-Host "📥 Downloading CouchDB installer..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
    Write-Host "✅ Download completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Download failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Install CouchDB silently
Write-Host "🔧 Installing CouchDB..." -ForegroundColor Yellow
try {
    Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$output`" /quiet /norestart" -Wait
    Write-Host "✅ CouchDB installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Installation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Start CouchDB service
Write-Host "🚀 Starting CouchDB service..." -ForegroundColor Yellow
try {
    Start-Service -Name "Apache CouchDB" -ErrorAction Stop
    Write-Host "✅ CouchDB service started" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Service start failed, trying alternative method..." -ForegroundColor Yellow
    try {
        & "C:\Program Files\Apache CouchDB\bin\couchdb.cmd" &
        Start-Sleep 3
        Write-Host "✅ CouchDB started manually" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to start CouchDB: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test connection
Write-Host "🔍 Testing CouchDB connection..." -ForegroundColor Yellow
Start-Sleep 5
try {
    $response = Invoke-WebRequest -Uri "http://admin:admin@192.168.29.13:5984" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ CouchDB is running at http://admin:admin@192.168.29.13:5984" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Connection test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Configure CORS for React Native
Write-Host "⚙️ Configuring CORS for React Native..." -ForegroundColor Yellow
Start-Sleep 2

$corsCommands = @(
    'curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/httpd/enable_cors -d "true"',
    'curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/cors/origins -d "*"',
    'curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/cors/methods -d "GET, PUT, POST, HEAD, DELETE"',
    'curl -X PUT http://admin:admin@192.168.29.13:5984/_node/_local/_config/cors/headers -d "accept, authorization, content-type, origin, referer, x-csrf-token"'
)

foreach ($cmd in $corsCommands) {
    try {
        Invoke-Expression $cmd
        Write-Host "✅ CORS configured" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ CORS configuration may need manual setup" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 CouchDB Setup Complete!" -ForegroundColor Green
Write-Host "📱 Now restart your React Native app and tap 'Sync' button" -ForegroundColor Cyan
Write-Host "🌐 CouchDB Admin: http://admin:admin@192.168.29.13:5984/_utils" -ForegroundColor Cyan

# Clean up
Remove-Item $output -Force -ErrorAction SilentlyContinue
