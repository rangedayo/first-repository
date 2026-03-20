// 업로드 페이지 JavaScript

let selectedFile = null;

// DOM 요소들
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewArea = document.getElementById('previewArea');
const previewImage = document.getElementById('previewImage');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingModal = document.getElementById('loadingModal');

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeUpload();
});

function initializeUpload() {
    // 업로드 영역 클릭 이벤트
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });

    // 파일 선택 이벤트
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    });

    // 드래그 앤 드롭 이벤트
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    // 키보드 접근성
    uploadArea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
        }
    });
}

function handleFileSelect(file) {
    // 파일 검증
    if (!validateFile(file)) {
        return;
    }

    selectedFile = file;
    showPreview(file);
    enableAnalyzeButton();
}

function validateFile(file) {
    // 파일 형식 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
        showError('지원하지 않는 파일 형식입니다. JPG, PNG 파일만 업로드 가능합니다.');
        return false;
    }

    // 파일 크기 검증 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        showError('파일 크기가 너무 큽니다. 10MB 이하의 파일을 선택해주세요.');
        return false;
    }

    return true;
}

function showPreview(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        fileName.textContent = `파일명: ${file.name}`;
        fileSize.textContent = `크기: ${formatFileSize(file.size)}`;
        
        // 업로드 영역 숨기고 미리보기 표시
        uploadArea.style.display = 'none';
        previewArea.style.display = 'block';
    };
    
    reader.readAsDataURL(file);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function enableAnalyzeButton() {
    analyzeBtn.disabled = false;
    analyzeBtn.style.opacity = '1';
    analyzeBtn.style.cursor = 'pointer';
    analyzeBtn.textContent = '분석 시작';
}

function resetAnalyzeButton() {
    analyzeBtn.disabled = false;
    analyzeBtn.style.opacity = '1';
    analyzeBtn.style.cursor = 'pointer';
    analyzeBtn.textContent = '분석 시작';
}

function resetUpload() {
    selectedFile = null;
    fileInput.value = '';
    
    // UI 초기화
    uploadArea.style.display = 'block';
    previewArea.style.display = 'none';
    analyzeBtn.disabled = true;
    analyzeBtn.style.opacity = '0.6';
    analyzeBtn.style.cursor = 'not-allowed';
}

function startAnalysis() {
    addDebugLog('startAnalysis 함수 시작');
    
    if (!selectedFile) {
        addDebugLog('에러: 파일이 선택되지 않음');
        showError('먼저 파일을 선택해주세요.');
        return;
    }

    addDebugLog('선택된 파일: ' + selectedFile.name + ' (' + formatFileSize(selectedFile.size) + ')');

    // 버튼 비활성화 (중복 클릭 방지)
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = '분석 중...';
    addDebugLog('분석 버튼 비활성화');

    // 로딩 모달 표시
    showLoadingModal();
    addDebugLog('로딩 모달 표시');

    // 이미지를 로컬 스토리지에 저장 (PoC용)
    const reader = new FileReader();
    reader.onload = function(e) {
        addDebugLog('파일 읽기 완료 (크기: ' + e.target.result.length + ' bytes)');
        
        // localStorage 저장
        localStorage.setItem('uploadedImage', e.target.result);
        localStorage.setItem('uploadedImageName', selectedFile.name);
        addDebugLog('localStorage 저장 완료');
        
        // 분석 시뮬레이션 시작
        simulateAnalysisSimple();
    };
    
    reader.onerror = function(error) {
        addDebugLog('파일 읽기 실패: ' + error);
        hideLoadingModal();
        showError('파일을 읽는 중 오류가 발생했습니다.');
    };
    
    addDebugLog('FileReader로 파일 읽기 시작');
    reader.readAsDataURL(selectedFile);
    
    // 함수 마지막에 반드시 실행될 백업 페이지 이동 (5초 후)
    setTimeout(() => {
        addDebugLog('백업 페이지 이동 실행 (5초 타임아웃)');
        console.log('강제 페이지 이동 실행 (백업)');
        hideLoadingModal();
        window.open("result.html", "_self");
    }, 5000);
}

