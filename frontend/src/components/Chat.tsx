import { useState, useEffect, useRef } from 'react'
import type { User, Message } from '../types'
import { api } from '../services/api'
import { getSocket } from '../services/socket'

interface ChatProps {
  currentUser: User
  chatUser: User | null
  onSendMessage: (receiverId: number, text: string) => void
}

export default function Chat({ currentUser, chatUser, onSendMessage }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isOnline, setIsOnline] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatUser) {
      loadMessages()
      setIsOnline(chatUser.status === 'online')
      markAsRead()
    }
  }, [chatUser])

  useEffect(() => {
    const socket = getSocket()
    if (socket) {
      socket.on('new_message', (msg: Message) => {
        if (msg.sender_id === chatUser?.id) {
          setMessages(prev => [...prev, { ...msg, isOwn: false }])
          markAsRead()
        }
      })
      socket.on('message_sent', (msg: Message) => {
        if (msg.sender_id === currentUser.id && msg.receiver_id === chatUser?.id) {
          setMessages(prev => [...prev, { ...msg, isOwn: true }])
        }
      })
      socket.on('messages_read', (data) => {
        if (data.userId === chatUser?.id) {
          setMessages(prev => prev.map(m => 
            m.sender_id === chatUser.id && !m.isOwn ? { ...m, is_read: 1 } : m
          ))
        }
      })
      socket.on('user_status', ({ userId, status }) => {
        if (chatUser && userId === chatUser.id) setIsOnline(status === 'online')
      })
    }
    return () => {
      const socket = getSocket()
      socket?.off('new_message')
      socket?.off('message_sent')
      socket?.off('messages_read')
      socket?.off('user_status')
    }
  }, [chatUser, currentUser.id])

  const loadMessages = async () => {
    if (!chatUser) return
    try {
      const data = await api.getMessages(chatUser.id)
      setMessages(data)
    } catch (err) { console.error(err) }
  }

  const markAsRead = async () => {
    if (!chatUser) return
    try {
      await api.markMessagesRead(chatUser.id)
      setMessages(prev => prev.map(m => 
        m.sender_id === chatUser.id && !m.isOwn ? { ...m, is_read: 1 } : m
      ))
    } catch (err) { console.error(err) }
  }

  const handleSend = () => {
    if (!inputText.trim() || !chatUser) return
    onSendMessage(chatUser.id, inputText.trim())
    setInputText('')
  }

  if (!chatUser) {
    return (
      <div className="chat-area">
        <div className="chat-empty">
          <div className="empty-chat-card">
            <h3>Чат не выбран</h3>
            <p>Выберите чат из списка</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-area">
      <div className="chat-area-header">
        <div className="chat-area-info">
          <div className="chat-area-avatar">{chatUser.username.charAt(0).toUpperCase()}</div>
          <div className="chat-area-details">
            <h3>{chatUser.username}</h3>
            <span className={`user-status ${isOnline ? 'online' : 'offline'}`}>{isOnline ? 'В сети' : 'Не в сети'}</span>
          </div>
        </div>
      </div>
      <div className="chat-messages-area">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.isOwn ? 'message-own' : 'message-other'}`}>
            {!msg.isOwn && <div className="message-sender">{msg.sender_name}</div>}
            <div className="message-bubble">
              <div className="message-text">{msg.text}</div>
              <div className="message-time">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {!msg.isOwn && (
                  <span className={`message-read-status ${msg.is_read ? 'read' : 'unread'}`}>
                    {msg.is_read ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <input type="text" placeholder="Сообщение" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} className="message-input" />
        <button onClick={handleSend} className="send-button">Отправить</button>
      </div>
    </div>
  )
}
