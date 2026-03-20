# 🌱 Plant Diagnosis Server

Plant.id API (Kindwise)를 사용한 식물 진단 서버입니다.

## ✨ 주요 기능

- 🔍 **식물 질병 진단**: 이미지 업로드로 식물 상태 분석
- 🏥 **건강 상태 평가**: AI 기반 식물 건강도 측정
- 💊 **치료법 제공**: 즉시 조치사항 및 장기 관리방법 안내
- 🌿 **식물 정보**: 식물 종류, 학명, 관리법 제공
- 🇰🇷 **한국어 지원**: 모든 결과를 한국어로 번역

## 🚀 빠른 시작

### 1단계: 의존성 설치 및 서버 실행

```bash
# 자동 설치 및 실행 (Windows)
install-and-run.bat

# 또는 수동 실행
npm install
npm run dev
```

### 2단계: 브라우저 테스트

`test-page.html` 파일을 브라우저에서 열어 테스트하세요.

## 📋 API 엔드포인트

### 1. 서버 상태 확인
```http
GET /api/health
```

**응답 예시:**
```json
{
  "status": "ok",
  "message": "🌱 식물 진단 서버가 정상 작동 중입니다!",
  "timestamp": "2024-03-20T10:30:00.000Z",
  "version": "1.0.0",
  "features": ["식물 질병 진단", "치료법 제공", "식물 정보 제공", "한국어 지원"]
}
```

### 2. Plant.id API 상태 확인
```http
GET /api/plant-id-status
```

### 3. 이미지 파일로 진단
```http
POST /api/diagnose
Content-Type: multipart/form-data

image: [이미지 파일]
```

### 4. Base64 이미지로 진단
```http
POST /api/diagnose-base64
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "filename": "plant.jpg"
}
```

**진단 결과 예시:**
```json
{
  "success": true,
  "result": {
    "status": "세균성 질병 의심",
    "icon": "🚨",
    "confidence": 85,
    "symptoms": [
      {
        "name": "세균성 반점병",
        "probability": 85,
        "description": "세균 감염으로 인해 잎에 갈색 반점이 나타납니다."
      }
    ],
    "causes": [
      {
        "name": "세균성 반점병",
        "probability": 85,
        "cause": "습한 환경과 상처를 통한 세균 침입",
        "severity": "high"
      }
    ],
    "treatments": {
      "immediate": [
        {
          "type": "immediate",
          "title": "감염 부위 제거",
          "description": "병든 잎과 줄기를 즉시 제거하세요",
          "priority": 1
        }
      ],
      "longterm": [
        {
          "type": "longterm",
          "title": "통풍 개선",
          "description": "식물 간격을 넓혀 통풍을 개선하세요",
          "priority": 1
        }
      ],
      "prevention": [
        {
          "type": "prevention",
          "title": "물 주기 조절",
          "description": "잎에 물이 닿지 않도록 뿌리 부근에만 물을 주세요",
          "priority": 1
        }
      ]
    },
    "plantInfo": {
      "name": "토마토",
      "probability": 95,
      "commonNames": ["토마토", "방울토마토"],
      "scientificName": "Solanum lycopersicum",
      "family": "Solanaceae"
    },
    "analysisType": "real",
    "provider": "Plant.id (Kindwise)",
    "timestamp": "2024-03-20T10:30:00.000Z"
  }
}
```

## ⚙️ 환경 설정

`.env` 파일에 다음 설정을 추가하세요:

```env
# Plant.id API 설정 (Kindwise)
PLANT_ID_API_KEY=your_api_key_here
PLANT_ID_BASE_URL=https://api.plant.id/v3

# 서버 설정
PORT=3001
NODE_ENV=development

# CORS 설정 (프론트엔드 URL)
FRONTEND_URL=http://localhost:8000

# 파일 업로드 설정
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# API 설정
REQUEST_TIMEOUT=30000
```

## 🧪 테스트

### 자동 테스트 실행
```bash
npm test
```

### 개별 테스트
```bash
# Plant.id API 직접 테스트
node test.js api

# 서버 상태 테스트
node test.js server

# 진단 기능 테스트
node test.js diagnosis
```

### 브라우저 테스트
`test-page.html` 파일을 브라우저에서 열어 시각적으로 테스트할 수 있습니다.

## 💰 Plant.id API 요금제

### 무료 플랜
- ✅ **월 100회** 무료 진단
- ✅ 식물 질병 진단
- ✅ 식물 종류 식별
- ✅ 기본 치료법 제공

### 유료 플랜
- 🚀 **월 1,000회+** 진단
- 🚀 고급 분석 기능
- 🚀 우선 지원

자세한 요금 정보: [Kindwise Plant.id](https://www.kindwise.com/plant-id)

## 🔧 기술 스택

- **Backend**: Node.js, Express
- **AI API**: Plant.id (Kindwise)
- **이미지 처리**: Sharp
- **파일 업로드**: Multer
- **HTTP 클라이언트**: Axios
- **보안**: Helmet, CORS
- **로깅**: Morgan

## 📁 프로젝트 구조

```
plant-diagnosis-server/
├── server.js              # 메인 서버 파일
├── test.js                # 테스트 스크립트
├── package.json           # 의존성 설정
├── .env                   # 환경 변수
├── README.md              # 프로젝트 문서
├── install-and-run.bat    # 자동 실행 스크립트
├── test-page.html         # 브라우저 테스트 페이지
└── uploads/               # 업로드된 이미지 저장 폴더
```

## 🚨 주의사항

1. **API 키 보안**: `.env` 파일을 절대 공개 저장소에 업로드하지 마세요
2. **파일 크기**: 이미지 파일은 최대 10MB까지 지원합니다
3. **요청 제한**: Plant.id API의 무료 플랜은 월 100회 제한이 있습니다
4. **네트워크**: 인터넷 연결이 필요합니다 (Plant.id API 호출)

## 🐛 문제 해결

### 서버 연결 실패
```bash
# 포트 3001이 사용 중인지 확인
netstat -ano | findstr :3001

# 다른 포트 사용 (.env 파일 수정)
PORT=3002
```

### Plant.id API 오류
- API 키가 올바른지 확인하세요
- 월 사용량 제한을 확인하세요
- 인터넷 연결을 확인하세요

### 이미지 업로드 실패
- 파일 크기가 10MB 이하인지 확인하세요
- 이미지 형식이 지원되는지 확인하세요 (JPG, PNG)

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. `npm test`로 전체 시스템 테스트
2. `test-page.html`에서 브라우저 테스트
3. 콘솔 로그 확인
4. Plant.id API 상태 확인

## 🎉 성공적으로 설치되었다면...

브라우저에서 다음 URL들을 확인해보세요:

- 🏥 Health Check: http://localhost:3001/api/health
- 📊 Plant.id Status: http://localhost:3001/api/plant-id-status
- 🧪 테스트 페이지: `test-page.html` 파일 열기

**이제 실제 식물 사진을 업로드해서 AI 진단을 받아보세요! 🌱✨**