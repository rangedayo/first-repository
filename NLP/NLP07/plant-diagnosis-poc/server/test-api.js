const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Plant.id API 직접 테스트
async function testPlantIdAPI() {
    console.log('🧪 Plant.id API 직접 테스트 시작...\n');
    
    const apiKey = process.env.PLANT_ID_API_KEY;
    
    if (!apiKey) {
        console.error('❌ PLANT_ID_API_KEY가 설정되지 않았습니다.');
        console.log('   .env 파일을 생성하고 API 키를 추가하세요:');
        console.log('   PLANT_ID_API_KEY=your_api_key_here\n');
        return;
    }
    
    // 테스트용 작은 이미지 (1x1 픽셀 투명 PNG)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const requestBody = {
        images: [testImageBase64],
        modifiers: ["crops_fast", "health_only"],
        plant_language: "ko",
        plant_details: ["common_names"]
    };
    
    try {
        console.log('📡 Plant.id API 호출 중...');
        
        const response = await fetch('https://api.plant.id/v3/identification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': apiKey
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log(`📊 응답 상태: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ API 테스트 성공!');
            console.log('📋 응답 데이터 구조:');
            console.log('   - suggestions:', result.suggestions?.length || 0, '개');
            console.log('   - health_assessment:', !!result.health_assessment);
            console.log('   - is_plant:', result.is_plant);
            
            if (result.suggestions && result.suggestions.length > 0) {
                console.log('   - 첫 번째 제안:', result.suggestions[0].plant_name);
            }
            
        } else {
            const errorText = await response.text();
            console.error('❌ API 테스트 실패');
            console.error('   상태:', response.status);
            console.error('   응답:', errorText);
        }
        
    } catch (error) {
        console.error('❌ 네트워크 오류:', error.message);
    }
    
    console.log('\n');
}

// 로컬 서버 테스트
async function testLocalServer() {
    console.log('🧪 로컬 서버 테스트 시작...\n');
    
    const serverUrl = 'http://localhost:3001';
    
    try {
        // 1. Health Check
        console.log('1️⃣ Health Check 테스트');
        const healthResponse = await fetch(`${serverUrl}/api/health`);
        
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('✅ Health Check 성공:', healthData.message);
        } else {
            console.log('❌ Health Check 실패:', healthResponse.status);
        }
        
        // 2. Plant.id Status Check
        console.log('\n2️⃣ Plant.id Status 테스트');
        const statusResponse = await fetch(`${serverUrl}/api/plant-id-status`);
        
        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('✅ Plant.id Status:', statusData.status, '-', statusData.message);
        } else {
            console.log('❌ Plant.id Status 실패:', statusResponse.status);
        }
        
        // 3. Base64 분석 테스트
        console.log('\n3️⃣ Base64 분석 테스트');
        const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        
        const analyzeResponse = await fetch(`${serverUrl}/api/analyze-base64`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: testImageBase64,
                filename: 'test-image.png'
            })
        });
        
        if (analyzeResponse.ok) {
            const analyzeData = await analyzeResponse.json();
            console.log('✅ Base64 분석 성공');
            console.log('   결과:', analyzeData.result.status);
            console.log('   신뢰도:', analyzeData.result.confidence + '%');
        } else {
            const errorData = await analyzeResponse.json();
            console.log('❌ Base64 분석 실패:', errorData.error);
        }
        
    } catch (error) {
        console.error('❌ 서버 연결 실패:', error.message);
        console.log('💡 서버가 실행 중인지 확인하세요: npm run dev');
    }
    
    console.log('\n');
}

// 사용법 안내
function showUsage() {
    console.log('🌱 Plant.id API 테스트 도구\n');
    console.log('사용법:');
    console.log('  node test-api.js api     - Plant.id API 직접 테스트');
    console.log('  node test-api.js server  - 로컬 서버 테스트');
    console.log('  node test-api.js all     - 모든 테스트 실행\n');
    
    console.log('준비사항:');
    console.log('1. .env 파일에 PLANT_ID_API_KEY 설정');
    console.log('2. npm install로 의존성 설치');
    console.log('3. 서버 테스트 시 npm run dev로 서버 실행\n');
}

// 메인 실행
async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'api':
            await testPlantIdAPI();
            break;
            
        case 'server':
            await testLocalServer();
            break;
            
        case 'all':
            await testPlantIdAPI();
            await testLocalServer();
            break;
            
        default:
            showUsage();
            break;
    }
}

// 실행
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    testPlantIdAPI,
    testLocalServer
};