const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

// 미들웨어 설정
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8000',
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 업로드 디렉토리 생성
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`📁 업로드 디렉토리 생성: ${uploadDir}`);
}

// Multer 설정 (이미지 업로드)
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
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('이미지 파일만 업로드 가능합니다.'));
        }
    }
});

// Plant.id API 클래스 (Kindwise 기반)
class PlantIdService {
    constructor() {
        this.apiKey = process.env.PLANT_ID_API_KEY;
        this.baseUrl = process.env.PLANT_ID_BASE_URL || 'https://api.plant.id/v3';
        this.timeout = parseInt(process.env.REQUEST_TIMEOUT) || 30000;
        
        if (!this.apiKey) {
            console.error('❌ PLANT_ID_API_KEY가 설정되지 않았습니다!');
        } else {
            console.log('✅ Plant.id API 키 설정 완료');
        }
    }
    
    // 이미지 최적화 (용량 줄이기)
    async optimizeImage(imagePath) {
        try {
            const optimizedBuffer = await sharp(imagePath)
                .resize(1024, 1024, { 
                    fit: 'inside',
                    withoutEnlargement: true 
                })
                .jpeg({ 
                    quality: 85,
                    progressive: true 
                })
                .toBuffer();
            
            return optimizedBuffer.toString('base64');
        } catch (error) {
            console.warn('이미지 최적화 실패, 원본 사용:', error.message);
            const originalBuffer = fs.readFileSync(imagePath);
            return originalBuffer.toString('base64');
        }
    }
    
    // Plant.id API 호출 (건강 상태 + 식물 식별)
    async identifyPlant(base64Image) {
        if (!this.apiKey) {
            throw new Error('Plant.id API 키가 설정되지 않았습니다.');
        }
        
        console.log('🔍 Plant.id API 호출 시작...');
        
        const requestData = {
            images: [`data:image/jpeg;base64,${base64Image}`],
            
            // 모든 기능 활성화
            modifiers: [
                "crops_fast",           // 빠른 분석
                "similar_images",       // 유사 이미지
                "health_all",           // 모든 건강 상태 분석
                "disease_similar_images" // 질병 유사 이미지
            ],
            
            // 한국어 결과
            plant_language: "ko",
            
            // 상세 정보 요청
            plant_details: [
                "common_names",         // 일반명
                "url",                  // 위키피디아 링크
                "description",          // 설명
                "taxonomy",             // 분류학적 정보
                "synonyms",             // 동의어
                "edible_parts",         // 식용 부위
                "watering",             // 물주기 정보
                "propagation_methods"   // 번식 방법
            ],
            
            // 질병 정보도 함께 요청
            disease_details: [
                "common_names",
                "url", 
                "description",
                "treatment",
                "classification",
                "cause"
            ]
        };
        
        try {
            const response = await axios.post(
                `${this.baseUrl}/identification`,
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Api-Key': this.apiKey
                    },
                    timeout: this.timeout
                }
            );
            
