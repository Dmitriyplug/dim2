import { pool } from '../database'

export const postService = {
  async create(title: string, content: string, authorId: number, authorName: string) {
    if (!title || !content) {
      throw new Error('Заполните заголовок и содержание')
    }
    
    const result = await pool.query(
      'INSERT INTO posts (title, content, author_id, author_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, content, authorId, authorName]
    )
    return result.rows[0]
  },

  async getAll() {
    const posts = await pool.query('SELECT * FROM posts ORDER BY created_at DESC')
    return posts.rows
  },

  async getById(id: number) {
    const post = await pool.query('SELECT * FROM posts WHERE id = $1', [id])
    if (post.rows.length === 0) throw new Error('Пост не найден')
    return post.rows[0]
  },

  async update(id: number, title: string, content: string, authorId: number) {
    const post = await pool.query('SELECT * FROM posts WHERE id = $1', [id])
    if (post.rows.length === 0) throw new Error('Пост не найден')
    if (post.rows[0].author_id !== authorId) throw new Error('Нельзя редактировать чужой пост')
    
    const result = await pool.query(
      'UPDATE posts SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [title, content, id]
    )
    return result.rows[0]
  },

  async delete(id: number, authorId: number) {
    const post = await pool.query('SELECT * FROM posts WHERE id = $1', [id])
    if (post.rows.length === 0) throw new Error('Пост не найден')
    if (post.rows[0].author_id !== authorId) throw new Error('Нельзя удалить чужой пост')
    
    await pool.query('DELETE FROM posts WHERE id = $1', [id])
    return { success: true }
  }
}
