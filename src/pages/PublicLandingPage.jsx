import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'
import { ProviderLogo } from '../components/ProviderLogo'
import { usePublicCerts } from '../hooks/usePublicCerts'
import { formatCompletedAt, groupPublicCertsByProvider } from '../utils/certDisplay'

export function PublicLandingPage() {
  const { certs, error, isLoading } = usePublicCerts()
  const providerGroups = useMemo(() => groupPublicCertsByProvider(certs), [certs])
  const [selectedProviderSlug, setSelectedProviderSlug] = useState('')

  const activeProvider =
    providerGroups.find((providerGroup) => providerGroup.providerSlug === selectedProviderSlug) ??
    providerGroups[0]

  return (
    <div className="app-shell">
      <main className="page">
        <header className="topbar">
          <Link className="app-name" to="/">
            Certfolio
          </Link>
        </header>

        <section className="certs-section" aria-labelledby="published-certs-title">
          <div className="section-heading">
            <div>
              <p className="profile-name">Álvaro Pérez</p>
              <h1 id="published-certs-title" className="section-title home-title">
                Tech Courses & Certifications
              </h1>
            </div>
          </div>
          {isLoading ? (
            <div className="empty-state">
              <p className="empty-copy">Loading published certifications...</p>
            </div>
          ) : null}
          {!isLoading && error ? (
            <div className="empty-state">
              <p className="empty-copy">{error}</p>
            </div>
          ) : null}
          {!isLoading && !error && !providerGroups.length ? (
            <div className="empty-state">
              <p className="empty-copy">
                No published certifications exist yet. Once a cert is published from
                admin, it will appear here under its provider tab.
              </p>
            </div>
          ) : null}
          {!isLoading && !error && providerGroups.length ? (
            <>
              <div className="cert-toolbar">
                <div className="tab-strip" role="tablist" aria-label="Certification providers">
                  {providerGroups.map((providerGroup) => (
                    <button
                      key={providerGroup.providerSlug}
                      className="tab-button"
                      data-active={providerGroup.providerSlug === activeProvider.providerSlug}
                      type="button"
                      role="tab"
                      aria-selected={providerGroup.providerSlug === activeProvider.providerSlug}
                      onClick={() => setSelectedProviderSlug(providerGroup.providerSlug)}
                    >
                      <ProviderLogo
                        providerLabel={providerGroup.providerLabel}
                        providerSlug={providerGroup.providerSlug}
                      />
                      <span>{providerGroup.providerLabel}</span>
                    </button>
                  ))}
                </div>
                <span className="cert-count">
                  {activeProvider.certs.length} {activeProvider.certs.length === 1 ? 'cert' : 'certs'}
                </span>
              </div>

              <div className="cert-grid">
                {activeProvider.certs.map((cert) => {
                  const showIssuer = cert.issuer && cert.issuer !== cert.provider

                  return (
                    <article className="cert-card" key={cert.id}>
                      <div className="cert-provider-mark">
                        <ProviderLogo providerLabel={cert.provider} providerSlug={cert.providerSlug} />
                        <span>{cert.provider}</span>
                      </div>
                      <div className="cert-card-body">
                        <h4 className="cert-title">{cert.title}</h4>
                        <div className="cert-meta">
                          <span>{formatCompletedAt(cert.completedAt)}</span>
                          {showIssuer ? <span>{cert.issuer}</span> : null}
                        </div>
                      </div>
                      {cert.externalUrl ? (
                        <a className="text-link cert-link" href={cert.externalUrl} target="_blank" rel="noreferrer">
                          View certificate
                        </a>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </>
          ) : null}
        </section>
      </main>
    </div>
  )
}