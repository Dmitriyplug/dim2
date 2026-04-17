import { useState } from 'react'
import { Auth } from './components/Auth'
import { ChatList } from './components/ChatList'
import { Chat } from './components/Chat'
import { Friends } from './components/Friends'
import { Profile } from './components/Profile'
import type { User, ChatRoom, Friend } from './types'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [chats, setChats] = useState<ChatRoom[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'chats' | 'friends'>('chats')
  const [showProfile, setShowProfile] = useState(false)

  const handleLogin = (username: string, password: string) => {
    console.log('Login:', username, password)
    const newUser: User = {
      id: Date.now().toString(),
      username: username,
      email: `${username}@example.com`,
      status: 'online',
      bio: '',
      friendsCount: 0,
      chatsCount: 0
    }
    setCurrentUser(newUser)
    setChats([])
    setFriends([])
    setSelectedChatId(null)
    setIsAuthenticated(true)
  }

  const handleRegister = (username: string, email: string, password: string) => {
    console.log('Register:', username, email, password)
    const newUser: User = {
      id: Date.now().toString(),
      username: username,
      email: email,
      status: 'online',
      bio: '',
      friendsCount: 0,
      chatsCount: 0
    }
    setCurrentUser(newUser)
    setChats([])
    setFriends([])
    setSelectedChatId(null)
    setIsAuthenticated(true)
  }

  const handleUpdateBio = (bio: string) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, bio })
    }
  }

  const handleAddFriend = (friendUsername: string) => {
    const newFriend: Friend = {
      id: Date.now().toString(),
      username: friendUsername,
      email: `${friendUsername}@example.com`,
      status: 'offline'
    }
    setFriends([...friends, newFriend])
    if (currentUser) {
      setCurrentUser({ ...currentUser, friendsCount: friends.length + 1 })
    }
  }

  const handleRemoveFriend = (friendId: string) => {
    setFriends(friends.filter(f => f.id !== friendId))
    if (currentUser) {
      setCurrentUser({ ...currentUser, friendsCount: friends.length - 1 })
    }
  }

  const handleStartChat = (friend: Friend) => {
    const existingChat = chats.find(chat => 
      chat.participants.some(p => p.id === friend.id)
    )
    
    if (existingChat) {
      setSelectedChatId(existingChat.id)
    } else {
      const newChat: ChatRoom = {
        id: Date.now().toString(),
        name: friend.username,
        lastMessage: '',
        lastMessageTime: Date.now(),
        unreadCount: 0,
        participants: [currentUser!, friend]
      }
      setChats([...chats, newChat])
      setSelectedChatId(newChat.id)
      if (currentUser) {
        setCurrentUser({ ...currentUser, chatsCount: chats.length + 1 })
      }
    }
    setActiveTab('chats')
  }

  const handleSendMessage = (chatId: string, text: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { 
            ...chat, 
            lastMessage: text, 
            lastMessageTime: Date.now(), 
            unreadCount: chat.unreadCount + 1 
          }
        : chat
    ))
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentUser(null)
    setChats([])
    setFriends([])
    setSelectedChatId(null)
    setShowProfile(false)
  }

  if (!isAuthenticated || !currentUser) {
    return <Auth onLogin={handleLogin} onRegister={handleRegister} />
  }

  const selectedChat = chats.find(c => c.id === selectedChatId) || null

  return (
    <div className="messenger-layout">
      {showProfile && (
        <Profile
          user={currentUser}
          onUpdateBio={handleUpdateBio}
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
        />
      )}
      
      <div className="sidebar">
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
            onSelectChat={setSelectedChatId}
            onOpenProfile={() => setShowProfile(true)}
          />
        ) : (
          <Friends
            currentUser={currentUser}
            friends={friends}
            onAddFriend={handleAddFriend}
            onRemoveFriend={handleRemoveFriend}
            onStartChat={handleStartChat}
            onOpenProfile={() => setShowProfile(true)}
          />
        )}
      </div>
      
      <Chat
        currentUser={currentUser}
        selectedChat={selectedChat}
        onSendMessage={handleSendMessage}
        onLogout={handleLogout}
      />
    </div>
  )
}

export default App
