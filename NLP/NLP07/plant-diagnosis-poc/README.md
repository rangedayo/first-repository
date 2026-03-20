# 식물 진단 PoC (Proof of Concept)

## 프로젝트 개요
사진 업로드를 통한 식물 상태 진단 웹 애플리케이션의 PoC입니다.

## 기능
- 이미지 업로드 (드래그 앤 드롭)
- 식물 상태 분석 시뮬레이션
- 결과 표시 및 해결책 제공

## 기술 스택
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: 추후 Node.js + Express (현재는 프론트엔드만)
- AI: 시뮬레이션 (추후 Plant.id API 연동)

## 실행 방법
```bash
# 간단한 HTTP 서버로 실행
python -m http.server 8000
# 또는
npx serve .
```

브라우저에서 http://localhost:8000 접속

## 폴더 구조
```
plant-diagnosis-poc/
├── index.html          # 메인 페이지
├── upload.html         # 업로드 페이지
├── result.html         # 결과 페이지
├── css/
│   └── style.css       # 스타일시트
├── js/
│   ├── main.js         # 메인 로직
│   ├── upload.js       # 업로드 처리
│   └── analysis.js     # 분석 시뮬레이션
└── assets/
    └── images/         # 이미지 파일들
```