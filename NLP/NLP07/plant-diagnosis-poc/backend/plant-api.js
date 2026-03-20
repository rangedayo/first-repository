// Plant.id API 연동 예시
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Plant.id API 설정
const PLANT_ID_API_KEY = process.env.PLANT_ID_API_KEY; // 환경변수로 관리
const PLANT_ID_URL = 'https://api.plant.id/v3/identification';

// 이미지 분석 엔드포인트
app.post('/api/analyze', upload.single('image'), async (req, res) => {
    try {
        console.log('분석 요청 받음:', req.file.filename);
        
        // 이미지를 base64로 변환
        const imagePath = req.file.path;
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        
        // Plant.id API 호출
        const plantIdResponse = await fetch(PLANT_ID_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': PLANT_ID_API_KEY
            },
            body: JSON.stringify({
                images: [`data:image/jpeg;base64,${base64Image}`],
                modifiers: [
                    "crops_fast",
                    "similar_images", 
                    "health_only",
                    "disease_similar_images"
                ],
                plant_language: "ko", // 한국어 결과
                plant_details: [
                    "common_names",
                    "url",
                    "description",
                    "taxonomy",
                    "rank",
                    "gbif_id"
                ]
            })
        });
        
        const plantIdResult = await plantIdResponse.json();
        console.log('Plant.id 응답:', plantIdResult);
        
        // 결과 가공
        const processedResult = processPlantIdResult(plantIdResult);
        
        // 임시 파일 삭제
        fs.unlinkSync(imagePath);
        
        res.json({
            success: true,
            result: processedResult,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('분석 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Plant.id 결과를 우리 형식으로 변환
function processPlantIdResult(plantIdData) {
    const health = plantIdData.health_assessment;
    const suggestions = plantIdData.suggestions || [];
    
    // 건강 상태 판단
    let status = '건강함';
    let icon = '✅';
    let confidence = 0;
    
    if (health && health.diseases && health.diseases.length > 0) {
        const primaryDisease = health.diseases[0];
        confidence = Math.round(primaryDisease.probability * 100);
        
        // 질병 타입에 따른 상태 매핑
        if (primaryDisease.name.includes('rot') || primaryDisease.name.includes('fungal')) {
            status = '과습 의심';
            icon = '🚨';
        } else if (primaryDisease.name.includes('wilt') || primaryDisease.name.includes('dry')) {
            status = '건조 상태';
            icon = '🌵';
        } else if (primaryDisease.name.includes('deficiency')) {
            status = '영양 부족';
            icon = '⚠️';
        } else {
            status = '병충해 의심';
            icon = '🐛';
        }
    } else if (health && health.is_healthy) {
        confidence = Math.round(health.is_healthy.probability * 100);
    }
    
    // 증상 추출
    const symptoms = health?.diseases?.map(d => d.name) || ['특별한 증상 없음'];
    
    // 원인 분석
    const causes = health?.diseases?.map((disease, index) => ({
        name: translateDiseaseName(disease.name),
        probability: Math.round(disease.probability * 100),
        description: disease.description || '추가 정보가 필요합니다.'
    })) || [];
    
    return {
        status,
        icon,
        confidence,
        symptoms,
        causes,
        plantInfo: suggestions.length > 0 ? {
            name: suggestions[0].plant_name,
            probability: Math.round(suggestions[0].probability * 100)
        } : null,
        rawData: plantIdData // 디버깅용
    };
}

// 질병명 한국어 번역
function translateDiseaseName(englishName) {
    const translations = {
        'bacterial_spot': '세균성 반점병',
        'early_blight': '조기 마름병',
        'late_blight': '후기 마름병',
        'leaf_mold': '잎 곰팡이병',
        'septoria_leaf_spot': '갈색 반점병',
        'spider_mites': '거미 진드기',
        'target_spot': '표적 반점병',
        'yellow_leaf_curl_virus': '황화잎말림바이러스',
        'mosaic_virus': '모자이크 바이러스',
        'healthy': '건강함'
    };
    
    return translations[englishName] || englishName;
}

// 서버 시작
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Plant API 서버가 포트 ${PORT}에서 실행 중입니다.`);
});

module.exports = app;