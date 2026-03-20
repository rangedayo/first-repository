const axios = require('axios');
require('dotenv').config();

// 색상 출력
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Plant.id API 직접 테스트
async function testPlantIdDirect() {
    log('cyan', '\n🧪 Plant.id API 직접 테스트');
    log('blue', '=' .repeat(50));
    
    const apiKey = process.env.PLANT_ID_API_KEY;
    
    if (!apiKey) {
        log('red', '❌ PLANT_ID_API_KEY가 설정되지 않았습니다.');
        return false;
    }
    
    log('green', `✅ API 키 확인됨: ${apiKey.substring(0, 10)}...`);
    
    // 최소 크기 테스트 이미지
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
        console.log('📊 응답 데이터:');
        console.log('   - suggestions:', response.data.suggestions?.length || 0, '개');
        console.log('   - health_assessment:', !!response.data.health_assessment);
        console.log('   - is_plant:', response.data.is_plant);
        
        return true;
        
    } catch (error) {
        if (error.response) {
            log('red', `❌ API 오류 (${error.response.status}): ${JSON.stringify(error.response.data)}`);
        } else {
            log('red', `❌ 네트워크 오류: ${error.message}`);
        }
        return false;
    }
}

// 로컬 서버 테스트
async function testLocalServer() {
    log('cyan', '\n🏥 로컬 서버 테스트');
    log('blue', '=' .repeat(50));
    
    const serverUrl = 'http://localhost:3001';
    
    try {
        // Health Check
        log('yellow', '1️⃣ Health Check...');
        const healthResponse = await axios.get(`${serverUrl}/api/health`);
        
        if (healthResponse.status === 200) {
            log('green', '✅ Health Check 성공');
            console.log('   메시지:', healthResponse.data.message);
        }
        
        // Plant.id Status Check
        log('yellow', '2️⃣ Plant.id API 상태 확인...');
        const statusResponse = await axios.get(`${serverUrl}/api/plant-id-status`);
        
        if (statusResponse.status === 200) {
            log('green', `✅ Plant.id Status: ${statusResponse.data.status}`);
            console.log('   메시지:', statusResponse.data.message);
        }
        
        return true;
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            log('red', '❌ 서버 연결 실패: 서버가 실행되지 않았습니다.');
            log('yellow', '💡 다른 터미널에서 서버를 실행하세요: npm run dev');
        } else {
            log('red', `❌ 서버 테스트 실패: ${error.message}`);
        }
        return false;
    }
}

// Base64 진단 테스트
async function testDiagnosis() {
    log('cyan', '\n🔬 진단 기능 테스트');
    log('blue', '=' .repeat(50));
    
    const serverUrl = 'http://localhost:3001';
    const testImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';
    
    try {
        log('yellow', '📡 Base64 진단 요청 중...');
        
        const response = await axios.post(`${serverUrl}/api/diagnose-base64`, {
            image: testImageBase64,
            filename: 'test-plant.jpg'
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 60000
        });
        
        if (response.data.success) {
            log('green', '✅ 진단 테스트 성공!');
            const result = response.data.result;
            
            console.log('📋 진단 결과:');
            console.log(`   상태: ${result.status} ${result.icon}`);
            console.log(`   신뢰도: ${result.confidence}%`);
            console.log(`   증상 개수: ${result.symptoms?.length || 0}개`);
            console.log(`   원인 개수: ${result.causes?.length || 0}개`);
            console.log(`   즉시조치: ${result.treatments?.immediate?.length || 0}개`);
            console.log(`   장기관리: ${result.treatments?.longterm?.length || 0}개`);
            
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

// 종합 테스트
async function runAllTests() {
    log('cyan', '\n🌱 Plant Diagnosis API 종합 테스트');
    log('cyan', '=' .repeat(60));
    
    const results = {
        plantIdDirect: false,
        serverHealth: false,
        diagnosis: false
    };
    
    // 1. Plant.id API 직접 테스트
    results.plantIdDirect = await testPlantIdDirect();
    
    // 2. 서버 상태 테스트
    results.serverHealth = await testLocalServer();
    
    // 3. 진단 기능 테스트 (서버가 정상일 때만)
    if (results.serverHealth) {
        results.diagnosis = await testDiagnosis();
    }
    
    // 결과 요약
    log('cyan', '\n📊 테스트 결과 요약');
    log('blue', '=' .repeat(50));
    
    console.log(`Plant.id API 직접 연결: ${results.plantIdDirect ? '✅ 성공' : '❌ 실패'}`);
    console.log(`로컬 서버 상태: ${results.serverHealth ? '✅ 정상' : '❌ 오류'}`);
    console.log(`진단 기능: ${results.diagnosis ? '✅ 성공' : '❌ 실패'}`);
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    if (successCount === totalTests) {
        log('green', `\n🎉 모든 테스트 통과! (${successCount}/${totalTests})`);
        log('green', '✅ Plant Diagnosis API가 정상적으로 작동합니다.');
        log('cyan', '\n🌐 브라우저에서 테스트: test-page.html 파일을 열어보세요!');
    } else {
        log('yellow', `\n⚠️ 일부 테스트 실패 (${successCount}/${totalTests})`);
        
        if (!results.plantIdDirect) {
            log('red', '💡 Plant.id API 키를 확인하세요.');
        }
        if (!results.serverHealth) {
            log('red', '💡 서버를 실행하세요: npm run dev');
        }
    }
}

// 메인 실행
async function main() {
    const testType = process.argv[2] || 'all';
    
    switch (testType) {
        case 'api':
            await testPlantIdDirect();
            break;
        case 'server':
            await testLocalServer();
            break;
        case 'diagnosis':
            await testDiagnosis();
            break;
        case 'all':
        default:
            await runAllTests();
            break;
    }
}

if (require.main === module) {
    main().catch(error => {
        log('red', `❌ 테스트 실행 오류: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { testPlantIdDirect, testLocalServer, testDiagnosis };