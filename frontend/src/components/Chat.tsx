import { useState, useEffect, useRef } from 'react'
import type { User, Message } from '../types'
import { api } from '../services/api'
import { getSocket } from '../services/socket'

interface ChatProps {
  currentUser: User
  chatId: number | null
  chatName: string
  onSendMessage: (chatId: number, text: string) => void
}

export default function Chat({ currentUser, chatId, chatName, onSendMessage }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatId) {
      loadMessages()
    }
  }, [chatId])

  useEffect(() => {
    const socket = getSocket()
    if (socket) {
      socket.on('new_message', (message: Message) => {
        if (message.chatId === chatId) {
          setMessages(prev => [...prev, message])
        }
      })
    }
    return () => {
      const socket = getSocket()
      if (socket) {
        socket.off('new_message')
      }
    }
  }, [chatId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    if (!chatId) return
    try {
      const data = await api.getMessages(chatId)
      setMessages(data)
    } catch (err) {
      console.error('Failed to load messages', err)
    }
  }

  const handleSend = async () => {
    if (!inputText.trim() || !chatId) return

    const socket = getSocket()
    if (socket) {
      socket.emit('send_message', { chatId, text: inputText.trim() })
      onSendMessage(chatId, inputText.trim())
      setInputText('')
    }
  }

  if (!chatId) {
    return (
      <div className="chat-empty">
        <div className="empty-chat-card">
          <h3>Чат не выбран</h3>
          <p>Выберите чат из списка чтобы начать общение</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-area">
      <div className="chat-area-header">
        <div className="chat-area-info">
          <div className="chat-area-avatar">
            {chatName.charAt(0).toUpperCase()}
          </div>
          <div className="chat-area-details">
            <h3>{chatName}</h3>
          </div>
        </div>
      </div>

      <div className="chat-messages-area">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.isOwn ? 'message-own' : 'message-other'}`}>
            {!msg.isOwn && <div className="message-sender">{msg.senderName}</div>}
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
          placeholder="Сообщение"
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
