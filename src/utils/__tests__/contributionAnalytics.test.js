import { describe, it, expect } from 'vitest'
import { aggregateMonthly, computeFrequency, computeMilestones, buildSummary, getPeerStats } from '../contributionAnalytics'

const sample = [
  { id: 'a', date: '2025-01-05', amount: 100, type: 'Offering' },
  { id: 'b', date: '2025-01-20', amount: 200, type: 'Tithe' },
  { id: 'c', date: '2025-02-03', amount: 150, type: 'Offering' },
  { id: 'd', date: '2025-02-17', amount: 250, type: 'Special' },
  { id: 'e', date: '2025-03-01', amount: 300, type: 'Tithe' }
]

describe('contributionAnalytics', () => {
  it('aggregates monthly totals and counts', () => {
    const monthly = aggregateMonthly(sample)
    expect(monthly.length).toBeGreaterThan(0)
    const jan = monthly.find(m => m.month === '2025-01')
    expect(jan.amount).toBe(300)
    expect(jan.count).toBe(2)
  })

  it('computes frequency stats', () => {
    const freq = computeFrequency(sample)
    expect(typeof freq.weeklyCount).toBe('number')
    expect(typeof freq.monthlyCount).toBe('number')
  })

  it('computes milestones', () => {
    const total = sample.reduce((s, c) => s + c.amount, 0)
    const ms = computeMilestones(total, sample.length)
    expect(Array.isArray(ms)).toBe(true)
  })

  it('builds summary with peer comparison', () => {
    const peers = getPeerStats(sample)
    const summary = buildSummary(sample, peers)
    expect(summary.totals.totalContributions).toBe(sample.length)
    expect(summary.trends.length).toBeGreaterThan(0)
    expect(summary.recentHistory.length).toBeLessThanOrEqual(10)
    expect(summary.comparison).toHaveProperty('averageAmountVsPeers')
  })
})

