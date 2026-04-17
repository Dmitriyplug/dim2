import { useState } from 'react'
import type { Friend, User } from '../types'

interface FriendsProps {
  currentUser: User
  friends: Friend[]
  onAddFriend: (friendId: string) => void
  onRemoveFriend: (friendId: string) => void
  onStartChat: (friend: Friend) => void
  onOpenProfile: () => void
}

export function Friends({ currentUser, friends, onAddFriend, onRemoveFriend, onStartChat, onOpenProfile }: FriendsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [newFriendUsername, setNewFriendUsername] = useState('')

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddFriend = () => {
    if (!newFriendUsername.trim()) return
    onAddFriend(newFriendUsername)
    setNewFriendUsername('')
    setShowAddFriend(false)
  }

  return (
    <div className="friends-container">
      <div className="friends-header">
        <h2>Друзья</h2>
        <div className="current-user" onClick={onOpenProfile}>
          <div className="user-avatar-small">
            {currentUser.username.charAt(0).toUpperCase()}
          </div>
          <span>{currentUser.username}</span>
        </div>
      </div>

      <div className="friends-search">
        <input
          type="text"
          placeholder="Поиск друзей..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <button className="add-friend-button" onClick={() => setShowAddFriend(true)}>
          Добавить друга
        </button>
      </div>

      {showAddFriend && (
        <div className="add-friend-modal">
          <div className="add-friend-modal-content">
            <h3>Добавить друга</h3>
            <input
              type="text"
              placeholder="Введите имя пользователя"
              value={newFriendUsername}
              onChange={(e) => setNewFriendUsername(e.target.value)}
              className="add-friend-input"
            />
            <div className="add-friend-actions">
              <button onClick={handleAddFriend} className="confirm-button">Добавить</button>
              <button onClick={() => setShowAddFriend(false)} className="cancel-button">Отмена</button>
            </div>
          </div>
        </div>
      )}

      <div className="friends-list">
        {filteredFriends.length === 0 ? (
          <div className="empty-friends">
            <p>Нет друзей</p>
            <span>Добавьте друзей чтобы начать общение</span>
          </div>
        ) : (
          filteredFriends.map((friend) => (
            <div key={friend.id} className="friend-item">
              <div className="friend-avatar">
                {friend.username.charAt(0).toUpperCase()}
              </div>
              <div className="friend-info">
                <div className="friend-name">
                  {friend.username}
                  <span className={`friend-status ${friend.status}`}></span>
                </div>
                <div className="friend-email">{friend.email}</div>
              </div>
              <div className="friend-actions">
                <button
                  className="chat-button-small"
                  onClick={() => onStartChat(friend)}
                >
                  Чат
                </button>
                <button
                  className="remove-button-small"
                  onClick={() => onRemoveFriend(friend.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
