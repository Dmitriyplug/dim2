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
      const data = isLogin 
        ? await api.login(username, password) 
        : await api.register(username, email, password)
      setAuthToken(data.token)
      onLogin(data.user, data.token)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Мессенджер</h1>
        <p>{isLogin ? 'Войдите в аккаунт' : 'Создайте аккаунт'}</p>
        
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Имя пользователя" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
          
          {!isLogin && (
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          )}
          
          <input 
            type="password" 
            placeholder="Пароль" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          
          {error && <div className="error">{error}</div>}
          
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>
        
        <button className="switch" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
          {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    </div>
  )
}
