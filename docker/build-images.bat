@echo off
REM Build Docker images for LokaAudit test execution
echo Building LokaAudit Docker test runners...

REM Build Rust test runner
echo Building Rust test runner...
docker build -t lokaudit/rust-test-runner:latest ./docker/rust-test-runner/

REM Build Solana test runner (alias to rust-test-runner with Solana tools)
echo Building Solana test runner...
docker build -t lokaudit/solana-test-runner:latest ./docker/rust-test-runner/

REM Tag with additional names for compatibility
docker tag lokaudit/rust-test-runner:latest rust-test-runner:latest
docker tag lokaudit/solana-test-runner:latest solana-test-runner:latest

echo Docker images built successfully!
echo.
echo Available images:
docker images | findstr /R "(lokaudit rust-test-runner solana-test-runner)"

echo.
echo To run test execution manually:
echo docker run --rm -v %cd%:/workspace -w /workspace lokaudit/rust-test-runner:latest cargo test

pause
