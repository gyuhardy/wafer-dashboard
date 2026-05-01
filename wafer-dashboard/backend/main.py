from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import pandas as pd
from datalake import fetch_wafer_data  # 실제 datalake 패키지로 교체

app = FastAPI(title="Wafer Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 사내 배포 시 실제 도메인으로 제한
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_wafer_df() -> pd.DataFrame:
    """datalake에서 CSV 추출 후 DataFrame 반환"""
    df = fetch_wafer_data()  # datalake.py의 함수 호출
    df["expiry_date"] = pd.to_datetime(df["expiry_date"])
    df["days_until_expiry"] = (df["expiry_date"] - datetime.now()).dt.days
    return df


@app.get("/api/wafers")
def get_all_wafers():
    """전체 웨이퍼 보유현황"""
    try:
        df = load_wafer_df()
        return df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/wafers/expiring")
def get_expiring_wafers(days: int = 30):
    """폐기 임박 웨이퍼 목록 (기본 D-30 이내)"""
    try:
        df = load_wafer_df()
        expiring = df[df["days_until_expiry"] <= days].sort_values("days_until_expiry")
        return expiring.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/wafers/location")
def get_wafer_locations():
    """건물/공정별 위치 및 흐름 데이터 (React Flow용)"""
    try:
        df = load_wafer_df()

        # 공정 스테이션별 집계
        station_counts = df.groupby(["station", "x_pos", "y_pos"]).agg(
            lot_count=("lot_id", "count"),
            total_qty=("quantity", "sum"),
        ).reset_index()

        nodes = [
            {
                "id": row["station"],
                "data": {
                    "label": row["station"],
                    "lot_count": int(row["lot_count"]),
                    "total_qty": int(row["total_qty"]),
                },
                "position": {"x": float(row["x_pos"]), "y": float(row["y_pos"])},
                "type": "waferNode",
            }
            for _, row in station_counts.iterrows()
        ]

        # 공정 순서 기반 엣지 생성
        process_order = df[["from_station", "to_station"]].dropna().drop_duplicates()
        edges = [
            {
                "id": f"{row['from_station']}-{row['to_station']}",
                "source": row["from_station"],
                "target": row["to_station"],
                "animated": True,
                "type": "smoothstep",
            }
            for _, row in process_order.iterrows()
        ]

        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
