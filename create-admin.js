/* eslint-env node */
import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import 'dotenv/config'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
})

async function createAdmin() {
  const email = 'admin@spicekitchen.com'
  const password = 'AdminPassword123!'

  console.log('Creating/Updating admin user in Turso...')

  try {
    const existing = await client.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email]
    })

    if (existing.rows.length > 0) {
      console.log('Admin user exists. Updating role to admin...')
      await client.execute({
        sql: 'UPDATE users SET role = ? WHERE email = ?',
        args: ['admin', email]
      })
      console.log('Successfully set existing user as admin!')
      console.log(`Email: ${email}\nPassword: ${password}`)
      return
    }

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)
    const id = crypto.randomUUID()

    await client.execute({
      sql: `INSERT INTO users (id, email, password_hash, first_name, last_name, role)
            VALUES (?, ?, ?, ?, ?, 'admin')`,
      args: [id, email, hash, 'Hotel', 'Admin']
    })

    console.log('User created:', id)
    console.log('Successfully set user as admin!')
    console.log(`Email: ${email}\nPassword: ${password}`)
  } catch (error) {
    console.error('Error creating user:', error.message)
  }
}

createAdmin()
