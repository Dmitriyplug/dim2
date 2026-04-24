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
  register: (username: string, email: string, password: string) =>
    request('/register', { method: 'POST', body: JSON.stringify({ username, email, password }) }),
  login: (username: string, password: string) =>
    request('/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getUser: (userId: number) => request(`/users/${userId}`),
  searchUsers: (q: string) => request(`/users/search?q=${encodeURIComponent(q)}`),
  sendFriendRequest: (toId: number) => request('/friends/request', { method: 'POST', body: JSON.stringify({ toId }) }),
  getFriendRequests: () => request('/friends/requests'),
  acceptFriendRequest: (fromId: number) => request('/friends/accept', { method: 'POST', body: JSON.stringify({ fromId }) }),
  rejectFriendRequest: (fromId: number) => request('/friends/reject', { method: 'POST', body: JSON.stringify({ fromId }) }),
  getFriends: () => request('/friends'),
  removeFriend: (friendId: number) => request(`/friends/remove/${friendId}`, { method: 'DELETE' }),
  getChats: () => request('/chats'),
  getMessages: (userId: number) => request(`/chats/${userId}/messages`),
  markMessagesRead: (senderId: number) => request('/messages/read', { method: 'POST', body: JSON.stringify({ senderId }) }),
}

export const postsApi = {
  getAll: () => request('/posts'),
  create: (title: string, content: string) => request('/posts', { method: 'POST', body: JSON.stringify({ title, content }) }),
  delete: (id: number) => request(`/posts/${id}`, { method: 'DELETE' }),
  getComments: (postId: number) => request(`/posts/${postId}/comments`),
  addComment: (postId: number, text: string) => request(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),
}
