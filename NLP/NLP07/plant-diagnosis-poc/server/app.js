const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();

// 미들웨어 설정
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8000',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 업로드 디렉토리 생성
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`📁 업로드 디렉토리 생성: ${uploadDir}`);
}

// Multer 설정 (파일 업로드)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `plant-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        // 이미지 파일만 허용
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('이미지 파일만 업로드 가능합니다.'));
        }
    }
});

// Plant.id API 클래스
class PlantIdAPI {
    constructor() {
        this.apiKey = process.env.PLANT_ID_API_KEY;
        this.baseUrl = process.env.PLANT_ID_BASE_URL || 'https://api.plant.id/v3';
        this.timeout = parseInt(process.env.REQUEST_TIMEOUT) || 30000;
        
        if (!this.apiKey) {
            console.warn('⚠️  PLANT_ID_API_KEY가 설정되지 않았습니다!');
        }
    }
    
    // 이미지 분석 요청
    async identifyPlant(base64Image, options = {}) {
        if (!this.apiKey) {
            throw new Error('Plant.id API 키가 설정되지 않았습니다. .env 파일을 확인하세요.');
        }
        
        const requestBody = {
            images: [base64Image],
            modifiers: [
                "crops_fast",           // 빠른 분석
                "similar_images",       // 유사 이미지
                "health_only",          // 건강 상태만
                "disease_similar_images" // 질병 유사 이미지
            ],
            plant_language: "ko",       // 한국어 결과
            plant_details: [
                "common_names",
                "url", 
                "description",
                "taxonomy"
            ],
            // 추가 옵션
            ...options
        };
        
        console.log('🔍 Plant.id API 요청 시작...');
        console.log(`📊 이미지 크기: ${Math.round(base64Image.length / 1024)}KB`);
        
        try {
            const response = await fetch(`${this.baseUrl}/identification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Api-Key': this.apiKey
                },
                body: JSON.stringify(requestBody),
                timeout: this.timeout
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Plant.id API 오류 (${response.status}):`, errorText);
                throw new Error(`Plant.id API 오류: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Plant.id API 응답 성공');
            
            return result;
            
        } catch (error) {
            console.error('❌ Plant.id API 호출 실패:', error.message);
            throw error;
        }
    }
    
    // API 상태 확인
    async checkApiStatus() {
        try {
            // 간단한 테스트 이미지로 API 상태 확인
            const testImage = this.createTestImage();
            await this.identifyPlant(testImage);
            return { status: 'ok', message: 'API 정상 작동' };
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }
    
    // 테스트용 작은 이미지 생성
    createTestImage() {
        // 1x1 픽셀 투명 PNG를 base64로 인코딩
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    }
}

// 결과 처리 클래스
class ResultProcessor {
    static processPlantIdResult(apiResult) {
        console.log('🔄 Plant.id 결과 처리 시작');
        
        const health = apiResult.health_assessment;
        const suggestions = apiResult.suggestions || [];
        
        // 기본값 설정
        let status = '건강함';
        let icon = '✅';
        let confidence = 0;
        let symptoms = ['특별한 증상 없음'];
        let causes = [];
        
        // 건강 상태 분석
        if (health) {
            if (health.is_healthy && health.is_healthy.probability) {
                confidence = Math.round(health.is_healthy.probability * 100);
                
                if (confidence < 70) {
                    status = '주의 관찰 필요';
                    icon = '⚠️';
                }
            }
            
            // 질병이 감지된 경우
            if (health.diseases && health.diseases.length > 0) {
                const primaryDisease = health.diseases[0];
                confidence = Math.round(primaryDisease.probability * 100);
                
                // 질병 유형별 분류
                const diseaseName = primaryDisease.name.toLowerCase();
                
                if (diseaseName.includes('bacterial') || diseaseName.includes('fungal') || diseaseName.includes('rot')) {
                    status = '과습/세균성 질병 의심';
                    icon = '🚨';
                } else if (diseaseName.includes('wilt') || diseaseName.includes('dry')) {
                    status = '건조/시듦 증상';
                    icon = '🌵';
                } else if (diseaseName.includes('deficiency') || diseaseName.includes('nutrient')) {
                    status = '영양 부족';
                    icon = '⚠️';
                } else if (diseaseName.includes('pest') || diseaseName.includes('insect')) {
                    status = '병충해 의심';
                    icon = '🐛';
                } else {
                    status = '질병 의심';
                    icon = '🔍';
                }
                
                // 증상 추출
                symptoms = health.diseases.map(disease => 
                    this.translateToKorean(disease.name)
                );
                
                // 원인 분석
                causes = health.diseases.map(disease => ({
                    name: this.translateToKorean(disease.name),
                    probability: Math.round(disease.probability * 100),
                    description: disease.description || this.getDefaultDescription(disease.name),
                    severity: disease.probability > 0.7 ? 'high' : disease.probability > 0.4 ? 'medium' : 'low'
                }));
            }
        }
        
        // 식물 정보
        const plantInfo = suggestions.length > 0 ? {
            name: suggestions[0].plant_name,
            probability: Math.round(suggestions[0].probability * 100),
            commonNames: suggestions[0].plant_details?.common_names || [],
            scientificName: suggestions[0].plant_details?.taxonomy?.genus + ' ' + suggestions[0].plant_details?.taxonomy?.species
        } : null;
        
        const result = {
            status,
            icon,
            confidence,
            symptoms,
            causes: causes.slice(0, 3), // 상위 3개만
            plantInfo,
            analysisType: 'real',
            provider: 'Plant.id',
            timestamp: new Date().toISOString()
        };
        
        console.log(`✅ 처리 완료: ${status} (${confidence}%)`);
        return result;
    }
    
    // 영어 질병명을 한국어로 번역
    static translateToKorean(englishName) {
        const translations = {
            // 일반적인 질병
            'bacterial_spot': '세균성 반점병',
            'early_blight': '조기 마름병', 
            'late_blight': '후기 마름병',
            'leaf_mold': '잎 곰팡이병',
            'septoria_leaf_spot': '갈색 반점병',
            'target_spot': '표적 반점병',
            'powdery_mildew': '흰가루병',
            'downy_mildew': '노균병',
            
            // 해충
            'spider_mites': '거미 진드기',
            'two_spotted_spider_mite': '점박이 응애',
            'aphids': '진딧물',
            'whitefly': '온실가루이',
            'thrips': '총채벌레',
            
            // 바이러스
            'yellow_leaf_curl_virus': '황화잎말림바이러스',
            'mosaic_virus': '모자이크 바이러스',
            'tomato_spotted_wilt_virus': '토마토 반점 시들음 바이러스',
            
            // 생리적 장애
            'overwatering': '과습',
            'underwatering': '건조',
            'nitrogen_deficiency': '질소 결핍',
            'potassium_deficiency': '칼륨 결핍',
            'phosphorus_deficiency': '인 결핍',
            'iron_deficiency': '철분 결핍',
            'magnesium_deficiency': '마그네슘 결핍',
            
            // 환경적 요인
            'sunburn': '일소병',
            'cold_damage': '냉해',
            'heat_stress': '고온 스트레스',
            'wind_damage': '바람 피해',
            
            // 기타
            'healthy': '건강함',
            'unknown': '알 수 없음'
        };
        
        return translations[englishName] || englishName;
    }
    
    // 기본 설명 제공
    static getDefaultDescription(diseaseName) {
        const descriptions = {
            'bacterial_spot': '세균 감염으로 인한 반점이 잎에 나타납니다.',
            'overwatering': '물을 너무 많이 주어 뿌리가 손상되었습니다.',
            'underwatering': '물 부족으로 식물이 스트레스를 받고 있습니다.',
            'nitrogen_deficiency': '질소 부족으로 잎이 노랗게 변합니다.',
            'spider_mites': '거미 진드기가 잎을 가해하고 있습니다.'
        };
        
        return descriptions[diseaseName] || '추가적인 관찰과 관리가 필요합니다.';
    }
}

// API 라우트들
// 1. 서버 상태 확인
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: '서버가 정상 작동 중입니다.',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 2. Plant.id API 상태 확인
app.get('/api/plant-id-status', async (req, res) => {
    try {
        const plantApi = new PlantIdAPI();
        const status = await plantApi.checkApiStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// 3. 메인 분석 엔드포인트
app.post('/api/analyze', upload.single('image'), async (req, res) => {
    let tempFilePath = null;
    
    try {
        // 파일 검증
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: '이미지 파일이 필요합니다.'
            });
        }
        
        tempFilePath = req.file.path;
        console.log(`📷 분석 시작: ${req.file.filename} (${Math.round(req.file.size / 1024)}KB)`);
        
        // 이미지를 base64로 변환
        const imageBuffer = fs.readFileSync(tempFilePath);
        const base64Image = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
        
        // Plant.id API 호출
        const plantApi = new PlantIdAPI();
        const apiResult = await plantApi.identifyPlant(base64Image);
        
        // 결과 처리
        const processedResult = ResultProcessor.processPlantIdResult(apiResult);
        
        // 성공 응답
        res.json({
            success: true,
            result: processedResult,
            metadata: {
                filename: req.file.filename,
                filesize: req.file.size,
                processedAt: new Date().toISOString()
            }
        });
        
        console.log(`✅ 분석 완료: ${processedResult.status}`);
        
    } catch (error) {
        console.error('❌ 분석 실패:', error.message);
        
        // 에러 응답
        res.status(500).json({
            success: false,
            error: error.message,
            errorType: error.name,
            timestamp: new Date().toISOString()
        });
        
    } finally {
        // 임시 파일 정리
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
                console.log(`🗑️  임시 파일 삭제: ${path.basename(tempFilePath)}`);
            } catch (cleanupError) {
                console.warn(`⚠️  파일 삭제 실패: ${cleanupError.message}`);
            }
        }
    }
});

// 4. Base64 이미지로 분석 (선택적)
app.post('/api/analyze-base64', async (req, res) => {
    try {
        const { image, filename } = req.body;
        
        if (!image) {
            return res.status(400).json({
                success: false,
                error: 'base64 이미지 데이터가 필요합니다.'
            });
        }
        
        console.log(`📷 Base64 분석 시작: ${filename || 'unknown'}`);
        
        // Plant.id API 호출
        const plantApi = new PlantIdAPI();
        const apiResult = await plantApi.identifyPlant(image);
        
        // 결과 처리
        const processedResult = ResultProcessor.processPlantIdResult(apiResult);
        
        res.json({
            success: true,
            result: processedResult,
            metadata: {
                filename: filename || 'base64-image',
                processedAt: new Date().toISOString()
            }
        });
        
        console.log(`✅ Base64 분석 완료: ${processedResult.status}`);
        
    } catch (error) {
        console.error('❌ Base64 분석 실패:', error.message);
        
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 에러 핸들링 미들웨어
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: '파일 크기가 너무 큽니다. 최대 10MB까지 업로드 가능합니다.'
            });
        }
    }
    
    console.error('🚨 서버 오류:', error);
    res.status(500).json({
        success: false,
        error: '서버 내부 오류가 발생했습니다.',
        timestamp: new Date().toISOString()
    });
});

// 404 핸들링
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: '요청한 엔드포인트를 찾을 수 없습니다.',
        availableEndpoints: [
            'GET /api/health',
            'GET /api/plant-id-status', 
            'POST /api/analyze',
            'POST /api/analyze-base64'
        ]
    });
});

// 서버 시작
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🌱 Plant Diagnosis Server 시작됨`);
    console.log(`🚀 서버 주소: http://localhost:${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Plant.id Status: http://localhost:${PORT}/api/plant-id-status`);
    
    if (process.env.PLANT_ID_API_KEY) {
        console.log(`✅ Plant.id API 키 설정됨`);
    } else {
        console.log(`⚠️  Plant.id API 키가 설정되지 않았습니다.`);
        console.log(`   .env 파일에 PLANT_ID_API_KEY를 추가하세요.`);
    }
});

module.exports = app;