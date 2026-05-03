import { useState, useEffect } from 'react'
import { api } from '../services/api'

interface Post {
  id: number
  title: string
  content: string
  author_id: number
  author_name: string
  created_at: string
}

interface PostsProps {
  currentUserId: number
}

export default function Posts({ currentUserId }: PostsProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    setLoading(true)
    try {
      const data = await api.getPosts()
      setPosts(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setError('Заполните заголовок и содержание')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.createPost(title, content)
      setTitle('')
      setContent('')
      await loadPosts()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить пост?')) return
    try {
      await api.deletePost(id)
      await loadPosts()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="posts-container">
      <div className="create-post-panel">
        <h3>Создать пост</h3>
        <form onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Заголовок"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Что у вас нового?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            required
          />
          {error && <div className="post-error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Публикация...' : 'Опубликовать'}
          </button>
        </form>
      </div>

      <div className="posts-feed">
        <h2>Лента новостей</h2>
        {loading && posts.length === 0 ? (
          <div className="posts-loading">Загрузка...</div>
        ) : posts.length === 0 ? (
          <div className="posts-empty">
            <p>Нет постов</p>
            <span>Будьте первым, кто опубликует пост!</span>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div className="post-author">
                  <div className="post-avatar">{post.author_name.charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="post-name">{post.author_name}</div>
                    <div className="post-date">{new Date(post.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                {currentUserId === post.author_id && (
                  <button className="post-delete" onClick={() => handleDelete(post.id)}>
                    Удалить
                  </button>
                )}
              </div>
              <h3 className="post-title">{post.title}</h3>
              <p className="post-content">{post.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
