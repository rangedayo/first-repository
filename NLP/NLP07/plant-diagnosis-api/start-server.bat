@echo off
echo 🌱 Plant Diagnosis API Server 시작
echo.

REM Node.js 설치 확인
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js가 설치되지 않았습니다.
    echo 💡 https://nodejs.org/ 에서 Node.js를 설치하세요.
    pause
    exit /b 1
)

echo ✅ Node.js 설치 확인됨
echo.

REM 의존성 설치
echo 📦 의존성 설치 중...
npm install
if %errorlevel% neq 0 (
    echo ❌ 의존성 설치 실패
    pause
    exit /b 1
)

echo ✅ 의존성 설치 완료
echo.

REM API 키 확인
if not exist .env (
    echo ❌ .env 파일이 없습니다.
    echo 💡 .env 파일에 Plant.id API 키를 설정하세요.
    pause
    exit /b 1
)

echo ✅ 환경 설정 확인됨
echo.

REM 서버 실행
echo 🚀 서버 시작 중...
echo 📍 서버 주소: http://localhost:3001
echo 🔍 진단 엔드포인트: POST /api/diagnose
echo.
echo 서버를 중지하려면 Ctrl+C를 누르세요.
echo.

npm run dev