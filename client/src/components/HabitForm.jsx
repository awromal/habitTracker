import { useState } from 'react'

const EMPTY = { name: '', description: '', frequency: 'DAILY' }

export default function HabitForm({ habit, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState(
    habit
      ? { name: habit.name, description: habit.description ?? '', frequency: habit.frequency }
      : EMPTY
  )
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await onSave(form)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const isEditing = Boolean(habit)

  return (
    <div className="habit-form-card">
      <div className="habit-form-title">
        <span>{isEditing ? '✏️' : '✨'}</span>
        {isEditing ? `Editing "${habit.name}"` : 'New habit'}
      </div>

      <form
        className="habit-form-fields"
        onSubmit={submit}
        id={isEditing ? `edit-form-${habit?.id}` : 'add-habit-form'}
      >
        <div className="habit-form-row">
          <div style={{ flex: 1 }}>
            <label className="field-label" htmlFor={isEditing ? `edit-name-${habit?.id}` : 'new-habit-name'}>
              Habit name
            </label>
            <input
              id={isEditing ? `edit-name-${habit?.id}` : 'new-habit-name'}
              placeholder="e.g. Morning run, Read 30 min…"
              value={form.name}
              onChange={set('name')}
              autoFocus
              required
              maxLength={100}
            />
          </div>
          <div>
            <label className="field-label" htmlFor={isEditing ? `edit-freq-${habit?.id}` : 'new-habit-freq'}>
              Frequency
            </label>
            <select
              id={isEditing ? `edit-freq-${habit?.id}` : 'new-habit-freq'}
              value={form.frequency}
              onChange={set('frequency')}
              style={{ width: 'auto', minWidth: '115px' }}
            >
              <option value="DAILY">🔁 Daily</option>
              <option value="WEEKLY">📅 Weekly</option>
            </select>
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor={isEditing ? `edit-desc-${habit?.id}` : 'new-habit-desc'}>
            Description <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            id={isEditing ? `edit-desc-${habit?.id}` : 'new-habit-desc'}
            placeholder="Add a note or motivation…"
            value={form.description}
            onChange={set('description')}
          />
        </div>

        {error && (
          <div className="error-msg" role="alert">
            <span>⚠️</span> {error}
          </div>
        )}

        <div className="habit-form-actions">
          {isEditing && onDelete ? (
            <button
              type="button"
              id={`delete-habit-${habit?.id}`}
              className="btn-danger"
              onClick={onDelete}
              disabled={busy}
            >
              🗑 Delete
            </button>
          ) : (
            <span />
          )}
          <div className="habit-form-actions-right">
            <button
              type="button"
              id={isEditing ? `cancel-edit-${habit?.id}` : 'cancel-add-habit'}
              className="btn-ghost"
              onClick={onCancel}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              id={isEditing ? `save-habit-${habit?.id}` : 'save-new-habit'}
              className="btn-primary"
              disabled={busy}
              style={{ width: 'auto', padding: '0.65rem 1.25rem' }}
            >
              {busy ? <span className="spinner" /> : null}
              {isEditing ? 'Save' : 'Add'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
