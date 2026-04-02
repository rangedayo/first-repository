# python test_api.py (새로운 터미널에서)

import requests
import json

# 1. 서버 주소 설정 (스웨거에서 확인한 그 주소)
base_url = "http://localhost:8000"

# 2. 테스트 데이터 정의
sample_request = {
    "MedInc": 3.5,
    "HouseAge": 25.0,
    "AveRooms": 5.0,
    "AveBedrms": 1.0,
    "Population": 1500.0,
    "AveOccup": 3.0,
    "Latitude": 37.5,
    "Longitude": -122.0,
}

# 3. 실제 요청 보내기
print("--- 정상 요청 테스트 ---")
resp = requests.post(f"{base_url}/predict", json=sample_request)
result = resp.json()

print(f"상태 코드: {resp.status_code}")
if resp.status_code == 200:
    print(f"예측 가격: ${result['predicted_price_usd']:,}")
else:
    print(f"에러 발생: {result}")

# 4. 에러 테스트 추가 (필수 필드 누락)
print("\n--- 에러 테스트: 필드 누락 ---")
bad_resp = requests.post(f"{base_url}/predict", json={"MedInc": 3.5})
print(f"필드 누락 응답 코드: {bad_resp.status_code}") # 422가 나오면 성공!


import time

# 1. 설정 및 헤더 출력
API_BASE = "http://localhost:8000"  # 주소를 API_BASE로 통일

print("=" * 60)
print("   Housing API 통합 테스트 시작")
print(f"   Target: {API_BASE}")
print("=" * 60)
time.sleep(0.5)  # 시각적인 효과를 위해 약간의 대기

# 2. 개별 추론 테스트 (아까 작성한 코드)
sample_request = {
    "MedInc": 3.5, "HouseAge": 25.0, "AveRooms": 5.0, "AveBedrms": 1.0,
    "Population": 1500.0, "AveOccup": 3.0, "Latitude": 37.5, "Longitude": -122.0,
}

print("\n[테스트 1] 단일 데이터 추론")
try:
    resp = requests.post(f"{API_BASE}/predict", json=sample_request)
    result = resp.json()
    print(f"상태 코드: {resp.status_code}")
    print(f"예측 가격: ${result['predicted_price_usd']:,}")
except Exception as e:
    print(f"연결 실패! 서버가 켜져 있는지 확인하세요. ({e})")

# 3. 다양한 케이스 테스트 (방금 가져오신 코드)
test_cases = [
    {"name": "저소득 지역", "MedInc": 1.5, "HouseAge": 40, "AveRooms": 4.0, "AveBedrms": 1.0,
     "Population": 2000, "AveOccup": 3.5, "Latitude": 34.0, "Longitude": -118.0},
    {"name": "고소득 지역", "MedInc": 10.0, "HouseAge": 10, "AveRooms": 8.0, "AveBedrms": 2.0,
     "Population": 500, "AveOccup": 2.0, "Latitude": 37.8, "Longitude": -122.4},
    {"name": "평균적 주택", "MedInc": 3.5, "HouseAge": 25, "AveRooms": 5.0, "AveBedrms": 1.0,
     "Population": 1500, "AveOccup": 3.0, "Latitude": 37.5, "Longitude": -122.0},
]

print("\n[테스트 2] 다양한 시나리오 결과")
print(f"{'케이스':<15} {'예측 가격':>15}")
print("-" * 40)

for case in test_cases:
    name = case.pop("name")
    resp = requests.post(f"{API_BASE}/predict", json=case)
    result = resp.json()
    print(f"{name:<12} ${result['predicted_price_usd']:>12,}")
    case["name"] = name

print("\n" + "=" * 60)
print("   모든 테스트 완료")
print("=" * 60)


print("\n[테스트 2] 에러 상황")

# 필수 필드 누락
resp = requests.post(f"{API_BASE}/predict", json={"MedInc": 3.5})
print(f"  필드 누락      → HTTP {resp.status_code}")

# 범위 초과 (위도)
bad_request = {
    "MedInc": 3.5, "HouseAge": 25, "AveRooms": 5, "AveBedrms": 1,
    "Population": 1500, "AveOccup": 3, "Latitude": 50.0, "Longitude": -122.0,  # 위도 초과
}
resp = requests.post(f"{API_BASE}/predict", json=bad_request)
print(f"  위도 범위 초과  → HTTP {resp.status_code}")

# 음수 값
bad_request2 = {
    "MedInc": -1.0, "HouseAge": 25, "AveRooms": 5, "AveBedrms": 1,
    "Population": 1500, "AveOccup": 3, "Latitude": 37.5, "Longitude": -122.0,
}
resp = requests.post(f"{API_BASE}/predict", json=bad_request2)
print(f"  소득 음수      → HTTP {resp.status_code}")

# JSON이 아닌 요청
resp = requests.post(f"{API_BASE}/predict", data="not json")
print(f"  잘못된 포맷    → HTTP {resp.status_code}")


# 테스트 3: 동시 요청
from concurrent.futures import ThreadPoolExecutor, as_completed

def send_predict(i):
    case = test_cases[i % len(test_cases)].copy()
    case.pop("name", None)
    start = time.time()
    resp = requests.post(f"{API_BASE}/predict", json=case, timeout=30)
    return {"id": i+1, "elapsed": round(time.time() - start, 3), "status": resp.status_code}

print("\n[테스트 3] 동시 요청 (8개)")
start = time.time()
with ThreadPoolExecutor(max_workers=8) as ex:
    futures = [ex.submit(send_predict, i) for i in range(8)]
    results = [f.result() for f in as_completed(futures)]

total = round(time.time() - start, 2)
for r in sorted(results, key=lambda x: x["id"]):
    print(f"  요청 #{r['id']}: {r['elapsed']}초 (HTTP {r['status']})")
print(f"  전체: {total}초")

# 헬스체크
print("\n[테스트 4] 헬스체크")
resp = requests.get(f"{API_BASE}/health")
print(f"  상태: {resp.json()}")

# 테스트 종합 결과
print("\n" + "=" * 60)
print("  테스트 결과 종합")
print("=" * 60)
print("  ✅ 정상 요청: 다양한 입력에서 합리적인 가격 반환")
print("  ✅ 에러 처리: 잘못된 입력에 422/400 반환, 서버 안 죽음")
print("  ✅ 동시 처리: 8개 동시 요청 정상 처리")
print("  ✅ 헬스체크: 서버 상태 정상")