            console.log('✅ Plant.id API 응답 성공');
            return response.data;
            
        } catch (error) {
            if (error.response) {
                console.error('❌ Plant.id API 오류:', error.response.status, error.response.data);
                throw new Error(`Plant.id API 오류: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                console.error('❌ 네트워크 오류:', error.message);
                throw new Error('Plant.id API 서버에 연결할 수 없습니다.');
            } else {
                console.error('❌ 요청 설정 오류:', error.message);
                throw new Error('API 요청 설정에 오류가 있습니다.');
            }
        }
    }
    
    // API 상태 확인
    async checkHealth() {
        try {
            // 작은 테스트 이미지로 API 상태 확인
            const testImage = this.createTestImage();
            await this.identifyPlant(testImage);
            return { status: 'ok', message: 'Plant.id API 정상 작동' };
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }
    
    // 1x1 테스트 이미지 생성
    createTestImage() {
        // 최소 크기의 JPEG 이미지 (base64)
        return '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';
    }
}

// 결과 처리 및 한국어 번역 클래스
class ResultProcessor {
    static processPlantIdResult(apiResult) {
        console.log('🔄 Plant.id 결과 처리 시작');
        
        const health = apiResult.health_assessment;
        const suggestions = apiResult.suggestions || [];
        
        let status = '건강함';
        let icon = '✅';
        let confidence = 0;
        let symptoms = [];
        let causes = [];
        let treatments = [];
        
        // 건강 상태 분석
        if (health) {
            // 건강한 상태 확인
            if (health.is_healthy) {
                confidence = Math.round(health.is_healthy.probability * 100);
                if (confidence < 70) {
                    status = '주의 관찰 필요';
                    icon = '⚠️';
                }
            }
            
            // 질병 감지
            if (health.diseases && health.diseases.length > 0) {
                const primaryDisease = health.diseases[0];
                confidence = Math.round(primaryDisease.probability * 100);
                
                // 질병 분류 및 한국어 번역
                const diseaseInfo = this.classifyDisease(primaryDisease);
                status = diseaseInfo.status;
                icon = diseaseInfo.icon;
                
                // 증상 추출
                symptoms = health.diseases.map(disease => ({
                    name: this.translateDiseaseName(disease.name),
                    probability: Math.round(disease.probability * 100),
                    description: disease.description || this.getDefaultDescription(disease.name)
                }));
                
                // 원인 및 치료법 추출
                causes = health.diseases.map(disease => ({
                    name: this.translateDiseaseName(disease.name),
                    probability: Math.round(disease.probability * 100),
                    cause: disease.cause || this.getDefaultCause(disease.name),
                    severity: this.getSeverity(disease.probability)
                }));
                
                // 치료법 생성
                treatments = this.generateTreatments(health.diseases);
            }
        }
        
        // 식물 정보
        const plantInfo = this.extractPlantInfo(suggestions);
        
        const result = {
            // 진단 결과
            status,
            icon,
            confidence,
            
            // 상세 정보
            symptoms: symptoms.slice(0, 5), // 상위 5개 증상
            causes: causes.slice(0, 3),     // 상위 3개 원인
            treatments: {
                immediate: treatments.filter(t => t.type === 'immediate'),
                longterm: treatments.filter(t => t.type === 'longterm'),
                prevention: treatments.filter(t => t.type === 'prevention')
            },
            
            // 식물 정보
            plantInfo,
            
            // 메타데이터
            analysisType: 'real',
            provider: 'Plant.id (Kindwise)',
            timestamp: new Date().toISOString(),
            
            // 원본 데이터 (디버깅용)
            rawData: {
                health_assessment: health,
                suggestions: suggestions.slice(0, 3)
            }
        };
        
        console.log(`✅ 처리 완료: ${status} (${confidence}%)`);
        return result;
    }
    
    // 질병 분류
    static classifyDisease(disease) {
        const name = disease.name.toLowerCase();
        
        if (name.includes('bacterial') || name.includes('rot') || name.includes('blight')) {
            return { status: '세균성 질병 의심', icon: '🚨' };
        } else if (name.includes('fungal') || name.includes('mold') || name.includes('mildew')) {
            return { status: '곰팡이 질병 의심', icon: '🍄' };
        } else if (name.includes('virus') || name.includes('mosaic')) {
            return { status: '바이러스 감염 의심', icon: '🦠' };
        } else if (name.includes('pest') || name.includes('insect') || name.includes('mite')) {
            return { status: '병충해 피해', icon: '🐛' };
        } else if (name.includes('deficiency') || name.includes('nutrient')) {
            return { status: '영양 결핍', icon: '⚠️' };
        } else if (name.includes('overwater') || name.includes('water')) {
            return { status: '과습 문제', icon: '💧' };
        } else if (name.includes('drought') || name.includes('dry')) {
            return { status: '건조 스트레스', icon: '🌵' };
        } else {
            return { status: '질병 의심', icon: '🔍' };
        }
    }
    
    // 질병명 한국어 번역
    static translateDiseaseName(englishName) {
        const translations = {
            // 세균성 질병
            'bacterial_spot': '세균성 반점병',
            'bacterial_wilt': '세균성 시들음병',
            'bacterial_canker': '세균성 궤양병',
            'fire_blight': '화상병',
            
            // 곰팡이 질병
            'powdery_mildew': '흰가루병',
            'downy_mildew': '노균병',
            'gray_mold': '잿빛곰팡이병',
            'black_spot': '검은반점병',
            'rust': '녹병',
            'anthracnose': '탄저병',
            'leaf_spot': '잎반점병',
            
            // 바이러스
            'mosaic_virus': '모자이크바이러스',
            'yellow_leaf_curl_virus': '황화잎말림바이러스',
            'ring_spot_virus': '윤문바이러스',
            
            // 해충
            'aphids': '진딧물',
            'spider_mites': '거미진드기',
            'whitefly': '온실가루이',
            'thrips': '총채벌레',
            'scale_insects': '깍지벌레',
            
            // 생리적 장애
            'nitrogen_deficiency': '질소 결핍',
            'potassium_deficiency': '칼륨 결핍',
            'phosphorus_deficiency': '인 결핍',
            'iron_deficiency': '철분 결핍',
            'magnesium_deficiency': '마그네슘 결핍',
            'overwatering': '과습',
            'underwatering': '건조',
            'sunburn': '일소병',
            'cold_damage': '냉해',
            
            // 기타
            'healthy': '건강함',
            'unknown': '알 수 없음'
        };
        
        return translations[englishName] || englishName;
    }
    
    // 기본 설명 제공
    static getDefaultDescription(diseaseName) {
        const descriptions = {
            'bacterial_spot': '세균 감염으로 인해 잎에 갈색 반점이 나타납니다.',
            'powdery_mildew': '잎 표면에 흰 가루 같은 곰팡이가 생깁니다.',
            'overwatering': '물을 너무 많이 주어 뿌리가 썩기 시작했습니다.',
            'nitrogen_deficiency': '질소 부족으로 잎이 노랗게 변합니다.',
            'aphids': '진딧물이 잎과 줄기의 수액을 빨아먹고 있습니다.'
        };
        
        return descriptions[diseaseName] || '추가적인 관찰이 필요합니다.';
    }
    
    // 기본 원인 제공
    static getDefaultCause(diseaseName) {
        const causes = {
            'bacterial_spot': '습한 환경과 상처를 통한 세균 침입',
            'powdery_mildew': '높은 습도와 통풍 부족',
            'overwatering': '과도한 물 공급과 배수 불량',
            'nitrogen_deficiency': '토양의 질소 부족 또는 흡수 장애'
        };
        
        return causes[diseaseName] || '환경적 요인 또는 관리 부족';
    }
    
    // 심각도 판정
    static getSeverity(probability) {
        if (probability > 0.8) return 'high';
        if (probability > 0.5) return 'medium';
        return 'low';
    }
    
    // 치료법 생성
    static generateTreatments(diseases) {
        const treatments = [];
        
        diseases.forEach(disease => {
            const name = disease.name.toLowerCase();
            
            if (name.includes('bacterial')) {
                treatments.push(
                    { type: 'immediate', title: '감염 부위 제거', description: '병든 잎과 줄기를 즉시 제거하세요', priority: 1 },
                    { type: 'immediate', title: '구리 살균제 살포', description: '구리 성분의 살균제를 살포하세요', priority: 2 },
                    { type: 'longterm', title: '통풍 개선', description: '식물 간격을 넓혀 통풍을 개선하세요', priority: 1 },
                    { type: 'prevention', title: '물 주기 조절', description: '잎에 물이 닿지 않도록 뿌리 부근에만 물을 주세요', priority: 1 }
                );
            } else if (name.includes('fungal') || name.includes('mildew')) {
                treatments.push(
                    { type: 'immediate', title: '곰팡이 제거', description: '흰 가루나 곰팡이를 부드럽게 닦아내세요', priority: 1 },
                    { type: 'immediate', title: '살균제 처리', description: '친환경 살균제를 살포하세요', priority: 2 },
                    { type: 'longterm', title: '습도 조절', description: '실내 습도를 50-60%로 유지하세요', priority: 1 },
                    { type: 'prevention', title: '정기 점검', description: '주 1회 잎 상태를 점검하세요', priority: 2 }
                );
            } else if (name.includes('overwater')) {
                treatments.push(
                    { type: 'immediate', title: '물 주기 중단', description: '흙이 마를 때까지 물 주기를 중단하세요', priority: 1 },
                    { type: 'immediate', title: '배수 확인', description: '화분 바닥의 배수구를 확인하세요', priority: 1 },
                    { type: 'longterm', title: '물 주기 조절', description: '흙 표면이 2-3cm 말랐을 때 물을 주세요', priority: 1 },
                    { type: 'prevention', title: '배수층 개선', description: '화분 바닥에 자갈이나 배수재를 깔아주세요', priority: 2 }
                );
            } else if (name.includes('deficiency')) {
                treatments.push(
                    { type: 'immediate', title: '영양제 공급', description: '해당 영양소가 포함된 비료를 주세요', priority: 1 },
                    { type: 'longterm', title: '정기 시비', description: '월 1-2회 균형잡힌 비료를 주세요', priority: 1 },
                    { type: 'prevention', title: '토양 개선', description: '유기물이 풍부한 토양으로 교체하세요', priority: 2 }
                );
            }
        });
        
        // 중복 제거 및 우선순위 정렬
        const uniqueTreatments = treatments.filter((treatment, index, self) => 
            index === self.findIndex(t => t.title === treatment.title)
        );
        
        return uniqueTreatments.sort((a, b) => a.priority - b.priority);
    }
    
    // 식물 정보 추출
    static extractPlantInfo(suggestions) {
        if (!suggestions || suggestions.length === 0) {
            return null;
        }
        
        const plant = suggestions[0];
        return {
            name: plant.plant_name,
            probability: Math.round(plant.probability * 100),
            commonNames: plant.plant_details?.common_names || [],
            scientificName: plant.plant_details?.taxonomy ? 
                `${plant.plant_details.taxonomy.genus} ${plant.plant_details.taxonomy.species}` : null,
            family: plant.plant_details?.taxonomy?.family,
            description: plant.plant_details?.description,
            careInstructions: {
                watering: plant.plant_details?.watering,
                edibleParts: plant.plant_details?.edible_parts,
                propagation: plant.plant_details?.propagation_methods
            },
            url: plant.plant_details?.url
        };
    }
}

// API 라우트들

// 1. 서버 상태 확인
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: '식물 진단 서버가 정상 작동 중입니다.',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        features: [
            '식물 질병 진단',
            '치료법 제공',
            '식물 정보 제공',
            '한국어 지원'
        ]
    });
});

// 2. Plant.id API 상태 확인
app.get('/api/plant-id-status', async (req, res) => {
    try {
        const plantService = new PlantIdService();
        const status = await plantService.checkHealth();
        res.json(status);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// 3. 메인 식물 진단 엔드포인트
app.post('/api/diagnose', upload.single('image'), async (req, res) => {
    let tempFilePath = null;
    
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: '이미지 파일이 필요합니다.'
            });
        }
        
        tempFilePath = req.file.path;
        console.log(`🔍 식물 진단 시작: ${req.file.filename} (${Math.round(req.file.size / 1024)}KB)`);
        
        // 이미지 최적화 및 base64 변환
        const plantService = new PlantIdService();
        const base64Image = await plantService.optimizeImage(tempFilePath);
        
        console.log(`📊 최적화된 이미지 크기: ${Math.round(base64Image.length / 1024)}KB`);
        
        // Plant.id API 호출
        const apiResult = await plantService.identifyPlant(base64Image);
        
        // 결과 처리 및 한국어 번역
        const processedResult = ResultProcessor.processPlantIdResult(apiResult);
        
        // 성공 응답
        res.json({
            success: true,
            result: processedResult,
            metadata: {
                filename: req.file.filename,
                originalSize: req.file.size,
                processedAt: new Date().toISOString(),
                processingTime: Date.now() - req.startTime
            }
        });
        
        console.log(`✅ 진단 완료: ${processedResult.status} (${processedResult.confidence}%)`);
        
    } catch (error) {
        console.error('❌ 진단 실패:', error.message);
        
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
                console.log(`🗑️ 임시 파일 삭제: ${path.basename(tempFilePath)}`);
            } catch (cleanupError) {
                console.warn(`⚠️ 파일 삭제 실패: ${cleanupError.message}`);
            }
        }
    }
});

// 4. Base64 이미지로 진단
app.post('/api/diagnose-base64', async (req, res) => {
    try {
        const { image, filename } = req.body;
        
        if (!image) {
            return res.status(400).json({
                success: false,
                error: 'base64 이미지 데이터가 필요합니다.'
            });
        }
        
        console.log(`🔍 Base64 진단 시작: ${filename || 'unknown'}`);
        
        // base64에서 실제 이미지 데이터 추출
        const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
        
        // Plant.id API 호출
        const plantService = new PlantIdService();
        const apiResult = await plantService.identifyPlant(base64Data);
        
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
        
        console.log(`✅ Base64 진단 완료: ${processedResult.status}`);
        
    } catch (error) {
        console.error('❌ Base64 진단 실패:', error.message);
        
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 요청 시간 추적 미들웨어
app.use((req, res, next) => {
    req.startTime = Date.now();
    next();
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
            'GET /api/health - 서버 상태 확인',
            'GET /api/plant-id-status - Plant.id API 상태 확인',
            'POST /api/diagnose - 이미지 파일로 식물 진단',
            'POST /api/diagnose-base64 - Base64 이미지로 식물 진단'
        ]
    });
});

// 서버 시작
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🌱 Plant Diagnosis Server (Kindwise Plant.id)`);
    console.log(`🚀 서버 주소: http://localhost:${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Plant.id Status: http://localhost:${PORT}/api/plant-id-status`);
    console.log(`🔍 진단 엔드포인트: POST http://localhost:${PORT}/api/diagnose`);
    
    if (process.env.PLANT_ID_API_KEY) {
        console.log(`✅ Plant.id API 키 설정됨 (Kindwise)`);
    } else {
        console.log(`⚠️ Plant.id API 키가 설정되지 않았습니다.`);
    }
});

module.exports = app;