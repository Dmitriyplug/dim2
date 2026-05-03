import { useState } from 'react'
import type { User } from '../types'
import { api } from '../services/api'

interface FriendsProps {
  currentUser: User
  friends: User[]
  setFriends: (friends: User[]) => void
  onStartChat: (user: User) => void
}

export default function Friends({ currentUser, friends, setFriends, onStartChat }: FriendsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    try {
      const results = await api.searchUsers(searchQuery)
      setSearchResults(results)
      setShowSearch(true)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartChat = (user: User) => {
    onStartChat(user)
    setShowSearch(false)
    setSearchQuery('')
  }

  return (
    <div className="friends-container">
      <div className="friends-search">
        <div className="search-row">
          <input
            type="text"
            placeholder="Поиск пользователей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="search-input"
          />
          <button className="add-friend-button" onClick={handleSearch} disabled={loading}>
            {loading ? 'Поиск...' : 'Найти'}
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
                <div className="friend-avatar">{user.username.charAt(0).toUpperCase()}</div>
                <div className="friend-info">
                  <div className="friend-name">{user.username}</div>
                  <div className="friend-email">{user.email}</div>
                </div>
                <div className="friend-actions">
                  <button className="chat-button-small" onClick={() => handleStartChat(user)}>
                    Написать
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="friends-list-header">Мои диалоги</div>
      <div className="friends-list">
        {friends.length === 0 ? (
          <div className="empty-friends">
            <p>Нет диалогов</p>
            <span>Найдите пользователя и начните общение</span>
          </div>
        ) : (
          friends.map((friend) => (
            <div key={friend.id} className="friend-item">
              <div className="friend-avatar">{friend.username.charAt(0).toUpperCase()}</div>
              <div className="friend-info">
                <div className="friend-name">
                  {friend.username}
                  <span className={`friend-status ${friend.status === 'online' ? 'online' : 'offline'}`}></span>
                </div>
                <div className="friend-email">{friend.email}</div>
              </div>
              <div className="friend-actions">
                <button className="chat-button-small" onClick={() => onStartChat(friend)}>
                  Чат
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
