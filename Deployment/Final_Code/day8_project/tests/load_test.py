# """
# 동시 요청 및 성능 벤치마크 테스트
# """

# import requests
# import numpy as np
# import time
# from concurrent.futures import ThreadPoolExecutor, as_completed
# from torchvision import datasets

# BASE_URL = "http://localhost:8000"
# # 실제 데이터를 사용하여 전처리 과정의 CPU 부하까지 테스트에 포함합니다.
# test_dataset = datasets.MNIST(root="data", train=False, download=True)

# def send_inference_request(i):
#     """실제 MNIST 데이터를 추출하여 서버에 추론 요청을 보냅니다."""
#     image, label = test_dataset[i % len(test_dataset)]
#     # 정규화 및 리스트 변환 (서버 규격에 맞춤)
#     pixels = (np.array(image) / 255.0).tolist()
    
#     start_time = time.time()
#     try:
#         resp = requests.post(
#             f"{BASE_URL}/predict/pixels",
#             json={"pixels": pixels},
#             timeout=30
#         )
#         return {
#             "id": i + 1,
#             "elapsed": round(time.time() - start_time, 2),
#             "status": resp.status_code,
#             "success": resp.status_code == 200
#         }
#     except Exception as e:
#         return {"id": i + 1, "elapsed": 0, "status": str(e), "success": False}

# def run_stress_test(n_requests):
#     print(f"\n[테스트] 동시 요청 수: {n_requests}")
#     print("-" * 40)
    
#     start = time.time()
#     with ThreadPoolExecutor(max_workers=n_requests) as executor:
#         futures = [executor.submit(send_inference_request, i) for i in range(n_requests)]
#         results = [f.result() for f in as_completed(futures)]
    
#     total_time = round(time.time() - start, 2)
    
#     # 결과 출력
#     for r in sorted(results, key=lambda x: x["id"]):
#         icon = "✅" if r["success"] else "❌"
#         print(f"  요청 #{r['id']}: {r['elapsed']}초 ({r['status']}) {icon}")
#     print(f"  총 소요 시간: {total_time}초")

# if __name__ == "__main__":
#     # 1개부터 8개까지 동시 요청 수를 늘려가며 벤치마크 수행
#     for n in [1, 2, 4, 8]:
#         run_stress_test(n)
#         time.sleep(1) # 서버 안정화를 위한 짧은 휴식


"""
load_test.py: 동시 요청 및 성능 벤치마크 테스트
동시에 10명, 100명이 접속해도 서버가 죽지 않는지, 응답 속도가 너무 느려지지는 않는지 확인하는 곳이다.
실제로 실행 중인 서버(http://localhost:8000)에 진짜 HTTP 요청을 보낸다. 따라서 반드시 서버를 먼저 uvicorn으로 띄워놓아야만 테스트가 가능하다.   
전체 시간이 늘지 않았다는 건 동시에 잘 처리되었다는 뜻이다. (비동기 + ThreadPool 성공)

python scripts/load_test.py 실행
"""

import io
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
from torchvision import datasets

BASE_URL = "http://localhost:8000"
# [장점 포함] 실제 MNIST 데이터를 로드하여 테스트의 신뢰도를 높임
test_dataset = datasets.MNIST(root="data", train=False, download=True)

API_HEADERS = {"X-API-Key": "test-key-001"}


def send_inference_request(i):
    """실제 MNIST 데이터를 추출하여 서버에 추론 요청을 보냅니다."""
    image, _ = test_dataset[i % len(test_dataset)]
    img = image.convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    start_time = time.time()
    try:
        files = {"file": ("test.png", buf, "image/png")}
        resp = requests.post(
            f"{BASE_URL}/predict",
            files=files,
            headers=API_HEADERS,
            timeout=30,
        )
        return {
            "id": i + 1,
            "elapsed": round(time.time() - start_time, 2),
            "status": resp.status_code,
            "prediction": resp.json().get("label") if resp.status_code == 200 else None,
        }
    except Exception as e:
        return {"id": i + 1, "elapsed": 0, "status": f"Error: {str(e)}", "prediction": None}

def run_stress_test(n_requests):
    print(f"\n{'='*50}")
    print(f"  {n_requests}개 동시 요청 테스트 (실제 MNIST 추론)")
    print(f"{'='*50}")

    start = time.time()
    with ThreadPoolExecutor(max_workers=n_requests) as executor:
        futures = [executor.submit(send_inference_request, i) for i in range(n_requests)]
        results = [f.result() for f in as_completed(futures)]
    
    total_time = round(time.time() - start, 2)
    
    # 결과 출력 (기존 코드의 가독성 장점 반영)
    for r in sorted(results, key=lambda x: x["id"]):
        status_icon = "✅" if "200" in str(r["status"]) else "❌"
        print(f"  요청 #{r['id']}: {r['elapsed']}초 (HTTP {r['status']}) {status_icon} 예측: {r['prediction']}")
    
    print(f"{'-'*50}")
    print(f"  전체 소요 시간: {total_time}초")

if __name__ == "__main__":
    # [장점 포함] 헬스체크 선행 확인
    try:
        health = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"✅ 서버 상태: {health.status_code}, 응답: {health.json()}")
    except:
        print("❌ 서버가 실행 중이지 않습니다. uvicorn을 먼저 실행하세요.")
        exit(1)

    # 동시 요청 수를 늘려가며 성능 확인
    for n in [1, 2, 4, 8]:
        run_stress_test(n)
        time.sleep(1)