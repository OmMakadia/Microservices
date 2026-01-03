# Glamify Local Startup Script (Without Docker)
# Prerequisites: PostgreSQL must be installed and running

Write-Host "🚀 Starting Glamify Services Locally..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js found: $(node --version)" -ForegroundColor Green
Write-Host ""

# Function to start a service
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [int]$Port
    )
    
    Write-Host "📦 Installing dependencies for $ServiceName..." -ForegroundColor Yellow
    Set-Location $ServicePath
    if (-not (Test-Path "node_modules")) {
        npm install
    }
    
    Write-Host "🔄 Running migrations for $ServiceName..." -ForegroundColor Yellow
    npm run migrate 2>$null
    
    Write-Host "▶️  Starting $ServiceName on port $Port..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ServicePath'; npm run dev"
    
    Start-Sleep -Seconds 2
}

# Start services
Write-Host "Starting services in separate windows..." -ForegroundColor Cyan
Write-Host ""

$projectRoot = $PSScriptRoot

# Start Auth Service
Start-Service "Auth Service" "$projectRoot\services\auth-service" 8001

# Start Salon Service  
Start-Service "Salon Service" "$projectRoot\services\salon-service" 8002

# Start Availability Service
Start-Service "Availability Service" "$projectRoot\services\availability-service" 8003

# Start Booking Service
Start-Service "Booking Service" "$projectRoot\services\booking-service" 8004

# Start Notification Service
Start-Service "Notification Service" "$projectRoot\services\notification-service" 8005

# Start API Gateway
Start-Service "API Gateway" "$projectRoot\services\api-gateway" 8000

# Start Frontend
Write-Host "📦 Installing dependencies for Frontend..." -ForegroundColor Yellow
Set-Location "$projectRoot\frontend"
if (-not (Test-Path "node_modules")) {
    npm install
}

Write-Host "▶️  Starting Frontend on port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; npm start"

Write-Host ""
Write-Host "✅ All services are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "⏳ Wait 30-60 seconds for services to start..." -ForegroundColor Yellow
Write-Host ""
Write-Host "🌐 Access the application at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Note: Make sure PostgreSQL is running and databases are created!" -ForegroundColor Yellow

