import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CertForm } from '../components/CertForm'
import { LoginForm } from '../components/LoginForm'
import { appConfig } from '../config/appConfig'
import { usePrivateCerts } from '../hooks/usePrivateCerts'
import { useAuth } from '../hooks/useAuth'
import { deleteCert, saveCert, togglePublished } from '../lib/certfolioRepository'
import { formatCompletedAt } from '../utils/certDisplay'
import '../App.css'

function getStatus({ isLoading, user, ownerUid }) {
  if (isLoading) {
    return {
      title: 'Checking session',
      copy: 'Firebase is resolving the current authentication state.',
      state: 'checking',
    }
  }

  if (!ownerUid) {
    return {
      title: 'Owner UID missing',
      copy: 'Add VITE_OWNER_UID to .env to complete the owner-only gate for /admin.',
      state: 'blocked',
    }
  }

  if (!user) {
    return {
      title: 'Authentication required',
      copy: 'Sign in with your Firebase email/password account to continue to Certfolio admin.',
      state: 'checking',
    }
  }

  if (user.uid !== ownerUid) {
    return {
      title: 'Access denied',
      copy: 'This account authenticated correctly but does not match the configured owner UID.',
      state: 'denied',
    }
  }

  return {
    title: 'Owner access confirmed',
    copy: 'You can manage private certifications and publish them to the public profile.',
    state: 'owner',
  }
}

