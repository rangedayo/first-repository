const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
require('dotenv').config();

// 서버 URL
const SERVER_URL = 'http://localhost:3001';

// 색상 출력을 위한 유틸리티
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 1. Plant.id API 직접 테스트
async function testPlantIdDirect() {
    log('cyan', '\n🧪 Plant.id API 직접 테스트');
    log('blue', '=' .repeat(50));
    
    const apiKey = process.env.PLANT_ID_API_KEY;
    
    if (!apiKey) {
        log('red', '❌ PLANT_ID_API_KEY가 설정되지 않았습니다.');
        return false;
    }
    
    // 최소 크기 테스트 이미지 (1x1 JPEG)
    const testImageBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';
    
    const requestData = {
        images: [`data:image/jpeg;base64,${testImageBase64}`],
        modifiers: ["crops_fast", "health_all"],
        plant_language: "ko",
        plant_details: ["common_names"]
    };
    
    try {
        log('yellow', '📡 Plant.id API 호출 중...');
        
        const response = await axios.post(
            'https://api.plant.id/v3/identification',
            requestData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Api-Key': apiKey
                },
                timeout: 30000
            }
        );
        
        log('green', `✅ API 테스트 성공! (상태: ${response.status})`);
        log('blue', `📊 응답 데이터:`);
        console.log('   - suggestions:', response.data.suggestions?.length || 0, '개');
        console.log('   - health_assessment:', !!response.data.health_assessment);
        console.log('   - is_plant:', response.data.is_plant);
        
        if (response.data.suggestions && response.data.suggestions.length > 0) {
            console.log('   - 첫 번째 제안:', response.data.suggestions[0].plant_name);
        }
        
        return true;
        
    } catch (error) {
        if (error.response) {
            log('red', `❌ API 오류 (${error.response.status}): ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            log('red', '❌ 네트워크 오류: API 서버에 연결할 수 없습니다.');
        } else {
            log('red', `❌ 요청 오류: ${error.message}`);
        }
        return false;
    }
}

// 2. 로컬 서버 상태 테스트
async function testServerHealth() {
    log('cyan', '\n🏥 로컬 서버 상태 테스트');
    log('blue', '=' .repeat(50));
    
    try {
        // Health Check
        log('yellow', '1️⃣ Health Check 테스트...');
        const healthResponse = await axios.get(`${SERVER_URL}/api/health`);
        
        if (healthResponse.status === 200) {
            log('green', '✅ Health Check 성공');
            console.log('   메시지:', healthResponse.data.message);
            console.log('   기능:', healthResponse.data.features?.join(', '));
        }
        
        // Plant.id Status Check
        log('yellow', '2️⃣ Plant.id API 상태 확인...');
        const statusResponse = await axios.get(`${SERVER_URL}/api/plant-id-status`);
        
        if (statusResponse.status === 200) {
            log('green', `✅ Plant.id Status: ${statusResponse.data.status}`);
            console.log('   메시지:', statusResponse.data.message);
        }
        
        return true;
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            log('red', '❌ 서버 연결 실패: 서버가 실행되지 않았습니다.');
            log('yellow', '💡 서버를 실행하세요: npm run dev');
        } else {
            log('red', `❌ 서버 테스트 실패: ${error.message}`);
        }
        return false;
    }
}

// 3. Base64 진단 테스트
async function testBase64Diagnosis() {
    log('cyan', '\n🔬 Base64 진단 테스트');
    log('blue', '=' .repeat(50));
    
    // 더 큰 테스트 이미지 (실제 식물처럼 보이는 패턴)
    const testImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';
    
    try {
        log('yellow', '📡 Base64 진단 요청 중...');
        
        const response = await axios.post(`${SERVER_URL}/api/diagnose-base64`, {
            image: testImageBase64,
            filename: 'test-plant.jpg'
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 60000 // 1분 타임아웃
        });
        
        if (response.data.success) {
            log('green', '✅ Base64 진단 성공!');
            const result = response.data.result;
            
            console.log('📋 진단 결과:');
            console.log(`   상태: ${result.status} ${result.icon}`);
            console.log(`   신뢰도: ${result.confidence}%`);
            console.log(`   증상 개수: ${result.symptoms?.length || 0}개`);
            console.log(`   원인 개수: ${result.causes?.length || 0}개`);
            console.log(`   치료법: 즉시조치 ${result.treatments?.immediate?.length || 0}개, 장기관리 ${result.treatments?.longterm?.length || 0}개`);
            
            if (result.plantInfo) {
                console.log(`   식물 정보: ${result.plantInfo.name} (${result.plantInfo.probability}%)`);
            }
        } else {
            log('red', `❌ 진단 실패: ${response.data.error}`);
        }
        
        return response.data.success;
        
    } catch (error) {
        if (error.response) {
            log('red', `❌ 진단 API 오류 (${error.response.status}): ${error.response.data?.error || error.response.statusText}`);
        } else {
            log('red', `❌ 네트워크 오류: ${error.message}`);
        }
        return false;
    }
}

// 4. 파일 업로드 진단 테스트 (가상 파일)
async function testFileUploadDiagnosis() {
    log('cyan', '\n📁 파일 업로드 진단 테스트');
    log('blue', '=' .repeat(50));
    
    try {
        // 임시 테스트 이미지 파일 생성
        const testImageBuffer = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A', 'base64');
        
        const formData = new FormData();
        formData.append('image', testImageBuffer, {
            filename: 'test-plant.jpg',
            contentType: 'image/jpeg'
        });
        
        log('yellow', '📡 파일 업로드 진단 요청 중...');
        
        const response = await axios.post(`${SERVER_URL}/api/diagnose`, formData, {
            headers: {
                ...formData.getHeaders()
            },
            timeout: 60000
        });
        
        if (response.data.success) {
            log('green', '✅ 파일 업로드 진단 성공!');
            const result = response.data.result;
            
            console.log('📋 진단 결과:');
            console.log(`   상태: ${result.status} ${result.icon}`);
            console.log(`   신뢰도: ${result.confidence}%`);
            console.log(`   처리 시간: ${response.data.metadata?.processingTime || 'N/A'}ms`);
        } else {
            log('red', `❌ 파일 업로드 진단 실패: ${response.data.error}`);
        }
        
        return response.data.success;
        
    } catch (error) {
        if (error.response) {
            log('red', `❌ 파일 업로드 오류 (${error.response.status}): ${error.response.data?.error || error.response.statusText}`);
        } else {
            log('red', `❌ 네트워크 오류: ${error.message}`);
        }
        return false;
    }
}

// 5. 종합 테스트 실행
async function runAllTests() {
    log('magenta', '\n🌱 Plant Diagnosis API 종합 테스트 시작');
    log('magenta', '=' .repeat(60));
    
    const results = {
        plantIdDirect: false,
        serverHealth: false,
        base64Diagnosis: false,
        fileUploadDiagnosis: false
    };
    
    // 1. Plant.id API 직접 테스트
    results.plantIdDirect = await testPlantIdDirect();
    
    // 2. 서버 상태 테스트
    results.serverHealth = await testServerHealth();
    
    // 서버가 정상이면 진단 테스트 진행
    if (results.serverHealth) {
        // 3. Base64 진단 테스트
        results.base64Diagnosis = await testBase64Diagnosis();
        
        // 4. 파일 업로드 진단 테스트
        results.fileUploadDiagnosis = await testFileUploadDiagnosis();
    }
    
    // 결과 요약
    log('cyan', '\n📊 테스트 결과 요약');
    log('blue', '=' .repeat(50));
    
    console.log(`Plant.id API 직접 연결: ${results.plantIdDirect ? '✅ 성공' : '❌ 실패'}`);
    console.log(`로컬 서버 상태: ${results.serverHealth ? '✅ 정상' : '❌ 오류'}`);
    console.log(`Base64 진단: ${results.base64Diagnosis ? '✅ 성공' : '❌ 실패'}`);
    console.log(`파일 업로드 진단: ${results.fileUploadDiagnosis ? '✅ 성공' : '❌ 실패'}`);
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    if (successCount === totalTests) {
        log('green', `\n🎉 모든 테스트 통과! (${successCount}/${totalTests})`);
        log('green', '✅ Plant Diagnosis API가 정상적으로 작동합니다.');
    } else {
        log('yellow', `\n⚠️ 일부 테스트 실패 (${successCount}/${totalTests})`);
        
        if (!results.plantIdDirect) {
            log('red', '💡 Plant.id API 키를 확인하세요.');
        }
        if (!results.serverHealth) {
            log('red', '💡 서버를 실행하세요: npm run dev');
        }
    }
    
    log('cyan', '\n📚 사용 가능한 엔드포인트:');
    console.log('   GET  /api/health - 서버 상태 확인');
    console.log('   GET  /api/plant-id-status - Plant.id API 상태');
    console.log('   POST /api/diagnose - 파일 업로드 진단');
    console.log('   POST /api/diagnose-base64 - Base64 이미지 진단');
}

// 개별 테스트 실행
async function runSingleTest(testName) {
    switch (testName) {
        case 'api':
            await testPlantIdDirect();
            break;
        case 'server':
            await testServerHealth();
            break;
        case 'base64':
            await testBase64Diagnosis();
            break;
        case 'upload':
            await testFileUploadDiagnosis();
            break;
        default:
            log('yellow', '사용법: node test.js [api|server|base64|upload|all]');
            log('blue', '  api    - Plant.id API 직접 테스트');
            log('blue', '  server - 로컬 서버 상태 테스트');
            log('blue', '  base64 - Base64 진단 테스트');
            log('blue', '  upload - 파일 업로드 진단 테스트');
            log('blue', '  all    - 모든 테스트 실행 (기본값)');
    }
}

// 메인 실행
async function main() {
    const testType = process.argv[2] || 'all';
    
    if (testType === 'all') {
        await runAllTests();
    } else {
        await runSingleTest(testType);
    }
}

// 실행
if (require.main === module) {
    main().catch(error => {
        log('red', `❌ 테스트 실행 오류: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
    testPlantIdDirect,
    testServerHealth,
    testBase64Diagnosis,
    testFileUploadDiagnosis,
    runAllTests
};