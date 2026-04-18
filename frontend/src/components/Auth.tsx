import { useState } from 'react'
import { api, setAuthToken } from '../services/api'

interface AuthProps {
  onLogin: (user: any, token: string) => void
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const data = await api.login(username, password)
        setAuthToken(data.token)
        onLogin(data.user, data.token)
      } else {
        const data = await api.register(username, email, password)
        setAuthToken(data.token)
        onLogin(data.user, data.token)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Messenger</h1>
          <p>{isLogin ? 'Добро пожаловать' : 'Создать аккаунт'}</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>Имя пользователя</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите имя"
              required
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
                required
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
              required
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>
        <div className="auth-footer">
          <button className="auth-switch" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </div>
    </div>
  )
}
