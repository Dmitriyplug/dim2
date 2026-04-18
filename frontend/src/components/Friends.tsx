import { useState, useEffect } from 'react'
import type { Friend, User } from '../types'
import { api } from '../services/api'

interface FriendsProps {
  currentUser: User
  friends: Friend[]
  setFriends: (friends: Friend[]) => void
  onStartChat: (friendId: number, friendName: string) => void
  onOpenSettings: () => void
}

export default function Friends({ currentUser, friends, setFriends, onStartChat, onOpenSettings }: FriendsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadFriends()
  }, [])

  const loadFriends = async () => {
    try {
      const data = await api.getFriends()
      setFriends(data)
    } catch (err) {
      console.error('Failed to load friends', err)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    try {
      const results = await api.searchUsers(searchQuery)
      setSearchResults(results)
      setShowSearch(true)
    } catch (err) {
      console.error('Search failed', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddFriend = async (username: string) => {
    try {
      await api.addFriend(username)
      await loadFriends()
      setShowSearch(false)
      setSearchQuery('')
    } catch (err) {
      console.error('Failed to add friend', err)
    }
  }

  const handleRemoveFriend = async (friendId: number) => {
    try {
      await api.removeFriend(friendId)
      await loadFriends()
    } catch (err) {
      console.error('Failed to remove friend', err)
    }
  }

  return (
    <div className="friends-container">
      <div className="friends-header">
        <div className="current-user" onClick={onOpenSettings}>
          <div className="user-avatar-small">
            {currentUser.username.charAt(0).toUpperCase()}
          </div>
          <span>{currentUser.username}</span>
        </div>
      </div>

      <div className="friends-search">
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Поиск пользователей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="search-input"
          />
          <button className="add-friend-button" onClick={handleSearch} disabled={loading}>
            {loading ? '...' : 'Найти'}
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="search-results">
          <div className="search-results-header">
            <span>Результаты поиска</span>
            <button onClick={() => setShowSearch(false)}>×</button>
          </div>
          {searchResults.length === 0 ? (
            <div className="empty-search">Пользователи не найдены</div>
          ) : (
            searchResults.map((user) => (
              <div key={user.id} className="friend-item">
                <div className="friend-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="friend-info">
                  <div className="friend-name">{user.username}</div>
                  <div className="friend-email">{user.email}</div>
                </div>
                <div className="friend-actions">
                  <button className="chat-button-small" onClick={() => handleAddFriend(user.username)}>
                    Добавить
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="friends-list">
        <div className="friends-list-header">
          <span>Мои друзья</span>
        </div>
        {friends.length === 0 ? (
          <div className="empty-friends">
            <p>Нет друзей</p>
            <span>Найдите пользователей и добавьте в друзья</span>
          </div>
        ) : (
          friends.map((friend) => (
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
                <button className="chat-button-small" onClick={() => onStartChat(friend.id, friend.username)}>
                  Чат
                </button>
                <button className="remove-button-small" onClick={() => handleRemoveFriend(friend.id)}>
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
