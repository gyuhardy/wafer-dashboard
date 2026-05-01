import React, { useState } from 'react'

const STATUS_CONFIG = {
  긴급: { color: 'var(--urgent)',  bg: 'var(--urgent-bg)',  border: 'var(--urgent-border)',  dot: '#ef4444' },
  주의: { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning-border)', dot: '#f59e0b' },
  정상: { color: 'var(--ok)',      bg: 'var(--ok-bg)',      border: 'transparent',           dot: '#10b981' },
}

export default function WaferTable({ data, loading }) {
  const [sortField, setSortField] = useState('days_until_expiry')
  const [sortDir, setSortDir]     = useState('asc')
  const [filter, setFilter]       = useState('전체')

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const filtered = (data || [])
    .filter(w => filter === '전체' || w.status === filter)
    .sort((a, b) => {
      const av = a[sortField], bv = b[sortField]
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })

  const counts = {
    전체: (data || []).length,
    긴급: (data || []).filter(w => w.status === '긴급').length,
    주의: (data || []).filter(w => w.status === '주의').length,
    정상: (data || []).filter(w => w.status === '정상').length,
  }

  const SortIcon = ({ field }) => (
    <span style={{ opacity: sortField === field ? 1 : 0.3, fontSize: 10, marginLeft: 4 }}>
      {sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  )

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <div>
          <div style={styles.title}>웨이퍼 보유현황</div>
          <div style={styles.subtitle}>총 {counts['전체']}개 LOT</div>
        </div>
        {/* 필터 탭 */}
        <div style={styles.filterRow}>
          {['전체','긴급','주의','정상'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{
                ...styles.filterBtn,
                ...(filter === s ? { ...styles.filterBtnActive, color: STATUS_CONFIG[s]?.color || 'var(--accent-cyan)', borderColor: STATUS_CONFIG[s]?.color || 'var(--accent-cyan)' } : {})
              }}>
              {s !== '전체' && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_CONFIG[s].dot, display: 'inline-block', marginRight: 5 }} />
              )}
              {s} {counts[s]}
            </button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <div style={styles.tableWrapper}>
        {loading ? (
          <div style={styles.loadingRow}>데이터 로딩 중...</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                {[
                  ['lot_id',           'LOT ID'],
                  ['station',          '공정 스테이션'],
                  ['building',         '건물'],
                  ['quantity',         '수량'],
                  ['expiry_date',      '폐기 기한'],
                  ['days_until_expiry','잔여일'],
                  ['status',           '상태'],
                ].map(([field, label]) => (
                  <th key={field} style={styles.th} onClick={() => toggleSort(field)}>
                    {label}<SortIcon field={field} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((w, i) => {
                const cfg = STATUS_CONFIG[w.status] || STATUS_CONFIG['정상']
                return (
                  <tr key={w.lot_id} style={{
                    ...styles.tr,
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    ...(w.status !== '정상' ? { background: cfg.bg, borderLeft: `2px solid ${cfg.border}` } : {}),
                  }}>
                    <td style={{ ...styles.td, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-cyan)' }}>{w.lot_id}</td>
                    <td style={styles.td}>{w.station}</td>
                    <td style={styles.td}>{w.building}</td>
                    <td style={{ ...styles.td, fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{w.quantity}</td>
                    <td style={{ ...styles.td, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{w.expiry_date}</td>
                    <td style={{ ...styles.td, fontFamily: 'var(--font-mono)', textAlign: 'right', color: cfg.color, fontWeight: 600 }}>
                      {w.days_until_expiry < 0 ? `+${Math.abs(w.days_until_expiry)}일 초과` : `D-${w.days_until_expiry}`}
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, color: cfg.color, border: `1px solid ${cfg.border || cfg.color + '40'}`, background: cfg.bg }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, display: 'inline-block', marginRight: 5 }} />
                        {w.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const styles = {
  container:    { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' },
  header:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 },
  title:        { fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-primary)' },
  subtitle:     { fontSize: 11, color: 'var(--text-muted)', marginTop: 2 },
  filterRow:    { display: 'flex', gap: 6 },
  filterBtn:    { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', transition: 'all 0.15s' },
  filterBtnActive: { background: 'rgba(255,255,255,0.04)' },
  tableWrapper: { overflow: 'auto', flex: 1 },
  table:        { width: '100%', borderCollapse: 'collapse' },
  thead:        { position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 },
  th:           { padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.06em', cursor: 'pointer', userSelect: 'none', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' },
  tr:           { borderLeft: '2px solid transparent', transition: 'background 0.1s' },
  td:           { padding: '9px 16px', fontSize: 12, color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.03)', whiteSpace: 'nowrap' },
  badge:        { display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 3, fontSize: 11, fontWeight: 500 },
  loadingRow:   { padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 },
}
