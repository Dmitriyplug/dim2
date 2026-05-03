import type { User } from '../types'

interface ChatListProps {
  chats: User[]
  currentUser: User
  selectedChat: User | null
  onSelectChat: (user: User) => void
}

export default function ChatList({ chats, selectedChat, onSelectChat }: ChatListProps) {
  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>Чаты</h2>
      </div>
      <div className="chats-container">
        {chats.length === 0 ? (
          <div className="empty-chats">
            <p>Нет чатов</p>
            <span>Найдите пользователя и начните общение</span>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
              onClick={() => onSelectChat(chat)}
            >
              <div className="chat-item-avatar">{chat.username.charAt(0).toUpperCase()}</div>
              <div className="chat-item-info">
                <div className="chat-item-name">
                  {chat.username}
                  {chat.status === 'online' && <span className="online-dot"></span>}
                </div>
                <div className="chat-item-last-message">{chat.last_message || 'Нет сообщений'}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
