import React, { useState, useEffect, useCallback } from 'react'
import WaferTable    from './components/WaferTable.jsx'
import ExpiryChart   from './components/ExpiryChart.jsx'
import PipelineMap   from './components/PipelineMap.jsx'
import { fetchAllWafers, fetchWaferLocations } from './api/waferApi.js'

export default function App() {
  const [wafers,       setWafers]       = useState([])
  const [locationData, setLocationData] = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [lastUpdated,  setLastUpdated]  = useState(null)
  const [error,        setError]        = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [waferRes, locationRes] = await Promise.all([
        fetchAllWafers(),
        fetchWaferLocations(),
      ])
      setWafers(waferRes)
      setLocationData(locationRes)
      setLastUpdated(new Date())
    } catch (e) {
      setError('데이터를 불러오는 데 실패했습니다. 백엔드 서버를 확인하세요.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // 요약 통계
  const stats = {
    total:   wafers.length,
    urgent:  wafers.filter(w => w.status === '긴급').length,
    warning: wafers.filter(w => w.status === '주의').length,
    qty:     wafers.reduce((s, w) => s + (w.quantity || 0), 0),
  }

  return (
    <div style={layout.root}>
      {/* ── 상단 헤더 ── */}
      <header style={layout.header}>
        <div style={layout.headerLeft}>
          <div style={layout.logo}>◈ WAFER MMS</div>
          <div style={layout.headerSub}>웨이퍼 재고 관리 시스템</div>
        </div>

        {/* KPI 카드 */}
        <div style={layout.kpiRow}>
          {[
            { label: '전체 LOT',   value: stats.total,   color: 'var(--accent-cyan)' },
            { label: '긴급',       value: stats.urgent,  color: 'var(--urgent)',  alert: stats.urgent > 0 },
            { label: '주의',       value: stats.warning, color: 'var(--warning)', alert: stats.warning > 0 },
            { label: '총 웨이퍼',  value: `${stats.qty.toLocaleString()} ea`, color: 'var(--text-primary)' },
          ].map(k => (
            <div key={k.label} style={{ ...layout.kpi, ...(k.alert ? { borderColor: k.color + '40', background: k.color + '0a' } : {}) }}>
              <div style={{ ...layout.kpiValue, color: k.color }}>{loading ? '—' : k.value}</div>
              <div style={layout.kpiLabel}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* 새로고침 */}
        <div style={layout.headerRight}>
          {lastUpdated && (
            <div style={layout.timestamp}>
              {lastUpdated.toLocaleTimeString('ko-KR')} 기준
            </div>
          )}
          <button onClick={loadData} disabled={loading} style={{ ...layout.refreshBtn, opacity: loading ? 0.5 : 1 }}>
            {loading ? '로딩 중...' : '↻ 새로고침'}
          </button>
        </div>
      </header>

      {/* 에러 배너 */}
      {error && (
        <div style={layout.errorBanner}>{error}</div>
      )}

      {/* ── 메인 그리드 ── */}
      <main style={layout.main}>
        {/* 좌: 테이블 (넓게) */}
        <div style={{ ...layout.cell, gridArea: 'table' }}>
          <WaferTable data={wafers} loading={loading} />
        </div>
        {/* 우상: 차트 */}
        <div style={{ ...layout.cell, gridArea: 'chart' }}>
          <ExpiryChart data={wafers} loading={loading} />
        </div>
        {/* 하단 전체: 파이프라인 맵 */}
        <div style={{ ...layout.cell, gridArea: 'pipeline' }}>
          <PipelineMap locationData={locationData} allWafers={wafers} loading={loading} />
        </div>
      </main>
    </div>
  )
}

const layout = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: 'var(--bg-base)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    padding: '12px 24px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-panel)',
    flexShrink: 0,
  },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 },
  logo: { fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600, color: 'var(--accent-cyan)', letterSpacing: '0.1em' },
  headerSub: { fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em' },
  kpiRow: { display: 'flex', gap: 12, flex: 1, justifyContent: 'center' },
  kpi: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '6px 16px',
    textAlign: 'center',
    minWidth: 90,
    transition: 'border-color 0.3s',
  },
  kpiValue: { fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, lineHeight: 1.2 },
  kpiLabel: { fontSize: 10, color: 'var(--text-muted)', marginTop: 2, letterSpacing: '0.04em' },
  headerRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  timestamp: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' },
  refreshBtn: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-bright)',
    color: 'var(--accent-cyan)',
    borderRadius: 4,
    padding: '5px 12px',
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    letterSpacing: '0.03em',
    transition: 'all 0.15s',
  },
  errorBanner: {
    background: 'var(--urgent-bg)',
    borderBottom: '1px solid var(--urgent-border)',
    color: 'var(--urgent)',
    padding: '8px 24px',
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    flexShrink: 0,
  },
  main: {
    flex: 1,
    display: 'grid',
    gridTemplateAreas: `"table chart" "pipeline pipeline"`,
    gridTemplateColumns: '1fr 320px',
    gridTemplateRows: '1fr 1fr',
    gap: 12,
    padding: 12,
    overflow: 'hidden',
    minHeight: 0,
  },
  cell: { minHeight: 0, minWidth: 0, overflow: 'hidden' },
}
