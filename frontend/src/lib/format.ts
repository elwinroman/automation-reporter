/** Format seconds to human-readable string (e.g. "2m 30s", "1h 5m") */
export function formatTime(seconds: number): string {
  if (seconds < 0) return '0s'
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  const hours = Math.floor(mins / 60)
  const remainMins = mins % 60
  return remainMins > 0 ? `${hours}h ${remainMins}m` : `${hours}h`
}

/** Format pass rate with color hint */
export function formatPassRate(rate: number): string {
  return `${rate.toFixed(1)}%`
}

export type RateTone = 'good' | 'warning' | 'critical'

export function passRateTone(rate: number): RateTone {
  if (rate >= 90) return 'good'
  if (rate >= 70) return 'warning'
  return 'critical'
}

/** Get color class for a pass rate value */
export function passRateColor(rate: number): 'green' | 'yellow' | 'red' {
  const tone = passRateTone(rate)
  if (tone === 'good') return 'green'
  if (tone === 'warning') return 'yellow'
  return 'red'
}

export function overallHealthStatus(passRate: number, failedCount: number): {
  label: 'Saludable' | 'Atencion' | 'Critico'
  tone: RateTone
} {
  if (passRate >= 90 && failedCount <= 5) {
    return { label: 'Saludable', tone: 'good' }
  }
  if (passRate >= 75 && failedCount <= 12) {
    return { label: 'Atencion', tone: 'warning' }
  }
  return { label: 'Critico', tone: 'critical' }
}

/** Format large numbers with locale separators */
export function formatNumber(n: number): string {
  return n.toLocaleString()
}
