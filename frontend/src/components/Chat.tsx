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
    }
  }, [chatUser])

  useEffect(() => {
    const socket = getSocket()
    if (socket) {
      const handleNewMessage = (msg: Message) => {
        if (msg.sender_id === chatUser?.id) {
          setMessages(prev => [...prev, { ...msg, isOwn: false }])
          markAsRead(msg.sender_id)
          scrollToBottom()
        }
      }
      const handleMessageSent = (msg: Message) => {
        // Обновляем временное сообщение реальным ID
        if (msg.tempId) {
          setMessages(prev => prev.map(m => 
            m.tempId === msg.tempId ? { ...msg, isOwn: true } : m
          ))
        }
      }
      const handleMessagesRead = (data: { userId: number }) => {
        if (data.userId === chatUser?.id) {
          setMessages(prev => prev.map(m => 
            m.sender_id === chatUser.id && !m.isOwn ? { ...m, is_read: 1 } : m
          ))
        }
      }
      const handleUserStatus = ({ userId, status }: { userId: number; status: string }) => {
        if (chatUser && userId === chatUser.id) setIsOnline(status === 'online')
      }
      
      socket.on('new_message', handleNewMessage)
      socket.on('message_sent', handleMessageSent)
      socket.on('messages_read', handleMessagesRead)
      socket.on('user_status', handleUserStatus)
      
      return () => {
        socket.off('new_message', handleNewMessage)
        socket.off('message_sent', handleMessageSent)
        socket.off('messages_read', handleMessagesRead)
        socket.off('user_status', handleUserStatus)
      }
    }
  }, [chatUser])

  const loadMessages = async () => {
    if (!chatUser) return
    try {
      const data = await api.getMessages(chatUser.id)
      setMessages(data)
      setTimeout(() => scrollToBottom(), 100)
    } catch (err) { console.error(err) }
  }

  const markAsRead = async (senderId: number) => {
    try {
      await api.markMessagesRead(senderId)
      const socket = getSocket()
      socket?.emit('mark_read', { senderId })
    } catch (err) { console.error(err) }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = () => {
    if (!inputText.trim() || !chatUser) return
    
    // Создаём временное сообщение с локальным ID
    const tempId = Date.now()
    const tempMessage: Message = {
      id: tempId,
      tempId: tempId,
      sender_id: currentUser.id,
      sender_name: currentUser.username,
      receiver_id: chatUser.id,
      text: inputText.trim(),
      created_at: Date.now(),
      is_read: 0,
      isOwn: true
    }
    
    // Добавляем сообщение сразу в UI
    setMessages(prev => [...prev, tempMessage])
    scrollToBottom()
    
    // Отправляем через сокет
    const socket = getSocket()
    if (socket) {
      socket.emit('send_message', { 
        receiverId: chatUser.id, 
        text: inputText.trim(),
        tempId: tempId
      })
    }
    
    setInputText('')
  }

  if (!chatUser) {
    return (
      <div className="chat-area">
        <div className="chat-empty">
          <div className="empty-chat-card">
            <h3>Чат не выбран</h3>
            <p>Найдите пользователя и начните общение</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-area">
      <div className="chat-area-header">
        <div className="chat-area-avatar">{chatUser.username.charAt(0).toUpperCase()}</div>
        <div className="chat-area-details">
          <h3>{chatUser.username}</h3>
          <span className={`user-status ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? 'В сети' : 'Не в сети'}
          </span>
        </div>
      </div>
      <div className="chat-messages-area">
        {messages.map((msg) => (
          <div key={msg.id || msg.tempId} className={`message ${msg.isOwn ? 'message-own' : 'message-other'}`}>
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
        <input
          type="text"
          placeholder="Сообщение"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="message-input"
        />
        <button onClick={handleSend} className="send-button">Отправить</button>
      </div>
    </div>
  )
}
