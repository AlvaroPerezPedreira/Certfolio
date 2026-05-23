import { useState } from 'react'

export function LoginForm({ onSubmit, isSubmitting }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setMessage('Email and password are required.')
      return
    }

    setMessage('')
    await onSubmit({ email: email.trim(), password })
  }

  return (
    <form className="login-card" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">Owner sign in</p>
        <h2>Access Certfolio Admin</h2>
        <p className="helper-text">
          Firebase Authentication is wired. The next gate is your configured owner
          UID.
        </p>
      </div>

      <label className="field-group">
        <span className="field-label">Email</span>
        <input
          className="field-input"
          type="email"
          autoComplete="email"
          placeholder="owner@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <label className="field-group">
        <span className="field-label">Password</span>
        <input
          className="field-input"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      {message ? (
        <p className="form-message" data-tone="error">
          {message}
        </p>
      ) : null}

      <div className="button-row">
        <button className="action-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </form>
  )
}