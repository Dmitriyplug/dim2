import type { User } from '../types'

interface UserProfileProps {
  user: User
  onClose: () => void
}

export default function UserProfile({ user, onClose }: UserProfileProps) {
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
          <div className={`profile-status ${user.status === 'online' ? 'online' : 'offline'}`}>
            {user.status === 'online' ? 'В сети' : 'Не в сети'}
          </div>
        </div>

        <div className="profile-bio-section">
          <h3>О пользователе</h3>
          <div className="bio-display">
            {user.bio ? <p>{user.bio}</p> : <p className="bio-empty">Пользователь ничего не рассказал о себе</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
