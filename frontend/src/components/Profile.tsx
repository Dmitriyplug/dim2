import { useState } from 'react'
import type { User } from '../types'

interface ProfileProps {
  user: User
  onUpdateBio: (bio: string) => void
  onClose: () => void
  onLogout: () => void
}

export function Profile({ user, onUpdateBio, onClose, onLogout }: ProfileProps) {
  const [bio, setBio] = useState(user.bio || '')
  const [isEditing, setIsEditing] = useState(false)

  const handleSaveBio = () => {
    onUpdateBio(bio)
    setIsEditing(false)
  }

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="profile-close" onClick={onClose}>×</button>
        
        <div className="profile-header">
          <div className="profile-avatar-large">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <h2>{user.username}</h2>
          <p className="profile-email">{user.email}</p>
        </div>

        <div className="profile-bio-section">
          <div className="bio-header">
            <h3>О себе</h3>
            {!isEditing && (
              <button className="edit-bio-button" onClick={() => setIsEditing(true)}>
                Редактировать
              </button>
            )}
          </div>
          
          {isEditing ? (
            <div className="bio-edit">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Расскажите о себе..."
                className="bio-textarea"
                rows={4}
              />
              <div className="bio-actions">
                <button className="save-bio-button" onClick={handleSaveBio}>
                  Сохранить
                </button>
                <button className="cancel-bio-button" onClick={() => {
                  setIsEditing(false)
                  setBio(user.bio || '')
                }}>
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div className="bio-display">
              {user.bio ? (
                <p>{user.bio}</p>
              ) : (
                <p className="bio-empty">Пока ничего не рассказано о себе</p>
              )}
            </div>
          )}
        </div>

        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value">{user.friendsCount || 0}</span>
            <span className="stat-label">Друзей</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{user.chatsCount || 0}</span>
            <span className="stat-label">Чатов</span>
          </div>
        </div>

        <button className="profile-logout-button" onClick={onLogout}>
          Выйти из аккаунта
        </button>
      </div>
    </div>
  )
}
