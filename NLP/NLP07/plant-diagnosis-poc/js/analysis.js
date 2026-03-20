// 결과 페이지 JavaScript

let analysisResult = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadAnalysisResult();
    displayResult();
    addAnimations();
});

function loadAnalysisResult() {
    console.log('🔍 실제 API 분석 결과 로드 시작');
    
    // 1순위: URL 파라미터에서 결과 로드
    const urlParams = new URLSearchParams(window.location.search);
    const urlData = urlParams.get('data');
    
    if (urlData) {
        try {
            analysisResult = JSON.parse(decodeURIComponent(urlData));
            if (analysisResult.analysisType === 'real') {
                console.log('✅ URL 파라미터에서 실제 API 결과 로드:', analysisResult.status);
                return;
            }
        } catch (error) {
            console.warn('URL 파라미터 파싱 실패:', error);
        }
    }
    
    // 2순위: 전역 변수에서 결과 로드
    if (window.plantDiagnosisResult) {
        analysisResult = window.plantDiagnosisResult;
        console.log('✅ 전역 변수에서 실제 API 결과 로드:', analysisResult.status);
        return;
    }
    
    // 3순위: localStorage에서 실제 API 결과 로드
    let storedResult = localStorage.getItem('analysisResult');
    
    if (storedResult) {
        try {
            analysisResult = JSON.parse(storedResult);
            
            // 실제 API 결과인지 확인
            if (analysisResult.analysisType === 'real') {
                console.log('✅ localStorage에서 실제 API 결과 로드:', analysisResult.status);
                return;
            } else {
                console.warn('❌ 시뮬레이션 결과 발견 - 무시함');
                localStorage.removeItem('analysisResult'); // 시뮬레이션 결과 삭제
            }
        } catch (error) {
            console.warn('localStorage 파싱 실패:', error);
            localStorage.removeItem('analysisResult');
        }
    }
    
    // 4순위: sessionStorage 확인
    let sessionResult = sessionStorage.getItem('analysisResult');
    if (sessionResult) {
        try {
            analysisResult = JSON.parse(sessionResult);
            if (analysisResult.analysisType === 'real') {
                console.log('✅ sessionStorage에서 실제 API 결과 로드:', analysisResult.status);
                return;
            }
        } catch (error) {
            console.warn('sessionStorage 파싱 실패:', error);
        }
    }
    
    // 모든 방법 실패 시 에러 표시
    console.error('❌ 실제 분석 결과를 찾을 수 없습니다.');
    showNoResultError();
}

// 분석 결과가 없을 때 에러 표시
function showNoResultError() {
    const container = document.querySelector('.container');
    if (!container) return;
    
    container.innerHTML = `
        <div style="text-align: center; padding: 50px 20px; color: #333;">
            <div style="font-size: 4rem; margin-bottom: 20px;">❌</div>
            <h2 style="color: #dc3545; margin-bottom: 15px;">분석 결과를 찾을 수 없습니다</h2>
            <p style="margin-bottom: 30px; color: #666; line-height: 1.6;">
                실제 Plant.id API 분석 결과가 없습니다.<br>
                업로드 페이지에서 다시 분석을 시도해주세요.
            </p>
            <div style="margin-bottom: 30px; padding: 20px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 10px; text-align: left;">
                <h4 style="color: #856404; margin-bottom: 10px;">🔧 해결 방법:</h4>
                <ol style="color: #856404; line-height: 1.8;">
                    <li><strong>서버 실행 확인:</strong> Node.js 서버가 http://localhost:3001에서 실행 중인지 확인</li>
                    <li><strong>업로드 페이지로 이동:</strong> 새로운 이미지로 분석 시도</li>
                    <li><strong>브라우저 새로고침:</strong> 페이지를 새로고침 후 다시 시도</li>
                </ol>
            </div>
            <button onclick="goToUpload()" style="background: #4CAF50; color: white; border: none; padding: 15px 30px; border-radius: 25px; font-size: 1.1rem; cursor: pointer; margin-right: 10px;">
                📷 새로 분석하기
            </button>
            <button onclick="window.location.href='index.html'" style="background: #6c757d; color: white; border: none; padding: 15px 30px; border-radius: 25px; font-size: 1.1rem; cursor: pointer;">
                🏠 홈으로 가기
            </button>
        </div>
    `;
}

