import { Pool } from 'pg'

const pool = new Pool({
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'messenger',
})

export async function initDatabase() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        bio TEXT DEFAULT '',
        status VARCHAR(20) DEFAULT 'offline',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS friends (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, friend_id)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_participants (
        chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (chat_id, user_id)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
  } finally {
    client.release()
  }
}

export { pool }
