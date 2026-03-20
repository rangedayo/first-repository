// 실제 Plant.id API 연동 JavaScript

const SERVER_URL = 'http://localhost:3001';

// 디버그 로그 함수 (upload.js에서 가져옴)
function addDebugLog(message) {
    console.log(message);
    
    // 디버그 로그 영역이 있으면 추가
    const debugLog = document.getElementById('debugLog');
    if (debugLog) {
        const timestamp = new Date().toLocaleTimeString();
        debugLog.innerHTML += `[${timestamp}] ${message}<br>`;
        debugLog.scrollTop = debugLog.scrollHeight;
    }
}

// 파일 크기 포맷 함수
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 에러 표시 함수
function showError(message) {
    alert(message);
}

// 로딩 모달 함수들 (간단한 버전)
function showLoadingModal() {
    // 간단한 로딩 표시 - 버튼 텍스트로 대체
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.textContent = '🔄 AI 분석 중... 잠시만 기다려주세요';
        analyzeBtn.disabled = true;
    }
    console.log('로딩 시작');
}

function hideLoadingModal() {
    // 로딩 숨기기 - 버튼 상태 복구
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.textContent = '분석 시작';
        analyzeBtn.disabled = false;
    }
    console.log('로딩 완료');
}

// Plant.id API 클라이언트 클래스
class PlantDiagnosisAPI {
    constructor(serverUrl = SERVER_URL) {
        this.serverUrl = serverUrl;
        this.isServerOnline = false;
    }
    
