import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 6, padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--accent-cyan)' }}>{payload[0].value} LOT</div>
    </div>
  )
}

export default function ExpiryChart({ data, loading }) {
  // 잔여일 구간별 집계
  const buckets = [
    { label: '초과',   min: -Infinity, max: 0,  color: '#7f1d1d' },
    { label: 'D-7',   min: 0,         max: 7,   color: '#ef4444' },
    { label: 'D-14',  min: 7,         max: 14,  color: '#f97316' },
    { label: 'D-30',  min: 14,        max: 30,  color: '#f59e0b' },
    { label: 'D-60',  min: 30,        max: 60,  color: '#3b82f6' },
    { label: 'D-60+', min: 60,        max: Infinity, color: '#10b981' },
  ]

  const chartData = buckets.map(b => ({
    label: b.label,
    count: (data || []).filter(w => w.days_until_expiry >= b.min && w.days_until_expiry < b.max).length,
    color: b.color,
  }))

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>폐기 기한 분포</div>
        <div style={styles.subtitle}>구간별 LOT 수</div>
      </div>
      <div style={{ flex: 1, padding: '8px 8px 12px' }}>
        {loading ? (
          <div style={styles.loading}>로딩 중...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={40}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' },
  header:    { padding: '14px 18px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 },
  title:     { fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' },
  subtitle:  { fontSize: 11, color: 'var(--text-muted)', marginTop: 2 },
  loading:   { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 },
}
