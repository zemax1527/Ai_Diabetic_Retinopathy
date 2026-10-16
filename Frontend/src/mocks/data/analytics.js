/**
 * Mock Analytics Data — DEMO DATA ONLY
 * Aggregated only. No patient names, IDs, or images.
 */

function dailySeries(startDate, days, base, variance) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    return {
      date: d.toISOString().slice(0, 10),
      value: Math.max(0, base + Math.round((Math.random() - 0.5) * variance)),
    }
  })
}

export const MOCK_ANALYTICS = {
  overview: {
    totalScreenings: 312,
    abnormalScreenings: 187,
    referrals: 48,
    qualityFailureRate: 0.08,
    volumeSeries: dailySeries('2026-07-04', 90, 3, 4),
    severityDistribution: [
      { label: 'No DR',        count: 125 },
      { label: 'Mild',         count: 89  },
      { label: 'Moderate',     count: 54  },
      { label: 'Severe',       count: 31  },
      { label: 'Proliferative',count: 13  },
    ],
    statusFunnel: [
      { label: 'Screened',  count: 312 },
      { label: 'Reviewed',  count: 280 },
      { label: 'Triaged',   count: 265 },
      { label: 'Referred',  count: 48  },
    ],
  },
  districts: [
    {
      district: 'Chandanpur',
      screenings: 98,
      abnormalPct: 61,
      referrals: 15,
      avgTimeToReviewHrs: 18,
      trend: dailySeries('2026-07-04', 90, 1, 2),
    },
    {
      district: 'Nayagaon',
      screenings: 84,
      abnormalPct: 58,
      referrals: 12,
      avgTimeToReviewHrs: 22,
      trend: dailySeries('2026-07-04', 90, 1, 2),
    },
    {
      district: 'Devgaon',
      screenings: 76,
      abnormalPct: 55,
      referrals: 11,
      avgTimeToReviewHrs: 24,
      trend: dailySeries('2026-07-04', 90, 1, 2),
    },
    {
      district: 'Saidpur',
      screenings: 54,
      abnormalPct: 63,
      referrals: 10,
      avgTimeToReviewHrs: 30,
      trend: dailySeries('2026-07-04', 90, 1, 1),
    },
  ],
  centerActivity: [
    { center: 'PHC Rampur',     district: 'Chandanpur', screenings: 42, workers: 2 },
    { center: 'PHC Khajuri',    district: 'Chandanpur', screenings: 56, workers: 2 },
    { center: 'PHC Bankhedi',   district: 'Nayagaon',   screenings: 38, workers: 1 },
    { center: 'PHC Sihora',     district: 'Nayagaon',   screenings: 46, workers: 2 },
    { center: 'PHC Pipariya',   district: 'Devgaon',    screenings: 31, workers: 1 },
    { center: 'PHC Gotegaon',   district: 'Devgaon',    screenings: 45, workers: 2 },
    { center: 'PHC Kareli',     district: 'Saidpur',    screenings: 28, workers: 1 },
    { center: 'PHC Gadarwara',  district: 'Saidpur',    screenings: 26, workers: 1 },
  ],
}
