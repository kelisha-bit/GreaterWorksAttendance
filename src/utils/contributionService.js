import { db } from '../config/firebase'
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore'

export const computeContributionSummary = (memberContributions = [], allContributions = []) => {
  const amounts = memberContributions.map(c => Number(c.amount || 0))
  const totalAmount = amounts.reduce((s, a) => s + a, 0)
  const totalContributions = memberContributions.length
  const averageAmount = totalContributions > 0 ? totalAmount / totalContributions : 0
  const highestAmount = amounts.length ? Math.max(...amounts) : 0
  const lowestAmount = amounts.length ? Math.min(...amounts) : 0

  const now = new Date()
  const thisMonthAmount = memberContributions
    .filter(c => {
      const d = new Date(c.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((s, c) => s + Number(c.amount || 0), 0)

  const monthlyTotals = {}
  const monthlyCounts = {}
  memberContributions.forEach(c => {
    const d = new Date(c.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyTotals[key] = (monthlyTotals[key] || 0) + Number(c.amount || 0)
    monthlyCounts[key] = (monthlyCounts[key] || 0) + 1
  })
  const monthKeys = Object.keys(monthlyTotals)
  const monthlyAverage = monthKeys.length ? Object.values(monthlyTotals).reduce((s, v) => s + v, 0) / monthKeys.length : 0
  const amountTrends = Object.keys(monthlyTotals)
    .sort((a, b) => new Date(a + '-01') - new Date(b + '-01'))
    .map(k => ({ month: k, amount: monthlyTotals[k], count: monthlyCounts[k] }))

  const frequencyStats = {
    perMonth: monthlyCounts,
    avgPerMonth: monthKeys.length ? Object.values(monthlyCounts).reduce((s, v) => s + v, 0) / monthKeys.length : 0,
    perWeekApprox: totalContributions ? +(totalContributions / (memberContributions.length ? Math.max(1, (new Date(memberContributions[memberContributions.length - 1].date) - new Date(memberContributions[0].date)) / (1000 * 60 * 60 * 24 * 7)) : 1)).toFixed(2) : 0
  }

  const recentHistory = memberContributions.slice(0, 10).map(c => ({ id: c.id, date: c.date, type: c.type || 'General', amount: Number(c.amount || 0) }))

  const peerAvg = (() => {
    if (!allContributions?.length) return { perContribution: 0, perMonth: 0 }
    const peerAmounts = allContributions.map(c => Number(c.amount || 0))
    const perContribution = peerAmounts.length ? peerAmounts.reduce((s, v) => s + v, 0) / peerAmounts.length : 0
    const peerMonthly = {}
    allContributions.forEach(c => {
      const d = new Date(c.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      peerMonthly[key] = (peerMonthly[key] || 0) + Number(c.amount || 0)
    })
    const perMonth = Object.keys(peerMonthly).length ? Object.values(peerMonthly).reduce((s, v) => s + v, 0) / Object.keys(peerMonthly).length : 0
    return { perContribution, perMonth }
  })()

  const milestones = []
  if (totalAmount >= 1000) milestones.push({ key: '1k_total', label: 'GH₵1,000 total' })
  if (totalAmount >= 5000) milestones.push({ key: '5k_total', label: 'GH₵5,000 total' })
  if (thisMonthAmount >= 500) milestones.push({ key: '500_month', label: 'GH₵500 this month' })
  if (highestAmount >= 1000) milestones.push({ key: '1k_single', label: 'GH₵1,000 single gift' })

  return {
    totalAmount,
    totalContributions,
    averageAmount,
    highestAmount,
    lowestAmount,
    thisMonthAmount,
    monthlyAverage,
    amountTrends,
    frequencyStats,
    recentHistory,
    peerAverage: peerAvg,
    milestones
  }
}

export const listenMemberContributionSummary = async (memberId, onUpdate) => {
  const memberQ = query(collection(db, 'contributions'), where('memberId', '==', memberId), orderBy('date', 'desc'))
  const allSnap = await getDocs(query(collection(db, 'contributions'), orderBy('date', 'desc')))
  const all = allSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  const unsub = onSnapshot(memberQ, snap => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    const summary = computeContributionSummary(list, all)
    onUpdate(summary)
  })
  return unsub
}

