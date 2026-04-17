import { useState } from 'react'

interface AuthProps {
  onLogin: (username: string, password: string) => void
  onRegister: (username: string, email: string, password: string) => void
}

export function Auth({ onLogin, onRegister }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Заполните все поля')
      return
    }

    if (isLogin) {
      onLogin(username, password)
    } else {
      if (!email.trim()) {
        setError('Введите email')
        return
      }
      onRegister(username, email, password)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Мессенджер</h1>
          <p>{isLogin ? 'Добро пожаловать' : 'Создать аккаунт'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>Имя пользователя</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите имя пользователя"
            />
          </div>

          {!isLogin && (
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Введите email"
              />
            </div>
          )}

          <div className="input-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-button">
            {isLogin ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-footer">
          <button
            className="auth-switch"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              setPassword('')
            }}
          >
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </div>
    </div>
  )
}