function displayResult() {
    if (!analysisResult) return;

    console.log('분석 결과 표시 시작:', analysisResult);

    // 이미지 표시
    const resultImage = document.getElementById('resultImage');
    if (resultImage && analysisResult.imageUrl) {
        resultImage.src = analysisResult.imageUrl;
        resultImage.alt = '분석된 식물 이미지';
    }

    // 상태 배지 업데이트
    updateStatusBadge();
    
    // 신뢰도 표시
    const confidenceScore = document.getElementById('confidenceScore');
    if (confidenceScore) {
        confidenceScore.textContent = `${analysisResult.confidence}%`;
    }

    // 증상 목록 표시
    displaySymptoms();
    
    // 원인 분석 표시
    displayCauses();
    
    // 해결책 표시
    displaySolutions();
    
    // 식물 정보 표시 (실제 API 결과에만 있음)
    displayPlantInfo();
    
    // 분석 정보 표시
    displayAnalysisInfo();
}

function updateStatusBadge() {
    const statusBadge = document.getElementById('statusBadge');
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    
    if (statusIcon) statusIcon.textContent = analysisResult.icon;
    if (statusText) statusText.textContent = analysisResult.status;
    
    // 상태에 따른 배지 색상 변경
    if (statusBadge) {
        statusBadge.className = 'status-badge';
        
        if (analysisResult.status.includes('건강')) {
            statusBadge.classList.add('healthy');
        } else if (analysisResult.status.includes('과습') || analysisResult.status.includes('건조')) {
            statusBadge.classList.add('warning');
        } else {
            statusBadge.classList.add('danger');
        }
    }
}

function displaySymptoms() {
    const symptomsList = document.getElementById('symptomsList');
    if (!symptomsList || !analysisResult.symptoms) return;
    
    symptomsList.innerHTML = '';
    
    analysisResult.symptoms.forEach(symptom => {
        const li = document.createElement('li');
        li.textContent = symptom;
        symptomsList.appendChild(li);
    });
}

function displayCauses() {
    const causesList = document.getElementById('causesList');
    if (!causesList || !analysisResult.causes) return;
    
    causesList.innerHTML = '';
    
    analysisResult.causes.forEach((cause, index) => {
        const causeItem = createCauseItem(cause, index + 1);
        causesList.appendChild(causeItem);
    });
}

function createCauseItem(cause, rank) {
    const div = document.createElement('div');
    div.className = 'cause-item';
    
    div.innerHTML = `
        <div class="cause-header">
            <span class="cause-rank">${rank}순위</span>
            <span class="cause-name">${cause.name}</span>
            <span class="cause-probability">${cause.probability}%</span>
        </div>
        <p class="cause-description">${cause.description}</p>
    `;
    
    return div;
}

function displaySolutions() {
    // 건강한 식물인 경우 기본 관리법 표시
    if (!analysisResult.treatments && analysisResult.status && analysisResult.status.includes('건강')) {
        console.log('✅ 건강한 식물 - 기본 관리법 표시');
        displayHealthyPlantCare();
        return;
    }
    
    // 실제 API 결과의 치료법 사용
    if (!analysisResult.treatments || analysisResult.analysisType !== 'real') {
        console.error('❌ 실제 API 치료법 데이터가 없습니다.');
        return;
    }
    
    console.log('✅ 실제 API 결과의 치료법 사용');
    const solutions = analysisResult.treatments;
    
    // 즉시 조치 표시
    const immediateSolutions = document.getElementById('immediateSolutions');
    if (immediateSolutions && solutions.immediate) {
        immediateSolutions.innerHTML = '';
        solutions.immediate.forEach(solution => {
            const solutionItem = createSolutionItem(solution);
            immediateSolutions.appendChild(solutionItem);
        });
    }
    
    // 장기 관리 표시
    const longtermSolutions = document.getElementById('longtermSolutions');
    if (longtermSolutions && solutions.longterm) {
        longtermSolutions.innerHTML = '';
        solutions.longterm.forEach(solution => {
            const solutionItem = createSolutionItem(solution);
            longtermSolutions.appendChild(solutionItem);
        });
    }
    
    // 예방법 표시 (실제 API에만 있음)
    const preventionSolutions = document.getElementById('preventionSolutions');
    if (preventionSolutions && solutions.prevention && solutions.prevention.length > 0) {
        preventionSolutions.innerHTML = '';
        solutions.prevention.forEach(solution => {
            const solutionItem = createSolutionItem(solution);
            preventionSolutions.appendChild(solutionItem);
        });
        
        // 예방법 섹션 표시
        const preventionSection = preventionSolutions.closest('.prevention-section');
        if (preventionSection) {
            preventionSection.style.display = 'block';
        }
    }
}