// 간소화된 분석 시뮬레이션 함수
function simulateAnalysisSimple() {
    addDebugLog('간소화된 분석 시뮬레이션 시작');
    
    // 2초 후 분석 완료
    setTimeout(() => {
        addDebugLog('분석 완료 - 결과 생성 중');
        
        // 시뮬레이션 결과 데이터 생성
        const mockResult = generateMockResult();
        addDebugLog('결과 데이터 생성 완료: ' + mockResult.status);
        
        // localStorage에 저장
        localStorage.setItem('analysisResult', JSON.stringify(mockResult));
        addDebugLog('분석 결과 localStorage 저장 완료');
        
        // 로딩 모달 완전 제거
        hideLoadingModal();
        addDebugLog('로딩 모달 완전 제거');
        
        // 추가 대기 후 페이지 이동 (DOM 업데이트 완료 보장)
        setTimeout(() => {
            addDebugLog('분석 완료 - 페이지 이동 준비');
            console.log('강제 페이지 이동 실행');
            
            // 강제 페이지 이동
            window.open("result.html", "_self");
            
        }, 100); // 100ms 추가 대기
        
    }, 2000);
}

// 기존 복잡한 분석 함수 (사용 안 함)
function simulateAnalysis() {
    // 이 함수는 더 이상 사용하지 않음
    addDebugLog('기존 simulateAnalysis 호출됨 - 새 함수로 리다이렉트');
    simulateAnalysisSimple();
}

function generateMockResult() {
    // 랜덤한 분석 결과 생성 (PoC용)
    const conditions = [
        {
            status: '과습 의심',
            icon: '🚨',
            confidence: 85,
            symptoms: ['잎이 노랗게 변함', '흙이 계속 젖어있음', '뿌리 부근 곰팡이 냄새'],
            causes: [
                { name: '물 과다 공급', probability: 90, description: '물을 너무 자주 주거나 한 번에 많이 준 경우' },
                { name: '배수 불량', probability: 70, description: '화분 바닥의 배수구가 막혔거나 배수층이 부족한 경우' },
                { name: '뿌리썩음병 초기', probability: 40, description: '과습으로 인한 뿌리썩음병 초기 증상' }
            ]
        },
        {
            status: '건조 상태',
            icon: '🌵',
            confidence: 78,
            symptoms: ['잎 끝이 마름', '흙이 갈라짐', '잎이 시들어짐'],
            causes: [
                { name: '수분 부족', probability: 85, description: '물을 충분히 주지 않았거나 주기가 너무 긴 경우' },
                { name: '낮은 습도', probability: 65, description: '실내 습도가 너무 낮은 경우' },
                { name: '과도한 햇빛', probability: 45, description: '직사광선에 너무 오래 노출된 경우' }
            ]
        },
        {
            status: '건강한 상태',
            icon: '✅',
            confidence: 92,
            symptoms: ['잎이 푸르고 윤기남', '새싹이 돋아남', '전체적으로 생기있음'],
            causes: [
                { name: '적절한 관리', probability: 95, description: '물주기, 햇빛, 온도 등이 모두 적절한 상태' }
            ]
        }
    ];

    // 랜덤하게 하나 선택
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
        ...randomCondition,
        timestamp: new Date().toISOString(),
        imageUrl: localStorage.getItem('uploadedImage')
    };
}

