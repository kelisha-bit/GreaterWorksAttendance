import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'

const toNumber = (v) => Number(v || 0)

export const aggregateMonthly = (contributions) => {
  const byMonth = {}
  contributions.forEach((c) => {
    if (!c.date) return
    const d = new Date(c.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth[key]) byMonth[key] = { month: key, amount: 0, count: 0 }
    byMonth[key].amount += toNumber(c.amount)
    byMonth[key].count += 1
  })
  return Object.values(byMonth)
    .sort((a, b) => new Date(a.month) - new Date(b.month))
    .slice(-12)
}

export const computeFrequency = (contributions) => {
  const now = new Date()
  const startWeek = new Date(now)
  startWeek.setDate(now.getDate() - 7)
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const weeklyCount = contributions.filter((c) => new Date(c.date) >= startWeek).length
  const monthlyCount = contributions.filter((c) => new Date(c.date) >= startMonth).length
  return { weeklyCount, monthlyCount }
}

export const computeMilestones = (totalAmount, totalCount) => {
  const milestones = []
  const amountThresholds = [1000, 5000, 10000, 50000]
  const countThresholds = [10, 25, 50, 100]
  amountThresholds.forEach((t) => {
    if (totalAmount >= t) milestones.push(`Total ≥ GHS ${t.toLocaleString()}`)
  })
  countThresholds.forEach((t) => {
    if (totalCount >= t) milestones.push(`Contributions ≥ ${t}`)
  })
  return milestones
}

export const getPeerStats = (allContributions) => {
  const amounts = allContributions.map((c) => toNumber(c.amount))
  const totalAmount = amounts.reduce((s, x) => s + x, 0)
  const totalCount = allContributions.length
  const averageAmountPerContribution = totalCount > 0 ? totalAmount / totalCount : 0
  const monthly = aggregateMonthly(allContributions)
  const monthlyAvg = monthly.length > 0 ? monthly.reduce((s, m) => s + m.amount, 0) / monthly.length : 0
  return { averageAmountPerContribution, monthlyAverageAmount: monthlyAvg }
}

export const buildSummary = (memberContributions, peerStats) => {
  const amounts = memberContributions.map((c) => toNumber(c.amount))
  const totalAmount = amounts.reduce((s, x) => s + x, 0)
  const totalContributions = memberContributions.length
  const averageAmount = totalContributions > 0 ? totalAmount / totalContributions : 0
  const highestAmount = amounts.length ? Math.max(...amounts) : 0
  const lowestAmount = amounts.length ? Math.min(...amounts) : 0
  const monthly = aggregateMonthly(memberContributions)
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const thisMonth = monthly.find((m) => m.month === monthKey)?.amount || 0
  const frequency = computeFrequency(memberContributions)
  const milestones = computeMilestones(totalAmount, totalContributions)
  const recentHistory = memberContributions
    .slice() 
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)
  const comparison = {
    averageAmountVsPeers: averageAmount - (peerStats?.averageAmountPerContribution || 0),
    monthlyAverageVsPeers: (monthly.length > 0 ? monthly.reduce((s, m) => s + m.amount, 0) / monthly.length : 0) - (peerStats?.monthlyAverageAmount || 0)
  }
  return {
    totals: { totalAmount, totalContributions, averageAmount, highestAmount, lowestAmount, thisMonth },
    frequency,
    trends: monthly,
    milestones,
    recentHistory,
    comparison
  }
}

export const getMemberContributionData = async (memberId) => {
  const memberQ = query(collection(db, 'contributions'), where('memberId', '==', memberId), orderBy('date', 'desc'))
  const memberSnap = await getDocs(memberQ)
  const memberContributions = memberSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  const allSnap = await getDocs(collection(db, 'contributions'))
  const allContributions = allSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  const peerStats = getPeerStats(allContributions)
  return buildSummary(memberContributions, peerStats)
}

