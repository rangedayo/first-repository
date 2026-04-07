"""
모든 테스트 과정을 터미널에 예쁘게 출력해주는 기반 설정이다.
터미널에 찍히는 2026-04-03 15:03:45 INFO [ml_api] ... 같은 형태의 로그 디자인을 이 파일이 결정한다. 
이 설정이 없다면 우리는 서버가 지금 모델을 로딩 중인지, 요청을 받았는지 눈으로 확인하기가 매우 어려웠을 것.
"""

import logging, sys

def setup_logger(name="ml_api", level="INFO"):
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level))
    if logger.handlers:
        return logger
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)-8s [%(name)s] %(message)s", "%Y-%m-%d %H:%M:%S"))
    logger.addHandler(handler)
    return logger