import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(20,14,8,0.92)',
      border: '1px solid rgba(245,158,11,0.3)',
      borderRadius: '10px',
      padding: '0.65rem 0.875rem',
      fontSize: '0.78rem',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontWeight: 700, color: '#fbbf24' }}>
        {payload[0].value} completed
      </div>
    </div>
  )
}

// Warm chart colors matching the reference image
const COLORS = {
  completed: '#f59e0b',
  fill1:     '#ea580c',
  fill2:     '#f59e0b',
}

export default function GrowthChart({ analytics }) {
  if (!analytics) return null
  const { series, summary } = analytics

  const data = series.map((d) => ({
    ...d,
    label: new Date(`${d.date}T12:00:00`).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
  }))

  return (
    <div className="chart-wrapper">
        <div className="chart-header">
          <div>
            <div className="chart-title">Activity</div>
            <div className="chart-subtitle">Last 30 days</div>
          </div>
          <div className="chart-stats">
            <div>
              <div className="chart-stat-value warm">{summary.totalCompleted}</div>
              <div className="chart-stat-label">Completions</div>
            </div>
            <div>
              <div className="chart-stat-value gold">{summary.averageRate}%</div>
              <div className="chart-stat-label">Avg rate</div>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -36, bottom: 0 }}>
            <defs>
              <linearGradient id="warmGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#f59e0b" stopOpacity={0.55} />
                <stop offset="50%"  stopColor="#ea580c" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#ea580c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'Inter' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'Inter' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#warmGrad)"
              dot={false}
              activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend like the reference image */}
        <div className="hormone-legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#f59e0b' }} />
            Completions
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#ea580c' }} />
            Trend
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#eab308' }} />
            Rate %
          </div>
      </div>
    </div>
  )
}
