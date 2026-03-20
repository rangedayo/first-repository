// Plant.id API 서버와 연동하는 클라이언트 코드

class PlantDiagnosisClient {
    constructor(serverUrl = 'http://localhost:3001') {
        this.serverUrl = serverUrl;
        this.isAnalyzing = false;
    }
    
    // 서버 상태 확인
    async checkServerStatus() {
        try {
            const response = await fetch(`${this.serverUrl}/api/health`);
            const data = await response.json();
            return { success: response.ok, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // Plant.id API 상태 확인
    async checkPlantIdStatus() {
        try {
            const response = await fetch(`${this.serverUrl}/api/plant-id-status`);
            const data = await response.json();
            return { success: response.ok, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // 이미지 파일로 분석
    async analyzeImageFile(file, onProgress = null) {
        if (this.isAnalyzing) {
            throw new Error('이미 분석이 진행 중입니다.');
        }
        
        this.isAnalyzing = true;
        
        try {
            console.log('🔍 Plant.id 분석 시작:', file.name);
            
            if (onProgress) onProgress({ stage: 'upload', progress: 0 });
            
            // FormData 생성
            const formData = new FormData();
            formData.append('image', file);
            
            if (onProgress) onProgress({ stage: 'upload', progress: 50 });
            
            // 서버로 전송
            const response = await fetch(`${this.serverUrl}/api/analyze`, {
                method: 'POST',
                body: formData
            });
            
            if (onProgress) onProgress({ stage: 'analysis', progress: 75 });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || '분석에 실패했습니다.');
            }
            
            if (onProgress) onProgress({ stage: 'complete', progress: 100 });
            
            console.log('✅ Plant.id 분석 완료:', result.result.status);
            return result.result;
            
        } catch (error) {
            console.error('❌ 분석 실패:', error);
            throw error;
        } finally {
            this.isAnalyzing = false;
        }
    }
    
    // Base64 이미지로 분석
    async analyzeImageBase64(base64Image, filename = 'image.jpg', onProgress = null) {
        if (this.isAnalyzing) {
            throw new Error('이미 분석이 진행 중입니다.');
        }
        
        this.isAnalyzing = true;
        
        try {
            console.log('🔍 Plant.id Base64 분석 시작:', filename);
            
            if (onProgress) onProgress({ stage: 'prepare', progress: 25 });
            
            const response = await fetch(`${this.serverUrl}/api/analyze-base64`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: base64Image,
                    filename: filename
                })
            });
            
            if (onProgress) onProgress({ stage: 'analysis', progress: 75 });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || '분석에 실패했습니다.');
            }
            
            if (onProgress) onProgress({ stage: 'complete', progress: 100 });
            
            console.log('✅ Plant.id Base64 분석 완료:', result.result.status);
            return result.result;
            
        } catch (error) {
            console.error('❌ Base64 분석 실패:', error);
            throw error;
        } finally {
            this.isAnalyzing = false;
        }
    }
    
    // 파일을 Base64로 변환
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

