const VALID_COMPLETED_AT_PATTERN = /^\d{4}-\d{2}$/

export function slugifyProvider(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function validateCertInput(values) {
  const errors = {}

  if (!values.title.trim()) {
    errors.title = 'Title is required.'
  }

  if (!values.provider.trim()) {
    errors.provider = 'Provider is required.'
  }

  if (!values.providerSlug.trim()) {
    errors.providerSlug = 'Provider slug is required.'
  }

  if (!values.completedAt.trim()) {
    errors.completedAt = 'Completion month is required.'
  } else if (!VALID_COMPLETED_AT_PATTERN.test(values.completedAt)) {
    errors.completedAt = 'Use YYYY-MM format.'
  } else {
    const [year, month] = values.completedAt.split('-').map(Number)
    const currentDate = new Date()
    const maxValue = currentDate.getFullYear() * 100 + (currentDate.getMonth() + 1)
    const inputValue = year * 100 + month

    if (month < 1 || month > 12) {
      errors.completedAt = 'Choose a real calendar month.'
    } else if (inputValue > maxValue) {
      errors.completedAt = 'Completion month cannot be in the future.'
    }
  }

  if (values.externalUrl.trim()) {
    try {
      const parsedUrl = new URL(values.externalUrl)

      if (parsedUrl.protocol !== 'https:') {
        errors.externalUrl = 'External URL must start with https://'
      }
    } catch {
      errors.externalUrl = 'External URL must be a valid full https:// URL.'
    }
  }

  return errors
}

export function getInitialCertValues(cert) {
  if (!cert) {
    return {
      title: '',
      provider: '',
      providerSlug: '',
      completedAt: '',
      issuer: '',
      description: '',
      externalUrl: '',
      published: false,
    }
  }

  return {
    title: cert.title ?? '',
    provider: cert.provider ?? '',
    providerSlug: cert.providerSlug ?? '',
    completedAt: cert.completedAt ?? '',
    issuer: cert.issuer ?? '',
    description: cert.description ?? '',
    externalUrl: cert.externalUrl ?? '',
    published: Boolean(cert.published),
  }
}

export function buildCertPayload(values) {
  const payload = {
    title: values.title.trim(),
    provider: values.provider.trim(),
    providerSlug: values.providerSlug.trim(),
    completedAt: values.completedAt.trim(),
    published: Boolean(values.published),
  }

  if (values.issuer.trim()) {
    payload.issuer = values.issuer.trim()
  }

  if (values.description.trim()) {
    payload.description = values.description.trim()
  }

  if (values.externalUrl.trim()) {
    payload.externalUrl = values.externalUrl.trim()
  }

  return payload
}