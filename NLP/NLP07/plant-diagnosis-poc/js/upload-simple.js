// 완전히 새로운 간단한 업로드 JavaScript

console.log('upload-simple.js 로드됨');

let selectedFile = null;

// 페이지 로드 완료 후 실행
window.addEventListener('load', function() {
    console.log('페이지 로드 완료');
    initSimple();
});

function initSimple() {
    console.log('초기화 시작');
    
    // DOM 요소 확인
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewArea = document.getElementById('previewArea');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    console.log('DOM 요소 확인:', {
        uploadArea: !!uploadArea,
        fileInput: !!fileInput,
        previewArea: !!previewArea,
        analyzeBtn: !!analyzeBtn
    });
    
    // 업로드 영역 클릭 이벤트
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', function() {
            console.log('업로드 영역 클릭됨');
            fileInput.click();
        });
        
        // 파일 선택 이벤트
        fileInput.addEventListener('change', function(e) {
            console.log('파일 선택됨');
            const file = e.target.files[0];
            if (file) {
                handleFileSimple(file);
            }
        });
    }
    
    // 분석 버튼 이벤트
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', function() {
            console.log('분석 버튼 클릭됨');
            startAnalysisSimple();
        });
    }
    
    console.log('초기화 완료');
}

function handleFileSimple(file) {
    console.log('파일 처리 시작:', file.name);
    
    selectedFile = file;
    
    // 미리보기 표시
    const reader = new FileReader();
    reader.onload = function(e) {
        console.log('파일 읽기 완료');
        
        const previewImage = document.getElementById('previewImage');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        const uploadArea = document.getElementById('uploadArea');
        const previewArea = document.getElementById('previewArea');
        const analyzeBtn = document.getElementById('analyzeBtn');
        
        if (previewImage) previewImage.src = e.target.result;
        if (fileName) fileName.textContent = `파일명: ${file.name}`;
        if (fileSize) fileSize.textContent = `크기: ${formatFileSizeSimple(file.size)}`;
        
        if (uploadArea) uploadArea.style.display = 'none';
        if (previewArea) previewArea.style.display = 'block';
        
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = '분석 시작';
        }
        
        console.log('미리보기 표시 완료');
    };
    
    reader.readAsDataURL(file);
}

function formatFileSizeSimple(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 시뮬레이션 분석 함수 제거됨 - 실제 API만 사용
function startAnalysisSimple() {
    console.error('❌ 시뮬레이션 모드는 비활성화되었습니다.');
    console.log('🔄 실제 Plant.id API 분석으로 리다이렉트');
    
    // real-plant-api.js의 실제 API 함수 호출
    if (typeof startAnalysisRealAPIOnly === 'function') {
        startAnalysisRealAPIOnly();
    } else {
        alert('실제 API 클라이언트를 로드할 수 없습니다.\n페이지를 새로고침하고 서버가 실행 중인지 확인하세요.');
    }
}

// 전역 함수들 (HTML onclick에서 사용)
window.goHome = function() {
    console.log('홈으로 이동');
    window.location.href = 'index.html';
};

window.resetUpload = function() {
    console.log('업로드 초기화');
    selectedFile = null;
    
    const uploadArea = document.getElementById('uploadArea');
    const previewArea = document.getElementById('previewArea');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const fileInput = document.getElementById('fileInput');
    
    if (uploadArea) uploadArea.style.display = 'block';
    if (previewArea) previewArea.style.display = 'none';
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = '분석 시작';
    }
    if (fileInput) fileInput.value = '';
};

window.startAnalysis = function() {
    console.log('전역 startAnalysis 호출됨 - 실제 API로 리다이렉트');
    
    // 실제 API 함수가 있으면 호출, 없으면 에러
    if (typeof startAnalysisRealAPIOnly === 'function') {
        startAnalysisRealAPIOnly();
    } else {
        // 폴백으로 startAnalysisSimple 호출 (하지만 이제 에러 표시)
        startAnalysisSimple();
    }
};

window.forceNavigate = function() {
    console.log('강제 네비게이션');
    window.location.href = 'result.html';
};

console.log('upload-simple.js 로드 완료');