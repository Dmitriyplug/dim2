import { useState, useEffect } from 'react'
import type { User } from '../types'
import { api } from '../services/api'
import { getSocket } from '../services/socket'
import UserProfile from './UserProfile'

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
  const [requests, setRequests] = useState<{ fromId: number; fromName: string }[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    loadRequests()
    loadFriends()
    
    const socket = getSocket()
    if (socket) {
      socket.on('friend_request', (data) => {
        setRequests(prev => [...prev, { fromId: data.fromId, fromName: data.fromName }])
      })
      socket.on('friend_accepted', () => loadFriends())
    }
    return () => {
      const socket = getSocket()
      socket?.off('friend_request')
      socket?.off('friend_accepted')
    }
  }, [])

  const loadRequests = async () => {
    try {
      const data = await api.getFriendRequests()
      setRequests(data)
    } catch (err) { console.error(err) }
  }

  const loadFriends = async () => {
    try {
      const data = await api.getFriends()
      setFriends(data)
    } catch (err) { console.error(err) }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try {
      const results = await api.searchUsers(searchQuery)
      setSearchResults(results)
      setShowSearch(true)
    } catch (err) { console.error(err) }
  }

  const handleSendRequest = async (toId: number) => {
    try {
      await api.sendFriendRequest(toId)
      alert('Заявка отправлена')
      setShowSearch(false)
      setSearchQuery('')
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleAccept = async (fromId: number) => {
    try {
      await api.acceptFriendRequest(fromId)
      setRequests(prev => prev.filter(r => r.fromId !== fromId))
      await loadFriends()
    } catch (err) { console.error(err) }
  }

  const handleReject = async (fromId: number) => {
    try {
      await api.rejectFriendRequest(fromId)
      setRequests(prev => prev.filter(r => r.fromId !== fromId))
    } catch (err) { console.error(err) }
  }

  const handleViewProfile = async (userId: number) => {
    try {
      const user = await api.getUser(userId)
      setSelectedUser(user)
    } catch (err) { console.error(err) }
  }

  return (
    <div className="friends-container">
      {selectedUser && <UserProfile user={selectedUser} onClose={() => setSelectedUser(null)} />}

      <div className="friends-search">
        <div className="search-row">
          <input type="text" placeholder="Поиск пользователей..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} className="search-input" />
          <button className="add-friend-button" onClick={handleSearch}>Найти</button>
        </div>
      </div>

      {showSearch && (
        <div className="search-results">
          <div className="search-results-header"><span>Результаты</span><button onClick={() => setShowSearch(false)}>×</button></div>
          {searchResults.length === 0 ? <div className="empty-search">Не найдены</div> : searchResults.map((user) => (
            <div key={user.id} className="friend-item">
              <div className="friend-avatar" onClick={() => handleViewProfile(user.id)} style={{ cursor: 'pointer' }}>{user.username.charAt(0).toUpperCase()}</div>
              <div className="friend-info" onClick={() => handleViewProfile(user.id)} style={{ cursor: 'pointer' }}>
                <div className="friend-name">{user.username}<span className={`friend-status ${user.status}`}></span></div>
                <div className="friend-email">{user.email}</div>
              </div>
              <div className="friend-actions"><button className="chat-button-small" onClick={() => handleSendRequest(user.id)}>Добавить</button></div>
            </div>
          ))}
        </div>
      )}

      {requests.length > 0 && (
        <div className="friend-requests">
          <div className="friend-requests-header">Заявки в друзья ({requests.length})</div>
          {requests.map((req) => (
            <div key={req.fromId} className="friend-request-item">
              <div className="friend-avatar">{req.fromName.charAt(0).toUpperCase()}</div>
              <div className="friend-info"><div className="friend-name">{req.fromName}</div></div>
              <div className="friend-actions">
                <button className="accept-button" onClick={() => handleAccept(req.fromId)}>Принять</button>
                <button className="reject-button" onClick={() => handleReject(req.fromId)}>Отклонить</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="friends-list">
        <div className="friends-list-header">Мои друзья ({friends.length})</div>
        {friends.length === 0 ? (
          <div className="empty-friends"><p>У вас пока нет друзей</p><span>Найдите пользователей и добавьте в друзья</span></div>
        ) : (
          friends.map((friend) => (
            <div key={friend.id} className="friend-item">
              <div className="friend-avatar" onClick={() => handleViewProfile(friend.id)} style={{ cursor: 'pointer' }}>{friend.username.charAt(0).toUpperCase()}</div>
              <div className="friend-info" onClick={() => handleViewProfile(friend.id)} style={{ cursor: 'pointer' }}>
                <div className="friend-name">{friend.username}<span className={`friend-status ${friend.status === 'online' ? 'online' : 'offline'}`}></span></div>
                <div className="friend-email">{friend.email}</div>
              </div>
              <div className="friend-actions"><button className="chat-button-small" onClick={() => onStartChat(friend)}>Чат</button></div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
