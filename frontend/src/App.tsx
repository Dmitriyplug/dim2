import { useState, useEffect } from 'react'
import Auth from './components/Auth'
import ChatList from './components/ChatList'
import Chat from './components/Chat'
import Friends from './components/Friends'
import Posts from './components/Posts'
import Settings from './components/Settings'
import type { User } from './types'
import { setAuthToken, api } from './services/api'
import { connectSocket, disconnectSocket, getSocket } from './services/socket'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [chats, setChats] = useState<User[]>([])
  const [selectedChat, setSelectedChat] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'chats' | 'friends' | 'posts'>('chats')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      const user = JSON.parse(savedUser)
      setCurrentUser(user)
      setIsAuthenticated(true)
      setAuthToken(token)
      connectSocket(token)
      loadChats()
    }
  }, [])

  const loadChats = async () => {
    try {
      const data = await api.getChats()
      setChats(data)
    } catch (err) { console.error(err) }
  }

  const handleLogin = async (user: User, token: string) => {
    setCurrentUser(user)
    setIsAuthenticated(true)
    setAuthToken(token)
    localStorage.setItem('user', JSON.stringify(user))
    connectSocket(token)
    await loadChats()
  }

  const handleSendMessage = (receiverId: number, text: string) => {
    const socket = getSocket()
    if (socket) socket.emit('send_message', { receiverId, text })
  }

  const handleStartChat = async (user: User) => {
    setSelectedChat(user)
    setActiveTab('chats')
    await loadChats()
  }

  const handleLogout = () => {
    disconnectSocket()
    setAuthToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setCurrentUser(null)
    setSelectedChat(null)
    setShowSettings(false)
  }

  if (!isAuthenticated || !currentUser) return <Auth onLogin={handleLogin} />

  return (
    <div className="messenger-layout">
      {showSettings && (
        <Settings 
          currentUser={currentUser} 
          onUpdateUser={setCurrentUser} 
          onClose={() => setShowSettings(false)} 
          onLogout={handleLogout} 
        />
      )}
      <div className="messenger-container">
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="logo">Мессенджер</div>
            <button className="settings-icon" onClick={() => setShowSettings(true)}>⚙️</button>
          </div>
          <div className="current-user-info" onClick={() => setShowSettings(true)}>
            <div className="current-user-avatar">{currentUser.username.charAt(0).toUpperCase()}</div>
            <div className="current-user-details">
              <span className="current-user-name">{currentUser.username}</span>
              <span className="user-status online">В сети</span>
            </div>
          </div>
          <div className="sidebar-tabs">
            <button className={`tab-button ${activeTab === 'chats' ? 'active' : ''}`} onClick={() => setActiveTab('chats')}>Чаты</button>
            <button className={`tab-button ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>Поиск</button>
            <button className={`tab-button ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>Посты</button>
          </div>
          {activeTab === 'chats' && <ChatList chats={chats} currentUser={currentUser} selectedChat={selectedChat} onSelectChat={setSelectedChat} />}
          {activeTab === 'friends' && <Friends currentUser={currentUser} friends={chats} setFriends={setChats} onStartChat={handleStartChat} />}
        </div>
        {activeTab === 'posts' && <Posts currentUserId={currentUser.id} />}
        {activeTab === 'chats' && <Chat currentUser={currentUser} chatUser={selectedChat} onSendMessage={handleSendMessage} />}
        {activeTab === 'friends' && <div className="center-placeholder"><div className="empty-chat-card"><h3>Поиск пользователей</h3><p>Найдите пользователя по имени</p></div></div>}
      </div>
    </div>
  )
}

export default App
