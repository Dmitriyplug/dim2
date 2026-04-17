import type { ChatRoom, User } from '../types'

interface ChatListProps {
  chats: ChatRoom[]
  currentUser: User
  selectedChatId: string | null
  onSelectChat: (chatId: string) => void
  onOpenProfile: () => void
}

export function ChatList({ chats, currentUser, selectedChatId, onSelectChat, onOpenProfile }: ChatListProps) {
  const getOtherUser = (chat: ChatRoom) => {
    return chat.participants.find(p => p.id !== currentUser.id)
  }

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>Чаты</h2>
        <div className="current-user" onClick={onOpenProfile}>
          <div className="user-avatar-small">
            {currentUser.username.charAt(0).toUpperCase()}
          </div>
          <span>{currentUser.username}</span>
        </div>
      </div>

      <div className="chats-search">
        <input type="text" placeholder="Поиск чатов..." className="search-input" />
      </div>

      <div className="chats-container">
        {chats.length === 0 ? (
          <div className="empty-chats">
            <div className="empty-chats-icon"></div>
            <p>Нет чатов</p>
            <span>Ваши чаты появятся здесь</span>
          </div>
        ) : (
          chats.map((chat) => {
            const otherUser = getOtherUser(chat)
            const displayName = chat.name || (otherUser ? otherUser.username : 'Unknown')
            return (
              <div
                key={chat.id}
                className={`chat-item ${selectedChatId === chat.id ? 'active' : ''}`}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="chat-item-avatar">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="chat-item-info">
                  <div className="chat-item-name">
                    {displayName}
                    {otherUser?.status === 'online' && <span className="online-dot"></span>}
                  </div>
                  <div className="chat-item-last-message">
                    {chat.lastMessage || 'Нет сообщений'}
                  </div>
                </div>
                {chat.unreadCount > 0 && (
                  <div className="unread-badge">{chat.unreadCount}</div>
                )}
                {chat.lastMessageTime && (
                  <div className="chat-item-time">{formatTime(chat.lastMessageTime)}</div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