export function AdminPage() {
  const { isLoading, signIn, signOut, user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [selectedCertId, setSelectedCertId] = useState(null)
  const [isSavingCert, setIsSavingCert] = useState(false)

  const ownerUid = appConfig.ownerUid
  const status = useMemo(
    () => getStatus({ isLoading, user, ownerUid }),
    [isLoading, ownerUid, user],
  )
  const isOwner = Boolean(user && ownerUid && user.uid === ownerUid)
  const {
    certs,
    error: certsError,
    isLoading: areCertsLoading,
  } = usePrivateCerts(user?.uid, isOwner)
  const publishedCount = certs.filter((cert) => cert.published).length
  const selectedCert = certs.find((cert) => cert.id === selectedCertId) ?? null

  const handleLogin = async ({ email, password }) => {
    setIsSubmitting(true)
    setFeedback('')

    try {
      await signIn(email, password)
    } catch (error) {
      setFeedback(error.message ?? 'Unable to sign in with Firebase.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    setFeedback('')
    await signOut()
  }

  const handleSaveCert = async ({ payload }) => {
    if (!user?.uid) {
      return
    }

    setIsSavingCert(true)
    setFeedback('')

    try {
      await saveCert({
        certId: selectedCert?.id,
        payload,
        userId: user.uid,
      })
      setFeedback(
        selectedCert
          ? 'Certification updated and synchronized successfully.'
          : 'Certification created successfully.',
      )
      setSelectedCertId(null)
    } catch (error) {
      setFeedback(error.message ?? 'Unable to save certification.')
    } finally {
      setIsSavingCert(false)
    }
  }

  const handleDeleteCert = async (cert) => {
    if (!user?.uid) {
      return
    }

    const isConfirmed = window.confirm(
      `Delete "${cert.title}" from the private source and public projection?`,
    )

    if (!isConfirmed) {
      return
    }

    setFeedback('')

    try {
      await deleteCert({ certId: cert.id, userId: user.uid })

      if (selectedCertId === cert.id) {
        setSelectedCertId(null)
      }

      setFeedback('Certification deleted successfully.')
    } catch (error) {
      setFeedback(error.message ?? 'Unable to delete certification.')
    }
  }

  const handleTogglePublished = async (cert) => {
    if (!user?.uid) {
      return
    }

    setFeedback('')

    try {
      await togglePublished({
        cert,
        nextPublished: !cert.published,
        userId: user.uid,
      })
      setFeedback(
        cert.published
          ? 'Certification unpublished from the public profile.'
          : 'Certification published to the public profile.',
      )
    } catch (error) {
      setFeedback(error.message ?? 'Unable to update publication state.')
    }
  }

  return (
    <div className="app-shell">
      <main className="page">
        <header className="topbar">
          <Link className="app-name" to="/admin">
            Certfolio Admin
          </Link>
          <nav className="topnav" aria-label="Admin navigation">
            <Link className="nav-link" to="/">
              Public view
            </Link>
            {user ? (
              <button className="nav-button" type="button" onClick={handleSignOut}>
                Sign out
              </button>
            ) : null}
          </nav>
        </header>

        {!isOwner ? (
          <section className="auth-layout">
            <article className="status-card">
              <span className="status-pill" data-state={status.state}>
                {status.title}
              </span>
              <div className="status-body">
                <h1 className="status-title">Admin access</h1>
                <p className="status-copy">{status.copy}</p>
              </div>
              <p className="section-copy">Current user: {user?.email ?? 'Not signed in'}</p>
            </article>
            <div className="status-stack">
              <LoginForm onSubmit={handleLogin} isSubmitting={isSubmitting} />
              {feedback ? (
                <p className="form-message" data-tone="error">
                  {feedback}
                </p>
              ) : null}
            </div>
          </section>
        ) : (
          <section className="admin-workspace" aria-labelledby="admin-title">
            <div className="admin-heading">
              <div>
                <p className="eyebrow">Management</p>
                <h1 id="admin-title" className="section-title">
                  Certifications
                </h1>
              </div>
              <div className="admin-summary" aria-label="Certification summary">
                <span>{certs.length} total</span>
                <span>{publishedCount} published</span>
                <span>{certs.length - publishedCount} drafts</span>
              </div>
            </div>

            {feedback ? (
              <p
                className="form-message"
                data-tone={feedback.toLowerCase().includes('unable') ? 'error' : 'success'}
              >
                {feedback}
              </p>
            ) : null}

            <div className="admin-layout">
              <CertForm
                key={selectedCert?.id ?? 'new-cert'}
                cert={selectedCert}
                isSaving={isSavingCert}
                onCancel={() => setSelectedCertId(null)}
                onSave={handleSaveCert}
              />

              <div className="admin-divider" role="presentation" />

              <section className="admin-panel" aria-labelledby="cert-list-title">
                <div className="panel-heading">
                  <h2 id="cert-list-title">Cert list</h2>
                  <p className="section-copy">Newest completed month first.</p>
                </div>

                {areCertsLoading ? (
                  <div className="empty-state">
                    <p className="empty-copy">Loading private cert inventory...</p>
                  </div>
                ) : null}
                {!areCertsLoading && certsError ? (
                  <div className="empty-state">
                    <p className="empty-copy">{certsError}</p>
                  </div>
                ) : null}
                {!areCertsLoading && !certsError && !certs.length ? (
                  <div className="empty-state">
                    <p className="empty-copy">No certifications yet. Use the form to add the first one.</p>
                  </div>
                ) : null}
                {!areCertsLoading && !certsError && certs.length ? (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th scope="col">Title</th>
                          <th scope="col">Provider</th>
                          <th scope="col">Completed</th>
                          <th scope="col">Status</th>
                          <th scope="col">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {certs.map((cert) => (
                          <tr key={cert.id}>
                            <td>
                              <strong>{cert.title}</strong>
                              <span>{cert.providerSlug}</span>
                            </td>
                            <td>{cert.provider}</td>
                            <td>{formatCompletedAt(cert.completedAt)}</td>
                            <td>
                              <span className="status-pill" data-state={cert.published ? 'owner' : 'blocked'}>
                                {cert.published ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td>
                              <div className="table-actions">
                                <button
                                  className="compact-button"
                                  type="button"
                                  onClick={() => setSelectedCertId(cert.id)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="compact-button"
                                  type="button"
                                  onClick={() => handleTogglePublished(cert)}
                                >
                                  {cert.published ? 'Unpublish' : 'Publish'}
                                </button>
                                <button
                                  className="compact-button danger-button"
                                  type="button"
                                  onClick={() => handleDeleteCert(cert)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </section>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}