import { getProviderBranding } from '../config/providerBranding'

function getProviderInitials(providerLabel) {
  const words = providerLabel.trim().split(/\s+/).filter(Boolean)

  if (!words.length) {
    return '?'
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export function ProviderLogo({ providerLabel, providerSlug }) {
  const branding = getProviderBranding(providerSlug)
  const logoColor = branding?.icon?.hex ? `#${branding.icon.hex}` : branding?.color

  if (branding?.icon) {
    return (
      <span
        className="provider-logo provider-logo-icon"
        data-provider-logo={branding.icon.slug}
        style={{ '--provider-color': logoColor }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" focusable="false">
          <path d={branding.icon.path} />
        </svg>
      </span>
    )
  }

  if (branding?.ovalLogo) {
    return (
      <span className="provider-logo provider-logo-oval" style={{ '--provider-color': logoColor }} aria-hidden="true" />
    )
  }

  if (branding?.textLogo) {
    return (
      <span className="provider-logo provider-logo-text" style={{ '--provider-color': logoColor }} aria-hidden="true">
        {branding.textLogo}
      </span>
    )
  }

  return (
    <span className="provider-logo provider-logo-initials" aria-hidden="true">
      {getProviderInitials(providerLabel)}
    </span>
  )
}
