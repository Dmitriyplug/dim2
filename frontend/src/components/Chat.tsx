import { useState, useEffect, useRef } from 'react'
import type { User, ChatRoom, Message } from '../types'

interface ChatProps {
  currentUser: User
  selectedChat: ChatRoom | null
  onSendMessage: (chatId: string, text: string) => void
  onLogout: () => void
}

export function Chat({ currentUser, selectedChat, onSendMessage, onLogout }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedChat) {
      const otherUser = selectedChat.participants.find(p => p.id !== currentUser.id)
      const mockMessages: Message[] = [
        {
          id: '1',
          chatId: selectedChat.id,
          senderId: otherUser?.id || 'unknown',
          senderName: otherUser?.username || 'Пользователь',
          text: 'Привет! Как дела?',
          timestamp: Date.now() - 3600000,
          isOwn: false
        },
        {
          id: '2',
          chatId: selectedChat.id,
          senderId: currentUser.id,
          senderName: currentUser.username,
          text: 'Отлично! А у тебя?',
          timestamp: Date.now() - 1800000,
          isOwn: true
        }
      ]
      setMessages(mockMessages)
    } else {
      setMessages([])
    }
  }, [selectedChat, currentUser.id, currentUser.username])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!inputText.trim() || !selectedChat) return

    const newMessage: Message = {
      id: Date.now().toString(),
      chatId: selectedChat.id,
      senderId: currentUser.id,
      senderName: currentUser.username,
      text: inputText.trim(),
      timestamp: Date.now(),
      isOwn: true
    }

    setMessages([...messages, newMessage])
    onSendMessage(selectedChat.id, inputText.trim())
    setInputText('')
  }

  if (!selectedChat) {
    return (
      <div className="chat-empty">
        <div className="empty-state">
          <h3>Чат не выбран</h3>
          <p>Выберите чат из списка чтобы начать общение</p>
        </div>
      </div>
    )
  }

  const otherUser = selectedChat.participants.find(p => p.id !== currentUser.id)
  const displayName = selectedChat.name || (otherUser ? otherUser.username : 'Unknown')

  return (
    <div className="chat-area">
      <div className="chat-area-header">
        <div className="chat-area-info">
          <div className="chat-area-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="chat-area-details">
            <h3>{displayName}</h3>
            <span className={`user-status ${otherUser?.status === 'online' ? 'online' : 'offline'}`}>
              {otherUser?.status === 'online' ? 'В сети' : 'Не в сети'}
            </span>
          </div>
        </div>
        <button onClick={onLogout} className="logout-button">
          Выйти
        </button>
      </div>

      <div className="chat-messages-area">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.isOwn ? 'message-own' : 'message-other'}`}
          >
            {!msg.isOwn && (
              <div className="message-sender">{msg.senderName}</div>
            )}
            <div className="message-bubble">
              <div className="message-text">{msg.text}</div>
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <input
          type="text"
          placeholder="Введите сообщение..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="message-input"
        />
        <button onClick={handleSend} className="send-button">
          Отправить
        </button>
      </div>
    </div>
  )
}
