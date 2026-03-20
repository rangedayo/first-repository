# Plant.id API 서버 설정 가이드

## 🚀 빠른 시작

### 1. Plant.id API 키 발급
1. https://web.plant.id/ 접속
2. 회원가입 후 로그인
3. Dashboard에서 API 키 복사
4. **무료 플랜: 월 100회 분석 가능**

### 2. 서버 설치
```bash
cd plant-diagnosis-poc/server
npm install
```

### 3. 환경 설정
```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집 (API 키 입력)
PLANT_ID_API_KEY=your_actual_api_key_here
```

### 4. 서버 실행
```bash
# 개발 모드 (자동 재시작)
npm run dev

# 프로덕션 모드
npm start
```

### 5. 테스트
```bash
# API 직접 테스트
npm run test api

# 서버 테스트 (서버 실행 후)
npm run test server

# 모든 테스트
npm run test all
```

## 📡 API 엔드포인트

### 기본 정보
- **서버 주소**: http://localhost:3001
- **CORS**: http://localhost:8000 허용

### 엔드포인트 목록

#### 1. 서버 상태 확인
```http
GET /api/health
```
**응답:**
```json
{
  "status": "ok",
  "message": "서버가 정상 작동 중입니다.",
  "timestamp": "2026-03-20T12:00:00.000Z",
  "version": "1.0.0"
}
```

#### 2. Plant.id API 상태 확인
```http
GET /api/plant-id-status
```
**응답:**
```json
{
  "status": "ok",
  "message": "API 정상 작동"
}
```

#### 3. 이미지 파일 분석
```http
POST /api/analyze
Content-Type: multipart/form-data

image: [이미지 파일]
```
**응답:**
```json
{
  "success": true,
  "result": {
    "status": "과습 의심",
    "icon": "🚨",
    "confidence": 85,
    "symptoms": ["잎이 노랗게 변함"],
    "causes": [
      {
        "name": "물 과다 공급",
        "probability": 90,
        "description": "물을 너무 많이 주어 뿌리가 손상되었습니다.",
        "severity": "high"
      }
    ],
    "plantInfo": {
      "name": "토마토",
      "probability": 95,
      "commonNames": ["토마토", "Tomato"]
    },
    "analysisType": "real",
    "provider": "Plant.id"
  }
}
```

#### 4. Base64 이미지 분석
```http
POST /api/analyze-base64
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  "filename": "plant.jpg"
}
```

## 🔧 프론트엔드 연동

### JavaScript 예시
```javascript
// 파일 업로드 방식
async function analyzeImageFile(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        body: formData
    });
    
    const result = await response.json();
    return result;
}

// Base64 방식
async function analyzeImageBase64(base64Image, filename) {
    const response = await fetch('http://localhost:3001/api/analyze-base64', {
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
```

## 💰 Plant.id API 요금제

### 무료 플랜
- **월 100회** 분석
- 모든 기능 사용 가능
- 신용카드 불필요

### 유료 플랜
- **Basic**: $19/월 (1,000회)
- **Pro**: $49/월 (5,000회)
- **Enterprise**: $199/월 (25,000회)

## 🐛 문제 해결

### 1. API 키 오류
```
❌ Plant.id API 키가 설정되지 않았습니다.
```
**해결책**: .env 파일에 올바른 API 키 설정

### 2. 네트워크 오류
```
❌ 네트워크 오류: fetch failed
```
**해결책**: 인터넷 연결 확인, 방화벽 설정 확인

### 3. 파일 크기 오류
```
❌ 파일 크기가 너무 큽니다.
```
**해결책**: 10MB 이하 이미지 사용

### 4. CORS 오류
```
❌ Access to fetch blocked by CORS policy
```
**해결책**: .env 파일에서 FRONTEND_URL 확인

## 📊 사용량 모니터링

Plant.id 대시보드에서 실시간 사용량 확인:
- 남은 크레딧
- 일일/월간 사용량
- API 호출 기록

## 🔄 업그레이드 경로

1. **무료 → Basic**: 사용량 증가 시
2. **Basic → Pro**: 일일 100회 이상 필요 시
3. **자체 모델**: 월 10,000회 이상 시 고려

## 📞 지원

- Plant.id 공식 문서: https://github.com/flowerchecker/Plant-id-API
- 이메일 지원: support@plant.id
- 커뮤니티: Plant.id Discord