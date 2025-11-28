import { describe, it, expect } from 'vitest'
import { computeContributionSummary } from '../contributionService'

const make = (i) => ({ id: String(i), date: `2025-${String((i % 12) + 1).padStart(2,'0')}-01`, amount: (i % 100) + 1, type: 'Offering' })

describe('performance', () => {
  it('computes summary under threshold for large dataset', () => {
    const big = Array.from({ length: 5000 }, (_, i) => make(i))
    const peers = Array.from({ length: 3000 }, (_, i) => make(i + 1))
    const t0 = performance.now()
    const summary = computeContributionSummary(big, peers)
    const t1 = performance.now()
    expect(summary.totalContributions).toBe(5000)
    expect(t1 - t0).toBeLessThan(500)
  })
})

