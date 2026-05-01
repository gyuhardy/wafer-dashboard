# 웨이퍼 재고 관리 대시보드 개발

## 프로젝트 개요
사내 datalake에서 Python 패키지로 CSV를 추출하여
웨이퍼 보유현황과 위치를 시각화하는 사내 전용 웹 대시보드.
외부 인터넷 없이 사내 서버에서 완전히 독립 구동되어야 함.

## 기술 스택
- Backend: FastAPI (Python)
- Frontend: React + Recharts + React Flow
- 배포: nginx + uvicorn (사내 서버, 완전 오프라인)
- 모든 라이브러리는 npm/pip으로 번들에 포함 (CDN 사용 금지)

## 백엔드 요구사항
- datalake 쿼리는 `[패키지명]` 으로 CSV 추출
- CSV 추출 및 가공은 pandas 사용
- 사용자 요청 시점에 on-demand로 데이터 fetch (스케줄러 불필요)
- 아래 3개 엔드포인트 구현:
  - GET /api/wafers          → 전체 웨이퍼 보유현황
  - GET /api/wafers/expiring → 폐기 임박 목록 (D-30 이내)
  - GET /api/wafers/location → 건물별 위치 + 이동 흐름 데이터

## 프론트엔드 요구사항

### 1. 보유현황 테이블
- 전체 웨이퍼 lot 목록 표시
- 폐기 임박 행 하이라이트:
  - D-7 이내: 빨간색
  - D-30 이내: 노란색
  - 정상: 흰색

### 2. 파이프라인 시각화
- 건물 평면도 이미지를 배경으로 사용
- 그 위에 SVG 레이어로 React Flow 오버레이
- 각 공정 스테이션을 노드로 표시
- 웨이퍼 이동 경로를 엣지(연결선)로 표시
- 흐르는 애니메이션 효과 적용 (React Flow animated edge)
- 노드 클릭 시 해당 위치의 웨이퍼 lot 상세 정보 표시

## 데이터 구조 (예시 - 실제 컬럼명 미정)
백엔드는 아래 구조의 JSON을 반환하도록 설계:

// 보유현황
{
  "lot_id": "WF-2024-001",
  "quantity": 25,
  "location": "Building-A",
  "station": "CVD",
  "expiry_date": "2025-05-15",
  "days_until_expiry": 14
}

// 위치/흐름
{
  "nodes": [
    { "id": "CVD", "label": "CVD 공정", "x": 120, "y": 80 }
  ],
  "edges": [
    { "source": "CVD", "target": "CMP", "animated": true }
  ]
}

## 프로젝트 구조
wafer-dashboard/
├── backend/
│   ├── main.py          # FastAPI 앱
│   ├── datalake.py      # datalake 패키지 연동 레이어
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── WaferTable.jsx      # 보유현황 테이블
│   │   │   ├── ExpiryBadge.jsx     # D-day 하이라이트
│   │   │   └── PipelineMap.jsx     # 파이프라인 시각화
│   │   └── api/
│   │       └── waferApi.js         # FastAPI 호출 함수
│   └── package.json
└── nginx/
    └── nginx.conf

## 기타 요구사항
- datalake 패키지명과 실제 CSV 컬럼명은 플레이스홀더로 처리
- 건물 평면도 이미지는 플레이스홀더 이미지로 대체
- 소규모 사내 부서용이므로 인증/로그인 기능은 제외
- 한국어 UI

***

**바로 실행해보려면:**
```bash
# 백엔드 먼저
cd wafer-dashboard/backend
pip install -r requirements.txt
uvicorn main:app --reload
```

```bash
# 프론트엔드 (별도 터미널)
cd wafer-dashboard/frontend
npm install
npm run dev
```

그 다음 브라우저에서 `http://localhost:5173` 열면 Mock 데이터로 대시보드 확인할 수 있어요.

혹시 실행 중 오류가 나거나, datalake 패키지 연동 작업 바로 시작할 거라면 알려줘요.