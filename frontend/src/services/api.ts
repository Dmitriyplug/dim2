const API_URL = 'http://localhost:3002/api'

let authToken: string | null = localStorage.getItem('token')

export const setAuthToken = (token: string | null) => {
  authToken = token
  if (token) {
    localStorage.setItem('token', token)
  } else {
    localStorage.removeItem('token')
  }
}

const request = async (endpoint: string, options: RequestInit = {}) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    setAuthToken(null)
    window.location.href = '/'
    throw new Error('Unauthorized')
  }

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong')
  }

  return data
}

export const api = {
  register: (username: string, email: string, password: string) =>
    request('/register', { method: 'POST', body: JSON.stringify({ username, email, password }) }),

  login: (username: string, password: string) =>
    request('/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  searchUsers: (query: string) =>
    request(`/users/search?q=${encodeURIComponent(query)}`),

  getFriends: () =>
    request('/friends'),

  addFriend: (username: string) =>
    request('/friends/add', { method: 'POST', body: JSON.stringify({ username }) }),

  removeFriend: (friendId: number) =>
    request(`/friends/remove/${friendId}`, { method: 'DELETE' }),

  getChats: () =>
    request('/chats'),

  getMessages: (chatId: number) =>
    request(`/chats/${chatId}/messages`),

  startChat: (friendId: number) =>
    request('/chats/start', { method: 'POST', body: JSON.stringify({ friendId }) }),

  updateBio: (bio: string) =>
    request('/users/bio', { method: 'PUT', body: JSON.stringify({ bio }) }),
}