// 기존 upload.js와 연동하는 함수
async function startRealPlantIdAnalysis() {
    console.log('🌱 실제 Plant.id 분석 시작');
    
    if (!selectedFile) {
        alert('먼저 파일을 선택해주세요.');
        return;
    }
    
    const client = new PlantDiagnosisClient();
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    try {
        // 버튼 상태 변경
        if (analyzeBtn) {
            analyzeBtn.textContent = 'Plant.id 분석 중...';
            analyzeBtn.disabled = true;
        }
        
        // 서버 상태 확인
        const serverStatus = await client.checkServerStatus();
        if (!serverStatus.success) {
            throw new Error('서버에 연결할 수 없습니다: ' + serverStatus.error);
        }
        
        // Plant.id API 상태 확인
        const apiStatus = await client.checkPlantIdStatus();
        if (!apiStatus.success) {
            console.warn('Plant.id API 상태 확인 실패, 분석 시도 계속...');
        }
        
        // 진행률 콜백
        const onProgress = (progress) => {
            if (analyzeBtn) {
                const stages = {
                    'upload': '업로드 중...',
                    'analysis': 'AI 분석 중...',
                    'complete': '완료!'
                };
                analyzeBtn.textContent = stages[progress.stage] || 'Plant.id 분석 중...';
            }
        };
        
        // 실제 분석 실행
        const result = await client.analyzeImageFile(selectedFile, onProgress);
        
        // 결과 저장
        const finalResult = {
            ...result,
            timestamp: new Date().toISOString(),
            imageUrl: await client.fileToBase64(selectedFile),
            analysisType: 'real',
            provider: 'Plant.id'
        };
        
        localStorage.setItem('analysisResult', JSON.stringify(finalResult));
        console.log('💾 분석 결과 저장 완료');
        
        // 결과 페이지로 이동
        console.log('🚀 결과 페이지로 이동');
        window.location.href = 'result.html';
        
    } catch (error) {
        console.error('❌ Plant.id 분석 실패:', error);
        
        // 사용자에게 알림
        const errorMessage = error.message.includes('API') 
            ? '서버 연결 오류입니다. 잠시 후 다시 시도해주세요.' 
            : error.message;
            
        alert('분석 중 오류가 발생했습니다:\n' + errorMessage);
        
        // 버튼 상태 복구
        if (analyzeBtn) {
            analyzeBtn.textContent = '분석 시작';
            analyzeBtn.disabled = false;
        }
    }
}

// 분석 방식 선택 UI 생성
function createAnalysisSelector() {
    const container = document.createElement('div');
    container.className = 'analysis-selector';
    container.innerHTML = `
        <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;">
            <h4 style="margin: 0 0 15px 0; color: #495057;">🔬 분석 방식 선택</h4>
            
            <label style="display: flex; align-items: center; margin: 10px 0; cursor: pointer;">
                <input type="radio" name="analysisType" value="plantid" checked style="margin-right: 10px;">
                <div>
                    <strong>🌿 Plant.id 실제 AI 분석</strong>
                    <div style="font-size: 12px; color: #6c757d;">정확한 식물 질병 진단 (무료: 월 100회)</div>
                </div>
            </label>
            
            <label style="display: flex; align-items: center; margin: 10px 0; cursor: pointer;">
                <input type="radio" name="analysisType" value="simulation" style="margin-right: 10px;">
                <div>
                    <strong>🧪 시뮬레이션 분석</strong>
                    <div style="font-size: 12px; color: #6c757d;">테스트용 가짜 결과 (오프라인)</div>
                </div>
            </label>
            
            <div style="margin-top: 15px; padding: 10px; background: #e3f2fd; border-radius: 5px; font-size: 12px;">
                💡 <strong>팁:</strong> Plant.id는 무료로 월 100회까지 사용 가능합니다.
                <br>서버가 실행되지 않으면 자동으로 시뮬레이션 모드로 전환됩니다.
            </div>
        </div>
    `;
    
    return container;
}

// 분석 방식에 따른 함수 선택
function getAnalysisFunction() {
    const selectedType = document.querySelector('input[name="analysisType"]:checked');
    
    if (selectedType && selectedType.value === 'plantid') {
        return startRealPlantIdAnalysis;
    } else {
        return window.startAnalysisSimple || startRealPlantIdAnalysis; // 폴백
    }
}

// 전역으로 내보내기
window.PlantDiagnosisClient = PlantDiagnosisClient;
window.startRealPlantIdAnalysis = startRealPlantIdAnalysis;
window.createAnalysisSelector = createAnalysisSelector;

// 기존 startAnalysis 함수 오버라이드
window.startAnalysis = function() {
    const analysisFunction = getAnalysisFunction();
    return analysisFunction();
};

console.log('🌱 Plant.id 클라이언트 로드 완료');