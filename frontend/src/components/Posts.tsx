import { useState, useEffect } from 'react'
import { postsApi } from '../services/api'

interface Post {
  id: number
  title: string
  content: string
  author_id: number
  author_name: string
  created_at: string
}

interface Comment {
  id: number
  text: string
  user_id: number
  username: string
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
  const [showComments, setShowComments] = useState<number | null>(null)
  const [comments, setComments] = useState<Record<number, Comment[]>>({})
  const [commentText, setCommentText] = useState('')

  useEffect(() => { loadPosts() }, [])

  const loadPosts = async () => {
    setLoading(true)
    try {
      const data = await postsApi.getAll()
      setPosts(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const loadComments = async (postId: number) => {
    try {
      const data = await postsApi.getComments(postId)
      setComments(prev => ({ ...prev, [postId]: data }))
    } catch (err) { console.error(err) }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setLoading(true)
    try {
      await postsApi.create(title, content)
      setTitle('')
      setContent('')
      await loadPosts()
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить пост?')) return
    try {
      await postsApi.delete(id)
      await loadPosts()
    } catch (err) { console.error(err) }
  }

  const handleAddComment = async (postId: number) => {
    if (!commentText.trim()) return
    try {
      await postsApi.addComment(postId, commentText)
      setCommentText('')
      await loadComments(postId)
    } catch (err) { console.error(err) }
  }

  const toggleComments = async (postId: number) => {
    if (showComments === postId) {
      setShowComments(null)
    } else {
      setShowComments(postId)
      if (!comments[postId]) await loadComments(postId)
    }
  }

  return (
    <div className="posts-layout">
      {/* Левая панель - создание поста */}
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
          <button type="submit" disabled={loading}>
            {loading ? 'Публикация...' : 'Опубликовать'}
          </button>
        </form>
      </div>

      {/* Центральная лента */}
      <div className="posts-feed">
        <h2>Лента новостей</h2>
        {loading && posts.length === 0 ? (
          <div className="posts-loading">Загрузка...</div>
        ) : posts.length === 0 ? (
          <div className="posts-empty">
            <p>Нет постов</p>
            <span>Будьте первым!</span>
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
                  <button className="post-delete" onClick={() => handleDelete(post.id)}>Удалить</button>
                )}
              </div>
              <h3 className="post-title">{post.title}</h3>
              <p className="post-content">{post.content}</p>
              
              <button className="comments-toggle" onClick={() => toggleComments(post.id)}>
                💬 Комментарии ({comments[post.id]?.length || 0})
              </button>

              {showComments === post.id && (
                <div className="post-comments">
                  <div className="comments-list">
                    {comments[post.id]?.map((comment) => (
                      <div key={comment.id} className="comment-item">
                        <div className="comment-avatar">{comment.username.charAt(0).toUpperCase()}</div>
                        <div className="comment-content">
                          <div className="comment-name">{comment.username}</div>
                          <div className="comment-text">{comment.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="comment-input">
                    <input 
                      type="text" 
                      placeholder="Написать комментарий..." 
                      value={commentText} 
                      onChange={(e) => setCommentText(e.target.value)} 
                    />
                    <button onClick={() => handleAddComment(post.id)}>Отправить</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