function createSolutionItem(solution) {
    const div = document.createElement('div');
    div.className = 'solution-item';
    
    const priorityClass = solution.priority === 1 ? 'high' : solution.priority === 2 ? 'medium' : 'low';
    
    div.innerHTML = `
        <div class="solution-priority priority-${priorityClass}">우선순위 ${solution.priority}</div>
        <div class="solution-content">
            <h5>${solution.title}</h5>
            <p>${solution.description}</p>
            ${solution.duration ? `<span class="solution-duration">기간: ${solution.duration}</span>` : ''}
            ${solution.frequency ? `<span class="solution-frequency">빈도: ${solution.frequency}</span>` : ''}
        </div>
    `;
    
    return div;
}

// 건강한 식물을 위한 기본 관리법 표시
function displayHealthyPlantCare() {
    const healthyCareTips = {
        immediate: [
            {
                type: 'immediate',
                title: '현재 관리 유지',
                description: '식물이 건강한 상태입니다. 지금처럼 계속 관리해주세요.',
                priority: 1
            }
        ],
        longterm: [
            {
                type: 'longterm', 
                title: '정기적인 물주기',
                description: '흙 표면이 마르면 충분히 물을 주세요.',
                priority: 1
            },
            {
                type: 'longterm',
                title: '적절한 햇빛 제공',
                description: '식물에 맞는 적절한 양의 햇빛을 제공해주세요.',
                priority: 2
            },
            {
                type: 'longterm',
                title: '주기적인 상태 확인',
                description: '일주일에 한 번씩 잎과 줄기 상태를 확인해주세요.',
                priority: 3
            }
        ],
        prevention: [
            {
                type: 'prevention',
                title: '과습 방지',
                description: '물을 너무 자주 주지 않도록 주의하세요.',
                priority: 1
            },
            {
                type: 'prevention',
                title: '통풍 관리',
                description: '적절한 통풍을 유지해 곰팡이를 예방하세요.',
                priority: 2
            }
        ]
    };
    
    // 즉시 조치 표시
    const immediateSolutions = document.getElementById('immediateSolutions');
    if (immediateSolutions && healthyCareTips.immediate) {
        immediateSolutions.innerHTML = '';
        healthyCareTips.immediate.forEach(solution => {
            const solutionItem = createSolutionItem(solution);
            immediateSolutions.appendChild(solutionItem);
        });
    }
    
    // 장기 관리 표시
    const longtermSolutions = document.getElementById('longtermSolutions');
    if (longtermSolutions && healthyCareTips.longterm) {
        longtermSolutions.innerHTML = '';
        healthyCareTips.longterm.forEach(solution => {
            const solutionItem = createSolutionItem(solution);
            longtermSolutions.appendChild(solutionItem);
        });
    }
    
    // 예방법 표시
    const preventionSolutions = document.getElementById('preventionSolutions');
    if (preventionSolutions && healthyCareTips.prevention) {
        preventionSolutions.innerHTML = '';
        healthyCareTips.prevention.forEach(solution => {
            const solutionItem = createSolutionItem(solution);
            preventionSolutions.appendChild(solutionItem);
        });
        
        // 예방법 섹션 표시
        const preventionSection = preventionSolutions.closest('.prevention-section');
        if (preventionSection) {
            preventionSection.style.display = 'block';
        }
    }
}