    // 서버 상태 확인
    async checkServerStatus() {
        console.log('🔍 서버 상태 확인 중...');
        
        try {
            const response = await fetch(`${this.serverUrl}/api/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ 서버 연결 성공:', data.message);
                this.isServerOnline = true;
                return { success: true, data };
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
        } catch (error) {
            console.error('❌ 서버 연결 실패:', error.message);
            this.isServerOnline = false;
            return { success: false, error: error.message };
        }
    }
    
    // Plant.id API 상태 확인
    async checkPlantIdStatus() {
        console.log('🌿 Plant.id API 상태 확인 중...');
        
        try {
            const response = await fetch(`${this.serverUrl}/api/plant-id-status`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (response.ok && data.status === 'ok') {
                console.log('✅ Plant.id API 연결 성공:', data.message);
                return { success: true, data };
            } else {
                console.warn('⚠️ Plant.id API 문제:', data.message);
                return { success: false, error: data.message };
            }
            
        } catch (error) {
            console.error('❌ Plant.id API 확인 실패:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    // 파일로 진단 요청
    async diagnoseWithFile(file) {
        console.log(`🔬 파일 진단 시작: ${file.name} (${Math.round(file.size / 1024)}KB)`);
        
        if (!this.isServerOnline) {
            const serverCheck = await this.checkServerStatus();
            if (!serverCheck.success) {
                throw new Error('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.');
            }
        }
        
        try {
            const formData = new FormData();
            formData.append('image', file);
            
            console.log('📡 서버로 파일 전송 중...');
            
            const response = await fetch(`${this.serverUrl}/api/diagnose`, {
                method: 'POST',
                body: formData,
                // Content-Type 헤더를 설정하지 않음 (브라우저가 자동으로 multipart/form-data 설정)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                console.log('✅ 진단 완료:', data.result.status);
                return { success: true, result: data.result, metadata: data.metadata };
            } else {
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
        } catch (error) {
            console.error('❌ 진단 실패:', error.message);
            throw error;
        }
    }
    
    // Base64로 진단 요청
    async diagnoseWithBase64(base64Image, filename = 'plant-image.jpg') {
        console.log(`🔬 Base64 진단 시작: ${filename}`);
        
        if (!this.isServerOnline) {
            const serverCheck = await this.checkServerStatus();
            if (!serverCheck.success) {
                throw new Error('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.');
            }
        }
        
        try {
            console.log('📡 서버로 Base64 데이터 전송 중...');
            
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
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                console.log('✅ Base64 진단 완료:', data.result.status);
                return { success: true, result: data.result, metadata: data.metadata };
            } else {
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
        } catch (error) {
            console.error('❌ Base64 진단 실패:', error.message);
            throw error;
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

// 전역 API 인스턴스
const plantAPI = new PlantDiagnosisAPI();

// 실제 API를 사용한 분석 함수
async function startRealAnalysis(file) {
    console.log('🚀 실제 Plant.id API 분석 시작');
    
    if (!file) {
        throw new Error('파일이 선택되지 않았습니다.');
    }
    
    try {
        // 1단계: 서버 상태 확인
        addDebugLog('1단계: 서버 상태 확인 중...');
        const serverStatus = await plantAPI.checkServerStatus();
        
        if (!serverStatus.success) {
            throw new Error(`서버 연결 실패: ${serverStatus.error}`);
        }
        
        addDebugLog('✅ 서버 연결 성공');
        
        // 2단계: Plant.id API 상태 확인
        addDebugLog('2단계: Plant.id API 상태 확인 중...');
        const apiStatus = await plantAPI.checkPlantIdStatus();
        
        if (!apiStatus.success) {
            console.warn('⚠️ Plant.id API 문제 있음, 계속 진행:', apiStatus.error);
        } else {
            addDebugLog('✅ Plant.id API 연결 성공');
        }
        
        // 3단계: 이미지 진단 요청
        addDebugLog('3단계: 이미지 진단 요청 중...');
        const diagnosis = await plantAPI.diagnoseWithFile(file);
        
        addDebugLog(`✅ 진단 완료: ${diagnosis.result.status} (${diagnosis.result.confidence}%)`);
        
        return diagnosis.result;
        
    } catch (error) {
        console.error('❌ 실제 분석 실패:', error.message);
        addDebugLog(`❌ 실제 분석 실패: ${error.message}`);
        throw error;
    }
}

// 결과를 분석 페이지 형식으로 변환
function convertToAnalysisFormat(plantIdResult) {
    console.log('🔄 Plant.id 결과를 분석 페이지 형식으로 변환');
    
    return {
        status: plantIdResult.status || '분석 완료',
        icon: plantIdResult.icon || '🌱',
        confidence: plantIdResult.confidence || 0,
        symptoms: plantIdResult.symptoms || [],
        causes: plantIdResult.causes || [],
        treatments: plantIdResult.treatments || { immediate: [], longterm: [], prevention: [] },
        plantInfo: plantIdResult.plantInfo || null,
        timestamp: plantIdResult.timestamp || new Date().toISOString(),
        analysisType: 'real',
        provider: plantIdResult.provider || 'Plant.id (Kindwise)',
        imageUrl: localStorage.getItem('uploadedImage') // 업로드된 이미지 사용
    };
}

// 기존 startAnalysis 함수를 오버라이드
async function startAnalysisWithRealAPI() {
    addDebugLog('🌟 실제 API를 사용한 분석 시작');
    
    if (!selectedFile) {
        addDebugLog('에러: 파일이 선택되지 않음');
        showError('먼저 파일을 선택해주세요.');
        return;
    }

    addDebugLog('선택된 파일: ' + selectedFile.name + ' (' + formatFileSize(selectedFile.size) + ')');

    // 버튼 비활성화
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = '실제 AI 분석 중...';
    addDebugLog('분석 버튼 비활성화');

    // 로딩 모달 표시
    showLoadingModal();
    addDebugLog('로딩 모달 표시');

    try {
        // 이미지를 localStorage에 저장 (결과 페이지에서 사용)
        const reader = new FileReader();
        const imageBase64 = await new Promise((resolve, reject) => {
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
        });
        
        localStorage.setItem('uploadedImage', imageBase64);
        localStorage.setItem('uploadedImageName', selectedFile.name);
        addDebugLog('이미지 localStorage 저장 완료');

        // 실제 API 호출
        addDebugLog('🔥 Plant.id API 호출 시작...');
        const realResult = await startRealAnalysis(selectedFile);
        
        // 결과 형식 변환
        const analysisResult = convertToAnalysisFormat(realResult);
        addDebugLog('결과 형식 변환 완료');
        
        // localStorage 우회 - URL 파라미터로 결과 전달
        addDebugLog('localStorage 우회 - URL 파라미터로 결과 전달');
        
        // 간단한 결과 데이터만 URL로 전달
        const simpleResult = {
            status: analysisResult.status,
            icon: analysisResult.icon,
            confidence: analysisResult.confidence,
            analysisType: 'real',
            provider: analysisResult.provider,
            timestamp: analysisResult.timestamp
        };
        
        // URL 파라미터로 인코딩
        const resultParam = encodeURIComponent(JSON.stringify(simpleResult));
        
        addDebugLog('URL 파라미터 생성 완료');
        
        // 성공 메시지
        addDebugLog('🎉 실제 AI 분석 완료! 결과 페이지로 이동합니다.');
        
        // 로딩 모달 숨기기
        hideLoadingModal();
        
        // URL 파라미터와 함께 결과 페이지로 이동
        setTimeout(() => {
            console.log('실제 API 분석 완료 - 결과 페이지로 이동');
            window.open(`result.html?data=${resultParam}`, "_self");
        }, 500);
        
    } catch (error) {
        addDebugLog(`❌ 실제 분석 실패: ${error.message}`);
        
        // 시뮬레이션 폴백 제거 - 에러만 표시
        hideLoadingModal();
        
        // 서버 연결 실패 에러 메시지 표시
        showServerError(error.message);
    }
}

// 서버 상태 표시 UI 생성 (모드 선택 제거)
function createServerStatusIndicator() {
    const uploadSection = document.querySelector('.upload-section');
    if (!uploadSection) return;
    
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'server-status-indicator';
    statusIndicator.id = 'serverStatusIndicator';
    statusIndicator.innerHTML = `
        <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 10px; border-left: 4px solid #ffc107;">
            <h4 style="margin: 0 0 10px 0; color: #333;">🔗 서버 연결 상태</h4>
            <div id="server-status-content">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div id="status-indicator" style="width: 12px; height: 12px; border-radius: 50%; background: #ffc107;"></div>
                    <span id="status-text">서버 상태 확인 중...</span>
                </div>
            </div>
            <p style="margin: 10px 0 0 0; font-size: 0.85rem; color: #666;">
                🌿 실제 Plant.id API를 사용하여 정확한 진단을 받습니다. (서버 실행 필요)
            </p>
        </div>
    `;
    
    // 업로드 영역 앞에 삽입
    uploadSection.insertBefore(statusIndicator, uploadSection.firstChild);
}

// 서버 상태 업데이트
function updateServerStatus(isOnline, message = '') {
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const serverStatusDiv = document.getElementById('serverStatusIndicator');
    
    if (!statusIndicator || !statusText || !serverStatusDiv) return;
    
    if (isOnline) {
        statusIndicator.style.background = '#28a745'; // 녹색
        statusText.textContent = '✅ 서버 연결됨 - Plant.id API 사용 가능';
        statusText.style.color = '#28a745';
        serverStatusDiv.querySelector('div').style.background = '#d4edda';
        serverStatusDiv.querySelector('div').style.borderLeftColor = '#28a745';
        
        // 분석 버튼 텍스트 변경
        if (analyzeBtn && !analyzeBtn.disabled) {
            analyzeBtn.textContent = '🌿 실제 AI 분석 시작';
        }
    } else {
        statusIndicator.style.background = '#dc3545'; // 빨간색
        statusText.textContent = `❌ 서버 연결 실패: ${message || '서버가 실행되지 않음'}`;
        statusText.style.color = '#dc3545';
        serverStatusDiv.querySelector('div').style.background = '#f8d7da';
        serverStatusDiv.querySelector('div').style.borderLeftColor = '#dc3545';
        
        // 분석 버튼 비활성화
        if (analyzeBtn) {
            analyzeBtn.disabled = true;
            analyzeBtn.textContent = '❌ 서버 연결 필요';
            analyzeBtn.style.opacity = '0.6';
        }
    }
}

// 실제 API만 사용하는 분석 함수 (모드 선택 제거)
function startAnalysisRealAPIOnly() {
    startAnalysisWithRealAPI();
}

// 페이지 로드 시 서버 상태 표시기 추가
document.addEventListener('DOMContentLoaded', function() {
    // 기존 초기화 후 서버 상태 표시기 추가
    setTimeout(() => {
        createServerStatusIndicator();
        
        // 서버 상태 자동 확인
        checkInitialServerStatus();
    }, 1000);
});

// 초기 서버 상태 확인
async function checkInitialServerStatus() {
    console.log('🔍 초기 서버 상태 확인...');
    
    try {
        const status = await plantAPI.checkServerStatus();
        if (status.success) {
            console.log('✅ 서버 온라인 - 실제 API 사용 가능');
            updateServerStatus(true);
        } else {
            console.log('❌ 서버 오프라인');
            updateServerStatus(false, status.error);
        }
    } catch (error) {
        console.log('❌ 서버 확인 실패');
        updateServerStatus(false, error.message);
    }
}

// 서버 연결 실패 에러 표시
function showServerError(errorMessage) {
    const errorHtml = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 40px; border-radius: 15px; max-width: 500px; margin: 20px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <div style="font-size: 4rem; margin-bottom: 20px;">🚫</div>
                <h2 style="color: #dc3545; margin-bottom: 15px;">서버 연결 실패</h2>
                <p style="margin-bottom: 20px; color: #666; line-height: 1.6;">
                    Plant.id API 서버에 연결할 수 없습니다.<br>
                    <strong>오류:</strong> ${errorMessage}
                </p>
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left;">
                    <h4 style="color: #856404; margin-bottom: 10px;">🔧 해결 방법:</h4>
                    <ol style="color: #856404; line-height: 1.6; margin: 0; padding-left: 20px;">
                        <li>Node.js 서버가 실행 중인지 확인</li>
                        <li>http://localhost:3001 주소 접근 가능한지 확인</li>
                        <li>방화벽이나 보안 프로그램 확인</li>
                        <li>서버 로그에서 오류 메시지 확인</li>
                    </ol>
                </div>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="location.reload()" style="background: #28a745; color: white; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-size: 1rem;">
                        🔄 페이지 새로고침
                    </button>
                    <button onclick="window.location.href='upload.html'" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-size: 1rem;">
                        📷 다시 시도
                    </button>
                    <button onclick="window.location.href='index.html'" style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-size: 1rem;">
                        🏠 홈으로
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // 에러 모달을 body에 추가
    const errorModal = document.createElement('div');
    errorModal.innerHTML = errorHtml;
    document.body.appendChild(errorModal);
    
    console.log(`🚫 서버 연결 실패 모달 표시: ${errorMessage}`);
}