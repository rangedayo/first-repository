// 프론트엔드에서 Plant Diagnosis API를 사용하는 클라이언트 코드

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
    
    // 이미지 파일로 진단
    async diagnoseImageFile(file, onProgress = null) {
        if (this.isAnalyzing) {
            throw new Error('이미 진단이 진행 중입니다.');
        }
        
        this.isAnalyzing = true;
        
        try {
            console.log('🔍 Plant.id 진단 시작:', file.name);
            
            if (onProgress) onProgress({ stage: 'upload', progress: 0, message: '이미지 업로드 중...' });
            
            // FormData 생성
            const formData = new FormData();
            formData.append('image', file);
            
            if (onProgress) onProgress({ stage: 'upload', progress: 50, message: '서버로 전송 중...' });
            
            // 서버로 전송
            const response = await fetch(`${this.serverUrl}/api/diagnose`, {
                method: 'POST',
                body: formData
            });
            
            if (onProgress) onProgress({ stage: 'analysis', progress: 75, message: 'AI 분석 중...' });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || '진단에 실패했습니다.');
            }
            
            if (onProgress) onProgress({ stage: 'complete', progress: 100, message: '진단 완료!' });
            
            console.log('✅ Plant.id 진단 완료:', result.result.status);
            return result.result;
            
        } catch (error) {
            console.error('❌ 진단 실패:', error);
            throw error;
        } finally {
            this.isAnalyzing = false;
        }
    }
    
    // Base64 이미지로 진단
    async diagnoseImageBase64(base64Image, filename = 'image.jpg', onProgress = null) {
        if (this.isAnalyzing) {
            throw new Error('이미 진단이 진행 중입니다.');
        }
        
        this.isAnalyzing = true;
        
        try {
            console.log('🔍 Plant.id Base64 진단 시작:', filename);
            
            if (onProgress) onProgress({ stage: 'prepare', progress: 25, message: '이미지 처리 중...' });
            
            const response = await fetch(`${this.serverUrl}/api/diagnose-base64`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: base64Image,
                    filename: filename
                })
            });
            
            if (onProgress) onProgress({ stage: 'analysis', progress: 75, message: 'AI 분석 중...' });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || '진단에 실패했습니다.');
            }
            
            if (onProgress) onProgress({ stage: 'complete', progress: 100, message: '진단 완료!' });
            
            console.log('✅ Plant.id Base64 진단 완료:', result.result.status);
            return result.result;
            
        } catch (error) {
            console.error('❌ Base64 진단 실패:', error);
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
    
    // 진단 결과를 HTML로 렌더링
    renderDiagnosisResult(result, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('결과 컨테이너를 찾을 수 없습니다:', containerId);
            return;
        }
        
        const html = `
            <div class="diagnosis-result">
                <div class="result-header">
                    <h2>${result.icon} ${result.status}</h2>
                    <div class="confidence">신뢰도: ${result.confidence}%</div>
                </div>
                
                ${result.plantInfo ? `
                <div class="plant-info">
                    <h3>🌱 식물 정보</h3>
                    <p><strong>${result.plantInfo.name}</strong> (${result.plantInfo.probability}%)</p>
                    ${result.plantInfo.scientificName ? `<p><em>${result.plantInfo.scientificName}</em></p>` : ''}
                    ${result.plantInfo.commonNames?.length ? `<p>일반명: ${result.plantInfo.commonNames.join(', ')}</p>` : ''}
                </div>
                ` : ''}
                
                ${result.symptoms?.length ? `
                <div class="symptoms">
                    <h3>🔍 주요 증상</h3>
                    <ul>
                        ${result.symptoms.map(symptom => `
                            <li>
                                <strong>${symptom.name}</strong> (${symptom.probability}%)
                                <br><small>${symptom.description}</small>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${result.causes?.length ? `
                <div class="causes">
                    <h3>🎯 원인 분석</h3>
                    <ul>
                        ${result.causes.map(cause => `
                            <li class="severity-${cause.severity}">
                                <strong>${cause.name}</strong> (${cause.probability}%)
                                <br><small>${cause.cause}</small>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${result.treatments ? `
                <div class="treatments">
                    ${result.treatments.immediate?.length ? `
                    <div class="immediate-treatments">
                        <h3>🚨 즉시 조치</h3>
                        <ul>
                            ${result.treatments.immediate.map(treatment => `
                                <li class="priority-${treatment.priority}">
                                    <strong>${treatment.title}</strong>
                                    <br>${treatment.description}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    
                    ${result.treatments.longterm?.length ? `
                    <div class="longterm-treatments">
                        <h3>📅 장기 관리</h3>
                        <ul>
                            ${result.treatments.longterm.map(treatment => `
                                <li>
                                    <strong>${treatment.title}</strong>
                                    <br>${treatment.description}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    
                    ${result.treatments.prevention?.length ? `
                    <div class="prevention-treatments">
                        <h3>🛡️ 예방 방법</h3>
                        <ul>
                            ${result.treatments.prevention.map(treatment => `
                                <li>
                                    <strong>${treatment.title}</strong>
                                    <br>${treatment.description}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>
                ` : ''}
                
                <div class="result-footer">
                    <small>
                        분석 제공: ${result.provider} | 
                        분석 시간: ${new Date(result.timestamp).toLocaleString()}
                    </small>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }
}

// 사용 예시 및 헬퍼 함수들
class PlantDiagnosisUI {
    constructor(clientOptions = {}) {
        this.client = new PlantDiagnosisClient(clientOptions.serverUrl);
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 파일 입력 처리
        const fileInput = document.getElementById('plantImageInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleFileUpload(file);
                }
            });
        }
        
        // 드래그 앤 드롭 처리
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });
            
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileUpload(files[0]);
                }
            });
        }
    }
    
    async handleFileUpload(file) {
        // 파일 검증
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB
            alert('파일 크기가 너무 큽니다. 10MB 이하의 파일을 선택해주세요.');
            return;
        }
        
        try {
            // 진행률 표시
            this.showProgress(true);
            
            const result = await this.client.diagnoseImageFile(file, (progress) => {
                this.updateProgress(progress);
            });
            
            // 결과 표시
            this.client.renderDiagnosisResult(result, 'diagnosisResult');
            this.showProgress(false);
            
        } catch (error) {
            console.error('진단 실패:', error);
            alert('진단 중 오류가 발생했습니다: ' + error.message);
            this.showProgress(false);
        }
    }
    
    showProgress(show) {
        const progressContainer = document.getElementById('progressContainer');
        if (progressContainer) {
            progressContainer.style.display = show ? 'block' : 'none';
        }
    }
    
    updateProgress(progress) {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        if (progressBar) {
            progressBar.style.width = `${progress.progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = progress.message || `${progress.progress}%`;
        }
    }
}

// HTML 템플릿
const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>식물 진단 서비스</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .drop-zone { border: 2px dashed #ccc; padding: 40px; text-align: center; margin: 20px 0; cursor: pointer; }
        .drop-zone.drag-over { border-color: #007bff; background: #f8f9fa; }
        .progress-container { display: none; margin: 20px 0; }
        .progress-bar { width: 100%; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: #007bff; transition: width 0.3s; }
        .diagnosis-result { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .result-header h2 { margin: 0 0 10px 0; }
        .confidence { font-size: 14px; color: #666; }
        .symptoms ul, .causes ul, .treatments ul { list-style: none; padding: 0; }
        .symptoms li, .causes li, .treatments li { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; }
        .severity-high { border-left: 4px solid #dc3545; }
        .severity-medium { border-left: 4px solid #ffc107; }
        .severity-low { border-left: 4px solid #28a745; }
        .priority-1 { border-left: 4px solid #dc3545; }
        .priority-2 { border-left: 4px solid #ffc107; }
        .priority-3 { border-left: 4px solid #28a745; }
    </style>
</head>
<body>
    <h1>🌱 식물 진단 서비스</h1>
    
    <div id="dropZone" class="drop-zone">
        <p>📷 이미지를 드래그하여 놓거나 클릭하여 선택하세요</p>
        <input type="file" id="plantImageInput" accept="image/*" style="display: none;">
    </div>
    
    <div id="progressContainer" class="progress-container">
        <div class="progress-bar">
            <div id="progressBar" class="progress-fill" style="width: 0%;"></div>
        </div>
        <p id="progressText">진단 준비 중...</p>
    </div>
    
    <div id="diagnosisResult"></div>
    
    <script src="frontend-client.js"></script>
    <script>
        // 페이지 로드 시 UI 초기화
        document.addEventListener('DOMContentLoaded', () => {
            const ui = new PlantDiagnosisUI();
            
            // 드롭존 클릭 시 파일 선택
            document.getElementById('dropZone').addEventListener('click', () => {
                document.getElementById('plantImageInput').click();
            });
        });
    </script>
</body>
</html>
`;

// 전역으로 내보내기
if (typeof window !== 'undefined') {
    window.PlantDiagnosisClient = PlantDiagnosisClient;
    window.PlantDiagnosisUI = PlantDiagnosisUI;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PlantDiagnosisClient, PlantDiagnosisUI, HTML_TEMPLATE };
}