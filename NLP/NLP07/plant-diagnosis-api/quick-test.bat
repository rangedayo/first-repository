@echo off
echo 🧪 Plant Diagnosis API 빠른 테스트
echo.

REM Node.js 확인
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js가 설치되지 않았습니다.
    pause
    exit /b 1
)

REM 의존성 설치 (필요시)
if not exist node_modules (
    echo 📦 의존성 설치 중...
    npm install
)

echo 🔍 API 테스트 실행 중...
echo.

REM 모든 테스트 실행
npm test

echo.
echo 테스트 완료!
pause