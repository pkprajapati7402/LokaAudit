# PowerShell script to build the Docker test runner image
Write-Host "🐳 Building Docker test runner image for LokaAudit..." -ForegroundColor Cyan

# Check if Docker is running
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    Write-Host "   1. Start Docker Desktop" -ForegroundColor Yellow
    Write-Host "   2. Wait for Docker to fully start" -ForegroundColor Yellow
    Write-Host "   3. Run this script again" -ForegroundColor Yellow
    exit 1
}

# Build the rust-test-runner image
Write-Host "🔨 Building rust-test-runner image..." -ForegroundColor Cyan

$dockerfilePath = "docker\rust-test-runner\Dockerfile"

if (-Not (Test-Path $dockerfilePath)) {
    Write-Host "❌ Dockerfile not found at $dockerfilePath" -ForegroundColor Red
    exit 1
}

# Build the image
docker build -t rust-test-runner:latest -f $dockerfilePath .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker image built successfully!" -ForegroundColor Green
    Write-Host "🎯 Image: rust-test-runner:latest" -ForegroundColor Cyan
    
    # Test the image
    Write-Host "🧪 Testing the Docker image..." -ForegroundColor Cyan
    $testResult = docker run --rm rust-test-runner:latest rustc --version
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker image test successful!" -ForegroundColor Green
        Write-Host "   Rust version: $testResult" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ Docker image test failed, but image was built" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🚀 Ready for test execution!" -ForegroundColor Green
    Write-Host "   The Docker-based test runner is now available for LokaAudit demos."
    
} else {
    Write-Host "❌ Docker image build failed!" -ForegroundColor Red
    Write-Host "   Check the Docker logs above for details." -ForegroundColor Yellow
    exit 1
}
