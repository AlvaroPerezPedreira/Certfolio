const monthFormatter = new Intl.DateTimeFormat('en', {
  month: 'long',
  year: 'numeric',
})

export function sortCertsByCompletedAt(certs) {
  return [...certs].sort((left, right) =>
    right.completedAt.localeCompare(left.completedAt),
  )
}

export function formatCompletedAt(completedAt) {
  if (!completedAt || !/^\d{4}-\d{2}$/.test(completedAt)) {
    return completedAt ?? ''
  }

  const [year, month] = completedAt.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, 1))

  return monthFormatter.format(date)
}

export function groupPublicCertsByProvider(certs) {
  const groups = new Map()

  certs.forEach((cert) => {
    const key = cert.providerSlug || cert.provider || 'unknown'

    if (!groups.has(key)) {
      groups.set(key, {
        providerSlug: key,
        providerLabel: cert.provider || key,
        certs: [],
      })
    }

    groups.get(key).certs.push(cert)
  })

  return [...groups.values()]
    .map((group) => ({
      ...group,
      certs: sortCertsByCompletedAt(group.certs),
    }))
    .sort((left, right) => left.providerLabel.localeCompare(right.providerLabel))
}