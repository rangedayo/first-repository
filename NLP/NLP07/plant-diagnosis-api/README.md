# 🌱 Plant Diagnosis API (Kindwise Plant.id)

식물 사진을 업로드하면 질병을 진단하고 치료법을 제공하는 Node.js API 서버입니다.

## ✨ 주요 기능

- 🔍 **정확한 식물 질병 진단** (Plant.id API 기반)
- 🏥 **한국어 치료법 제공** (즉시조치, 장기관리, 예방법)
- 🌿 **식물 정보 제공** (학명, 일반명, 관리법)
- 📊 **이미지 최적화** (용량 자동 압축)
- 🌐 **다국어 지원** (한국어 우선)

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 설정 확인
`.env` 파일에 Plant.id API 키가 설정되어 있는지 확인하세요:
```bash
PLANT_ID_API_KEY=GFdEnaLYvtoHGKeZY3Ibk9yRrtumarp46lig3I8pVa4c1bbE8E
```

### 3. 서버 실행
```bash
# 개발 모드 (자동 재시작)
npm run dev

# 프로덕션 모드
npm start
```

### 4. 테스트
```bash
# 모든 테스트 실행
npm test

# 개별 테스트
npm test api     # Plant.id API 직접 테스트
npm test server  # 서버 상태 테스트
npm test base64  # Base64 진단 테스트
npm test upload  # 파일 업로드 테스트
```

## 📡 API 엔드포인트

### 기본 정보
- **서버 주소**: http://localhost:3001
- **API 버전**: v1
- **지원 형식**: JPG, PNG (최대 10MB)

### 1. 서버 상태 확인
```http
GET /api/health
```

**응답 예시:**
```json
{
  "status": "ok",
  "message": "식물 진단 서버가 정상 작동 중입니다.",
  "version": "1.0.0",
  "features": [
    "식물 질병 진단",
    "치료법 제공",
    "식물 정보 제공",
    "한국어 지원"
  ]
}
```

### 2. Plant.id API 상태 확인
```http
GET /api/plant-id-status
```

### 3. 식물 진단 (파일 업로드)
```http
POST /api/diagnose
Content-Type: multipart/form-data

image: [이미지 파일]
```

**응답 예시:**
```json
{
  "success": true,
  "result": {
    "status": "세균성 질병 의심",
    "icon": "🚨",
    "confidence": 87,
    "symptoms": [
      {
        "name": "세균성 반점병",
        "probability": 87,
        "description": "세균 감염으로 인해 잎에 갈색 반점이 나타납니다."
      }
    ],
    "causes": [
      {
        "name": "세균성 반점병",
        "probability": 87,
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
      "commonNames": ["토마토", "Tomato"],
      "scientificName": "Solanum lycopersicum",
      "family": "Solanaceae"
    },
    "analysisType": "real",
    "provider": "Plant.id (Kindwise)"
  }
}
```

### 4. 식물 진단 (Base64 이미지)
```http
POST /api/diagnose-base64
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "filename": "plant.jpg"
}
```

## 🔧 프론트엔드 연동

### JavaScript 예시
```javascript
// 파일 업로드 방식
async function diagnoseImageFile(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('http://localhost:3001/api/diagnose', {
        method: 'POST',
        body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
        console.log('진단 결과:', result.result.status);
        console.log('치료법:', result.result.treatments);
        return result.result;
    } else {
        throw new Error(result.error);
    }
}

// Base64 방식
async function diagnoseImageBase64(base64Image, filename) {
    const response = await fetch('http://localhost:3001/api/diagnose-base64', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image: base64Image,
            filename: filename
        })
    });
    
    const result = await response.json();
    return result;
}

// 사용 예시
const fileInput = document.getElementById('imageFile');
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            const diagnosis = await diagnoseImageFile(file);
            displayResult(diagnosis);
        } catch (error) {
            console.error('진단 실패:', error.message);
        }
    }
});
```

## 💰 Plant.id API 사용량

### Kindwise Plant.id 요금제
- **무료**: 월 100회 진단
- **Basic**: $19/월 (1,000회)
- **Pro**: $49/월 (5,000회)
- **Enterprise**: $199/월 (25,000회)

### 현재 설정된 API 키
```
API 키: GFdEnaLYvtoHGKeZY3Ibk9yRrtumarp46lig3I8pVa4c1bbE8E
```

**사용량 확인**: [Kindwise Dashboard](https://web.plant.id/plant-identification-api/)에서 실시간 사용량을 확인할 수 있습니다.

## 🔧 고급 설정

### 환경 변수 (.env)
```bash
# Plant.id API 설정
PLANT_ID_API_KEY=your_api_key_here
PLANT_ID_BASE_URL=https://api.plant.id/v3

# 서버 설정
PORT=3001
NODE_ENV=development

# CORS 설정
FRONTEND_URL=http://localhost:8000

# 파일 업로드 설정
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# API 설정
REQUEST_TIMEOUT=30000
MAX_REQUESTS_PER_MINUTE=60
```

### 이미지 최적화
서버는 자동으로 이미지를 최적화합니다:
- 최대 크기: 1024x1024px
- 품질: 85%
- 형식: JPEG 변환

## 🐛 문제 해결

### 1. API 키 오류
```
❌ Plant.id API 키가 설정되지 않았습니다.
```
**해결책**: `.env` 파일에 올바른 API 키 설정

### 2. 서버 연결 오류
```
❌ 서버 연결 실패: 서버가 실행되지 않았습니다.
```
**해결책**: `npm run dev`로 서버 실행

### 3. 파일 크기 오류
```
❌ 파일 크기가 너무 큽니다.
```
**해결책**: 10MB 이하 이미지 사용

### 4. API 할당량 초과
```
❌ Plant.id API 오류: 429 - Rate limit exceeded
```
**해결책**: 월 할당량 확인 또는 유료 플랜 업그레이드

## 📊 성능 최적화

### 1. 이미지 압축
- Sharp 라이브러리로 자동 압축
- API 호출 시간 단축
- 대역폭 사용량 감소

### 2. 캐싱 (향후 구현)
```javascript
// Redis 캐싱 예시
const redis = require('redis');
const client = redis.createClient();

async function getCachedResult(imageHash) {
    const cached = await client.get(imageHash);
    return cached ? JSON.parse(cached) : null;
}
```

### 3. 요청 제한
- 분당 최대 60회 요청
- API 남용 방지
- 안정적인 서비스 제공

## 📚 추가 리소스

- [Plant.id API 문서](https://github.com/flowerchecker/Plant-id-API)
- [Kindwise 공식 사이트](https://www.kindwise.com/plant-id)
- [Plant.id 대시보드](https://web.plant.id/)

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 라이선스

MIT License - 자유롭게 사용하세요!

---

**🌱 Happy Plant Diagnosing! 🌱**