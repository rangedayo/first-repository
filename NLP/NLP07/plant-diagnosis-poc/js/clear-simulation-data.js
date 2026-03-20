// 시뮬레이션 데이터 정리 스크립트

console.log('🧹 시뮬레이션 데이터 정리 시작');

// localStorage에서 시뮬레이션 관련 데이터 제거
function clearSimulationData() {
    const keysToCheck = ['analysisResult', 'uploadedImage', 'uploadedImageName'];
    let clearedCount = 0;
    
    keysToCheck.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
            try {
                if (key === 'analysisResult') {
                    const parsed = JSON.parse(data);
                    // 시뮬레이션 결과인지 확인
                    if (!parsed.analysisType || parsed.analysisType !== 'real') {
                        localStorage.removeItem(key);
                        console.log(`🗑️ 시뮬레이션 데이터 제거: ${key}`);
                        clearedCount++;
                    } else {
                        console.log(`✅ 실제 API 데이터 유지: ${key}`);
                    }
                } else {
                    // 다른 키들은 일단 유지 (이미지 데이터)
                    console.log(`📁 데이터 유지: ${key}`);
                }
            } catch (error) {
                // 파싱 실패하면 제거
                localStorage.removeItem(key);
                console.log(`🗑️ 잘못된 데이터 제거: ${key}`);
                clearedCount++;
            }
        }
    });
    
    console.log(`✅ 정리 완료: ${clearedCount}개 항목 제거`);
    
    // sessionStorage도 정리
    sessionStorage.clear();
    console.log('🧹 sessionStorage 정리 완료');
}

// 페이지 로드 시 자동 실행
document.addEventListener('DOMContentLoaded', function() {
    clearSimulationData();
});

// 수동 실행 함수
window.clearSimulationData = clearSimulationData;

console.log('🧹 시뮬레이션 데이터 정리 스크립트 로드 완료');