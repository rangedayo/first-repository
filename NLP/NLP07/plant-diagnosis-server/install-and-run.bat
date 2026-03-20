@echo off
chcp 65001 >nul
echo.
echo 🌱 Plant Diagnosis Server 설치 및 실행
echo ================================================
echo.

REM Node.js 설치 확인
echo 🔍 Node.js 설치 확인 중...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js가 설치되지 않았습니다.
    echo 💡 https://nodejs.org/ 에서 Node.js를 설치하세요.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js 설치 확인됨: %NODE_VERSION%
echo.

REM npm 버전 확인
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm 버전: %NPM_VERSION%
echo.

REM 의존성 설치
echo 📦 의존성 설치 중...
echo    - express (웹 서버)
echo    - axios (HTTP 클라이언트)
echo    - multer (파일 업로드)
echo    - sharp (이미지 처리)
echo    - 기타 필수 라이브러리들...
echo.

npm install
if %errorlevel% neq 0 (
    echo ❌ 의존성 설치 실패
    echo 💡 인터넷 연결을 확인하고 다시 시도하세요.
    pause
    exit /b 1
)

echo ✅ 의존성 설치 완료!
echo.

REM 환경 설정 확인
if not exist .env (
    echo ❌ .env 파일이 없습니다.
    echo 💡 .env 파일에 Plant.id API 키를 설정하세요.
    pause
    exit /b 1
)

echo ✅ 환경 설정 확인됨
echo.

REM API 키 테스트
echo 🧪 Plant.id API 연결 테스트 중...
node test.js api
echo.

REM 서버 실행
echo 🚀 서버 시작 중...
echo.
echo ================================================
echo 📍 서버 주소: http://localhost:3001
echo 🔍 Health Check: http://localhost:3001/api/health
echo 📊 Plant.id Status: http://localhost:3001/api/plant-id-status
echo 🔬 진단 엔드포인트: POST http://localhost:3001/api/diagnose
echo ================================================
echo.
echo 💡 서버를 중지하려면 Ctrl+C를 누르세요.
echo 💡 브라우저 테스트: test-page.html 파일을 열어보세요!
echo.

npm run dev