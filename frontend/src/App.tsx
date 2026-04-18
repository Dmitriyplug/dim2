import { useState, useEffect } from 'react'
import Auth from './components/Auth'
import ChatList from './components/ChatList'
import Chat from './components/Chat'
import Friends from './components/Friends'
import Settings from './components/Settings'
import type { User, Friend, ChatRoom } from './types'
import { setAuthToken } from './services/api'
import { connectSocket, disconnectSocket } from './services/socket'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [friends, setFriends] = useState<Friend[]>([])
  const [chats, setChats] = useState<ChatRoom[]>([])
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null)
  const [selectedChatName, setSelectedChatName] = useState('')
  const [activeTab, setActiveTab] = useState<'chats' | 'friends'>('chats')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setAuthToken(token)
    }
  }, [])

  const handleLogin = async (user: User, token: string) => {
    setCurrentUser(user)
    setIsAuthenticated(true)
    connectSocket(token)
    await loadChats()
    await loadFriends()
  }

  const loadChats = async () => {
    try {
      const { api } = await import('./services/api')
      const data = await api.getChats()
      setChats(data)
    } catch (err) {
      console.error('Failed to load chats', err)
    }
  }

  const loadFriends = async () => {
    try {
      const { api } = await import('./services/api')
      const data = await api.getFriends()
      setFriends(data)
    } catch (err) {
      console.error('Failed to load friends', err)
    }
  }

  const handleStartChat = async (friendId: number, friendName: string) => {
    try {
      const { api } = await import('./services/api')
      const data = await api.startChat(friendId)
      setSelectedChatId(data.chatId)
      setSelectedChatName(friendName)
      setActiveTab('chats')
      await loadChats()
    } catch (err) {
      console.error('Failed to start chat', err)
    }
  }

  const handleSendMessage = (chatId: number, text: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { ...chat, lastMessage: text, lastMessageTime: Date.now(), unreadCount: (chat.unreadCount || 0) + 1 }
        : chat
    ))
  }

  const handleLogout = () => {
    disconnectSocket()
    setAuthToken(null)
    setIsAuthenticated(false)
    setCurrentUser(null)
    setFriends([])
    setChats([])
    setSelectedChatId(null)
    setShowSettings(false)
  }

  if (!isAuthenticated || !currentUser) {
    return <Auth onLogin={handleLogin} />
  }

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
            <div className="logo">Messages</div>
            <button className="settings-icon" onClick={() => setShowSettings(true)}>
              ⚙️
            </button>
          </div>

          <div className="sidebar-search">
            <input type="text" placeholder="Search" className="search-input" />
          </div>

          <div className="sidebar-tabs">
            <button
              className={`tab-button ${activeTab === 'chats' ? 'active' : ''}`}
              onClick={() => setActiveTab('chats')}
            >
              Чаты
            </button>
            <button
              className={`tab-button ${activeTab === 'friends' ? 'active' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              Друзья
            </button>
          </div>

          {activeTab === 'chats' ? (
            <ChatList
              chats={chats}
              currentUser={currentUser}
              selectedChatId={selectedChatId}
              onSelectChat={(id) => {
                const chat = chats.find(c => c.id === id)
                setSelectedChatId(id)
                setSelectedChatName(chat?.name || 'Чат')
              }}
              onOpenSettings={() => setShowSettings(true)}
            />
          ) : (
            <Friends
              currentUser={currentUser}
              friends={friends}
              setFriends={setFriends}
              onStartChat={handleStartChat}
              onOpenSettings={() => setShowSettings(true)}
            />
          )}
        </div>

        <Chat
          currentUser={currentUser}
          chatId={selectedChatId}
          chatName={selectedChatName}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  )
}

export default App
