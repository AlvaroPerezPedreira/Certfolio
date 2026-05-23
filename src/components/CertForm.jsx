import { useState } from 'react'
import {
  buildCertPayload,
  getInitialCertValues,
  slugifyProvider,
  validateCertInput,
} from '../utils/certValidation'

export function CertForm({ cert, isSaving, onCancel, onSave }) {
  const [values, setValues] = useState(getInitialCertValues(cert))
  const [errors, setErrors] = useState({})
  const [isSlugCustomized, setIsSlugCustomized] = useState(
    Boolean(cert?.providerSlug),
  )

  const handleFieldChange = (field) => (event) => {
    const nextValue =
      event.target.type === 'checkbox' ? event.target.checked : event.target.value

    setValues((currentValues) => {
      if (field === 'provider') {
        const nextValues = {
          ...currentValues,
          provider: nextValue,
        }

        if (!isSlugCustomized) {
          nextValues.providerSlug = slugifyProvider(nextValue)
        }

        return nextValues
      }

      if (field === 'providerSlug') {
        setIsSlugCustomized(true)
      }

      return {
        ...currentValues,
        [field]: nextValue,
      }
    })

    setErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors
      }

      const nextErrors = { ...currentErrors }
      delete nextErrors[field]
      return nextErrors
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = validateCertInput(values)

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    if (
      cert?.published &&
      cert.providerSlug &&
      cert.providerSlug !== values.providerSlug.trim()
    ) {
      const isConfirmed = window.confirm(
        'Changing the provider slug will affect public grouping and provider tabs. Continue?',
      )

      if (!isConfirmed) {
        return
      }
    }

    await onSave({
      payload: buildCertPayload(values),
    })
  }

  return (
    <form className="admin-panel cert-form" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">{cert ? 'Edit certification' : 'Create certification'}</p>
        <h3>{cert ? 'Update private source record' : 'Add a new private source record'}</h3>
      </div>

      <div className="form-grid">
        <label className="field-group">
          <span className="field-label">Title</span>
          <input
            className="field-input"
            type="text"
            value={values.title}
            onChange={handleFieldChange('title')}
            placeholder="React Fundamentals"
          />
          {errors.title ? <span className="field-error">{errors.title}</span> : null}
        </label>

        <label className="field-group">
          <span className="field-label">Provider</span>
          <input
            className="field-input"
            type="text"
            value={values.provider}
            onChange={handleFieldChange('provider')}
            placeholder="Udemy"
          />
          {errors.provider ? <span className="field-error">{errors.provider}</span> : null}
        </label>

        <label className="field-group">
          <span className="field-label">Provider slug</span>
          <input
            className="field-input"
            type="text"
            value={values.providerSlug}
            onChange={handleFieldChange('providerSlug')}
            placeholder="udemy"
          />
          {errors.providerSlug ? (
            <span className="field-error">{errors.providerSlug}</span>
          ) : null}
        </label>

        <label className="field-group">
          <span className="field-label">Completed at</span>
          <input
            className="field-input"
            type="month"
            max={new Date().toISOString().slice(0, 7)}
            value={values.completedAt}
            onChange={handleFieldChange('completedAt')}
          />
          {errors.completedAt ? (
            <span className="field-error">{errors.completedAt}</span>
          ) : null}
        </label>

        <label className="field-group">
          <span className="field-label">Issuer</span>
          <input
            className="field-input"
            type="text"
            value={values.issuer}
            onChange={handleFieldChange('issuer')}
            placeholder="Optional issuer"
          />
        </label>

        <label className="field-group">
          <span className="field-label">External URL</span>
          <input
            className="field-input"
            type="url"
            value={values.externalUrl}
            onChange={handleFieldChange('externalUrl')}
            placeholder="https://example.com/certificate"
          />
          {errors.externalUrl ? (
            <span className="field-error">{errors.externalUrl}</span>
          ) : null}
        </label>
      </div>

      <label className="field-group">
        <span className="field-label">Description</span>
        <textarea
          className="field-input field-textarea"
          value={values.description}
          onChange={handleFieldChange('description')}
          placeholder="Optional admin-side description"
          rows={5}
        />
      </label>

      <label className="toggle-row">
        <input
          type="checkbox"
          checked={values.published}
          onChange={handleFieldChange('published')}
        />
        <span className="field-label">Publish to the public profile</span>
      </label>

      <div className="button-row">
        <button className="action-button" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : cert ? 'Save changes' : 'Create cert'}
        </button>
        {cert ? (
          <button className="secondary-button" type="button" onClick={onCancel}>
            Cancel editing
          </button>
        ) : null}
      </div>
    </form>
  )
}