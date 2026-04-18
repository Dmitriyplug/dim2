import type { ChatRoom, User } from '../types'

interface ChatListProps {
  chats: ChatRoom[]
  currentUser: User
  selectedChatId: number | null
  onSelectChat: (chatId: number) => void
  onOpenSettings: () => void
}

export default function ChatList({ chats, currentUser, selectedChatId, onSelectChat, onOpenSettings }: ChatListProps) {
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
      <div className="current-user" onClick={onOpenSettings}>
        <div className="user-avatar-small">
          {currentUser.username.charAt(0).toUpperCase()}
        </div>
        <span>{currentUser.username}</span>
      </div>

      <div className="chats-container">
        {chats.length === 0 ? (
          <div className="empty-chats">
            <p>Нет чатов</p>
            <span>Добавьте друзей чтобы начать общение</span>
          </div>
        ) : (
          chats.map((chat) => {
            const displayName = chat.name || 'Чат'
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
                  <div className="chat-item-name">{displayName}</div>
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
