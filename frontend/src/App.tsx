import './App.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useChatSocket } from './chat/useChatSocket'

function App() {
  const backendUrl = useMemo(
    () => import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3002',
    [],
  )

  const [room, setRoom] = useState('public')
  const [nickname, setNickname] = useState('user')
  const [text, setText] = useState('')
  const [uiError, setUiError] = useState<string | null>(null)

  const { status, error, messages, connect, disconnect, sendMessage } =
    useChatSocket(backendUrl)

  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  useEffect(() => {
    setUiError(null)
  }, [room, nickname])

  const connected = status === 'connected'
  const connecting = status === 'connecting'

  const handleConnect = () => {
    const normalizedRoom = room.trim()
    const normalizedNickname = nickname.trim()

    if (!normalizedRoom) {
      setUiError('Укажите имя комнаты')
      return
    }
    if (!normalizedNickname) {
      setUiError('Укажите никнейм')
      return
    }

    setUiError(null)
    connect({ room: normalizedRoom, nickname: normalizedNickname })
  }

  const handleSend = () => {
    const payload = text.trim()
    if (!payload) return

    setUiError(null)
    sendMessage(payload)
    setText('')
  }

  return (
    <div className="chatPage">
      <div className="chatContainer">
        <div className="chatHeader">
          <div className="chatField">
            <label className="chatLabel" htmlFor="room">
              Комната
            </label>
            <input
              id="room"
              className="chatInput"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              disabled={connected || connecting}
              placeholder="public"
            />
          </div>

          <div className="chatField">
            <label className="chatLabel" htmlFor="nickname">
              Никнейм
            </label>
            <input
              id="nickname"
              className="chatInput"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={connected || connecting}
              placeholder="user"
            />
          </div>

          <div className="chatActions">
            {connected || connecting ? (
              <button className="chatButton" onClick={disconnect}>
                Отключиться
              </button>
            ) : (
              <button
                className="chatButton"
                onClick={handleConnect}
                disabled={!room.trim() || !nickname.trim()}
              >
                Подключиться
              </button>
            )}
          </div>
        </div>

        <div className="chatMeta">
          <span>
            Статус: <b>{status}</b>
          </span>
          {uiError ?? error ? (
            <span className="chatError">{uiError ?? error}</span>
          ) : null}
        </div>

        <div className="chatPanel">
          <div className="chatMessages" aria-live="polite">
            {messages.length === 0 ? (
              <div className="chatHint">
                Сообщений пока нет. Подключитесь и отправьте текст.
              </div>
            ) : null}

            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.kind === 'system'
                    ? 'chatMessage chatSystem'
                    : 'chatMessage chatUser'
                }
              >
                <div className="chatAuthor">
                  {m.kind === 'system' ? 'Система' : m.author}
                </div>
                <div className="chatText">{m.text}</div>
              </div>
            ))}

            <div ref={endRef} />
          </div>

          <div className="chatComposer">
            <input
              className="chatInput chatComposerInput"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                connected ? 'Введите сообщение...' : 'Подключитесь, чтобы писать'
              }
              disabled={!connected}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend()
              }}
            />
            <button
              className="chatButton"
              disabled={!connected || !text.trim()}
              onClick={handleSend}
            >
              Отправить
            </button>
          </div>
        </div>

        <div className="chatFooterHint">
          Пример для масштабирования: комнаты, история и отдельный слой
          сервиса на сервере.
        </div>
      </div>
    </div>
  )
}

export default App
