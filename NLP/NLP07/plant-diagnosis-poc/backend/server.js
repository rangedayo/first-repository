const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

// 업로드 디렉토리 생성
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = (process.env.ALLOWED_FORMATS || 'image/jpeg,image/png,image/jpg').split(',');
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('지원하지 않는 파일 형식입니다.'));
        }
    }
});

// Plant.id API 클래스
class PlantIdAnalyzer {
    constructor() {
        this.apiKey = process.env.PLANT_ID_API_KEY;
        this.baseUrl = process.env.PLANT_ID_BASE_URL || 'https://api.plant.id/v3';
        this.timeout = parseInt(process.env.PLANT_ID_TIMEOUT) || 30000;
    }
    
    async analyze(base64Image) {
        if (!this.apiKey) {
            throw new Error('Plant.id API 키가 설정되지 않았습니다.');
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
            const response = await fetch(`${this.baseUrl}/identification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Api-Key': this.apiKey
                },
                body: JSON.stringify({
                    images: [`data:image/jpeg;base64,${base64Image}`],
                    modifiers: [
                        "crops_fast",
                        "similar_images", 
                        "health_only",
                        "disease_similar_images"
                    ],
                    plant_language: "ko",
                    plant_details: [
                        "common_names",
                        "url", 
                        "description",
                        "taxonomy"
                    ]
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Plant.id API 오류 (${response.status}): ${errorText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('API 요청 시간 초과');
            }
            throw error;
        }
    }
}

// 결과 처리 클래스
class ResultProcessor {
    static process(plantIdData) {
        const health = plantIdData.health_assessment;
        const suggestions = plantIdData.suggestions || [];
        
        let status = '건강함';
        let icon = '✅';
        let confidence = 0;
        
        if (health && health.diseases && health.diseases.length > 0) {
            const primaryDisease = health.diseases[0];
            confidence = Math.round(primaryDisease.probability * 100);
            
            // 질병 분류
            const diseaseName = primaryDisease.name.toLowerCase();
            if (diseaseName.includes('rot') || diseaseName.includes('fungal') || diseaseName.includes('mold')) {
                status = '과습 의심';
                icon = '🚨';
            } else if (diseaseName.includes('wilt') || diseaseName.includes('dry') || diseaseName.includes('drought')) {
                status = '건조 상태';
                icon = '🌵';
            } else if (diseaseName.includes('deficiency') || diseaseName.includes('nutrient')) {
                status = '영양 부족';
                icon = '⚠️';
            } else if (diseaseName.includes('pest') || diseaseName.includes('insect') || diseaseName.includes('mite')) {
                status = '병충해 의심';
                icon = '🐛';
            } else {
                status = '질병 의심';
                icon = '🔍';
            }
        } else if (health && health.is_healthy) {
            confidence = Math.round(health.is_healthy.probability * 100);
        }
        
        // 증상 및 원인 추출
        const symptoms = health?.diseases?.map(d => 
            ResultProcessor.translateDiseaseName(d.name)
        ) || ['특별한 증상 없음'];
        
        const causes = health?.diseases?.map(disease => ({
            name: ResultProcessor.translateDiseaseName(disease.name),
            probability: Math.round(disease.probability * 100),
            description: disease.description || ResultProcessor.getDefaultDescription(disease.name)
        })) || [];
        
        // 식물 정보
        const plantInfo = suggestions.length > 0 ? {
            name: suggestions[0].plant_name,
            probability: Math.round(suggestions[0].probability * 100),
            commonNames: suggestions[0].plant_details?.common_names || []
        } : null;
        
        return {
            status,
            icon,
            confidence,
            symptoms,
            causes,
            plantInfo,
            analysisType: 'real',
            apiProvider: 'Plant.id'
        };
    }
    
    static translateDiseaseName(englishName) {
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
            'powdery_mildew': '흰가루병',
            'downy_mildew': '노균병',
            'root_rot': '뿌리썩음병',
            'overwatering': '과습',
            'underwatering': '건조',
            'nitrogen_deficiency': '질소 결핍',
            'potassium_deficiency': '칼륨 결핍',
            'phosphorus_deficiency': '인 결핍',
            'healthy': '건강함'
        };
        
        return translations[englishName] || englishName;
    }
    
    static getDefaultDescription(diseaseName) {
        const descriptions = {
            'bacterial_spot': '세균에 의한 감염으로 잎에 반점이 생깁니다.',
            'overwatering': '물을 너무 많이 주어 뿌리가 손상된 상태입니다.',
            'underwatering': '물이 부족하여 식물이 시들어가고 있습니다.',
            'nitrogen_deficiency': '질소가 부족하여 잎이 노랗게 변합니다.',
            'root_rot': '뿌리가 썩어 식물 전체가 위험한 상태입니다.'
        };
        
        return descriptions[diseaseName] || '추가적인 관찰이 필요합니다.';
    }
}

// API 라우트
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.post('/api/analyze', upload.single('image'), async (req, res) => {
    let tempFilePath = null;
    
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: '이미지 파일이 필요합니다.'
            });
        }
        
        tempFilePath = req.file.path;
        console.log(`분석 시작: ${req.file.filename} (${req.file.size} bytes)`);
        
        // 이미지를 base64로 변환
        const imageBuffer = fs.readFileSync(tempFilePath);
        const base64Image = imageBuffer.toString('base64');
        
        // Plant.id API로 분석
        const analyzer = new PlantIdAnalyzer();
        const plantIdResult = await analyzer.analyze(base64Image);
        
        // 결과 처리
        const processedResult = ResultProcessor.process(plantIdResult);
        
        console.log(`분석 완료: ${processedResult.status} (${processedResult.confidence}%)`);
        
        res.json({
            success: true,
            result: processedResult,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('분석 오류:', error.message);
        
        // API 오류 시 기본 응답
        res.status(500).json({
            success: false,
            error: error.message,
            fallback: {
                status: '분석 실패',
                icon: '❌',
                confidence: 0,
                symptoms: ['분석을 완료할 수 없습니다'],
                causes: [{
                    name: 'API 오류',
                    probability: 100,
                    description: '서버 오류로 인해 분석에 실패했습니다. 나중에 다시 시도해주세요.'
                }]
            }
        });
    } finally {
        // 임시 파일 정리
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
                console.log(`임시 파일 삭제: ${tempFilePath}`);
            } catch (cleanupError) {
                console.warn(`파일 삭제 실패: ${cleanupError.message}`);
            }
        }
    }
});

// 에러 핸들링
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: '파일 크기가 너무 큽니다. (최대 10MB)'
            });
        }
    }
    
    console.error('서버 오류:', error);
    res.status(500).json({
        success: false,
        error: '서버 내부 오류가 발생했습니다.'
    });
});

// 404 핸들링
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: '요청한 엔드포인트를 찾을 수 없습니다.'
    });
});

// 서버 시작
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🌱 Plant Diagnosis API 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    
    if (!process.env.PLANT_ID_API_KEY) {
        console.warn('⚠️  PLANT_ID_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.');
    }
});

module.exports = app;