import { useState } from 'react'
import type { User } from '../types'
import { api, setAuthToken } from '../services/api'

interface SettingsProps {
  currentUser: User
  onUpdateUser: (user: User) => void
  onClose: () => void
  onLogout: () => void
}

export default function Settings({ currentUser, onUpdateUser, onClose, onLogout }: SettingsProps) {
  const [bio, setBio] = useState(currentUser.bio || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.updateBio(bio)
      onUpdateUser({ ...currentUser, bio })
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setAuthToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    onLogout()
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
            <input type="text" value={currentUser.username} disabled />
          </div>
          
          <div className="settings-field">
            <label>Email</label>
            <input type="email" value={currentUser.email} disabled />
          </div>
          
          <div className="settings-field">
            <label>О себе</label>
            <textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              rows={3} 
              placeholder="Расскажите о себе..."
            />
          </div>
          
          <div className="settings-actions">
            <button onClick={handleSave} disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <button onClick={handleLogout}>Выйти из аккаунта</button>
          </div>
        </div>
      </div>
    </div>
  )
}
