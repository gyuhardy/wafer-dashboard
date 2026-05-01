"""
datalake.py — datalake 패키지 연동 레이어

실제 배포 시:
  - fetch_wafer_data() 안의 mock 데이터를 제거하고
  - 실제 datalake 패키지 import 후 CSV 추출 코드로 교체하세요.

예시:
  import your_datalake_package as dl
  def fetch_wafer_data():
      csv_path = dl.query("SELECT * FROM wafer_inventory")
      return pd.read_csv(csv_path)
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

STATIONS = ["PHOTO", "ETCH", "CVD", "CMP", "IMP", "DIFF", "META", "TEST"]
BUILDINGS = ["A동", "B동", "C동"]

# 공정 순서 (from → to)
PROCESS_FLOW = [
    ("PHOTO", "ETCH"),
    ("ETCH", "CVD"),
    ("CVD", "CMP"),
    ("CMP", "IMP"),
    ("IMP", "DIFF"),
    ("DIFF", "META"),
    ("META", "TEST"),
]

# 각 스테이션의 건물 이미지 위 좌표 (픽셀 기준, 실제 평면도에 맞게 조정)
STATION_POSITIONS = {
    "PHOTO": {"x": 80,  "y": 60},
    "ETCH":  {"x": 220, "y": 60},
    "CVD":   {"x": 360, "y": 60},
    "CMP":   {"x": 500, "y": 60},
    "IMP":   {"x": 80,  "y": 200},
    "DIFF":  {"x": 220, "y": 200},
    "META":  {"x": 360, "y": 200},
    "TEST":  {"x": 500, "y": 200},
}


def fetch_wafer_data() -> pd.DataFrame:
    """
    [플레이스홀더] 실제 datalake 패키지 연동 전 개발용 Mock 데이터 반환
    실제 컬럼명은 datalake CSV 구조에 맞게 수정 필요
    """
    random.seed(42)
    np.random.seed(42)

    records = []
    for i in range(80):
        station = random.choice(STATIONS)
        pos = STATION_POSITIONS[station]
        days_offset = random.randint(-5, 90)  # 음수 = 이미 폐기 기한 초과
        expiry = datetime.now() + timedelta(days=days_offset)

        # from/to station (공정 흐름에서 현재 스테이션 기준)
        flow_pair = next(
            ((f, t) for f, t in PROCESS_FLOW if f == station),
            (station, None)
        )

        records.append({
            "lot_id":        f"WF-2025-{i+1:03d}",
            "quantity":      random.randint(10, 50),
            "building":      random.choice(BUILDINGS),
            "station":       station,
            "x_pos":         pos["x"],
            "y_pos":         pos["y"],
            "expiry_date":   expiry.strftime("%Y-%m-%d"),
            "from_station":  flow_pair[0],
            "to_station":    flow_pair[1],
            "status":        "정상" if days_offset > 30 else ("주의" if days_offset > 7 else "긴급"),
        })

    return pd.DataFrame(records)