function addAnimations() {
    // 페이지 로드 애니메이션
    const animateElements = document.querySelectorAll('.result-main, .analysis-section, .solutions-section, .prevention-section');
    
    animateElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 200);
    });
    
    // 신뢰도 애니메이션
    animateConfidence();
    
    // 원인 확률 애니메이션
    setTimeout(() => {
        animateProbabilities();
    }, 1000);
}

function animateConfidence() {
    const confidenceScore = document.getElementById('confidenceScore');
    if (!confidenceScore || !analysisResult) return;
    
    const targetValue = analysisResult.confidence;
    let currentValue = 0;
    const duration = 2000;
    const increment = targetValue / (duration / 16);
    
    function updateValue() {
        currentValue += increment;
        if (currentValue < targetValue) {
            confidenceScore.textContent = `${Math.floor(currentValue)}%`;
            requestAnimationFrame(updateValue);
        } else {
            confidenceScore.textContent = `${targetValue}%`;
        }
    }
    
    updateValue();
}

function animateProbabilities() {
    const probabilityElements = document.querySelectorAll('.cause-probability');
    
    probabilityElements.forEach((el, index) => {
        const targetValue = parseInt(el.textContent);
        let currentValue = 0;
        const duration = 1500;
        const increment = targetValue / (duration / 16);
        
        setTimeout(() => {
            function updateValue() {
                currentValue += increment;
                if (currentValue < targetValue) {
                    el.textContent = `${Math.floor(currentValue)}%`;
                    requestAnimationFrame(updateValue);
                } else {
                    el.textContent = `${targetValue}%`;
                }
            }
            updateValue();
        }, index * 300);
    });
}

// 네비게이션 함수들
function goToUpload() {
    // 현재 결과 삭제
    localStorage.removeItem('analysisResult');
    localStorage.removeItem('uploadedImage');
    localStorage.removeItem('uploadedImageName');
    
    window.location.href = 'upload.html';
}

function viewGuide() {
    // 가이드 페이지로 이동 (현재는 알림으로 대체)
    alert('식물 관리 가이드 페이지는 준비 중입니다.');
}

// 결과 공유 기능 (추가 기능)
function shareResult() {
    if (navigator.share && analysisResult) {
        navigator.share({
            title: '식물 진단 결과',
            text: `내 식물 상태: ${analysisResult.status} (신뢰도: ${analysisResult.confidence}%)`,
            url: window.location.href
        }).catch(console.error);
    } else {
        // 클립보드에 복사
        const shareText = `식물 진단 결과: ${analysisResult.status} (신뢰도: ${analysisResult.confidence}%)`;
        navigator.clipboard.writeText(shareText).then(() => {
            alert('결과가 클립보드에 복사되었습니다.');
        }).catch(() => {
            alert('공유 기능을 사용할 수 없습니다.');
        });
    }
}

// 결과 저장 기능
function saveResult() {
    if (!analysisResult) return;
    
    const savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
    
    const resultToSave = {
        ...analysisResult,
        savedAt: new Date().toISOString(),
        id: Date.now().toString()
    };
    
    savedResults.push(resultToSave);
    localStorage.setItem('savedResults', JSON.stringify(savedResults));
    
    alert('결과가 저장되었습니다.');
}