function showLoadingModal() {
    loadingModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideLoadingModal() {
    // 완전한 모달 제거
    if (loadingModal) {
        loadingModal.style.display = 'none';
        loadingModal.style.visibility = 'hidden';
        loadingModal.style.zIndex = '-1';
    }
    
    // body 스타일 복구
    document.body.style.overflow = 'auto';
    document.body.style.position = '';
    
    // 버튼 상태 복구
    if (analyzeBtn) {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = '분석 시작';
        analyzeBtn.style.opacity = '1';
        analyzeBtn.style.cursor = 'pointer';
    }
    
    addDebugLog('모달 완전 제거 및 상태 복구 완료');
}

function showError(message) {
    // 간단한 에러 알림 (실제 프로젝트에서는 더 나은 UI 사용)
    alert(message);
}

// 디버그 관련 함수들
function addDebugLog(message) {
    const debugLog = document.getElementById('debugLog');
    if (debugLog) {
        const timestamp = new Date().toLocaleTimeString();
        debugLog.innerHTML += `[${timestamp}] ${message}<br>`;
        debugLog.scrollTop = debugLog.scrollHeight;
    }
    console.log(message);
}

function toggleDebug() {
    const debugInfo = document.getElementById('debugInfo');
    if (debugInfo) {
        if (debugInfo.style.display === 'none') {
            debugInfo.style.display = 'block';
            addDebugLog('디버그 모드 활성화');
        } else {
            debugInfo.style.display = 'none';
        }
    }
}

function testDirectNavigation() {
    addDebugLog('직접 네비게이션 테스트 시작');
    
    // 테스트 결과 생성
    const testResult = {
        status: '테스트 결과',
        icon: '🧪',
        confidence: 100,
        symptoms: ['테스트 증상 1', '테스트 증상 2'],
        causes: [
            { name: '테스트 원인', probability: 100, description: '직접 네비게이션 테스트입니다.' }
        ],
        timestamp: new Date().toISOString(),
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGE3YzU5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+7YWM7Iqk7Yq4IOydtOuvuOyngDwvdGV4dD48L3N2Zz4='
    };
    
    try {
        localStorage.setItem('analysisResult', JSON.stringify(testResult));
        addDebugLog('테스트 결과 저장 완료');
    } catch (error) {
        addDebugLog('localStorage 저장 실패: ' + error.message);
        try {
            sessionStorage.setItem('analysisResult', JSON.stringify(testResult));
            addDebugLog('sessionStorage에 저장 완료');
        } catch (sessionError) {
            addDebugLog('sessionStorage도 실패: ' + sessionError.message);
        }
    }
    
    addDebugLog('result.html로 이동 시도');
    window.location.href = 'result.html';
}

function forcePageMove() {
    addDebugLog('강제 페이지 이동 실행');
    console.log('강제 페이지 이동 실행');
    
    // 모든 방해 요소 제거
    hideLoadingModal();
    reattachEvents();
    
    // 여러 방법으로 페이지 이동 시도
    setTimeout(() => {
        window.open("result.html", "_self");
    }, 100);
    
    setTimeout(() => {
        window.location.href = "result.html";
    }, 200);
    
    setTimeout(() => {
        window.location.replace("result.html");
    }, 300);
}

// 이벤트 재연결 함수
function reattachEvents() {
    addDebugLog('이벤트 재연결 시작');
    
    // 모든 버튼 활성화
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.disabled = false;
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';
    });
    
    // 클릭 이벤트 강제 재연결
    const homeBtn = document.querySelector('button[onclick="goHome()"]');
    if (homeBtn) {
        homeBtn.onclick = function() {
            addDebugLog('이전 버튼 클릭됨');
            goHome();
        };
    }
    
    const analyzeButton = document.getElementById('analyzeBtn');
    if (analyzeButton) {
        analyzeButton.onclick = function() {
            addDebugLog('분석 버튼 재클릭됨');
            startAnalysis();
        };
    }
    
    addDebugLog('이벤트 재연결 완료');
}

// 네비게이션 함수들
function goHome() {
    addDebugLog('이전 버튼 클릭 - index.html로 이동');
    window.location.href = 'index.html';
}

// 페이지 이탈 시 확인 (파일이 선택된 경우)
window.addEventListener('beforeunload', function(e) {
    if (selectedFile) {
        e.preventDefault();
        e.returnValue = '업로드된 파일이 있습니다. 정말 페이지를 떠나시겠습니까?';
    }
});

// 키보드 단축키
document.addEventListener('keydown', function(e) {
    // ESC 키로 업로드 초기화
    if (e.key === 'Escape' && selectedFile) {
        resetUpload();
    }
    
    // Enter 키로 분석 시작
    if (e.key === 'Enter' && !analyzeBtn.disabled) {
        startAnalysis();
    }
});

// 이미지 압축 함수 (선택사항)
function compressImage(file, maxWidth = 1024, maxHeight = 1024, quality = 0.8) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // 비율 계산
            let { width, height } = img;
            
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // 이미지 그리기
            ctx.drawImage(img, 0, 0, width, height);
            
            // Blob으로 변환
            canvas.toBlob(resolve, 'image/jpeg', quality);
        };
        
        img.src = URL.createObjectURL(file);
    });
}