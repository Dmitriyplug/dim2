import { useState } from 'react'
import type { User } from '../types'
import { api } from '../services/api'

interface SettingsProps {
  currentUser: User
  onUpdateUser: (updatedUser: User) => void
  onClose: () => void
  onLogout: () => void
}

export default function Settings({ currentUser, onUpdateUser, onClose, onLogout }: SettingsProps) {
  const [bio, setBio] = useState(currentUser.bio || '')
  const [saving, setSaving] = useState(false)

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await api.updateBio(bio)
      onUpdateUser({ ...currentUser, bio })
      onClose()
    } catch (err) {
      console.error('Failed to update bio', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Настройки профиля</h2>
          <button className="settings-close" onClick={onClose}>×</button>
        </div>

        <div className="profile-editor">
          <div className="profile-avatar-large">
            {currentUser.username.charAt(0).toUpperCase()}
          </div>

          <div className="settings-field">
            <label>Имя пользователя</label>
            <input type="text" value={currentUser.username} disabled className="disabled" />
          </div>

          <div className="settings-field">
            <label>Email</label>
            <input type="email" value={currentUser.email} disabled className="disabled" />
          </div>

          <div className="settings-field">
            <label>О себе</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Расскажите о себе..."
              rows={3}
            />
          </div>

          <div className="settings-actions">
            <button onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <button onClick={onLogout}>Выйти из аккаунта</button>
          </div>
        </div>
      </div>
    </div>
  )
}