// 식물 정보 표시 (실제 API 결과용)
function displayPlantInfo() {
    if (!analysisResult.plantInfo) return;
    
    console.log('식물 정보 표시:', analysisResult.plantInfo);
    
    // 식물 정보 섹션 생성 또는 업데이트
    let plantInfoSection = document.getElementById('plantInfoSection');
    if (!plantInfoSection) {
        plantInfoSection = document.createElement('div');
        plantInfoSection.id = 'plantInfoSection';
        plantInfoSection.className = 'analysis-section';
        
        const solutionsSection = document.querySelector('.solutions-section');
        if (solutionsSection) {
            solutionsSection.parentNode.insertBefore(plantInfoSection, solutionsSection);
        }
    }
    
    const plantInfo = analysisResult.plantInfo;
    
    plantInfoSection.innerHTML = `
        <div class="section-header">
            <h3>🌿 식물 정보</h3>
        </div>
        <div class="plant-info-content" style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 15px;">
            <div class="plant-main-info" style="margin-bottom: 15px;">
                <h4 style="color: #4CAF50; margin: 0 0 5px 0;">${plantInfo.name}</h4>
                ${plantInfo.scientificName ? `<p style="font-style: italic; color: #666; margin: 0 0 5px 0;">${plantInfo.scientificName}</p>` : ''}
                ${plantInfo.family ? `<p style="color: #666; margin: 0 0 10px 0;">과: ${plantInfo.family}</p>` : ''}
                <span style="background: #4CAF50; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.8rem;">
                    확률: ${plantInfo.probability}%
                </span>
            </div>
            
            ${plantInfo.commonNames && plantInfo.commonNames.length > 0 ? `
                <div style="margin: 15px 0;">
                    <strong>다른 이름:</strong> ${plantInfo.commonNames.join(', ')}
                </div>
            ` : ''}
            
            ${plantInfo.description ? `
                <div style="margin: 15px 0;">
                    <strong>설명:</strong> ${plantInfo.description}
                </div>
            ` : ''}
            
            ${plantInfo.careInstructions ? `
                <div style="margin: 15px 0;">
                    <strong>관리 정보:</strong>
                    ${plantInfo.careInstructions.watering ? `<br>• 물주기: ${plantInfo.careInstructions.watering}` : ''}
                    ${plantInfo.careInstructions.propagation ? `<br>• 번식: ${plantInfo.careInstructions.propagation}` : ''}
                    ${plantInfo.careInstructions.edibleParts ? `<br>• 식용 부위: ${plantInfo.careInstructions.edibleParts}` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

// 분석 정보 표시
function displayAnalysisInfo() {
    // 분석 정보 섹션 생성 또는 업데이트
    let analysisInfoSection = document.getElementById('analysisInfoSection');
    if (!analysisInfoSection) {
        analysisInfoSection = document.createElement('div');
        analysisInfoSection.id = 'analysisInfoSection';
        analysisInfoSection.style.cssText = 'margin-top: 30px; padding: 15px; background: #e8f5e8; border-radius: 10px; border-left: 4px solid #4CAF50;';
        
        const lastSection = document.querySelector('.prevention-section') || document.querySelector('.solutions-section');
        if (lastSection) {
            lastSection.parentNode.insertBefore(analysisInfoSection, lastSection.nextSibling);
        }
    }
    
    const isRealAPI = analysisResult.analysisType === 'real';
    const provider = analysisResult.provider || (isRealAPI ? 'Plant.id (Kindwise)' : '시뮬레이션');
    const timestamp = new Date(analysisResult.timestamp).toLocaleString();
    
    analysisInfoSection.innerHTML = `
        <div style="font-size: 0.9rem; color: #333;">
            <strong>📊 분석 정보</strong><br>
            • 분석 방식: ${isRealAPI ? '🌿 실제 AI 분석' : '🧪 시뮬레이션'}<br>
            • 제공: ${provider}<br>
            • 분석 시간: ${timestamp}
            ${isRealAPI ? '<br>• 💡 실제 Plant.id API를 사용한 정확한 진단 결과입니다.' : '<br>• 💡 데모용 시뮬레이션 결과입니다.'}
        </div>
    `;
}

// 키보드 단축키
document.addEventListener('keydown', function(e) {
    if (e.key === 'r' && e.ctrlKey) {
        e.preventDefault();
        goToUpload();
    }
    
    if (e.key === 's' && e.ctrlKey) {
        e.preventDefault();
        saveResult();
    }
});

// 인쇄 기능
function printResult() {
    window.print();
}

// 페이지 가시성 변경 시 애니메이션 재시작
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // 페이지가 다시 보일 때 애니메이션 재시작
        setTimeout(addAnimations, 100);
    }
});