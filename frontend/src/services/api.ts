const API_URL = 'http://localhost:3002/api'

let authToken: string | null = localStorage.getItem('token')

export const setAuthToken = (token: string | null) => {
  authToken = token
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')
}

const request = async (endpoint: string, options: RequestInit = {}) => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error')
  return data
}

export const api = {
  // Auth
  register: (username: string, email: string, password: string) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) }),
  login: (username: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  searchUsers: (q: string) => request(`/auth/users/search?q=${encodeURIComponent(q)}`),
  getUser: (userId: number) => request(`/auth/users/${userId}`),
  updateBio: (bio: string) => request('/auth/users/bio', { method: 'PUT', body: JSON.stringify({ bio }) }),
  
  // Посты
  getPosts: () => request('/posts'),
  createPost: (title: string, content: string) => request('/posts', { method: 'POST', body: JSON.stringify({ title, content }) }),
  updatePost: (id: number, title: string, content: string) => request(`/posts/${id}`, { method: 'PUT', body: JSON.stringify({ title, content }) }),
  deletePost: (id: number) => request(`/posts/${id}`, { method: 'DELETE' }),
  
  // Чаты
  getChats: () => request('/chats'),
  getMessages: (userId: number) => request(`/chats/${userId}/messages`),
  markMessagesRead: (senderId: number) => request('/messages/read', { method: 'POST', body: JSON.stringify({ senderId }) }),
}
