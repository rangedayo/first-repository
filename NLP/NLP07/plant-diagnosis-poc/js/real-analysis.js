// 실제 AI 분석을 위한 JavaScript

class PlantAnalyzer {
    constructor() {
        this.apiUrl = '/api/analyze'; // 백엔드 API 엔드포인트
        this.isAnalyzing = false;
    }
    
    // 실제 이미지 분석
    async analyzeImage(imageFile) {
        if (this.isAnalyzing) {
            throw new Error('이미 분석이 진행 중입니다.');
        }
        
        this.isAnalyzing = true;
        
        try {
            console.log('실제 AI 분석 시작:', imageFile.name);
            
            // FormData로 이미지 전송
            const formData = new FormData();
            formData.append('image', imageFile);
            
            // 분석 요청
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`API 요청 실패: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || '분석에 실패했습니다.');
            }
            
            console.log('AI 분석 완료:', result);
            return result.result;
            
        } catch (error) {
            console.error('분석 오류:', error);
            throw error;
        } finally {
            this.isAnalyzing = false;
        }
    }
    
    // 오프라인 모드 (시뮬레이션)
    async analyzeImageOffline(imageFile) {
        console.log('오프라인 모드 - 시뮬레이션 분석');
        
        // 이미지 특성 기반 간단한 분석 시뮬레이션
        const imageSize = imageFile.size;
        const fileName = imageFile.name.toLowerCase();
        
        // 파일명이나 크기 기반으로 다른 결과 반환
        let mockResult;
        
        if (fileName.includes('yellow') || imageSize > 5000000) {
            mockResult = {
                status: '과습 의심',
                icon: '🚨',
                confidence: 78,
                symptoms: ['잎이 노랗게 변함', '흙이 축축함'],
                causes: [
                    { name: '물 과다 공급', probability: 85, description: '물을 너무 자주 준 것 같습니다.' }
                ]
            };
        } else if (fileName.includes('dry') || imageSize < 1000000) {
            mockResult = {
                status: '건조 상태',
                icon: '🌵',
                confidence: 82,
                symptoms: ['잎 끝이 마름', '흙이 갈라짐'],
                causes: [
                    { name: '수분 부족', probability: 88, description: '물이 부족한 상태입니다.' }
                ]
            };
        } else {
            mockResult = {
                status: '건강한 상태',
                icon: '✅',
                confidence: 92,
                symptoms: ['잎이 푸르고 윤기남'],
                causes: [
                    { name: '적절한 관리', probability: 95, description: '현재 상태가 양호합니다.' }
                ]
            };
        }
        
        // 실제 API 호출 시뮬레이션 (2-3초 대기)
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
        
        return mockResult;
    }
}

// 실제 분석 함수 (기존 코드 교체용)
async function startRealAnalysis() {
    console.log('실제 AI 분석 시작');
    
    if (!selectedFile) {
        alert('먼저 파일을 선택해주세요.');
        return;
    }
    
    const analyzer = new PlantAnalyzer();
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    try {
        // 버튼 상태 변경
        if (analyzeBtn) {
            analyzeBtn.textContent = 'AI 분석 중...';
            analyzeBtn.disabled = true;
        }
        
        // 실제 분석 시도
        let result;
        try {
            result = await analyzer.analyzeImage(selectedFile);
            console.log('실제 AI 분석 성공');
        } catch (apiError) {
            console.warn('API 분석 실패, 오프라인 모드로 전환:', apiError.message);
            result = await analyzer.analyzeImageOffline(selectedFile);
        }
        
        // 결과 저장
        const finalResult = {
            ...result,
            timestamp: new Date().toISOString(),
            imageUrl: await fileToBase64(selectedFile),
            analysisType: result.rawData ? 'real' : 'simulation'
        };
        
        localStorage.setItem('analysisResult', JSON.stringify(finalResult));
        console.log('분석 결과 저장 완료');
        
        // 결과 페이지로 이동
        window.location.href = 'result.html';
        
    } catch (error) {
        console.error('분석 실패:', error);
        alert('분석 중 오류가 발생했습니다: ' + error.message);
        
        // 버튼 상태 복구
        if (analyzeBtn) {
            analyzeBtn.textContent = '분석 시작';
            analyzeBtn.disabled = false;
        }
    }
}

// 파일을 Base64로 변환
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 네트워크 상태 확인
async function checkApiAvailability() {
    try {
        const response = await fetch('/api/health', { method: 'GET' });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// 분석 타입 선택 UI
function createAnalysisTypeSelector() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <h4>분석 방식 선택:</h4>
            <label style="display: block; margin: 10px 0;">
                <input type="radio" name="analysisType" value="real" checked>
                실제 AI 분석 (Plant.id API)
            </label>
            <label style="display: block; margin: 10px 0;">
                <input type="radio" name="analysisType" value="simulation">
                시뮬레이션 분석 (오프라인)
            </label>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
                * 실제 AI 분석은 인터넷 연결과 API 키가 필요합니다.
            </p>
        </div>
    `;
    
    return container;
}

// 전역으로 내보내기
window.startRealAnalysis = startRealAnalysis;
window.PlantAnalyzer = PlantAnalyzer;

console.log('실제 AI 분석 모듈 로드 완료');