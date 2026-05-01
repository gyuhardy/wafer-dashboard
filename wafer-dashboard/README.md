# 웨이퍼 재고 관리 대시보드

사내 datalake 기반 웨이퍼 보유현황 및 공정 파이프라인 시각화 대시보드

---

## 프로젝트 구조

```
wafer-dashboard/
├── backend/
│   ├── main.py          # FastAPI 앱 (API 엔드포인트)
│   ├── datalake.py      # datalake 연동 레이어 (여기서 실제 패키지 교체)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx                      # 메인 레이아웃
│   │   ├── components/
│   │   │   ├── WaferTable.jsx           # 보유현황 테이블 (D-day 하이라이트)
│   │   │   ├── ExpiryChart.jsx          # 폐기 기한 분포 차트
│   │   │   └── PipelineMap.jsx          # 공정 파이프라인 맵 (React Flow)
│   │   └── api/waferApi.js              # API 호출 함수
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── nginx/
    └── nginx.conf                       # 사내 서버 배포용 nginx 설정
```

---

## 개발 환경 실행

### 1. 백엔드

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. 프론트엔드

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
```

---

## datalake 패키지 연동 방법

`backend/datalake.py`의 `fetch_wafer_data()` 함수를 수정하세요:

```python
# 현재: Mock 데이터 반환
# 교체: 실제 datalake 패키지 사용

import your_datalake_package as dl

def fetch_wafer_data():
    csv_path = dl.query("wafer_inventory_table")
    df = pd.read_csv(csv_path)

    # 컬럼명 매핑 (실제 CSV 컬럼에 맞게 수정)
    df = df.rename(columns={
        "실제컬럼_lot":      "lot_id",
        "실제컬럼_수량":     "quantity",
        "실제컬럼_건물":     "building",
        "실제컬럼_스테이션": "station",
        "실제컬럼_폐기일":   "expiry_date",
        "실제컬럼_x좌표":    "x_pos",
        "실제컬럼_y좌표":    "y_pos",
    })
    return df
```

---

## 건물 평면도 이미지 교체

`PipelineMap.jsx`의 `FloorPlanPlaceholder` 컴포넌트를 실제 이미지로 교체:

```jsx
// 현재: SVG 플레이스홀더
// 교체:
function FloorPlanPlaceholder() {
  return <img src="/floor-plan.png" style={{ width:'100%', height:'100%', objectFit:'contain', opacity:0.15 }} />
}
// 이미지 파일은 frontend/public/ 에 넣으세요
```

각 공정 스테이션의 x_pos, y_pos 좌표를 평면도 픽셀 좌표에 맞게 조정하세요.

---

## 사내 서버 배포

```bash
# 1. 프론트엔드 빌드
cd frontend && npm run build

# 2. 빌드 결과물 복사
cp -r dist/* /var/www/wafer-dashboard/

# 3. nginx 설정 복사 및 재시작
cp nginx/nginx.conf /etc/nginx/conf.d/wafer.conf
nginx -s reload

# 4. 백엔드 서비스 등록 (systemd)
uvicorn main:app --host 127.0.0.1 --port 8000
```

빌드 이후 외부 인터넷 연결 불필요 — 완전 사내 네트워크 독립 구동.

---

## API 엔드포인트

| 메서드 | URL | 설명 |
|---|---|---|
| GET | `/api/wafers` | 전체 웨이퍼 보유현황 |
| GET | `/api/wafers/expiring?days=30` | 폐기 임박 목록 |
| GET | `/api/wafers/location` | 공정별 위치 및 흐름 (React Flow용) |
