# python -m tests.test_api_client
import requests
import time

# ===== 설정 =====
API_BASE = "http://localhost:8000"
VALID_KEY = "test-key-001"  # auth.py에 등록된 실제 키

print("🚀 [테스트 1] 인증(Authentication) 시스템 점검")

# 1. 인증 헤더 없이 요청
resp_no_auth = requests.post(
    f"{API_BASE}/chat",
    json={"messages": [{"role": "user", "content": "안녕"}]}
)
print(f"   Case 1: 인증 헤더 없음   → HTTP {resp_no_auth.status_code} (기대값: 403)")

# 2. 잘못된 API 키로 요청
resp_wrong_key = requests.post(
    f"{API_BASE}/chat",
    json={"messages": [{"role": "user", "content": "안녕"}]},
    headers={"X-API-Key": "wrong-key-123"}
)
print(f"   Case 2: 잘못된 키 입력   → HTTP {resp_wrong_key.status_code} (기대값: 403)")

# 3. 올바른 API 키로 요청
resp_valid = requests.post(
    f"{API_BASE}/chat",
    json={"messages": [{"role": "user", "content": "안녕"}]},
    headers={"X-API-Key": VALID_KEY}
)
print(f"   Case 3: 올바른 키 입력   → HTTP {resp_valid.status_code} (기대값: 200)")

if resp_valid.status_code == 200:
    result = resp_valid.json()
    print(f"      ✅ 인증 성공! 응답 요약: {result['response'][:30]}...")
else:
    print(f"      ❌ 인증 실패: {resp_valid.text}")

print("-" * 50)

import requests

# 싱글턴 대화 테스트
resp = requests.post(
    "http://localhost:8000/chat",
    json={
        "messages": [
            {"role": "user", "content": "안녕하세요!"}
        ],
    },
    headers={"X-API-Key": "test-key-001"},
)
result = resp.json()
print(f"상태: {resp.status_code}")
print(f"응답: {result['response']}")


# 멀티턴 대화 테스트
TEST_URL = "http://localhost:8000/chat"
TEST_HEADERS = {"X-API-Key": "test-key-001"}

resp = requests.post(
    "http://localhost:8000/chat",
    json={
        "messages": [
            {"role": "user", "content": "안녕하세요!"},
            {"role": "bot", "content": result["response"]},    # 이전 응답 포함
            {"role": "user", "content": "오늘 뭐 하면 좋을까?"},  # *your code* — 새 메시지
        ],
    },
    headers={"X-API-Key": "test-key-001"},
)
result2 = resp.json()
print(f"멀티턴 응답: {result2['response']}")

print("\n🚀 [테스트 5] 유효성 검사 테스트 (범위 초과)")

# 1. temperature 범위 초과 테스트 (정상 범위: 0.0 ~ 2.0)
resp_temp = requests.post(
    TEST_URL,
    json={
        "messages": [{"role": "user", "content": "온도 테스트"}], 
        "temperature": 5.0  # 스키마 설정(le=2.0)을 초과함
    },
    headers=TEST_HEADERS
)
print(f"   Case 1: temperature 5.0 입력 → HTTP {resp_temp.status_code} (기대값: 422)")
if resp_temp.status_code == 422:
    print(f"   ✅ 성공: 서버가 잘못된 입력을 거부했습니다.")

# 2. 필수 필드 누락 테스트 (content 누락)
resp_missing = requests.post(
    TEST_URL,
    json={
        "messages": [{"role": "user"}] # content가 없음
    },
    headers=TEST_HEADERS
)
print(f"   Case 2: 내용(content) 누락 → HTTP {resp_missing.status_code} (기대값: 422)")


# 동시 요청 테스트
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

# 위에서 정의한 URL과 HEADERS를 그대로 사용한다고 가정합니다.
def send_chat(i):
    start_time = time.time()
    try:
        resp = requests.post(
            TEST_URL,  # 기존에 정의한 http://localhost:8000/chat
            json={
                "messages": [{"role": "user", "content": f"질문 {i}번입니다"}],
                "max_new_tokens": 30
            },
            headers=TEST_HEADERS, # 기존에 정의한 {"X-API-Key": "test-key-001"}
            timeout=60
        )
        status = resp.status_code
    except Exception as e:
        status = f"Error: {e}"
        
    elapsed = round(time.time() - start_time, 1)
    return {"id": i + 1, "elapsed": elapsed, "status": status}

print("\n🚀 [테스트 4] 동시 요청 (4개) 시작...")
start_total = time.time()

# 4개의 요청을 동시에 발사!
with ThreadPoolExecutor(max_workers=4) as ex:
    futures = [ex.submit(send_chat, i) for i in range(4)]
    results = [f.result() for f in as_completed(futures)]

total_time = round(time.time() - start_total, 1)

# 결과 출력 (ID 순서대로 정렬)
for r in sorted(results, key=lambda x: x["id"]):
    print(f"   요청 #{r['id']}: {r['elapsed']}초 (HTTP {r['status']})")
print(f"   ✅ 전체 소요 시간: {total_time}초")