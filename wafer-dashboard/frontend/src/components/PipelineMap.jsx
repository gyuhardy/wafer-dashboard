import React, { useCallback, useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
} from 'reactflow'
import 'reactflow/dist/style.css'

// ── 커스텀 노드: 공정 스테이션 ──────────────────────────────
function WaferNode({ data }) {
  const urgentCount  = data.urgent_count  || 0
  const warningCount = data.warning_count || 0
  const hasAlert = urgentCount > 0 || warningCount > 0

  return (
    <div style={{
      ...nodeStyles.box,
      borderColor: urgentCount > 0 ? '#ef4444' : warningCount > 0 ? '#f59e0b' : '#2e3340',
      boxShadow: urgentCount > 0
        ? '0 0 12px rgba(239,68,68,0.3)'
        : warningCount > 0
        ? '0 0 12px rgba(245,158,11,0.2)'
        : '0 2px 8px rgba(0,0,0,0.4)',
    }}>
      <Handle type="target" position={Position.Left}  style={nodeStyles.handle} />
      <Handle type="source" position={Position.Right} style={nodeStyles.handle} />

      <div style={nodeStyles.stationName}>{data.label}</div>
      <div style={nodeStyles.stats}>
        <span style={nodeStyles.lotCount}>{data.lot_count} LOT</span>
        <span style={nodeStyles.qty}>{data.total_qty} ea</span>
      </div>

      {hasAlert && (
        <div style={nodeStyles.alertRow}>
          {urgentCount > 0 && (
            <span style={{ ...nodeStyles.alertBadge, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
              긴급 {urgentCount}
            </span>
          )}
          {warningCount > 0 && (
            <span style={{ ...nodeStyles.alertBadge, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
              주의 {warningCount}
            </span>
          )}
        </div>
      )}

      {/* 펄스 애니메이션 (긴급 시) */}
      {urgentCount > 0 && <div style={nodeStyles.pulse} />}
    </div>
  )
}

const nodeTypes = { waferNode: WaferNode }

// ── 메인 컴포넌트 ────────────────────────────────────────────
export default function PipelineMap({ locationData, allWafers, loading }) {
  // 노드에 긴급/주의 카운트 주입
  const enrichedNodes = useMemo(() => {
    if (!locationData?.nodes) return []
    return locationData.nodes.map(node => {
      const lotsHere = (allWafers || []).filter(w => w.station === node.id)
      return {
        ...node,
        type: 'waferNode',
        data: {
          ...node.data,
          urgent_count:  lotsHere.filter(w => w.status === '긴급').length,
          warning_count: lotsHere.filter(w => w.status === '주의').length,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      }
    })
  }, [locationData, allWafers])

  const enrichedEdges = useMemo(() => {
    if (!locationData?.edges) return []
    return locationData.edges.map(e => ({
      ...e,
      style: { stroke: '#3b82f6', strokeWidth: 1.5, opacity: 0.7 },
      markerEnd: { type: 'arrowclosed', color: '#3b82f6' },
    }))
  }, [locationData])

  const [nodes, , onNodesChange] = useNodesState(enrichedNodes)
  const [edges, , onEdgesChange] = useEdgesState(enrichedEdges)

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>공정 파이프라인 맵</div>
        <div style={styles.subtitle}>실시간 웨이퍼 위치 및 이동 흐름</div>
        <div style={styles.legend}>
          {[['긴급','#ef4444'],['주의','#f59e0b'],['정상','#10b981']].map(([l,c]) => (
            <span key={l} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'var(--text-secondary)' }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:c }} />
              {l}
            </span>
          ))}
        </div>
      </div>

      <div style={styles.mapArea}>
        {loading ? (
          <div style={styles.loading}>파이프라인 데이터 로딩 중...</div>
        ) : (
          <>
            {/* 건물 평면도 배경 (실제 이미지로 교체) */}
            <div style={styles.buildingBg}>
              <FloorPlanPlaceholder />
            </div>

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              minZoom={0.4}
              maxZoom={2}
              style={{ background: 'transparent' }}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#1c2028" gap={24} size={1} />
              <Controls style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6 }} />
              <MiniMap
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                nodeColor={n => n.data?.urgent_count > 0 ? '#ef4444' : n.data?.warning_count > 0 ? '#f59e0b' : '#3b82f6'}
                maskColor="rgba(10,12,16,0.7)"
              />
            </ReactFlow>
          </>
        )}
      </div>

      <style>{pulseKeyframe}</style>
    </div>
  )
}

// 건물 평면도 플레이스홀더 SVG
function FloorPlanPlaceholder() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 700 300" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.12 }}>
      <rect x="20"  y="20"  width="200" height="260" rx="4" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="6 3" />
      <rect x="250" y="20"  width="200" height="260" rx="4" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="6 3" />
      <rect x="480" y="20"  width="200" height="260" rx="4" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="6 3" />
      <text x="120" y="14"  textAnchor="middle" fill="#3b82f6" fontSize="11" fontFamily="IBM Plex Mono">A동</text>
      <text x="350" y="14"  textAnchor="middle" fill="#3b82f6" fontSize="11" fontFamily="IBM Plex Mono">B동</text>
      <text x="580" y="14"  textAnchor="middle" fill="#3b82f6" fontSize="11" fontFamily="IBM Plex Mono">C동</text>
      {/* 복도 */}
      <rect x="220" y="100" width="30"  height="100" fill="#1c2028" />
      <rect x="450" y="100" width="30"  height="100" fill="#1c2028" />
      <text x="350" y="295" textAnchor="middle" fill="#3b82f6" fontSize="9" fontFamily="IBM Plex Mono" opacity="0.5">
        실제 평면도 이미지로 교체하세요 (건물 배경)
      </text>
    </svg>
  )
}

const pulseKeyframe = `
@keyframes pulse-ring {
  0%   { transform: scale(1);   opacity: 0.6; }
  100% { transform: scale(1.8); opacity: 0; }
}
`

const nodeStyles = {
  box: {
    background: 'var(--bg-card)',
    border: '1px solid',
    borderRadius: 8,
    padding: '10px 14px',
    minWidth: 110,
    position: 'relative',
    cursor: 'default',
  },
  handle:      { background: '#3b82f6', width: 8, height: 8, border: '2px solid var(--bg-base)' },
  stationName: { fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.05em', marginBottom: 4 },
  stats:       { display: 'flex', gap: 8, alignItems: 'baseline' },
  lotCount:    { fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--accent-cyan)' },
  qty:         { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' },
  alertRow:    { display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  alertBadge:  { fontSize: 9, padding: '1px 5px', borderRadius: 3, fontFamily: 'var(--font-mono)', fontWeight: 600 },
  pulse: {
    position: 'absolute',
    top: -4, right: -4,
    width: 10, height: 10,
    borderRadius: '50%',
    background: '#ef4444',
    animation: 'pulse-ring 1.2s ease-out infinite',
  },
}

const styles = {
  container:   { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' },
  header:      { display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 },
  title:       { fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, letterSpacing: '0.05em' },
  subtitle:    { fontSize: 11, color: 'var(--text-muted)' },
  legend:      { display: 'flex', gap: 12, marginLeft: 'auto' },
  mapArea:     { flex: 1, position: 'relative', overflow: 'hidden' },
  buildingBg:  { position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' },
  loading:     { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 },
}
